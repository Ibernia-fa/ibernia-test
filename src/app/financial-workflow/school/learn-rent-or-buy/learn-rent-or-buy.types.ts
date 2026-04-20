/**
 * Data passed in to the Rent vs Buy lesson dialog by the School page.
 *
 * The calculator owns its own assumptions and defaults; only inferred client
 * context (home price, rent, currency) is surfaced here so prefill stays useful.
 * Any field can be omitted: the component falls back to the spec defaults.
 */
export interface LearnRentOrBuyDialogData {
  /** Inferred main residence value, in the user's currency. Optional. */
  homePrice?: number | null;
  /** Inferred equivalent monthly rent, in the user's currency. Optional. */
  monthlyRent?: number | null;
  /** Plan-level inflation rate (in percent) used to prefill rent growth. Optional. */
  inflationPct?: number | null;
  /** ISO 4217 currency code of the user's preferred currency. Optional. */
  currencyCode?: string;
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
