/** Educational rent vs buy projection — simplified cashflow + opportunity cost. */

export interface RentOrBuySimulationInputs {
  homePrice: number;
  downPaymentPct: number;
  monthlyRent: number;
  mortgageRatePct: number;
  mortgageTermYears: number;
  horizonYears: number;
  homePriceGrowthPct: number;
  rentGrowthPct: number;
  investmentReturnPct: number;
  closingCostsPct: number;
  propertyTaxPct: number;
  homeInsuranceYearly: number;
  maintenancePctYearly: number;
  hoaMonthly: number;
  sellingCostsPct: number;
  renterInsuranceMonthly: number;
  generalInflationPct: number;
  securityDepositMonths: number;
}

export interface RentOrBuySimulationResult {
  years: number[];
  buyWealth: number[];
  rentWealth: number[];
  breakEvenYear: number | null;
  /** Which path moves ahead at {@link breakEvenYear}, if any. */
  breakEvenKind: 'buy' | 'rent' | null;
  finalBuy: number;
  finalRent: number;
}

function monthlyRate(annualPct: number): number {
  return (annualPct / 100) / 12;
}

function monthlyPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) return principal;
  const i = monthlyRate(annualRatePct);
  if (i <= 1e-12) return principal / termMonths;
  return (principal * i) / (1 - Math.pow(1 + i, -termMonths));
}

export function simulateRentOrBuy(inputs: RentOrBuySimulationInputs): RentOrBuySimulationResult {
  const {
    homePrice: P0,
    downPaymentPct,
    monthlyRent: rent0,
    mortgageRatePct,
    mortgageTermYears,
    horizonYears,
    homePriceGrowthPct,
    rentGrowthPct,
    investmentReturnPct,
    closingCostsPct,
    propertyTaxPct,
    homeInsuranceYearly,
    maintenancePctYearly,
    hoaMonthly,
    sellingCostsPct,
    renterInsuranceMonthly,
    generalInflationPct,
    securityDepositMonths,
  } = inputs;

  const price = Math.max(0, P0);
  const down = price * (Math.max(0, Math.min(100, downPaymentPct)) / 100);
  const closing = price * (Math.max(0, closingCostsPct) / 100);
  const loan0 = Math.max(0, price - down);
  const termMonths = Math.max(1, Math.round(mortgageTermYears * 12));
  const totalMonths = Math.max(1, Math.round(Math.max(0.25, horizonYears) * 12));

  const pmt = monthlyPayment(loan0, mortgageRatePct, termMonths);
  const iLoan = monthlyRate(mortgageRatePct);
  const invGrowth = monthlyRate(investmentReturnPct);

  let balance = loan0;
  let V = price;
  let rent = Math.max(0, rent0);
  let renterIns = Math.max(0, renterInsuranceMonthly);

  const deposit = Math.max(0, rent * Math.max(0, securityDepositMonths));
  let inv = Math.max(0, down + closing - deposit);

  const maintMonthly = (price * (Math.max(0, maintenancePctYearly) / 100)) / 12;
  const insMonthly = Math.max(0, homeInsuranceYearly) / 12;

  const sellFrac = 1 - Math.max(0, Math.min(50, sellingCostsPct)) / 100;
  const byYear = new Map<number, { buy: number; rent: number }>();

  const snapshotYear = (y: number) => {
    const buyPaper = Math.max(0, V * sellFrac - balance);
    byYear.set(y, {
      buy: Math.round(buyPaper),
      rent: Math.round(Math.max(0, inv)),
    });
  };

  snapshotYear(0);

  for (let m = 1; m <= totalMonths; m += 1) {
    V *= Math.pow(1 + Math.max(-0.5, homePriceGrowthPct / 100), 1 / 12);
    rent *= Math.pow(1 + Math.max(-0.5, rentGrowthPct / 100), 1 / 12);
    renterIns *= Math.pow(1 + Math.max(-0.5, generalInflationPct / 100), 1 / 12);

    let interest = balance * iLoan;
    if (interest < 0) interest = 0;
    const scheduled = balance > 0 ? Math.min(pmt, balance + interest) : 0;
    const principalPart = Math.max(0, scheduled - interest);
    balance = Math.max(0, balance - principalPart);

    const taxM = (V * (Math.max(0, propertyTaxPct) / 100)) / 12;
    const buyerOut = pmt + taxM + insMonthly + maintMonthly + Math.max(0, hoaMonthly);
    const renterOut = rent + renterIns;

    inv *= 1 + invGrowth;
    inv += buyerOut - renterOut;
    if (inv < 0) inv = 0;

    if (m % 12 === 0 || m === totalMonths) {
      const yCap = Math.ceil(totalMonths / 12);
      const y = Math.min(Math.ceil(m / 12), yCap);
      snapshotYear(y);
    }
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  const buyWealth = years.map((y) => byYear.get(y)?.buy ?? 0);
  const rentWealth = years.map((y) => byYear.get(y)?.rent ?? 0);

  const finalBuy = buyWealth[buyWealth.length - 1] ?? 0;
  const finalRent = rentWealth[rentWealth.length - 1] ?? 0;

  let breakEvenYear: number | null = null;
  let breakEvenKind: 'buy' | 'rent' | null = null;
  for (let i = 1; i < years.length; i += 1) {
    const prev = (buyWealth[i - 1] ?? 0) - (rentWealth[i - 1] ?? 0);
    const curr = (buyWealth[i] ?? 0) - (rentWealth[i] ?? 0);
    if (prev < 0 && curr >= 0) {
      breakEvenYear = years[i] ?? i;
      breakEvenKind = 'buy';
      break;
    }
    if (prev > 0 && curr <= 0) {
      breakEvenYear = years[i] ?? i;
      breakEvenKind = 'rent';
      break;
    }
  }

  return {
    years,
    buyWealth,
    rentWealth,
    breakEvenYear,
    breakEvenKind,
    finalBuy,
    finalRent,
  };
}
