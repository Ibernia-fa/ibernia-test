import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ViewSavingsBarStackedChartComponent } from '../savings-bar-stacked-chart/view-savings-bar-stacked-chart.component';
import { ViewTimelineChartComponent } from '../timeline-chart/view-timeline-chart.component';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-view-report',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenav,
    MatSidenavModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    ViewSavingsBarStackedChartComponent,
    ViewTimelineChartComponent,
    CurrencySymbolPipe,
    ThousandSeparatorPipe,
    MatRippleModule,
    TablerIconsModule,
    MaterialModule,
  ],
   animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
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
  section: string = 'lifetimePlan';
  displayedColumns: string[] = ['position', 'name'];
  
  constructor() { }

  ngOnInit(): void {
    if (this.financialSeries) {
      this.incomeDataSource = new MatTableDataSource(this.incomeExpense?.incomes || []);
      this.expenseDataSource = new MatTableDataSource(this.incomeExpense?.expenses || []);
      this.contributionDataSource = new MatTableDataSource(this.contributionWithdrawal?.contributions || []);
      this.withdrawalDataSource = new MatTableDataSource(this.contributionWithdrawal?.withdrawals || []);
    }
  }

  setSection(section: string) {
    this.section = section;
  }
}
