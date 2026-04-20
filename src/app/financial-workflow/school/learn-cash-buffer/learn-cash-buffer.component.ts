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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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

export interface LearnCashBufferDialogData {
  currentCash: number;
  monthlyRecurringExpenses: number;
  currencyCode?: string;
}

export type CashBufferInterpretation = 'below' | 'within' | 'above' | 'neutral';

const ACCENT = '#4043af';
const MUTE = '#9aa3c7';

@Component({
  selector: 'app-learn-cash-buffer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    NgApexchartsModule,
    TranslateModule,
    ThousandSeparatorInputDirective,
  ],
  templateUrl: './learn-cash-buffer.component.html',
  styleUrl: './learn-cash-buffer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnCashBufferComponent implements OnInit {
  readonly currencyCode: string;

  readonly cashControl = new FormControl<number | null>(0);
  readonly expensesControl = new FormControl<number | null>(0);

  readonly cash = signal(0);
  readonly monthlyExpenses = signal(0);

  readonly buffer3 = computed(() => Math.max(0, this.monthlyExpenses()) * 3);
  readonly buffer6 = computed(() => Math.max(0, this.monthlyExpenses()) * 6);
  readonly buffer12 = computed(() => Math.max(0, this.monthlyExpenses()) * 12);

  readonly chartMax = computed(() => {
    const c = this.cash();
    const b12 = this.buffer12();
    const b3 = this.buffer3();
    return Math.max(c, b12 * 1.06, b3 * 1.15, 1);
  });

  readonly markerPercent = computed(() => {
    const max = this.chartMax();
    if (max <= 0) return 0;
    return Math.min(100, (this.cash() / max) * 100);
  });

  readonly zoneLowWidthPct = computed(() => {
    const max = this.chartMax();
    const edge = this.buffer3();
    if (max <= 0) return 0;
    return Math.min(100, (edge / max) * 100);
  });

  readonly zoneMidWidthPct = computed(() => {
    const max = this.chartMax();
    const low = this.buffer3();
    const high = this.buffer12();
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100 - (low / max) * 100, ((high - low) / max) * 100));
  });

  readonly zoneHighWidthPct = computed(() => {
    const a = this.zoneLowWidthPct();
    const b = this.zoneMidWidthPct();
    return Math.max(0, 100 - a - b);
  });

  readonly interpretation: Signal<CashBufferInterpretation> = computed(() => {
    const m = this.monthlyExpenses();
    if (m <= 0) return 'neutral';
    const c = this.cash();
    const low = m * 3;
    const high = m * 12;
    if (c < low) return 'below';
    if (c > high) return 'above';
    return 'within';
  });

  readonly chartOptions = computed(() => this.buildBarChartOptions());

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencySymbolPipe = new CurrencySymbolPipe();

  constructor(
    public dialogRef: MatDialogRef<LearnCashBufferComponent>,
    @Inject(MAT_DIALOG_DATA) data: LearnCashBufferDialogData,
  ) {
    this.currencyCode = data?.currencyCode ?? '';

    const initialCash = Number.isFinite(data?.currentCash)
      ? Math.max(0, Number(data.currentCash))
      : 0;
    const initialExp = Number.isFinite(data?.monthlyRecurringExpenses)
      ? Math.max(0, Number(data.monthlyRecurringExpenses))
      : 0;

    this.cash.set(initialCash);
    this.monthlyExpenses.set(initialExp);
    this.cashControl.setValue(initialCash, { emitEvent: false });
    this.expensesControl.setValue(initialExp, { emitEvent: false });
  }

  ngOnInit(): void {
    this.cashControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const parsed =
          typeof value === 'number'
            ? value
            : parseFormattedNumber(value as unknown as string, this.translate.currentLang);
        this.cash.set(Math.max(0, parsed || 0));
      });

    this.expensesControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const parsed =
          typeof value === 'number'
            ? value
            : parseFormattedNumber(value as unknown as string, this.translate.currentLang);
        this.monthlyExpenses.set(Math.max(0, parsed || 0));
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatAmount(value: number): string {
    return formatAppDisplayNumber(this.translate.currentLang, value || 0);
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }

  private buildBarChartOptions(): any {
    const b3 = Math.round(this.buffer3());
    const b6 = Math.round(this.buffer6());
    const b12 = Math.round(this.buffer12());
    const c = Math.round(this.cash());

    const categories = [
      this.translate.instant('LEARN_CASH_BUFFER.CHART_CAT_3'),
      this.translate.instant('LEARN_CASH_BUFFER.CHART_CAT_6'),
      this.translate.instant('LEARN_CASH_BUFFER.CHART_CAT_12'),
      this.translate.instant('LEARN_CASH_BUFFER.CHART_CAT_YOURS'),
    ];

    const formatCurrency = (value: number): string => {
      const formatted = formatAppDisplayNumber(this.translate.currentLang, value || 0);
      const symbol = this.currencySymbol;
      return symbol ? `${symbol} ${formatted}` : formatted;
    };

    return {
      series: [
        {
          name: this.translate.instant('LEARN_CASH_BUFFER.CHART_SERIES'),
          data: [b3, b6, b12, c],
        },
      ],
      chart: {
        type: 'bar',
        height: '100%',
        fontFamily: 'Ubuntu, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 550 },
        parentHeightOffset: 0,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: '72%',
          distributed: true,
          dataLabels: { position: 'right' },
        },
      },
      colors: [MUTE, MUTE, MUTE, ACCENT],
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#eef0f6',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 20, top: 4, bottom: 0 },
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
            fontWeight: 500,
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
        y: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      states: {
        hover: { filter: { type: 'darken', value: 0.94 } },
      },
    };
  }
}
