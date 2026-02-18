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
import { FundsViewModel, WithdrawalsContributions } from './model/withdrawals-contributions';
import {
  Cycle,
  EscalationRate,
  FinancialTimeline,
} from '../timeline/models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import moment from 'moment';
import { SavingsPotsHttpService } from '../saving-pots/services/savings-pots-http.service';
import { SavingPotsModel } from '../saving-pots/models/saving-pots.model';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { IncomeExpensesHttpService } from '../income-expenses/services/income-expenses-http.service';
import { FinancialViewModel, IncomeExpense } from '../income-expenses/model/income-expense';

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
    TranslateModule
  ],
  providers: [ToastrService],
  selector: 'app-withdrawals-contributions',
  templateUrl: './withdrawals-contributions.component.html',
  styleUrl: './withdrawals-contributions.component.scss',
})
export class WithdrawalsContributionsComponent {
  displayedColumns: string[] = ['position', 'name', 'action'];
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

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private savingsPotsHttpService: SavingsPotsHttpService,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingHttpService: SettingsHttpService,
    private timelineHttpService: TimelineHttpService,
    private navItemService: NavItemService,
    private toastr: ToastrService
  ) {
    this.navItemService.currentRouteName = 'Contributions & Withdrawals';
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
            this.withdrawalsContributionsHttpService.getAllWithdrawalsContributions(
              (cashflow as Cashflow).id
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              (cashflow as Cashflow).id
            ),
            this.settingHttpService.getAmountCycles(),
            this.settingHttpService.getEscalationRates(
              (client as Client).id
            ),
            this.savingsPotsHttpService.getAllSavingsPots(
              (cashflow as Cashflow).id
            ),
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id
            ),
          ]);
        }),
        tap(([contributionWithdrawal, timeline, amountCycles, escalationRatesResponse, savingsPots, incomeExpense]) => {
          this.contributionWithdrawal = contributionWithdrawal;
          this.amountCycles = amountCycles;
          this.escalationRates = escalationRatesResponse?.escalationRates;
          this.timeline = timeline;
          this.savingsPots = savingsPots;
          this.incomeExpense = incomeExpense;
          this.rebuildSavingPotNameMap();

          this.contributionDataSource = new MatTableDataSource(
            this.contributionWithdrawal?.contributions
          );
          this.withdrawalDataSource = new MatTableDataSource(
            this.contributionWithdrawal?.withdrawals
          );
          this.updateContributionSummary();
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  newContributionClicked() {
    if (this.savingsPots.clientSavings.length === 0 ||
        (this.savingsPots.clientSavings.length === 1 && 
          this.savingsPots.clientSavings[0].name.toLowerCase() === 'cash'))
    {
      this.toastr.error('Before adding this, please create a new Saving Pot', 'Error!', { timeOut: 5000 });
    }    
    else {
      const dialogRef = this.dialog.open(AddContributionComponent, {
        width: '700px',
        disableClose: true,
        data: {
          eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
          amountCycles: this.amountCycles,
          escalataionRates: this.escalationRates,
          clientBirthDate: this.selectedClient?.clientDetails.birthDate,
          clientPreferredCurrency:
            this.selectedClient?.clientDetails.preferredCurrency,
          cashflowId: this.selectedCashflow?.id,
          forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
          forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
          savingPots: this.savingsPots,
          existingContributions: this.contributionWithdrawal?.contributions ?? []
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        this.updateContributionWithdrawalByResponse(result.contributionWithdrawal);
      });
    }
  }

  newWithdrawalClicked() {
    if (this.savingsPots.clientSavings.length === 0 ||
        (this.savingsPots.clientSavings.length === 1 && 
          this.savingsPots.clientSavings[0].name.toLowerCase() === 'cash'))
    {
      this.toastr.error('Before adding this, please create a new Saving Pot', 'Error!', { timeOut: 5000 });
    }    
    else {
      const dialogRef = this.dialog.open(AddWithdrawalComponent, {
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
          savingPots: this.savingsPots,
          existingWithdrawals: this.contributionWithdrawal?.withdrawals ?? []
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        this.updateContributionWithdrawalByResponse(result.contributionWithdrawal);
      });
    }
  }

  updateContributionClicked(item: FundsViewModel) {
    const dialogRef = this.dialog.open(AddContributionComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedContribution: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        savingPots: this.savingsPots,
        existingContributions: this.contributionWithdrawal?.contributions ?? []
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.updateContributionWithdrawalByResponse(result.contributionWithdrawal);
    });
  }

  updateWithdrawalClicked(item: FundsViewModel) {
    const dialogRef = this.dialog.open(AddWithdrawalComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        cashflowId: this.selectedCashflow?.id,
        selectedWithdrawal: item,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        savingPots: this.savingsPots,
        existingWithdrawals: this.contributionWithdrawal?.withdrawals ?? []
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      this.updateContributionWithdrawalByResponse(result.contributionWithdrawal);
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
    this.withdrawalsContributionsHttpService
      .deleteContributions(this.selectedCashflow.id, element)
      .subscribe((res) => {
        this.updateContributionWithdrawalByResponse(res);
      });
  }

  deleteWithdrawal(element: FundsViewModel) {
    this.withdrawalsContributionsHttpService
      .deleteWithdrawals(this.selectedCashflow.id, element)
      .subscribe((res) => {
        this.updateContributionWithdrawalByResponse(res);
      });
  }

  updateContributionWithdrawalByResponse(res: WithdrawalsContributions) {
    this.contributionWithdrawal = res;
    this.contributionDataSource = new MatTableDataSource(this.contributionWithdrawal.contributions);
    this.withdrawalDataSource = new MatTableDataSource(
      this.contributionWithdrawal.withdrawals
    );
    this.updateContributionSummary();
  }

  getContributionDisplayDescription(item: FundsViewModel): string {
    return this.getDisplayDescription(item, 'contribution');
  }

  getWithdrawalDisplayDescription(item: FundsViewModel): string {
    return this.getDisplayDescription(item, 'withdrawal');
  }

  private getDisplayDescription(
    item: FundsViewModel,
    type: 'contribution' | 'withdrawal'
  ): string {
    const currentDescription = (item?.description ?? '').toString().trim();
    const potId = (item?.associatedSavingPotId ?? '').toString();
    const potName = this.savingPotNameById[potId];
    const prefix = type === 'contribution' ? 'Contribution to' : 'Withdrawal from';

    if (!potName) {
      return currentDescription;
    }

    const isAutoGenerated =
      currentDescription === '' ||
      currentDescription === prefix ||
      currentDescription.startsWith(`${prefix} `);

    if (!isAutoGenerated) {
      return currentDescription;
    }

    return `${prefix} ${potName}`;
  }

  private rebuildSavingPotNameMap(): void {
    const map: Record<string, string> = {};
    for (const pot of this.savingsPots?.clientSavings ?? []) {
      if (!pot?.id) continue;
      map[pot.id] = (pot.name ?? '').toString();
    }
    this.savingPotNameById = map;
  }

  private updateContributionSummary(): void {
    const currentYear = this.timeline
      ? moment(this.timeline.forecastStartDate).year()
      : new Date().getFullYear();

    const activeIncomes = (this.incomeExpense?.incomes ?? [])
      .filter((item) => this.isIncludedIncome(item) && this.isHappeningInYear(item, currentYear));

    const activeExpenses = (this.incomeExpense?.expenses ?? [])
      .filter((item) => this.isIncludedExpense(item) && this.isHappeningInYear(item, currentYear));

    const totalIncome = activeIncomes.reduce(
      (sum, item) => sum + this.getYearAmount(item, currentYear),
      0
    );
    const totalExpenses = activeExpenses.reduce(
      (sum, item) => sum + this.getYearAmount(item, currentYear),
      0
    );

    const total = totalIncome - totalExpenses;
    const savingRate =
      totalIncome === 0 ? 0 : (total / totalIncome) * 100;

    this.contributionSummary = {
      total,
      savingRate,
      totalContributions: totalIncome,
      totalWithdrawals: totalExpenses,
    };
  }

  private isIncludedIncome(item: FinancialViewModel): boolean {
    return item?.isIncomeExpenseSource === true || item?.description?.toLowerCase() === 'pension fund';
  }

  private isIncludedExpense(item: FinancialViewModel): boolean {
    return item?.isIncomeExpenseSource === true || item?.description === 'Insurance';
  }

  private isHappeningInYear(item: FinancialViewModel, year: number): boolean {
    const startYear = Number(item?.start?.year ?? 0);
    const endYearRaw = Number(item?.end?.year ?? 0);
    const hasEnd = endYearRaw > 0;
    const cycleDescription = (item?.amount?.cycle?.description ?? '').toString().toLowerCase();
    const isOneOff = cycleDescription === 'one-off';

    // If no start year is set, treat the item as currently active
    if (!startYear) return !isOneOff;
    if (isOneOff) {
      return startYear === year;
    }

    if (year < startYear) return false;
    if (hasEnd && year > endYearRaw) return false;
    return true;
  }

  private getYearAmount(item: FinancialViewModel, year: number): number {
    const baseAmount = Number(item?.amount?.amount ?? 0);
    const cycleDescription = (item?.amount?.cycle?.description ?? '').toString().toLowerCase();

    let yearlyAmount = cycleDescription.includes('month') ? baseAmount * 12 : baseAmount;

    if (item?.bonus?.enabled && Number(item?.bonus?.amount?.amount ?? 0) > 0) {
      const bonusCycleDesc = (item.bonus.amount.cycle?.description ?? '').toLowerCase();
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
        } else {
          yearlyAmount += bonusAmount;
        }
      }
    }

    return yearlyAmount;
  }
}
