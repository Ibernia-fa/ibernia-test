export interface Client {
    id: string,
    clientDetails: Details,
    partnerDetail: Details,
    financialAdvisor: FinancialAdvisor,
    lastUpdated: Date,
    notes: string
}

export interface Details {
    name: string,
    birthDate: Date,
    preferredCurrency: string,
    gender: string,
    email: string,
    phone: string
}

export interface FinancialAdvisor {
    advisorId: string,
    advisorName: string
}