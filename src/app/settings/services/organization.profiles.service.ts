import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable, BehaviorSubject } from 'rxjs';

export interface OrganizationProfileDto {
  id?: string | null;        // optional – keep null if you don't have one yet
  userId: string;            // logged-in user id
  profilePhotoUrl: string;   // data URL (base64) or URL string
  backgroundPhotoUrl: string;
}

export type OrganizationImageKind = 'logo' | 'background';

@Injectable({ providedIn: 'root' })
export class OrganizationProfilesService {
  private readonly baseUrl = '/api/v1';
  private brandingLogoSource = new BehaviorSubject<string | null>(null);
  private backgroundImageSource = new BehaviorSubject<string | null>(null);
  public brandingLogo$ = this.brandingLogoSource.asObservable();
  public backgroundImage$ = this.backgroundImageSource.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * POST multipart to /organizations/logo or /organizations/background.
   * User id is taken from the access token on the server.
   */
  postOrganizationImage(
    kind: OrganizationImageKind,
    file: Blob | null,
    clear: boolean
  ): Observable<OrganizationProfileDto> {
    if (clear && file) {
      throw new Error('Invalid upload: cannot set file and clear together');
    }
    if (!clear && !file) {
      throw new Error('Invalid upload: file or clear required');
    }
    const fd = new FormData();
    if (clear) {
      fd.append('clear', 'true');
    } else if (file) {
      const name = file.type?.toLowerCase().includes('png') ? 'image.png' : 'image.jpg';
      fd.append('file', file, name);
    }
    const path = kind === 'logo' ? 'logo' : 'background';
    return this.http.post<OrganizationProfileDto>(`${this.baseUrl}/organizations/${path}`, fd);
  }

  /** GET /organizations/profiles/{userId} — returns null if 204 or empty */
  getProfile(userId: string): Observable<OrganizationProfileDto | null> {
    return this.http
      .get<OrganizationProfileDto>(`${this.baseUrl}/organizations/profiles/${userId}`, {
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

  /** Restore last-known org background before GET /profiles completes (same pattern as logo). */
  hydrateBackgroundFromSession(userId: string): void {
    try {
      const raw = sessionStorage.getItem(this.backgroundImageSessionKey(userId));
      if (raw?.trim()) {
        this.backgroundImageSource.next(raw);
      }
    } catch {
      /* storage disabled or unavailable */
    }
  }

  /** Current in-memory custom background (includes session-hydrated value). */
  getBackgroundImageValue(): string | null {
    return this.backgroundImageSource.getValue();
  }

  private brandingLogoSessionKey(userId: string): string {
    return `ibernia_org_branding_logo_${userId}`;
  }

  private backgroundImageSessionKey(userId: string): string {
    return `ibernia_org_branding_background_${userId}`;
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

  private persistBackgroundImageSession(userId: string, image: string | null): void {
    try {
      const key = this.backgroundImageSessionKey(userId);
      if (image?.trim()) {
        sessionStorage.setItem(key, image);
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

  setBackgroundImage(
    newBackgroundImageUrl: string | null,
    persistForUserId?: string | null,
  ) {
    const normalized =
      newBackgroundImageUrl && String(newBackgroundImageUrl).trim() !== ''
        ? newBackgroundImageUrl
        : null;
    this.backgroundImageSource.next(normalized);
    if (persistForUserId) {
      this.persistBackgroundImageSession(persistForUserId, normalized);
    }
  }
}
