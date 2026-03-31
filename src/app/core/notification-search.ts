import { TranslateService } from '@ngx-translate/core';
import { UserNotificationItem } from 'src/app/core/services/my-notifications.service';
import { MFA_REMINDER_NOTIFICATION_ID } from 'src/app/core/mfa-reminder-notification';

/**
 * Match notification against a search query using visible text: raw fields, i18n-resolved
 * title/preview/body, and the "Security" label when the row shows that pill (MFA reminder, etc.).
 */
export function notificationMatchesSearchQuery(
  n: UserNotificationItem,
  queryLower: string,
  translate: TranslateService
): boolean {
  const params = n.previewParams ?? {};
  const parts: string[] = [
    n.title ?? '',
    n.preview ?? '',
    n.body ?? '',
    n.type ?? '',
    n.categoryLabel ?? '',
    translate.instant(n.title ?? ''),
    translate.instant(n.preview ?? '', params),
    translate.instant(n.body ?? '', params),
  ];

  if (
    n.id === MFA_REMINDER_NOTIFICATION_ID ||
    n.type === 'mfa_reminder' ||
    n.iconType === 'security'
  ) {
    parts.push(translate.instant('Security'));
  }

  const haystack = parts.join(' ').toLowerCase();
  return haystack.includes(queryLower);
}
