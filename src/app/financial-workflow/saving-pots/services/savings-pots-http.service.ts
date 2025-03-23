import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ClientSaving, SavingPotsModel } from '../models/saving-pots.model';
import { T } from '@angular/cdk/keycodes';

@Injectable({
  providedIn: 'root'
})
export class SavingsPotsHttpService {

  // readonly SAVINGS_POTS_BASE_URL = '/api/v1/';

  constructor(private httpClient: HttpClient) { }

  getAllSavingsPots(cashflowId: any) {
    return this.httpClient.get<SavingPotsModel>(`/api/v1/cashflows/${cashflowId}/saving-pots`);
  }

  addNewSavingPot(cashflowId: string, clientSaving: ClientSaving) {
    return this.httpClient.post<SavingPotsModel>(`/api/v1/cashflows/${cashflowId}/saving-pots`, clientSaving);
  }
  updateSavingPot(cashflowId: string, clientSaving: ClientSaving) {
    return this.httpClient.put<SavingPotsModel>(`/api/v1/cashflows/${cashflowId}/saving-pots`, clientSaving);
  }
}
