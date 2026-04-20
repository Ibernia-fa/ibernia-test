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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

import { LearnRentOrBuyAssumptionsDialogComponent } from './learn-rent-or-buy-assumptions-dialog.component';
import { simulateRentOrBuy } from './rent-or-buy-simulation';
import type {
  LearnRentOrBuyAssumptionValues,
  LearnRentOrBuyDialogData,
} from './learn-rent-or-buy.types';

const ACCENT = '#4043af';
const SERIES_MUTE = '#9aa3c7';
const DEFAULT_DOWN_PCT = 20;
const SECURITY_DEPOSIT_MONTHS = 1;

@Component({
  selector: 'app-learn-rent-or-buy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    NgApexchartsModule,
    TranslateModule,
    ThousandSeparatorInputDirective,
  ],
  templateUrl: './learn-rent-or-buy.component.html',
  styleUrl: './learn-rent-or-buy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnRentOrBuyComponent implements OnInit {
  readonly currencyCode: string;

  readonly homePriceControl = new FormControl<number | null>(0);
  readonly monthlyRentControl = new FormControl<number | null>(0);

  readonly homePrice = signal(0);
  readonly monthlyRent = signal(0);
  readonly downPaymentPct = signal(DEFAULT_DOWN_PCT);
  readonly downPaymentText = signal('');

  readonly mortgageRate = signal(4);
  readonly mortgageTermYears = signal(25);
  readonly horizonYears = signal(10);
  readonly homePriceGrowth = signal(2);
  readonly rentGrowth = signal(2);
  readonly investmentReturn = signal(5);
  readonly closingCostsPct = signal(3);
  readonly propertyTaxPct = signal(1);
  readonly homeInsuranceYearly = signal(0);
  readonly maintenancePctYearly = signal(1);
  readonly hoaMonthly = signal(0);
  readonly sellingCostsPct = signal(5);
  readonly renterInsuranceMonthly = signal(15);
  readonly generalInflation = signal(2);

  readonly dialogRef = inject(MatDialogRef<LearnRentOrBuyComponent>);
  private readonly matDialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  readonly simulation = computed(() => {
    const price = this.homePrice() || 0;
    const rent = this.monthlyRent() || 0;
    if (price <= 0 || rent <= 0) {
      return null;
    }
    return simulateRentOrBuy({
      homePrice: price,
      downPaymentPct: this.downPaymentPct(),
      monthlyRent: rent,
      mortgageRatePct: this.mortgageRate(),
      mortgageTermYears: this.mortgageTermYears(),
      horizonYears: this.horizonYears(),
      homePriceGrowthPct: this.homePriceGrowth(),
      rentGrowthPct: this.rentGrowth(),
      investmentReturnPct: this.investmentReturn(),
      closingCostsPct: this.closingCostsPct(),
      propertyTaxPct: this.propertyTaxPct(),
      homeInsuranceYearly: this.homeInsuranceYearly(),
      maintenancePctYearly: this.maintenancePctYearly(),
      hoaMonthly: this.hoaMonthly(),
      sellingCostsPct: this.sellingCostsPct(),
      renterInsuranceMonthly: this.renterInsuranceMonthly(),
      generalInflationPct: this.generalInflation(),
      securityDepositMonths: SECURITY_DEPOSIT_MONTHS,
    });
  });

  readonly takeawayHeadline = computed(() => {
    const sim = this.simulation();
    if (!sim) return '';
    const H = sim.years[sim.years.length - 1] ?? this.horizonYears();
    const buyBetter = sim.finalBuy >= sim.finalRent;
    const be = sim.breakEvenYear;
    const kind = sim.breakEvenKind;

    if (buyBetter && kind === 'buy' && be !== null && be > 0 && be <= H) {
      return this.translate.instant('LEARN_RENT_OR_BUY.TAKEAWAY_CROSSOVER_BUY', { years: be });
    }
    if (!buyBetter && kind === 'rent' && be !== null && be > 0 && be <= H) {
      return this.translate.instant('LEARN_RENT_OR_BUY.TAKEAWAY_CROSSOVER_RENT', { years: be });
    }
    if (buyBetter) {
      return this.translate.instant('LEARN_RENT_OR_BUY.TAKEAWAY_HORIZON_BUY', { years: H });
    }
    return this.translate.instant('LEARN_RENT_OR_BUY.TAKEAWAY_HORIZON_RENT', { years: H });
  });

  readonly takeawaySupport = computed(() => {
    const sim = this.simulation();
    if (!sim) return '';
    const diff = Math.abs(sim.finalBuy - sim.finalRent);
    if (diff < 1) {
      return this.translate.instant('LEARN_RENT_OR_BUY.SUPPORT_TIE');
    }
    const months = Math.max(1, Math.round(this.horizonYears() * 12));
    const perMonth = diff / months;
    const full = this.formatCurrencyFull(diff);
    const month = this.formatCurrencyFull(perMonth);
    if (this.horizonYears() >= 1) {
      return this.translate.instant('LEARN_RENT_OR_BUY.SUPPORT_MONTHLY', { amount: month });
    }
    return this.translate.instant('LEARN_RENT_OR_BUY.SUPPORT_FULL_PERIOD', { amount: full });
  });

  readonly chartOptions = computed(() => this.buildChartOptions());

  constructor(@Inject(MAT_DIALOG_DATA) data: LearnRentOrBuyDialogData) {
    this.currencyCode = data?.currencyCode ?? '';

    const price = Number.isFinite(data?.homePrice) ? Math.max(0, data.homePrice) : 0;
    const rent = Number.isFinite(data?.monthlyRent) ? Math.max(0, data.monthlyRent) : 0;
    const down = Number.isFinite(data?.downPaymentPct)
      ? Math.max(0, Math.min(100, data.downPaymentPct))
      : DEFAULT_DOWN_PCT;

    this.homePrice.set(price);
    this.monthlyRent.set(rent);
    this.downPaymentPct.set(down);
    this.downPaymentText.set(this.formatRateForLocale(down));

    this.mortgageRate.set(data.mortgageRatePct ?? 4);
    this.mortgageTermYears.set(Math.max(1, data.mortgageTermYears ?? 25));
    this.horizonYears.set(Math.max(1, data.horizonYears ?? 10));
    this.homePriceGrowth.set(data.homePriceGrowthPct ?? 2);
    this.rentGrowth.set(data.rentGrowthPct ?? 2);
    this.investmentReturn.set(data.investmentReturnPct ?? 5);
    this.closingCostsPct.set(data.closingCostsPct ?? 3);
    this.propertyTaxPct.set(data.propertyTaxPct ?? 1);
    this.homeInsuranceYearly.set(Math.max(0, data.homeInsuranceYearly ?? 0));
    this.maintenancePctYearly.set(data.maintenancePctYearly ?? 1);
    this.hoaMonthly.set(Math.max(0, data.hoaMonthly ?? 0));
    this.sellingCostsPct.set(data.sellingCostsPct ?? 5);
    this.renterInsuranceMonthly.set(Math.max(0, data.renterInsuranceMonthly ?? 15));
    this.generalInflation.set(data.generalInflationPct ?? 2);

    this.homePriceControl.setValue(price || null, { emitEvent: false });
    this.monthlyRentControl.setValue(rent || null, { emitEvent: false });
  }

  ngOnInit(): void {
    this.homePriceControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const parsed =
          typeof value === 'number'
            ? value
            : parseFormattedNumber(value as unknown as string, this.translate.currentLang);
        this.homePrice.set(Math.max(0, parsed || 0));
      });

    this.monthlyRentControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const parsed =
          typeof value === 'number'
            ? value
            : parseFormattedNumber(value as unknown as string, this.translate.currentLang);
        this.monthlyRent.set(Math.max(0, parsed || 0));
      });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.downPaymentText.set(this.formatRateForLocale(this.downPaymentPct()));
    });
  }

  openAssumptions(): void {
    const ref = this.matDialog.open(LearnRentOrBuyAssumptionsDialogComponent, {
      width: 'min(560px, 94vw)',
      maxWidth: '94vw',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'learn-rent-or-buy-assumptions-dialog-panel',
      data: {
        ...this.assumptionSnapshot(),
        currencyCode: this.currencyCode,
      },
    });

    ref.afterClosed().subscribe((patch: LearnRentOrBuyAssumptionValues | undefined) => {
      if (!patch) return;
      this.mortgageRate.set(patch.mortgageRatePct);
      this.mortgageTermYears.set(patch.mortgageTermYears);
      this.horizonYears.set(patch.horizonYears);
      this.homePriceGrowth.set(patch.homePriceGrowthPct);
      this.rentGrowth.set(patch.rentGrowthPct);
      this.investmentReturn.set(patch.investmentReturnPct);
      this.closingCostsPct.set(patch.closingCostsPct);
      this.propertyTaxPct.set(patch.propertyTaxPct);
      this.homeInsuranceYearly.set(patch.homeInsuranceYearly);
      this.maintenancePctYearly.set(patch.maintenancePctYearly);
      this.hoaMonthly.set(patch.hoaMonthly);
      this.sellingCostsPct.set(patch.sellingCostsPct);
      this.renterInsuranceMonthly.set(patch.renterInsuranceMonthly);
      this.generalInflation.set(patch.generalInflationPct);
    });
  }

  onDownPaymentInput(raw: string): void {
    const cleaned = (raw ?? '').replace('%', '').trim();
    this.downPaymentText.set(cleaned);
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') {
      this.downPaymentPct.set(0);
      return;
    }
    const value = parseFormattedNumber(cleaned, this.translate.currentLang);
    this.downPaymentPct.set(Math.max(0, Math.min(100, value)));
  }

  onDownPaymentBlur(): void {
    this.downPaymentText.set(this.formatRateForLocale(this.downPaymentPct()));
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  formatCurrencyFull(value: number): string {
    const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
    const symbol = this.currencySymbol;
    return symbol ? `${symbol} ${formatted}` : formatted;
  }

  private assumptionSnapshot(): LearnRentOrBuyAssumptionValues {
    return {
      mortgageRatePct: this.mortgageRate(),
      mortgageTermYears: this.mortgageTermYears(),
      horizonYears: this.horizonYears(),
      homePriceGrowthPct: this.homePriceGrowth(),
      rentGrowthPct: this.rentGrowth(),
      investmentReturnPct: this.investmentReturn(),
      closingCostsPct: this.closingCostsPct(),
      propertyTaxPct: this.propertyTaxPct(),
      homeInsuranceYearly: this.homeInsuranceYearly(),
      maintenancePctYearly: this.maintenancePctYearly(),
      hoaMonthly: this.hoaMonthly(),
      sellingCostsPct: this.sellingCostsPct(),
      renterInsuranceMonthly: this.renterInsuranceMonthly(),
      generalInflationPct: this.generalInflation(),
    };
  }

  private formatRateForLocale(value: number): string {
    if (!Number.isFinite(value)) return '';
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
    return text.replace('.', decimal);
  }

  private buildChartOptions(): any {
    const sim = this.simulation();
    if (!sim) {
      return this.emptyChartOptions();
    }

    const rentName = this.translate.instant('LEARN_RENT_OR_BUY.SERIES_RENT');
    const buyName = this.translate.instant('LEARN_RENT_OR_BUY.SERIES_BUY');
    const yearPrefix = this.translate.instant('LEARN_INFLATION.AXIS_YEAR_PREFIX');
    const xLabels = sim.years.map((y) => `${yearPrefix}${y}`);

    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
      const symbol = this.currencySymbol;
      return symbol ? `${symbol} ${formatted}` : formatted;
    };

    const be = sim.breakEvenYear;
    const annotations =
      be !== null && be >= 0 && sim.years.includes(be)
        ? {
            xaxis: [
              {
                x: `${yearPrefix}${be}`,
                borderColor: '#d8dbe8',
                strokeDashArray: 4,
                label: {
                  borderColor: '#d8dbe8',
                  style: {
                    color: '#5a596e',
                    background: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'Ubuntu, sans-serif',
                  },
                  text: this.translate.instant('LEARN_RENT_OR_BUY.BREAK_EVEN'),
                },
              },
            ],
          }
        : {};

    return {
      series: [
        { name: rentName, data: sim.rentWealth },
        { name: buyName, data: sim.buyWealth },
      ],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 550 },
        parentHeightOffset: 0,
      },
      annotations,
      colors: [SERIES_MUTE, ACCENT],
      stroke: {
        width: [2.2, 3.2],
        curve: 'smooth',
        dashArray: [6, 0],
      },
      markers: {
        size: [0, 4],
        colors: ['#ffffff', '#ffffff'],
        strokeColors: [SERIES_MUTE, ACCENT],
        strokeWidth: [0, 2],
        hover: { sizeOffset: 2 },
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
        markers: {
          width: 8,
          height: 8,
          radius: 8,
          offsetX: -2,
        },
        itemMargin: { horizontal: 14, vertical: 2 },
      },
      tooltip: {
        theme: 'light',
        shared: true,
        intersect: false,
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
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
      annotations: {},
      colors: [SERIES_MUTE, ACCENT],
      stroke: { width: [2, 2], curve: 'smooth' },
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
