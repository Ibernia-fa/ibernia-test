import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ClientEvent, FinancialTimeline } from '../models/financial-timeline';

@Injectable({
  providedIn: 'root'
})
export class TimelineHttpService {

  readonly TIMELINE_BASE_URL = '/api/v1/timeline';
  constructor(private httpClient: HttpClient) { }

  getTimelinebyCashflowId(cashflowId: string) {
    return this.httpClient.get<FinancialTimeline>(`/api/v1/cashflows/${cashflowId}/timelines`);
  }

  getSystemEvents() {
    return this.httpClient.get<ClientEvent[]>('/api/v1/events/default')
  }
  
  getCustomEvents() {
    return this.httpClient.get<ClientEvent[]>('/api/v1/events/custom')
  }

  addEvent(clientEvent: ClientEvent, timelineId: string) {
    return this.httpClient.post(`${this.TIMELINE_BASE_URL}s/${timelineId}/events`, clientEvent, {
      responseType: "text"
    })
  }
}
