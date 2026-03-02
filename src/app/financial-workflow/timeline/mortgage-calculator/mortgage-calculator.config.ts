export interface MortgageCountryConfig {
  countryCode: string;
  countryName: string;
  maxLoanTermYears: number;
  defaultLoanTermYears: number;
  defaultInterestRate: number;
  maxLTV: number;
  minDownPaymentPercent: number;
  residencyTiers?: ResidencyTier[];
  rateTypes?: RateType[];
  propertyValueThreshold?: number;
  notes?: string;
}

export interface ResidencyTier {
  label: string;
  value: string;
  maxLTV: number;
  minDownPaymentPercent: number;
  defaultInterestRate: number;
  /** Min down payment when property price exceeds the country's propertyValueThreshold. */
  highValueMinDownPaymentPercent?: number;
  highValueMaxLTV?: number;
}

export interface RateType {
  label: string;
  value: string;
  defaultRate: number;
}

export interface MortgageCalculation {
  propertyPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  monthlyEMI: number;
  totalInterest: number;
  totalPayable: number;
}

/**
 * UAE — Central Bank Mortgage Caps (Circular 31/2013, updated):
 *
 * First property, value <= AED 5 million:
 *   UAE National  → max LTV 80%  (min 20% down)
 *   Expat Resident → max LTV 80% (min 20% down)
 *
 * First property, value > AED 5 million:
 *   UAE National  → max LTV 70%  (min 30% down)
 *   Expat Resident → max LTV 65% (min 35% down)
 *
 * Non-resident (no UAE visa):
 *   Typically 50% LTV regardless of value (bank-dependent, some allow up to 65%)
 *
 * Max loan term: 25 years.
 * Loan must be repaid before borrower reaches age 65 (employed) or 70 (self-employed).
 */
const UAE_CONFIG: MortgageCountryConfig = {
  countryCode: 'AE',
  countryName: 'United Arab Emirates',
  maxLoanTermYears: 25,
  defaultLoanTermYears: 25,
  defaultInterestRate: 4.5,
  maxLTV: 80,
  minDownPaymentPercent: 20,
  propertyValueThreshold: 5_000_000,
  residencyTiers: [
    {
      label: 'UAE National',
      value: 'national',
      maxLTV: 80,
      minDownPaymentPercent: 20,
      defaultInterestRate: 3.99,
      highValueMaxLTV: 70,
      highValueMinDownPaymentPercent: 30,
    },
    {
      label: 'Expat Resident',
      value: 'resident',
      maxLTV: 80,
      minDownPaymentPercent: 20,
      defaultInterestRate: 4.49,
      highValueMaxLTV: 65,
      highValueMinDownPaymentPercent: 35,
    },
    {
      label: 'Non-Resident',
      value: 'non_resident',
      maxLTV: 50,
      minDownPaymentPercent: 50,
      defaultInterestRate: 5.49,
    },
  ],
  notes: 'LTV caps are set by UAE Central Bank and vary by residency status and property value (AED 5M threshold). Loan must be repaid before age 65 (employed) or 70 (self-employed).',
};

/**
 * Italy — Mutuo Ipotecario rules:
 *
 * Standard max LTV: 80% (Banca d'Italia guideline).
 * First-time buyers under 36: may qualify for Fondo Garanzia Prima Casa
 *   (state guarantee covering up to 80% of the loan, enabling higher LTV).
 *
 * Rate types:
 *   Tasso Fisso (fixed) — rate locked for entire duration, currently ~2.8-3.5%
 *   Tasso Variabile (variable) — Euribor 3M + bank spread, currently ~3.8-4.5%
 *
 * Common terms: 10, 15, 20, 25, 30 years.
 */
const ITALY_CONFIG: MortgageCountryConfig = {
  countryCode: 'IT',
  countryName: 'Italy',
  maxLoanTermYears: 30,
  defaultLoanTermYears: 20,
  defaultInterestRate: 3.2,
  maxLTV: 80,
  minDownPaymentPercent: 20,
  rateTypes: [
    { label: 'Tasso Fisso (Fixed)', value: 'fixed', defaultRate: 3.2 },
    { label: 'Tasso Variabile (Variable)', value: 'variable', defaultRate: 4.2 },
  ],
  notes: 'Italian banks finance up to 80% LTV. First-time buyers under 36 may access Fondo Garanzia Prima Casa for additional guarantees. Variable rates are linked to Euribor 3M.',
};

const GENERIC_CONFIG: MortgageCountryConfig = {
  countryCode: '',
  countryName: 'Standard',
  maxLoanTermYears: 30,
  defaultLoanTermYears: 25,
  defaultInterestRate: 5.0,
  maxLTV: 80,
  minDownPaymentPercent: 20,
  notes: 'Standard mortgage calculator with common defaults (80% LTV, 20% down). All fields are fully adjustable to match your local requirements.',
};

const COUNTRY_CONFIGS: Record<string, MortgageCountryConfig> = {
  AE: UAE_CONFIG,
  IT: ITALY_CONFIG,
};

export function getMortgageConfig(countryCode: string): MortgageCountryConfig {
  if (!countryCode) return { ...GENERIC_CONFIG };
  const code = countryCode.toUpperCase();
  return COUNTRY_CONFIGS[code] ?? { ...GENERIC_CONFIG };
}

export function calculateMortgage(
  propertyPrice: number,
  downPaymentPercent: number,
  annualInterestRate: number,
  loanTermYears: number
): MortgageCalculation {
  const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);
  const loanAmount = propertyPrice - downPaymentAmount;

  let monthlyEMI = 0;
  let totalInterest = 0;
  let totalPayable = 0;

  if (loanAmount > 0 && loanTermYears > 0) {
    if (annualInterestRate > 0) {
      const monthlyRate = annualInterestRate / 100 / 12;
      const totalMonths = loanTermYears * 12;
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      monthlyEMI = loanAmount * monthlyRate * factor / (factor - 1);
    } else {
      monthlyEMI = loanAmount / (loanTermYears * 12);
    }

    totalPayable = monthlyEMI * loanTermYears * 12;
    totalInterest = totalPayable - loanAmount;
  }

  return {
    propertyPrice,
    downPaymentPercent,
    downPaymentAmount: Math.round(downPaymentAmount),
    loanAmount: Math.round(loanAmount),
    interestRate: annualInterestRate,
    loanTermYears,
    monthlyEMI: Math.round(monthlyEMI),
    totalInterest: Math.round(totalInterest),
    totalPayable: Math.round(totalPayable),
  };
}
