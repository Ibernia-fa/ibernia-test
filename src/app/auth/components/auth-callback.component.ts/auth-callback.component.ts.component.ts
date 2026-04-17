import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AUTH_RETURN_URL_KEY } from '../../../auth/auth.constants';

const CALLBACK_LOOP_TS_KEY = 'oidc_callback_last_fail';
const LOOP_WINDOW_MS = 3000;

@Component({
  selector: 'app-auth-callback',
  template: '',
})
export class AuthCallbackComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.finishLogin()
      .then(_ => {
        sessionStorage.removeItem(CALLBACK_LOOP_TS_KEY);
        const returnUrl = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
        sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
        const target = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/clients';
        void this.router.navigateByUrl(target, { replaceUrl: true });
      })
      .catch((err: unknown) => {
        console.error('[Auth] signin-oidc callback failed', err);
        const now = Date.now();
        const lastFailure = parseInt(sessionStorage.getItem(CALLBACK_LOOP_TS_KEY) || '0', 10);

        if (lastFailure && now - lastFailure < LOOP_WINDOW_MS) {
          sessionStorage.removeItem(CALLBACK_LOOP_TS_KEY);
          sessionStorage.setItem(AUTH_RETURN_URL_KEY, '/clients');
          void this.authService.clearLocalOidcSession().then(() => {
            this.authService.forceLogin();
          });
          return;
        }

        sessionStorage.setItem(CALLBACK_LOOP_TS_KEY, String(now));
        sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
        void this.authService.clearLocalOidcSession().then(() => {
          void this.router.navigateByUrl('/clients', { replaceUrl: true });
        });
      });
  }
}