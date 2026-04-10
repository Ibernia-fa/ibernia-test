/** Minimal report shape for year-slicing (compatible with workflow + client-report ChartSeries). */
export type SliceableChartReport = {
  categories: string[];
  series: Array<{ data: number[] }>;
  timelineEvents?: Array<{ startYear: number }>;
};

/** Numeric years present in report categories (chart x-axis). */
export function parseReportCategoryYears(
  categories: string[] | undefined,
): number[] {
  if (!categories?.length) return [];
  return categories
    .map((c) => Number(c))
    .filter((y) => Number.isFinite(y))
    .map((y) => Math.trunc(y));
}

export function getReportYearBounds(
  categories: string[] | undefined,
): { min: number; max: number } | null {
  const years = parseReportCategoryYears(categories);
  if (!years.length) return null;
  return { min: Math.min(...years), max: Math.max(...years) };
}

/**
 * Keeps only categories / series points / timeline markers within
 * [minYear, maxYear] inclusive. No-op if the slice covers the full report.
 */
export function sliceChartSeriesToInclusiveYearRange<
  T extends SliceableChartReport,
>(report: T, minYear: number, maxYear: number): T {
  const lo = Math.min(Math.trunc(minYear), Math.trunc(maxYear));
  const hi = Math.max(Math.trunc(minYear), Math.trunc(maxYear));
  const indices: number[] = [];
  report.categories.forEach((cat, i) => {
    const y = Number(cat);
    if (Number.isFinite(y) && Math.trunc(y) >= lo && Math.trunc(y) <= hi) {
      indices.push(i);
    }
  });
  if (indices.length === report.categories.length) return report;
  if (!indices.length) {
    return {
      ...(report as object),
      categories: [],
      series: report.series.map((s) => ({ ...s, data: [] })),
      timelineEvents: [],
    } as unknown as T;
  }
  return {
    ...(report as object),
    categories: indices.map((i) => report.categories[i]),
    series: report.series.map((s) => ({
      ...s,
      data: indices.map((i) => s.data[i] ?? 0),
    })),
    timelineEvents: (report.timelineEvents ?? []).filter(
      (e) =>
        Number.isFinite(e.startYear) &&
        Math.trunc(e.startYear as number) >= lo &&
        Math.trunc(e.startYear as number) <= hi,
    ),
  } as unknown as T;
}
