import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  OnInit,
  Signal,
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

import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

export interface LearnInflationDialogData {
  startingAmount: number;
  inflationRate: number;
  currencyCode?: string;
}

export type LearnInflationView = 'impact' | 'causes' | 'countries';

export interface InflationCause {
  iconKey: 'demand' | 'cost' | 'builtIn';
  titleKey: string;
  descriptionKey: string;
}

export interface CountryInflationLatest {
  countryKey: string;
  value: number;
  periodKey: string;
  color: string;
}

export interface CountrySource {
  labelKey?: string;
  label?: string;
  url: string;
}

const YEAR_POINTS = [0, 5, 10, 15, 20];
const ACCENT = '#4043af';
const ACCENT_SOFT = '#516ce8';

/** Refined Ibernia palette for the cross-country chart. */
const COUNTRY_COLORS = {
  eu: '#4043af',
  unitedStates: '#2a2f7a',
  japan: '#9aa3c7',
  china: '#7d8fd8',
} as const;

const INFLATION_ACROSS_COUNTRIES_DATA = {
  eu: [
    { year: 2016, value: 0.2 },
    { year: 2017, value: 1.7 },
    { year: 2018, value: 1.9 },
    { year: 2019, value: 1.5 },
    { year: 2020, value: 0.7 },
    { year: 2021, value: 2.9 },
    { year: 2022, value: 9.2 },
    { year: 2023, value: 6.4 },
    { year: 2024, value: 2.6 },
  ],
  japan: [
    { year: 2016, value: -0.1 },
    { year: 2017, value: 0.5 },
    { year: 2018, value: 1.0 },
    { year: 2019, value: 0.5 },
    { year: 2020, value: 0.0 },
    { year: 2021, value: -0.3 },
    { year: 2022, value: 2.5 },
    { year: 2023, value: 3.3 },
    { year: 2024, value: 2.7 },
  ],
  unitedStates: [
    { year: 2016, value: 1.3 },
    { year: 2017, value: 2.1 },
    { year: 2018, value: 2.4 },
    { year: 2019, value: 1.8 },
    { year: 2020, value: 1.2 },
    { year: 2021, value: 4.7 },
    { year: 2022, value: 8.0 },
    { year: 2023, value: 4.1 },
    { year: 2024, value: 3.0 },
  ],
  china: [
    { year: 2016, value: 2.0 },
    { year: 2017, value: 1.6 },
    { year: 2018, value: 2.1 },
    { year: 2019, value: 2.9 },
    { year: 2020, value: 2.5 },
    { year: 2021, value: 0.9 },
    { year: 2022, value: 2.0 },
    { year: 2023, value: 0.2 },
    { year: 2024, value: 0.2 },
  ],
} as const;

@Component({
  selector: 'app-learn-inflation',
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
    CurrencySymbolPipe,
  ],
  templateUrl: './learn-inflation.component.html',
  styleUrl: './learn-inflation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnInflationComponent implements OnInit {
  readonly currencyCode: string;

  /** Form control bound to the amount input (works with ThousandSeparatorInputDirective). */
  readonly startingAmountControl = new FormControl<number | null>(0);

  /** Reactive state that drives the chart + summary. */
  readonly startingAmount = signal<number>(0);
  readonly inflationRate = signal<number>(0);

  /** Locale-formatted text shown inside the inflation input. */
  readonly inflationText = signal<string>('');

  /** Which page of the educational modal is visible. */
  readonly view = signal<LearnInflationView>('impact');

  readonly latestCountryRates: CountryInflationLatest[] = [
    {
      countryKey: 'LEARN_INFLATION.COUNTRY_EU',
      value: 2.8,
      periodKey: 'LEARN_INFLATION.LATEST_EU_PERIOD',
      color: COUNTRY_COLORS.eu,
    },
    {
      countryKey: 'LEARN_INFLATION.COUNTRY_US',
      value: 3.3,
      periodKey: 'LEARN_INFLATION.LATEST_US_PERIOD',
      color: COUNTRY_COLORS.unitedStates,
    },
    {
      countryKey: 'LEARN_INFLATION.COUNTRY_JAPAN',
      value: 1.3,
      periodKey: 'LEARN_INFLATION.LATEST_JAPAN_PERIOD',
      color: COUNTRY_COLORS.japan,
    },
    {
      countryKey: 'LEARN_INFLATION.COUNTRY_CHINA',
      value: 1.0,
      periodKey: 'LEARN_INFLATION.LATEST_CHINA_PERIOD',
      color: COUNTRY_COLORS.china,
    },
  ];

  readonly countrySources: CountrySource[] = [
    {
      label: 'Eurostat',
      url: 'https://ec.europa.eu/eurostat/statistics-explained/SEPDF/cache/4176.pdf',
    },
    {
      label: 'Eurostat data',
      url: 'https://ec.europa.eu/eurostat/statistics-explained/images/3/38/Consumer_prices_-_inflation_2015-2024%282025-03-12%29.xlsx',
    },
    {
      label: 'Euro indicators',
      url: 'https://ec.europa.eu/eurostat/news/euro-indicators',
    },
    {
      label: 'OECD',
      url: 'https://www.oecd.org/en/data/indicators/inflation-cpi.html',
    },
  ];

  readonly countriesChartOptions = computed(() => this.buildCountriesChartOptions());

  readonly causes: InflationCause[] = [
    {
      iconKey: 'demand',
      titleKey: 'LEARN_INFLATION.CAUSE_DEMAND_TITLE',
      descriptionKey: 'LEARN_INFLATION.CAUSE_DEMAND_DESC',
    },
    {
      iconKey: 'cost',
      titleKey: 'LEARN_INFLATION.CAUSE_COST_TITLE',
      descriptionKey: 'LEARN_INFLATION.CAUSE_COST_DESC',
    },
    {
      iconKey: 'builtIn',
      titleKey: 'LEARN_INFLATION.CAUSE_BUILTIN_TITLE',
      descriptionKey: 'LEARN_INFLATION.CAUSE_BUILTIN_DESC',
    },
  ];

  readonly realValues: Signal<number[]> = computed(() => {
    const start = this.startingAmount() || 0;
    const rate = (this.inflationRate() || 0) / 100;
    const denom = 1 + rate;
    return YEAR_POINTS.map((y) =>
      denom > 0 ? start / Math.pow(denom, y) : start,
    );
  });

  readonly endValue = computed(() => {
    const series = this.realValues();
    return series[series.length - 1] ?? 0;
  });

  readonly lossPercent = computed(() => {
    const start = this.startingAmount() || 0;
    if (start <= 0) return 0;
    const end = this.endValue();
    return Math.max(0, ((start - end) / start) * 100);
  });

  readonly chartOptions = computed(() => this.buildChartOptions());

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  constructor(
    public dialogRef: MatDialogRef<LearnInflationComponent>,
    @Inject(MAT_DIALOG_DATA) data: LearnInflationDialogData,
  ) {
    this.currencyCode = data?.currencyCode ?? '';

    const initialStart = Number.isFinite(data?.startingAmount)
      ? Math.max(0, Number(data.startingAmount))
      : 0;
    const initialRate = Number.isFinite(data?.inflationRate)
      ? Math.max(0, Math.min(100, Number(data.inflationRate)))
      : 2.5;

    this.startingAmount.set(initialStart);
    this.inflationRate.set(initialRate);
    this.inflationText.set(this.formatRateForLocale(initialRate));
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
      });
  }

  onInflationInput(rawValue: string): void {
    const cleaned = (rawValue ?? '').replace('%', '').trim();
    this.inflationText.set(cleaned);
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') {
      this.inflationRate.set(0);
      return;
    }
    const value = parseFormattedNumber(cleaned, this.translate.currentLang);
    this.inflationRate.set(Math.max(0, Math.min(100, value)));
  }

  onInflationBlur(): void {
    this.inflationText.set(this.formatRateForLocale(this.inflationRate()));
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  goToCauses(): void {
    this.view.set('causes');
  }

  goToCountries(): void {
    this.view.set('countries');
  }

  backToImpact(): void {
    this.view.set('impact');
  }

  formatPercent(value: number): string {
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10) / 10;
    return `${rounded.toFixed(1).replace('.', decimal)}%`;
  }

  formatAmount(value: number): string {
    return formatAppDisplayNumber(this.translate.currentLang, value || 0);
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  private formatRateForLocale(value: number): string {
    if (!Number.isFinite(value)) return '';
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
    return text.replace('.', decimal);
  }

  private buildChartOptions(): any {
    const data = this.realValues();
    const yearPrefix = this.translate.instant('LEARN_INFLATION.AXIS_YEAR_PREFIX');
    const categories = YEAR_POINTS.map((y) => `${yearPrefix}${y}`);
    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, value || 0);
      const symbol = this.currencySymbol;
      return symbol ? `${symbol} ${formatted}` : formatted;
    };

    return {
      series: [
        {
          name: this.translate.instant('LEARN_INFLATION.SERIES_NAME'),
          data: data.map((v) => Math.round(v)),
        },
      ],
      chart: {
        type: 'area',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
        parentHeightOffset: 0,
      },
      colors: [ACCENT],
      stroke: { width: 3, curve: 'smooth' },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.32,
          opacityTo: 0.04,
          stops: [0, 90, 100],
          colorStops: [
            { offset: 0, color: ACCENT, opacity: 0.32 },
            { offset: 100, color: ACCENT, opacity: 0.04 },
          ],
        },
      },
      markers: {
        size: 5,
        colors: ['#ffffff'],
        strokeColors: ACCENT,
        strokeWidth: 2,
        hover: { size: 7 },
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
        type: 'category',
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '13px',
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
      legend: { show: false },
      tooltip: {
        theme: 'light',
        marker: { show: false },
        x: { show: true },
        y: {
          formatter: (value: number) => formatCurrency(value),
          title: {
            formatter: () =>
              this.translate.instant('LEARN_INFLATION.TOOLTIP_LABEL'),
          },
        },
      },
      annotations: {
        points: data.length
          ? [
              {
                x: categories[categories.length - 1],
                y: Math.round(data[data.length - 1]),
                marker: {
                  size: 6,
                  fillColor: ACCENT_SOFT,
                  strokeColor: '#ffffff',
                  strokeWidth: 3,
                  radius: 6,
                },
                label: {
                  borderColor: 'transparent',
                  offsetY: -12,
                  style: {
                    background: ACCENT,
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'Ubuntu, sans-serif',
                    padding: { left: 10, right: 10, top: 6, bottom: 6 },
                  },
                  text: formatCurrency(data[data.length - 1]),
                },
              },
            ]
          : [],
      },
    };
  }

  private buildCountriesChartOptions(): any {
    const data = INFLATION_ACROSS_COUNTRIES_DATA;
    const categories = data.eu.map((p) => String(p.year));
    const round1 = (v: number) => Math.round(v * 10) / 10;

    const series = [
      {
        name: this.translate.instant('LEARN_INFLATION.COUNTRY_EU'),
        data: data.eu.map((p) => round1(p.value)),
      },
      {
        name: this.translate.instant('LEARN_INFLATION.COUNTRY_US'),
        data: data.unitedStates.map((p) => round1(p.value)),
      },
      {
        name: this.translate.instant('LEARN_INFLATION.COUNTRY_JAPAN'),
        data: data.japan.map((p) => round1(p.value)),
      },
      {
        name: this.translate.instant('LEARN_INFLATION.COUNTRY_CHINA'),
        data: data.china.map((p) => round1(p.value)),
      },
    ];

    const colors = [
      COUNTRY_COLORS.eu,
      COUNTRY_COLORS.unitedStates,
      COUNTRY_COLORS.japan,
      COUNTRY_COLORS.china,
    ];

    const decimal = this.translate.currentLang === 'it' ? ',' : '.';

    return {
      series,
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
        parentHeightOffset: 0,
      },
      colors,
      stroke: {
        width: 2.5,
        curve: 'smooth',
        lineCap: 'round',
      },
      dataLabels: { enabled: false },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 5 },
      },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 24, top: 8, bottom: 0 },
      },
      xaxis: {
        type: 'category',
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
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
            `${(Math.round(value * 10) / 10).toFixed(1).replace('.', decimal)}%`,
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontFamily: 'Ubuntu, sans-serif',
        fontSize: '13px',
        fontWeight: 500,
        labels: { colors: '#5a596e' },
        markers: {
          width: 10,
          height: 10,
          radius: 10,
          offsetX: -2,
        },
        itemMargin: { horizontal: 12, vertical: 0 },
      },
      tooltip: {
        theme: 'light',
        shared: true,
        intersect: false,
        x: { show: true },
        y: {
          formatter: (value: number) =>
            `${(Math.round(value * 10) / 10).toFixed(1).replace('.', decimal)}%`,
        },
      },
    };
  }
}
