import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';

export const authConfig: AuthConfig = {
  issuer: 'https://identity.ibernia.it',
  redirectUri: window.location.origin + '/signin-oidc',
  clientId: environment.authClientId,
  responseType: 'code',
  scope: 'openid email profile roles',
  showDebugInformation: true,
  requireHttps: false,
};
//console.log(authConfig.clientId);
debugger;