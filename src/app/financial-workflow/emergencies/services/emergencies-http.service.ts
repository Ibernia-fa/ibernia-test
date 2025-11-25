// ---- Service (you said you have an empty one; keep method signature like this) ----
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEmergencyRequest, EmergenciesResponse, Emergency } from '../models/emergencies.model';

@Injectable({ providedIn: 'root' })
export class EmergenciesHttpService {
  private baseUrl = '/api/v1/emergencies';

  constructor(private http: HttpClient) {}

  // GET /{cashflowId}/all
  getAllByCashflowId(cashflowId: string): Observable<EmergenciesResponse> {
    return this.http.get<EmergenciesResponse>(`${this.baseUrl}/${cashflowId}/all`);
  }

  //   createEmergency(body: any) {
  //   return this.http.post(`${this.baseUrl}/emergencies`, body);
  // }

  // POST /
createEmergency(body: CreateEmergencyRequest) {
  return this.http.post<Emergency>(this.baseUrl, body);
}

  updateEmergency(payload: CreateEmergencyRequest) {
    return this.http.put<Emergency>(this.baseUrl, payload);
  }

}
