import { Injectable } from '@angular/core';
import { UserManager, User, UserManagerSettings } from 'oidc-client';
// import { Constants } from '../constants';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userManager: UserManager;
  private _user: User | any;
  private _loginChangedSubject = new Subject<boolean>();

  public loginChanged = this._loginChangedSubject.asObservable();

  private get idpSettings(): UserManagerSettings {
    return {
      authority: environment.authority,
      client_id: environment.authClientId,
      redirect_uri: window.location.origin + '/signin-oidc',
      scope: 'openid email profile roles',
      response_type: "code",
      post_logout_redirect_uri: window.location.origin + '/signout-callback-oidc'
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
    this._userManager.signoutRedirect();
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