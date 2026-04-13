import { Injectable, signal } from '@angular/core';
import { AppSettings, defaults } from '../config';

const SIDEBAR_COLLAPSED_KEY = 'ibernia_sidenavCollapsed';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  private optionsSignal = signal<AppSettings>({
    ...defaults,
    sidenavCollapsed: CoreService.loadCollapsedState(),
  });

  private static loadCollapsedState(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return defaults.sidenavCollapsed;
    }
  }

  getOptions() {
    return this.optionsSignal();
  }

  /**
   * @param persistSidenavCollapsed When false, updates in-memory `sidenavCollapsed` only (viewport
   *   or temporary UI). User choices (toggle, settings restore) should pass true so preference
   *   survives sessions. Default true keeps other `setOptions` callers persisting as before.
   */
  setOptions(
    options: Partial<AppSettings>,
    persistSidenavCollapsed = true,
  ) {
    this.optionsSignal.update((current) => ({
      ...current,
      ...options,
    }));

    if (
      options.sidenavCollapsed !== undefined &&
      persistSidenavCollapsed
    ) {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(options.sidenavCollapsed));
      } catch { /* storage unavailable */ }
    }
  }

  setLanguage(lang: string) {
    this.setOptions({ language: lang });
  }

  getLanguage() {
    return this.getOptions().language;
  }
}
