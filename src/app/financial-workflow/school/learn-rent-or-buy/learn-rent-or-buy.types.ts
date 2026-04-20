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
  /** ISO 4217 currency code of the user's preferred currency. Optional. */
  currencyCode?: string;
}
