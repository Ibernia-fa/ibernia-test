import { environment } from 'src/environments/environment';

/** Portal origin for STS ?returnUrl= (must match Identity PortalReturnAfterLogout AllowedPortalOrigins). */
export function portalOriginForIdentityReturn(): string {
  const configured = environment.appUrl?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}

/** Maps portal language (e.g. ngx-translate) to STS supported cultures (en | it). */
export function identityCultureFromPortalLang(lang: string | undefined | null): string {
  if (!lang) return 'en';
  const short = String(lang).toLowerCase().split(/[-_]/)[0];
  return short === 'it' ? 'it' : 'en';
}

/** Appends ?culture= &ui-culture= so the STS host renders in the correct language (cross-origin; cookie is host-scoped). */
export function appendIdentityLocalizationQuery(url: string, culture: string): string {
  if (culture !== 'it' && culture !== 'en') return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}culture=${encodeURIComponent(culture)}&ui-culture=${encodeURIComponent(culture)}`;
}

/**
 * Manage/Security URL with return marker so STS logout sends the user back to this portal,
 * plus localization query params aligned with the portal UI language.
 */
export function identitySecurityManageUrl(portalLang?: string | null): string {
  const base = `${environment.authority.replace(/\/$/, '')}/Manage/ChangePassword`;
  const origin = portalOriginForIdentityReturn();
  const withReturn = !origin
    ? base
    : `${base}?returnUrl=${encodeURIComponent(origin)}`;
  return appendIdentityLocalizationQuery(
    withReturn,
    identityCultureFromPortalLang(portalLang ?? undefined),
  );
}
