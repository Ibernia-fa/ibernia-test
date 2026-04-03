import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { isPublicNoAuthRequest } from './http-public-request';

/**
 * On 401 from the API: redirect to Identity Server login for protected calls or when a Bearer was sent.
 * Skips redirect for anonymous public flows (e.g. wrong report password) where no Bearer is attached.
 */
export const httpAuthErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      const hadBearer = !!req.headers
        .get('Authorization')
        ?.startsWith('Bearer ');
      const publicPath =
        isPublicNoAuthRequest(req.url) || isPublicNoAuthRequest(req.urlWithParams);
      if (publicPath && !hadBearer) {
        return throwError(() => err);
      }
      auth.redirectToLogin();
      return throwError(() => err);
    })
  );
};
