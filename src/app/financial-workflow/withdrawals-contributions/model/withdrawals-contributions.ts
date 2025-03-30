import { CashflowViewModel } from "src/app/clients/models/cashflow";
import { ClientViewModel, FinancialAdvisor } from "src/app/clients/models/client";
import { AgeYear, NetAmount } from "../../timeline/models/financial-timeline";

export interface WithdrawalsContributions {
  id: string;
  contributions: FundsViewModel[];
  withdrawals: FundsViewModel[];
  client: ClientViewModel;
  cashflow: CashflowViewModel;
  financialAdvisor: FinancialAdvisor;
}

export interface FundsViewModel {
    id: string | null;
    associatedSavingPotId: string;
    description: string;
    amount: NetAmount;
    start: AgeYear;
    end: AgeYear;
}