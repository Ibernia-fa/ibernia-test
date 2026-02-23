import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.authority,
  redirectUri: window.location.origin + '/signin-oidc',
  clientId: environment.authClientId,
  responseType: 'code',
  scope: 'openid email profile roles ibernia_api',
  showDebugInformation: true,
  requireHttps: false,
};