import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FooterComponent } from './layouts/full/vertical/footer/footer.component';
import { LanguageLoaderService } from './layouts/full/language-loader.service';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet,
      FooterComponent,
      CommonModule
    ],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Ibernia';
  isLanguageSwitching$ = this.languageLoader.loading$;

  constructor(
    private languageLoader: LanguageLoaderService,
    private router: Router,
  ) {}

  get isQuestionnaireRoute(): boolean {
    return this.router.url.startsWith('/questionnaire/');
  }

  get isCashflowRoute(): boolean {
    return this.router.url.startsWith('/cashflows');
  }

  get showFooter(): boolean {
    return !this.isQuestionnaireRoute && !this.isCashflowRoute;
  }
}
