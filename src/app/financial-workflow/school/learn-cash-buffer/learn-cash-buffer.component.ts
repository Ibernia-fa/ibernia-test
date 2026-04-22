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

import { AutoFitTitleDirective } from 'src/app/directives/auto-fit-title.directive';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import {
  formatAppDisplayNumber,
  localeFromAppLanguage,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

export interface LearnCashBufferDialogData {
  currentCash: number;
  monthlyRecurringExpenses: number;
  currencyCode?: string;
}

export type CashBufferInterpretation = 'below' | 'within' | 'above' | 'neutral';

@Component({
  selector: 'app-learn-cash-buffer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    TranslateModule,
    ThousandSeparatorInputDirective,
    AutoFitTitleDirective,
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

  /** Months of expenses covered when monthly expenses are positive; otherwise null (neutral UI). */
  readonly bufferMonths = computed((): number | null => {
    const m = this.monthlyExpenses();
    if (m <= 0) return null;
    return this.cash() / m;
  });

  /** Fixed visual scale for the benchmark graph only (0–24 months); does not affect numeric results. */
  readonly benchmarkVisualMaxMonths = 24;

  /**
   * Visual position of the marker on the rendered scale, expressed as a
   * percentage of the chart track width. Values 0–100 map directly to 0–24
   * months. When the real buffer exceeds 24 months, the marker is parked
   * inside a small reserved area just past the 24 tick (around 102%) so the
   * "You are here" callout stays fully visible inside the card.
   */
  readonly markerPercent = computed(() => {
    const bm = this.bufferMonths();
    if (bm === null) return null;
    const max = this.benchmarkVisualMaxMonths;
    if (bm > max) return 102;
    return (Math.max(0, bm) / max) * 100;
  });

  /** True when the real value exceeds the visual max (marker is parked in the reserved area). */
  readonly markerClamped = computed(() => {
    const bm = this.bufferMonths();
    return bm !== null && bm > this.benchmarkVisualMaxMonths;
  });

  /**
   * Horizontal alignment for the marker callout so it stays inside the card
   * at both ends of the scale (left-aligned near 0, right-aligned near the
   * clamped end, centered everywhere else).
   */
  readonly markerCalloutAlignment = computed<'start' | 'center' | 'end'>(() => {
    const p = this.markerPercent();
    if (p === null) return 'center';
    if (p <= 8) return 'start';
    if (p >= 92) return 'end';
    return 'center';
  });

  readonly interpretation: Signal<CashBufferInterpretation> = computed(() => {
    const bm = this.bufferMonths();
    if (bm === null) return 'neutral';
    if (bm < 3) return 'below';
    if (bm > 12) return 'above';
    return 'within';
  });

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

  /** Months count for copy and the large figure (locale-aware, up to one decimal when helpful). */
  formatMonthsDisplay(months: number | null): string {
    if (months === null || !Number.isFinite(months)) {
      return '';
    }
    const lang = this.translate.currentLang;
    const locale = localeFromAppLanguage(lang);
    const rounded = Math.round(months * 10) / 10;
    const useFraction = rounded < 20 && Math.abs(rounded - Math.round(rounded)) > 0.001;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: useFraction ? 1 : 0,
      maximumFractionDigits: useFraction ? 1 : 0,
    }).format(rounded);
  }

  /** i18n key for "month" vs "months" from a rounded buffer value. */
  bufferMonthWordKey(months: number | null): string {
    if (months === null || !Number.isFinite(months)) {
      return 'LEARN_CASH_BUFFER.MONTHS_WORD';
    }
    const rounded = Math.round(months * 100) / 100;
    return rounded >= 0.99 && rounded <= 1.01
      ? 'LEARN_CASH_BUFFER.MONTH_SINGULAR'
      : 'LEARN_CASH_BUFFER.MONTHS_WORD';
  }

  get currencySymbol(): string {
    return this.currencyCode
      ? this.currencySymbolPipe.transform(this.currencyCode)
      : '';
  }
}
