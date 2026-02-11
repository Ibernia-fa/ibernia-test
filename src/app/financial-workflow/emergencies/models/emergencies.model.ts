import { SimulateEmergencyModel } from "./simulate-emergency.model";

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
  type: number;
  policyStatus: number;
  insuranceCost?: Money | null;
  coverage: number;
  coverageAdequacy: number;
  willStatus: number;
  name: string;
  iconUrl: string;
  isHidden: boolean;
  client: { id: string; name: string };
  cashflow: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface StatsAndLookupData {
  emergenciesStats: {
    totalCoverage: number;
    totalCost: number;
    protectionScore: number;
  };
  emergencyTypes: LookupItem[];
  policyStatuses: LookupItem[];
  coverageAdequacies: LookupItem[];
  insuranceCost: Money;
  willStatuses: LookupItem[];
  emergencyExpenses: SimulateEmergencyModel[];
}

export interface EmergenciesResponse {
  emergencies: Emergency[];
  statsAndLookupData: StatsAndLookupData;
}

// Use the same shape as Emergency, but without the mandatory id.
export type CreateEmergencyRequest = Omit<Emergency, 'id' | 'createdAt' | 'updatedAt'>;

