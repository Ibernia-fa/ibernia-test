import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartSeries } from '../models/charts-series.model';
import { Client } from 'src/app/clients/models/client';

const EXCLUDED_SERIES = ['Current Account (Negative)', 'Emergency Expense'];

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calcAge(ref: Date, birth: Date): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const hasPassed =
    ref.getMonth() > birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() >= birth.getDate());
  if (!hasPassed) age--;
  return age;
}

interface SplitSeries {
  solidName: string;
  dashedName: string;
  solidData: (number | null)[];
  dashedData: (number | null)[];
}

function splitAtZeroCrossing(name: string, data: number[]): SplitSeries {
  const solidData: (number | null)[] = [];
  const dashedData: (number | null)[] = [];
  let crossedToNegative = false;

  for (let i = 0; i < data.length; i++) {
    if (!crossedToNegative) {
      solidData.push(data[i]);
      if (data[i] < 0) {
        crossedToNegative = true;
        dashedData.push(data[i]);
        if (i > 0) dashedData[i - 1] = data[i - 1];
      } else {
        dashedData.push(null);
      }
    } else {
      solidData.push(null);
      dashedData.push(data[i]);
    }
  }

  return {
    solidName: name,
    dashedName: `${name} (deficit)`,
    solidData,
    dashedData,
  };
}

@Component({
  selector: 'app-comparison-line-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './comparison-line-chart.component.html',
  styleUrl: './comparison-line-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonLineChartComponent implements OnChanges {
  @Input() report!: ChartSeries;
  @Input() compareReport!: ChartSeries;
  @Input() planAName = 'Plan A';
  @Input() planBName = 'Plan B';
  @Input() client!: Client;
  @Input() forecastStartDate: any;
  @Input() forecastEndDate: any;

  chartOptions: any = {
    series: [],
    chart: {
      type: 'line',
      height: 500,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    stroke: { width: [3, 3], dashArray: [0, 8], curve: 'smooth' },
    xaxis: { type: 'category', categories: [] },
    yaxis: {},
    tooltip: { enabled: true, shared: true, intersect: false },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: {
      show: true,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
  };

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.report?.series?.length || !this.compareReport?.series?.length) {
      return;
    }

    const planA = this.trimToEndYear(this.report);
    const planB = this.trimToEndYear(this.compareReport);
    if (!planA || !planB) return;

    const { categories, seriesA, seriesB } = this.alignAndSum(planA, planB);

    const currencyCode = this.client?.clientDetails?.preferredCurrency ?? '';
    const birthDate = toDate(this.client?.clientDetails?.birthDate);
    const forecastStart = toDate(this.forecastStartDate);
    const firstCatYear = categories.length ? Number(categories[0]) : null;

    const yearToAge = new Map<string, number>();
    if (birthDate) {
      categories.forEach((cat, i) => {
        const yr = Number(cat);
        if (!Number.isFinite(yr)) return;
        let age: number;
        if (i === 0 && forecastStart) {
          age = calcAge(forecastStart, birthDate);
        } else {
          age = calcAge(new Date(yr, 0, 1), birthDate);
        }
        if (age >= 0) yearToAge.set(cat, age);
      });
    }

    const categoriesRef = categories;

    const resolveYear = (value: any, index?: number): string => {
      const v = String(value);
      if (categoriesRef.includes(v)) return v;
      const idx = index != null ? index : Number(v) - 1;
      if (idx >= 0 && idx < categoriesRef.length) return categoriesRef[idx];
      return v;
    };

    const fmtCurrency = (value: number): string => {
      if (!Number.isFinite(value)) return String(value ?? '');
      if (!currencyCode || currencyCode.length !== 3) return value.toLocaleString();
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return value.toLocaleString();
      }
    };

    const planALabel = this.planAName || 'Plan A';
    const planBLabel = this.planBName || 'Plan B';

    const splitA = splitAtZeroCrossing(planALabel, seriesA);
    const splitB = splitAtZeroCrossing(planBLabel, seriesB);

    const planAColor = '#5D87FF';
    const planBColor = '#FA896B';

    const aHasDeficit = splitA.dashedData.some((v) => v !== null);
    const bHasDeficit = splitB.dashedData.some((v) => v !== null);

    const seriesList: any[] = [
      { name: splitA.solidName, data: splitA.solidData },
    ];
    const colors: string[] = [planAColor];
    const widths: number[] = [3];
    const dashes: number[] = [0];

    if (aHasDeficit) {
      seriesList.push({ name: splitA.dashedName, data: splitA.dashedData });
      colors.push(planAColor);
      widths.push(3);
      dashes.push(6);
    }

    seriesList.push({ name: splitB.solidName, data: splitB.solidData });
    colors.push(planBColor);
    widths.push(3);
    dashes.push(0);

    if (bHasDeficit) {
      seriesList.push({ name: splitB.dashedName, data: splitB.dashedData });
      colors.push(planBColor);
      widths.push(3);
      dashes.push(6);
    }

    const deficitSeriesNames = new Set<string>();
    if (aHasDeficit) deficitSeriesNames.add(splitA.dashedName);
    if (bHasDeficit) deficitSeriesNames.add(splitB.dashedName);

    this.chartOptions = {
      ...this.chartOptions,
      series: seriesList,
      stroke: { width: widths, dashArray: dashes, curve: 'smooth' as const },
      colors,
      xaxis: {
        type: 'category',
        categories,
        tickAmount: Math.max(1, Math.floor(categories.length / 5)),
        title: { text: 'Age', style: { fontWeight: 500 } },
        labels: {
          style: { cssClass: 'leftAlign' },
          formatter(value: string, _timestamp: any, opts: any) {
            const yearStr = resolveYear(value, opts?.i);
            const age = yearToAge.get(yearStr);
            return age != null ? String(age) : yearStr;
          },
        },
      },
      yaxis: {
        title: { text: currencyCode, style: { fontWeight: 500 } },
        labels: {
          formatter(value: any) {
            return value != null ? fmtCurrency(Number(value)) : '';
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        showForSingleSeries: true,
        customLegendItems: [planALabel, planBLabel],
        markers: { fillColors: [planAColor, planBColor] },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        custom(opts: any) {
          const { series, dataPointIndex, w } = opts;
          const cats: string[] = w.config.xaxis.categories ?? categoriesRef;
          const yearStr = cats[dataPointIndex] ?? String(dataPointIndex);
          const age = yearToAge.get(yearStr);

          const shown = new Map<string, { color: string; value: number }>();

          w.globals.seriesNames.forEach((name: string, i: number) => {
            const val = series[i]?.[dataPointIndex];
            if (val == null) return;
            const color = w.globals.colors[i];
            const baseName = deficitSeriesNames.has(name)
              ? name.replace(' (deficit)', '')
              : name;
            if (!shown.has(baseName) || val !== 0) {
              shown.set(baseName, { color, value: val });
            }
          });

          const rows = Array.from(shown.entries())
            .map(([name, { color, value }]) => {
              return `
                <div style="display:flex;align-items:center;gap:6px;padding:2px 0">
                  <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
                  <span>${name}:</span>
                  <strong>${fmtCurrency(value)}</strong>
                </div>`;
            })
            .join('');

          return `
            <div style="padding:8px 12px;font-size:13px">
              <div style="font-weight:600;margin-bottom:4px">Age: ${age ?? '–'}  |  Year: ${yearStr}</div>
              ${rows}
            </div>`;
        },
      },
    };
  }

  private alignAndSum(
    planA: ChartSeries,
    planB: ChartSeries
  ): { categories: string[]; seriesA: number[]; seriesB: number[] } {
    const allYears = [
      ...new Set([...planA.categories, ...planB.categories]),
    ].sort((a, b) => Number(a) - Number(b));

    const sumA = this.sumSeries(planA);
    const sumB = this.sumSeries(planB);

    const mapA = new Map(planA.categories.map((c, i) => [c, sumA[i] ?? 0]));
    const mapB = new Map(planB.categories.map((c, i) => [c, sumB[i] ?? 0]));

    const categories: string[] = [];
    const seriesA: number[] = [];
    const seriesB: number[] = [];

    for (const year of allYears) {
      categories.push(year);
      seriesA.push(mapA.get(year) ?? 0);
      seriesB.push(mapB.get(year) ?? 0);
    }

    return { categories, seriesA, seriesB };
  }

  private sumSeries(report: ChartSeries): number[] {
    const validSeries = report.series.filter(
      (s) => !EXCLUDED_SERIES.includes(s.name)
    );
    if (!validSeries.length) return [];

    const len = validSeries[0].data.length;
    const totals = new Array<number>(len).fill(0);

    for (const s of validSeries) {
      for (let i = 0; i < len; i++) {
        totals[i] += s.data[i] ?? 0;
      }
    }
    return totals;
  }

  private trimToEndYear(report: ChartSeries): ChartSeries | null {
    if (!report?.categories?.length || !this.forecastEndDate) return report;
    const endDate = toDate(this.forecastEndDate);
    if (!endDate) return report;
    const endYear = endDate.getFullYear();
    const indices: number[] = [];
    report.categories.forEach((cat, i) => {
      const y = Number(cat);
      if (Number.isFinite(y) && y <= endYear) indices.push(i);
    });
    if (indices.length === report.categories.length) return report;
    return {
      ...report,
      categories: indices.map((i) => report.categories[i]),
      series: report.series.map((s) => ({
        ...s,
        data: indices.map((i) => s.data[i] ?? 0),
      })),
      timelineEvents: (report.timelineEvents ?? []).filter(
        (e) => Number.isFinite(e.startYear) && e.startYear <= endYear
      ),
    };
  }
}
