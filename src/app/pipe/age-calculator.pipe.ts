import { Pipe, PipeTransform } from '@angular/core';
import { getCompletedYearsAgeAtDate } from 'src/app/shared/utils/client-age-at-reference';

@Pipe({
  name: 'ageCalculator'
})
export class AgeCalculatorPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    if (!value) return 'Invalid date';

    const birthDate = new Date(value);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
      return 'Invalid date';
    }

    const age = getCompletedYearsAgeAtDate(birthDate, today);
    return Number.isNaN(age) ? 'Invalid date' : `${age}`;
  }
}
