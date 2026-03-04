import { CashflowViewModel } from "src/app/clients/models/cashflow";
import { ClientViewModel, FinancialAdvisor } from "src/app/clients/models/client";
import { AgeYear, EscalationRate, NetAmount } from "../../timeline/models/financial-timeline";
import { Comission } from "../../saving-pots/models/saving-pots.model";

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
    escalationRate: EscalationRate | null;
    contributionType:number;
      hasCommission: boolean;
      comission: Comission | any;
    startEventId?: string | null;
    endEventId?: string | null;
    sourceIncomeId?: string | null;
}