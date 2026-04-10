import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ChartSeries } from '../models/charts-series.model';
import { Client } from 'src/app/clients/models/client';
import { getProjectionColumnAgeLabel } from 'src/app/shared/utils/client-age-at-reference';
import { sliceChartSeriesToInclusiveYearRange } from 'src/app/shared/utils/chart-series-year-range';

const EXCLUDED_SERIES = ['Current Account (Negative)', 'Emergency Expense'];

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface SplitSeries {
  solidName: string;
  dashedName: string;
  solidData: (number | null)[];
  dashedData: (number | null)[];
}

/**
 * Splits one net-worth line into solid (non-negative) and dashed (negative) segments.
 * Style follows the value at each age: if the line dips below zero and later recovers,
 * the positive stretch is solid again; only negative Y values use dashes.
 */
function splitAtZeroCrossing(name: string, data: number[]): SplitSeries {
  const solidData: (number | null)[] = [];
  const dashedData: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (v >= 0) {
      solidData.push(v);
      dashedData.push(null);
    } else {
      solidData.push(null);
      dashedData.push(v);
      // Bridge so the dashed segment connects to the last non-negative point (smooth curve)
      if (i > 0 && data[i - 1] >= 0) {
        dashedData[i - 1] = data[i - 1];
      }
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
export class ComparisonLineChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('chart', { read: ElementRef })
  chartElRef: ElementRef<HTMLDivElement>;
  @ViewChild(ChartComponent) apxChartComponent: ChartComponent | undefined;
  @Input() report!: ChartSeries;
  @Input() compareReport!: ChartSeries;
  @Input() planAName = 'Plan A';
  @Input() planBName = 'Plan B';
  @Input() client!: Client;
  @Input() forecastStartDate: any;
  @Input() forecastEndDate: any;
  @Input() planDuration?: number;
  @Input() chartViewStartYear: number | null = null;
  @Input() chartViewEndYear: number | null = null;

  private readonly ngZone = inject(NgZone);
  private readonly translate = inject(TranslateService);
  private yAxisLabelEl: HTMLElement | null = null;
  private _postRenderTimer: ReturnType<typeof setTimeout> | null = null;

  private chartResizeObserver: ResizeObserver | null = null;
  private chartLayoutDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  chartOptions: any = {
    series: [],
    chart: {
      type: 'area',
      height: 500,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
      events: {
        mounted: () => this.postRenderSetup(),
        updated: () => this.postRenderSetup(),
      },
    },
    stroke: { width: [3, 3], dashArray: [0, 8], curve: 'smooth' },
    xaxis: { type: 'category', categories: [] },
    yaxis: {},
    tooltip: { enabled: true, shared: true, intersect: false },
    legend: { position: 'top', horizontalAlign: 'center' },
    grid: {
      show: true,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
  };

  ngAfterViewInit(): void {
    this.setupChartResizeObserver();
  }

  onApexChartReady(): void {
    this.ngZone.runOutsideAngular(() => this.flushApexChartWidthAfterLayout());
  }

  private setupChartResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const el = this.chartElRef?.nativeElement;
    if (!el) {
      return;
    }
    this.chartResizeObserver?.disconnect();
    this.chartResizeObserver = new ResizeObserver(() => {
      if (this.chartLayoutDebounceTimer !== null) {
        clearTimeout(this.chartLayoutDebounceTimer);
      }
      this.chartLayoutDebounceTimer = setTimeout(() => {
        this.chartLayoutDebounceTimer = null;
        this.ngZone.runOutsideAngular(() =>
          this.flushApexChartWidthAfterLayout(),
        );
      }, 150);
    });
    this.chartResizeObserver.observe(el);
  }

  private flushApexChartWidthAfterLayout(): void {
    const apx = this.apxChartComponent;
    const host = this.chartElRef?.nativeElement;
    if (!apx || !host) {
      return;
    }
    const apply = () => {
      const width = Math.floor(host.getBoundingClientRect().width);
      if (width < 32) {
        return;
      }
      void apx.updateOptions({ chart: { width } }, false, false, false);
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.report?.series?.length || !this.compareReport?.series?.length) {
      return;
    }

    let planA = this.trimToEndYear(this.report);
    let planB = this.trimToEndYear(this.compareReport);
    if (!planA || !planB) return;

    const vs = Number(this.chartViewStartYear);
    const ve = Number(this.chartViewEndYear);
    if (Number.isFinite(vs) && Number.isFinite(ve)) {
      planA = sliceChartSeriesToInclusiveYearRange(planA, vs, ve) as ChartSeries;
      planB = sliceChartSeriesToInclusiveYearRange(planB, vs, ve) as ChartSeries;
    }

    const {
      categories: yearCategories,
      seriesA,
      seriesB,
    } = this.alignAndSum(planA, planB);

    const currencyCode = this.client?.clientDetails?.preferredCurrency ?? '';
    const birthDate = toDate(this.client?.clientDetails?.birthDate);
    const forecastStart = toDate(this.forecastStartDate);
    const lastYr = yearCategories.length
      ? Number(yearCategories[yearCategories.length - 1])
      : NaN;

    const ageLabels: string[] = [];
    const yearLabels: string[] = [];

    yearCategories.forEach((cat) => {
      const yr = Number(cat);
      yearLabels.push(String(yr));

      if (birthDate && Number.isFinite(yr)) {
        const age = getProjectionColumnAgeLabel(
          birthDate,
          yr,
          forecastStart ?? undefined,
          this.planDuration,
          Number.isFinite(lastYr) ? lastYr : null,
        );
        ageLabels.push(Number.isNaN(age) || age < 0 ? String(cat) : String(age));
      } else {
        ageLabels.push(cat);
      }
    });

    const fmtAxisFigure = (value: number): string => {
      if (!Number.isFinite(value)) return '';
      return value.toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
    };

    const fmtCurrency = (value: number): string => {
      if (!Number.isFinite(value)) return String(value ?? '');
      if (!currencyCode || currencyCode.length !== 3)
        return value.toLocaleString();
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
        categories: ageLabels,
        tickAmount: Math.max(1, Math.floor(ageLabels.length / 5)),
        title: { text: 'Age', style: { fontWeight: 500 } },
        labels: {
          style: { cssClass: 'leftAlign' },
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        title: { text: '' },
        labels: {
          formatter(value: any) {
            const n = value != null ? Number(value) : NaN;
            return Number.isFinite(n) ? fmtAxisFigure(n) : '';
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        showForSingleSeries: true,
        customLegendItems: [planALabel, planBLabel],
        markers: { fillColors: [planAColor, planBColor] },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.42,
          opacityTo: 0.12,
          stops: [0, 88, 100],
        },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        custom: (opts: any) => {
          const { series, dataPointIndex, w } = opts;
          const age = ageLabels[dataPointIndex] ?? '–';
          const year = yearLabels[dataPointIndex] ?? '–';

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
        <div class="savings-tooltip__body">
          <div class="savings-tooltip__label">
            <span class="circle-wrapper" style="background-color: ${color};"></span>${name}:</div>
          <div class="savings-tooltip__value">${fmtCurrency(value)}</div>
        </div>`;
            })
            .join('');

          const ageLbl = this.translate.instant('Age');
          const yearLbl = this.translate.instant('Year');
          return `
      <div class="savings-tooltip">
        <div class="savings-tooltip__header">
          <div>${ageLbl}: ${age} </div>  <div> ${yearLbl}: ${year}</div> 
        </div>
        ${rows}
      </div>
    `;
        },
      },
    };
  }

  private alignAndSum(
    planA: ChartSeries,
    planB: ChartSeries,
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
      (s) => !EXCLUDED_SERIES.includes(s.name),
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

  ngOnDestroy(): void {
    if (this.chartLayoutDebounceTimer !== null) {
      clearTimeout(this.chartLayoutDebounceTimer);
    }
    this.chartResizeObserver?.disconnect();
    this.chartResizeObserver = null;
    if (this._postRenderTimer !== null) {
      clearTimeout(this._postRenderTimer);
    }
    this.cleanupYAxisLabel();
  }

  private getCurrencyAxisTitle(): string {
    return this.client?.clientDetails?.preferredCurrency ?? '';
  }

  private postRenderSetup(): void {
    if (this._postRenderTimer !== null) {
      clearTimeout(this._postRenderTimer);
    }
    this._postRenderTimer = setTimeout(() => this.positionYAxisLabel(), 50);
  }

  private cleanupYAxisLabel(): void {
    if (this.yAxisLabelEl) {
      this.yAxisLabelEl.remove();
      this.yAxisLabelEl = null;
    }
  }

  private positionYAxisLabel(): void {
    this.cleanupYAxisLabel();

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const currencyText = this.getCurrencyAxisTitle();
    if (!currencyText) return;

    const legend = chartHost.querySelector<HTMLElement>('.apexcharts-legend');
    const yAxisTexts = chartHost.querySelector<SVGGElement>(
      '.apexcharts-yaxis-texts-g',
    );
    if (!legend) return;

    const hostRect = chartHost.getBoundingClientRect();
    const legendRect = legend.getBoundingClientRect();

    if (getComputedStyle(chartHost).position === 'static') {
      chartHost.style.position = 'relative';
    }

    const label = document.createElement('div');
    label.textContent = currencyText;
    label.className = 'y-axis-top-label';
    chartHost.appendChild(label);

    const labelTop = legendRect.top - hostRect.top + legendRect.height / 2 - 7;

    let labelLeft = 10;
    if (yAxisTexts) {
      const textsRect = yAxisTexts.getBoundingClientRect();
      labelLeft = textsRect.left - hostRect.left;
    }

    label.style.position = 'absolute';
    label.style.top = `${labelTop}px`;
    label.style.left = `${labelLeft}px`;
    label.style.pointerEvents = 'none';
    label.style.zIndex = '5';

    this.yAxisLabelEl = label;
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
        (e) => Number.isFinite(e.startYear) && e.startYear <= endYear,
      ),
    };
  }
}
