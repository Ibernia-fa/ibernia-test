import { UserNotificationItem } from 'src/app/core/services/my-notifications.service';

export const MFA_REMINDER_NOTIFICATION_ID = '__mfa_grace__';

function parseBool(v: unknown): boolean {
  return v === true || v === 'true';
}

/** True when Identity claims indicate 2FA is not enabled (show reminder in the app). */
export function userNeedsMfaReminder(profile: Record<string, unknown> | null | undefined): boolean {
  return !!profile && !parseBool(profile['mfa_enabled']);
}

/** Prepends a synthetic 2FA reminder when MFA is not enabled (claims from Identity). */
export function prependMfaReminderNotification(
  list: UserNotificationItem[],
  userProfile: Record<string, unknown> | null | undefined,
  identityAuthority: string,
  /** When set, STS logout returns to this portal (same as Security menu). */
  portalReturnOrigin?: string
): UserNotificationItem[] {
  if (!userProfile || !userNeedsMfaReminder(userProfile)) {
    return list;
  }

  const firstRaw = userProfile['mfa_first_login_utc'] as string | undefined;
  let previewKey = 'MFA_REMINDER_PREVIEW_GENERIC';
  let previewParams: Record<string, string> | undefined;

  if (firstRaw) {
    const start = new Date(firstRaw);
    if (!Number.isNaN(start.getTime())) {
      const deadline = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      previewKey = 'MFA_REMINDER_PREVIEW_DEADLINE';
      previewParams = { date: deadline.toLocaleDateString(undefined, { dateStyle: 'medium' }) };
    }
  }

  const base = identityAuthority.replace(/\/$/, '');
  let securityUrl = `${base}/Manage/ChangePassword`;
  const origin = portalReturnOrigin?.trim();
  if (origin) {
    securityUrl += `?returnUrl=${encodeURIComponent(origin.replace(/\/$/, ''))}`;
  }

  const synthetic: UserNotificationItem = {
    id: MFA_REMINDER_NOTIFICATION_ID,
    type: 'mfa_reminder',
    title: 'MFA_REMINDER_TITLE',
    body: previewKey,
    preview: previewKey,
    sentAtUtc: new Date().toISOString(),
    isRead: false,
    deepLink: securityUrl,
    iconType: 'security',
    previewParams,
  };

  return [synthetic, ...list];
}
