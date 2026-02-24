import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FinancialSeriesModel } from '../models/financial-series.model';

export interface ConsumerAskResponse {
  success: boolean;
  errorCode?: string;
  message?: string;
  answer?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ViewReportHttpService {

  readonly REPORTS_BASE_URL = '/api/v1/ClientReport';
  readonly AGENTIC_BASE_URL = '/api/v1/agentic';

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

  consumerAsk(token: string, password: string, message: string): Observable<ConsumerAskResponse> {
    return this.httpClient.post<ConsumerAskResponse>(`${this.AGENTIC_BASE_URL}/consumer/ask`, {
      reportToken: token,
      password,
      message
    });
  }
}
