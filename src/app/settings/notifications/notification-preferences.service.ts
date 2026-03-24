import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface ChannelPreference {
  email: boolean;
  push: boolean;
}

export interface NotificationPreference {
  userId: string;
  timezone: string;
  categories: Record<string, ChannelPreference>;
}

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly baseUrl = '/api/v1/NotificationPreferences';

  constructor(private http: HttpClient) {}

  get(): Observable<NotificationPreference> {
    return this.http.get<NotificationPreference>(this.baseUrl);
  }

  update(prefs: NotificationPreference): Observable<NotificationPreference> {
    return this.http.put<NotificationPreference>(this.baseUrl, prefs);
  }
}
