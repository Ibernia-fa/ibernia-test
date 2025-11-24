import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChartSeries } from '../models/charts-series.model';

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

}
