import { FormControl, ValidationErrors } from '@angular/forms';
import { getCompletedYearsAgeAtDate } from 'src/app/shared/utils/client-age-at-reference';

export const CLIENT_DOB_MAX_AGE = 120;

export function onlyDigits(s: string | Date | null | undefined): string {
  if (!s) return '';
  if (s instanceof Date) {
    const dd = pad2(s.getDate());
    const mm = pad2(s.getMonth() + 1);
    const yyyy = s.getFullYear();
    return `${dd}${mm}${yyyy}`;
  }
  return String(s).replace(/\D/g, '').slice(0, 8);
}

export function formatDigitsToDMY(digits: string): string {
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return [d, m, y].filter(Boolean).join('/');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function normalizeToDMY(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function parseDMYFromDigits(
  digits: string
):
  | { ok: true; date: Date; age: number; normalized: string }
  | { ok: false; error: string } {
  if (digits.length !== 8)
    return { ok: false, error: 'Please enter 8 digits (DDMMYYYY)' };

  const dd = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const yyyy = Number(digits.slice(4, 8));

  if (mm < 1 || mm > 12) return { ok: false, error: 'Month must be 01–12' };
  if (dd < 1 || dd > 31) return { ok: false, error: 'Day must be 01–31' };
  if (yyyy < 1800 || yyyy > 9999)
    return { ok: false, error: 'Year looks invalid' };

  const date = new Date(yyyy, mm - 1, dd);
  const isReal =
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd;

  if (!isReal) return { ok: false, error: "That date doesn't exist" };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date > today)
    return { ok: false, error: 'Date cannot be in the future' };

  let age = today.getFullYear() - yyyy;
  const hadBirthdayThisYear =
    today.getMonth() > mm - 1 ||
    (today.getMonth() === mm - 1 && today.getDate() >= dd);
  if (!hadBirthdayThisYear) age -= 1;

  if (age < 0) return { ok: false, error: 'Date cannot be in the future' };
  if (age > CLIENT_DOB_MAX_AGE)
    return { ok: false, error: `Age must be ≤ ${CLIENT_DOB_MAX_AGE}` };

  return { ok: true, date, age, normalized: normalizeToDMY(date) };
}

export function clientDobValidator(
  ctrl: FormControl<string | Date | null>
): ValidationErrors | null {
  const raw = ctrl.value;

  if (raw instanceof Date) {
    const age = getCompletedYearsAgeAtDate(raw, new Date());
    if (age < 0) return { dob: 'Date cannot be in the future' };
    if (age > CLIENT_DOB_MAX_AGE)
      return { dob: `Age must be ≤ ${CLIENT_DOB_MAX_AGE}` };
    return null;
  }

  if (!raw) return null;

  const digits = onlyDigits(raw);
  if (!digits) return null;
  const parsed = parseDMYFromDigits(digits);
  return parsed.ok ? null : { dob: parsed.error };
}
