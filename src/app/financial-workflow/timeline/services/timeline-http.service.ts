import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FinancialTimeline } from '../models/financial-timeline';

@Injectable({
  providedIn: 'root'
})
export class TimelineHttpService {

  readonly TIMELINE_BASE_URL = '/api/v1/timeline';
  constructor(private httpClient: HttpClient) { }

  getTimelinebyCashflowId(cashflowId: string) {
    return this.httpClient.get<FinancialTimeline>(`/api/v1/cashflows/${cashflowId}/timelines`);
  }
}
