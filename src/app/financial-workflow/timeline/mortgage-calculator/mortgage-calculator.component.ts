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

export interface MortgageCalculatorState {
  propertyPrice: number | null;
  downPaymentValue: number | null;
  downPaymentMode: 'currency' | 'percent';
  interestRate: number | null;
  loanTermYears: number | null;
  residencyType: string | null;
  rateType: string | null;
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
  @Input() initialState: MortgageCalculatorState | null = null;
  @Output() calculated = new EventEmitter<MortgageOutput>();
  @Output() stateChanged = new EventEmitter<MortgageCalculatorState>();

  mortgageForm: FormGroup;
  config: MortgageCountryConfig;
  result: MortgageCalculation | null = null;
  loanTermOptions: number[] = [];
  highValueWarning: string | null = null;
  downPaymentMode: 'currency' | 'percent' = 'percent';

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

  getState(): MortgageCalculatorState {
    return {
      propertyPrice: this.mortgageForm.get('propertyPrice')?.value,
      downPaymentValue: this.mortgageForm.get('downPaymentValue')?.value,
      downPaymentMode: this.downPaymentMode,
      interestRate: this.mortgageForm.get('interestRate')?.value,
      loanTermYears: this.mortgageForm.get('loanTermYears')?.value,
      residencyType: this.mortgageForm.get('residencyType')?.value,
      rateType: this.mortgageForm.get('rateType')?.value,
    };
  }

  toggleDownPaymentMode(mode: 'currency' | 'percent'): void {
    if (mode === this.downPaymentMode) return;

    const currentValue = this.mortgageForm.get('downPaymentValue')?.value ?? 0;
    const propertyPrice = this.mortgageForm.get('propertyPrice')?.value ?? 0;

    let converted = 0;
    if (this.downPaymentMode === 'percent' && mode === 'currency') {
      converted = propertyPrice > 0 ? Math.round(propertyPrice * (currentValue / 100)) : 0;
    } else if (this.downPaymentMode === 'currency' && mode === 'percent') {
      converted = propertyPrice > 0 ? Math.round((currentValue / propertyPrice) * 10000) / 100 : 0;
    }

    this.downPaymentMode = mode;
    this.mortgageForm.patchValue({ downPaymentValue: converted }, { emitEvent: false });
    this.updateDownPaymentValidators();
    this.stateChanged.emit(this.getState());
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
    const state = this.initialState;
    const defaultDown = state?.downPaymentValue ?? this.config.minDownPaymentPercent;
    const defaultRate = state?.interestRate ?? this.config.defaultInterestRate;
    const defaultTerm = state?.loanTermYears ?? this.config.defaultLoanTermYears;

    this.downPaymentMode = state?.downPaymentMode ?? 'percent';

    this.mortgageForm = this.fb.group({
      propertyPrice: [state?.propertyPrice ?? null, [Validators.required, Validators.min(1)]],
      downPaymentValue: [defaultDown, [Validators.required, Validators.min(0)]],
      interestRate: [defaultRate, [Validators.required, Validators.min(0)]],
      loanTermYears: [defaultTerm, [Validators.required]],
      residencyType: [state?.residencyType ?? this.config.residencyTiers?.[0]?.value ?? null],
      rateType: [state?.rateType ?? this.config.rateTypes?.[0]?.value ?? null],
    });

    this.result = null;
    this.highValueWarning = null;

    this.updateDownPaymentValidators();

    this.mortgageForm.get('residencyType')?.valueChanges.subscribe(() => {
      this.syncTierDefaults();
    });

    this.mortgageForm.get('rateType')?.valueChanges.subscribe(val => {
      const rt = this.config.rateTypes?.find(r => r.value === val);
      if (rt) {
        this.mortgageForm.patchValue({ interestRate: rt.defaultRate }, { emitEvent: false });
      }
    });

    this.mortgageForm.valueChanges.subscribe(() => {
      this.stateChanged.emit(this.getState());
    });
  }

  onPropertyPriceInput(): void {
    setTimeout(() => {
      this.syncTierDefaults();
      this.updateDownPaymentValidators();
      this.stateChanged.emit(this.getState());
    });
  }

  private updateDownPaymentValidators(): void {
    const ctrl = this.mortgageForm.get('downPaymentValue');
    if (!ctrl) return;

    if (this.downPaymentMode === 'percent') {
      ctrl.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else {
      const propertyPrice = this.mortgageForm.get('propertyPrice')?.value ?? 0;
      const maxVal = propertyPrice > 0 ? propertyPrice : Number.MAX_SAFE_INTEGER;
      ctrl.setValidators([Validators.required, Validators.min(0), Validators.max(maxVal)]);
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Recalculates the effective min down payment based on the current
   * residency tier and property value, then updates form validators.
   */
  private syncTierDefaults(): void {
    const tier = this.selectedTier;
    if (!tier) {
      this.highValueWarning = null;
      this.updateDownPaymentValidators();
      return;
    }

    this.mortgageForm.patchValue({ interestRate: tier.defaultInterestRate }, { emitEvent: false });

    if (this.isHighValueProperty && tier.highValueMinDownPaymentPercent != null) {
      const threshold = this.config.propertyValueThreshold!;
      this.highValueWarning = `Property exceeds ${threshold.toLocaleString('en-US')}.`;
    } else {
      this.highValueWarning = null;
    }

    this.updateDownPaymentValidators();
  }

  private resolveDownPaymentPercent(): number {
    const value = this.mortgageForm.get('downPaymentValue')?.value ?? 0;
    if (this.downPaymentMode === 'percent') return value;

    const propertyPrice = this.mortgageForm.get('propertyPrice')?.value ?? 0;
    if (propertyPrice <= 0) return 0;
    return (value / propertyPrice) * 100;
  }

  onCalculate(): void {
    this.syncTierDefaults();
    this.mortgageForm.markAllAsTouched();
    if (!this.mortgageForm.valid) return;

    const { propertyPrice, interestRate, loanTermYears } = this.mortgageForm.value;
    const downPaymentPercent = this.resolveDownPaymentPercent();
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
