import { HttpBackend, HttpClient } from '@angular/common/http';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { map, Observable } from 'rxjs';
import { normalizeTranslationTree } from 'src/app/shared/utils/ui-message-format';

/**
 * Wraps ngx-translate file loader so ERROR/TOAST/etc. strings do not end with a lone
 * full stop (see ui-message-format.ts). Keeps copy in JSON files but normalizes at runtime.
 */
export class IberniaTranslateHttpLoader implements TranslateLoader {
  private readonly inner: TranslateHttpLoader;

  constructor(handler: HttpBackend, prefix: string, suffix: string) {
    const http = new HttpClient(handler);
    this.inner = new TranslateHttpLoader(http, prefix, suffix);
  }

  getTranslation(lang: string): Observable<Record<string, unknown>> {
    return this.inner.getTranslation(lang).pipe(
      map((data) => normalizeTranslationTree(data as Record<string, unknown>)),
    );
  }
}

export function iberniaTranslateLoaderFactory(
  handler: HttpBackend,
): IberniaTranslateHttpLoader {
  return new IberniaTranslateHttpLoader(handler, './assets/i18n/', '.json');
}
