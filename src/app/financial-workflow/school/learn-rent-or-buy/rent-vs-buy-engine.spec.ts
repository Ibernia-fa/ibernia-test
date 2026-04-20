import { runRentVsBuyEngine, type RentVsBuyEngineInput } from './rent-vs-buy-engine';

const baseInput = (overrides: Partial<RentVsBuyEngineInput> = {}): RentVsBuyEngineInput => ({
  homePrice: 400_000,
  downPaymentAmount: 80_000, // 20%
  mortgageRatePct: 4,
  mortgageTermYears: 25,
  monthlyRent: 1_500,
  horizonYears: 10,
  homeAppreciationPct: 3,
  investmentReturnPct: 6,
  inflationPct: 2,
  ownershipCostsPct: 2,
  roundTripCostsPct: 8,
  ...overrides,
});

describe('runRentVsBuyEngine', () => {
  it('produces finite continuous yearly series for both lines (AC #3)', () => {
    const out = runRentVsBuyEngine(baseInput());

    expect(out.buySeries).toHaveLength(11); // year 0 through year 10 inclusive
    expect(out.rentSeries).toHaveLength(11);

    out.buySeries.forEach((p, idx) => {
      expect(p.year).toBe(idx);
      expect(Number.isFinite(p.wealth)).toBe(true);
    });
    out.rentSeries.forEach((p, idx) => {
      expect(p.year).toBe(idx);
      expect(Number.isFinite(p.wealth)).toBe(true);
    });

    expect(Number.isFinite(out.terminalBuy)).toBe(true);
    expect(Number.isFinite(out.terminalRent)).toBe(true);
  });

  it('renting wins when home appreciation is 0 and investment return is 10 (AC #4)', () => {
    const out = runRentVsBuyEngine(
      baseInput({ homeAppreciationPct: 0, investmentReturnPct: 10 }),
    );
    const net = out.terminalBuy - out.terminalRent;
    expect(net).toBeLessThan(0);
    expect(out.terminalRent).toBeGreaterThan(out.terminalBuy);
  });

  it('buying wins when investment return is 0 and home appreciation is 6 (AC #5)', () => {
    const out = runRentVsBuyEngine(
      baseInput({ investmentReturnPct: 0, homeAppreciationPct: 6 }),
    );
    const net = out.terminalBuy - out.terminalRent;
    expect(net).toBeGreaterThan(0);
    expect(out.terminalBuy).toBeGreaterThan(out.terminalRent);
  });

  it('breakevenYear is null when buy never catches up to rent', () => {
    const out = runRentVsBuyEngine(
      baseInput({ homeAppreciationPct: 0, investmentReturnPct: 12, horizonYears: 5 }),
    );
    expect(out.breakevenYear).toBeNull();
  });

  it('changing inflation changes the rent series but not the buy series', () => {
    const a = runRentVsBuyEngine(baseInput({ inflationPct: 1 }));
    const b = runRentVsBuyEngine(baseInput({ inflationPct: 5 }));

    expect(a.buySeries.map((p) => p.wealth)).toEqual(b.buySeries.map((p) => p.wealth));
    expect(a.rentSeries.map((p) => p.wealth)).not.toEqual(
      b.rentSeries.map((p) => p.wealth),
    );
  });

  it('clamps horizon to safe bounds', () => {
    const negative = runRentVsBuyEngine(baseInput({ horizonYears: -3 }));
    expect(negative.buySeries.length).toBeGreaterThan(0);
    expect(negative.rentSeries.length).toBeGreaterThan(0);

    const huge = runRentVsBuyEngine(baseInput({ horizonYears: 999 }));
    expect(huge.buySeries.length).toBe(41); // year 0 through year 40
  });

  it('handles zero down payment without dividing by zero', () => {
    const out = runRentVsBuyEngine(baseInput({ downPaymentAmount: 0 }));
    expect(Number.isFinite(out.terminalBuy)).toBe(true);
    expect(Number.isFinite(out.terminalRent)).toBe(true);
  });
});
