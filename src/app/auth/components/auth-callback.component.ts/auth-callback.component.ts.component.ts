import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AUTH_RETURN_URL_KEY } from '../../../auth/auth.constants';

const CALLBACK_FAIL_KEY = 'oidc_callback_failures';
const MAX_CALLBACK_RETRIES = 2;

@Component({
  selector: 'app-auth-callback',
  template: '',
})
export class AuthCallbackComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.finishLogin()
      .then(_ => {
        sessionStorage.removeItem(CALLBACK_FAIL_KEY);
        const returnUrl = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
        sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
        const target = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/clients';
        void this.router.navigateByUrl(target, { replaceUrl: true });
      })
      .catch((err: unknown) => {
        console.error('[Auth] signin-oidc callback failed', err);
        const failures = parseInt(sessionStorage.getItem(CALLBACK_FAIL_KEY) || '0', 10) + 1;
        sessionStorage.setItem(CALLBACK_FAIL_KEY, String(failures));

        if (failures >= MAX_CALLBACK_RETRIES) {
          sessionStorage.removeItem(CALLBACK_FAIL_KEY);
          sessionStorage.setItem(AUTH_RETURN_URL_KEY, '/clients');
          void this.authService.clearLocalOidcSession().then(() => {
            this.authService.forceLogin();
          });
          return;
        }

        sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
        void this.authService.clearLocalOidcSession().then(() => {
          void this.router.navigateByUrl('/clients', { replaceUrl: true });
        });
      });
  }
}