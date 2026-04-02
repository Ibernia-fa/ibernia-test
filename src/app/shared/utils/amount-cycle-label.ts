import { TranslateService } from '@ngx-translate/core';

/** Maps API cycle descriptions (English) to i18n keys for mat-select labels. */
export function getAmountCycleLabel(
  cycle: { description?: string } | null | undefined,
  translate: TranslateService,
): string {
  const raw = (cycle?.description ?? '').toString().trim();
  if (!raw) return '';

  const normalized = raw.toLowerCase();
  const key =
    normalized === 'one-off'
      ? 'CYCLE.ONE_OFF'
      : normalized === 'every month'
        ? 'CYCLE.EVERY_MONTH'
        : normalized === 'every year'
          ? 'CYCLE.EVERY_YEAR'
          : null;

  return key ? translate.instant(key) : raw;
}
