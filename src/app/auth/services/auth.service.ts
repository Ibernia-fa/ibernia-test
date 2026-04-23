import { Injectable } from '@angular/core';
import { UserManager, User, UserManagerSettings } from 'oidc-client';
// import { Constants } from '../constants';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AUTH_RETURN_URL_KEY } from '../auth.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userManager: UserManager;
  private _user: User | any;
  private _loginChangedSubject = new Subject<boolean>();
  private _loginRedirectInProgress = false;

  public loginChanged = this._loginChangedSubject.asObservable();

  /** Canonical portal origin for redirect URIs (avoids wrong host behind proxies / PWA). */
  private portalOrigin(): string {
    const configured = environment.appUrl?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  private get idpSettings(): UserManagerSettings {
    const origin = this.portalOrigin();
    const redirectUri = origin + '/signin-oidc';
    const postLogoutUri = origin + '/signout-callback-oidc';
    return {
      authority: environment.authority,
      client_id: environment.authClientId,
      redirect_uri: origin + '/signin-oidc',
      scope: 'openid email profile roles ibernia_api',
      response_type: "code",
      post_logout_redirect_uri: postLogoutUri,
      automaticSilentRenew: true,
      silent_redirect_uri: `${origin}/silent-renew-oidc`,
      clockSkew: 600,
    };
  }

  constructor() {
    this._userManager = new UserManager(this.idpSettings);
    const s = this.idpSettings;
    console.info('[Auth] Init:', {
      authority: s.authority,
      redirect_uri: s.redirect_uri,
      post_logout_redirect_uri: s.post_logout_redirect_uri,
      window_origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
      window_hostname: typeof window !== 'undefined' ? window.location.hostname : 'n/a'
    });
  }

  public login = () => {
    return this._userManager.signinRedirect();
  }

  /** Forces the IdP to show the login form even if a session exists (prompt=login). */
  public forceLogin = () => {
    return this._userManager.signinRedirect({ prompt: 'login' });
  }

  /**
   * Clears local OIDC state and starts sign-in. Used when the access token is missing or expired,
   * or when the API returns 401. Coalesces concurrent calls. Preserves return URL like AuthGuard.
   */
  public redirectToLogin = (): void => {
    if (this._loginRedirectInProgress || typeof window === 'undefined') {
      return;
    }
    this._loginRedirectInProgress = true;
    const path =
      window.location.pathname + window.location.search + window.location.hash;
    if (
      path &&
      path !== '/' &&
      !path.startsWith('/signin-oidc') &&
      !path.startsWith('/signout-callback-oidc')
    ) {
      sessionStorage.setItem(AUTH_RETURN_URL_KEY, path);
    }
    void this.clearLocalOidcSession()
      .then(() => this._userManager.signinRedirect())
      .catch((err: unknown) => {
        console.error('[Auth] redirectToLogin failed', err);
        this._loginRedirectInProgress = false;
      });
  };

  /** Silent renew iframe callback (oidc-client automaticSilentRenew). */
  public finishSilentRenew = (): Promise<User | void> => {
    const href =
      typeof window !== 'undefined' ? window.location.href : undefined;
    return this._userManager
      .signinSilentCallback(href)
      .then((user) => {
        if (user && this.checkUser(user)) {
          this._user = user;
          this._loginChangedSubject.next(true);
        }
        return user;
      })
      .catch((err: unknown) => {
        console.warn('[Auth] silent renew callback failed', err);
        return undefined;
      });
  };

  public isAuthenticated = (): Promise<boolean> => {
    return this._userManager.getUser()
      .then((user: User | null) => {
        if (this._user !== user) {
          this._loginChangedSubject.next(this.checkUser(user));
        }

        this._user = user;

        return this.checkUser(user);
      })
  }

  public finishLogin = (): Promise<User> => {
    return this._userManager
      .signinRedirectCallback()
      .then((user: User) => {
        this._loginRedirectInProgress = false;
        this._loginChangedSubject.next(this.checkUser(user));
        return user;
      })
      .catch((err: unknown) => {
        this._loginRedirectInProgress = false;
        throw err;
      });
  };

  public logout = () => {
    const postLogoutRedirectUri = this.portalOrigin() + '/signout-callback-oidc';
    console.info('[Auth] Logout:', {
      post_logout_redirect_uri: postLogoutRedirectUri,
      window_origin: window.location.origin,
      authority: this.idpSettings.authority,
      end_session_url: `${this.idpSettings.authority?.replace(/\/$/, '')}/connect/endsession`
    });
    this._userManager.getUser().then((user: User | null) => {
      const args: { post_logout_redirect_uri: string; id_token_hint?: string } = { post_logout_redirect_uri: postLogoutRedirectUri };
      if (user?.id_token) args.id_token_hint = user.id_token;
      this._userManager.signoutRedirect(args);
    }).catch(() => {
      this._userManager.signoutRedirect({ post_logout_redirect_uri: postLogoutRedirectUri });
    });
  }

  public finishLogout = () => {
    this._user = null;
    this._loginRedirectInProgress = false;
    return this._userManager.signoutRedirectCallback();
  };

  /** Clears OIDC storage when the user did not complete a normal endsession redirect (e.g. logged out on STS only). */
  public clearLocalOidcSession = (): Promise<void> => {
    this._user = null;
    this._loginChangedSubject.next(false);
    return this._userManager.removeUser();
  }

  public getUserProfile = (): User | any => {
    return this._user ? this._user.profile : null;
  }

  /** Check if current user has a given role. Resolves after user is loaded. */
  public hasRole = (role: string): Promise<boolean> => {
    return this._userManager.getUser()
      .then((user: User | null) => {
        if (!user?.profile) return false;
        const p = user.profile as Record<string, unknown>;
        // role can be string, string[], or in various claim keys
        const roles = p['role'] ?? p['roles'] ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? [];
        const arr = Array.isArray(roles) ? roles : (typeof roles === 'string' ? [roles] : []);
        return arr.includes(role);
      })
      .catch(() => false);
  }

  /** Returns the current access token for API requests. Resolves with null if not authenticated. */
  public getAccessToken = (): Promise<string | null> => {
    try {
      const mgr = this._userManager;
      if (!mgr) {
        console.error('[Auth] _userManager is falsy:', mgr);
        return Promise.resolve(null);
      }
      return mgr.getUser()
        .then((user: User | null) => {
          if (user && !user.expired && user.access_token) {
            this._user = user;
            return user.access_token;
          }
          console.warn('[Auth] getAccessToken → null', {
            userExists: !!user,
            expired: user?.expired,
            hasToken: !!user?.access_token,
            expiresAt: user?.expires_at,
            now: Math.floor(Date.now() / 1000),
          });
          return null;
        })
        .catch((err) => {
          console.error('[Auth] getUser() rejected:', err);
          return null;
        });
    } catch (err) {
      console.error('[Auth] getAccessToken sync throw:', err);
      return Promise.resolve(null);
    }
  }

  private checkUser = (user: User | any): boolean => {
    return !!user && !user.expired;
  }
}