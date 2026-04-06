/**
 * Single source of truth for turning API income descriptions into UI labels
 * before i18n (translateIncomeExpenseLabelPipe).
 *
 * API uses canonical English: "Salary", "Salary (Partner)", "State pension", "State pension (Partner)".
 * With a partner, the UI must show real first names, never a generic "(Partner)" label.
 */

export interface IncomeDisplayLabelContext {
  hasPartner: boolean;
  clientFirstName: string;
  partnerFirstName: string;
}

/** Case/whitespace-tolerant match for API partner salary. */
export function isPartnerSalaryApiDescription(
  desc: string | null | undefined,
): boolean {
  return /^salary\s*\(\s*partner\s*\)$/i.test((desc ?? '').trim());
}

/** Case/whitespace-tolerant match for API partner state pension. */
export function isPartnerStatePensionApiDescription(
  desc: string | null | undefined,
): boolean {
  return /^state pension\s*\(\s*partner\s*\)$/i.test((desc ?? '').trim());
}

export function isClientSalaryApiDescription(
  desc: string | null | undefined,
): boolean {
  return (desc ?? '').trim() === 'Salary';
}

export function isClientStatePensionApiDescription(
  desc: string | null | undefined,
): boolean {
  return (desc ?? '').trim() === 'State pension';
}

/** Salary rows that support bonus in the UI (client, partner, or already-named). */
export function isSalaryTypeForBonus(
  desc: string | null | undefined,
): boolean {
  const d = (desc ?? '').trim();
  if (!d) return false;
  if (d === 'Salary' || isPartnerSalaryApiDescription(d)) return true;
  return /^salary\s+\S+/i.test(d);
}

/**
 * Maps API description to the English string passed into translateIncomeExpenseLabel.
 * When there is no partner, canonical types are returned unchanged.
 */
export function incomeApiDescriptionToDisplayLabel(
  apiDescription: string | null | undefined,
  ctx: IncomeDisplayLabelContext,
): string {
  const d = (apiDescription ?? '').trim();
  if (!d) return '';

  if (!ctx.hasPartner) {
    return d;
  }

  const c = ctx.clientFirstName || 'Client';
  const p = ctx.partnerFirstName || 'Partner';

  if (isPartnerSalaryApiDescription(d)) {
    return `Salary ${p}`;
  }
  if (isPartnerStatePensionApiDescription(d)) {
    return `State pension ${p}`;
  }

  if (d === 'Salary') {
    return `Salary ${c}`;
  }
  if (d === 'State pension') {
    return `State pension ${c}`;
  }

  const salaryNamed = /^Salary\s+(.+)$/i.exec(d);
  if (salaryNamed) {
    const namePart = salaryNamed[1].trim();
    if (/^partner$/i.test(namePart)) {
      return `Salary ${p}`;
    }
    if (/^client$/i.test(namePart)) {
      return `Salary ${c}`;
    }
    return d;
  }

  const pensionNamed = /^State pension\s+(.+)$/i.exec(d);
  if (pensionNamed) {
    const namePart = pensionNamed[1].trim();
    if (/^partner$/i.test(namePart)) {
      return `State pension ${p}`;
    }
    if (/^client$/i.test(namePart)) {
      return `State pension ${c}`;
    }
    return d;
  }

  return d;
}
