import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface OrganizationProfileDto {
  id?: string | null;        // optional – keep null if you don't have one yet
  userId: string;            // logged-in user id
  profilePhotoUrl: string;   // data URL (base64) or URL string
}

@Injectable({ providedIn: 'root' })
export class OrganizationProfilesService {
  private readonly baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  // POST /Organizations/profiles
  saveProfile(dto: OrganizationProfileDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Organizations/profiles`, dto);
  }

    /** GET /Organizations/profiles/{userId} — returns null if 204 or empty */
  getProfile(userId: string): Observable<OrganizationProfileDto | null> {
    return this.http
      .get<OrganizationProfileDto>(`${this.baseUrl}/Organizations/profiles/${userId}`, {
        observe: 'response',
      })
      .pipe(
        map((res: HttpResponse<OrganizationProfileDto>) => {
          if (res.status === 204 || !res.body) return null;
          return res.body;
        })
      );
  }
}
