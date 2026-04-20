/**
 * Rent vs Buy engine.
 *
 * Pure function that runs a monthly simulation of a buying scenario and a renting
 * scenario over the user's chosen horizon and returns yearly net wealth series for
 * both, plus terminal wealth and the breakeven year (if any).
 *
 * The engine is intentionally global and assumption based. It does not encode any
 * country specific tax rule, deduction, or credit. All percent inputs are passed
 * in as percentage points (e.g. 4 for 4%, not 0.04).
 */

export interface RentVsBuyEngineInput {
  /** Home purchase price in user currency. */
  homePrice: number;
  /** Down payment as an absolute amount in user currency. */
  downPaymentAmount: number;
  /** Annual mortgage interest rate, in percent. */
  mortgageRatePct: number;
  /** Mortgage term in whole years. */
  mortgageTermYears: number;
  /** Equivalent monthly rent in user currency. */
  monthlyRent: number;
  /** Time horizon in whole years. */
  horizonYears: number;
  /** Expected annual home appreciation, in percent. */
  homeAppreciationPct: number;
  /** Expected annual investment return, in percent. */
  investmentReturnPct: number;
  /** General inflation rate that drives rent growth, in percent. */
  inflationPct: number;
  /** Annual ownership costs as percent of current home value (tax, maintenance, insurance, HOA). */
  ownershipCostsPct: number;
  /** Round trip transaction costs as percent of home price (split half on entry, half on exit). */
  roundTripCostsPct: number;
}

export interface RentVsBuyYearPoint {
  year: number;
  wealth: number;
}

export interface RentVsBuyEngineOutput {
  buySeries: RentVsBuyYearPoint[];
  rentSeries: RentVsBuyYearPoint[];
  terminalBuy: number;
  terminalRent: number;
  /** First whole year (>= 1) where buy wealth meets or exceeds rent wealth. */
  breakevenYear: number | null;
}

const MIN_TERM_YEARS = 1;
const MIN_HORIZON_YEARS = 1;
const MAX_HORIZON_YEARS = 40;

const safeNumber = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const monthlyMortgagePayment = (loan: number, annualRatePct: number, termMonths: number): number => {
  const principal = Math.max(0, safeNumber(loan));
  const months = Math.max(1, Math.round(safeNumber(termMonths, 1)));
  const r = safeNumber(annualRatePct) / 100 / 12;
  if (principal <= 0) return 0;
  if (r <= 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
};

const monthlyGrowthRate = (annualPct: number): number => {
  const annual = safeNumber(annualPct) / 100;
  if (annual <= -1) return -1; // floor to avoid NaN from negative bases
  return Math.pow(1 + annual, 1 / 12) - 1;
};

export function runRentVsBuyEngine(input: RentVsBuyEngineInput): RentVsBuyEngineOutput {
  const homePrice = Math.max(0, safeNumber(input.homePrice));
  const downPayment = Math.max(0, Math.min(homePrice, safeNumber(input.downPaymentAmount)));
  const monthlyRentStart = Math.max(0, safeNumber(input.monthlyRent));
  const horizonYears = Math.max(
    MIN_HORIZON_YEARS,
    Math.min(MAX_HORIZON_YEARS, Math.round(safeNumber(input.horizonYears, MIN_HORIZON_YEARS))),
  );
  const termYears = Math.max(
    MIN_TERM_YEARS,
    Math.round(safeNumber(input.mortgageTermYears, MIN_TERM_YEARS)),
  );
  const termMonths = termYears * 12;
  const horizonMonths = horizonYears * 12;

  const entryFrac = Math.max(0, safeNumber(input.roundTripCostsPct)) / 100 / 2;
  const exitFrac = Math.max(0, safeNumber(input.roundTripCostsPct)) / 100 / 2;
  const ownershipMonthlyFrac = Math.max(0, safeNumber(input.ownershipCostsPct)) / 100 / 12;

  const initialOutlay = downPayment + homePrice * entryFrac;
  const loanAmount = Math.max(0, homePrice - downPayment);

  const mortgageRateMonthly = Math.max(0, safeNumber(input.mortgageRatePct)) / 100 / 12;
  const mortgagePmt = monthlyMortgagePayment(loanAmount, input.mortgageRatePct, termMonths);

  const homeGrowthMonthly = monthlyGrowthRate(input.homeAppreciationPct);
  const investmentMonthly = monthlyGrowthRate(input.investmentReturnPct);
  const rentGrowthMonthly = monthlyGrowthRate(input.inflationPct);

  let homeValue = homePrice;
  let mortgageBalance = loanAmount;
  let portfolio = initialOutlay;
  let currentRent = monthlyRentStart;

  const buySeries: RentVsBuyYearPoint[] = [];
  const rentSeries: RentVsBuyYearPoint[] = [];

  const wealthSnapshot = (): { buy: number; rent: number } => ({
    buy: homeValue - mortgageBalance - homePrice * exitFrac,
    rent: portfolio,
  });

  const initial = wealthSnapshot();
  buySeries.push({ year: 0, wealth: initial.buy });
  rentSeries.push({ year: 0, wealth: initial.rent });

  for (let m = 1; m <= horizonMonths; m += 1) {
    homeValue = homeValue * (1 + homeGrowthMonthly);

    const monthlyOwnership = homeValue * ownershipMonthlyFrac;

    let mortgagePaid = 0;
    if (mortgageBalance > 0 && m <= termMonths) {
      const interest = mortgageBalance * mortgageRateMonthly;
      const scheduled = Math.min(mortgagePmt, mortgageBalance + interest);
      const principalPart = Math.max(0, scheduled - interest);
      mortgageBalance = Math.max(0, mortgageBalance - principalPart);
      mortgagePaid = scheduled;
    }

    const buyOutflow = mortgagePaid + monthlyOwnership;

    portfolio = portfolio * (1 + investmentMonthly);
    if (buyOutflow > currentRent) {
      const surplus = buyOutflow - currentRent;
      portfolio += surplus;
    }

    currentRent = currentRent * (1 + rentGrowthMonthly);

    if (m % 12 === 0) {
      const snap = wealthSnapshot();
      buySeries.push({ year: m / 12, wealth: snap.buy });
      rentSeries.push({ year: m / 12, wealth: snap.rent });
    }
  }

  const terminalBuy = buySeries[buySeries.length - 1]?.wealth ?? 0;
  const terminalRent = rentSeries[rentSeries.length - 1]?.wealth ?? 0;

  let breakevenYear: number | null = null;
  for (let i = 1; i < buySeries.length; i += 1) {
    if (buySeries[i].wealth >= rentSeries[i].wealth) {
      breakevenYear = buySeries[i].year;
      break;
    }
  }

  return {
    buySeries,
    rentSeries,
    terminalBuy,
    terminalRent,
    breakevenYear,
  };
}
