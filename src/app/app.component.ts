import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageLoaderService } from './layouts/full/language-loader.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet,
      CommonModule,
      TranslateModule
    ],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Ibernia';
  isLanguageSwitching$ = this.languageLoader.loading$;

  constructor(
    private languageLoader: LanguageLoaderService,
  ) {}
}
