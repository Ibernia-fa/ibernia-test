import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Localizes escalation rate option labels from the API (English canonical descriptions).
 * Keeps internal `description` strings English for saves; use only for display.
 */
@Pipe({
  name: 'translateEscalationDescription',
  standalone: true,
  pure: false,
})
export class TranslateEscalationDescriptionPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(description: string | null | undefined): string {
    if (description == null || description === '') {
      return '';
    }
    const d = description.trim();

    if (d === 'Increases at custom rate') {
      return this.translate.instant('Increases at custom rate');
    }
    if (d === "Doesn't increase with inflation") {
      return this.translate.instant("Doesn't increase with inflation");
    }

    const m = /^Increases at (?:the )?same rate as inflation \(([\d.]+%)\)$/i.exec(
      d,
    );
    if (m) {
      const rateNum = m[1].replace(/%$/, '');
      return this.translate.instant('ESCALATION.MATCH_INFLATION', {
        rate: rateNum,
      });
    }

    return d;
  }
}
