import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddIncomeComponent } from './add-income/add-income.component';
import { MatCardModule } from '@angular/material/card';
import { AddExpenseComponent } from './add-expense/add-expense.component';
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
import { Cycle, EscalationRate, FinancialTimeline } from '../timeline/models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import moment from 'moment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';

@Component({
  selector: 'app-income-expenses',
  imports: [
    MatDialogModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CurrencySymbolPipe,
    ThousandSeparatorPipe,
    ToastrModule,
    TranslateModule
  ],
  providers: [ToastrService],
  templateUrl: './income-expenses.component.html',
  styleUrl: './income-expenses.component.scss',
})
export class IncomeExpensesComponent {
  selectedClient: Client;
  selectedCashflow: Cashflow;
  incomeExpense: IncomeExpense;
  amountCycles: Cycle[];
  escalationRates: EscalationRate[];
  isLoaderVisible = false;
  timeline: FinancialTimeline;
  currency: string;
  // default
  defaultIncomes: FinancialViewModel[];
  defautExpenses: FinancialViewModel[];
  // non default
  incomes: FinancialViewModel[];
  expenses: FinancialViewModel[];
  incomeType: string[] = [];
  expenseType: string[] = [];
  currentYearIncomeSummary = {
    totalIncome: 0,
    totalExpenses: 0,
    total: 0,
    savingRate: 0,
  };

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingHttpService: SettingsHttpService,
    private timelineHttpService: TimelineHttpService,
    private navItemService: NavItemService,
    private toastr: ToastrService
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
              (client as Client).id
            ),
          ]);
        }),
        tap(([incomeExpense, timeline, amountCycles, escalationRatesResponse]) => {
          this.amountCycles = amountCycles;
          this.escalationRates = patchInflationRateDescription(
            escalationRatesResponse?.escalationRates ?? [],
            this.selectedCashflow?.inflationRate ?? 0
          );
          this.applyIncomeExpenseData(incomeExpense, timeline);

          this.currency = this.selectedClient.clientDetails?.preferredCurrency ?? "USD";
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  newIncomeClicked() {
    this.setIncomeType();

    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
        escalataionRates: this.escalationRates,
        incomes: this.incomeExpense?.incomes,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency: this.selectedClient?.clientDetails.preferredCurrency,
        clientCountryCode: this.selectedClient?.clientDetails?.country,
        cashflowId: this.selectedCashflow?.id,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        planEndYear: this.getPlanEndYear(),
        incomeType: this.incomeType
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result?.incomeExpense);
    });
  }

  newExpenseClicked() {
    this.setExpenseType();

    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
        expenses: this.incomeExpense?.expenses,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        planEndYear: this.getPlanEndYear(),
        expenseType: this.expenseType
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result?.incomeExpense);
    });
  }

  updateIncomeClicked(item: FinancialViewModel) {
    if (item.description?.toLowerCase() === 'pension fund')
      return;

    this.setIncomeType();
    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency: this.selectedClient?.clientDetails.preferredCurrency,
        clientCountryCode: this.selectedClient?.clientDetails?.country,
        cashflowId: this.selectedCashflow?.id,
        selectedIncome: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        planEndYear: this.getPlanEndYear(),
        incomeType: this.incomeType
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result?.incomeExpense);
    });
  }

  updateExpenseClicked(item: FinancialViewModel) {
    if (item.description == "Insurance")
      return;

    this.setExpenseType();

    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency: this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedExpense: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        planEndYear: this.getPlanEndYear(),
        expenseType: this.expenseType
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.updateIncomeExpenseByResponse(result?.incomeExpense);
      }
    });
  }

  setIncomeType() {
    this.incomeType = [];

    if (!this.defaultIncomes.find(x => x.description == "Salary")) {
      this.incomeType.push("Salary");
    }
    if (!this.defaultIncomes.find(x => x.description == "State pension")) {
      this.incomeType.push("State pension");
    }
    if (!this.incomes.find(x => x.description == "Rental income")) {
      this.incomeType.push("Rental income");
    }

    this.incomeType.push("Custom");
  }

  setExpenseType() {
    this.expenseType = [];

    if (!this.defautExpenses.find(x => x.description == "Living costs")) {
      this.expenseType.push("Living costs");
    }
    if (!this.defautExpenses.find(x => x.description == "Housing")) {
      this.expenseType.push("Housing");
    }
    if (!this.expenses.find(x => x.description == "Debt repayment")) {
      this.expenseType.push("Debt repayment");
    }

    this.expenseType.push("Custom");
  }

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

  updateIncomeExpenseByResponse(res: IncomeExpense | null) {
    this.activatedRoute.params
      .pipe(
        switchMap(() => {
          return combineLatest([
            this.incomeExpensesHttpService.getAllIncomeExpenses(this.selectedCashflow.id),
            this.timelineHttpService.getTimelinebyCashflowId(this.selectedCashflow.id)
          ]);
        }),
        tap(([incomeExpense, timeline]) => {
          this.applyIncomeExpenseData(incomeExpense, timeline);
        })
      )
      .subscribe();
  }

  private applyIncomeExpenseData(incomeExpense: IncomeExpense, timeline: FinancialTimeline): void {
    this.incomeExpense = incomeExpense;
    this.timeline = timeline;

    this.defaultIncomes = this.incomeExpense.incomes
      .filter(i => i.isDefault == true && i.isIncomeExpenseSource == true)
      .sort((a, b) => {
        if (a.description === 'Salary') return -1;
        if (b.description === 'Salary') return 1;
        return 0;
      });
    this.defautExpenses = this.incomeExpense.expenses
      .filter(i => i.isDefault == true && i.isIncomeExpenseSource == true)
      .sort((a, b) => {
        if (a.description === 'Living costs') return -1;
        if (b.description === 'Housing') return 1;
        return 0;
      });

    this.incomes = this.incomeExpense.incomes
      .filter(i => i.isDefault == false && i.isIncomeExpenseSource == true);
    this.expenses = this.incomeExpense.expenses
      .filter(i => (i.isDefault == false && i.isIncomeExpenseSource == true)
        || i.description == "Insurance");

    this.updateCurrentYearIncomeSummary();
  }

  private updateCurrentYearIncomeSummary(): void {
    const totalIncome = this.incomeExpense?.totalIncome ?? 0;
    const totalExpenses = this.incomeExpense?.totalExpenses ?? 0;
    const total = totalIncome - totalExpenses;
    const savingRate = totalIncome === 0 ? 0 : total / totalIncome;

    this.currentYearIncomeSummary = {
      totalIncome,
      totalExpenses,
      total,
      savingRate,
    };
  }

  trackByIncomeId(index: number, item: FinancialViewModel): string | number {
    return item.id ?? item.description;
  }

  trackByExpenseId(index: number, item: FinancialViewModel): string | number {
    return item.id ?? item.description;
  }

  getCycle(cycle: string) {
    switch (cycle) {
      case "One-off": return "One-off"
      case "Every year": return "year";
      default: return "month";
    }
  }

  isEditableIncome(name: string): boolean {
    if (name?.toLowerCase() === 'pension fund')
      return false;

    return true;
  }

  isEditableExpense(name: string): boolean {
    if (name == "Insurance")
      return false;

    return true;
  }

  hasBonusAmount(item: FinancialViewModel): boolean {
    return Number(item?.bonus?.amount?.amount ?? 0) > 0;
  }

  private getPlanEndYear(): number {
    const planDuration = Number(this.selectedCashflow?.planDuration);
    if (Number.isFinite(planDuration) && planDuration > 0 && this.timeline?.forecastStartDate && this.selectedClient?.clientDetails?.birthDate) {
      const forecastStartDate = new Date(this.timeline.forecastStartDate);
      const forecastStartYear = forecastStartDate.getFullYear();
      const birthDate = new Date(this.selectedClient.clientDetails.birthDate);
      const startAge = this.calculateClientAge(forecastStartDate, birthDate);
      return forecastStartYear + (planDuration - startAge);
    }
    return moment(this.timeline?.forecastEndtDate).year();
  }

  private calculateClientAge(atDate: Date, birthDate: Date): number {
    let age = atDate.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      atDate.getMonth() > birthDate.getMonth() ||
      (atDate.getMonth() === birthDate.getMonth() && atDate.getDate() >= birthDate.getDate());
    if (!hasBirthdayPassed) {
      age--;
    }
    return age;
  }
}
