/**
 * netAmount = grossAmount − max(grossAmount − threshold, 0) × (taxRatePercent / 100)
 * Matches backend {@link InheritanceTaxMath.NetFromGross}.
 */
export function calculateInheritanceNetFromGross(
  grossAmount: number,
  threshold: number,
  taxRatePercent: number,
): number {
  const g = Number(grossAmount);
  if (!Number.isFinite(g) || g <= 0) {
    return 0;
  }
  const th = Number(threshold);
  const t = Number.isFinite(th) && th > 0 ? th : 0;
  let rate = Number(taxRatePercent);
  if (!Number.isFinite(rate)) {
    rate = 0;
  }
  rate = Math.min(100, Math.max(0, rate)) / 100;
  const taxable = Math.max(g - t, 0);
  const tax = taxable * rate;
  const net = g - tax;
  if (!Number.isFinite(net) || net < 0) {
    return 0;
  }
  return Math.round(net * 100) / 100;
}

export const DEFAULT_INHERITANCE_TAX_THRESHOLD = 1_000_000;

export const DEFAULT_CHILD_TAX_RATE = 4;
export const DEFAULT_CHILD_TAX_THRESHOLD = 1_000_000;
export const DEFAULT_PARTNER_TAX_RATE = 4;
export const DEFAULT_PARTNER_TAX_THRESHOLD = 1_000_000;
export const DEFAULT_SIBLING_TAX_RATE = 6;
export const DEFAULT_SIBLING_TAX_THRESHOLD = 100_000;
