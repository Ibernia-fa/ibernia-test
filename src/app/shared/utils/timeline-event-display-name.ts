import { TranslateService } from '@ngx-translate/core';
import {
  IncomeDisplayLabelContext,
  incomeApiDescriptionToDisplayLabel,
  isClientInheritanceApiDescription,
  isPartnerInheritanceApiDescription,
} from './income-display-label';

function localizeIncomeExpensePlaceholderName(
  translate: TranslateService,
  name: string,
): string {
  if (name === 'Client') {
    return translate.instant('INCOME_EXPENSE_LABEL.PLACEHOLDER_CLIENT');
  }
  if (name === 'Partner') {
    return translate.instant('INCOME_EXPENSE_LABEL.PLACEHOLDER_PARTNER');
  }
  return name;
}

/**
 * Localized label for a timeline event on charts (e.g. stacked savings bar).
 * API sends English composite names such as "Retirement Age Matteo"; ngx-translate
 * only has keys for the base phrase ("Retirement age"), so we translate the base
 * and preserve the person suffix.
 *
 * When `incomeLabelCtx` is set, canonical inheritance income descriptions use the
 * same client/partner naming as the income list (joint / couple plans).
 */
export function translateTimelineEventDisplayName(
  translate: TranslateService,
  rawName: string,
  incomeLabelCtx?: IncomeDisplayLabelContext | null,
): string {
  const trimmed = (rawName ?? '').trim();
  if (!trimmed) return '';

  if (
    incomeLabelCtx &&
    (isClientInheritanceApiDescription(trimmed) ||
      isPartnerInheritanceApiDescription(trimmed))
  ) {
    const d = incomeApiDescriptionToDisplayLabel(trimmed, incomeLabelCtx);
    if (d === 'Inheritance (Partner)') {
      return translate.instant('Inheritance (Partner)');
    }
    const inheritanceWithName = /^Inheritance (.+)$/.exec(d);
    if (inheritanceWithName) {
      const name = localizeIncomeExpensePlaceholderName(
        translate,
        inheritanceWithName[1].trim(),
      );
      return translate.instant('INCOME_EXPENSE_LABEL.INHERITANCE_WITH_NAME', {
        name,
      });
    }
    return translate.instant(trimmed);
  }

  if (!trimmed.toLowerCase().startsWith('retirement age')) {
    const t = translate.instant(trimmed);
    return t !== trimmed ? t : trimmed;
  }

  const base = translate.instant('Retirement age');
  const rest = trimmed.replace(/^retirement age\s*/i, '').trim();
  if (!rest) {
    return base;
  }

  if (rest.toLowerCase() === '(partner)') {
    const partner = translate.instant('Partner');
    return `${base} (${partner})`;
  }

  // Italian reads more naturally with a connector ("di") when a person name follows.
  if ((translate.currentLang ?? '').toLowerCase().startsWith('it')) {
    return `${base} di ${rest}`;
  }

  return `${base} ${rest}`;
}
