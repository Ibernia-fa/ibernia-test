import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReportScenarioPayload } from 'src/app/financial-workflow/reports/services/reports-http.service';
import { Cashflow } from '../models/cashflow';

@Injectable({
  providedIn: 'root'
})
export class CashflowHttpService {

  private readonly CASHFLOW_URL_PREFIX = '/api/v1/cashflows'
  constructor(private httpClient: HttpClient) { }

  createCashflow(cashflow: Cashflow) {
    return this.httpClient.post<Cashflow>(this.CASHFLOW_URL_PREFIX, cashflow)
  }
  
  updateCashflow(cashflow: Cashflow) {
    return this.httpClient.put<Cashflow>(this.CASHFLOW_URL_PREFIX, cashflow)
  }
  
  getByClientId(clientId: string) {
    return this.httpClient.get<Array<Cashflow>>(`/api/v1/client/${clientId}/cashflows`);
  }
  
  getByCashflowId(cashflowId: string) {
    return this.httpClient.get<Cashflow>(`${this.CASHFLOW_URL_PREFIX}/${cashflowId}`);
  }

  deleteCashflow(cashflowId: string) {
    return this.httpClient.delete(`${this.CASHFLOW_URL_PREFIX}/${cashflowId}`, {
      responseType: "text"
    });
  }

  copyCashflow(cashflow: Cashflow) {
    return this.httpClient.post<Cashflow>(`${this.CASHFLOW_URL_PREFIX}/copy`, cashflow)
  }

  createFromScenario(request: CreateFromScenarioRequest) {
    return this.httpClient.post<Cashflow>(`${this.CASHFLOW_URL_PREFIX}/create-from-scenario`, request);
  }
}

export interface CreateFromScenarioRequest {
  SourceCashflowId: string;
  NewPlanName: string;
  InflationRate?: number;
  PlanUntilDate?: string;
  SavingPotId?: string | null;
  ReturnRateOverride?: number | null;
  /** Same payload as Scenario Lab chart / POST .../scenario — persisted onto the new plan when supported by the API. */
  ScenarioSnapshot?: ReportScenarioPayload;
}
