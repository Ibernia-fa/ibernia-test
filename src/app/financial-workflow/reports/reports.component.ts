import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, Subject, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import { Client, Details } from 'src/app/clients/models/client';
import { FinancialTimeline } from '../timeline/models/financial-timeline';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { SavingsBarStackedChartComponent } from './savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { SavingsPotsHttpService } from '../saving-pots/services/savings-pots-http.service';
import { SavingPotsModel } from '../saving-pots/models/saving-pots.model';
import { CommonModule } from '@angular/common';
import { IncomeExpensesHttpService } from '../income-expenses/services/income-expenses-http.service';
import { FinancialViewModel, IncomeExpense } from '../income-expenses/model/income-expense';
import { FundsViewModel, WithdrawalsContributions } from '../withdrawals-contributions/model/withdrawals-contributions';
import { WithdrawalsContributionsHttpService } from '../withdrawals-contributions/services/withdrawals-contributions-http.service';
import { ReportsHttpService } from './services/reports-http.service';
import { ChartSeries } from './models/charts-series.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CashflowHttpService } from 'src/app/clients/services/cashflow-http.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CompareCashflowsComponent } from './compare-cashflows/compare-cashflows.component';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { FullscreenData, FullscreenService } from 'src/app/services/fullscreen.service';
import { TranslateModule } from '@ngx-translate/core';


export interface PeriodicElement {
  name: string;
  position: string;
  start_age: string | number;
  end_age: string | number;
  inflation_rate: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 'Accountant Salary (MR)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: 'Graphic Design Salary - Part Time (Mrs)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: 'NHS DB Pension (MRS)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: 'Tax free cash from NHS (Mrs)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 'Retirement (60)',
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 'Retirement - Mrs (60)',
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 67,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 67,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 67,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
];

@Component({
  selector: 'app-reports',
  imports: [
    TablerIconsModule,
    MatSliderModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    SavingsBarStackedChartComponent,
    MatTableModule,
    CommonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  incomeExpenseDisplayedColumns: string[] = [
    'position',
    'start_age',
    'end_age',
    'name',
    'inflation_rate',
  ];
  dataSource = ELEMENT_DATA;

  cashflowId: string;
  cashflow: Cashflow | null;
  isLoaderVisible: boolean;
  client: Client;
  destroyed$: BehaviorSubject<boolean>;
  financialTimeline: FinancialTimeline;
  savingPots: SavingPotsModel;
  incomeExpense: IncomeExpense;
  contributionWithdrawal: WithdrawalsContributions
  compareCashflow: Cashflow | null = null;
  compareReport: ChartSeries | null = null;
  compareTimeline: FinancialTimeline | null = null;
  isCompareLoading = false;
  incomeDataSource: MatTableDataSource<FinancialViewModel> = new MatTableDataSource(new Array<FinancialViewModel>());
  expenseDataSource: MatTableDataSource<FinancialViewModel> = new MatTableDataSource(new Array<FinancialViewModel>());
  contributionDataSource: MatTableDataSource<FundsViewModel> = new MatTableDataSource(new Array<FundsViewModel>());
  withdrawalDataSource: MatTableDataSource<FundsViewModel> = new MatTableDataSource(new Array<FundsViewModel>());
  clientBirthDate: Date;
  report: ChartSeries;
  cashflows: Cashflow[] = [];
  savingsForm: FormGroup;
  userRerturnRate: number;
  private destroy$ = new Subject<void>();
  client$: Observable<Client | null>;
  clientData: Details;
  @ViewChild('mainChart') mainChart?: SavingsBarStackedChartComponent;
  @ViewChild('compareChart') compareChart?: SavingsBarStackedChartComponent;
  hasShortfall: boolean = false;
  firstShortfallAge: number | null = null;

  constructor(
    private timelineHttpService: TimelineHttpService,
    private reportsHttpService: ReportsHttpService,
    private savingPotsHttpService: SavingsPotsHttpService,
    private financialWorkflowService: FinancialWorkflowService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
    private activatedRoute: ActivatedRoute,
    private navItemService: NavItemService,
    private cashflowHttpService: CashflowHttpService,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private store: Store,
    private fullscreenService: FullscreenService,
    private elementRef: ElementRef
  ) {
    this.destroyed$ = new BehaviorSubject<boolean>(false);
    this.navItemService.currentRouteName = 'Lifetime Plan';
    this.savingsForm = this.fb.group({ returnRate: [0] });

    this.client$ = this.store.select(selectedClient);
    this.client$
      .subscribe(client => {
        if (client) {
          this.clientData = client.clientDetails;
          this.savingsForm
            .get('returnRate')
            ?.setValue(this.clientData.inflationRate, { emitEvent: false });
        }
        this.getData();
      });
    }

  getShortfallStatus(report: ChartSeries) {  
   this.hasShortfall = false;
  this.firstShortfallAge = null;

  const shortfallSeries = report?.series?.find(s => s.name === 'Shortfall');
  if (!shortfallSeries) return;

  const index = shortfallSeries.data.findIndex(v => v < 0);
  if (index < 0) return;

  this.hasShortfall = true;

  const year = Number(report.categories[index]);
  const birthYear = new Date(this.client.clientDetails.birthDate).getFullYear();

  this.firstShortfallAge = year - birthYear;
  }

  ngAfterViewInit(): void {
    // Listen for fullscreen changes
    this.fullscreenService.isFullscreen$.subscribe(isFullscreen => { });
  }

  enterFullscreen(isComparison = false): void {
    const chartData = {
      report: isComparison ? this.compareReport : this.report,
      client: this.client,
      forecastStartDate: isComparison ?
        (this.compareTimeline?.forecastStartDate || this.financialTimeline.forecastStartDate) :
        this.financialTimeline.forecastStartDate,
      forecastEndDate: isComparison ?
        (this.compareTimeline?.forecastEndtDate || this.financialTimeline.forecastEndtDate) :
        this.financialTimeline.forecastEndtDate,
      cashFlowName: this.cashflow?.name || 'Error',
      isComparison: isComparison,
      hasShortfall: this.hasShortfall,
      firstShortfallAge: this.firstShortfallAge
    };

    this.fullscreenService.enterFullscreen(chartData);
  }

  ngOnDestroy(): void {
    this.fullscreenService.exitFullscreen();
  }

  getData() {
    this.isLoaderVisible = true;
    this.activatedRoute.params
      .pipe(
        switchMap((params) =>
          this.financialWorkflowService.loadClientCashflowMetadata(params)
        ),
        tap(([client, cashflow]) => {
          this.client = client as Client;
          this.cashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          const clientId = (client as Client).id;
          const inflationRate =
            this.savingsForm.get('returnRate')?.value;
          return combineLatest([
            this.savingPotsHttpService.getAllSavingsPots(
              (cashflow as Cashflow).id
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              (cashflow as Cashflow).id
            ),
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id
            ),
            this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions(
              (cashflow as Cashflow).id
            ),
            this.reportsHttpService.getReportbyCashflowId(
              (cashflow as Cashflow).id,
              inflationRate
            ),
           
            this.cashflowHttpService.getByClientId(clientId),
          ]);
        }),
        tap(([savingPots, timeline, incomeExpense, contributionWithdrawal, report, cashflows]) => {
          this.financialTimeline = timeline;
          this.clientBirthDate = this.client.clientDetails.birthDate;
          this.savingPots = savingPots;
          this.incomeExpense = incomeExpense;
          this.cashflows = cashflows as Cashflow[];
          this.contributionWithdrawal = contributionWithdrawal;

          this.incomeDataSource = new MatTableDataSource(
            this.incomeExpense?.incomes
          );
          this.expenseDataSource = new MatTableDataSource(
            this.incomeExpense?.expenses
          );

          this.contributionDataSource = new MatTableDataSource(
            this.contributionWithdrawal?.contributions
          );
          this.withdrawalDataSource = new MatTableDataSource(
            this.contributionWithdrawal?.withdrawals
          );

          this.report = report
          this.getShortfallStatus(report);
          console.log('Report data loaded:', report);
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  onReturnRateInput(event: Event) {
    // when typing, ensure the control holds a clean number so slider updates
    const raw = (event.target as HTMLInputElement).value;
    const num = Number(raw);
    const val = isNaN(num) ? 0 : this.round2(num);
    this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });
  }

  onSliderInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value);
    const val = isNaN(value) ? 0 : this.round2(value);
    this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  onReturnRateCommitted(): void {
    const control = this.savingsForm.get('returnRate');
    if (!control) return;

    const num = Number(control.value);
    const val = isNaN(num) ? 0 : this.round2(num);

    // Normalise the value (e.g. 3.333 → 3.33)
    control.setValue(val, { emitEvent: false });

    // Make sure we have a cashflow loaded
    if (!this.cashflow) {
      return;
    }

    const cashflowId = this.cashflow.id;
    const returnRate = val;


    this.reportsHttpService
      .getReportbyCashflowId(cashflowId, returnRate)
      .pipe(
        tap((report) => {
          this.report = report;
          this.getShortfallStatus(report);
          console.log('Report data loaded:', report);
        })
      )
      .subscribe();
  }

  exitComparison() {
    this.compareCashflow = null;
    this.compareReport = null;
    this.compareTimeline = null;
    this.isCompareLoading = false;
  }

  onComparePlansClicked() {
    if (!this.cashflows || this.cashflows.length < 2) {
      this.toaster.info(
        'You need at least two plans to compare. Please create another plan first'
      );
      return;
    }

    // If exactly 2 cashflows total, automatically compare with the other one
    if (this.cashflows.length === 2 && this.cashflow) {
      // Find the other cashflow (not the current one)
      const otherCashflow = this.cashflows.find(c => c.id !== this.cashflow?.id);

      if (otherCashflow) {
        this.loadComparisonPlan(otherCashflow.id, otherCashflow);
        return; // Skip the dialog
      }
    }

    // If more than 2 cashflows, show dialog to choose
    const dialogRef = this.dialog.open(CompareCashflowsComponent, {
      width: '700px',
      disableClose: true,
      data: {
        cashflows: this.cashflows,
        baseCashflowId: this.cashflow?.id,
      },
    });

    dialogRef.afterClosed().subscribe((selectedOtherId?: string) => {
      if (!selectedOtherId) {
        return; // dialog cancelled
      }

      const selected = this.cashflows.find(c => c.id === selectedOtherId) || null;
      if (!selected) {
        // this.toaster.error('Selected plan not found', 'Error');
        return;
      }

      this.loadComparisonPlan(selectedOtherId, selected);
    });
  }

  // Helper method to load comparison plan
  private loadComparisonPlan(cashflowId: string, cashflow: Cashflow): void {
    this.isCompareLoading = true;
    this.compareCashflow = null;
    this.compareReport = null;
    this.compareTimeline = null;

    combineLatest([
      this.reportsHttpService.getReportbyCashflowId(cashflowId),
      this.timelineHttpService.getTimelinebyCashflowId(cashflowId),
    ]).subscribe({
      next: ([report, timeline]) => {
        this.compareCashflow = cashflow;
        this.compareReport = report;
        this.compareTimeline = timeline;
        this.isCompareLoading = false;
      },
      error: (err) => {
        console.error('Failed to load comparison plan', err);
        this.toaster.error(
          'Failed to load comparison plan. Please try again',
          'Error'
        );
        this.isCompareLoading = false;
      },
    });
  }
}
