import { EscalationRate } from '../../financial-workflow/timeline/models/financial-timeline';

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
        description: `Increases at same rate as inflation (${formatted}%)`,
      };
    }
    return rate;
  });
}
