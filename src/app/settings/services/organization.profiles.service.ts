import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable, BehaviorSubject } from 'rxjs';

export interface OrganizationProfileDto {
  id?: string | null;        // optional – keep null if you don't have one yet
  userId: string;            // logged-in user id
  profilePhotoUrl: string;   // data URL (base64) or URL string
  backgroundPhotoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationProfilesService {
  private readonly baseUrl = '/api/v1';
  private brandingLogoSource = new BehaviorSubject<string | null>(null);
  private backgroundImageSource = new BehaviorSubject<string | null>(null);
  public brandingLogo$ = this.brandingLogoSource.asObservable();
  public backgroundImage$ = this.backgroundImageSource.asObservable();

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

  setBrandingLogo(newLogoUrl: string) {
    this.brandingLogoSource.next(newLogoUrl); // + '?v=' + new Date().getTime() 
  }

  setBackgroundImage(newBackgroundImageUrl: string) {
    this.backgroundImageSource.next(newBackgroundImageUrl);
  }
}
