import { CashflowViewModel } from "src/app/clients/models/cashflow";
import { ClientViewModel } from "src/app/clients/models/client";
import { AgeYear, EscalationRate, NetAmount } from "../../timeline/models/financial-timeline";

export interface SimulateEmergencyModel {
    id: string | null;
    description: string;
    amount: NetAmount;
    start: AgeYear;
    end: AgeYear;
    /** When set, end year follows this timeline event (e.g. retirement). */
    endEventId?: string | null;
    escalationRate: EscalationRate | null; 
    stopIncome: boolean,
    stoppedIncomeId: string | null,
    emergencyId: string,
    client: ClientViewModel;
    cashflow: CashflowViewModel;
}