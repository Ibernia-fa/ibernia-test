import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { Observable, from } from 'rxjs';
import { tap } from 'rxjs/operators';

const AUTH_RETURN_URL_KEY = 'auth_return_url';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return from(this.authService.isAuthenticated()).pipe(
      tap(userAuthenticated => {
        if (!userAuthenticated) {
          const returnUrl = state.url;
          if (returnUrl && returnUrl !== '/' && !returnUrl.startsWith('/signin-oidc')) {
            sessionStorage.setItem(AUTH_RETURN_URL_KEY, returnUrl);
          }
          this.authService.login();
        }
      })
    );
  }
}

export { AUTH_RETURN_URL_KEY };
