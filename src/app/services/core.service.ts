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

  setOptions(options: Partial<AppSettings>) {
    this.optionsSignal.update((current) => ({
      ...current,
      ...options,
    }));

    if (options.sidenavCollapsed !== undefined) {
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
