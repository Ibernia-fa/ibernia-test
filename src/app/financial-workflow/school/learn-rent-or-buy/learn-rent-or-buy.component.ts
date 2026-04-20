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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

import { runRentVsBuyEngine, type RentVsBuyEngineOutput } from './rent-vs-buy-engine';
import type { LearnRentOrBuyDialogData } from './learn-rent-or-buy.types';

const COLOR_BUY = '#5E79F6';
const COLOR_RENT = '#4043AF';

const DEFAULTS = {
  downPaymentPct: 20,
  mortgageRatePct: 4,
  mortgageTermYears: 25,
  horizonYears: 10,
  homeAppreciationPct: 3,
  investmentReturnPct: 6,
  inflationPct: 2,
  ownershipCostsPct: 2,
  roundTripCostsPct: 8,
};

const MAX_HORIZON_YEARS = 40;
const MIN_TERM_YEARS = 1;
const DEBOUNCE_MS = 300;

type DownPaymentMode = 'pct' | 'amount';

@Component({
  selector: 'app-learn-rent-or-buy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    NgApexchartsModule,
    TranslateModule,
  ],
  templateUrl: './learn-rent-or-buy.component.html',
  styleUrl: './learn-rent-or-buy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnRentOrBuyComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<LearnRentOrBuyComponent>);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  readonly currencyCode: string;

  // 1. Home price
  readonly homePrice = signal<number | null>(null);
  readonly homePriceText = signal('');

  // 2. Down payment (toggle pct / amount)
  readonly downPaymentMode = signal<DownPaymentMode>('pct');
  readonly downPaymentPct = signal<number>(DEFAULTS.downPaymentPct);
  readonly downPaymentAmount = signal<number>(0);
  readonly downPaymentText = signal<string>('');

  // 3. Mortgage interest rate
  readonly mortgageRatePct = signal<number>(DEFAULTS.mortgageRatePct);
  readonly mortgageRateText = signal<string>('');

  // 4. Mortgage term
  readonly mortgageTermYears = signal<number>(DEFAULTS.mortgageTermYears);
  readonly mortgageTermText = signal<string>('');

  // 5. Monthly rent
  readonly monthlyRent = signal<number | null>(null);
  readonly monthlyRentText = signal('');

  // 6. Time horizon
  readonly horizonYears = signal<number>(DEFAULTS.horizonYears);
  readonly horizonText = signal<string>('');

  // 7. Home appreciation
  readonly homeAppreciationPct = signal<number>(DEFAULTS.homeAppreciationPct);
  readonly homeAppreciationText = signal<string>('');

  // 8. Investment return
  readonly investmentReturnPct = signal<number>(DEFAULTS.investmentReturnPct);
  readonly investmentReturnText = signal<string>('');

  // 9. Inflation
  readonly inflationPct = signal<number>(DEFAULTS.inflationPct);
  readonly inflationText = signal<string>('');

  // 10. Ownership costs
  readonly ownershipCostsPct = signal<number>(DEFAULTS.ownershipCostsPct);
  readonly ownershipCostsText = signal<string>('');

  // 11. Round trip transaction costs
  readonly roundTripCostsPct = signal<number>(DEFAULTS.roundTripCostsPct);
  readonly roundTripCostsText = signal<string>('');

  readonly bannerDismissed = signal<boolean>(LearnRentOrBuyComponent.bannerDismissedSession);

  /** Triggered on every input change; debounced to drive engine recomputation. */
  private readonly inputsChanged$ = new Subject<void>();

  /**
   * Counter that bumps after debounce; computed engine output reads this so it
   * recalculates only when the debounced trigger fires (live updates within 300ms).
   */
  private readonly engineTick = signal<number>(0);

  /** Latest engine output; null when required inputs are missing. */
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

  /** Session-level (not persisted across page reload). */
  private static bannerDismissedSession = false;

  constructor(@Inject(MAT_DIALOG_DATA) data: LearnRentOrBuyDialogData | null) {
    this.currencyCode = (data?.currencyCode ?? '').toString();

    if (data?.homePrice && data.homePrice > 0) {
      this.homePrice.set(Math.round(data.homePrice));
    }
    if (data?.monthlyRent && data.monthlyRent > 0) {
      this.monthlyRent.set(Math.round(data.monthlyRent));
    }

    this.refreshAllText();
  }

  ngOnInit(): void {
    this.inputsChanged$
      .pipe(debounceTime(DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.engineTick.update((v) => v + 1));

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshAllText());

    // First computation with the initial values (no debounce).
    this.engineTick.update((v) => v + 1);
  }

  // ---------- Banner ----------

  dismissBanner(): void {
    this.bannerDismissed.set(true);
    LearnRentOrBuyComponent.bannerDismissedSession = true;
  }

  // ---------- Helpers ----------

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  formatCurrency(value: number): string {
    const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
    const symbol = this.currencySymbol;
    return symbol ? `${symbol} ${formatted}` : formatted;
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
    this.mortgageRateText.set(this.formatDecimal(this.mortgageRatePct(), 1));
    this.mortgageTermText.set(this.formatInteger(this.mortgageTermYears()));
    this.horizonText.set(this.formatInteger(this.horizonYears()));
    this.homeAppreciationText.set(this.formatDecimal(this.homeAppreciationPct(), 1));
    this.investmentReturnText.set(this.formatDecimal(this.investmentReturnPct(), 1));
    this.inflationText.set(this.formatDecimal(this.inflationPct(), 1));
    this.ownershipCostsText.set(this.formatDecimal(this.ownershipCostsPct(), 1));
    this.roundTripCostsText.set(this.formatDecimal(this.roundTripCostsPct(), 1));
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

  // ---------- Field handlers ----------
  // Each input uses (input) for live updates and (blur) to reformat the visible text.

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

  onMortgageRateInput(raw: string): void {
    this.mortgageRateText.set(raw);
    const value = this.parseLocaleNumber(raw);
    this.mortgageRatePct.set(Math.max(0, Math.min(100, value)));
    this.bumpInputs();
  }

  onMortgageRateBlur(): void {
    this.mortgageRateText.set(this.formatDecimal(this.mortgageRatePct(), 1));
  }

  onMortgageTermInput(raw: string): void {
    this.mortgageTermText.set(raw);
    const value = Math.round(this.parseLocaleNumber(raw));
    this.mortgageTermYears.set(Math.max(MIN_TERM_YEARS, Math.min(60, value || MIN_TERM_YEARS)));
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

  onHomeAppreciationInput(raw: string): void {
    this.homeAppreciationText.set(raw);
    this.homeAppreciationPct.set(this.parseLocaleNumber(raw));
    this.bumpInputs();
  }

  onHomeAppreciationBlur(): void {
    this.homeAppreciationText.set(this.formatDecimal(this.homeAppreciationPct(), 1));
  }

  onInvestmentReturnInput(raw: string): void {
    this.investmentReturnText.set(raw);
    this.investmentReturnPct.set(this.parseLocaleNumber(raw));
    this.bumpInputs();
  }

  onInvestmentReturnBlur(): void {
    this.investmentReturnText.set(this.formatDecimal(this.investmentReturnPct(), 1));
  }

  onInflationInput(raw: string): void {
    this.inflationText.set(raw);
    this.inflationPct.set(this.parseLocaleNumber(raw));
    this.bumpInputs();
  }

  onInflationBlur(): void {
    this.inflationText.set(this.formatDecimal(this.inflationPct(), 1));
  }

  onOwnershipCostsInput(raw: string): void {
    this.ownershipCostsText.set(raw);
    this.ownershipCostsPct.set(Math.max(0, this.parseLocaleNumber(raw)));
    this.bumpInputs();
  }

  onOwnershipCostsBlur(): void {
    this.ownershipCostsText.set(this.formatDecimal(this.ownershipCostsPct(), 1));
  }

  onRoundTripCostsInput(raw: string): void {
    this.roundTripCostsText.set(raw);
    this.roundTripCostsPct.set(Math.max(0, this.parseLocaleNumber(raw)));
    this.bumpInputs();
  }

  onRoundTripCostsBlur(): void {
    this.roundTripCostsText.set(this.formatDecimal(this.roundTripCostsPct(), 1));
  }

  // ---------- Chart ----------

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
      },
      colors: [COLOR_BUY, COLOR_RENT],
      stroke: { width: 3, curve: 'smooth' },
      markers: {
        size: 0,
        hover: { sizeOffset: 4 },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 4, right: 12, top: 4, bottom: 4 },
      },
      xaxis: {
        type: 'category',
        categories: xLabels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: {
          text: this.translate.instant('LEARN_RENT_OR_BUY.AXIS_X'),
          style: {
            color: '#5a596e',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Ubuntu, sans-serif',
          },
        },
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '12px',
            fontFamily: 'Ubuntu, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: this.translate.instant('LEARN_RENT_OR_BUY.AXIS_Y'),
          style: {
            color: '#5a596e',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Ubuntu, sans-serif',
          },
        },
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
        horizontalAlign: 'left',
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
        shared: true,
        intersect: false,
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
