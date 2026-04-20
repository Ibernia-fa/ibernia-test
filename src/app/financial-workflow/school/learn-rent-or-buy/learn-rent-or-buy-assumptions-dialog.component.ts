import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  formatAppDisplayNumber,
  parseFormattedNumber,
} from 'src/app/shared/utils/number-utils';

import type {
  LearnRentOrBuyAssumptionValues,
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
    TranslateModule,
  ],
  templateUrl: './learn-rent-or-buy-assumptions-dialog.component.html',
  styleUrl: './learn-rent-or-buy-assumptions-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnRentOrBuyAssumptionsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LearnRentOrBuyAssumptionsDialogComponent>);
  private readonly translate = inject(TranslateService);

  mortgageRateText = signal('');
  mortgageTermText = signal('');
  horizonText = signal('');
  homeGrowthText = signal('');
  rentGrowthText = signal('');
  investReturnText = signal('');
  closingText = signal('');
  propertyTaxText = signal('');
  maintenanceText = signal('');
  sellingText = signal('');
  inflationText = signal('');

  insuranceYearlyText = signal('');
  hoaText = signal('');
  renterInsText = signal('');

  mortgageRate = signal(0);
  mortgageTermYears = signal(0);
  horizonYears = signal(0);
  homePriceGrowth = signal(0);
  rentGrowth = signal(0);
  investmentReturn = signal(0);
  closingCostsPct = signal(0);
  propertyTaxPct = signal(0);
  homeInsuranceYearly = signal(0);
  maintenancePctYearly = signal(0);
  hoaMonthly = signal(0);
  sellingCostsPct = signal(0);
  renterInsuranceMonthly = signal(0);
  generalInflation = signal(0);

  constructor(@Inject(MAT_DIALOG_DATA) data: LearnRentOrBuyAssumptionsDialogData) {
    this.patchFromData(data);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  apply(): void {
    this.dialogRef.close(this.collectValues());
  }

  onMortgageInterestInput(raw: string): void {
    this.applyRateInput(raw, this.mortgageRateText, (v) => this.mortgageRate.set(v));
  }

  onMortgageInterestBlur(): void {
    this.mortgageRateText.set(this.formatRate(this.mortgageRate()));
  }

  onHomeGrowthInput(raw: string): void {
    this.applyRateInput(raw, this.homeGrowthText, (v) => this.homePriceGrowth.set(v));
  }

  onHomeGrowthBlur(): void {
    this.homeGrowthText.set(this.formatRate(this.homePriceGrowth()));
  }

  onRentGrowthInput(raw: string): void {
    this.applyRateInput(raw, this.rentGrowthText, (v) => this.rentGrowth.set(v));
  }

  onRentGrowthBlur(): void {
    this.rentGrowthText.set(this.formatRate(this.rentGrowth()));
  }

  onInvestReturnInput(raw: string): void {
    this.applyRateInput(raw, this.investReturnText, (v) => this.investmentReturn.set(v));
  }

  onInvestReturnBlur(): void {
    this.investReturnText.set(this.formatRate(this.investmentReturn()));
  }

  onInflationInput(raw: string): void {
    this.applyRateInput(raw, this.inflationText, (v) => this.generalInflation.set(v));
  }

  onInflationBlur(): void {
    this.inflationText.set(this.formatRate(this.generalInflation()));
  }

  onClosingInput(raw: string): void {
    this.applyRateInput(raw, this.closingText, (v) => this.closingCostsPct.set(v));
  }

  onClosingBlur(): void {
    this.closingText.set(this.formatRate(this.closingCostsPct()));
  }

  onPropertyTaxInput(raw: string): void {
    this.applyRateInput(raw, this.propertyTaxText, (v) => this.propertyTaxPct.set(v));
  }

  onPropertyTaxBlur(): void {
    this.propertyTaxText.set(this.formatRate(this.propertyTaxPct()));
  }

  onMaintenanceInput(raw: string): void {
    this.applyRateInput(raw, this.maintenanceText, (v) => this.maintenancePctYearly.set(v));
  }

  onMaintenanceBlur(): void {
    this.maintenanceText.set(this.formatRate(this.maintenancePctYearly()));
  }

  onSellingInput(raw: string): void {
    this.applyRateInput(raw, this.sellingText, (v) => this.sellingCostsPct.set(v));
  }

  onSellingBlur(): void {
    this.sellingText.set(this.formatRate(this.sellingCostsPct()));
  }

  onInsuranceYearlyInput(raw: string): void {
    const cleaned = (raw ?? '').trim();
    this.insuranceYearlyText.set(cleaned);
    if (cleaned === '') {
      this.homeInsuranceYearly.set(0);
      return;
    }
    const n = parseFormattedNumber(cleaned, this.translate.currentLang);
    this.homeInsuranceYearly.set(Math.max(0, n));
  }

  onInsuranceYearlyBlur(): void {
    this.insuranceYearlyText.set(
      formatAppDisplayNumber(this.translate.currentLang, Math.round(this.homeInsuranceYearly())),
    );
  }

  onHoaInput(raw: string): void {
    const cleaned = (raw ?? '').trim();
    this.hoaText.set(cleaned);
    if (cleaned === '') {
      this.hoaMonthly.set(0);
      return;
    }
    const n = parseFormattedNumber(cleaned, this.translate.currentLang);
    this.hoaMonthly.set(Math.max(0, n));
  }

  onHoaBlur(): void {
    this.hoaText.set(
      formatAppDisplayNumber(this.translate.currentLang, Math.round(this.hoaMonthly())),
    );
  }

  onRenterInsInput(raw: string): void {
    const cleaned = (raw ?? '').trim();
    this.renterInsText.set(cleaned);
    if (cleaned === '') {
      this.renterInsuranceMonthly.set(0);
      return;
    }
    const n = parseFormattedNumber(cleaned, this.translate.currentLang);
    this.renterInsuranceMonthly.set(Math.max(0, n));
  }

  onRenterInsBlur(): void {
    this.renterInsText.set(
      formatAppDisplayNumber(this.translate.currentLang, Math.round(this.renterInsuranceMonthly())),
    );
  }

  onMortgageTermInput(raw: string): void {
    const cleaned = (raw ?? '').trim();
    this.mortgageTermText.set(cleaned);
    if (cleaned === '' || cleaned === '-') {
      this.mortgageTermYears.set(1);
      return;
    }
    const n = Math.round(parseFormattedNumber(cleaned, this.translate.currentLang));
    this.mortgageTermYears.set(Math.max(1, Math.min(40, n)));
  }

  onMortgageTermBlur(): void {
    const y = Math.max(1, Math.min(40, this.mortgageTermYears() || 1));
    this.mortgageTermYears.set(y);
    this.mortgageTermText.set(String(y));
  }

  onHorizonInput(raw: string): void {
    const cleaned = (raw ?? '').trim();
    this.horizonText.set(cleaned);
    if (cleaned === '' || cleaned === '-') {
      this.horizonYears.set(1);
      return;
    }
    const n = Math.round(parseFormattedNumber(cleaned, this.translate.currentLang));
    this.horizonYears.set(Math.max(1, Math.min(80, n)));
  }

  onHorizonBlur(): void {
    const y = Math.max(1, Math.min(80, this.horizonYears() || 1));
    this.horizonYears.set(y);
    this.horizonText.set(String(y));
  }

  private patchFromData(data: LearnRentOrBuyAssumptionsDialogData): void {
    this.mortgageRate.set(data.mortgageRatePct);
    this.mortgageTermYears.set(data.mortgageTermYears);
    this.horizonYears.set(data.horizonYears);
    this.homePriceGrowth.set(data.homePriceGrowthPct);
    this.rentGrowth.set(data.rentGrowthPct);
    this.investmentReturn.set(data.investmentReturnPct);
    this.closingCostsPct.set(data.closingCostsPct);
    this.propertyTaxPct.set(data.propertyTaxPct);
    this.homeInsuranceYearly.set(data.homeInsuranceYearly);
    this.maintenancePctYearly.set(data.maintenancePctYearly);
    this.hoaMonthly.set(data.hoaMonthly);
    this.sellingCostsPct.set(data.sellingCostsPct);
    this.renterInsuranceMonthly.set(data.renterInsuranceMonthly);
    this.generalInflation.set(data.generalInflationPct);

    this.mortgageRateText.set(this.formatRate(data.mortgageRatePct));
    this.mortgageTermText.set(String(data.mortgageTermYears));
    this.horizonText.set(String(data.horizonYears));
    this.homeGrowthText.set(this.formatRate(data.homePriceGrowthPct));
    this.rentGrowthText.set(this.formatRate(data.rentGrowthPct));
    this.investReturnText.set(this.formatRate(data.investmentReturnPct));
    this.closingText.set(this.formatRate(data.closingCostsPct));
    this.propertyTaxText.set(this.formatRate(data.propertyTaxPct));
    this.maintenanceText.set(this.formatRate(data.maintenancePctYearly));
    this.sellingText.set(this.formatRate(data.sellingCostsPct));
    this.inflationText.set(this.formatRate(data.generalInflationPct));
    this.insuranceYearlyText.set(
      formatAppDisplayNumber(this.translate.currentLang, Math.round(data.homeInsuranceYearly)),
    );
    this.hoaText.set(formatAppDisplayNumber(this.translate.currentLang, Math.round(data.hoaMonthly)));
    this.renterInsText.set(
      formatAppDisplayNumber(this.translate.currentLang, Math.round(data.renterInsuranceMonthly)),
    );
  }

  private collectValues(): LearnRentOrBuyAssumptionValues {
    return {
      mortgageRatePct: this.mortgageRate(),
      mortgageTermYears: Math.max(1, this.mortgageTermYears()),
      horizonYears: Math.max(1, this.horizonYears()),
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

  private applyRateInput(
    rawValue: string,
    textSignal: typeof this.mortgageRateText,
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

  private formatRate(value: number): string {
    if (!Number.isFinite(value)) return '';
    const decimal = this.translate.currentLang === 'it' ? ',' : '.';
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
    return text.replace('.', decimal);
  }
}
