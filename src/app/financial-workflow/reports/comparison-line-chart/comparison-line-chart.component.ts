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
import moment from 'moment';

const EXCLUDED_SERIES = ['Current Account (Negative)', 'Emergency Expense'];

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
  @Input() forecastStartDate!: Date;
  @Input() forecastEndDate!: Date;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.report?.series?.length || !this.compareReport?.series?.length) {
      return;
    }

    const planA = this.trimToEndYear(this.report);
    const planB = this.trimToEndYear(this.compareReport);
    if (!planA || !planB) return;

    const { categories, seriesA, seriesB } = this.alignAndSum(planA, planB);

    const currency = this.client?.clientDetails?.preferredCurrency ?? '';
    const forecastStart = this.forecastStartDate;

    const firstYear = categories.length ? Number(categories[0]) : null;

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        { name: this.planAName || 'Plan A', data: seriesA },
        { name: this.planBName || 'Plan B', data: seriesB },
      ],
      stroke: { width: [3, 3], dashArray: [0, 8], curve: 'smooth' },
      colors: ['#5D87FF', '#FA896B'],
      xaxis: {
        type: 'category',
        categories,
        tickAmount: Math.max(1, Math.floor(categories.length / 5)),
        title: { text: 'Age', style: { fontWeight: 500 } },
        labels: {
          style: { cssClass: 'leftAlign' },
          formatter: (value: string) => {
            const year = Number(value);
            const age = this.getDisplayAge(year, firstYear);
            return age !== null ? String(age) : value;
          },
        },
      },
      yaxis: {
        title: { text: currency, style: { fontWeight: 500 } },
        labels: {
          formatter: (value: any) =>
            value != null ? this.formatCurrency(Number(value)) : '',
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        custom: (opts: any) => {
          const { series, dataPointIndex, w } = opts;
          const year = w.globals.labels[dataPointIndex];
          const age = this.getDisplayAge(Number(year), firstYear);

          const rows = w.globals.seriesNames
            .map((name: string, i: number) => {
              const val = series[i]?.[dataPointIndex];
              if (val === undefined) return '';
              const color = w.globals.colors[i];
              const formatted = this.formatCurrency(val);
              return `
                <div style="display:flex;align-items:center;gap:6px;padding:2px 0">
                  <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
                  <span>${name}:</span>
                  <strong>${formatted}</strong>
                </div>`;
            })
            .filter(Boolean)
            .join('');

          return `
            <div style="padding:8px 12px;font-size:13px">
              <div style="font-weight:600;margin-bottom:4px">Age: ${age ?? '–'}  |  Year: ${year}</div>
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
    const catSetA = new Set(planA.categories);
    const catSetB = new Set(planB.categories);
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

  private trimToEndYear(
    report: ChartSeries
  ): ChartSeries | null {
    if (!report?.categories?.length || !this.forecastEndDate) return report;
    const endYear = moment(this.forecastEndDate).year();
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

  private getDisplayAge(year: number, firstYear: number | null): number | null {
    const raw = this.client?.clientDetails?.birthDate;
    if (!raw || !Number.isFinite(year)) return null;
    const birthDate = new Date(raw);
    if (Number.isNaN(birthDate.getTime())) return null;

    if (firstYear != null && year === firstYear && this.forecastStartDate) {
      return this.ageAtDate(this.forecastStartDate, birthDate);
    }
    return this.ageAtDate(new Date(year, 0, 1), birthDate);
  }

  private ageAtDate(ref: Date, birth: Date): number {
    let age = ref.getFullYear() - birth.getFullYear();
    const hasPassed =
      ref.getMonth() > birth.getMonth() ||
      (ref.getMonth() === birth.getMonth() && ref.getDate() >= birth.getDate());
    if (!hasPassed) age--;
    return age;
  }

  private formatCurrency(value: number): string {
    if (!Number.isFinite(value)) return String(value ?? '');
    const code = this.client?.clientDetails?.preferredCurrency;
    if (!code || code.length !== 3) return value.toLocaleString();
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return value.toLocaleString();
    }
  }
}
