import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { AutoFitTitleDirective } from 'src/app/directives/auto-fit-title.directive';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

import { LearnRentOrBuyAssumptionsDialogComponent } from './learn-rent-or-buy-assumptions-dialog.component';
import { runRentVsBuyEngine, type RentVsBuyEngineOutput } from './rent-vs-buy-engine';
import type {
  HomeEventPrefill,
  LearnRentOrBuyAssumptions,
  LearnRentOrBuyDialogData,
} from './learn-rent-or-buy.types';

const COLOR_BUY = '#5E79F6';
const COLOR_RENT = '#4043AF';

/**
 * Static fallback defaults used when no value can be sourced from a Home event
 * or from the user's Default Assumptions. These mirror the spec defaults for
 * the Rent vs Buy lesson.
 */
const DEFAULTS = {
  homePrice: 600_000,
  monthlyRent: 2_300,
  downPaymentPct: 20,
  mortgageRatePct: 3.5,
  mortgageTermYears: 25,
  horizonYears: 10,
  homeAppreciationPct: 3,
  investmentReturnPct: 6,
  inflationPct: 2.5,
  ownershipCostsPct: 2,
  roundTripCostsPct: 8,
};

const MAX_HORIZON_YEARS = 40;
const MIN_TERM_YEARS = 0;
const DEBOUNCE_MS = 300;

type DownPaymentMode = 'pct' | 'amount';

@Component({
  selector: 'app-learn-rent-or-buy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    NgApexchartsModule,
    TranslateModule,
    AutoFitTitleDirective,
  ],
  templateUrl: './learn-rent-or-buy.component.html',
  styleUrl: './learn-rent-or-buy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnRentOrBuyComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<LearnRentOrBuyComponent>);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly matDialog = inject(MatDialog);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  readonly currencyCode: string;

  // -------- Core inputs (always visible) --------

  readonly homePrice = signal<number | null>(DEFAULTS.homePrice);
  readonly homePriceText = signal('');

  readonly downPaymentMode = signal<DownPaymentMode>('pct');
  readonly downPaymentPct = signal<number>(DEFAULTS.downPaymentPct);
  readonly downPaymentAmount = signal<number>(0);
  readonly downPaymentText = signal<string>('');

  readonly mortgageTermYears = signal<number>(DEFAULTS.mortgageTermYears);
  readonly mortgageTermText = signal<string>('');

  readonly monthlyRent = signal<number | null>(DEFAULTS.monthlyRent);
  readonly monthlyRentText = signal('');

  readonly horizonYears = signal<number>(DEFAULTS.horizonYears);
  readonly horizonText = signal<string>('');

  // -------- Advanced assumptions (modal) --------

  readonly mortgageRatePct = signal<number>(DEFAULTS.mortgageRatePct);
  readonly homeAppreciationPct = signal<number>(DEFAULTS.homeAppreciationPct);
  readonly investmentReturnPct = signal<number>(DEFAULTS.investmentReturnPct);
  readonly inflationPct = signal<number>(DEFAULTS.inflationPct);
  readonly ownershipCostsPct = signal<number>(DEFAULTS.ownershipCostsPct);
  readonly roundTripCostsPct = signal<number>(DEFAULTS.roundTripCostsPct);

  // -------- Engine wiring --------

  private readonly inputsChanged$ = new Subject<void>();
  private readonly engineTick = signal<number>(0);

  readonly engineOutput = computed<RentVsBuyEngineOutput | null>(() => {
    this.engineTick();
    const homePrice = this.homePrice();
    const monthlyRent = this.monthlyRent();
    if (!homePrice || homePrice <= 0 || !monthlyRent || monthlyRent <= 0) {
      return null;
    }
    return runRentVsBuyEngine({
      homePrice,
      downPaymentAmount: this.effectiveDownPaymentAmount(),
      mortgageRatePct: this.mortgageRatePct(),
      mortgageTermYears: this.mortgageTermYears(),
      monthlyRent,
      horizonYears: this.horizonYears(),
      homeAppreciationPct: this.homeAppreciationPct(),
      investmentReturnPct: this.investmentReturnPct(),
      inflationPct: this.inflationPct(),
      ownershipCostsPct: this.ownershipCostsPct(),
      roundTripCostsPct: this.roundTripCostsPct(),
    });
  });

  readonly netResult = computed<number | null>(() => {
    const out = this.engineOutput();
    return out ? out.terminalBuy - out.terminalRent : null;
  });

  /**
   * Side that comes out ahead at the chosen horizon. Used to give the two
   * top-right summary tiles a positive (winner) / muted (loser) treatment.
   */
  readonly winnerSide = computed<'buy' | 'rent' | null>(() => {
    const net = this.netResult();
    if (net === null || !Number.isFinite(net) || net === 0) return null;
    return net > 0 ? 'buy' : 'rent';
  });

  readonly summarySentence = computed<string>(() => {
    const out = this.engineOutput();
    if (!out) return '';
    const horizon = this.horizonYears();
    const net = out.terminalBuy - out.terminalRent;
    const absAmount = this.formatCurrency(Math.abs(net));
    const breakeven = out.breakevenYear;

    if (net > 0) {
      return this.translate.instant('LEARN_RENT_OR_BUY.SUMMARY_BUY_WINS', {
        years: horizon,
        amount: absAmount,
        breakeven,
      });
    }
    if (net < 0 && breakeven === null) {
      return this.translate.instant('LEARN_RENT_OR_BUY.SUMMARY_RENT_WINS_FOREVER');
    }
    return this.translate.instant('LEARN_RENT_OR_BUY.SUMMARY_RENT_WINS', {
      years: horizon,
      amount: absAmount,
    });
  });

  readonly chartOptions = computed(() => this.buildChartOptions());

  constructor(@Inject(MAT_DIALOG_DATA) data: LearnRentOrBuyDialogData | null) {
    this.currencyCode = (data?.currencyCode ?? '').toString();
    this.applyPrefill(data ?? null);
    this.refreshAllText();
  }

  /**
   * Applies the prefill priority chain documented on `LearnRentOrBuyDialogData`:
   *   1. Home event in the current plan (cash vs financing)
   *   2. User Default Assumptions for shared rates
   *   3. Static fallback defaults already set as signal initializers
   *
   * Each branch is intentionally additive: a value that is not provided by a
   * higher-precedence source falls through to the next one without clobbering
   * the calculator's editable signals with `null`.
   */
  private applyPrefill(data: LearnRentOrBuyDialogData | null): void {
    /* 2 → Default Assumptions (shared rates only). Apply first so the Home
       event branch (1) can override the mortgage rate when persisted. */
    if (data?.inflationPct != null && Number.isFinite(data.inflationPct)) {
      this.inflationPct.set(Math.max(0, data.inflationPct));
    }
    if (
      data?.investmentReturnPct != null &&
      Number.isFinite(data.investmentReturnPct)
    ) {
      this.investmentReturnPct.set(Math.max(0, data.investmentReturnPct));
    }
    if (
      data?.mortgageRatePct != null &&
      Number.isFinite(data.mortgageRatePct)
    ) {
      this.mortgageRatePct.set(Math.max(0, data.mortgageRatePct));
    }

    /* 0 → loose context inferred elsewhere (wealth/expenses) keeps working as
       a soft fallback for the home price / rent guess. It only beats the static
       defaults; a Home event below will win. */
    if (data?.homePrice != null && data.homePrice > 0) {
      this.homePrice.set(Math.round(data.homePrice));
    }
    if (data?.monthlyRent != null && data.monthlyRent > 0) {
      this.monthlyRent.set(Math.round(data.monthlyRent));
    }

    /* 1 → Home event (highest precedence for property/financing fields). */
    const event = data?.fromHomeEvent ?? null;
    if (event) {
      this.applyHomeEventPrefill(event);
    }
  }

  /**
   * Mirrors the user's intent on the Home event:
   *   - Cash purchase  → 100% down payment, 0-year mortgage, no fake financing.
   *   - Financing      → use whatever is persisted on the event (price, down
   *                      payment, rate, term); anything missing falls through
   *                      to the values already set by Default Assumptions /
   *                      static defaults.
   */
  private applyHomeEventPrefill(event: HomeEventPrefill): void {
    if (event.propertyPrice != null && event.propertyPrice > 0) {
      this.homePrice.set(Math.round(event.propertyPrice));
    }

    if (event.paymentMode === 'cash') {
      this.downPaymentMode.set('pct');
      this.downPaymentPct.set(100);
      this.mortgageTermYears.set(0);
      return;
    }

    if (
      event.downPaymentPct != null &&
      Number.isFinite(event.downPaymentPct) &&
      event.downPaymentPct > 0
    ) {
      this.downPaymentMode.set('pct');
      this.downPaymentPct.set(Math.max(0, Math.min(100, event.downPaymentPct)));
    } else if (
      event.downPaymentAmount != null &&
      Number.isFinite(event.downPaymentAmount) &&
      event.downPaymentAmount > 0
    ) {
      this.downPaymentMode.set('amount');
      this.downPaymentAmount.set(Math.round(event.downPaymentAmount));
    }

    if (
      event.mortgageRatePct != null &&
      Number.isFinite(event.mortgageRatePct) &&
      event.mortgageRatePct >= 0
    ) {
      this.mortgageRatePct.set(event.mortgageRatePct);
    }

    if (
      event.mortgageTermYears != null &&
      Number.isFinite(event.mortgageTermYears) &&
      event.mortgageTermYears > 0
    ) {
      this.mortgageTermYears.set(Math.round(event.mortgageTermYears));
    }
  }

  ngOnInit(): void {
    this.inputsChanged$
      .pipe(debounceTime(DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.engineTick.update((v) => v + 1));

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshAllText());

    this.engineTick.update((v) => v + 1);
  }

  // -------- Banner --------
  // (banner now lives at the bottom of the module; no dismiss control needed)

  // -------- More assumptions modal --------

  openAssumptions(): void {
    const ref = this.matDialog.open(LearnRentOrBuyAssumptionsDialogComponent, {
      width: 'min(640px, 92vw)',
      maxWidth: '92vw',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'rb-assumptions-dialog-panel',
      data: {
        mortgageRatePct: this.mortgageRatePct(),
        homeAppreciationPct: this.homeAppreciationPct(),
        investmentReturnPct: this.investmentReturnPct(),
        inflationPct: this.inflationPct(),
        ownershipCostsPct: this.ownershipCostsPct(),
        roundTripCostsPct: this.roundTripCostsPct(),
        currencyCode: this.currencyCode,
      },
    });

    ref.afterClosed().subscribe((result: LearnRentOrBuyAssumptions | undefined) => {
      if (!result) return;
      this.mortgageRatePct.set(result.mortgageRatePct);
      this.homeAppreciationPct.set(result.homeAppreciationPct);
      this.investmentReturnPct.set(result.investmentReturnPct);
      this.inflationPct.set(result.inflationPct);
      this.ownershipCostsPct.set(result.ownershipCostsPct);
      this.roundTripCostsPct.set(result.roundTripCostsPct);
      this.engineTick.update((v) => v + 1);
    });
  }

  // -------- Helpers --------

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  formatCurrency(value: number): string {
    const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
    const symbol = this.currencySymbol;
    /* School display rule: read-only currency renders as "€64,729" with no space
       between the symbol and the value. Inputs intentionally keep the spaced
       layout via flex-gap on .impact-card__value. */
    return symbol ? `${symbol}${formatted}` : formatted;
  }

  private effectiveDownPaymentAmount(): number {
    const home = this.homePrice() ?? 0;
    if (this.downPaymentMode() === 'pct') {
      return Math.max(0, Math.min(home, (home * this.downPaymentPct()) / 100));
    }
    return Math.max(0, Math.min(home, this.downPaymentAmount()));
  }

  private bumpInputs(): void {
    this.inputsChanged$.next();
  }

  private refreshAllText(): void {
    const home = this.homePrice();
    const rent = this.monthlyRent();
    this.homePriceText.set(home != null ? this.formatInteger(home) : '');
    this.monthlyRentText.set(rent != null ? this.formatInteger(rent) : '');
    this.refreshDownPaymentText();
    this.mortgageTermText.set(this.formatInteger(this.mortgageTermYears()));
    this.horizonText.set(this.formatInteger(this.horizonYears()));
  }

  private refreshDownPaymentText(): void {
    if (this.downPaymentMode() === 'pct') {
      this.downPaymentText.set(this.formatDecimal(this.downPaymentPct(), 1));
    } else {
      this.downPaymentText.set(this.formatInteger(this.downPaymentAmount()));
    }
  }

  private formatInteger(value: number): string {
    if (!Number.isFinite(value)) return '';
    return formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
  }

  private formatDecimal(value: number, digits: number): string {
    if (!Number.isFinite(value)) return '';
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    return rounded.toFixed(digits).replace('.', decimal);
  }

  private parseLocaleNumber(raw: string): number {
    const cleaned = (raw ?? '').toString().replace('%', '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') return 0;
    return parseFormattedNumber(cleaned, this.translate.currentLang);
  }

  // -------- Field handlers --------

  onHomePriceInput(raw: string): void {
    this.homePriceText.set(raw);
    const value = this.parseLocaleNumber(raw);
    this.homePrice.set(value > 0 ? value : null);
    this.bumpInputs();
  }
  onHomePriceBlur(): void {
    const v = this.homePrice();
    this.homePriceText.set(v != null ? this.formatInteger(v) : '');
  }

  onDownPaymentModeChange(mode: DownPaymentMode): void {
    if (mode === this.downPaymentMode()) return;
    const home = this.homePrice() ?? 0;
    if (mode === 'amount' && home > 0) {
      this.downPaymentAmount.set(Math.round((home * this.downPaymentPct()) / 100));
    } else if (mode === 'pct' && home > 0) {
      this.downPaymentPct.set(
        Math.max(0, Math.min(100, (this.downPaymentAmount() / home) * 100)),
      );
    }
    this.downPaymentMode.set(mode);
    this.refreshDownPaymentText();
    this.bumpInputs();
  }

  onDownPaymentInput(raw: string): void {
    this.downPaymentText.set(raw);
    const value = this.parseLocaleNumber(raw);
    if (this.downPaymentMode() === 'pct') {
      this.downPaymentPct.set(Math.max(0, Math.min(100, value)));
    } else {
      const cap = this.homePrice() ?? Number.POSITIVE_INFINITY;
      this.downPaymentAmount.set(Math.max(0, Math.min(cap, value)));
    }
    this.bumpInputs();
  }
  onDownPaymentBlur(): void {
    this.refreshDownPaymentText();
  }

  onMortgageTermInput(raw: string): void {
    this.mortgageTermText.set(raw);
    /* `MIN_TERM_YEARS = 0` lets cash purchases (or a Home cash event) display
       a 0-year mortgage without the input snapping back to 1. The engine will
       still compute a zero mortgage payment when the loan amount is 0. */
    const value = Math.round(this.parseLocaleNumber(raw));
    const clamped = Number.isFinite(value)
      ? Math.max(MIN_TERM_YEARS, Math.min(60, value))
      : MIN_TERM_YEARS;
    this.mortgageTermYears.set(clamped);
    this.bumpInputs();
  }
  onMortgageTermBlur(): void {
    this.mortgageTermText.set(this.formatInteger(this.mortgageTermYears()));
  }

  onMonthlyRentInput(raw: string): void {
    this.monthlyRentText.set(raw);
    const value = this.parseLocaleNumber(raw);
    this.monthlyRent.set(value > 0 ? value : null);
    this.bumpInputs();
  }
  onMonthlyRentBlur(): void {
    const v = this.monthlyRent();
    this.monthlyRentText.set(v != null ? this.formatInteger(v) : '');
  }

  onHorizonInput(raw: string): void {
    this.horizonText.set(raw);
    const value = Math.round(this.parseLocaleNumber(raw));
    this.horizonYears.set(Math.max(1, Math.min(MAX_HORIZON_YEARS, value || 1)));
    this.bumpInputs();
  }
  onHorizonBlur(): void {
    this.horizonText.set(this.formatInteger(this.horizonYears()));
  }

  // -------- Chart --------

  private buildChartOptions(): any {
    const out = this.engineOutput();
    if (!out) return this.emptyChartOptions();

    const buyName = this.translate.instant('LEARN_RENT_OR_BUY.SERIES_BUY');
    const rentName = this.translate.instant('LEARN_RENT_OR_BUY.SERIES_RENT');
    const yearPrefix = this.translate.instant('LEARN_INFLATION.AXIS_YEAR_PREFIX');
    const xLabels = out.buySeries.map((p) => `${yearPrefix}${p.year}`);

    return {
      series: [
        { name: buyName, data: out.buySeries.map((p) => Math.round(p.wealth)) },
        { name: rentName, data: out.rentSeries.map((p) => Math.round(p.wealth)) },
      ],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 400 },
        parentHeightOffset: 0,
        cssClass: 'ibr-school-chart',
      },
      colors: [COLOR_BUY, COLOR_RENT],
      stroke: { width: 3, curve: 'smooth' },
      markers: { size: 0, hover: { sizeOffset: 4 } },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        /* Extra right padding (≈ half a category step) keeps the final x-axis
           label and the rightmost tooltip fully inside the chart container at
           any horizon. Pairs with the `apx-chart` right inset in the SCSS. */
        padding: { left: 8, right: 48, top: 8, bottom: 0 },
      },
      xaxis: {
        type: 'category',
        categories: xLabels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          /* `hideOverlappingLabels: false` + `trim: false` prevent ApexCharts
             from silently dropping the last label when room is tight. */
          hideOverlappingLabels: false,
          trim: false,
          style: {
            colors: '#5a596e',
            fontSize: '12px',
            fontFamily: 'Ubuntu, sans-serif',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '12px',
            fontFamily: 'Ubuntu, sans-serif',
          },
          formatter: (value: number) =>
            formatAppDisplayNumber(this.translate.currentLang, Math.round(value)),
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        offsetY: -4,
        fontFamily: 'Ubuntu, sans-serif',
        fontSize: '12px',
        fontWeight: 600,
        labels: { colors: '#5a596e' },
        markers: { width: 8, height: 8, radius: 8, offsetX: -2 },
        itemMargin: { horizontal: 14, vertical: 2 },
      },
      tooltip: {
        theme: 'light',
        cssClass: 'ibr-school-tooltip',
        style: { fontSize: '14px', fontFamily: 'Ubuntu, sans-serif' },
        shared: true,
        intersect: false,
        /* `inverseOrder` is purely cosmetic; what actually fixes the right-edge
           clipping is the extra grid padding above plus the `overflow: visible`
           on the chart wrapper in the SCSS — together they let ApexCharts flip
           the tooltip to the left of the cursor on the final years without it
           being cut off by the rounded chart container. */
        inverseOrder: false,
        y: { formatter: (value: number) => this.formatCurrency(value) },
      },
    };
  }

  private emptyChartOptions(): any {
    return {
      series: [],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        parentHeightOffset: 0,
      },
      colors: [COLOR_BUY, COLOR_RENT],
      stroke: { width: 3, curve: 'smooth' },
      markers: { size: 0 },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        padding: { left: 4, right: 12, top: 4, bottom: 4 },
      },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (v: number) => String(v) } },
      legend: { show: false },
      tooltip: { enabled: false },
    };
  }
}
