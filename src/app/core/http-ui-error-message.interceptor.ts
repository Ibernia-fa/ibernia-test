import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { stripTrailingPeriodForShortUiMessage } from 'src/app/shared/utils/ui-message-format';

function normalizeErrorBody(body: unknown): unknown {
  if (body === null || body === undefined) {
    return body;
  }
  if (typeof body === 'string') {
    return stripTrailingPeriodForShortUiMessage(body);
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }
  const o = body as Record<string, unknown>;
  const copy = { ...o };
  for (const key of ['message', 'title', 'detail', 'error_description']) {
    const v = copy[key];
    if (typeof v === 'string') {
      copy[key] = stripTrailingPeriodForShortUiMessage(v);
    }
  }
  if (typeof copy['errors'] === 'object' && copy['errors'] !== null) {
    const errs = copy['errors'] as Record<string, unknown>;
    const next: Record<string, unknown> = { ...errs };
    for (const [k, v] of Object.entries(next)) {
      if (typeof v === 'string') {
        next[k] = stripTrailingPeriodForShortUiMessage(v);
      } else if (Array.isArray(v)) {
        next[k] = v.map((item) =>
          typeof item === 'string'
            ? stripTrailingPeriodForShortUiMessage(item)
            : item,
        );
      }
    }
    copy['errors'] = next;
  }
  return copy;
}

/**
 * Normalizes short API error strings so UI (toastr, inline) matches i18n rules.
 */
export const httpUiErrorMessageInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }
      const normalized = normalizeErrorBody(err.error);
      if (normalized === err.error) {
        return throwError(() => err);
      }
      return throwError(
        () =>
          new HttpErrorResponse({
            error: normalized,
            headers: err.headers,
            status: err.status,
            statusText: err.statusText,
            url: err.url ?? undefined,
          }),
      );
    }),
  );
};
