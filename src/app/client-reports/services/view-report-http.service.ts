import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FinancialSeriesModel } from '../models/financial-series.model';

@Injectable({
  providedIn: 'root'
})
export class ViewReportHttpService {

  readonly REPORTS_BASE_URL = '/api/v1/ClientReport';

  constructor(private httpClient: HttpClient) { }

  viewReport(token: string, password: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = JSON.stringify(password);
    return this.httpClient.post<FinancialSeriesModel>(
      `${this.REPORTS_BASE_URL}/view/report/${token}`,
      body,
      { headers }
    );
  }
}
