import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { MortgageCalculatorComponent, MortgageCalculatorState } from './mortgage-calculator.component';

describe('MortgageCalculatorComponent', () => {
  let component: MortgageCalculatorComponent;
  let fixture: ComponentFixture<MortgageCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MortgageCalculatorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MortgageCalculatorComponent);
    component = fixture.componentInstance;
  });

  function initWith(countryCode: string, currency = '$') {
    component.clientCountryCode = countryCode;
    component.currencySymbol = currency;
    fixture.detectChanges();
  }

  it('should create', () => {
    initWith('');
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load generic config for empty country code', () => {
      initWith('');
      expect(component.config.countryCode).toBe('');
      expect(component.config.countryName).toBe('Standard');
    });

    it('should load UAE config for AE country code', () => {
      initWith('AE');
      expect(component.config.countryCode).toBe('AE');
      expect(component.hasResidencyTiers).toBeTrue();
      expect(component.hasRateTypes).toBeFalse();
    });

    it('should load Italy config for IT country code', () => {
      initWith('IT');
      expect(component.config.countryCode).toBe('IT');
      expect(component.hasResidencyTiers).toBeFalse();
      expect(component.hasRateTypes).toBeTrue();
    });

    it('should build loan term options in steps of 5', () => {
      initWith('');
      expect(component.loanTermOptions).toContain(5);
      expect(component.loanTermOptions).toContain(10);
      expect(component.loanTermOptions).toContain(30);
    });

    it('should default downPaymentMode to percent', () => {
      initWith('');
      expect(component.downPaymentMode).toBe('percent');
    });
  });

  describe('down payment toggle', () => {
    beforeEach(() => initWith(''));

    it('should not convert if mode is already the same', () => {
      component.mortgageForm.patchValue({ downPaymentValue: 20 });
      component.toggleDownPaymentMode('percent');
      expect(component.downPaymentMode).toBe('percent');
      expect(component.mortgageForm.get('downPaymentValue')?.value).toBe(20);
    });

    it('should convert percent to currency', () => {
      component.mortgageForm.patchValue({ propertyPrice: 1_000_000, downPaymentValue: 20 });
      component.toggleDownPaymentMode('currency');

      expect(component.downPaymentMode).toBe('currency');
      expect(component.mortgageForm.get('downPaymentValue')?.value).toBe(200_000);
    });

    it('should convert currency to percent', () => {
      component.mortgageForm.patchValue({ propertyPrice: 1_000_000, downPaymentValue: 20 });
      component.toggleDownPaymentMode('currency');

      component.toggleDownPaymentMode('percent');
      expect(component.downPaymentMode).toBe('percent');
      expect(component.mortgageForm.get('downPaymentValue')?.value).toBe(20);
    });

    it('should handle 0 property price gracefully', () => {
      component.mortgageForm.patchValue({ propertyPrice: 0, downPaymentValue: 20 });
      component.toggleDownPaymentMode('currency');
      expect(component.mortgageForm.get('downPaymentValue')?.value).toBe(0);
    });

    describe('validation in percent mode', () => {
      it('should reject values above 100', () => {
        component.mortgageForm.patchValue({ downPaymentValue: 101 });
        component.mortgageForm.get('downPaymentValue')?.updateValueAndValidity();
        expect(component.mortgageForm.get('downPaymentValue')?.hasError('max')).toBeTrue();
      });

      it('should accept any non-negative percent value', () => {
        component.mortgageForm.patchValue({ downPaymentValue: 5 });
        component.mortgageForm.get('downPaymentValue')?.updateValueAndValidity();
        expect(component.mortgageForm.get('downPaymentValue')?.valid).toBeTrue();
      });

      it('should reject negative percent values', () => {
        component.mortgageForm.patchValue({ downPaymentValue: -1 });
        component.mortgageForm.get('downPaymentValue')?.updateValueAndValidity();
        expect(component.mortgageForm.get('downPaymentValue')?.hasError('min')).toBeTrue();
      });
    });

    describe('validation in currency mode', () => {
      it('should reject values exceeding property price', () => {
        component.mortgageForm.patchValue({ propertyPrice: 500_000, downPaymentValue: 20 });
        component.toggleDownPaymentMode('currency');

        component.mortgageForm.patchValue({ downPaymentValue: 600_000 });
        component.mortgageForm.get('downPaymentValue')?.updateValueAndValidity();
        expect(component.mortgageForm.get('downPaymentValue')?.hasError('max')).toBeTrue();
      });

      it('should reject negative values', () => {
        component.toggleDownPaymentMode('currency');
        component.mortgageForm.patchValue({ downPaymentValue: -1 });
        component.mortgageForm.get('downPaymentValue')?.updateValueAndValidity();
        expect(component.mortgageForm.get('downPaymentValue')?.hasError('min')).toBeTrue();
      });
    });
  });

  describe('onCalculate', () => {
    beforeEach(() => initWith(''));

    it('should not calculate with invalid form', () => {
      component.onCalculate();
      expect(component.result).toBeNull();
    });

    it('should calculate with valid inputs in percent mode', () => {
      component.mortgageForm.patchValue({
        propertyPrice: 1_000_000,
        downPaymentValue: 20,
        interestRate: 5,
        loanTermYears: 25,
      });
      component.onCalculate();

      expect(component.result).not.toBeNull();
      expect(component.result!.loanAmount).toBe(800_000);
      expect(component.result!.downPaymentAmount).toBe(200_000);
      expect(component.result!.monthlyEMI).toBeGreaterThan(0);
    });

    it('should calculate with valid inputs in currency mode', () => {
      component.mortgageForm.patchValue({ propertyPrice: 1_000_000, downPaymentValue: 20 });
      component.toggleDownPaymentMode('currency');
      component.mortgageForm.patchValue({
        downPaymentValue: 200_000,
        interestRate: 5,
        loanTermYears: 25,
      });
      component.onCalculate();

      expect(component.result).not.toBeNull();
      expect(component.result!.downPaymentAmount).toBe(200_000);
      expect(component.result!.loanAmount).toBe(800_000);
    });

    it('result values should all be whole numbers', () => {
      component.mortgageForm.patchValue({
        propertyPrice: 777_777,
        downPaymentValue: 23,
        interestRate: 4.75,
        loanTermYears: 20,
      });
      component.onCalculate();

      const r = component.result!;
      expect(r.monthlyEMI % 1).toBe(0);
      expect(r.downPaymentAmount % 1).toBe(0);
      expect(r.loanAmount % 1).toBe(0);
      expect(r.totalInterest % 1).toBe(0);
      expect(r.totalPayable % 1).toBe(0);
    });
  });

  describe('onApply', () => {
    it('should not emit when result is null', () => {
      initWith('');
      spyOn(component.calculated, 'emit');
      component.onApply();
      expect(component.calculated.emit).not.toHaveBeenCalled();
    });

    it('should emit calculated output with correct values', () => {
      initWith('');
      component.mortgageForm.patchValue({
        propertyPrice: 1_000_000,
        downPaymentValue: 20,
        interestRate: 5,
        loanTermYears: 25,
      });
      component.onCalculate();

      spyOn(component.calculated, 'emit');
      component.onApply();

      expect(component.calculated.emit).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          downPaymentAmount: 200_000,
          loanAmount: 800_000,
          loanTermYears: 25,
        })
      );
    });
  });

  describe('getState / initialState (persistence)', () => {
    it('getState should capture current form values and mode', () => {
      initWith('');
      component.mortgageForm.patchValue({
        propertyPrice: 500_000,
        downPaymentValue: 25,
        interestRate: 4.0,
        loanTermYears: 20,
      });
      component.toggleDownPaymentMode('currency');

      const state = component.getState();
      expect(state.propertyPrice).toBe(500_000);
      expect(state.downPaymentMode).toBe('currency');
      expect(state.interestRate).toBe(4.0);
      expect(state.loanTermYears).toBe(20);
    });

    it('should restore state from initialState input', () => {
      const savedState: MortgageCalculatorState = {
        propertyPrice: 800_000,
        downPaymentValue: 150_000,
        downPaymentMode: 'currency',
        interestRate: 3.5,
        loanTermYears: 15,
        residencyType: null,
        rateType: null,
      };
      component.clientCountryCode = '';
      component.currencySymbol = '$';
      component.initialState = savedState;
      fixture.detectChanges();

      expect(component.downPaymentMode).toBe('currency');
      expect(component.mortgageForm.get('propertyPrice')?.value).toBe(800_000);
      expect(component.mortgageForm.get('downPaymentValue')?.value).toBe(150_000);
      expect(component.mortgageForm.get('interestRate')?.value).toBe(3.5);
      expect(component.mortgageForm.get('loanTermYears')?.value).toBe(15);
    });

    it('should use config defaults when initialState is null', () => {
      component.clientCountryCode = 'IT';
      component.currencySymbol = '€';
      component.initialState = null;
      fixture.detectChanges();

      expect(component.mortgageForm.get('interestRate')?.value).toBe(3.2);
      expect(component.mortgageForm.get('loanTermYears')?.value).toBe(20);
      expect(component.downPaymentMode).toBe('percent');
    });

    it('should emit stateChanged when form values change', () => {
      initWith('');
      spyOn(component.stateChanged, 'emit');
      component.mortgageForm.patchValue({ propertyPrice: 999_000 });
      expect(component.stateChanged.emit).toHaveBeenCalled();
    });

    it('should emit stateChanged when down payment mode toggles', () => {
      initWith('');
      component.mortgageForm.patchValue({ propertyPrice: 500_000, downPaymentValue: 20 });
      spyOn(component.stateChanged, 'emit');
      component.toggleDownPaymentMode('currency');
      expect(component.stateChanged.emit).toHaveBeenCalled();
    });
  });

  describe('UAE tier logic', () => {
    beforeEach(() => initWith('AE'));

    it('should default to first residency tier', () => {
      expect(component.mortgageForm.get('residencyType')?.value).toBe('national');
    });

    it('should set high-value warning when property exceeds threshold', () => {
      component.mortgageForm.patchValue({ propertyPrice: 6_000_000 });
      component.onCalculate();

      expect(component.highValueWarning).toBeTruthy();
      expect(component.highValueWarning).toContain('5,000,000');
    });

    it('should set high-value warning via onPropertyPriceInput', (done) => {
      component.mortgageForm.patchValue({ propertyPrice: 6_000_000 }, { emitEvent: false });
      component.onPropertyPriceInput();
      setTimeout(() => {
        expect(component.highValueWarning).toBeTruthy();
        done();
      }, 10);
    });

    it('should clear high-value warning for property below threshold', () => {
      component.mortgageForm.patchValue({ propertyPrice: 4_000_000 });
      component.onCalculate();

      expect(component.highValueWarning).toBeNull();
    });

    it('effectiveMinDownPayment should increase for high-value national', () => {
      component.mortgageForm.patchValue({
        propertyPrice: 6_000_000,
        residencyType: 'national',
      });
      expect(component.effectiveMinDownPayment).toBe(30);
    });

    it('effectiveMinDownPayment should be 50 for non-resident', () => {
      component.mortgageForm.patchValue({ residencyType: 'non_resident' });
      expect(component.effectiveMinDownPayment).toBe(50);
    });
  });

  describe('Italy config', () => {
    beforeEach(() => initWith('IT'));

    it('should load Italy config with default interest rate', () => {
      expect(component.config.countryCode).toBe('IT');
      expect(component.mortgageForm.get('interestRate')?.value).toBe(3.2);
    });
  });
});
