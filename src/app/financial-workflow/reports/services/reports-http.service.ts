import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChartSeries } from '../models/charts-series.model';

export interface ReportForecastPayload {
  ForecastStartDate: string;
  ForecastEndDate: string;
}

export interface ReportScenarioPayload {
  ForecastStartDate: string;
  ForecastEndDate: string;
  InflationRate: number;
  SavingPotId?: string | null;
  ReturnRateOverride?: number | null;
  IncomeOverrides?: any[];
  ExpenseOverrides?: any[];
  ClientRetirementAge?: number | null;
  PartnerRetirementAge?: number | null;
  /** Timeline event overrides (goals / Home / Car / etc.) merged server-side into scenario projection */
  ClientEventOverrides?: any[];
  /** Per-pot overrides from Scenario Lab pot edits (return rate and optional starting balance) */
  SavingPotReturnOverrides?: Array<{
    SavingPotId: string;
    ReturnRate: number;
    StartingPotAmount?: number | null;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsHttpService {

  readonly REPORTS_BASE_URL = '/api/v1/Reports';
  constructor(private httpClient: HttpClient) { }

  // getReportbyCashflowId(cashflowId: string) {
  //   return this.httpClient.get<ChartSeries>(`${this.REPORTS_BASE_URL}/${cashflowId}`);
  // }

getReportbyCashflowId(
  cashflowId: string,
  inflationRate?: number
) {
  // Base relative URL (your interceptor will prepend environment.apiUrl)
  let url = `${this.REPORTS_BASE_URL}/${cashflowId}`;

  if (inflationRate !== undefined && inflationRate !== null) {
    const encoded = encodeURIComponent(inflationRate.toString());
    url = `${url}?inflationRate=${encoded}`;
  }

  // IMPORTANT: no `params` object here
  return this.httpClient.get<ChartSeries>(url);
}

getReportbyCashflowIdWithForecastDates(
  cashflowId: string,
  payload: ReportForecastPayload,
  inflationRate?: number
) {
  let url = `${this.REPORTS_BASE_URL}/${cashflowId}`;

  if (inflationRate !== undefined && inflationRate !== null) {
    const encoded = encodeURIComponent(inflationRate.toString());
    url = `${url}?inflationRate=${encoded}`;
  }

  return this.httpClient.post<ChartSeries>(url, payload);
}

getReportScenario(cashflowId: string, payload: ReportScenarioPayload) {
  const url = `${this.REPORTS_BASE_URL}/${cashflowId}/scenario`;
  return this.httpClient.post<ChartSeries>(url, payload);
}

}
