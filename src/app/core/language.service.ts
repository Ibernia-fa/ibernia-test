import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type LanguageCode = 'en' | 'it';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private readonly supportedLanguages: LanguageCode[] = ['en', 'it'];

  constructor(private translate: TranslateService) {
    this.translate.addLangs(this.supportedLanguages);
    this.translate.setDefaultLang('en');
  }

  setFromApi(language: string): void {
    const lang: LanguageCode = language === 'it' ? 'it' : 'en';
    this.use(lang);
  }

  use(language: LanguageCode): void {
    if (!this.supportedLanguages.includes(language)) {
      language = 'en';
    }
    this.translate.use(language);
  }

  get current(): LanguageCode {
    return this.translate.currentLang as LanguageCode;
  }
}
