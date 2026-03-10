// src/app/settings/settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';

export enum ComissionType { None = 0, Amount = 1, Percentage = 2, Both = 3 }

export interface PreferencesDto {
  inflationRate: number;
  investmentReturn: number;
  pensionFundReturn: number;
  comissionType: ComissionType;         // 1|2|3
  comissionPercentage?: number | null;  // 0..100 when Percentage/Both
  comissionAmount?: number | null;      // >0 when Amount/Both
  currency: string;
  country?: string | null;
  language?: string;
}

export interface UserProfileDto {
  id?: string | null;
  userId?: string | null;
  profilePhotoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  bio?: string | null;
  preferences: PreferencesDto;
  /** Advisor/company guidelines for AI recommendations (risk tolerance, tone, compliance). */
  advisorGuidelines?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly baseUrl = '/api/v1';
  private _profileChanged = new Subject<void>();
  private _userData = new BehaviorSubject<UserProfileDto | null>(null);
  readonly userData$: Observable<UserProfileDto | null> = this._userData.asObservable();
  /** Header (and others) can subscribe to this */
  readonly profileChanged$ = this._profileChanged.asObservable();
  constructor(private http: HttpClient) {}
  postUserProfile(payload: UserProfileDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/UserProfile`, payload);
  }

  updateUserProfile(payload: UserProfileDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/UserProfile`, payload);
  }

  getUserProfileResponse(userId: string): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}/UserProfile/${userId}`, {
      observe: 'response',
    });
  }

  updateLanguage(userId: string, language: string): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/UserProfile/${userId}/language`,
      JSON.stringify(language),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  uploadProfilePhoto(file: File) {
    const form = new FormData();
    form.append('file', file);
    // Adjust URL and response handling to your API;
    // assume API returns { url: 'https://...' }
    return this.http.post<{ url: string }>(`${this.baseUrl}/UserProfile/UploadPhoto`, form)
      .pipe(
        // map to just the URL string
        // If your API returns plain string, change accordingly
        map(res => res.url)
      );
  }

  notifyProfileChanged(): void {
    this._profileChanged.next();
  }


  setUserData(value: UserProfileDto | null) {
    this._userData.next(value);
  }

  // optional synchronous getter
  get currentUserData(): UserProfileDto | null {
    return this._userData.value;
  }

}
