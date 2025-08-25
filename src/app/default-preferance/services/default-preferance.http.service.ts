// src/app/settings/settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum ComissionType { Amount = 1, Percentage = 2, Both = 3 }

export interface PreferencesDto {
  inflationRate: number;
  investmentReturn: number;
  comissionType: ComissionType;         // 1|2|3
  comissionPercentage?: number | null;  // 0..100 when Percentage/Both
  comissionAmount?: number | null;      // >0 when Amount/Both
  currency: string;
  country?: string | null;
}

export interface UserProfileDto {
  userId?: string | null;
  profilePhotoUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  preferences: PreferencesDto;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}
  postUserProfile(payload: UserProfileDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/UserProfile`, payload);
  }

}
