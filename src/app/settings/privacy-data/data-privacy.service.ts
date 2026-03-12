import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AccountTerminationResponse {
  message: string;
  exportWindowEnds: string;
  dataDeletedBy: string;
  details: string;
}

@Injectable({ providedIn: 'root' })
export class DataPrivacyService {
  private readonly baseUrl = '/api/v1/DataPrivacy';

  constructor(private http: HttpClient) {}

  exportAdvisorData(advisorId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/${advisorId}`, {
      responseType: 'blob',
    });
  }

  terminateAccount(): Observable<AccountTerminationResponse> {
    return this.http.post<AccountTerminationResponse>(
      `${this.baseUrl}/terminate-account`,
      {}
    );
  }
}
