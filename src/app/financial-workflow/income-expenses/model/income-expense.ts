import { CashflowViewModel } from "src/app/clients/models/cashflow";
import { ClientViewModel, FinancialAdvisor } from "src/app/clients/models/client";
import { NetAmount } from "../../timeline/models/financial-timeline";

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
    date: Date;
}