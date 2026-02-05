import { ClientViewModel, FinancialAdvisor } from "./client"

export interface Cashflow {
    id: string,
    name: string,
    planDuration: number,
    inflationRate: number,
    description: string,
    clientBirthDate: Date,
    client: ClientViewModel,
    financialAdvisor: FinancialAdvisor,
    createdAt: Date,
    updatedAt: Date
}

export interface CashflowViewModel {
    id: string,
    name: string
}