import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  NgZone,
  OnInit,
  Signal,
  ViewChild,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import { AutoFitTitleDirective } from 'src/app/directives/auto-fit-title.directive';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

export interface LearnCostOfWaitingDialogData {
  startingAmount: number;
  inflationRate: number;
  currencyCode?: string;
}

const MONTH_DELAYS = [1, 2, 3, 6, 9, 12, 18, 24] as const;
const DEFAULT_RETURN_RATE = 5;
const DEFAULT_HORIZON_YEARS = 20;
const ACCENT = '#4043af';
const BAR_MUTE = '#d8dbe8';

/** Index of 12 months in MONTH_DELAYS — default highlighted scenario. */
const DEFAULT_SELECTED_INDEX = MONTH_DELAYS.indexOf(12);

function fvAtHorizon(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  if (years <= 0) return principal;
  return principal * Math.pow(1 + annualRate, years);
}

@Component({
  selector: 'app-learn-cost-of-waiting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggle,
    NgApexchartsModule,
    TranslateModule,
    ThousandSeparatorInputDirective,
    AutoFitTitleDirective,
  ],
  templateUrl: './learn-cost-of-waiting.component.html',
  styleUrl: './learn-cost-of-waiting.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnCostOfWaitingComponent implements OnInit {
  @ViewChild(ChartComponent) private chartRef?: ChartComponent;

  readonly currencyCode: string;

  readonly startingAmountControl = new FormControl<number | null>(0);

  readonly startingAmount = signal<number>(0);
  readonly returnRate = signal<number>(DEFAULT_RETURN_RATE);
  readonly horizonYears = signal<number>(DEFAULT_HORIZON_YEARS);
  /** Annual inflation assumption used for inflation-adjusted (real) missed value. */
  readonly inflationRate = signal<number>(0);
  readonly showInflationAdjusted = signal<boolean>(false);

  readonly returnText = signal<string>('');
  readonly horizonText = signal<string>('');
  readonly inflationText = signal<string>('');

  readonly selectedBarIndex = signal<number>(DEFAULT_SELECTED_INDEX);
  readonly hoverBarIndex = signal<number | null>(null);

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  /** Plan inflation from cashflow (dialog data); used when enabling inflation-adjusted mode. */
  private readonly baselinePlanInflation: number;

  readonly fvIfInvestedNow: Signal<number> = computed(() => {
    const p = this.startingAmount() || 0;
    const r = (this.returnRate() || 0) / 100;
    const y = this.horizonYears() || 0;
    return fvAtHorizon(p, r, y);
  });

  readonly scenarioRows = computed(() => {
    const p = this.startingAmount() || 0;
    const r = (this.returnRate() || 0) / 100;
    const horizon = Math.max(0, this.horizonYears() || 0);
    const inf = (this.inflationRate() || 0) / 100;
    const fvNow = fvAtHorizon(p, r, horizon);
    const deflator =
      inf > -1 && horizon > 0 ? Math.pow(1 + inf, horizon) : 1;

    return MONTH_DELAYS.map((months) => {
      const yearsInvested = horizon - months / 12;
      const fvDelayed =
        yearsInvested <= 0 ? p : fvAtHorizon(p, r, yearsInvested);
      const costNominal = Math.max(0, fvNow - fvDelayed);
      const costReal = deflator > 0 ? costNominal / deflator : costNominal;
      const pct = fvNow > 0 ? (costNominal / fvNow) * 100 : 0;
      return {
        months,
        costNominal,
        costReal,
        pct,
      };
    });
  });

  readonly chartSeriesValues = computed(() => {
    const real = this.showInflationAdjusted();
    return this.scenarioRows().map((row) =>
      Math.round(real ? row.costReal : row.costNominal),
    );
  });

  readonly activeBarIndex = computed(() => {
    const hover = this.hoverBarIndex();
    if (hover !== null) return hover;
    return this.selectedBarIndex();
  });

  readonly chartOptions = computed(() => this.buildChartOptions());

  readonly activeScenario = computed(() => {
    const rows = this.scenarioRows();
    const idx = this.activeBarIndex();
    const row = rows[idx] ?? rows[DEFAULT_SELECTED_INDEX];
    const cost = this.showInflationAdjusted() ? row.costReal : row.costNominal;
    return { ...row, cost, index: idx };
  });

  constructor(
    public dialogRef: MatDialogRef<LearnCostOfWaitingComponent>,
    @Inject(MAT_DIALOG_DATA) data: LearnCostOfWaitingDialogData,
  ) {
    this.currencyCode = data?.currencyCode ?? '';

    const initialStart = Number.isFinite(data?.startingAmount)
      ? Math.max(0, Number(data.startingAmount))
      : 0;
    const initialInflation = Number.isFinite(data?.inflationRate)
      ? Math.max(0, Math.min(100, Number(data.inflationRate)))
      : 2.5;

    this.baselinePlanInflation = initialInflation;

    this.startingAmount.set(initialStart);
    this.inflationRate.set(initialInflation);
    this.returnRate.set(DEFAULT_RETURN_RATE);
    this.horizonYears.set(DEFAULT_HORIZON_YEARS);

    this.returnText.set(this.formatRateForLocale(DEFAULT_RETURN_RATE));
    this.horizonText.set(String(DEFAULT_HORIZON_YEARS));
    this.inflationText.set(this.formatRateForLocale(initialInflation));
    this.startingAmountControl.setValue(initialStart, { emitEvent: false });
  }

  /** Apex is created asynchronously; re-sync highlight whenever a new chart instance exists. */
  onCostChartReady(): void {
    queueMicrotask(() => this.applyBarHighlightColors());
  }

  ngOnInit(): void {
    this.startingAmountControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const parsed =
          typeof value === 'number'
            ? value
            : parseFormattedNumber(value as unknown as string, this.translate.currentLang);
        this.startingAmount.set(Math.max(0, parsed || 0));
      });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.returnText.set(this.formatRateForLocale(this.returnRate()));
        this.inflationText.set(this.formatRateForLocale(this.inflationRate()));
        this.syncHorizonTextFromSignal();
      });
  }

  onReturnInput(rawValue: string): void {
    this.applyRateInput(rawValue, this.returnText, (v) => this.returnRate.set(v));
  }

  onReturnBlur(): void {
    this.returnText.set(this.formatRateForLocale(this.returnRate()));
  }

  onHorizonInput(rawValue: string): void {
    const cleaned = (rawValue ?? '').trim();
    this.horizonText.set(cleaned);
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') {
      this.horizonYears.set(1);
      return;
    }
    const value = parseFormattedNumber(cleaned, this.translate.currentLang);
    const years = Math.round(Math.max(1, Math.min(80, value || 1)));
    this.horizonYears.set(years);
  }

  onHorizonBlur(): void {
    this.syncHorizonTextFromSignal();
  }

  onInflationAdjustedToggle(checked: boolean): void {
    this.showInflationAdjusted.set(checked);
    if (checked) {
      this.inflationRate.set(this.baselinePlanInflation);
      this.inflationText.set(this.formatRateForLocale(this.baselinePlanInflation));
    }
  }

  onInflationInput(rawValue: string): void {
    this.applyRateInput(rawValue, this.inflationText, (v) => this.inflationRate.set(v));
  }

  onInflationBlur(): void {
    this.inflationText.set(this.formatRateForLocale(this.inflationRate()));
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatAmount(value: number): string {
    return formatAppDisplayNumber(this.translate.currentLang, value || 0);
  }

  /** Amount with optional leading currency symbol (for summary copy). */
  formatCurrencyFull(value: number): string {
    const formatted = this.formatAmount(value);
    const symbol = this.currencySymbol;
    /* School display rule: read-only currency renders as "€64,729" with no
       space between the symbol and the value. Inputs intentionally keep the
       spaced layout via flex-gap on .impact-card__value. */
    return symbol ? `${symbol}${formatted}` : formatted;
  }

  formatPercentOneDecimal(value: number): string {
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10) / 10;
    return `${rounded.toFixed(1).replace('.', decimal)}%`;
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  /** Short delay phrase for the dynamic summary (e.g. "6 months" / "1 month"). */
  delayDurationLabel(months: number): string {
    if (months === 1) {
      return this.translate.instant('LEARN_COST_WAITING.DELAY_DURATION_ONE');
    }
    return this.translate.instant('LEARN_COST_WAITING.DELAY_DURATION_MANY', { months });
  }

  private syncHorizonTextFromSignal(): void {
    this.horizonText.set(String(this.horizonYears()));
  }

  private applyRateInput(
    rawValue: string,
    textSignal: WritableSignal<string>,
    setRate: (value: number) => void,
  ): void {
    const cleaned = (rawValue ?? '').replace('%', '').trim();
    textSignal.set(cleaned);
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') {
      setRate(0);
      return;
    }
    const value = parseFormattedNumber(cleaned, this.translate.currentLang);
    setRate(Math.max(0, Math.min(100, value)));
  }

  private formatRateForLocale(value: number): string {
    if (!Number.isFinite(value)) return '';
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
    return text.replace('.', decimal);
  }

  private applyBarHighlightColors(): void {
    const chartCmp = this.chartRef;
    if (!chartCmp) return;
    const idx = this.hoverBarIndex() ?? this.selectedBarIndex();
    const colors = MONTH_DELAYS.map((_, i) => (i === idx ? ACCENT : BAR_MUTE));
    void chartCmp.updateOptions({ colors }, false, false, false);
  }

  private buildChartOptions(): any {
    const values = this.chartSeriesValues();
    const selectedIdx = this.selectedBarIndex();
    const colors = values.map((_, i) => (i === selectedIdx ? ACCENT : BAR_MUTE));
    const categories = MONTH_DELAYS.map((m) => String(m));

    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
      const symbol = this.currencySymbol;
      return symbol ? `${symbol}${formatted}` : formatted;
    };

    const seriesName = this.translate.instant('LEARN_COST_WAITING.SERIES_NAME');
    const yTitle = this.translate.instant('LEARN_COST_WAITING.AXIS_Y');
    const xTitle = this.translate.instant('LEARN_COST_WAITING.AXIS_X');

    const zone = this.ngZone;
    const selectedBarIndex = this.selectedBarIndex;
    const hoverBarIndex = this.hoverBarIndex;

    return {
      series: [{ name: seriesName, data: values }],
      chart: {
        type: 'bar',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 500 },
        parentHeightOffset: 0,
        cssClass: 'ibr-school-chart',
        selection: { enabled: true, type: 'dataPoint' },
        events: {
          dataPointMouseEnter: (_event: unknown, _chartCtx: unknown, opts: { dataPointIndex: number }) => {
            zone.run(() => {
              hoverBarIndex.set(opts.dataPointIndex);
              queueMicrotask(() => this.applyBarHighlightColors());
            });
          },
          dataPointMouseLeave: () => {
            zone.run(() => {
              hoverBarIndex.set(null);
              queueMicrotask(() => this.applyBarHighlightColors());
            });
          },
          dataPointSelection: (_event: unknown, _chartCtx: unknown, opts: { dataPointIndex: number }) => {
            zone.run(() => {
              selectedBarIndex.set(opts.dataPointIndex);
              queueMicrotask(() => this.applyBarHighlightColors());
            });
          },
        },
      },
      colors,
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '58%',
          distributed: true,
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: {
        enabled: false,
      },
      states: {
        hover: { filter: { type: 'none' } },
        active: { allowMultipleDataPointsSelection: false, filter: { type: 'none' } },
      },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 4, right: 12, top: 12, bottom: 4 },
      },
      xaxis: {
        type: 'category',
        categories,
        title: {
          text: xTitle,
          style: {
            color: '#5a596e',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Ubuntu, sans-serif',
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '12px',
            fontFamily: 'Ubuntu, sans-serif',
          },
          rotate: 0,
          rotateAlways: false,
        },
      },
      yaxis: {
        title: {
          text: yTitle,
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
      legend: { show: false },
      tooltip: {
        theme: 'light',
        cssClass: 'ibr-school-tooltip',
        style: { fontSize: '14px', fontFamily: 'Ubuntu, sans-serif' },
        y: {
          formatter: (value: number, opts?: { dataPointIndex?: number }) => {
            const idx = opts?.dataPointIndex ?? 0;
            const row = this.scenarioRows()[idx];
            if (!row) return formatCurrency(value);
            const pct = this.formatPercentOneDecimal(row.pct);
            const primary = formatCurrency(
              Math.round(this.showInflationAdjusted() ? row.costReal : row.costNominal),
            );
            return `${primary} (${pct})`;
          },
        },
      },
    };
  }
}
