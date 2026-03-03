import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { from, Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { inject } from '@angular/core';

/** Public API paths that must not wait for auth (e.g. questionnaire shared with clients). Avoids iOS hang when getAccessToken() never resolves in unauthenticated / in-app browser contexts. */
function isPublicNoAuthRequest(url: string): boolean {
  const u = url || '';
  return (
    u.includes('/Questionnaire/view/') ||
    u.includes('/Questionnaire/submit/') ||
    u.includes('/ClientReport/view/')
  );
}

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
