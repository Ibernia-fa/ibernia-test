import { Pipe, PipeTransform } from '@angular/core';

/** Uppercases the first character; leaves the rest unchanged (trimmed). */
@Pipe({ name: 'capitalizeFirst', standalone: true })
export class CapitalizeFirstPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (value == null) return '';
    const s = String(value).trim();
    if (!s) return '';
    return s.charAt(0).toLocaleUpperCase() + s.slice(1);
  }
}
