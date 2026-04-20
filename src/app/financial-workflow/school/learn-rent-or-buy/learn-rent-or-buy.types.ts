export interface LearnRentOrBuyAssumptionValues {
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
}

export interface LearnRentOrBuyDialogData extends LearnRentOrBuyAssumptionValues {
  homePrice: number;
  downPaymentPct: number;
  monthlyRent: number;
  currencyCode?: string;
}

export type LearnRentOrBuyAssumptionsDialogData = LearnRentOrBuyAssumptionValues & {
  currencyCode?: string;
};
