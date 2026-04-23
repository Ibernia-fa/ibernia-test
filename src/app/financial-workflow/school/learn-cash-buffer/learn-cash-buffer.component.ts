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

  /**
   * Fixed categorical scale: the chart is split into four constant
   * sections (0–3, 3–12, 12–24, 24+), each occupying the same share of
   * the visual track. Plotted positions never resize based on the user's
   * value, so categories are read consistently regardless of the result.
   *
   * Within a section the marker interpolates linearly between its
   * boundaries; any value above 24 months is clamped to a single
   * rendered position inside the 24+ band. The underlying month count
   * stays available for labels, badges and tooltip text.
   */
  private readonly POS_3 = 25;
  private readonly POS_12 = 50;
  private readonly POS_24 = 75;
  /** Clamped marker position for any buffer above 24 months (centered in the 24+ band). */
  private readonly POS_EXCESS = 87.5;

  /** Position percentages for the fixed reference ticks (0, 3, 12, 24). */
  readonly pos3Percent = computed(() => this.POS_3);
  readonly pos12Percent = computed(() => this.POS_12);
  readonly pos24Percent = computed(() => this.POS_24);

  /**
   * Visual position of the marker on the fixed categorical scale, in %
   * from the bottom of the track. Values above 24 all map to the same
   * coordinate so 33 months and 100 months render at the exact same
   * spot inside the 24+ band.
   */
  readonly markerPercent = computed((): number | null => {
    const bm = this.bufferMonths();
    if (bm === null) return null;
    if (bm <= 0) return 0;
    if (bm <= 3) return (bm / 3) * this.POS_3;
    if (bm <= 12) return this.POS_3 + ((bm - 3) / 9) * (this.POS_12 - this.POS_3);
    if (bm <= 24) return this.POS_12 + ((bm - 12) / 12) * (this.POS_24 - this.POS_12);
    return this.POS_EXCESS;
  });

  /** True when the buffer falls inside the 24+ band (excess cash treatment). */
  readonly isExcessive = computed(() => {
    const bm = this.bufferMonths();
    return bm !== null && bm > 24;
  });

  /**
   * Horizontal alignment for the marker callout so it stays inside the card
   * at both ends of the scale (left-aligned near 0, right-aligned near the
   * far end, centered everywhere else).
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
