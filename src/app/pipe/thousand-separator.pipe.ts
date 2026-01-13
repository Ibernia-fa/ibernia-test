import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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

    const locale = this.translate.currentLang === 'it'
      ? 'it-IT'
      : 'en-US';

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  }
}
