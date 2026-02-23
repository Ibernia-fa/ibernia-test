import { Injectable } from '@angular/core';
import { UserManager, User, UserManagerSettings } from 'oidc-client';
// import { Constants } from '../constants';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Authority from current host so dev.ibernia.it always uses dev-identity (avoids prod Identity redirecting to ibernia.it after logout). */
function getAuthorityFromHost(): string {
  if (typeof window === 'undefined' || !window.location?.hostname) return environment.authority;
  const h = window.location.hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h.includes('dev.')) return 'https://dev-identity.ibernia.it';
  return 'https://identity.ibernia.it';
}

/** Redirect base from current origin so logout always returns to the site the user is on. */
function getRedirectBaseFromHost(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return (environment as { appUrl?: string }).appUrl?.trim()?.replace(/\/$/, '') || '';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userManager: UserManager;
  private _user: User | any;
  private _loginChangedSubject = new Subject<boolean>();

  public loginChanged = this._loginChangedSubject.asObservable();

  private get redirectBaseUrl(): string {
    return getRedirectBaseFromHost();
  }

  private get idpSettings(): UserManagerSettings {
    return {
      authority: getAuthorityFromHost(),
      client_id: environment.authClientId,
      redirect_uri: this.redirectBaseUrl + '/signin-oidc',
      scope: 'openid email profile roles ibernia_api',
      response_type: "code",
      post_logout_redirect_uri: this.redirectBaseUrl + '/signout-callback-oidc'
    }
  }

  constructor() {
    this._userManager = new UserManager(this.idpSettings);
  }

  public login = () => {
    return this._userManager.signinRedirect();
  }

  public isAuthenticated = (): Promise<boolean> => {
    return this._userManager.getUser()
      .then(user => {
        if (this._user !== user) {
          this._loginChangedSubject.next(this.checkUser(user));
        }

        this._user = user;

        return this.checkUser(user);
      })
  }

  public finishLogin = (): Promise<User> => {
    return this._userManager.signinRedirectCallback()
      .then(user => {
        this._loginChangedSubject.next(this.checkUser(user));
        return user;
      })
  }

  public logout = () => {
    const postLogoutRedirectUri = this.redirectBaseUrl + '/signout-callback-oidc';
    this._userManager.getUser().then(user => {
      const args: { post_logout_redirect_uri: string; id_token_hint?: string } = { post_logout_redirect_uri: postLogoutRedirectUri };
      if (user?.id_token) args.id_token_hint = user.id_token;
      this._userManager.signoutRedirect(args);
    }).catch(() => {
      this._userManager.signoutRedirect({ post_logout_redirect_uri: postLogoutRedirectUri });
    });
  }

  public finishLogout = () => {
    this._user = null;
    return this._userManager.signoutRedirectCallback();
  }

  public getUserProfile = (): User | any => {
    return this._user ? this._user.profile : null;
  }

  /** Returns the current access token for API requests. Resolves with null if not authenticated. */
  public getAccessToken = (): Promise<string | null> => {
    return this._userManager.getUser()
      .then(user => {
        if (user && !user.expired && user.access_token) {
          this._user = user;
          return user.access_token;
        }
        return null;
      })
      .catch(() => null);
  }

  private checkUser = (user: User | any): boolean => {
    return !!user && !user.expired;
  }
}