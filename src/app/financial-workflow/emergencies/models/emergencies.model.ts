// ---- Models (lightweight, aligned with your response) ----
export interface CycleRef {
  id: string | null;
  description: string | null;
}

export interface Money {
  currencySymbol: string | null;
  amount: number;
  cycle: CycleRef | null;
}

export interface LookupItem {
  id: number;
  name: string;
  description: string;
}

export interface Emergency {
  id: string;
  type: number;                // 1 = Insurance, 2 = Will
  policyStatus: number;        // e.g., 1 = Covered
  insuranceCost: Money;
  coverage: number;
  coverageAdequacy: number;    // 1 Basic, 2 Good, 3 Excellent
  willStatus: number;          // 1 Done, 2 NotDone
  name: string;
  iconUrl: string;
  isHidden: boolean;
  client: { id: string; name: string };
  cashflow: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface StatsAndLookupData {
  emergeinciesStats: {
    totalCoverage: number;
    totalCost: number;
    protectionScore: number;
  };
  emergencyTypes: LookupItem[];
  policyStatuses: LookupItem[];
  coverageAdequacies: LookupItem[];
  insuranceCost: Money;
  willStatuses: LookupItem[];
}

export interface EmergenciesResponse {
  emergencies: Emergency[];
  statsAndLookupData: StatsAndLookupData;
}