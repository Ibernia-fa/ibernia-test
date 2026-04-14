import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { from, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { inject } from '@angular/core';
import { isPublicNoAuthRequest } from './http-public-request';

export function httpRequestInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const auth = inject(AuthService);
  const apiUrl = environment.apiUrl + req.urlWithParams;

  const token$: Observable<string | null> = isPublicNoAuthRequest(req.url)
    ? of(null)
    : from(auth.getAccessToken());

  return token$.pipe(
    switchMap((token) => {
      if (!token && !isPublicNoAuthRequest(req.url)) {
        auth.redirectToLogin();
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              statusText: 'Unauthorized',
              url: req.url,
            })
        );
      }
      if (!token) {
        console.warn('[Interceptor] No token for', req.url);
      }
      const newReq = token
        ? req.clone({
            url: apiUrl,
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        : req.clone({ url: apiUrl });
      return next(newReq);
    })
  );
}
