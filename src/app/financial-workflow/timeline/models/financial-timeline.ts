import {
  ClientViewModel,
  FinancialAdvisor,
} from 'src/app/clients/models/client';

export interface FinancialTimeline {
  id: string;
  forecastStartDate: Date;
  forecastEndtDate: Date;
  clientBirthDate: Date;
  startAt: AgeYear;
  client: ClientViewModel;
  cashflow: CashflowViewModel;
  financialAdvisor: FinancialAdvisor;
  clientEvents: ClientEvent[];
}

export interface AgeYear {
  age: number;
  year: number;
}

export interface ClientEvent {
  id: string | null;
  name: string;
  type: EventIncomeType;
  iconUrl: string;
  netAmount: NetAmount;
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
  cycle: Cycle;
}

export interface Cycle {
  id: string;
  description: string;
}

export interface EscalationRate {
  id: string;
  description: string;
}

export interface CashflowViewModel {
    id: string,
    name: string
}

export enum EventIncomeType
{
    Income = 1,
    Expense = 2
}
