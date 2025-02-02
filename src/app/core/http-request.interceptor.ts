import {
  HttpEvent,
  HttpEventType,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export function httpRequestInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  console.log(req);

  const newReq = req.clone({
    url: environment.apiUrl + req.urlWithParams
  })

  return next(newReq);
}
