import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddContributionComponent } from './add-contribution/add-contribution.component';
import { MatCardModule } from '@angular/material/card';
import { AddWithdrawalComponent } from './add-withdrawal/add-withdrawal.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { combineLatest, switchMap, tap } from 'rxjs';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { WithdrawalsContributionsHttpService } from './services/withdrawals-contributions-http.service';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import {
  FundsViewModel,
  WithdrawalsContributions,
} from './model/withdrawals-contributions';
import {
  Cycle,
  EscalationRate,
  FinancialTimeline,
} from '../timeline/models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import moment from 'moment';
import { SavingsPotsHttpService } from '../saving-pots/services/savings-pots-http.service';
import { SavingPotsModel } from '../saving-pots/models/saving-pots.model';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IncomeExpensesHttpService } from '../income-expenses/services/income-expenses-http.service';
import {
  FinancialViewModel,
  IncomeExpense,
} from '../income-expenses/model/income-expense';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';
import { InsuranceExpenseTooltipDirective } from '../income-expenses/insurance-expense-tooltip/insurance-expense-tooltip.directive';
import { SavingPotType } from '../saving-pots/models/saving-pots.model';

@Component({
  imports: [
    MatDialogModule,
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CurrencySymbolPipe,
    MatTooltipModule,
    ThousandSeparatorPipe,
    ToastrModule,
    TranslateModule,
    InsuranceExpenseTooltipDirective,
  ],
  providers: [ToastrService],
  selector: 'app-withdrawals-contributions',
  templateUrl: './withdrawals-contributions.component.html',
  styleUrl: './withdrawals-contributions.component.scss',
})
export class WithdrawalsContributionsComponent {
  displayedColumns: string[] = ['position', 'name', 'startEnd', 'action'];
  contributionDataSource: MatTableDataSource<FundsViewModel> =
    new MatTableDataSource(new Array<FundsViewModel>());
  withdrawalDataSource: MatTableDataSource<FundsViewModel> =
    new MatTableDataSource(new Array<FundsViewModel>());
  selectedClient: Client;
  selectedCashflow: Cashflow;
  contributionWithdrawal: WithdrawalsContributions;
  amountCycles: Cycle[];
  escalationRates: EscalationRate[];
  isLoaderVisible = false;
  timeline: FinancialTimeline;
  savingsPots: SavingPotsModel;
  incomeExpense: IncomeExpense;
  contributionSummary = {
    total: 0,
    savingRate: 0,
    totalContributions: 0,
    totalWithdrawals: 0,
  };
  private savingPotNameById: Record<string, string> = {};
  private savingPotTypeById: Record<string, SavingPotType> = {};

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private savingsPotsHttpService: SavingsPotsHttpService,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingHttpService: SettingsHttpService,
    private timelineHttpService: TimelineHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
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
          console.log(cashflow);
          this.selectedCashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          return combineLatest([
            this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions(
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
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id,
            ),
          ]);
        }),
        tap(
          ([
            contributionWithdrawal,
            timeline,
            amountCycles,
            escalationRatesResponse,
            savingsPots,
            incomeExpense,
          ]) => {
            this.contributionWithdrawal = contributionWithdrawal;
            this.amountCycles = amountCycles;
            this.escalationRates = patchInflationRateDescription(
              escalationRatesResponse?.escalationRates ?? [],
              this.selectedCashflow?.inflationRate ?? 0,
            );
            this.timeline = timeline;
            this.savingsPots = savingsPots;
            this.incomeExpense = incomeExpense;
            this.rebuildSavingPotNameMap();

            this.contributionDataSource = new MatTableDataSource(
              this.contributionWithdrawal?.contributions,
            );
            this.withdrawalDataSource = new MatTableDataSource(
              this.contributionWithdrawal?.withdrawals,
            );
            this.updateContributionSummary();
            this.isLoaderVisible = false;
          },
        ),
      )
      .subscribe({
        error: (err) => {
          this.isLoaderVisible = false;
          console.error('[WithdrawalsContributions] getData failed:', err);
        },
      });
  }

  newContributionClicked() {
    if (
      this.savingsPots.clientSavings.length === 0 ||
      (this.savingsPots.clientSavings.length === 1 &&
        this.savingsPots.clientSavings[0].name.toLowerCase() === 'cash')
    ) {
      this.toastr.error(
        this.translate.instant('FLOWS.CREATE_SAVING_POT_FIRST'),
        this.translate.instant('LABEL.ERROR'),
        { timeOut: 5000 },
      );
    } else {
      const dialogRef = this.dialog.open(AddContributionComponent, {
        width: '612px',
        disableClose: true,
        data: {
          eventsList: this.timeline.clientEvents.sort(
            (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
          ),
          amountCycles: this.amountCycles,
          escalataionRates: this.escalationRates,
          clientBirthDate: this.selectedClient?.clientDetails.birthDate,
          clientPreferredCurrency:
            this.selectedClient?.clientDetails.preferredCurrency,
          cashflowId: this.selectedCashflow?.id,
          forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
          forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
          forecastStartDate: this.timeline.forecastStartDate,
          planDuration: this.selectedCashflow?.planDuration,
          savingPots: this.savingsPots,
          selectedClient: this.selectedClient,
          existingContributions:
            this.contributionWithdrawal?.contributions ?? [],
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        this.updateContributionWithdrawalByResponse(
          result.contributionWithdrawal,
        );
      });
    }
  }

  newWithdrawalClicked() {
    if (
      this.savingsPots.clientSavings.length === 0 ||
      (this.savingsPots.clientSavings.length === 1 &&
        this.savingsPots.clientSavings[0].name.toLowerCase() === 'cash')
    ) {
      this.toastr.error(
        this.translate.instant('FLOWS.CREATE_SAVING_POT_FIRST'),
        this.translate.instant('LABEL.ERROR'),
        { timeOut: 5000 },
      );
    } else {
      const dialogRef = this.dialog.open(AddWithdrawalComponent, {
        width: '612px',
        disableClose: true,
        data: {
          amountCycles: this.amountCycles,
          eventsList: this.timeline.clientEvents.sort(
            (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
          ),
          escalataionRates: this.escalationRates,
          clientBirthDate: this.selectedClient?.clientDetails.birthDate,
          clientPreferredCurrency:
            this.selectedClient?.clientDetails.preferredCurrency,
          cashflowId: this.selectedCashflow?.id,
          forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
          forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
          forecastStartDate: this.timeline.forecastStartDate,
          planDuration: this.selectedCashflow?.planDuration,
          savingPots: this.savingsPots,
          selectedClient: this.selectedClient,
          existingWithdrawals: this.contributionWithdrawal?.withdrawals ?? [],
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        this.updateContributionWithdrawalByResponse(
          result.contributionWithdrawal,
        );
      });
    }
  }

  isPensionFundItem(item: FundsViewModel): boolean {
    return this.savingPotTypeById[item?.associatedSavingPotId] === SavingPotType.PensionFund;
  }

  isNonEditableItem(item: FundsViewModel): boolean {
    return !!item.sourceIncomeId || this.isPensionFundItem(item);
  }

  updateContributionClicked(item: FundsViewModel) {
    if (item.sourceIncomeId) {
      this.toastr.info('Edit from Incomes section', 'View only');
      return;
    }
    if (this.isPensionFundItem(item)) {
      this.toastr.info(
        this.translate.instant('FLOWS.PENSION_FUND_CONTRIBUTION_TOOLTIP'),
        this.translate.instant('LABEL.VIEW_ONLY', { defaultValue: 'View only' }),
      );
      return;
    }
    const dialogRef = this.dialog.open(AddContributionComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
        ),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedContribution: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        forecastStartDate: this.timeline.forecastStartDate,
        planDuration: this.selectedCashflow?.planDuration,
        savingPots: this.savingsPots,
        selectedClient: this.selectedClient,
        existingContributions: this.contributionWithdrawal?.contributions ?? [],
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateContributionWithdrawalByResponse(
        result.contributionWithdrawal,
      );
    });
  }

  updateWithdrawalClicked(item: FundsViewModel) {
    if (this.isPensionFundItem(item)) {
      this.toastr.info(
        this.translate.instant('FLOWS.PENSION_FUND_WITHDRAWAL_TOOLTIP'),
        this.translate.instant('LABEL.VIEW_ONLY', { defaultValue: 'View only' }),
      );
      return;
    }
    const dialogRef = this.dialog.open(AddWithdrawalComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
        ),
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedWithdrawal: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        forecastStartDate: this.timeline.forecastStartDate,
        planDuration: this.selectedCashflow?.planDuration,
        savingPots: this.savingsPots,
        selectedClient: this.selectedClient,
        existingWithdrawals: this.contributionWithdrawal?.withdrawals ?? [],
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      this.updateContributionWithdrawalByResponse(
        result.contributionWithdrawal,
      );
    });
  }

  // updateContributionClicked() {
  //   const dialogRef = this.dialog.open(UpdateContributionComponent, {
  //     width: '700px',
  //     disableClose: true,
  //     data: {},
  //   });

  //   dialogRef.afterClosed().subscribe((result: any) => {
  //     console.log('Dialog closed with result:', result);
  //   });
  // }

  // updateWithdrawalClicked() {
  //   const dialogRef = this.dialog.open(UpdateContributionComponent, {
  //     width: '700px',
  //     disableClose: true,
  //     data: {},
  //   });

  //   dialogRef.afterClosed().subscribe((result: any) => {
  //     console.log('Dialog closed with result:', result);
  //   });
  // }

  deleteContribution(element: FundsViewModel) {
    if (element.sourceIncomeId) {
      this.toastr.info('Edit from Incomes section to remove', 'View only');
      return;
    }
    if (this.isPensionFundItem(element)) {
      this.toastr.info(
        this.translate.instant('FLOWS.PENSION_FUND_CONTRIBUTION_TOOLTIP'),
        this.translate.instant('LABEL.VIEW_ONLY', { defaultValue: 'View only' }),
      );
      return;
    }
    this.withdrawalsContributionsHttpService
      .deleteContributions(this.selectedCashflow.id, element)
      .subscribe((res) => {
        this.updateContributionWithdrawalByResponse(res);
      });
  }

  deleteWithdrawal(element: FundsViewModel) {
    if (this.isPensionFundItem(element)) {
      this.toastr.info(
        this.translate.instant('FLOWS.PENSION_FUND_WITHDRAWAL_TOOLTIP'),
        this.translate.instant('LABEL.VIEW_ONLY', { defaultValue: 'View only' }),
      );
      return;
    }
    this.withdrawalsContributionsHttpService
      .deleteWithdrawals(this.selectedCashflow.id, element)
      .subscribe((res) => {
        this.updateContributionWithdrawalByResponse(res);
      });
  }

  updateContributionWithdrawalByResponse(res: WithdrawalsContributions) {
    this.contributionWithdrawal = res;
    this.contributionDataSource = new MatTableDataSource(
      this.contributionWithdrawal.contributions,
    );
    this.withdrawalDataSource = new MatTableDataSource(
      this.contributionWithdrawal.withdrawals,
    );
    this.updateContributionSummary();
  }

  getStartEndLabel(item: FundsViewModel): string {
    const startYear = item.start?.year ?? 0;
    const endYear = item.end?.year ?? 0;
    const startAge = item.start?.age ?? 0;
    const endAge = item.end?.age ?? 0;

    const startStr = startYear > 0 && startAge > 0
      ? `${startYear} (${startAge})`
      : startYear > 0 ? `${startYear}` : '–';
    const endStr = endYear > 0 && endAge > 0
      ? `${endYear} (${endAge})`
      : endYear > 0 ? `${endYear}` : '–';

    return `${startStr} → ${endStr}`;
  }

  getContributionDisplayDescription(item: FundsViewModel): string {
    return this.getDisplayDescription(item, 'contribution');
  }

  getWithdrawalDisplayDescription(item: FundsViewModel): string {
    return this.getDisplayDescription(item, 'withdrawal');
  }

  private getDisplayDescription(
    item: FundsViewModel,
    type: 'contribution' | 'withdrawal',
  ): string {
    const currentDescription = (item?.description ?? '').toString().trim();
    const potId = (item?.associatedSavingPotId ?? '').toString();
    const potNameRaw = potId ? this.savingPotNameById[potId] : '';
    const localizedPotName = potNameRaw
      ? this.translate.instant(potNameRaw)
      : '';

    /** Canonical English phrases persisted by the app / API; localized at display time. */
    if (type === 'contribution') {
      const inheritanceMatch =
        /^Inheritance contribution to (.+)$/i.exec(currentDescription);
      if (inheritanceMatch) {
        const potLabel =
          localizedPotName ||
          this.translate.instant(inheritanceMatch[1].trim());
        return this.translate.instant(
          'FLOWS.DISPLAY.INHERITANCE_CONTRIBUTION_TO_POT',
          { pot: potLabel },
        );
      }
    }

    const prefixEn =
      type === 'contribution' ? 'Contribution to' : 'Withdrawal from';
    const templateKey =
      type === 'contribution'
        ? 'FLOWS.DISPLAY.CONTRIBUTION_TO_POT'
        : 'FLOWS.DISPLAY.WITHDRAWAL_FROM_POT';

    if (!potNameRaw) {
      return currentDescription;
    }

    // e.g. pension fund lines: API stores the pot name alone, not "Contribution to …" / "Withdrawal from …"
    if (currentDescription.toLowerCase() === potNameRaw.toLowerCase()) {
      return localizedPotName;
    }

    const isAutoGenerated =
      currentDescription === '' ||
      currentDescription === prefixEn ||
      currentDescription.startsWith(`${prefixEn} `) ||
      currentDescription === `${prefixEn} ${potNameRaw}`;

    if (!isAutoGenerated) {
      return currentDescription;
    }

    return this.translate.instant(templateKey, { pot: localizedPotName });
  }

  private rebuildSavingPotNameMap(): void {
    const nameMap: Record<string, string> = {};
    const typeMap: Record<string, SavingPotType> = {};
    for (const pot of this.savingsPots?.clientSavings ?? []) {
      if (!pot?.id) continue;
      nameMap[pot.id] = (pot.name ?? '').toString();
      typeMap[pot.id] = pot.type;
    }
    this.savingPotNameById = nameMap;
    this.savingPotTypeById = typeMap;
  }

  private updateContributionSummary(): void {
    const currentYear = this.timeline
      ? moment(this.timeline.forecastStartDate).year()
      : new Date().getFullYear();

    const activeIncomes = (this.incomeExpense?.incomes ?? []).filter(
      (item) =>
        this.isIncludedIncome(item) &&
        this.isIncludedInAnnualTotal(item, currentYear),
    );

    const activeExpenses = (this.incomeExpense?.expenses ?? []).filter(
      (item) =>
        this.isIncludedExpense(item) &&
        this.isIncludedInAnnualTotal(item, currentYear),
    );

    const totalIncome = activeIncomes.reduce(
      (sum, item) => sum + this.getYearAmount(item, currentYear),
      0,
    );
    const totalExpenses = activeExpenses.reduce(
      (sum, item) => sum + this.getYearAmount(item, currentYear),
      0,
    );

    const total = totalIncome - totalExpenses;
    const savingRate = totalIncome === 0 ? 0 : (total / totalIncome) * 100;

    this.contributionSummary = {
      total,
      savingRate,
      totalContributions: totalIncome,
      totalWithdrawals: totalExpenses,
    };
  }

  private isIncludedIncome(item: FinancialViewModel): boolean {
    return (
      item?.isIncomeExpenseSource === true ||
      item?.description?.toLowerCase() === 'pension fund'
    );
  }

  private isIncludedExpense(item: FinancialViewModel): boolean {
    return (
      item?.isIncomeExpenseSource === true || item?.description === 'Insurance'
    );
  }

  /**
   * One-off / every year: only when start year equals the target year.
   * Other recurring: start on or before that year, and on or before end year when end is set (aligned with API).
   */
  private isIncludedInAnnualTotal(item: FinancialViewModel, year: number): boolean {
    const cycleDescription = (item?.amount?.cycle?.description ?? '')
      .toString()
      .toLowerCase();
    const isOneOff = cycleDescription === 'one-off';
    const isYearly =
      cycleDescription === 'every year' || cycleDescription === 'yearly';
    const startYear = Number(item?.start?.year ?? 0);
    const endYearRaw = Number(item?.end?.year ?? 0);
    const hasEnd = endYearRaw > 0;

    if (isOneOff || isYearly) {
      return startYear === year;
    }
    if (startYear && year < startYear) return false;
    if (hasEnd && year > endYearRaw) return false;
    return true;
  }

  private getYearAmount(item: FinancialViewModel, year: number): number {
    const baseAmount = Number(item?.amount?.amount ?? 0);
    const cycleDescription = (item?.amount?.cycle?.description ?? '')
      .toString()
      .toLowerCase();

    let yearlyAmount: number;
    if (cycleDescription.includes('month')) {
      yearlyAmount = baseAmount * 12;
    } else if (
      cycleDescription === 'every year' ||
      cycleDescription === 'yearly'
    ) {
      const sy = Number(item?.start?.year ?? 0);
      yearlyAmount = sy === year ? baseAmount : 0;
    } else {
      yearlyAmount = baseAmount;
    }

    if (item?.bonus?.enabled && Number(item?.bonus?.amount?.amount ?? 0) > 0) {
      const bonusCycleDesc = (
        item.bonus.amount.cycle?.description ?? ''
      ).toLowerCase();
      const isBonusOneOff = bonusCycleDesc === 'one-off';

      if (isBonusOneOff) {
        const bonusYear = Number(item.bonus.bonusDate?.year ?? 0);
        if (bonusYear === year) {
          yearlyAmount += Number(item.bonus.amount.amount ?? 0);
        }
      } else {
        const bonusAmount = Number(item.bonus.amount.amount ?? 0);
        if (bonusCycleDesc.includes('month')) {
          yearlyAmount += bonusAmount * 12;
        } else if (
          bonusCycleDesc === 'every year' ||
          bonusCycleDesc === 'yearly'
        ) {
          const sy = Number(item?.start?.year ?? 0);
          if (sy === year) yearlyAmount += bonusAmount;
        } else {
          yearlyAmount += bonusAmount;
        }
      }
    }

    return yearlyAmount;
  }
}
