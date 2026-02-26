export interface WealthDashboardModel {
  id: string;
  assets: WealthAssetModel[];
  liabilities: WealthLiabilityModel[];
  summary: WealthSummary;
  client: { id: string; name: string } | null;
  cashflow: { id: string; name: string } | null;
}

export interface WealthAssetModel {
  id: string;
  category: string;
  description: string;
  value: number;
  liquidity: string;
  isFromSavingPots: boolean;
  isLiquidityEditable: boolean;
}

export interface WealthLiabilityModel {
  id: string;
  type: string;
  description: string;
  outstanding: number;
}

export interface WealthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtRatio: number;
  assetsByType: AssetsByType;
  liquidityMix: LiquidityMix;
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
}

export interface LiquidityMix {
  liquidTotal: number;
  liquidPercent: number;
  partialTotal: number;
  partialPercent: number;
  illiquidTotal: number;
  illiquidPercent: number;
}

export interface AddWealthAssetRequest {
  category: number;
  description: string;
  value: number;
  liquidity: number;
}

export interface UpdateWealthAssetRequest {
  id: string;
  category: number;
  description: string;
  value: number;
  liquidity: number;
}

export interface AddWealthLiabilityRequest {
  type: string;
  description: string;
  outstanding: number;
}

export interface UpdateWealthLiabilityRequest {
  id: string;
  type: string;
  description: string;
  outstanding: number;
}

export enum AssetCategory {
  RealEstate = 1,
  PersonalProperty = 2
}

export enum LiquidityLevel {
  Liquid = 1,
  Partial = 2,
  Illiquid = 3
}

export const ASSET_CATEGORY_LABELS: Record<number, string> = {
  [AssetCategory.RealEstate]: 'Real estate',
  [AssetCategory.PersonalProperty]: 'Personal property'
};

export const LIQUIDITY_LABELS: Record<number, string> = {
  [LiquidityLevel.Liquid]: 'Liquid',
  [LiquidityLevel.Partial]: 'Partial',
  [LiquidityLevel.Illiquid]: 'Illiquid'
};
