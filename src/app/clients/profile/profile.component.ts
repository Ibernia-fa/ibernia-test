import { Component, DestroyRef, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ClientHttpService } from '../services/client-http.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client } from '../models/client';
import {
  catchError,
  combineLatest,
  combineLatestWith,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { MatDialog } from '@angular/material/dialog';
import { AddModelDialogComponent } from './add-model-dialog/add-model-dialog.component';
import { CashflowHttpService } from '../services/cashflow-http.service';
import { Cashflow } from '../models/cashflow';
import { TimeAgoPipe } from 'src/app/pipe/time-ago.pipe';
import { DialogComponent } from 'src/app/dialog/dialog.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { EditModelDialogComponent } from './edit-model-dialog/edit-model-dialog.component';
import { ClientEditComponent } from '../client-edit/client-edit.component';
import { QuestionnaireDialogComponent } from './questionnaire-dialog/questionnaire-dialog.component';
import { QuestionnaireResponsesDialogComponent } from './questionnaire-responses-dialog/questionnaire-responses-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  QuestionnaireHttpService,
  GetClientQuestionnaireResponse,
} from '../services/questionnaire-http.service';
import { allCountries } from '../models/country';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SavingsPotsHttpService } from 'src/app/financial-workflow/saving-pots/services/savings-pots-http.service';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface SortDescriptor {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    TablerIconsModule,
    CommonModule,
    MatButtonModule,
    AgeCalculatorPipe,
    MatMenuModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    TimeAgoPipe,
    ToastrModule,
    MatProgressSpinnerModule,
    RouterModule,
    CurrencySymbolPipe,
    ThousandSeparatorPipe,
    TranslateModule,
  ],
  providers: [RouterModule, DatePipe, AgeCalculatorPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly destroyRef = inject(DestroyRef);

  clientId: string;
  client: Client | null;
  birthDate: Date | undefined;

  /** `DatePipe` locale for formatted birth date (matches UI language). */
  dateLocale = 'en';
  cashflows: Array<Cashflow> = [];
  preferredCurrency: string | undefined;
  totalSavings: string = '0';
  isLoaderVisible = true;
  isPageLoading = true;
  questionnaireResponses: GetClientQuestionnaireResponse | null = null;
  responseCurrencySymbol = '';

  constructor(
    private dialog: MatDialog,
    private clientHttpService: ClientHttpService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private cashflowHttpService: CashflowHttpService,
    private savingsPotsHttpService: SavingsPotsHttpService,
    private questionnaireHttpService: QuestionnaireHttpService,
    private store: Store,
    private translate: TranslateService,
  ) {
    this.dateLocale = this.localeFromLang(this.translate.currentLang);
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        this.dateLocale = this.localeFromLang(e.lang);
      });
    this.getClient();
  }

  ngOnInit() {}

  private localeFromLang(lang: string | undefined): string {
    return lang?.toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  onEditClicked() {
    const dialogRef = this.dialog.open(ClientEditComponent, {
      width: '612px',
      maxHeight: '90vh',
      disableClose: true,
      data: { clientId: this.clientId },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.action === 'updated') {
        this.store.dispatch(
          ClientActions.loadClient({ clientId: this.clientId }),
        );
        this.getCashflows();
      }
    });
  }

  onQuestionnaireClicked() {
    if (this.questionnaireResponses) {
      const dialogRef = this.dialog.open(
        QuestionnaireResponsesDialogComponent,
        {
          width: '1090px',
          maxHeight: '90vh',
          data: {
            questionnaireResponses: this.questionnaireResponses,
            client: this.client,
            responseCurrencySymbol: this.responseCurrencySymbol,
          },
        },
      );
      dialogRef.afterClosed().subscribe(() => {
        this.loadQuestionnaireResponses();
      });
    } else {
      this.openQuestionnaireCreateDialog();
    }
  }

  private openQuestionnaireCreateDialog() {
    const dialogRef = this.dialog.open(QuestionnaireDialogComponent, {
      width: '612px',
      disableClose: true,
      data: { client: this.client },
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadQuestionnaireResponses();
    });
  }

  loadQuestionnaireResponses() {
    if (!this.clientId) return;
    this.questionnaireHttpService.getClientResponses(this.clientId).subscribe({
      next: (data) => {
        this.questionnaireResponses = data;
        this.responseCurrencySymbol = this.resolveCurrencySymbol(
          data?.currency,
        );
      },
      error: () => {
        this.questionnaireResponses = null;
      },
    });
  }

  private resolveCurrencySymbol(code?: string): string {
    if (!code) return '';
    const country = allCountries.find((c) => c.currencySymbol === code);
    return country?.symbol || code;
  }

  onSortByValueChange(event: any) {
    console.log({ event });
    if (event === 'asc') {
      this.cashflows.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    } else {
      this.cashflows.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
  }

  getClient() {
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.clientId = params['id'];
          return this.cashflowHttpService.getByClientId(this.clientId);
        }),
        combineLatestWith(
          this.store.select(selectedClient).pipe(takeUntilDestroyed()),
        ),
        tap(([cashflows, client]) => {
          if (!client || client.id !== this.clientId) {
            this.store.dispatch(
              ClientActions.loadClient({ clientId: this.clientId }),
            );
          }
        }),
        filter(
          ([cashflows, client]) => !!client && client.id === this.clientId,
        ),
        switchMap(([cashflows, client]) => {
          this.client = client;
          this.cashflows = cashflows || [];
          this.birthDate = this.client?.clientDetails.birthDate;
          this.refreshTotalSavings();
          this.isLoaderVisible = false;

          return this.questionnaireHttpService
            .getClientResponses(this.clientId)
            .pipe(catchError(() => of(null)));
        }),
        tap((questionnaireData) => {
          if (questionnaireData) {
            this.questionnaireResponses = questionnaireData;
            this.responseCurrencySymbol = this.resolveCurrencySymbol(
              questionnaireData?.currency,
            );
            const fromEmail =
              this.activatedRoute.snapshot.queryParamMap.get('responses') ===
              '1';
            if (fromEmail) {
              setTimeout(() => this.onQuestionnaireClicked(), 0);
            }
          } else {
            this.questionnaireResponses = null;
          }
          this.isPageLoading = false;
        }),
      )
      .subscribe();
  }

  loadCashflowToStore(cashflowId: any) {
    var cashflow = this.cashflows.find(
      (cashflow) => cashflow.id === cashflowId,
    );
    console.log(cashflow);
    if (cashflow)
      this.store.dispatch(CashflowActions.selectCashflow({ cashflow }));
  }

  getCashflows() {
    this.isLoaderVisible = true;
    this.cashflowHttpService
      .getByClientId(this.clientId)
      .pipe(
        tap((cashflows: Cashflow[]) => {
          this.cashflows = cashflows;
          this.refreshTotalSavings();
          this.isLoaderVisible = false;
        }),
      )
      .subscribe();
  }

  newModelClicked() {
    const dialogRef = this.dialog.open(AddModelDialogComponent, {
      width: '612px',
      disableClose: true,
      data: this.client,
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  onEditModelClicked(cashflowId: string) {
    const dialogRef = this.dialog.open(EditModelDialogComponent, {
      width: '612px',
      disableClose: true,
      data: this.cashflows.find((cashflow) => cashflow.id === cashflowId),
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.getCashflows();
      console.log('Dialog closed with result:', result);
    });
  }

  onCopyModelClicked(cashflow: Cashflow) {
    this.isLoaderVisible = true;
    cashflow.name = this.translate.instant('LABEL.COPY_OF') + ' ' + cashflow.name;

    this.cashflowHttpService
      .copyCashflow(cashflow)
      .pipe(
        filter((res) => !!res),
        catchError((err) => {
          console.error('An error occurred while cloning cashflow', err);
          this.toastr.error(this.translate.instant('TOAST.ERROR_CLONING_PLAN'));
          throw err;
        }),
      )
      .subscribe((res) => {
        this.toastr.success(this.translate.instant('TOAST.PLAN_CLONED'));
        this.getCashflows();
      });
  }

  onDeleteModelClicked(cashflowId: string) {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        action: 'Delete',
        text: this.translate.instant('CONFIRM.DELETE_PLAN'),
        cashflowId,
      },
      width: '460px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      if (result.event === 'Delete') {
        this.deleteModel(result.data.cashflowId);
      }
    });
  }

  deleteModel(cashflowId: string) {
    this.isLoaderVisible = true;
    this.cashflowHttpService
      .deleteCashflow(cashflowId)
      .pipe(
        map((res) => {
          this.toastr.success(this.translate.instant('TOAST.PLAN_DELETED'), this.translate.instant('LABEL.SUCCESS'));
          this.getCashflows();
        }),
        catchError((err) => {
          console.error(err);
          this.toastr.error(this.translate.instant('TOAST.ERROR_DELETING_PLAN'), this.translate.instant('LABEL.ERROR'));
          throw err;
        }),
      )
      .subscribe();
  }

  private refreshTotalSavings() {
    this.preferredCurrency = this.client?.clientDetails.preferredCurrency;

    if (!this.cashflows.length) {
      this.totalSavings = this.preferredCurrency == undefined ? 'N/A' : '0';
      return;
    }

    const lastUpdatedCashflow = [...this.cashflows].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

    this.savingsPotsHttpService
      .getAllSavingsPots(lastUpdatedCashflow?.id)
      .subscribe({
        next: (data) => {
          const totalSavings = data.totalSavings?.toString();
          this.totalSavings =
            this.preferredCurrency == undefined || totalSavings == null
              ? 'N/A'
              : totalSavings;
        },
        error: (err) => {
          console.error('Error fetching saving pots:', err);
        },
      });
  }

  sortDescriptors: SortDescriptor[] = [
    { value: 'asc', viewValue: 'Ascending' },
    { value: 'desc', viewValue: 'Descending' },
  ];

  /** Partner row is shown when partner details exist with at least a first or last name. */
  get hasPartner(): boolean {
    const p = this.client?.partnerDetail;
    if (!p) return false;
    return !!(p.firstName?.trim() || p.lastName?.trim());
  }

  get partnerBirthDate(): Date | undefined {
    const raw = this.client?.partnerDetail?.birthDate as Date | string | number | undefined | null;
    if (raw == null) return undefined;
    if (typeof raw === 'string' && raw.trim() === '') return undefined;
    return raw instanceof Date ? raw : new Date(raw);
  }
}
