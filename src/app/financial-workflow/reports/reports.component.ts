import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import { Client } from 'src/app/clients/models/client';
import { FinancialTimeline } from '../timeline/models/financial-timeline';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';
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
import { TimelineChartComponent } from '../timeline/timeline-chart/timeline-chart.component';
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
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { MatSliderModule } from '@angular/material/slider';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';


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
    TimelineChartComponent,
    MatTableModule,
    CommonModule,
    CurrencySymbolPipe,
    MatTooltipModule,
    ThousandSeparatorPipe
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
  
  incomeDataSource: MatTableDataSource<FinancialViewModel> =
    new MatTableDataSource(new Array<FinancialViewModel>());
  expenseDataSource: MatTableDataSource<FinancialViewModel> =
    new MatTableDataSource(new Array<FinancialViewModel>());
  
  contributionDataSource: MatTableDataSource<FundsViewModel> =
    new MatTableDataSource(new Array<FundsViewModel>());
  withdrawalDataSource: MatTableDataSource<FundsViewModel> =
    new MatTableDataSource(new Array<FundsViewModel>());
  clientBirthDate: Date;
  report: ChartSeries;

  constructor(
    private timelineHttpService: TimelineHttpService,
    private reportsHttpService: ReportsHttpService,
    private savingPotsHttpService: SavingsPotsHttpService,
    private financialWorkflowService: FinancialWorkflowService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
    private activatedRoute: ActivatedRoute,
    private navItemService: NavItemService
  ) {
    this.destroyed$ = new BehaviorSubject<boolean>(false);
    this.navItemService.currentRouteName = 'Goals & Events';
    this.getData();
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
          console.log(cashflow);
          this.cashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
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
              (cashflow as Cashflow).id
            )
          ]);
        }),
        tap(([savingPots, timeline, incomeExpense, contributionWithdrawal, report]) => {
          this.financialTimeline = timeline;
          this.clientBirthDate = this.client.clientDetails.birthDate;
          this.savingPots = savingPots;
          this.incomeExpense = incomeExpense;
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
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }
}
