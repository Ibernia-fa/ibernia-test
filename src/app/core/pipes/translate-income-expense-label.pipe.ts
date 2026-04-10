import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  IncomeDisplayLabelContext,
  incomeApiDescriptionToDisplayLabel,
} from 'src/app/shared/utils/income-display-label';

/**
 * Localizes default income/expense descriptions from the API (English canonical strings)
 * and composed titles such as "Salary Matteo" or "State pension Luisa".
 * Custom user-entered descriptions are passed through translate.instant (no key → unchanged).
 *
 * Optional `ctx` resolves client/partner salary and pension labels when a plan has a partner
 * (see incomeApiDescriptionToDisplayLabel).
 */
@Pipe({
  name: 'translateIncomeExpenseLabel',
  standalone: true,
  pure: false,
})
export class TranslateIncomeExpenseLabelPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(
    description: string | null | undefined,
    ctx?: IncomeDisplayLabelContext | null,
  ): string {
    if (description == null || description === '') {
      return '';
    }
    const d = ctx
      ? incomeApiDescriptionToDisplayLabel(description, ctx)
      : description.trim();

    if (d === 'Salary (Partner)') {
      return this.translate.instant('Salary (Partner)');
    }
    if (d === 'State pension (Partner)') {
      return this.translate.instant('State pension (Partner)');
    }
    if (d === 'Inheritance (Partner)') {
      return this.translate.instant('Inheritance (Partner)');
    }

    const salaryWithName = /^Salary (.+)$/.exec(d);
    if (salaryWithName) {
      const name = this.localizePlaceholderName(salaryWithName[1]);
      return this.translate.instant('INCOME_EXPENSE_LABEL.SALARY_WITH_NAME', {
        name,
      });
    }

    const pensionWithName = /^State pension (.+)$/.exec(d);
    if (pensionWithName) {
      const name = this.localizePlaceholderName(pensionWithName[1]);
      return this.translate.instant(
        'INCOME_EXPENSE_LABEL.STATE_PENSION_WITH_NAME',
        { name },
      );
    }

    const inheritanceWithName = /^Inheritance (.+)$/.exec(d);
    if (inheritanceWithName) {
      const name = this.localizePlaceholderName(inheritanceWithName[1]);
      return this.translate.instant(
        'INCOME_EXPENSE_LABEL.INHERITANCE_WITH_NAME',
        { name },
      );
    }

    return this.translate.instant(d);
  }

  private localizePlaceholderName(name: string): string {
    if (name === 'Client') {
      return this.translate.instant('INCOME_EXPENSE_LABEL.PLACEHOLDER_CLIENT');
    }
    if (name === 'Partner') {
      return this.translate.instant('INCOME_EXPENSE_LABEL.PLACEHOLDER_PARTNER');
    }
    return name;
  }
}
