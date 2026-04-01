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

/** Manage/Security URL with return marker so STS logout sends the user back to this portal. */
export function identitySecurityManageUrl(): string {
  const base = `${environment.authority.replace(/\/$/, '')}/Manage/ChangePassword`;
  const origin = portalOriginForIdentityReturn();
  if (!origin) {
    return base;
  }
  return `${base}?returnUrl=${encodeURIComponent(origin)}`;
}
