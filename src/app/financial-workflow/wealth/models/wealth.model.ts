export interface WealthDashboardModel {
  id: string;
  assets: WealthAssetModel[];
  liabilities: WealthLiabilityModel[];
  summary: WealthSummary;
  hasPartner: boolean;
  client: { id: string; name: string } | null;
  cashflow: { id: string; name: string } | null;
}

export interface WealthAssetModel {
  id: string;
  category: string;
  name?: string;
  description?: string;
  value: number;
  ownership: string;
  isFromSavingPots: boolean;
}

export interface WealthLiabilityModel {
  id: string;
  type: string;
  name?: string;
  description?: string;
  outstanding: number;
  ownership: string;
}

export interface WealthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtRatio: number;
  assetsByType: AssetsByType;
  perPersonBreakdown?: PerPersonBreakdown;
}

export interface AssetsByType {
  cashTotal: number;
  cashPercent: number;
  investmentsTotal: number;
  investmentsPercent: number;
  realEstateTotal: number;
  realEstatePercent: number;
  personalPropertyTotal: number;
  personalPropertyPercent: number;
  otherTotal: number;
  otherPercent: number;
}

export interface PerPersonBreakdown {
  clientName: string;
  clientNetWorth: number;
  partnerName: string;
  partnerNetWorth: number;
}

export interface AddWealthAssetRequest {
  category: number;
  name?: string;
  value: number;
  ownership: number;
}

export interface UpdateWealthAssetRequest {
  id: string;
  category: number;
  name?: string;
  value: number;
  ownership: number;
}

export interface AddWealthLiabilityRequest {
  type: string;
  name?: string;
  outstanding: number;
  ownership: number;
}

export interface UpdateWealthLiabilityRequest {
  id: string;
  type: string;
  name?: string;
  outstanding: number;
  ownership: number;
}

export enum AssetCategory {
  RealEstate = 1,
  PersonalProperty = 2,
  Other = 3
}

export const ASSET_CATEGORY_LABELS: Record<number, string> = {
  [AssetCategory.RealEstate]: 'Real Estate',
  [AssetCategory.PersonalProperty]: 'Personal Property',
  [AssetCategory.Other]: 'Other'
};
