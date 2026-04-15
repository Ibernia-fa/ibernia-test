import { EscalationRate } from '../../financial-workflow/timeline/models/financial-timeline';

/** Canonical API description for user-defined yearly % (list may include a placeholder row with value 0). */
export const ESCALATION_CUSTOM_DESCRIPTION = 'Increases at custom rate';

function normEscalationValue(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}

/** Prefer value+description, then description, then singleton-by-value (avoids duplicate 0). */
export function resolveEscalationMatch(
  rates: EscalationRate[],
  saved:
    | { value?: string | number | null; description?: string | null }
    | null
    | undefined,
): EscalationRate | undefined {
  if (!saved || !rates?.length) return undefined;
  const sv = normEscalationValue(saved.value);
  const byBoth = rates.find(
    (r) =>
      normEscalationValue(r.value) === sv &&
      r.description === saved.description,
  );
  if (byBoth) return byBoth;
  if (saved.description) {
    const byDesc = rates.find((r) => r.description === saved.description);
    if (byDesc) {
      // Do not treat saved custom % as matching the dropdown template row (value 0).
      if (
        saved.description === ESCALATION_CUSTOM_DESCRIPTION &&
        sv != null &&
        normEscalationValue(byDesc.value) !== sv
      ) {
        return undefined;
      }
      return byDesc;
    }
  }
  if (sv != null) {
    const same = rates.filter((r) => normEscalationValue(r.value) === sv);
    if (same.length === 1) return same[0];
  }
  return undefined;
}

export function patchInflationRateDescription(
  rates: EscalationRate[],
  inflationRate: number
): EscalationRate[] {
  if (!rates || rates.length === 0) return rates;

  return rates.map(rate => {
    if (
      rate.description &&
      rate.description.toLowerCase().includes('same rate as inflation')
    ) {
      const formatted = Number.isInteger(inflationRate)
        ? `${inflationRate}.0`
        : `${inflationRate}`;
      return {
        ...rate,
        value: String(inflationRate),
        description: `Increases at same rate as inflation (${formatted}%)`,
      };
    }
    return rate;
  });
}
