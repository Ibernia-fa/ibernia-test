import { FinancialViewModel } from 'src/app/financial-workflow/income-expenses/model/income-expense';
import {
  isClientStatePensionApiDescription,
  isPartnerStatePensionApiDescription,
} from 'src/app/shared/utils/income-display-label';

/**
 * Salary row paired with a State pension line (client vs partner), for prefill and % of salary hints.
 * Uses base salary only — same rule as pension replacement prefill (not bonus / other incomes).
 */
export function findSalaryIncomeForStatePensionRow(
  incomes: FinancialViewModel[] | null | undefined,
  statePensionApiDescription: string | null | undefined,
): FinancialViewModel | undefined {
  if (
    !isClientStatePensionApiDescription(statePensionApiDescription) &&
    !isPartnerStatePensionApiDescription(statePensionApiDescription)
  ) {
    return undefined;
  }
  const salaryDesc = isPartnerStatePensionApiDescription(statePensionApiDescription)
    ? 'Salary (Partner)'
    : 'Salary';
  return (incomes ?? []).find((i) => (i?.description ?? '') === salaryDesc);
}

/**
 * Converts a recurring income amount to an annual figure using canonical cycle descriptions.
 * Returns null for One-off or unknown cycles so callers avoid misleading comparisons.
 */
export function annualEquivalentForIncomeCycle(
  amount: number,
  cycleDescription: string | null | undefined,
): number | null {
  const d = (cycleDescription ?? '').trim().toLowerCase();
  if (!Number.isFinite(amount) || !(amount > 0)) return null;
  if (d === 'every month') return amount * 12;
  if (d === 'every year') return amount;
  return null;
}

export function roundPercentOf(numerator: number, denominator: number): number | null {
  if (!(denominator > 0) || !Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  return Math.round((numerator / denominator) * 100);
}
