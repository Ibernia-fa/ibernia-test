import { Series } from 'src/app/financial-workflow/reports/models/charts-series.model';

const TRANSPARENT_SERIES = new Set([
  'Current Account (Negative)',
  'Emergency Expense',
]);

/** Extra hues when API sends duplicate hexes (aligned with backend palette spirit). */
const FALLBACK_PALETTE = [
  '#009E60',
  '#6CDD9D',
  '#2BAF9E',
  '#7FE7CC',
  '#588E78',
  '#9DD510',
  '#D4A017',
  '#C4A35A',
  '#A67C52',
  '#5DADE2',
  '#BB8FCE',
  '#F8B739',
  '#1ABC9C',
  '#3498DB',
  '#9B59B6',
  '#E67E22',
  '#16A085',
];

function normColor(c: string): string {
  return c.replace(/\s/g, '').toLowerCase();
}

function pickReplacement(used: Set<string>, attempt: number): string {
  for (let i = 0; i < FALLBACK_PALETTE.length * 3; i++) {
    const p = FALLBACK_PALETTE[(i + attempt) % FALLBACK_PALETTE.length];
    const k = normColor(p);
    if (!used.has(k)) return p;
  }
  const hue = (attempt * 47 + 137) % 360;
  const c = `hsl(${hue}, 52%, 42%)`;
  if (!used.has(normColor(c))) return c;
  return `hsl(${(hue + 23) % 360}, 55%, 38%)`;
}

function isCashSeries(s: Series): boolean {
  return (s.name ?? '').trim().toLowerCase() === 'cash';
}

/**
 * Ensures each non-cash saving pot gets a distinct colour for stacked chart legend and tooltips.
 * Cash series share one canonical colour (first resolved cash colour). Synthetic series unchanged.
 */
export function ensureUniqueSavingsChartSeriesColors(
  series: Series[],
): Series[] {
  const nonCashUsed = new Set<string>();
  let canonicalCashColor: string | null = null;

  return series.map((s) => {
    const out: Series = { ...s };

    if (TRANSPARENT_SERIES.has(s.name)) {
      return out;
    }

    let c = out.color;
    if (!c || c === 'transparent') {
      return out;
    }

    if (isCashSeries(s)) {
      if (canonicalCashColor === null) {
        let candidate = c;
        let attempt = 0;
        while (nonCashUsed.has(normColor(candidate)) && attempt < 200) {
          candidate = pickReplacement(nonCashUsed, attempt++);
        }
        canonicalCashColor = candidate;
        nonCashUsed.add(normColor(canonicalCashColor));
      }
      out.color = canonicalCashColor;
      return out;
    }

    let attempt = 0;
    while (nonCashUsed.has(normColor(c)) && attempt < 200) {
      c = pickReplacement(nonCashUsed, attempt++);
    }
    nonCashUsed.add(normColor(c));
    out.color = c;
    return out;
  });
}
