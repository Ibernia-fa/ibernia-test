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
 * Uses the same **plan model** as cashflow `planDuration`: timeline/report end year is
 * {@link getPlanEndCalendarYear} `(birth, planDuration)`. Between first and last year,
 * `age = ageAtForecastStart + (calendarYear - forecastStartCalendarYear)` and
 * `ageAtForecastStart` = {@link getCompletedYearsAgeAtDate} at `forecastStartDate`.
 * So the first year matches age at forecast start and the last year matches the target
 * end age (e.g. 90 in the year `birthYear + 90`).
 *
 * When `planDuration` is set, the **last** plan year is {@link getPlanEndCalendarYear};
 * for that year we use completed age at end of that calendar year so it matches the
 * target life age (e.g. 90 in year `birthYear + 90`), not the linear step (which can be 89).
 *
 * {@link projectionInclusiveEndYear} when it **equals** `calendarYear` triggers the same EOY
 * rule for that column (e.g. joint timeline ends in the primary client’s last year so the
 * partner’s age in that year matches end-of-year completed age, not a linear carry).
 *
 * If `forecastStartDate` is missing, falls back to completed age at end of `calendarYear`.
 */
export function getProjectionColumnAgeLabel(
  birthDate: Date | string | null | undefined,
  calendarYear: number,
  forecastStartDate?: Date | string | null,
  planDuration?: number | null,
  /**
   * Inclusive last calendar year of this dialog/chart’s year range. Used when it equals
   * `calendarYear` for EOY age (and when `planDuration` yields no plan end year, as before).
   */
  projectionInclusiveEndYear?: number | null,
): number {
  const y = Number(calendarYear);
  if (!Number.isFinite(y) || birthDate == null) {
    return NaN;
  }
  const yi = Math.trunc(y);
  const planEndY = getPlanEndCalendarYear(birthDate, planDuration);
  const hintY = Number(projectionInclusiveEndYear);
  const hintEnd = Number.isFinite(hintY) ? Math.trunc(hintY) : null;
  if (planEndY != null && yi === Math.trunc(planEndY)) {
    return getCompletedYearsAgeAtDate(birthDate, endOfCalendarYear(yi));
  }
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
