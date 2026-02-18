import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ClientHttpService } from '../services/client-http.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client } from '../models/client';
import { catchError, combineLatest, combineLatestWith, distinctUntilChanged, filter, forkJoin, map, of, switchMap, tap } from 'rxjs';
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
import { QuestionnaireDialogComponent } from './questionnaire-dialog/questionnaire-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuestionnaireHttpService, GetClientQuestionnaireResponse } from '../services/questionnaire-http.service';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SavingsPotsHttpService } from 'src/app/financial-workflow/saving-pots/services/savings-pots-http.service';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule
  ],
  providers: [RouterModule, DatePipe, AgeCalculatorPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  clientId: string;
  client: Client | null;
  birthDate: Date | undefined;
  cashflows: Array<Cashflow> = [];
  preferredCurrency: string | undefined;
  totalSavings: string = "0";
  isLoaderVisible = true;
  questionnaireResponses: GetClientQuestionnaireResponse | null = null;

  constructor(
    private dialog: MatDialog,
    private clientHttpService: ClientHttpService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private cashflowHttpService: CashflowHttpService,
    private savingsPotsHttpService: SavingsPotsHttpService,
    private questionnaireHttpService: QuestionnaireHttpService,
    private store: Store
  ) {
    this.getClient();
  }

  ngOnInit() {
    this.getClient();
  }

  onEditClicked() {
    this.router.navigate(['/clients/' + this.clientId + '/edit']);
  }

  onQuestionnaireClicked() {
    const dialogRef = this.dialog.open(QuestionnaireDialogComponent, {
      width: '720px',
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
        console.log(this.questionnaireResponses);
      },
      error: () => {
        this.questionnaireResponses = null;
      },
    });
  }

  formatResponseValue(item: { type: string; value: unknown }): string {
    const v = item.value;
    if (v == null) return '-';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === 'object' && x && 'name' in x && 'relationship' in x
        ? `${(x as { name: string }).name} (${(x as { relationship: string }).relationship})`
        : String(x))).join(', ');
    }
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const selected = obj['selected'] as string[] | undefined;
      const others = obj['others'] as string | undefined;
      const parts = selected ? [...selected] : [];
      if (others) parts.push(`Other: ${others}`);
      return parts.join(', ') || '-';
    }
    return String(v);
  }

  getResponseChips(item: { type: string; value: unknown }): string[] {
    const formatted = this.formatResponseValue(item);
    if (!formatted || formatted === '-') return [];
    return formatted.split(', ').filter(Boolean);
  }

  onSortByValueChange(event: any)
  {
    console.log({event})
    if(event === 'asc') {
      this.cashflows.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    } else {
      this.cashflows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }

  getClient() {
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.clientId = params['id']
          return this.cashflowHttpService.getByClientId(this.clientId)
        }),
        combineLatestWith(this.store.select(selectedClient).pipe(takeUntilDestroyed())),
        tap(([cashflows, client]) => {
          console.log(client);
          if(!client || client.id !== this.clientId) {
            this.store.dispatch(ClientActions.loadClient({clientId: this.clientId}))
          }
        }),
        filter(([cashflows, client]) => !!client && client.id === this.clientId),
        map(([cashflows, client]) => {
          this.client = client;
          this.cashflows = cashflows;
          this.birthDate = this.client?.clientDetails.birthDate;
          this.refreshTotalSavings();
          this.loadQuestionnaireResponses();

          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  loadCashflowToStore(cashflowId : any) {
    var cashflow = this.cashflows.find(cashflow => cashflow.id === cashflowId)
    console.log(cashflow);
    if(cashflow)
      this.store.dispatch(CashflowActions.selectCashflow({cashflow}));
  }

  getCashflows() {
    this.isLoaderVisible = true;
    this.cashflowHttpService.getByClientId(this.clientId).pipe(
      tap((cashflows: Cashflow[]) => {
        this.cashflows = cashflows;
        this.refreshTotalSavings();
        this.isLoaderVisible = false;
      })
    ).subscribe();
  }

  newModelClicked() {

    const dialogRef = this.dialog.open(
      AddModelDialogComponent,
      {
        width: '600px',
        disableClose: true,
        data: this.client
      }
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  onEditModelClicked(cashflowId: string) {
    const dialogRef = this.dialog.open(
      EditModelDialogComponent,
      {
        width: '600px',
        disableClose: true,
        data: this.cashflows.find(cashflow => cashflow.id === cashflowId)
      }
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      this.getCashflows();
      console.log('Dialog closed with result:', result);
    });
  }
  
  onCopyModelClicked(cashflow: Cashflow) {
    this.isLoaderVisible = true;
    cashflow.name = 'Copy of ' + cashflow.name;
    
    this.cashflowHttpService.copyCashflow(cashflow).pipe(
      filter(res => !!res),
      catchError((err) => {
        console.error("An error occurred while cloning cashflow", err);
        this.toastr.error('An error occurred while cloning plan');
        throw err;
      })
    ).subscribe((res) => {
      this.toastr.success('Plan cloned successfully');
      this.getCashflows();
    });
  }
  
  onDeleteModelClicked(cashflowId: string) {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        action: 'Delete',
        text: 'Are you sure you want to delete this plan?',
        cashflowId
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
              this.toastr.success('Plan deleted successfully', 'Success!');
              this.getCashflows();
            }),
            catchError((err) => {
              console.error(err);
              this.toastr.error('An error occured while deleting plan', 'Error!');
              throw err;
            })
          )
          .subscribe();
  }

  private refreshTotalSavings() {
    this.preferredCurrency = this.client?.clientDetails.preferredCurrency;

    if (!this.cashflows.length) {
      this.totalSavings = this.preferredCurrency == undefined ? "N/A" : "0";
      return;
    }

    const lastUpdatedCashflow = [...this.cashflows]
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

    this.savingsPotsHttpService
      .getAllSavingsPots(lastUpdatedCashflow?.id)
      .subscribe({
        next: (data) => {
          const totalSavings = data.totalSavings?.toString();
          this.totalSavings = (this.preferredCurrency == undefined || totalSavings == null)
          ? "N/A"
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
}
