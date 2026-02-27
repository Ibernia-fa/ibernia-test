import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import {
  MortgageCalculation,
  MortgageCountryConfig,
  RateType,
  ResidencyTier,
  calculateMortgage,
  getMortgageConfig,
} from './mortgage-calculator.config';

export interface MortgageOutput {
  downPaymentAmount: number;
  monthlyEMI: number;
  loanTermYears: number;
  totalInterest: number;
  totalPayable: number;
  loanAmount: number;
}

@Component({
  selector: 'app-mortgage-calculator',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    ThousandSeparatorInputDirective,
    ThousandSeparatorPipe,
  ],
  templateUrl: './mortgage-calculator.component.html',
  styleUrl: './mortgage-calculator.component.scss',
})
export class MortgageCalculatorComponent implements OnInit, OnChanges {
  @Input() clientCountryCode: string = '';
  @Input() currencySymbol: string = '';
  @Output() calculated = new EventEmitter<MortgageOutput>();

  mortgageForm: FormGroup;
  config: MortgageCountryConfig;
  result: MortgageCalculation | null = null;
  loanTermOptions: number[] = [];
  highValueWarning: string | null = null;

  get hasResidencyTiers(): boolean {
    return !!this.config?.residencyTiers?.length;
  }

  get hasRateTypes(): boolean {
    return !!this.config?.rateTypes?.length;
  }

  get residencyTiers(): ResidencyTier[] {
    return this.config?.residencyTiers ?? [];
  }

  get rateTypes(): RateType[] {
    return this.config?.rateTypes ?? [];
  }

  get selectedTier(): ResidencyTier | null {
    if (!this.hasResidencyTiers) return null;
    const val = this.mortgageForm.get('residencyType')?.value;
    return this.config.residencyTiers?.find(t => t.value === val) ?? null;
  }

  get isHighValueProperty(): boolean {
    if (!this.config.propertyValueThreshold) return false;
    const price = this.mortgageForm.get('propertyPrice')?.value;
    return price > this.config.propertyValueThreshold;
  }

  get effectiveMinDownPayment(): number {
    const tier = this.selectedTier;
    if (tier) {
      if (this.isHighValueProperty && tier.highValueMinDownPaymentPercent != null) {
        return tier.highValueMinDownPaymentPercent;
      }
      return tier.minDownPaymentPercent;
    }
    return this.config.minDownPaymentPercent;
  }

  get effectiveMaxLTV(): number {
    const tier = this.selectedTier;
    if (tier) {
      if (this.isHighValueProperty && tier.highValueMaxLTV != null) {
        return tier.highValueMaxLTV;
      }
      return tier.maxLTV;
    }
    return this.config.maxLTV;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.config = getMortgageConfig(this.clientCountryCode);
    this.buildLoanTermOptions();
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientCountryCode'] && !changes['clientCountryCode'].firstChange) {
      this.config = getMortgageConfig(this.clientCountryCode);
      this.buildLoanTermOptions();
      this.initForm();
    }
  }

  private buildLoanTermOptions(): void {
    this.loanTermOptions = [];
    for (let y = 5; y <= this.config.maxLoanTermYears; y += 5) {
      this.loanTermOptions.push(y);
    }
    if (!this.loanTermOptions.includes(this.config.maxLoanTermYears)) {
      this.loanTermOptions.push(this.config.maxLoanTermYears);
    }
  }

  private initForm(): void {
    const defaultDown = this.config.minDownPaymentPercent;
    const defaultRate = this.config.defaultInterestRate;
    const defaultTerm = this.config.defaultLoanTermYears;

    this.mortgageForm = this.fb.group({
      propertyPrice: [null, [Validators.required, Validators.min(1)]],
      downPaymentPercent: [defaultDown, [Validators.required, Validators.min(0), Validators.max(100)]],
      interestRate: [defaultRate, [Validators.required, Validators.min(0)]],
      loanTermYears: [defaultTerm, [Validators.required]],
      residencyType: [this.config.residencyTiers?.[0]?.value ?? null],
      rateType: [this.config.rateTypes?.[0]?.value ?? null],
    });

    this.result = null;
    this.highValueWarning = null;

    this.mortgageForm.get('residencyType')?.valueChanges.subscribe(() => {
      this.syncTierDefaults();
    });

    this.mortgageForm.get('rateType')?.valueChanges.subscribe(val => {
      const rt = this.config.rateTypes?.find(r => r.value === val);
      if (rt) {
        this.mortgageForm.patchValue({ interestRate: rt.defaultRate }, { emitEvent: false });
      }
    });

    this.mortgageForm.get('propertyPrice')?.valueChanges.subscribe(() => {
      this.syncTierDefaults();
    });
  }

  /**
   * Recalculates the effective min down payment based on the current
   * residency tier and property value, then updates form validators.
   */
  private syncTierDefaults(): void {
    const tier = this.selectedTier;
    if (!tier) {
      this.highValueWarning = null;
      return;
    }

    const minDown = this.effectiveMinDownPayment;
    const currentDown = this.mortgageForm.get('downPaymentPercent')?.value;

    this.mortgageForm.get('downPaymentPercent')?.setValidators([
      Validators.required, Validators.min(minDown), Validators.max(100),
    ]);
    this.mortgageForm.get('downPaymentPercent')?.updateValueAndValidity({ emitEvent: false });

    if (currentDown < minDown) {
      this.mortgageForm.patchValue({ downPaymentPercent: minDown }, { emitEvent: false });
    }

    this.mortgageForm.patchValue({ interestRate: tier.defaultInterestRate }, { emitEvent: false });

    if (this.isHighValueProperty && tier.highValueMinDownPaymentPercent != null) {
      const threshold = this.config.propertyValueThreshold!;
      this.highValueWarning = `Property exceeds ${threshold.toLocaleString('en-US')} — higher down payment required (min ${minDown}%).`;
    } else {
      this.highValueWarning = null;
    }
  }

  onCalculate(): void {
    this.syncTierDefaults();
    this.mortgageForm.markAllAsTouched();
    if (!this.mortgageForm.valid) return;

    const { propertyPrice, downPaymentPercent, interestRate, loanTermYears } = this.mortgageForm.value;
    this.result = calculateMortgage(propertyPrice, downPaymentPercent, interestRate, loanTermYears);
  }

  onApply(): void {
    if (!this.result) return;

    this.calculated.emit({
      downPaymentAmount: this.result.downPaymentAmount,
      monthlyEMI: this.result.monthlyEMI,
      loanTermYears: this.result.loanTermYears,
      totalInterest: this.result.totalInterest,
      totalPayable: this.result.totalPayable,
      loanAmount: this.result.loanAmount,
    });
  }
}
