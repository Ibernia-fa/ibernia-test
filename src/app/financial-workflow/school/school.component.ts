import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Cashflow } from 'src/app/clients/models/cashflow';
import { Client } from 'src/app/clients/models/client';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { SavingsPotsHttpService } from '../saving-pots/services/savings-pots-http.service';
import {
  ClientSaving,
  SavingPotType,
  SavingPotsModel,
} from '../saving-pots/models/saving-pots.model';
import { LearnInflationComponent } from './learn-inflation/learn-inflation.component';
import { LearnCompoundInterestComponent } from './learn-compound-interest/learn-compound-interest.component';
import { LearnCostOfWaitingComponent } from './learn-cost-of-waiting/learn-cost-of-waiting.component';
import { LearnCashBufferComponent } from './learn-cash-buffer/learn-cash-buffer.component';
import { LearnInvestToReachGoalComponent } from './learn-invest-to-reach-goal/learn-invest-to-reach-goal.component';
import { LearnRentOrBuyComponent } from './learn-rent-or-buy/learn-rent-or-buy.component';
import type { LearnRentOrBuyDialogData } from './learn-rent-or-buy/learn-rent-or-buy.types';
import { IncomeExpensesHttpService } from '../income-expenses/services/income-expenses-http.service';
import { FinancialViewModel, IncomeExpense } from '../income-expenses/model/income-expense';
import { getCompletedYearsAgeAtDate } from 'src/app/shared/utils/client-age-at-reference';
import { WealthHttpService } from '../wealth/services/wealth-http.service';
import { WealthAssetModel, WealthDashboardModel } from '../wealth/models/wealth.model';

interface SchoolSlide {
  title: string;
  body: string;
}

interface SchoolModule {
  id: string;
  title: string;
  subtitle: string;
  slides: SchoolSlide[];
}

const DEFAULT_INFLATION_FALLBACK = 2.5;
const DEFAULT_AMOUNT_FALLBACK = 100000;
const DEFAULT_MONTHLY_EXPENSES_FALLBACK = 3000;
@Component({
  selector: 'app-school',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: './school.component.html',
  styleUrl: './school.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolComponent {
  modules: SchoolModule[] = [];
  activeModule: SchoolModule | null = null;
  activeSlideIndex = 0;
  isOpeningInflation = false;
  isOpeningCompound = false;
  isOpeningCostOfWaiting = false;
  isOpeningCashBuffer = false;
  isOpeningInvestToReachGoal = false;
  isOpeningRentOrBuy = false;

  private readonly dialog = inject(MatDialog);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly financialWorkflowService = inject(FinancialWorkflowService);
  private readonly savingsPotsHttpService = inject(SavingsPotsHttpService);
  private readonly incomeExpensesHttpService = inject(IncomeExpensesHttpService);
  private readonly wealthHttpService = inject(WealthHttpService);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private translate: TranslateService) {
    this.modules = [
      {
        id: 'inflation',
        title: this.translate.instant('SCHOOL.INFLATION_TITLE'),
        subtitle: this.translate.instant('SCHOOL.INFLATION_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.INFLATION_TITLE'), body: 'Intro placeholder: explain that prices tend to increase over time in most economies.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: a fixed amount of money buys fewer goods and services as prices rise.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: a coffee that cost 2€ a few years ago might cost 2.40€ today.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: long‑term plans must account for rising living costs.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: inflation slowly erodes purchasing power and needs to be built into plans.' },
        ],
      },
      {
        id: 'compound-interest',
        title: this.translate.instant('SCHOOL.COMPOUND_INTEREST_TITLE'),
        subtitle: this.translate.instant('SCHOOL.COMPOUND_INTEREST_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.COMPOUND_INTEREST_TITLE'), body: 'Intro placeholder: returns can generate additional returns over time.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: interest is earned on both the original amount and past interest.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: 1,000€ growing at 5% per year increases faster each year.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: starting earlier gives compound growth more time to work.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: small differences in rate and time can lead to big outcomes.' },
        ],
      },
      {
        id: 'financial-crisis',
        title: this.translate.instant('SCHOOL.FINANCIAL_CRISIS_TITLE'),
        subtitle: this.translate.instant('SCHOOL.FINANCIAL_CRISIS_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.FINANCIAL_CRISIS_TITLE'), body: 'Intro placeholder: markets can experience sharp, sudden falls.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: crises are usually caused by a shock to confidence or the system.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: describe a short, fictional market drop and recovery path.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: plans should assume that downturns occur from time to time.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: staying invested and diversified can help ride out crises.' },
        ],
      },
      {
        id: 'diversification',
        title: this.translate.instant('SCHOOL.DIVERSIFICATION_TITLE'),
        subtitle: this.translate.instant('SCHOOL.DIVERSIFICATION_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.DIVERSIFICATION_TITLE'), body: 'Intro placeholder: avoid relying on a single investment or idea.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: different assets behave differently in various environments.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: a mix of assets can smooth the journey compared to just one.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: diversification can reduce the impact of any one setback.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: spreading risk supports more resilient long‑term planning.' },
        ],
      },
      {
        id: 'risk-and-return',
        title: this.translate.instant('SCHOOL.RISK_AND_RETURN_TITLE'),
        subtitle: this.translate.instant('SCHOOL.RISK_AND_RETURN_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.RISK_AND_RETURN_TITLE'), body: 'Intro placeholder: higher potential returns usually come with higher risk.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: there is a trade‑off between stability and growth.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: compare a savings account with a diversified investment portfolio.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: clients need a mix that matches their goals and comfort levels.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: risk and return should be discussed in the context of the whole plan.' },
        ],
      },
      {
        id: 'retirement-basics',
        title: this.translate.instant('SCHOOL.RETIREMENT_BASICS_TITLE'),
        subtitle: this.translate.instant('SCHOOL.RETIREMENT_BASICS_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.RETIREMENT_BASICS_TITLE'), body: 'Intro placeholder: retirement is about replacing a salary with other income sources.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: savings, pensions, and other assets need to support future spending.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: outline a simple monthly income need and how assets might cover it.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: early, consistent planning can make retirement choices more flexible.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: the goal is a sustainable income that matches lifestyle and priorities.' },
        ],
      },
    ];
  }

  get hasActiveModule(): boolean {
    return !!this.activeModule;
  }

  get totalSlides(): number {
    return this.activeModule?.slides.length ?? 0;
  }

  get currentSlide(): SchoolSlide | null {
    if (!this.activeModule) return null;
    return this.activeModule.slides[this.activeSlideIndex] ?? null;
  }

  openModule(id: string): void {
    const mod = this.modules.find((m) => m.id === id) ?? null;
    this.activeModule = mod;
    this.activeSlideIndex = 0;
  }

  closeModule(): void {
    this.activeModule = null;
    this.activeSlideIndex = 0;
  }

  nextSlide(): void {
    if (!this.activeModule) return;
    if (this.activeSlideIndex < this.activeModule.slides.length - 1) {
      this.activeSlideIndex += 1;
    }
  }

  previousSlide(): void {
    if (!this.activeModule) return;
    if (this.activeSlideIndex > 0) {
      this.activeSlideIndex -= 1;
    }
  }

  /**
   * Opens the Inflation educational slide. Prefills:
   * - default inflation = current plan's `cashflow.inflationRate`
   *   (falls back to client default, then 2.5%)
   * - default starting amount = sum of all Cash savings across main client,
   *   partner and joint ownership (falls back to a sensible value)
   */
  openInflationLesson(): void {
    if (this.isOpeningInflation) return;
    this.isOpeningInflation = true;

    this.fetchLessonPlanContext$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, cashflow, pots }) => {
          const startingAmount = this.computeTotalCashSavings(pots?.clientSavings ?? []);
          const inflationRate =
            cashflow?.inflationRate ??
            client?.clientDetails?.inflationRate ??
            DEFAULT_INFLATION_FALLBACK;

          this.openInflationDialog({
            startingAmount: startingAmount > 0 ? startingAmount : DEFAULT_AMOUNT_FALLBACK,
            inflationRate,
            currencyCode: client?.clientDetails?.preferredCurrency,
          });
          this.isOpeningInflation = false;
        },
        error: () => {
          this.openInflationDialog({
            startingAmount: DEFAULT_AMOUNT_FALLBACK,
            inflationRate: DEFAULT_INFLATION_FALLBACK,
          });
          this.isOpeningInflation = false;
        },
      });
  }

  /**
   * Compound growth lesson: same cash-savings and inflation defaults as inflation;
   * return rate is handled inside the dialog (5% each time it opens).
   */
  openCompoundInterestLesson(): void {
    if (this.isOpeningCompound) return;
    this.isOpeningCompound = true;

    this.fetchLessonPlanContext$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, cashflow, pots }) => {
          const startingAmount = this.computeTotalCashSavings(pots?.clientSavings ?? []);
          const inflationRate =
            cashflow?.inflationRate ??
            client?.clientDetails?.inflationRate ??
            DEFAULT_INFLATION_FALLBACK;

          this.openCompoundDialog({
            startingAmount: startingAmount > 0 ? startingAmount : DEFAULT_AMOUNT_FALLBACK,
            inflationRate,
            currencyCode: client?.clientDetails?.preferredCurrency,
          });
          this.isOpeningCompound = false;
        },
        error: () => {
          this.openCompoundDialog({
            startingAmount: DEFAULT_AMOUNT_FALLBACK,
            inflationRate: DEFAULT_INFLATION_FALLBACK,
          });
          this.isOpeningCompound = false;
        },
      });
  }

  /**
   * Opportunity cost of delaying investment: same cash-savings prefill and plan inflation
   * as the other School lessons (inflation toggle uses plan inflation when enabled).
   */
  /**
   * Cash buffer lesson: prefills cash savings pots and recurring monthly expenses
   * from Money In & Out (one-off expense lines excluded).
   */
  openCashBufferLesson(): void {
    if (this.isOpeningCashBuffer) return;
    this.isOpeningCashBuffer = true;

    this.fetchCashBufferLessonContext$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, pots, incomeExpense }) => {
          const fromPots = this.computeTotalCashSavings(pots?.clientSavings ?? []);
          const recurring = this.computeMonthlyRecurringExpenses(
            incomeExpense?.expenses,
          );

          this.openCashBufferDialog({
            currentCash:
              fromPots > 0 ? fromPots : DEFAULT_AMOUNT_FALLBACK,
            monthlyRecurringExpenses:
              recurring > 0 ? recurring : DEFAULT_MONTHLY_EXPENSES_FALLBACK,
            currencyCode: client?.clientDetails?.preferredCurrency,
          });
          this.isOpeningCashBuffer = false;
        },
        error: () => {
          this.openCashBufferDialog({
            currentCash: DEFAULT_AMOUNT_FALLBACK,
            monthlyRecurringExpenses: DEFAULT_MONTHLY_EXPENSES_FALLBACK,
          });
          this.isOpeningCashBuffer = false;
        },
      });
  }

  openCostOfWaitingLesson(): void {
    if (this.isOpeningCostOfWaiting) return;
    this.isOpeningCostOfWaiting = true;

    this.fetchLessonPlanContext$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, cashflow, pots }) => {
          const startingAmount = this.computeTotalCashSavings(pots?.clientSavings ?? []);
          const inflationRate =
            cashflow?.inflationRate ??
            client?.clientDetails?.inflationRate ??
            DEFAULT_INFLATION_FALLBACK;

          this.openCostOfWaitingDialog({
            startingAmount: startingAmount > 0 ? startingAmount : DEFAULT_AMOUNT_FALLBACK,
            inflationRate,
            currencyCode: client?.clientDetails?.preferredCurrency,
          });
          this.isOpeningCostOfWaiting = false;
        },
        error: () => {
          this.openCostOfWaitingDialog({
            startingAmount: DEFAULT_AMOUNT_FALLBACK,
            inflationRate: DEFAULT_INFLATION_FALLBACK,
          });
          this.isOpeningCostOfWaiting = false;
        },
      });
  }

  /**
   * Monthly savings needed to reach a goal by a target age; optional real (inflation) view
   * like other School lessons. Age from plan birth date; inflation from cashflow when toggled on.
   */
  openRentOrBuyLesson(): void {
    if (this.isOpeningRentOrBuy) return;
    this.isOpeningRentOrBuy = true;

    this.fetchRentOrBuyLessonContext$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, wealth, incomeExpense }) => {
          const mainHome = this.inferMainResidenceValue(wealth?.assets);
          const rentGuess = this.inferHousingRentMonthly(incomeExpense?.expenses);

          this.openRentOrBuyDialog({
            homePrice: mainHome,
            monthlyRent: rentGuess,
            currencyCode: client?.clientDetails?.preferredCurrency,
          });
          this.isOpeningRentOrBuy = false;
        },
        error: () => {
          this.openRentOrBuyDialog({});
          this.isOpeningRentOrBuy = false;
        },
      });
  }

  openInvestToReachGoalLesson(): void {
    if (this.isOpeningInvestToReachGoal) return;
    this.isOpeningInvestToReachGoal = true;

    this.fetchLessonPlanContext$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ client, cashflow }) => {
          const birthForAge = cashflow?.clientBirthDate ?? client?.clientDetails?.birthDate;
          const currentAge = birthForAge
            ? getCompletedYearsAgeAtDate(birthForAge, new Date())
            : NaN;
          const inflationRate =
            cashflow?.inflationRate ??
            client?.clientDetails?.inflationRate ??
            DEFAULT_INFLATION_FALLBACK;

          this.openInvestToReachGoalDialog({
            currentAge,
            inflationRate,
            currencyCode: client?.clientDetails?.preferredCurrency,
          });
          this.isOpeningInvestToReachGoal = false;
        },
        error: () => {
          this.openInvestToReachGoalDialog({
            currentAge: NaN,
            inflationRate: DEFAULT_INFLATION_FALLBACK,
          });
          this.isOpeningInvestToReachGoal = false;
        },
      });
  }

  private fetchCashBufferLessonContext$(): Observable<{
    client: Client;
    pots: SavingPotsModel;
    incomeExpense: IncomeExpense | null;
  }> {
    const params$ = this.activatedRoute.parent?.params ?? this.activatedRoute.params;
    return params$.pipe(
      take(1),
      switchMap((params) =>
        this.financialWorkflowService.loadClientCashflowMetadata(params).pipe(take(1)),
      ),
      switchMap(([client, cashflow]) =>
        combineLatest([
          this.savingsPotsHttpService.getAllSavingsPots((cashflow as Cashflow).id),
          this.incomeExpensesHttpService
            .getAllIncomeExpenses((cashflow as Cashflow).id)
            .pipe(catchError(() => of(null))),
        ]).pipe(
          take(1),
          map(([pots, incomeExpense]) => ({
            client: client as Client,
            pots: pots as SavingPotsModel,
            incomeExpense: incomeExpense as IncomeExpense | null,
          })),
        ),
      ),
    );
  }

  private fetchRentOrBuyLessonContext$(): Observable<{
    client: Client;
    cashflow: Cashflow;
    wealth: WealthDashboardModel | null;
    incomeExpense: IncomeExpense | null;
  }> {
    const params$ = this.activatedRoute.parent?.params ?? this.activatedRoute.params;
    return params$.pipe(
      take(1),
      switchMap((params) =>
        this.financialWorkflowService.loadClientCashflowMetadata(params).pipe(take(1)),
      ),
      switchMap(([client, cashflow]) =>
        combineLatest([
          this.wealthHttpService
            .getDashboard((cashflow as Cashflow).id)
            .pipe(catchError(() => of(null))),
          this.incomeExpensesHttpService
            .getAllIncomeExpenses((cashflow as Cashflow).id)
            .pipe(catchError(() => of(null))),
        ]).pipe(
          take(1),
          map(([wealth, incomeExpense]) => ({
            client: client as Client,
            cashflow: cashflow as Cashflow,
            wealth,
            incomeExpense: incomeExpense as IncomeExpense | null,
          })),
        ),
      ),
    );
  }

  private fetchLessonPlanContext$(): Observable<{
    client: Client;
    cashflow: Cashflow;
    pots: SavingPotsModel;
  }> {
    const params$ = this.activatedRoute.parent?.params ?? this.activatedRoute.params;
    return params$.pipe(
      take(1),
      switchMap((params) =>
        this.financialWorkflowService.loadClientCashflowMetadata(params).pipe(take(1)),
      ),
      switchMap(([client, cashflow]) =>
        this.savingsPotsHttpService.getAllSavingsPots((cashflow as Cashflow).id).pipe(
          take(1),
          map((pots) => ({
            client: client as Client,
            cashflow: cashflow as Cashflow,
            pots,
          })),
        ),
      ),
    );
  }

  private computeTotalCashSavings(savings: ClientSaving[]): number {
    return savings
      .filter((s) => s.type === SavingPotType.Cash)
      .reduce((acc, s) => acc + (s.startingPotValue?.amount ?? 0), 0);
  }

  /** Sum recurring expenses as an approximate monthly total; excludes one-off lines. */
  private inferMainResidenceValue(assets: WealthAssetModel[] | undefined): number | null {
    if (!assets?.length) return null;
    const realEstate = assets.filter((a) => (a.category || '').toLowerCase().includes('real'));
    if (!realEstate.length) return null;
    const ranked = realEstate
      .map((a) => {
        const label = `${a.name ?? ''} ${a.description ?? ''}`.toLowerCase();
        const score =
          (/primary|main|residence|principal|owner-occupied|home|abitazione/.test(label) ? 2 : 0) +
          (/house|flat|apartment|villa|condo|loft/.test(label) ? 1 : 0);
        return { a, score };
      })
      .sort((x, y) => y.score - x.score || y.a.value - x.a.value);
    const top = ranked[0]?.a.value ?? 0;
    return top > 0 ? top : null;
  }

  /** Best-effort monthly rent from Housing / rent-like expense lines. */
  private inferHousingRentMonthly(expenses: FinancialViewModel[] | undefined): number | null {
    if (!expenses?.length) return null;
    let total = 0;
    let found = false;
    for (const e of expenses) {
      const desc = (e.description || '').trim();
      if (desc !== 'Housing' && !/rent|affitto|locazione/i.test(desc)) continue;
      const cycle = e.amount?.cycle?.description ?? '';
      if (cycle === 'One-off') continue;
      const amt = e.amount?.amount ?? 0;
      if (amt <= 0) continue;
      found = true;
      if (cycle === 'Every month' || cycle === 'Monthly') {
        total += amt;
      } else if (cycle === 'Every year' || cycle === 'Yearly') {
        total += amt / 12;
      } else {
        total += amt;
      }
    }
    return found && total > 0 ? total : null;
  }

  private computeMonthlyRecurringExpenses(
    expenses: FinancialViewModel[] | undefined,
  ): number {
    if (!expenses?.length) return 0;
    let total = 0;
    for (const e of expenses) {
      const cycle = e.amount?.cycle?.description ?? '';
      if (cycle === 'One-off') continue;
      const amt = e.amount?.amount ?? 0;
      if (amt <= 0) continue;
      if (cycle === 'Every month' || cycle === 'Monthly') {
        total += amt;
      } else if (cycle === 'Every year' || cycle === 'Yearly') {
        total += amt / 12;
      } else {
        total += amt;
      }
    }
    return total;
  }

  private openInflationDialog(data: {
    startingAmount: number;
    inflationRate: number;
    currencyCode?: string;
  }): void {
    this.dialog.open(LearnInflationComponent, {
      width: '92vw',
      maxWidth: '92vw',
      height: '88vh',
      panelClass: 'learn-inflation-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      data,
    });
  }

  private openCompoundDialog(data: {
    startingAmount: number;
    inflationRate: number;
    currencyCode?: string;
  }): void {
    this.dialog.open(LearnCompoundInterestComponent, {
      width: '92vw',
      maxWidth: '92vw',
      height: '88vh',
      panelClass: 'learn-inflation-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      data,
    });
  }

  private openCostOfWaitingDialog(data: {
    startingAmount: number;
    inflationRate: number;
    currencyCode?: string;
  }): void {
    this.dialog.open(LearnCostOfWaitingComponent, {
      width: '92vw',
      maxWidth: '92vw',
      height: '88vh',
      panelClass: 'learn-inflation-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      data,
    });
  }

  private openCashBufferDialog(data: {
    currentCash: number;
    monthlyRecurringExpenses: number;
    currencyCode?: string;
  }): void {
    this.dialog.open(LearnCashBufferComponent, {
      width: '92vw',
      maxWidth: '92vw',
      height: '88vh',
      panelClass: 'learn-inflation-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      data,
    });
  }

  private openRentOrBuyDialog(data: LearnRentOrBuyDialogData): void {
    this.dialog.open(LearnRentOrBuyComponent, {
      width: '92vw',
      maxWidth: '92vw',
      height: '88vh',
      panelClass: 'learn-inflation-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      data,
    });
  }

  private openInvestToReachGoalDialog(data: {
    currentAge: number;
    inflationRate: number;
    currencyCode?: string;
  }): void {
    this.dialog.open(LearnInvestToReachGoalComponent, {
      width: '92vw',
      maxWidth: '92vw',
      height: '88vh',
      panelClass: 'learn-inflation-dialog-panel',
      autoFocus: false,
      restoreFocus: false,
      data,
    });
  }
}
