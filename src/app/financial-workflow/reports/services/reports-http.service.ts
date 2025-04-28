import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ChartSeries } from '../models/charts-series.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsHttpService {

  readonly REPORTS_BASE_URL = '/api/v1/Reports';
  constructor(private httpClient: HttpClient) { }

  getReportbyCashflowId(cashflowId: string) {
    return this.httpClient.get<ChartSeries>(`${this.REPORTS_BASE_URL}/${cashflowId}`);
  }
}
