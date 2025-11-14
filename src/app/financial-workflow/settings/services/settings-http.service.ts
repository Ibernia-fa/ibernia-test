import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cycle, EscalationRate, EscalationRateResponse, NetAmount } from '../../timeline/models/financial-timeline';

@Injectable({
  providedIn: 'root'
})
export class SettingsHttpService {

  private readonly SETTINGS_BASE_URL = '/api/v1/settings/';
  constructor(private httpClient: HttpClient) { }

  public getAmountCycles() {
    return this.httpClient.get<Array<Cycle>>(`${this.SETTINGS_BASE_URL}amount-cycles`);
  }
  
  public getEscalationRates(clientId: string) {
    return this.httpClient.get<EscalationRateResponse>(`${this.SETTINGS_BASE_URL}${clientId}/escalation-rates`);
  }
}
