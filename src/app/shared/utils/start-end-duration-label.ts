import { TranslateService } from '@ngx-translate/core';
import { resolveYear } from './event-date-utils';

/**
 * Computes a localized "Length: X years" helper label for a start/end year pair.
 * Returns null when either date is missing/invalid or end is before start.
 */
export function getStartEndDurationLabel(
  startValue: any,
  endValue: any,
  eventsList: any[] | undefined | null,
  translate: TranslateService,
): string | null {
  const startYear = resolveYear(startValue, eventsList);
  const endYear = resolveYear(endValue, eventsList);

  if (startYear <= 0 || endYear <= 0) return null;
  if (endYear < startYear) return null;

  const duration = endYear - startYear + 1;
  const key = duration === 1 ? 'DURATION.LENGTH_YEAR' : 'DURATION.LENGTH_YEARS';
  return translate.instant(key, { count: duration });
}
