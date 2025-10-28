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
import {
  Cycle,
  EscalationRate,
  FinancialTimeline,
} from '../timeline/models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import moment from 'moment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';

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
    MatProgressSpinnerModule,
    MatTooltipModule,
    CurrencySymbolPipe,
    ThousandSeparatorPipe
  ],
  templateUrl: './income-expenses.component.html',
  styleUrl: './income-expenses.component.scss',
})
export class IncomeExpensesComponent {
  displayedColumns: string[] = ['position', 'name', 'action'];
  incomeDataSource: MatTableDataSource<FinancialViewModel> =
    new MatTableDataSource(new Array<FinancialViewModel>());
  expenseDataSource: MatTableDataSource<FinancialViewModel> =
    new MatTableDataSource(new Array<FinancialViewModel>());
  selectedClient: Client;
  selectedCashflow: Cashflow;
  incomeExpense: IncomeExpense;
  amountCycles: Cycle[];
  escalationRates: EscalationRate[];
  isLoaderVisible = false;
  timeline: FinancialTimeline;

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingHttpService: SettingsHttpService,
    private timelineHttpService: TimelineHttpService,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'Incomes & Expenses';
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
          this.selectedClient = client as Client;
          console.log(cashflow);
          this.selectedCashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          return combineLatest([
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              (cashflow as Cashflow).id
            ),
            this.settingHttpService.getAmountCycles(),
            this.settingHttpService.getEscalationRates(
              (client as Client).financialAdvisor.advisorId
            ),
          ]);
        }),
        tap(([incomeExpense, timeline, amountCycles, escalationRatesResponse]) => {
          this.incomeExpense = incomeExpense;
          this.amountCycles = amountCycles;
          this.escalationRates = escalationRatesResponse.escalationRates;
          this.timeline = timeline;

          this.incomeDataSource = new MatTableDataSource(
            this.incomeExpense?.incomes
          );
          this.expenseDataSource = new MatTableDataSource(
            this.incomeExpense?.expenses
          );
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  newIncomeClicked() {
    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result.incomeExpense);
    });
  }

  newExpenseClicked() {
    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      this.updateIncomeExpenseByResponse(result.incomeExpense);
    });
  }

  updateIncomeClicked(item: FinancialViewModel) {
    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedIncome: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result.incomeExpense);
    });
  }

  updateExpenseClicked(item: FinancialViewModel) {
    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedExpense: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      this.updateIncomeExpenseByResponse(result.incomeExpense);
    });
  }

  // updateIncomeClicked() {
  //   const dialogRef = this.dialog.open(UpdateIncomeComponent, {
  //     width: '700px',
  //     disableClose: true,
  //     data: {},
  //   });

  //   dialogRef.afterClosed().subscribe((result: any) => {
  //     console.log('Dialog closed with result:', result);
  //   });
  // }

  // updateExpenseClicked() {
  //   const dialogRef = this.dialog.open(UpdateIncomeComponent, {
  //     width: '700px',
  //     disableClose: true,
  //     data: {},
  //   });

  //   dialogRef.afterClosed().subscribe((result: any) => {
  //     console.log('Dialog closed with result:', result);
  //   });
  // }

  deleteIncome(element: FinancialViewModel) {
    this.incomeExpensesHttpService
      .deleteIncome(this.selectedCashflow.id, element)
      .subscribe((res) => {
        this.updateIncomeExpenseByResponse(res);
      });
  }

  deleteExpense(element: FinancialViewModel) {
    this.incomeExpensesHttpService
      .deleteExpense(this.selectedCashflow.id, element)
      .subscribe((res) => {
        this.updateIncomeExpenseByResponse(res);
      });
  }

  updateIncomeExpenseByResponse(res: IncomeExpense) {
    this.incomeExpense = res;
    this.incomeDataSource = new MatTableDataSource(this.incomeExpense.incomes);
    this.expenseDataSource = new MatTableDataSource(
      this.incomeExpense.expenses
    );
  }

  private calculateSavingsRate() {
    var totalIncome = 0;
    var totalExpense = 0;
    this.incomeExpense.incomes.map(
      (x) => (totalIncome = totalIncome + x.amount.amount)
    );
    this.incomeExpense.expenses.map(
      (x) => (totalExpense = totalExpense + x.amount.amount)
    );
    this.incomeExpense.totalIncome = totalIncome;
    this.incomeExpense.totalExpenses = totalExpense;
    this.incomeExpense.total = totalIncome - totalExpense;

    if (totalIncome === 0) {
      return;
    }
    // return 0; // Avoid division by zero

    var savings =
      this.incomeExpense.totalIncome - this.incomeExpense.totalExpenses;
    return (savings / this.incomeExpense.totalIncome) * 100;
  }
}
