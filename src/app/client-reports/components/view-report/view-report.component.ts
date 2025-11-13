import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ViewSavingsBarStackedChartComponent } from '../savings-bar-stacked-chart/view-savings-bar-stacked-chart.component';
import { ViewTimelineChartComponent } from '../timeline-chart/view-timeline-chart.component';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { T } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-view-report',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    ViewSavingsBarStackedChartComponent,
    ViewTimelineChartComponent,
    CurrencySymbolPipe,
    ThousandSeparatorPipe
  ],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.scss',
})

export class ViewReportComponent {
  @Input() financialSeries: any;

  get clientBirthDate() {
    return this.financialSeries?.client.clientDetails.birthDate;
  }
  get client() {
    return this.financialSeries?.client;
  }
  get cashflow() {
    return this.financialSeries?.cashflow;
  }
  get financialTimeline() {
    return this.financialSeries?.timeline;
  }
  get savingPots() {
    return this.financialSeries?.savingPots;
  }
  get incomeExpense() {
    return this.financialSeries?.financialRecords;
  }
  get contributionWithdrawal() {
    return this.financialSeries?.fundTransactions;
  }
  get report() {
    return this.financialSeries?.financialProjection;
  }

  incomeExpenseDisplayedColumns: string[] = [
    'position',
    'start_age',
    'end_age',
    'name',
    'inflation_rate',
  ];

  incomeDataSource!: MatTableDataSource<any>;
  expenseDataSource!: MatTableDataSource<any>;
  contributionDataSource!: MatTableDataSource<any>;
  withdrawalDataSource!: MatTableDataSource<any>;
  
  constructor() { }

  ngOnInit(): void {
    if (this.financialSeries) {
      this.incomeDataSource = new MatTableDataSource(this.incomeExpense?.incomes || []);
      this.expenseDataSource = new MatTableDataSource(this.incomeExpense?.expenses || []);
      this.contributionDataSource = new MatTableDataSource(this.contributionWithdrawal?.contributions || []);
      this.withdrawalDataSource = new MatTableDataSource(this.contributionWithdrawal?.withdrawals || []);
    }
  }
}
