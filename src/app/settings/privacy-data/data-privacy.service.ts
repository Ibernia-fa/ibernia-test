import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RetentionCategorySummary {
  category: string;
  recordCount: number;
  anonymizedCount: number;
  pendingExpiryCount: number;
}

export interface RetentionStatusModel {
  totalRecords: number;
  anonymizedRecords: number;
  pendingExpiry: number;
  categories: RetentionCategorySummary[];
}

export interface ErasureResponse {
  message: string;
  details: string;
  retentionExpiresAt: string;
}

export interface AnonymizeResponse {
  message: string;
  details: string;
}

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

  exportClientData(clientId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/client/${clientId}`, {
      responseType: 'blob',
    });
  }

  requestErasure(clientId: string): Observable<ErasureResponse> {
    return this.http.post<ErasureResponse>(
      `${this.baseUrl}/erasure-request/${clientId}`,
      {}
    );
  }

  anonymizeClient(clientId: string): Observable<AnonymizeResponse> {
    return this.http.post<AnonymizeResponse>(
      `${this.baseUrl}/anonymize/${clientId}`,
      {}
    );
  }

  getDataInventory(advisorId: string): Observable<RetentionStatusModel> {
    return this.http.get<RetentionStatusModel>(
      `${this.baseUrl}/inventory/${advisorId}`
    );
  }

  terminateAccount(): Observable<AccountTerminationResponse> {
    return this.http.post<AccountTerminationResponse>(
      `${this.baseUrl}/terminate-account`,
      {}
    );
  }
}
