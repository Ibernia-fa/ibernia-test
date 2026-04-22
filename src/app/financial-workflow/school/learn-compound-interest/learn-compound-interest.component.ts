import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  OnInit,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import { AutoFitTitleDirective } from 'src/app/directives/auto-fit-title.directive';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

export interface LearnCompoundInterestDialogData {
  startingAmount: number;
  inflationRate: number;
  currencyCode?: string;
}

export type LearnCompoundView = 'growth' | 'simpleVsCompound';

const YEAR_POINTS = [0, 5, 10, 15, 20] as const;
const HORIZON_YEARS = 20;
const DEFAULT_RETURN_RATE = 5;

const ACCENT = '#4043af';
const SERIES_MUTE = '#9aa3c7';

@Component({
  selector: 'app-learn-compound-interest',
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
    AutoFitTitleDirective,
  ],
  templateUrl: './learn-compound-interest.component.html',
  styleUrl: './learn-compound-interest.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnCompoundInterestComponent implements OnInit {
  readonly currencyCode: string;
  readonly horizonYears = HORIZON_YEARS;

  readonly startingAmountControl = new FormControl<number | null>(0);

  readonly startingAmount = signal<number>(0);
  readonly returnRate = signal<number>(DEFAULT_RETURN_RATE);
  readonly inflationRate = signal<number>(0);

  readonly returnText = signal<string>('');
  readonly inflationText = signal<string>('');

  readonly view = signal<LearnCompoundView>('growth');

  readonly nominalSeries: Signal<number[]> = computed(() => {
    const start = this.startingAmount() || 0;
    const r = (this.returnRate() || 0) / 100;
    return YEAR_POINTS.map((y) => start * Math.pow(1 + r, y));
  });

  /** Simple interest on principal only: P × (1 + r × years). */
  readonly simpleInterestSeries: Signal<number[]> = computed(() => {
    const start = this.startingAmount() || 0;
    const r = (this.returnRate() || 0) / 100;
    return YEAR_POINTS.map((y) => start * (1 + r * y));
  });

  readonly realSeries: Signal<number[]> = computed(() => {
    const nominal = this.nominalSeries();
    const inf = (this.inflationRate() || 0) / 100;
    const denom = 1 + inf;
    return YEAR_POINTS.map((y, i) =>
      denom > 0 ? nominal[i] / Math.pow(denom, y) : nominal[i],
    );
  });

  readonly valueAfter20Nominal = computed(() => {
    const s = this.nominalSeries();
    return s[s.length - 1] ?? 0;
  });

  readonly valueAfterHorizonSimple = computed(() => {
    const start = this.startingAmount() || 0;
    const r = (this.returnRate() || 0) / 100;
    return start * (1 + r * HORIZON_YEARS);
  });

  readonly compoundingVsSimpleGap = computed(() => {
    if (!(this.startingAmount() > 0)) return 0;
    return Math.max(0, this.valueAfter20Nominal() - this.valueAfterHorizonSimple());
  });

  readonly valueAfter20Real = computed(() => {
    const s = this.realSeries();
    return s[s.length - 1] ?? 0;
  });

  /** Nominal gain over the horizon (excludes starting principal). */
  readonly growthEarnedNominal = computed(() => {
    const start = this.startingAmount() || 0;
    return Math.max(0, this.valueAfter20Nominal() - start);
  });

  readonly growthMultiple = computed(() => {
    const start = this.startingAmount() || 0;
    if (start <= 0) return 0;
    return this.valueAfter20Nominal() / start;
  });

  readonly growthMultipleLabel = computed(() => {
    const m = this.growthMultiple();
    if (!Number.isFinite(m) || m <= 0) return '—';
    const rounded = Math.round(m * 10) / 10;
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const text = Number.isInteger(rounded)
      ? rounded.toFixed(1)
      : String(rounded);
    return text.replace('.', decimal);
  });

  readonly chartOptions = computed(() => this.buildChartOptions());

  readonly compareChartOptions = computed(() => this.buildCompareChartOptions());

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  constructor(
    public dialogRef: MatDialogRef<LearnCompoundInterestComponent>,
    @Inject(MAT_DIALOG_DATA) data: LearnCompoundInterestDialogData,
  ) {
    this.currencyCode = data?.currencyCode ?? '';

    const initialStart = Number.isFinite(data?.startingAmount)
      ? Math.max(0, Number(data.startingAmount))
      : 0;
    const initialInflation = Number.isFinite(data?.inflationRate)
      ? Math.max(0, Math.min(100, Number(data.inflationRate)))
      : 2.5;

    this.startingAmount.set(initialStart);
    this.inflationRate.set(initialInflation);
    this.returnRate.set(DEFAULT_RETURN_RATE);

    this.inflationText.set(this.formatRateForLocale(initialInflation));
    this.returnText.set(this.formatRateForLocale(DEFAULT_RETURN_RATE));
    this.startingAmountControl.setValue(initialStart, { emitEvent: false });
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
        this.inflationText.set(this.formatRateForLocale(this.inflationRate()));
        this.returnText.set(this.formatRateForLocale(this.returnRate()));
      });
  }

  onReturnInput(rawValue: string): void {
    this.applyRateInput(rawValue, this.returnText, (v) => this.returnRate.set(v));
  }

  onReturnBlur(): void {
    this.returnText.set(this.formatRateForLocale(this.returnRate()));
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

  goToSimpleVsCompound(): void {
    this.view.set('simpleVsCompound');
  }

  backToGrowth(): void {
    this.view.set('growth');
  }

  formatAmount(value: number): string {
    return formatAppDisplayNumber(this.translate.currentLang, value || 0);
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
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

  private buildChartOptions(): any {
    const nominal = this.nominalSeries();
    const real = this.realSeries();
    const yearPrefix = this.translate.instant('LEARN_INFLATION.AXIS_YEAR_PREFIX');

    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
      const symbol = this.currencySymbol;
      return symbol ? `${symbol}${formatted}` : formatted;
    };

    const nominalName = this.translate.instant('LEARN_COMPOUND.SERIES_NOMINAL');
    const realName = this.translate.instant('LEARN_COMPOUND.SERIES_REAL');

    const toPoints = (values: number[]) =>
      YEAR_POINTS.map((year, i) => ({ x: year, y: Math.round(values[i] ?? 0) }));

    return {
      series: [
        { name: nominalName, data: toPoints(nominal) },
        { name: realName, data: toPoints(real) },
      ],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 550 },
        parentHeightOffset: 0,
        cssClass: 'ibr-school-chart',
      },
      colors: [ACCENT, SERIES_MUTE],
      stroke: {
        width: [3.2, 2.2],
        curve: 'smooth',
        dashArray: [0, 6],
      },
      markers: {
        size: [4, 0],
        colors: ['#ffffff', SERIES_MUTE],
        strokeColors: [ACCENT, SERIES_MUTE],
        strokeWidth: [2, 0],
        hover: { sizeOffset: 2 },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 24, top: 8, bottom: 0 },
      },
      xaxis: {
        type: 'numeric',
        min: -1,
        max: HORIZON_YEARS + 1,
        tickAmount: HORIZON_YEARS + 2,
        decimalsInFloat: 0,
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, stroke: { color: 'rgba(64, 67, 175, 0.18)', width: 1, dashArray: 0 } },
        tooltip: { enabled: false },
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '13px',
            fontFamily: 'Ubuntu, sans-serif',
          },
          formatter: (val: string | number) => {
            const n = Math.round(Number(val));
            if (!Number.isFinite(n) || n < 0 || n > HORIZON_YEARS || n % 5 !== 0) {
              return '';
            }
            return `${yearPrefix}${n}`;
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
        cssClass: 'ibr-school-tooltip',
        style: { fontSize: '14px', fontFamily: 'Ubuntu, sans-serif' },
        shared: true,
        intersect: false,
        followCursor: false,
        x: {
          show: true,
          formatter: (val: string | number) => {
            const n = Math.round(Number(val));
            return `${yearPrefix}${n}`;
          },
        },
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
    };
  }

  /* Tooltip note: keep the on-chart series order unchanged but use
     `inverseOrder: true` so the hover card always reads
     "Compound interest" first and "Simple interest" second. */
  private buildCompareChartOptions(): any {
    const simple = this.simpleInterestSeries();
    const compound = this.nominalSeries();
    const yearPrefix = this.translate.instant('LEARN_INFLATION.AXIS_YEAR_PREFIX');

    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
      const symbol = this.currencySymbol;
      return symbol ? `${symbol}${formatted}` : formatted;
    };

    const simpleName = this.translate.instant('LEARN_COMPOUND.COMPARE_SERIES_SIMPLE');
    const compoundName = this.translate.instant('LEARN_COMPOUND.COMPARE_SERIES_COMPOUND');

    const toPoints = (values: number[]) =>
      YEAR_POINTS.map((year, i) => ({ x: year, y: Math.round(values[i] ?? 0) }));

    return {
      series: [
        { name: simpleName, data: toPoints(simple) },
        { name: compoundName, data: toPoints(compound) },
      ],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 550 },
        parentHeightOffset: 0,
        cssClass: 'ibr-school-chart',
      },
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
        padding: { left: 8, right: 24, top: 8, bottom: 0 },
      },
      xaxis: {
        type: 'numeric',
        min: -1,
        max: HORIZON_YEARS + 1,
        tickAmount: HORIZON_YEARS + 2,
        decimalsInFloat: 0,
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: true, stroke: { color: 'rgba(64, 67, 175, 0.18)', width: 1, dashArray: 0 } },
        tooltip: { enabled: false },
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '13px',
            fontFamily: 'Ubuntu, sans-serif',
          },
          formatter: (val: string | number) => {
            const n = Math.round(Number(val));
            if (!Number.isFinite(n) || n < 0 || n > HORIZON_YEARS || n % 5 !== 0) {
              return '';
            }
            return `${yearPrefix}${n}`;
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
        cssClass: 'ibr-school-tooltip',
        style: { fontSize: '14px', fontFamily: 'Ubuntu, sans-serif' },
        shared: true,
        intersect: false,
        followCursor: false,
        inverseOrder: true,
        x: {
          show: true,
          formatter: (val: string | number) => {
            const n = Math.round(Number(val));
            return `${yearPrefix}${n}`;
          },
        },
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
    };
  }
}
