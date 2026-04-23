/**
 * Data passed in to the Rent vs Buy lesson dialog by the School page.
 *
 * Resolution order applied by the component (highest precedence first):
 *   1. Values pulled from a Home event in the current plan (`fromHomeEvent`)
 *   2. Values pulled from the user's Default Assumptions
 *      (`mortgageRatePct`, `investmentReturnPct`, `inflationPct`)
 *   3. Static fallback defaults declared inside the component
 *
 * Every field is optional so the calculator stays usable even when nothing
 * better than the static fallbacks is known.
 */
export interface LearnRentOrBuyDialogData {
  /** Inferred main residence value, in the user's currency. Optional. */
  homePrice?: number | null;
  /** Inferred equivalent monthly rent, in the user's currency. Optional. */
  monthlyRent?: number | null;
  /** Plan-level inflation rate (in percent) used to prefill rent growth. Optional. */
  inflationPct?: number | null;
  /** Default investment return (in percent) sourced from the user's Default Assumptions. */
  investmentReturnPct?: number | null;
  /** Default mortgage interest rate (in percent) sourced from the user's Default Assumptions. */
  mortgageRatePct?: number | null;
  /**
   * Snapshot of an existing "Home" goal event in the current plan. When present,
   * it overrides the generic defaults for property price, down payment, mortgage
   * term and (only when applicable) the mortgage rate. A cash purchase is
   * encoded as `paymentMode: 'cash'`, which forces 100% down payment and 0-year
   * mortgage in the calculator.
   */
  fromHomeEvent?: HomeEventPrefill | null;
  /** ISO 4217 currency code of the user's preferred currency. Optional. */
  currencyCode?: string;
}

export interface HomeEventPrefill {
  /** 'cash' → 100% down payment, no mortgage. 'finance' → use mortgage prefill. */
  paymentMode: 'cash' | 'finance';
  /** Property price in the user's currency, when known. */
  propertyPrice?: number | null;
  /** Down payment in absolute currency, when known (mutually exclusive with `downPaymentPct`). */
  downPaymentAmount?: number | null;
  /** Down payment as a percentage of the property price, when known. */
  downPaymentPct?: number | null;
  /** Mortgage interest rate in percent, when persisted on the event. */
  mortgageRatePct?: number | null;
  /** Mortgage term in years, when persisted on the event. */
  mortgageTermYears?: number | null;
}

/**
 * Snapshot of every "advanced" assumption the user can adjust in the
 * "More assumptions" modal. Mirrors the engine's optional inputs.
 */
export interface LearnRentOrBuyAssumptions {
  mortgageRatePct: number;
  homeAppreciationPct: number;
  investmentReturnPct: number;
  inflationPct: number;
  ownershipCostsPct: number;
  roundTripCostsPct: number;
}

export interface LearnRentOrBuyAssumptionsDialogData extends LearnRentOrBuyAssumptions {
  currencyCode?: string;
}
