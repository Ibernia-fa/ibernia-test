import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ClientEvent, FinancialTimeline } from '../models/financial-timeline';

@Injectable({
  providedIn: 'root'
})
export class TimelineHttpService {

  readonly TIMELINE_BASE_URL = '/api/v1/timelines';
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

  addEvent(clientEvent: ClientEvent, cashflowId: string) {
    return this.httpClient.post(`/api/v1/cashflows/${cashflowId}/timelines/events`, clientEvent, {
      responseType: "text"
    })
  }

  updateTimeline(financialTimeline: FinancialTimeline) {
    return this.httpClient.put(`${this.TIMELINE_BASE_URL}`, financialTimeline, {
      responseType: "text"
    })
  }

  deleteEvent(cashflowId: string, eventId: string) {
    return this.httpClient.delete(`/api/v1/cashflows/${cashflowId}/timelines/events/${eventId}`, {
      responseType: 'text'
    })
  }
}
