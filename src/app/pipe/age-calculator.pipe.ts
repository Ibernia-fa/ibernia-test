import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ageCalculator'
})
export class AgeCalculatorPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    if (!value) return 'Invalid date';

    const birthDate = new Date(value);
    const today = new Date();

    // Check for invalid dates
    if (isNaN(birthDate.getTime())) {
      return 'Invalid date';
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birth month/day is in the future
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return `${age}`;
  }
}
