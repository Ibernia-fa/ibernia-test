import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';

import type {
  LearnRentOrBuyAssumptions,
  LearnRentOrBuyAssumptionsDialogData,
} from './learn-rent-or-buy.types';

@Component({
  selector: 'app-learn-rent-or-buy-assumptions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './learn-rent-or-buy-assumptions-dialog.component.html',
  styleUrl: './learn-rent-or-buy-assumptions-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnRentOrBuyAssumptionsDialogComponent {
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<LearnRentOrBuyAssumptionsDialogComponent>);

  readonly mortgageRatePct = signal<number>(0);
  readonly mortgageRateText = signal<string>('');

  readonly homeAppreciationPct = signal<number>(0);
  readonly homeAppreciationText = signal<string>('');

  readonly investmentReturnPct = signal<number>(0);
  readonly investmentReturnText = signal<string>('');

  readonly inflationPct = signal<number>(0);
  readonly inflationText = signal<string>('');

  readonly ownershipCostsPct = signal<number>(0);
  readonly ownershipCostsText = signal<string>('');

  readonly roundTripCostsPct = signal<number>(0);
  readonly roundTripCostsText = signal<string>('');

  constructor(@Inject(MAT_DIALOG_DATA) data: LearnRentOrBuyAssumptionsDialogData) {
    this.mortgageRatePct.set(data.mortgageRatePct);
    this.homeAppreciationPct.set(data.homeAppreciationPct);
    this.investmentReturnPct.set(data.investmentReturnPct);
    this.inflationPct.set(data.inflationPct);
    this.ownershipCostsPct.set(data.ownershipCostsPct);
    this.roundTripCostsPct.set(data.roundTripCostsPct);

    this.mortgageRateText.set(this.formatDecimal(this.mortgageRatePct(), 1));
    this.homeAppreciationText.set(this.formatDecimal(this.homeAppreciationPct(), 1));
    this.investmentReturnText.set(this.formatDecimal(this.investmentReturnPct(), 1));
    this.inflationText.set(this.formatDecimal(this.inflationPct(), 1));
    this.ownershipCostsText.set(this.formatDecimal(this.ownershipCostsPct(), 1));
    this.roundTripCostsText.set(this.formatDecimal(this.roundTripCostsPct(), 1));
  }

  cancel(): void {
    this.dialogRef.close();
  }

  apply(): void {
    const result: LearnRentOrBuyAssumptions = {
      mortgageRatePct: this.mortgageRatePct(),
      homeAppreciationPct: this.homeAppreciationPct(),
      investmentReturnPct: this.investmentReturnPct(),
      inflationPct: this.inflationPct(),
      ownershipCostsPct: this.ownershipCostsPct(),
      roundTripCostsPct: this.roundTripCostsPct(),
    };
    this.dialogRef.close(result);
  }

  // ---------- Field handlers ----------

  onMortgageRateInput(raw: string): void {
    this.mortgageRateText.set(raw);
    this.mortgageRatePct.set(this.clamp(this.parse(raw), 0, 100));
  }
  onMortgageRateBlur(): void {
    this.mortgageRateText.set(this.formatDecimal(this.mortgageRatePct(), 1));
  }

  onHomeAppreciationInput(raw: string): void {
    this.homeAppreciationText.set(raw);
    this.homeAppreciationPct.set(this.parse(raw));
  }
  onHomeAppreciationBlur(): void {
    this.homeAppreciationText.set(this.formatDecimal(this.homeAppreciationPct(), 1));
  }

  onInvestmentReturnInput(raw: string): void {
    this.investmentReturnText.set(raw);
    this.investmentReturnPct.set(this.parse(raw));
  }
  onInvestmentReturnBlur(): void {
    this.investmentReturnText.set(this.formatDecimal(this.investmentReturnPct(), 1));
  }

  onInflationInput(raw: string): void {
    this.inflationText.set(raw);
    this.inflationPct.set(this.parse(raw));
  }
  onInflationBlur(): void {
    this.inflationText.set(this.formatDecimal(this.inflationPct(), 1));
  }

  onOwnershipCostsInput(raw: string): void {
    this.ownershipCostsText.set(raw);
    this.ownershipCostsPct.set(Math.max(0, this.parse(raw)));
  }
  onOwnershipCostsBlur(): void {
    this.ownershipCostsText.set(this.formatDecimal(this.ownershipCostsPct(), 1));
  }

  onRoundTripCostsInput(raw: string): void {
    this.roundTripCostsText.set(raw);
    this.roundTripCostsPct.set(Math.max(0, this.parse(raw)));
  }
  onRoundTripCostsBlur(): void {
    this.roundTripCostsText.set(this.formatDecimal(this.roundTripCostsPct(), 1));
  }

  // ---------- Helpers ----------

  private parse(raw: string): number {
    const cleaned = (raw ?? '').toString().replace('%', '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === ',') return 0;
    return parseFormattedNumber(cleaned, this.translate.currentLang);
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  private formatDecimal(value: number, digits: number): string {
    if (!Number.isFinite(value)) return '';
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
    return rounded.toFixed(digits).replace('.', decimal);
  }
}
