import { AgeYear, EscalationRate, NetAmount } from "../../timeline/models/financial-timeline";

export interface SimulateEmergencyModel {
    id: string | null;
    description: string;
    amount: NetAmount;
    start: AgeYear;
    end: AgeYear;
    escalationRate: EscalationRate | null; 
    stopIncome: boolean,
    stoppedIncomeId: string | null,
    cashflowId: string
}