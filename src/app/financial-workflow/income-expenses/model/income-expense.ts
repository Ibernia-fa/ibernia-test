import { CashflowViewModel } from "src/app/clients/models/cashflow";
import { ClientViewModel, FinancialAdvisor } from "src/app/clients/models/client";
import { AgeYear, EscalationRate, NetAmount } from "../../timeline/models/financial-timeline";

export interface IncomeExpense {
  id: string;
  totalIncome: number;
  totalExpenses: number;
  total: number;
  savingRate: number;
  incomes: FinancialViewModel[];
  expenses: FinancialViewModel[];
  client: ClientViewModel;
  cashflow: CashflowViewModel;
  financialAdvisor: FinancialAdvisor;
}

export interface FinancialViewModel {
    id: string | null;
    description: string;
    amount: NetAmount;
    start: AgeYear;
    end: AgeYear;
    escalationRate: EscalationRate | null; 
    isDefault: boolean | false;
    isIncomeExpenseSource: boolean | false;
    icon: string;
    bonus?: Bonus | null;
    startEventId?: string | null;
    endEventId?: string | null;
    investThisAmount?: boolean;
    inheritanceTargetPotId?: string | null;
    inheritancePercentToInvest?: number;
    linkedContributionId?: string | null;
}

export interface Bonus {
  enabled: boolean;
  amount: NetAmount;
  bonusDate: AgeYear | null;
}