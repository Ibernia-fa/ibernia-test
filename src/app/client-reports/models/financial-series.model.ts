export interface FinancialSeriesModel {
  financialProjection: FinancialProjection;
  savingPots?: SavingPots;
  timeline?: Timeline;
  financialRecords?: FinancialRecords;
  fundTransactions?: FundTransactions;
}

export interface FinancialProjection {
  series: ChartSeries[];
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color: string;
}

export interface ChartDataPoint {
  x: number;
  y: number;
}

// Optional: minimal typing for other sections
export interface SavingPots {
  id: string;
  totalSavings: number;
  totalGwothRate: number;
  clientSavings: ClientSaving[];
}

export interface ClientSaving {
  id: string;
  name: string;
  type: number;
  iconUrl: string;
  startingPotValue: StartingPotValue;
  returnRate: number;
  realReturn: number;
  inflationRate: number;
  nominalValue: number;
  realValue: number;
  realGrowthRate: number;
  legendColor: string;
  isGrowing: boolean;
}

export interface StartingPotValue {
  currencySymbol: string;
  amount: number;
  cycle: {
    description: string | null;
    id: string;
  } | null;
}

export interface Timeline {
  id: string;
  forecastStartDate: string;
  forecastEndtDate: string;
  clientBirthDate: string;
  startAt: AgeYear;
  client: BasicEntity;
  cashflow: BasicEntity;
  financialAdvisor: FinancialAdvisor;
  clientEvents: ClientEvent[];
}

export interface AgeYear {
  age: number;
  year: number;
}

export interface BasicEntity {
  id: string;
  name: string;
}

export interface FinancialAdvisor {
  advisorId: string;
  advisorName: string;
}

export interface ClientEvent {
  id: string;
  name: string;
  type: number;
  iconUrl: string;
  netAmount: NetAmount | null;
  start: AgeYear;
  end: AgeYear | null;
  escalationRate: EscalationRate | null;
  isPlaceHolder: boolean;
  isOneOff: boolean;
  isDefault: boolean;
}

export interface NetAmount {
  currencySymbol: string;
  amount: number;
  cycle: {
    description: string;
    id: string;
  };
}

export interface EscalationRate {
  description: string;
  value: number;
}

export interface FinancialRecords {
  id: string;
  totalIncome: number;
  totalExpenses: number;
  total: number;
  savingRate: number;
}

export interface FundTransactions {
  id: string;
}