import { CashflowViewModel } from 'src/app/clients/models/cashflow';
import {
  ClientViewModel,
  FinancialAdvisor,
} from 'src/app/clients/models/client';
import {
  AgeYear,
  EscalationRate,
  NetAmount,
} from '../../timeline/models/financial-timeline';

export interface SavingPotsModel {
  id: string;
  totalSavings: number;
  totalGwothRate: number;
  clientSavings: ClientSaving[];
  client: ClientViewModel;
  cashflow: CashflowViewModel;
  financialAdvisor: FinancialAdvisor;
}

export interface Comission {
  type: ComissionType;
  amount: NetAmount;
  percentage: NetAmount;
  escalationRate: EscalationRate;
}

export interface ClientSaving {
  id: string | null;
  name: string;
  type: SavingPotType;
  iconUrl: string;
  startingPotValue: NetAmount;
  nominalValue: number;
  realValue: number;
  realGrowthRate: number;
  inflationRate: number;
  isGrowing: boolean;
  returnRate: number;
  realReturn: number;
  hasPotLocked: true;
  start: AgeYear;
  end: AgeYear;
  lockedFrom: AgeYear;
  lockedTill : AgeYear;
  hasCommission: boolean;
  comission: Comission;
  orderNumber: number;
  customName?: string | null;
  contributionAmount?: number | null;
  contributionFrequency?: number | null;
  contributionStartDate?: AgeYear | null;
  contributionEndDate?: AgeYear | null;
  retirementAge?: number | null;
  startEventId?: string | null;
  endEventId?: string | null;
  contributionStartEventId?: string | null;
  contributionEndEventId?: string | null;
  ownership?: SavingPotOwnership;
}

export enum SavingPotType
{
    Cash = 1,
    Investment = 2,
    PensionFund = 3,
    Other = 4
}

export enum SavingPotOwnership
{
    Joint = 0,
    Person1 = 1,
    Person2 = 2
}

export enum ComissionType
{
    None = 0,
    Amount = 1,
    Percentage = 2,
    Both = 3
}