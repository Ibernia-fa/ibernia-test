import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/services/auth.service';
import { inject } from '@angular/core';

export function httpRequestInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const auth = inject(AuthService);
  const apiUrl = environment.apiUrl + req.urlWithParams;

  return from(auth.getAccessToken()).pipe(
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
