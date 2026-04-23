import { CashflowViewModel } from 'src/app/clients/models/cashflow';
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
  id: string;
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
  isCash: boolean | false;
  isFinance: boolean | false;
  isParent: boolean | false;
  isPartnerEvent?: boolean;
  /** Mirrors expense/income line item link to a timeline event for start. */
  startEventId?: string | null;
  /** Mirrors expense/income line item link to a timeline event for end. */
  endEventId?: string | null;
}

export interface NetAmount {
  currencySymbol: string;
  amount: number;
  cycle: Cycle | null;
}

export interface Cycle {
  id: string;
  description: string;
}

export interface EscalationRate {
  description: string;
  value: string;
}

export interface EscalationRateResponse{
  escalationRates: Array<EscalationRate>,
  id: string
}

export enum EventIncomeType
{
    Income = 1,
    Expense = 2
}

export interface TimelineResponse {
  timeline: FinancialTimeline;
  financialRecords: FinancialRecordLineItem[];
}

export interface FinancialRecordLineItem {
  id: string;
  description: string;
  amount: NetAmount;
  start: AgeYear;
  end: AgeYear | null;
  escalationRate: EscalationRate | null;
  isParent: boolean | false;
  parentId: string;
  isCash: boolean | false;
  isFinance: boolean | false;
  inheritanceGrossAmount?: number | null;
  startEventId?: string | null;
  endEventId?: string | null;
}
