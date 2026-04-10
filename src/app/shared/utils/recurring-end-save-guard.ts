import { extractEventId, resolveYear } from './event-date-utils';

/** True when the amount cycle is recurring (not one-off). */
export function isRecurringAmountCycleDescription(
  description: string | undefined | null,
): boolean {
  return !!description && description !== 'One-off';
}

/**
 * Resolves cycle description from `cycles` + `cycleId` for Save guards.
 * Empty string from API (e.g. salary-aligned cycle) must not skip recurring rules — falls back to "Every month".
 */
export function resolveCycleDescriptionForRecurringEndGuard(
  cycles: { id?: string; description?: string | null }[] | undefined | null,
  cycleId: unknown,
): string {
  const found = cycles?.find((c) => c.id === cycleId);
  const t = (found?.description ?? '').trim();
  return t || 'Every month';
}

/**
 * True when a recurring line still has no valid end (no positive calendar year and no `event:…` reference).
 * Use this to keep Save disabled even if Angular form state is edge-case wrong.
 */
export function recurringEndYearNotSelected(
  cycleDescription: string | undefined | null,
  endRaw: unknown,
  eventsList: any[] | undefined | null,
): boolean {
  if (!isRecurringAmountCycleDescription(cycleDescription)) {
    return false;
  }
  if (extractEventId(endRaw)) {
    return false;
  }
  const y = resolveYear(endRaw, eventsList);
  return y <= 0;
}

/** Financing / custom financing: monthly payment period end year (numeric mat-select). */
export function financingMonthlyEndYearNotSelected(monthlyEndRaw: unknown): boolean {
  const y =
    typeof monthlyEndRaw === 'number' && Number.isFinite(monthlyEndRaw)
      ? monthlyEndRaw
      : 0;
  return y <= 0;
}
