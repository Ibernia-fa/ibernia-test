import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, switchMap, tap } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { SavingPotsModel } from '../financial-workflow/saving-pots/models/saving-pots.model';
import { FundsViewModel, WithdrawalsContributions } from '../financial-workflow/withdrawals-contributions/model/withdrawals-contributions';
import { ChartSeries } from '../financial-workflow/reports/models/charts-series.model';
import { FinancialViewModel, IncomeExpense } from '../financial-workflow/income-expenses/model/income-expense';
import { FinancialTimeline } from '../financial-workflow/timeline/models/financial-timeline';

import { SavingsBarStackedChartComponent } from '../financial-workflow/reports/savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { TimelineChartComponent } from '../financial-workflow/timeline/timeline-chart/timeline-chart.component';

import { ViewReportHttpService } from './services/view-report-http.service';

import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
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
  selector: 'app-view-report',
  imports: [
    TablerIconsModule,
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
    ThousandSeparatorPipe
  ],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.scss',
})
export class ViewReportComponent {
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
  incomeDataSource: MatTableDataSource<FinancialViewModel> = new MatTableDataSource(new Array<FinancialViewModel>());
  expenseDataSource: MatTableDataSource<FinancialViewModel> = new MatTableDataSource(new Array<FinancialViewModel>());
  contributionDataSource: MatTableDataSource<FundsViewModel> = new MatTableDataSource(new Array<FundsViewModel>());
  withdrawalDataSource: MatTableDataSource<FundsViewModel> = new MatTableDataSource(new Array<FundsViewModel>());
  report: ChartSeries;
  financialSeries: any;
  
  constructor(
    private viewReportHttpService: ViewReportHttpService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const token = params['token'];
      const password = 'SHUJ2410';
      if (token) {
        this.getFinancialReport(token, password);
      } else {
        console.error('Token not provided in URL');
      }
    });
  }

  getFinancialReport(token: string, password: string) {
    this.isLoaderVisible = true;

    this.viewReportHttpService.viewReport(token, password).subscribe({
      next: (financialSeries: any) => {
        this.financialSeries = financialSeries;

        this.client = financialSeries.client as Client;
        this.cashflow = financialSeries.cashflow as Cashflow;
        this.savingPots = financialSeries.savingPots;

        this.financialTimeline = financialSeries.timeline;
        this.savingPots = financialSeries.savingPots;
        this.incomeExpense = financialSeries.incomeExpense;
        this.contributionWithdrawal = financialSeries.contributionWithdrawal;
          
        this.incomeDataSource = new MatTableDataSource(this.incomeExpense?.incomes);
        this.expenseDataSource = new MatTableDataSource(this.incomeExpense?.expenses);
        this.contributionDataSource = new MatTableDataSource(this.contributionWithdrawal?.contributions);
        this.withdrawalDataSource = new MatTableDataSource(this.contributionWithdrawal?.withdrawals);

        this.report = financialSeries.report;


        console.log(this.financialSeries);
        this.isLoaderVisible = false;
      },
      error: (err: any) => {
        console.error('Error fetching financial report', err);
        this.isLoaderVisible = false;
      },
    });
  }


  // getData() {
  //   this.isLoaderVisible = true;
  //   this.activatedRoute.params
  //     .pipe(
  //       switchMap((params) =>
  //         this.financialWorkflowService.loadClientCashflowMetadata(params)
  //       ),
  //       tap(([client, cashflow]) => {
  //         this.client = client as Client;
  //         console.log(cashflow);
  //         this.cashflow = cashflow as Cashflow;
  //       }),
  //       switchMap(([client, cashflow]) => {
  //         return combineLatest([
  //           this.savingPotsHttpService.getAllSavingsPots((cashflow as Cashflow).id),
  //           this.timelineHttpService.getTimelinebyCashflowId((cashflow as Cashflow).id),
  //           this.incomeExpensesHttpService.getAllIncomeExpenses((cashflow as Cashflow).id),
  //           this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions((cashflow as Cashflow).id),
  //           this.reportsHttpService.getReportbyCashflowId((cashflow as Cashflow).id)
  //         ]);
  //       }),
  //       tap(([savingPots, timeline, incomeExpense, contributionWithdrawal, report]) => {
  //         this.financialTimeline = timeline;
  //         this.clientBirthDate = this.client.clientDetails.birthDate;
  //         this.savingPots = savingPots;
  //         this.incomeExpense = incomeExpense;
  //         this.contributionWithdrawal = contributionWithdrawal;
          
  //         this.incomeDataSource = new MatTableDataSource(this.incomeExpense?.incomes);
  //         this.expenseDataSource = new MatTableDataSource(this.incomeExpense?.expenses);
  //         this.contributionDataSource = new MatTableDataSource(this.contributionWithdrawal?.contributions);
  //         this.withdrawalDataSource = new MatTableDataSource(this.contributionWithdrawal?.withdrawals);

  //         this.report = report
  //         this.isLoaderVisible = false;
  //       })
  //     )
  //     .subscribe();
  // }
}
