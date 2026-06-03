/**
 * Pure helpers for Ibernia fund transaction line items (contributions / withdrawals).
 * Shared by k6/cashflows-finances and volume seed — no k6/http imports.
 */

/** Matches Ibernia `AmountCycleConst` / dev AmountCycle seed. */
export const AMOUNT_CYCLE_DESCRIPTION = Object.freeze({
  ONE_OFF: 'One-off',
  MONTHLY: 'Every month',
  YEARLY: 'Every year',
});

export function resolveFundTransactionAmountCycle(p, startYear, endYear, startAge, endAge) {
  if (p.cycleDescription != null && String(p.cycleDescription).trim() !== '') {
    return {
      id: p.cycleId != null ? String(p.cycleId) : '',
      description: String(p.cycleDescription).trim(),
    };
  }
  if (p.amountCycle && typeof p.amountCycle === 'object') {
    const cycle = Object.assign({}, p.amountCycle);
    if (cycle.description == null && cycle.Description != null) {
      cycle.description = cycle.Description;
    }
    if (cycle.description != null && String(cycle.description).trim() !== '') {
      return {
        id: cycle.id != null ? String(cycle.id) : '',
        description: String(cycle.description).trim(),
      };
    }
  }
  if (startYear === endYear && startAge === endAge) {
    return { id: '', description: AMOUNT_CYCLE_DESCRIPTION.ONE_OFF };
  }
  if (Number(p.contributionType) === 2) {
    return { id: '', description: AMOUNT_CYCLE_DESCRIPTION.YEARLY };
  }
  return { id: '', description: AMOUNT_CYCLE_DESCRIPTION.MONTHLY };
}

/** Minimal **FundTransactionLineItem** body for POST …/funds/contributions|withdrawals. */
export function buildMinimalFundTransactionLineItem(p) {
  const desc = p.description;
  const amountVal = p.amount != null ? p.amount : 500;
  const startAge = p.startAge != null ? p.startAge : 30;
  const startYear = p.startYear != null ? p.startYear : new Date().getFullYear();
  const endAge = p.endAge != null ? p.endAge : 65;
  const endYear = p.endYear != null ? p.endYear : startYear + 35;
  const cycle = resolveFundTransactionAmountCycle(p, startYear, endYear, startAge, endAge);
  const line = {
    description: desc,
    amount: { amount: amountVal, currencySymbol: '€', cycle },
    start: { age: startAge, year: startYear },
    end: { age: endAge, year: endYear },
    contributionType: p.contributionType != null ? p.contributionType : 1,
  };
  if (p.id != null && String(p.id).trim() !== '') {
    line.id = String(p.id).trim();
  }
  if (p.associatedSavingPotId != null && String(p.associatedSavingPotId).trim() !== '') {
    line.associatedSavingPotId = String(p.associatedSavingPotId).trim();
  }
  return line;
}
