import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  OnInit,
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

export interface LearnInvestToReachGoalDialogData {
  currentAge: number;
  inflationRate: number;
  currencyCode?: string;
}

const DEFAULT_GOAL_AMOUNT = 1_000_000;
const DEFAULT_GOAL_AGE = 65;
const DEFAULT_RETURN_RATE = 5;

const ACCENT = '#4043af';
const GOAL_LINE = 'rgba(64, 67, 175, 0.55)';

function monthlyRateFromAnnual(annualDecimal: number): number {
  if (annualDecimal <= 0) return 0;
  return Math.pow(1 + annualDecimal, 1 / 12) - 1;
}

/** Future value of end-of-month contributions after `months` months. */
function fvOfMonthlyContributions(
  monthlyPayment: number,
  annualReturnPct: number,
  months: number,
): number {
  if (months <= 0 || monthlyPayment <= 0) return 0;
  const r = (annualReturnPct || 0) / 100;
  if (r === 0) {
    return monthlyPayment * months;
  }
  const i = monthlyRateFromAnnual(r);
  if (i <= 0) return monthlyPayment * months;
  return monthlyPayment * ((Math.pow(1 + i, months) - 1) / i);
}

function monthlyPaymentForFv(
  fv: number,
  annualReturnPct: number,
  months: number,
): number {
  if (!Number.isFinite(fv) || fv <= 0) return 0;
  if (months <= 0) return 0;
  const r = (annualReturnPct || 0) / 100;
  if (r === 0) {
    return fv / months;
  }
  const i = monthlyRateFromAnnual(r);
  if (i <= 0) return fv / months;
  const denom = Math.pow(1 + i, months) - 1;
  if (denom <= 0) return 0;
  return (fv * i) / denom;
}

@Component({
  selector: 'app-learn-invest-to-reach-goal',
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
  templateUrl: './learn-invest-to-reach-goal.component.html',
  styleUrl: './learn-invest-to-reach-goal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnInvestToReachGoalComponent implements OnInit {
  readonly currencyCode: string;
  readonly currentAge: number;

  readonly goalAmountControl = new FormControl<number | null>(DEFAULT_GOAL_AMOUNT);

  readonly goalAmount = signal<number>(DEFAULT_GOAL_AMOUNT);
  readonly goalAge = signal<number>(DEFAULT_GOAL_AGE);
  readonly returnRate = signal<number>(DEFAULT_RETURN_RATE);
  readonly inflationRate = signal<number>(0);
  readonly showRealValue = signal<boolean>(false);

  readonly returnText = signal<string>('');
  readonly inflationText = signal<string>('');
  readonly goalAgeText = signal<string>('');

  private readonly baselinePlanInflation: number;

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  readonly hasClientAge = computed(() => Number.isFinite(this.currentAge));

  readonly yearsToInvest = computed(() => {
    const end = this.goalAge();
    const start = this.currentAge;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.max(0, Math.trunc(end) - Math.trunc(start));
  });

  readonly horizonValid = computed(
    () => this.hasClientAge() && this.yearsToInvest() > 0,
  );

  readonly nominalTargetFv = computed(() => {
    const goal = this.goalAmount() || 0;
    const years = this.yearsToInvest();
    const inf = (this.inflationRate() || 0) / 100;
    if (goal <= 0 || years <= 0) return 0;
    if (!this.showRealValue()) return goal;
    return goal * Math.pow(1 + inf, years);
  });

  readonly monthlyPayment = computed(() => {
    if (!this.horizonValid()) return 0;
    const fv = this.nominalTargetFv();
    const months = this.yearsToInvest() * 12;
    return monthlyPaymentForFv(fv, this.returnRate(), months);
  });

  readonly chartYValuesNominal = computed(() => {
    const pmt = this.monthlyPayment();
    const years = this.yearsToInvest();
    const out: number[] = [];
    if (!this.horizonValid() || pmt <= 0) {
      return out;
    }
    for (let y = 0; y <= years; y++) {
      out.push(Math.round(fvOfMonthlyContributions(pmt, this.returnRate(), y * 12)));
    }
    return out;
  });

  readonly chartYValuesDisplay = computed(() => {
    const nominal = this.chartYValuesNominal();
    if (!this.showRealValue()) return nominal;
    const inf = (this.inflationRate() || 0) / 100;
    const denom = 1 + inf;
    if (denom <= 0) return nominal;
    return nominal.map((v, yearIdx) => Math.round(v / Math.pow(denom, yearIdx)));
  });

  readonly chartOptions = computed(() => this.buildChartOptions());

  constructor(
    public dialogRef: MatDialogRef<LearnInvestToReachGoalComponent>,
    @Inject(MAT_DIALOG_DATA) data: LearnInvestToReachGoalDialogData,
  ) {
    this.currencyCode = data?.currencyCode ?? '';
    this.currentAge = Number.isFinite(data?.currentAge) ? Math.trunc(data.currentAge) : NaN;

    const initialInflation = Number.isFinite(data?.inflationRate)
      ? Math.max(0, Math.min(100, Number(data.inflationRate)))
      : 2.5;
    this.baselinePlanInflation = initialInflation;

    this.inflationRate.set(initialInflation);
    this.returnRate.set(DEFAULT_RETURN_RATE);
    this.goalAge.set(DEFAULT_GOAL_AGE);

    this.returnText.set(this.formatRateForLocale(DEFAULT_RETURN_RATE));
    this.inflationText.set(this.formatRateForLocale(initialInflation));
    this.goalAgeText.set(String(DEFAULT_GOAL_AGE));
    this.goalAmountControl.setValue(DEFAULT_GOAL_AMOUNT, { emitEvent: false });
  }

  ngOnInit(): void {
    this.goalAmountControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const parsed =
          typeof value === 'number'
            ? value
            : parseFormattedNumber(value as unknown as string, this.translate.currentLang);
        this.goalAmount.set(Math.max(0, parsed || 0));
      });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.returnText.set(this.formatRateForLocale(this.returnRate()));
        this.inflationText.set(this.formatRateForLocale(this.inflationRate()));
        this.syncGoalAgeText();
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

  onGoalAgeInput(rawValue: string): void {
    const cleaned = (rawValue ?? '').trim();
    this.goalAgeText.set(cleaned);
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') {
      this.goalAge.set(DEFAULT_GOAL_AGE);
      return;
    }
    const value = parseFormattedNumber(cleaned, this.translate.currentLang);
    const age = Math.round(Math.max(18, Math.min(110, value || DEFAULT_GOAL_AGE)));
    this.goalAge.set(age);
  }

  onGoalAgeBlur(): void {
    this.syncGoalAgeText();
  }

  onShowRealToggle(checked: boolean): void {
    this.showRealValue.set(checked);
    if (checked) {
      this.inflationRate.set(this.baselinePlanInflation);
      this.inflationText.set(this.formatRateForLocale(this.baselinePlanInflation));
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatAmount(value: number): string {
    return formatAppDisplayNumber(this.translate.currentLang, value || 0);
  }

  formatCurrencyFull(value: number): string {
    const formatted = this.formatAmount(value);
    const symbol = this.currencySymbol;
    return symbol ? `${symbol} ${formatted}` : formatted;
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  private syncGoalAgeText(): void {
    this.goalAgeText.set(String(this.goalAge()));
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
    const showReal = this.showRealValue();
    const seriesData = this.chartYValuesDisplay();
    const years = this.yearsToInvest();
    const goalLineY = showReal ? this.goalAmount() : this.nominalTargetFv();
    const yearPrefix = this.translate.instant('LEARN_INFLATION.AXIS_YEAR_PREFIX');
    const categories =
      years > 0 ? Array.from({ length: years + 1 }, (_, i) => String(i)) : [];

    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, Math.round(value));
      const symbol = this.currencySymbol;
      return symbol ? `${symbol} ${formatted}` : formatted;
    };

    const seriesName = showReal
      ? this.translate.instant('LEARN_INVEST_GOAL.SERIES_REAL')
      : this.translate.instant('LEARN_INVEST_GOAL.SERIES_NOMINAL');

    const annotationsY =
      this.horizonValid() && goalLineY > 0
        ? [
            {
              y: goalLineY,
              borderColor: GOAL_LINE,
              strokeDashArray: 6,
              borderWidth: 2,
            },
          ]
        : [];

    return {
      series: [{ name: seriesName, data: seriesData }],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 520 },
        parentHeightOffset: 0,
        cssClass: 'ibr-school-chart',
      },
      colors: [ACCENT],
      stroke: {
        width: 3,
        curve: 'smooth',
        lineCap: 'round',
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: { size: 5 },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 24, top: 8, bottom: 0 },
      },
      annotations: {
        yaxis: annotationsY,
      },
      xaxis: {
        type: 'category',
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickPlacement: 'on',
        labels: {
          style: {
            colors: '#5a596e',
            fontSize: '13px',
            fontFamily: 'Ubuntu, sans-serif',
          },
          formatter: (val: string) => {
            const n = Number.parseInt(val, 10);
            if (!Number.isFinite(n) || n % 5 !== 0) return '';
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
      legend: { show: false },
      tooltip: {
        theme: 'light',
        cssClass: 'ibr-school-tooltip ibr-school-tooltip--wide',
        style: { fontSize: '14px', fontFamily: 'Ubuntu, sans-serif' },
        marker: { show: false },
        x: {
          formatter: (_val: unknown, opts?: { dataPointIndex?: number }) => {
            const idx = opts?.dataPointIndex ?? 0;
            return `${yearPrefix}${idx}`;
          },
        },
        y: {
          formatter: (value: number) => formatCurrency(value),
          title: {
            formatter: () => `${seriesName}:`,
          },
        },
      },
    };
  }
}
