import { TranslateService } from '@ngx-translate/core';

/**
 * Localized label for a timeline event on charts (e.g. stacked savings bar).
 * API sends English composite names such as "Retirement Age Matteo"; ngx-translate
 * only has keys for the base phrase ("Retirement age"), so we translate the base
 * and preserve the person suffix.
 */
export function translateTimelineEventDisplayName(
  translate: TranslateService,
  rawName: string,
): string {
  const trimmed = (rawName ?? '').trim();
  if (!trimmed) return '';

  if (!trimmed.toLowerCase().startsWith('retirement age')) {
    const t = translate.instant(trimmed);
    return t !== trimmed ? t : trimmed;
  }

  const base = translate.instant('Retirement age');
  const rest = trimmed.replace(/^retirement age\s*/i, '').trim();
  if (!rest) {
    return base;
  }

  if (rest.toLowerCase() === '(partner)') {
    const partner = translate.instant('Partner');
    return `${base} (${partner})`;
  }

  // Italian reads more naturally with a connector ("di") when a person name follows.
  if ((translate.currentLang ?? '').toLowerCase().startsWith('it')) {
    return `${base} di ${rest}`;
  }

  return `${base} ${rest}`;
}
