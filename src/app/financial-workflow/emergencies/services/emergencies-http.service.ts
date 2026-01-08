import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEmergencyRequest, EmergenciesResponse, Emergency } from '../models/emergencies.model';
import { SimulateEmergencyModel } from '../models/simulate-emergency.model';

@Injectable({ providedIn: 'root' })
export class EmergenciesHttpService {
  private baseUrl = '/api/v1/emergencies';

  constructor(private http: HttpClient) { }

  getAllByCashflowId(cashflowId: string): Observable<EmergenciesResponse> {
    return this.http.get<EmergenciesResponse>(`${this.baseUrl}/${cashflowId}/all`);
  }

  createEmergency(body: CreateEmergencyRequest) {
    return this.http.post<Emergency>(this.baseUrl, body);
  }

  updateEmergency(payload: CreateEmergencyRequest) {
    return this.http.put<Emergency>(this.baseUrl, payload);
  }

  deleteEmergency(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  simulateEmergency(simulateEmergency: SimulateEmergencyModel) {
    return this.http.post<any>(`${this.baseUrl}/simulate`, simulateEmergency);
  }
}
