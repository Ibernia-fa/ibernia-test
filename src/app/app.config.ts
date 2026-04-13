import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom, isDevMode,
} from '@angular/core';
import {
  HttpBackend,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { ToastrModule } from 'ngx-toastr';
import { provideToastr } from 'ngx-toastr';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// perfect scrollbar
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxPermissionsModule } from 'ngx-permissions';
//Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

// code view
import { provideHighlightOptions } from 'ngx-highlightjs';
import 'highlight.js/styles/atom-one-dark.min.css';
import { httpRequestInterceptor } from './core/http-request.interceptor';
import { httpAuthErrorInterceptor } from './core/http-auth-error.interceptor';
import { httpUiErrorMessageInterceptor } from './core/http-ui-error-message.interceptor';
import { iberniaTranslateLoaderFactory } from './core/i18n/ibernia-translate-http-loader';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { FinancialAdvisorEffects } from './store/financial-advisor/financial-advisor.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ClientEffects } from './store/client/client.effects';
import { CashflowEffects } from './store/cashflow/cashflow.effects';
import { clientReducer } from './store/client/client.reducer';
import { cashflowReducer } from './store/cashflow/cashflow.reducer';


export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(), // required animations providers
    provideToastr(), // Toastr providers
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHighlightOptions({
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        lineNumbersLoader: () => import('ngx-highlightjs/line-numbers'), // Optional, add line numbers if needed
        languages: {
            typescript: () => import('highlight.js/lib/languages/typescript'),
            css: () => import('highlight.js/lib/languages/css'),
            xml: () => import('highlight.js/lib/languages/xml'),
        },
    }),
    provideRouter(routes, withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
    }), withComponentInputBinding()),
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([
        httpRequestInterceptor,
        httpAuthErrorInterceptor,
        httpUiErrorMessageInterceptor,
      ])
    ),
    provideClientHydration(),
    importProvidersFrom(FormsModule, ToastrModule.forRoot(), ReactiveFormsModule, MaterialModule, NgxPermissionsModule.forRoot(), TablerIconsModule.pick(TablerIcons), NgScrollbarModule, CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory,
    }), TranslateModule.forRoot({
      defaultLanguage: 'en',
        loader: {
            provide: TranslateLoader,
            useFactory: iberniaTranslateLoaderFactory,
            deps: [HttpBackend],
        },
    })),
    provideStore({client: clientReducer, cashflow: cashflowReducer}),
    provideEffects(FinancialAdvisorEffects, ClientEffects, CashflowEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
],
};
