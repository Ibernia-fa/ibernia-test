import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChartSeries } from '../models/charts-series.model';

export interface ReportForecastPayload {
  ForecastStartDate: string;
  ForecastEndDate: string;
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

}
