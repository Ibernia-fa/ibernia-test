import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Rejects empty, null, undefined, and numeric 0 (Angular's Validators.required treats 0 as valid).
 * Allows timeline references like `event:…` and positive calendar years.
 */
export function calendarYearOrEventRefValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined || v === '') {
      return { required: true };
    }
    if (typeof v === 'string' && v.trim().startsWith('event:')) {
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      return { invalidYear: true };
    }
    return null;
  };
}
