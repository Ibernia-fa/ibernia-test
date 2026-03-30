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

  /** Current in-memory branding logo (includes session-hydrated value). */
  getBrandingLogoValue(): string | null {
    return this.brandingLogoSource.getValue();
  }

  /** Restore last-known logo before HTTP completes (avoids empty sidebar/header after F5). */
  hydrateBrandingLogoFromSession(userId: string): void {
    try {
      const raw = sessionStorage.getItem(this.brandingLogoSessionKey(userId));
      if (raw?.trim()) {
        this.brandingLogoSource.next(raw);
      }
    } catch {
      /* storage disabled or unavailable */
    }
  }

  private brandingLogoSessionKey(userId: string): string {
    return `ibernia_org_branding_logo_${userId}`;
  }

  private persistBrandingLogoSession(userId: string, logo: string | null): void {
    try {
      const key = this.brandingLogoSessionKey(userId);
      if (logo?.trim()) {
        sessionStorage.setItem(key, logo);
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      /* quota exceeded or storage disabled */
    }
  }

  setBrandingLogo(newLogoUrl: string | null, persistForUserId?: string | null) {
    const normalized =
      newLogoUrl && String(newLogoUrl).trim() !== '' ? newLogoUrl : null;
    this.brandingLogoSource.next(normalized);
    if (persistForUserId) {
      this.persistBrandingLogoSession(persistForUserId, normalized);
    }
  }

  setBackgroundImage(newBackgroundImageUrl: string | null) {
    this.backgroundImageSource.next(newBackgroundImageUrl);
  }
}
