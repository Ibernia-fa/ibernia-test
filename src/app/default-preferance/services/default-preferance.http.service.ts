// src/app/settings/settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CommissionType = 'none' | 'percentage' | 'amount';

export interface DefaultPreferencesPayload {
  inflationRate: number;          // e.g., 2.5  (percent)
  currency: string;               // e.g., 'USD'
  netInvestmentReturn: number;    // e.g., 5 (percent, can be negative)
  advisorCommissionType: CommissionType;
  commissionPercentage?: number | null; // 0..100 when type=percentage
  commissionAmount?: number | null;     // >0 when type=amount
  acknowledged?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  // Change this to your real base API
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  saveDefaultPreferences(payload: DefaultPreferencesPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/user/preferences`, payload);
  }

  // Optional: preload existing values
  getDefaultPreferences(): Observable<DefaultPreferencesPayload> {
    return this.http.get<DefaultPreferencesPayload>(`${this.baseUrl}/user/preferences`);
  }
}
