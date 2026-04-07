import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatAppDisplayNumber } from 'src/app/shared/utils/number-utils';

@Pipe({
  name: 'thousandSeparator',
  standalone: true,
  pure: false
})
export class ThousandSeparatorPipe implements PipeTransform {
    constructor(private translate: TranslateService) {}


  transform(value: number | string): string {
    if (value === null || value === undefined || value === '') return '';
    
    const raw = typeof value === 'string'
      ? value.replace(/\./g, '').replace(',', '.')
      : value;

    const num = Number(raw);
    if (isNaN(num)) return String(value);

    return formatAppDisplayNumber(this.translate.currentLang, num);
  }
}
