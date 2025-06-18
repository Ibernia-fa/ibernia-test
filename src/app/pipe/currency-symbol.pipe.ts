import { Pipe, PipeTransform } from '@angular/core';
import { allCountries } from '../clients/models/country'; // Update this path as needed

@Pipe({
  name: 'currencySymbol'
})
export class CurrencySymbolPipe implements PipeTransform {
transform(code: string | undefined): string {
  if (!code) return '';
  const country = allCountries.find(c => c.currencySymbol === code);
  return country?.symbol || code;
}

}
