import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddIncomeComponent } from './add-income/add-income.component';
import { UpdateIncomeComponent } from './update-income/update-income.component';
import { MatCardModule } from '@angular/material/card';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { combineLatest, switchMap, tap } from 'rxjs';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { IncomeExpensesHttpService } from './services/income-expenses-http.service';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import { FinancialViewModel, IncomeExpense } from './model/income-expense';
import { Cycle, EscalationRate } from '../timeline/models/financial-timeline';

export interface PeriodicElement {
  name: string;
  position: string;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 'Accountant Salary (MR)', name: '£4,000/month', symbol: 'H' },
  {
    position: 'Graphic Design Salary - Part Time (Mrs)',
    name: '£4,000/month',
    symbol: 'He',
  },
  { position: 'NHS DB Pension (MRS)', name: '£4,000/month', symbol: 'Li' },
  {
    position: 'Tax free cash from NHS (Mrs)',
    name: '£4,000/month',
    symbol: 'Be',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    symbol: 'B',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    symbol: 'C',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    symbol: 'N',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    symbol: 'O',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    symbol: 'F',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    symbol: 'Ne',
  },
];

@Component({
  selector: 'app-income-expenses',
  imports: [
    MatDialogModule,
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
  ],
  templateUrl: './income-expenses.component.html',
  styleUrl: './income-expenses.component.scss',
})
export class IncomeExpensesComponent {
  displayedColumns: string[] = ['position', 'name', 'action'];
  dataSource = ELEMENT_DATA;
  incomeDataSource: MatTableDataSource<FinancialViewModel> = new MatTableDataSource(
      new Array<FinancialViewModel>()
    );
  expenseDataSource: MatTableDataSource<FinancialViewModel> = new MatTableDataSource(
    new Array<FinancialViewModel>()
  );
  selectedClient: Client;
  selectedCashflow: Cashflow;
  incomeExpense: IncomeExpense;
  amountCycles: Cycle[];
  escalationRates: EscalationRate[];

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingHttpService: SettingsHttpService
  ) {
    this.getData();
  }

  getData() {
    this.activatedRoute.params
      .pipe(
        switchMap((params) =>
          this.financialWorkflowService.loadClientCashflowMetadata(params)
        ),
        tap(([client, cashflow]) => {
          this.selectedClient = client as Client;
          console.log(cashflow);
          this.selectedCashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          return combineLatest([
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id
            ),
            this.settingHttpService.getAmountCycles(),
            this.settingHttpService.getEscalationRates(
              (client as Client).financialAdvisor.advisorId
            ),
          ]);
        }),
        tap(([incomeExpense, amountCycles, escalationRates]) => {
          this.incomeExpense = incomeExpense;
          this.amountCycles = amountCycles;
          this.escalationRates = escalationRates;

          this.incomeDataSource = new MatTableDataSource(this.incomeExpense.incomes);
          this.expenseDataSource = new MatTableDataSource(this.incomeExpense.expenses);
        })
      )
      .subscribe();
  }

  newIncomeClicked() {
    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  newExpenseClicked() {
    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  updateIncomeClicked() {
    const dialogRef = this.dialog.open(UpdateIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
  
  updateExpenseClicked() {
    const dialogRef = this.dialog.open(UpdateIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
