/**
 * Completed years between birth and a reference instant — same rules as
 * {@link AgeCalculatorPipe} when reference is "today".
 *
 * The birthday must have occurred on or before the reference date in that
 * calendar year for the year-difference to count.
 */
export function getCompletedYearsAgeAtDate(
  birthDate: Date | string | number | null | undefined,
  referenceDate: Date | string | number | null | undefined,
): number {
  if (birthDate == null || referenceDate == null) {
    return NaN;
  }
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) {
    return NaN;
  }
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  const dayDiff = ref.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}

/** Last instant of civil calendar year (local), for "age in year Y" labels. */
export function endOfCalendarYear(calendarYear: number): Date {
  return new Date(calendarYear, 11, 31, 12, 0, 0, 0);
}

/**
 * Last **calendar year** of the plan in the cashflow model: `birthYear + planDuration`.
 * Example: born 1990, plan to age 90 → `1990 + 90 = 2080`. Matches reports
 * `getEffectiveReportEndDate` / edit-model `buildForecastEndDate`.
 */
export function getPlanEndCalendarYear(
  birthDate: Date | string | null | undefined,
  planDuration: number | null | undefined,
): number | null {
  const pd = Number(planDuration);
  if (birthDate == null || !Number.isFinite(pd) || pd <= 0) {
    return null;
  }
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  return birth.getFullYear() + Math.trunc(pd);
}

/** Canonical plan end instant: Dec 31 of plan end calendar year, 12:00 UTC. */
export function getPlanEndDate(
  birthDate: Date | string | null | undefined,
  planDuration: number | null | undefined,
): Date | null {
  const y = getPlanEndCalendarYear(birthDate, planDuration);
  if (y == null) return null;
  return new Date(Date.UTC(y, 11, 31, 12, 0, 0));
}

/**
 * Completed years on Jan 1 of `calendarYear` — persisted AgeYear.age for that year.
 */
export function getAgeInCalendarYear(
  birthDate: Date | string | number | null | undefined,
  calendarYear: number,
): number {
  const y = Math.trunc(Number(calendarYear));
  if (!Number.isFinite(y) || birthDate == null) {
    return NaN;
  }
  return getCompletedYearsAgeAtDate(birthDate, new Date(y, 0, 1));
}

/** Projection calendar years [forecastStartYear .. planEndYear] inclusive. */
export function getProjectionYears(
  forecastStartDate: Date | string,
  birthDate: Date | string,
  planDuration: number,
): number[] {
  const endY = getPlanEndCalendarYear(birthDate, planDuration);
  const fs = new Date(forecastStartDate);
  const birth = new Date(birthDate);
  if (endY == null || Number.isNaN(fs.getTime()) || Number.isNaN(birth.getTime())) {
    return [];
  }
  const startY = fs.getFullYear();
  const last = Math.max(startY, endY);
  const years: number[] = [];
  for (let y = startY; y <= last; y++) years.push(y);
  return years;
}

/**
 * Last calendar year in cashflow modal year dropdowns (event/pot/withdrawal/etc.).
 * Prefer {@link getPlanEndCalendarYear}; otherwise `forecastEndDateYear` from the API.
 * Do **not** add +1 to the forecast year — that duplicated the final year (e.g. 2081 vs 2080).
 */
export function getCashflowDialogEndCalendarYear(
  clientBirthDate: Date | string | null | undefined,
  planDuration: number | null | undefined,
  forecastEndDateYear: number | null | undefined,
): number {
  const fromPlan = getPlanEndCalendarYear(clientBirthDate, planDuration);
  if (fromPlan != null) {
    return fromPlan;
  }
  const y = Number(forecastEndDateYear);
  return Number.isFinite(y) ? y : NaN;
}

/**
 * Age shown for a projection column / dropdown for calendar year `calendarYear`.
 *
 * When **`planDuration`** is set: uses a **single contiguous ramp** so each calendar year is
 * exactly +1 from the previous and the plan end year ({@link getPlanEndCalendarYear}) shows
 * age `planDuration` (e.g. 90). Formula: `planDuration - (planEndYear - calendarYear)`.
 * This matches “start → end” on the chart with no skipped ages (e.g. 35…90 across years).
 *
 * When **plan duration** is missing: linear step from {@link getCompletedYearsAgeAtDate} at
 * `forecastStartDate`, or completed age at end of `calendarYear`.
 *
 * {@link projectionInclusiveEndYear}: if it equals `calendarYear` and there is **no** usable
 * `planDuration` for an end year, uses EOY completed age for that column (legacy edge case).
 */
export function getProjectionColumnAgeLabel(
  birthDate: Date | string | null | undefined,
  calendarYear: number,
  forecastStartDate?: Date | string | null,
  planDuration?: number | null,
  projectionInclusiveEndYear?: number | null,
): number {
  const y = Number(calendarYear);
  if (!Number.isFinite(y) || birthDate == null) {
    return NaN;
  }
  const yi = Math.trunc(y);
  const pd = Number(planDuration);
  const planEndY = getPlanEndCalendarYear(birthDate, planDuration);
  if (planEndY != null && Number.isFinite(pd) && pd > 0) {
    return Math.trunc(pd) - (planEndY - yi);
  }

  const hintY = Number(projectionInclusiveEndYear);
  const hintEnd = Number.isFinite(hintY) ? Math.trunc(hintY) : null;
  if (hintEnd != null && yi === hintEnd) {
    return getCompletedYearsAgeAtDate(birthDate, endOfCalendarYear(yi));
  }
  if (forecastStartDate) {
    const fs = new Date(forecastStartDate);
    if (!Number.isNaN(fs.getTime())) {
      const fsy = fs.getFullYear();
      const startAge = getCompletedYearsAgeAtDate(birthDate, fs);
      if (yi < fsy) {
        return startAge;
      }
      return startAge + (yi - fsy);
    }
  }
  return getCompletedYearsAgeAtDate(birthDate, endOfCalendarYear(yi));
}

/** Persisted/API age for a stored calendar year (plan-linear age; see {@link getProjectionColumnAgeLabel}). */
export function getPersistedAgeForCalendarYear(
  birthDate: Date | string | null | undefined,
  calendarYear: number | null | undefined,
  forecastStartDate?: Date | string | null,
  planDuration?: number | null,
  projectionInclusiveEndYear?: number | null,
): number {
  if (calendarYear == null || !Number.isFinite(Number(calendarYear))) {
    return 0;
  }
  const a = getProjectionColumnAgeLabel(
    birthDate,
    Number(calendarYear),
    forecastStartDate ?? undefined,
    planDuration,
    projectionInclusiveEndYear,
  );
  return Number.isNaN(a) ? 0 : a;
}
