import { calculateMortgage, getMortgageConfig } from './mortgage-calculator.config';

describe('getMortgageConfig', () => {
  it('should return UAE config for country code AE', () => {
    const config = getMortgageConfig('AE');
    expect(config.countryCode).toBe('AE');
    expect(config.countryName).toBe('United Arab Emirates');
    expect(config.maxLoanTermYears).toBe(25);
    expect(config.residencyTiers?.length).toBe(3);
    expect(config.propertyValueThreshold).toBe(5_000_000);
  });

  it('should return Italy config for country code IT', () => {
    const config = getMortgageConfig('IT');
    expect(config.countryCode).toBe('IT');
    expect(config.countryName).toBe('Italy');
    expect(config.maxLoanTermYears).toBe(30);
    expect(config.rateTypes?.length).toBe(2);
  });

  it('should be case-insensitive', () => {
    const lower = getMortgageConfig('ae');
    expect(lower.countryCode).toBe('AE');

    const mixed = getMortgageConfig('It');
    expect(mixed.countryCode).toBe('IT');
  });

  it('should return generic config for unknown country', () => {
    const config = getMortgageConfig('ZZ');
    expect(config.countryCode).toBe('');
    expect(config.countryName).toBe('Standard');
    expect(config.maxLoanTermYears).toBe(30);
    expect(config.minDownPaymentPercent).toBe(20);
  });

  it('should return generic config for empty string', () => {
    const config = getMortgageConfig('');
    expect(config.countryCode).toBe('');
  });

  it('should return a copy for generic config so mutations are safe', () => {
    const a = getMortgageConfig('');
    const b = getMortgageConfig('');
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  describe('UAE residency tiers', () => {
    it('should have national, resident, non_resident tiers', () => {
      const config = getMortgageConfig('AE');
      const tierValues = config.residencyTiers?.map(t => t.value);
      expect(tierValues).toEqual(['national', 'resident', 'non_resident']);
    });

    it('national tier should have high-value thresholds', () => {
      const config = getMortgageConfig('AE');
      const national = config.residencyTiers?.find(t => t.value === 'national');
      expect(national?.highValueMinDownPaymentPercent).toBe(30);
      expect(national?.highValueMaxLTV).toBe(70);
    });

    it('non-resident tier should not have high-value overrides', () => {
      const config = getMortgageConfig('AE');
      const nonResident = config.residencyTiers?.find(t => t.value === 'non_resident');
      expect(nonResident?.highValueMinDownPaymentPercent).toBeUndefined();
      expect(nonResident?.highValueMaxLTV).toBeUndefined();
    });
  });

  describe('Italy rate types', () => {
    it('should have fixed and variable rate types', () => {
      const config = getMortgageConfig('IT');
      const rateValues = config.rateTypes?.map(r => r.value);
      expect(rateValues).toEqual(['fixed', 'variable']);
    });

    it('fixed rate should be lower than variable rate', () => {
      const config = getMortgageConfig('IT');
      const fixed = config.rateTypes?.find(r => r.value === 'fixed');
      const variable = config.rateTypes?.find(r => r.value === 'variable');
      expect(fixed!.defaultRate).toBeLessThan(variable!.defaultRate);
    });
  });
});

describe('calculateMortgage', () => {
  it('should calculate correct values for a standard mortgage', () => {
    const result = calculateMortgage(1_000_000, 20, 5, 25);

    expect(result.propertyPrice).toBe(1_000_000);
    expect(result.downPaymentPercent).toBe(20);
    expect(result.downPaymentAmount).toBe(200_000);
    expect(result.loanAmount).toBe(800_000);
    expect(result.interestRate).toBe(5);
    expect(result.loanTermYears).toBe(25);
  });

  it('should return whole numbers for all monetary values', () => {
    const result = calculateMortgage(550_000, 15, 4.5, 20);

    expect(result.downPaymentAmount).toBe(Math.round(result.downPaymentAmount));
    expect(result.loanAmount).toBe(Math.round(result.loanAmount));
    expect(result.monthlyEMI).toBe(Math.round(result.monthlyEMI));
    expect(result.totalInterest).toBe(Math.round(result.totalInterest));
    expect(result.totalPayable).toBe(Math.round(result.totalPayable));
  });

  it('monthlyEMI should be a whole number (no decimals)', () => {
    const result = calculateMortgage(1_000_000, 20, 5, 25);
    expect(result.monthlyEMI % 1).toBe(0);
  });

  it('totalPayable should be close to monthlyEMI * months (within rounding tolerance)', () => {
    const result = calculateMortgage(1_000_000, 20, 5, 25);
    const recomputedTotal = result.monthlyEMI * 25 * 12;
    // monthlyEMI and totalPayable are independently rounded to whole numbers,
    // so the difference can be up to ~(months/2) due to cumulative rounding
    expect(Math.abs(result.totalPayable - recomputedTotal)).toBeLessThan(300);
  });

  it('totalInterest should equal totalPayable - loanAmount (within rounding tolerance)', () => {
    const result = calculateMortgage(1_000_000, 20, 5, 25);
    const expectedInterest = result.totalPayable - result.loanAmount;
    expect(Math.abs(result.totalInterest - expectedInterest)).toBeLessThanOrEqual(1);
  });

  it('should handle 0% interest rate', () => {
    const result = calculateMortgage(500_000, 20, 0, 10);

    expect(result.loanAmount).toBe(400_000);
    expect(result.monthlyEMI).toBe(Math.round(400_000 / 120));
    expect(result.totalInterest).toBe(0);
  });

  it('should handle 100% down payment', () => {
    const result = calculateMortgage(500_000, 100, 5, 25);

    expect(result.downPaymentAmount).toBe(500_000);
    expect(result.loanAmount).toBe(0);
    expect(result.monthlyEMI).toBe(0);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayable).toBe(0);
  });

  it('should handle 0% down payment', () => {
    const result = calculateMortgage(500_000, 0, 5, 25);

    expect(result.downPaymentAmount).toBe(0);
    expect(result.loanAmount).toBe(500_000);
    expect(result.monthlyEMI).toBeGreaterThan(0);
  });

  it('should produce consistent down payment + loan = property price', () => {
    const result = calculateMortgage(750_000, 25, 4.2, 20);
    expect(result.downPaymentAmount + result.loanAmount).toBe(750_000);
  });

  it('should handle small property price', () => {
    const result = calculateMortgage(100, 20, 5, 5);
    expect(result.loanAmount).toBe(80);
    expect(result.monthlyEMI).toBeGreaterThan(0);
  });

  it('should handle large property price', () => {
    const result = calculateMortgage(50_000_000, 35, 3.99, 25);
    expect(result.downPaymentAmount).toBe(17_500_000);
    expect(result.loanAmount).toBe(32_500_000);
    expect(result.monthlyEMI).toBeGreaterThan(0);
  });
});
