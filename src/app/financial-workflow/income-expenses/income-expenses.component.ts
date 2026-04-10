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
import { combineLatest, switchMap, tap, forkJoin, of } from 'rxjs';
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
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import moment from 'moment';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { TranslateIncomeExpenseLabelPipe } from 'src/app/core/pipes/translate-income-expense-label.pipe';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';
import { getPlanEndCalendarYear } from 'src/app/shared/utils/client-age-at-reference';
import {
  IncomeDisplayLabelContext,
  isClientSalaryApiDescription,
  isClientStatePensionApiDescription,
  isClientInheritanceApiDescription,
  isPartnerSalaryApiDescription,
  isPartnerStatePensionApiDescription,
  isPartnerInheritanceApiDescription,
  isSalaryTypeForBonus,
} from 'src/app/shared/utils/income-display-label';
import { SavingsPotsHttpService } from '../saving-pots/services/savings-pots-http.service';
import { SavingPotsModel } from '../saving-pots/models/saving-pots.model';
import { WithdrawalsContributionsHttpService } from '../withdrawals-contributions/services/withdrawals-contributions-http.service';
import { WithdrawalsContributions } from '../withdrawals-contributions/model/withdrawals-contributions';
import { InsuranceExpenseTooltipDirective } from './insurance-expense-tooltip/insurance-expense-tooltip.directive';

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
    InsuranceExpenseTooltipDirective,
    CurrencySymbolPipe,
    ThousandSeparatorPipe,
    ToastrModule,
    TranslateModule,
    TranslateIncomeExpenseLabelPipe,
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
  /** For display: separate cards for each default income (ordering when hasPartner). */
  displayDefaultIncomes: Array<{ income: FinancialViewModel }> = [];
  defautExpenses: FinancialViewModel[];
  /** Insurance row: API omits until Protection has cost; placeholder shows €0 until then. */
  insuranceExpenseDisplay: FinancialViewModel;
  /** Non-default expenses for screen: Insurance first, then others (Debt repayment, Custom, …). */
  expensesOrderedForDisplay: FinancialViewModel[] = [];
  hasPartner = false;
  clientFirstName = '';
  partnerFirstName = '';
  // non default
  incomes: FinancialViewModel[];
  expenses: FinancialViewModel[];
  incomeType: string[] = [];
  expenseType: string[] = [];
  savingsPots: SavingPotsModel;
  contributionWithdrawal: WithdrawalsContributions;
  currentYearIncomeSummary = {
    totalIncome: 0,
    totalExpenses: 0,
    total: 0,
    savingRate: 0,
  };

  get incomeDisplayLabelContext(): IncomeDisplayLabelContext {
    return {
      hasPartner: this.hasPartner,
      clientFirstName: this.clientFirstName,
      partnerFirstName: this.partnerFirstName,
    };
  }

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingHttpService: SettingsHttpService,
    private timelineHttpService: TimelineHttpService,
    private toastr: ToastrService,
    private savingsPotsHttpService: SavingsPotsHttpService,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
  ) {
    this.getData();
  }

  getData() {
    this.isLoaderVisible = true;
    (this.activatedRoute.parent?.params ?? this.activatedRoute.params)
      .pipe(
        switchMap((params) =>
          this.financialWorkflowService.loadClientCashflowMetadata(params),
        ),
        tap(([client, cashflow]) => {
          this.selectedClient = client as Client;
          this.selectedCashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          return combineLatest([
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id,
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              (cashflow as Cashflow).id,
            ),
            this.settingHttpService.getAmountCycles(),
            this.settingHttpService.getEscalationRates((client as Client).id),
            this.savingsPotsHttpService.getAllSavingsPots(
              (cashflow as Cashflow).id,
            ),
            this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions(
              (cashflow as Cashflow).id,
            ),
          ]).pipe(
            switchMap(
              ([
                incomeExpense,
                timeline,
                amountCycles,
                escalationRatesResponse,
                savingsPots,
                contributionsData,
              ]) => {
                const inheritanceEvents = (timeline?.clientEvents ?? []).filter(
                  (e: any) =>
                    (e?.name ?? '').toString().startsWith('Inheritance'),
                );
                if (inheritanceEvents.length === 0) {
                  return of([
                    incomeExpense,
                    timeline,
                    amountCycles,
                    escalationRatesResponse,
                    savingsPots,
                    contributionsData,
                  ]);
                }
                const cashflowId = (cashflow as Cashflow).id;
                const oneOffCycle = (amountCycles ?? []).find(
                  (c: any) => c.description === 'One-off',
                );
                const currency =
                  (incomeExpense as any)?.client?.preferredCurrency ??
                  this.selectedClient?.clientDetails?.preferredCurrency ??
                  'USD';
                return forkJoin(
                  inheritanceEvents.map((ev: any) => {
                    const income: FinancialViewModel = {
                      id: null,
                      description: ev.name ?? 'Inheritance',
                      amount: {
                        amount: ev.netAmount?.amount ?? 0,
                        currencySymbol:
                          ev.netAmount?.currencySymbol ?? currency,
                        cycle: {
                          id: oneOffCycle?.id ?? '',
                          description: 'One-off',
                        },
                      },
                      start: ev.start ?? {
                        year: new Date().getFullYear(),
                        age: 0,
                      },
                      end: ev.start ?? {
                        year: new Date().getFullYear(),
                        age: 0,
                      },
                      escalationRate: null,
                      isDefault: true,
                      isIncomeExpenseSource: true,
                      icon: 'inheritance',
                    };
                    return this.incomeExpensesHttpService
                      .addIncome(cashflowId, income)
                      .pipe(
                        switchMap(() =>
                          this.timelineHttpService.deleteEvent(
                            cashflowId,
                            ev.id,
                          ),
                        ),
                      );
                  }),
                ).pipe(
                  switchMap(() =>
                    combineLatest([
                      this.incomeExpensesHttpService.getAllIncomeExpenses(
                        cashflowId,
                      ),
                      this.timelineHttpService.getTimelinebyCashflowId(
                        cashflowId,
                      ),
                      this.settingHttpService.getAmountCycles(),
                      this.settingHttpService.getEscalationRates(
                        (client as Client).id,
                      ),
                      this.savingsPotsHttpService.getAllSavingsPots(cashflowId),
                      this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions(
                        cashflowId,
                      ),
                    ]),
                  ),
                );
              },
            ),
          );
        }),
        tap((result: any[]) => {
          const [
            incomeExpense,
            timeline,
            amountCycles,
            escalationRatesResponse,
            savingsPots,
            contributionsData,
          ] = result as [
            IncomeExpense,
            FinancialTimeline,
            Cycle[],
            any,
            SavingPotsModel,
            WithdrawalsContributions,
          ];
          this.amountCycles = amountCycles;
          this.escalationRates = patchInflationRateDescription(
            escalationRatesResponse?.escalationRates ?? [],
            this.selectedCashflow?.inflationRate ?? 0,
          );
          this.applyIncomeExpenseData(incomeExpense, timeline);
          this.savingsPots = savingsPots;
          this.contributionWithdrawal = contributionsData;

          this.currency =
            this.selectedClient.clientDetails?.preferredCurrency ?? 'USD';
          this.isLoaderVisible = false;
        }),
      )
      .subscribe();
  }

  newIncomeClicked() {
    this.setIncomeType();

    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => a.start.age - b.start.age,
        ),
        escalataionRates: this.escalationRates,
        incomes: this.incomeExpense?.incomes,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        partnerBirthDate: this.selectedClient?.partnerDetail?.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        clientCountryCode: this.selectedClient?.clientDetails?.country,
        cashflowId: this.selectedCashflow?.id,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        forecastStartDate: this.timeline.forecastStartDate,
        planDuration: this.selectedCashflow?.planDuration,
        planEndYear: this.getPlanEndYear(),
        incomeType: this.incomeType,
        clientSavings: this.savingsPots?.clientSavings ?? [],
        existingContributions: this.contributionWithdrawal?.contributions ?? [],
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName,
        hasPartner: this.hasPartner,
        selectedClient: this.selectedClient,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result?.incomeExpense);
    });
  }

  newExpenseClicked() {
    this.setExpenseType();

    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => a.start.age - b.start.age,
        ),
        expenses: this.incomeExpense?.expenses,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        forecastStartDate: this.timeline.forecastStartDate,
        planDuration: this.selectedCashflow?.planDuration,
        planEndYear: this.getPlanEndYear(),
        expenseType: this.expenseType,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result?.incomeExpense);
    });
  }

  updateIncomeClicked(item: FinancialViewModel) {
    if (item.description?.toLowerCase() === 'pension fund') return;

    this.setIncomeType();
    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => a.start.age - b.start.age,
        ),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        partnerBirthDate: this.selectedClient?.partnerDetail?.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        clientCountryCode: this.selectedClient?.clientDetails?.country,
        cashflowId: this.selectedCashflow?.id,
        selectedIncome: item,
        isEditWorkflow: true,
        incomes: this.incomeExpense?.incomes,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        forecastStartDate: this.timeline.forecastStartDate,
        planDuration: this.selectedCashflow?.planDuration,
        planEndYear: this.getPlanEndYear(),
        incomeType: this.incomeType,
        clientSavings: this.savingsPots?.clientSavings ?? [],
        existingContributions: this.contributionWithdrawal?.contributions ?? [],
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName,
        hasPartner: this.hasPartner,
        selectedClient: this.selectedClient,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateIncomeExpenseByResponse(result?.incomeExpense);
    });
  }

  updateExpenseClicked(item: FinancialViewModel) {
    if (item.description == 'Insurance') return;

    this.setExpenseType();

    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => a.start.age - b.start.age,
        ),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedExpense: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        forecastStartDate: this.timeline.forecastStartDate,
        planDuration: this.selectedCashflow?.planDuration,
        planEndYear: this.getPlanEndYear(),
        expenseType: this.expenseType,
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

    const cName = this.clientFirstName || 'Client';
    const pName = this.partnerFirstName || 'Partner';

    if (!this.defaultIncomes.find((x) => x.description == 'Salary')) {
      this.incomeType.push(this.hasPartner ? `Salary ${cName}` : 'Salary');
    }
    if (
      this.hasPartner &&
      !this.defaultIncomes.find((x) => isPartnerSalaryApiDescription(x.description))
    ) {
      this.incomeType.push(`Salary ${pName}`);
    }
    if (!this.defaultIncomes.find((x) => x.description == 'State pension')) {
      this.incomeType.push(this.hasPartner ? `State pension ${cName}` : 'State pension');
    }
    if (
      this.hasPartner &&
      !this.defaultIncomes.find((x) =>
        isPartnerStatePensionApiDescription(x.description),
      )
    ) {
      this.incomeType.push(`State pension ${pName}`);
    }
    if (!this.incomes.find((x) => x.description == 'Rental income')) {
      this.incomeType.push('Rental income');
    }
    if (!this.defaultIncomes.find((x) => isClientInheritanceApiDescription(x.description))) {
      this.incomeType.push(this.hasPartner ? `Inheritance ${cName}` : 'Inheritance');
    }
    if (
      this.hasPartner &&
      !this.defaultIncomes.find((x) => isPartnerInheritanceApiDescription(x.description))
    ) {
      this.incomeType.push(`Inheritance ${pName}`);
    }

    this.incomeType.push('Custom');
  }

  setExpenseType() {
    this.expenseType = [];

    if (!this.defautExpenses.find((x) => x.description == 'Living costs')) {
      this.expenseType.push('Living costs');
    }
    if (!this.defautExpenses.find((x) => x.description == 'Housing')) {
      this.expenseType.push('Housing');
    }
    if (!this.expenses.find((x) => x.description == 'Debt repayment')) {
      this.expenseType.push('Debt repayment');
    }

    this.expenseType.push('Custom');
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
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              this.selectedCashflow.id,
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              this.selectedCashflow.id,
            ),
            this.savingsPotsHttpService.getAllSavingsPots(
              this.selectedCashflow.id,
            ),
            this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions(
              this.selectedCashflow.id,
            ),
          ]);
        }),
        tap(([incomeExpense, timeline, savingsPots, contributionsData]) => {
          this.applyIncomeExpenseData(incomeExpense, timeline);
          this.savingsPots = savingsPots;
          this.contributionWithdrawal = contributionsData;
        }),
      )
      .subscribe();
  }

  private applyIncomeExpenseData(
    incomeExpense: IncomeExpense,
    timeline: FinancialTimeline,
  ): void {
    this.incomeExpense = incomeExpense;
    this.timeline = timeline;

    this.hasPartner = !!this.selectedClient?.partnerDetail;
    this.clientFirstName = this.selectedClient?.clientDetails?.firstName ?? '';
    this.partnerFirstName = this.selectedClient?.partnerDetail?.firstName ?? '';

    const allDefault = this.incomeExpense.incomes
      .filter((i) => i.isDefault == true && i.isIncomeExpenseSource == true)
      .sort((a, b) => {
        if (a.description === 'Salary') return -1;
        if (b.description === 'Salary') return 1;
        if (a.description === 'State pension') return -1;
        if (b.description === 'State pension') return 1;
        return 0;
      });

    this.defaultIncomes = allDefault;

    // Build display items: merge client+partner for Salary and State pension when hasPartner
    this.displayDefaultIncomes = this.buildDisplayDefaultIncomes(allDefault);
    this.defautExpenses = this.incomeExpense.expenses
      .filter((i) => i.isDefault == true && i.isIncomeExpenseSource == true)
      .sort((a, b) => {
        if (a.description === 'Living costs') return -1;
        if (b.description === 'Housing') return 1;
        return 0;
      });

    this.incomes = this.incomeExpense.incomes.filter(
      (i) => i.isDefault == false && i.isIncomeExpenseSource == true,
    );

    const currency =
      this.selectedClient?.clientDetails?.preferredCurrency ??
      this.incomeExpense.expenses.find((e) => e?.amount?.currencySymbol)
        ?.amount?.currencySymbol ??
      'USD';

    const apiInsurance = this.incomeExpense.expenses.find(
      (e) => e.description === 'Insurance',
    );
    this.insuranceExpenseDisplay =
      apiInsurance ?? this.createPlaceholderInsuranceExpense(currency);

    this.expenses = this.incomeExpense.expenses.filter(
      (i) =>
        i.description !== 'Insurance' &&
        i.isDefault == false &&
        i.isIncomeExpenseSource == true,
    );

    this.expensesOrderedForDisplay = [
      this.insuranceExpenseDisplay,
      ...this.expenses,
    ];

    this.updateCurrentYearIncomeSummary();
  }

  private createPlaceholderInsuranceExpense(
    currencySymbol: string,
  ): FinancialViewModel {
    const year = moment(this.timeline?.forecastStartDate).year();
    const startYear = Number.isFinite(year) ? year : new Date().getFullYear();
    const yearlyCycle = this.amountCycles?.find(
      (c) => c.description === 'Every year',
    );
    return {
      id: null,
      description: 'Insurance',
      amount: {
        amount: 0,
        currencySymbol,
        cycle: yearlyCycle
          ? { id: yearlyCycle.id, description: yearlyCycle.description }
          : { id: '', description: 'Every year' },
      },
      start: { year: startYear, age: 0 },
      end: { year: startYear, age: 0 },
      escalationRate: null,
      isDefault: false,
      isIncomeExpenseSource: true,
      icon: 'insurance',
    };
  }

  private buildDisplayDefaultIncomes(
    allDefault: FinancialViewModel[],
  ): Array<{ income: FinancialViewModel }> {
    const result: Array<{ income: FinancialViewModel }> = [];
    const clientSalary = allDefault.find((i) =>
      isClientSalaryApiDescription(i.description),
    );
    const partnerSalary = allDefault.find((i) =>
      isPartnerSalaryApiDescription(i.description),
    );
    const clientPension = allDefault.find((i) =>
      isClientStatePensionApiDescription(i.description),
    );
    const partnerPension = allDefault.find((i) =>
      isPartnerStatePensionApiDescription(i.description),
    );
    const clientInheritance = allDefault.find((i) =>
      isClientInheritanceApiDescription(i.description),
    );
    const partnerInheritance = allDefault.find((i) =>
      isPartnerInheritanceApiDescription(i.description),
    );

    const pushIncome = (income: FinancialViewModel) => {
      result.push({ income });
    };

    if (this.hasPartner) {
      if (clientSalary) pushIncome(clientSalary);
      if (partnerSalary) pushIncome(partnerSalary);
      if (clientPension) pushIncome(clientPension);
      if (partnerPension) pushIncome(partnerPension);
      if (clientInheritance) pushIncome(clientInheritance);
      if (partnerInheritance) pushIncome(partnerInheritance);
      const used = new Set(
        [clientSalary, partnerSalary, clientPension, partnerPension, clientInheritance, partnerInheritance]
          .filter(Boolean)
          .map((i) => i!.id ?? `desc:${i!.description}`),
      );
      for (const item of allDefault) {
        const key = item.id ?? `desc:${item.description}`;
        if (!used.has(key)) {
          used.add(key);
          pushIncome(item);
        }
      }
    } else {
      for (const item of allDefault) {
        pushIncome(item);
      }
    }
    return result;
  }

  trackByDisplayIncomeId(
    index: number,
    item: { income: FinancialViewModel },
  ): string {
    return item.income.id ?? item.income.description ?? String(index);
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

  /** i18n key for the short frequency after "/" (e.g. +€1.000/mese). */
  getCycleLabelKey(cycle: string | undefined): string {
    switch (cycle) {
      case 'One-off':
        return 'INCOME_EXPENSE.FREQUENCY.ONE_OFF';
      case 'Every year':
        return 'INCOME_EXPENSE.FREQUENCY.YEAR';
      default:
        return 'INCOME_EXPENSE.FREQUENCY.MONTH';
    }
  }

  isEditableIncome(name: string): boolean {
    if (name?.toLowerCase() === 'pension fund') return false;

    return true;
  }

  isEditableExpense(name: string): boolean {
    if (name == 'Insurance') return false;

    return true;
  }

  hasBonusAmount(item: FinancialViewModel): boolean {
    return Number(item?.bonus?.amount?.amount ?? 0) > 0;
  }

  isSalaryIncomeForBonus(description: string | null | undefined): boolean {
    return isSalaryTypeForBonus(description);
  }

  private getPlanEndYear(): number {
    const planDuration = Number(this.selectedCashflow?.planDuration);
    if (
      Number.isFinite(planDuration) &&
      planDuration > 0 &&
      this.timeline?.forecastStartDate &&
      this.selectedClient?.clientDetails?.birthDate
    ) {
      const forecastStartYear = new Date(
        this.timeline.forecastStartDate,
      ).getFullYear();
      const planEndYear = getPlanEndCalendarYear(
        this.selectedClient.clientDetails.birthDate,
        planDuration,
      );
      if (planEndYear != null) {
        return Math.max(forecastStartYear, planEndYear);
      }
    }
    return moment(this.timeline?.forecastEndtDate).year();
  }
}
