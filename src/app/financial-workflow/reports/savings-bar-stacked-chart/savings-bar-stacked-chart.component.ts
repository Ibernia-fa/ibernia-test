import {
  AfterViewInit,
  Component,
  ViewChild,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  NgZone,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { formatLifetimePlanSeriesDisplayName } from 'src/app/shared/utils/lifetime-plan-series-display';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import {
  ChartSeries,
  Series,
  TimelineEvent,
} from '../models/charts-series.model';
import { ensureUniqueSavingsChartSeriesColors } from 'src/app/shared/utils/unique-savings-chart-series-colors';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';
import { Client } from 'src/app/clients/models/client';
import moment from 'moment';
import { getProjectionColumnAgeLabel } from 'src/app/shared/utils/client-age-at-reference';
import { sliceChartSeriesToInclusiveYearRange } from 'src/app/shared/utils/chart-series-year-range';
import { IncomeDisplayLabelContext } from 'src/app/shared/utils/income-display-label';

@Component({
  selector: 'app-savings-bar-stacked-chart',
  imports: [TablerIconsModule, MatCardModule, NgApexchartsModule],
  templateUrl: './savings-bar-stacked-chart.component.html',
  styleUrl: './savings-bar-stacked-chart.component.scss',
})
export class SavingsBarStackedChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('chart', { read: ElementRef })
  chartElRef: ElementRef<HTMLDivElement>;
  @ViewChild(ChartComponent) apxChartComponent: ChartComponent | undefined;
  @Input() report: ChartSeries;
  @Input() forecastStartDate: Date;
  @Input() forecastEndDate: Date;
  @Input() client: Client;
  /** Cashflow plan end age (e.g. 90); aligns last bar label year with birthYear + planDuration. */
  @Input() planDuration?: number;
  @Input() cashFlowName: string;
  @Input() chartHeight: number = 500;
  @Input() emergencyIconUrl?: string;
  /** When true, enables smooth bar morphing animation on data updates (dynamicAnimation). */
  @Input() animateUpdates: boolean = false;
  /** Optional inclusive calendar-year window (after end-year trim). Null = full trimmed range. */
  @Input() chartViewStartYear: number | null = null;
  @Input() chartViewEndYear: number | null = null;
  isFullscreen: any;

  private readonly EVENT_DOT_SPACING = 20;
  public chartOptions: any;
  events: TimelineEvent[] = [];
  private tooltipElements: HTMLElement[] = [];
  private markerListeners: Array<{
    marker: SVGElement;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }> = [];
  private emergencyIconEl: HTMLElement | null = null;
  private emergencyIconLineEl: HTMLElement | null = null;
  private emergencyIconBandEl: HTMLElement | null = null;
  private emergencyExpenseIconEl: HTMLElement | null = null;
  private emergencyExpenseLineEl: HTMLElement | null = null;
  private emergencyExpenseBandEl: HTMLElement | null = null;
  private eventLabelElements: HTMLElement[] = [];
  private yAxisLabelEl: HTMLElement | null = null;
  private shortfallDataPointIndex: number = -1;
  private emergencyExpenseDataPointIndex: number = -1;
  /** Tracks whether the chart has been rendered at least once (used to skip full re-inits on subsequent series updates). */
  private chartInitialized = false;
  /** Last categories string used to detect genuine axis changes vs. same-length updates. */
  private previousCategoriesKey = '';
  /** Annotation data decoupled from chartOptions to avoid triggering ng-apexcharts change detection. */
  private currentAnnotationPoints: any[] = [];
  /**
   * Scenario Lab (`animateUpdates`): report changes skip `chartOptions.annotations` so Apex can
   * use `updateSeries` only. We must clear and re-add point annotations after each report swap
   * (Before/After) or tooltips keep stale `customTooltip` HTML / wrong marker alignment.
   */
  private _pointAnnotationsNeedResync = false;
  /** Cached flag for use inside ApexCharts event callbacks. */
  private _hideEmergencyOverlays = false;
  /** Debounce handle for postRenderSetup. */
  private _postRenderTimer: any = null;
  /** Series colours after client-side de-dupe (legend + shared tooltip must match bars). */
  private seriesColorsForTooltip: Series[] = [];

  /** Observes wrapper size (e.g. sidebar open/close); Apex only watches its direct parent. */
  private chartResizeObserver: ResizeObserver | null = null;
  private chartLayoutDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private getCurrencyAxisTitle(): string {
    return this.client?.clientDetails?.preferredCurrency ?? '';
  }

  /** Matches income list naming for inheritance markers on joint / couple plans. */
  private getIncomeLabelContextForChart(): IncomeDisplayLabelContext | null {
    if (!this.client) return null;
    return {
      hasPartner: !!this.client.partnerDetail,
      clientFirstName: this.client.clientDetails?.firstName ?? '',
      partnerFirstName: this.client.partnerDetail?.firstName ?? '',
    };
  }

  /** X-axis label: "Age", or "Age {main first name}" when the plan has a partner. */
  private getXAxisTitleText(): string {
    const ageWord = this.translate.instant('Age');
    if (!this.client?.partnerDetail) {
      return ageWord;
    }
    const first = this.client.clientDetails?.firstName?.trim() ?? '';
    return first ? `${ageWord} ${first}` : ageWord;
  }

  /** Trims report to only include years up to forecastEndDate (projection end year). */
  private trimReportToEndYear(
    report: ChartSeries | null | undefined,
  ): ChartSeries | null | undefined {
    if (!report?.categories?.length || !this.forecastEndDate) return report;
    const endYear = moment(this.forecastEndDate).year();
    if (!Number.isFinite(endYear)) return report;
    const indicesToKeep: number[] = [];
    report.categories.forEach((cat, i) => {
      const y = Number(cat);
      if (Number.isFinite(y) && y <= endYear) indicesToKeep.push(i);
    });
    // If nothing matches (e.g. categories start after forecast end year, or bad dates),
    // do not strip — otherwise series keep `name` but `data: []` and Apex renders blank.
    if (indicesToKeep.length === 0) return report;
    if (indicesToKeep.length === report.categories.length) return report;
    const categories = indicesToKeep.map((i) => report.categories[i]);
    const series = report.series.map((s) => ({
      ...s,
      data: indicesToKeep.map((i) => s.data[i] ?? 0),
    }));
    const timelineEvents = (report.timelineEvents ?? []).filter(
      (e) => Number.isFinite(e.startYear) && e.startYear <= endYear,
    );
    return { ...report, categories, series, timelineEvents };
  }

  private applyOptionalViewYearSlice(
    report: ChartSeries | null | undefined,
  ): ChartSeries | null | undefined {
    if (!report?.categories?.length) return report;
    // Do not use Number(null) — it is 0 and would slice to [0,0], wiping all categories (simulation modal).
    if (this.chartViewStartYear == null || this.chartViewEndYear == null) {
      return report;
    }
    const a = Number(this.chartViewStartYear);
    const b = Number(this.chartViewEndYear);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return report;
    return sliceChartSeriesToInclusiveYearRange(report, a, b);
  }

  /** Report after end-year trim and optional chart year window. */
  private getProcessedReport(): ChartSeries | null | undefined {
    return this.applyOptionalViewYearSlice(this.trimReportToEndYear(this.report));
  }

  private ngZone = inject(NgZone);
  private translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 500,
        stacked: true,
        animations: {
          // Keep disabled by default to preserve existing report-page behavior.
          // Scenario Lab passes `animateUpdates=true`, which turns this on in ngOnChanges.
          enabled: false,
          dynamicAnimation: {
            enabled: true,
            speed: 1500,
          },
          animateGradually: { enabled: false },
        },
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        states: {
          hover: {
            filter: {
              type: 'none',
            },
          },
          active: {
            filter: {
              type: 'none',
            },
          },
        },
        events: {
          dataPointSelection: () => undefined,
          mounted: (chartContext: any) => this.postRenderSetup(chartContext),
          updated: (chartContext: any) => this.postRenderSetup(chartContext),
        },
        selection: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        custom: (opts: any) => {
          const { series, dataPointIndex, w } = opts;

          const xValue = w.globals.labels[dataPointIndex];
          const year = Number(xValue);
          const labels = w.globals.labels ?? [];
          const firstYear = labels.length ? Number(labels[0]) : null;
          const lastYear = labels.length
            ? Number(labels[labels.length - 1])
            : null;
          const age = this.getDisplayAgeForYear(
            year,
            Number.isFinite(firstYear) ? firstYear : null,
            Number.isFinite(lastYear) ? lastYear : null,
          );

          const bodyRows = w.globals.seriesNames
            .map((seriesName: string, i: number) => {
              const rawName = this.seriesColorsForTooltip[i]?.name;
              if (rawName === 'Emergency Expense') return '';
              const value = series[i]?.[dataPointIndex];
              if (
                value === undefined ||
                (typeof value === 'number' && value === 0)
              )
                return '';
              // Index must match series order — duplicate pot names (e.g. two "Investment") break find-by-name.
              const originalSeries = this.seriesColorsForTooltip[i];
              const color =
                originalSeries?.color && originalSeries.color !== 'transparent'
                  ? originalSeries.color
                  : w.globals.colors[i];
              const displayValue =
                typeof value === 'number'
                  ? this.formatCurrency(value)
                  : String(value ?? '');
              return `
        <div class="savings-tooltip__body">
          <div class="savings-tooltip__label">
            <span class="circle-wrapper" style="background-color: ${color};"></span>${seriesName}:</div>
          <div class="savings-tooltip__value">${displayValue}</div>
        </div>`;
            })
            .filter(Boolean)
            .join('');

          const ageLbl = this.translate.instant('Age');
          const yearLbl = this.translate.instant('Year');
          return `
      <div class="savings-tooltip">
        <div class="savings-tooltip__header">
          <div>${ageLbl}: ${age} </div>  <div> ${yearLbl}: ${xValue}</div> 
        </div>
        ${bodyRows}
      </div>
    `;
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
              offsetX: 0,
              offsetY: 0,
              onItemClick: {
                toggleDataSeries: false,
              },
            },
          },
        },
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          states: {
            active: {
              filter: {
                type: 'none',
              },
            },
          },
        },
      },
      grid: {
        show: true,
        borderColor: '#0000001a',
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        offsetX: 28,
        fillColors: ['#4CAF50', '#8BC34A', '#FF5722', '#FF5700'],
        showForZeroSeries: false,
      },
      fill: {
        opacity: 1,
      },
      states: {
        normal: { filter: { type: 'none', value: 0 } },
        hover: { filter: { type: 'none' } },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: { type: 'none' },
        },
      },
      annotations: { points: [] },
    };

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChartTranslationsChanged());
  }

  ngAfterViewInit(): void {
    this.setupChartResizeObserver();
  }

  /**
   * Fires when ng-apexcharts finishes creating the instance (report may load after view init).
   */
  onApexChartReady(): void {
    this.ngZone.runOutsideAngular(() => this.flushApexChartWidthAfterLayout());
  }

  /**
   * Re-layout ApexCharts when the host width changes without a window resize
   * (common with CSS layout / sidebar transitions).
   */
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

  /**
   * Apex often keeps the initial pixel width; `update()` does not reliably
   * re-read % width when only the flex layout changes. Set an explicit width
   * from the wrapper after layout (double rAF avoids stale measurements).
   */
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

  ngOnChanges(changes: SimpleChanges): void {
    /** Only used to skip eager `updateSeries` on first paint (emergency sim uses animateUpdates). */
    const chartWasAlreadyInitialized = this.chartInitialized;
    const hideEmergencyOverlays = this.emergencyIconUrl === 'none';
    this._hideEmergencyOverlays = hideEmergencyOverlays;

    const parsedHeight = Number(this.chartHeight);
    const effectiveHeight =
      Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : 500;

    // Only update chart options (triggers full re-render) when chartHeight itself changed.
    // Doing this unconditionally was causing a full re-render on every series update.
    if (changes['chartHeight']) {
      this.chartOptions.chart = {
        ...this.chartOptions.chart,
        height: effectiveHeight,
      };
    }

    // Enable smooth morphing only for contexts that explicitly ask for it.
    // This is a one-time (or rare) update and should not run on every report change.
    if (changes['animateUpdates']) {
      this.chartOptions.chart = {
        ...this.chartOptions.chart,
        animations: {
          ...this.chartOptions.chart.animations,
          enabled: !!this.animateUpdates,
        },
      };
    }

    const report = this.getProcessedReport();
    if (!report?.series?.length) {
      this.seriesColorsForTooltip = [];
      if (changes['client'] && this.client) {
        this.chartOptions.yaxis = {
          title: { text: '' },
          labels: {
            formatter: (value: any) =>
              value != null ? Number(value).toLocaleString() : '',
          },
        };
      }
      return;
    }

    const seriesForChart = ensureUniqueSavingsChartSeriesColors(report.series);
    this.seriesColorsForTooltip = seriesForChart;

    if (changes['report']) {
      this.cleanupHtmlTooltips();
      this.cleanupEmergencyElements();
      this.cleanupEventLabels();

      // goals and events dots
      this.events = report.timelineEvents ?? [];

      // Always compute shortfall/emergency indices (needed for overlay rendering)
      const emergencyXAxis = hideEmergencyOverlays
        ? []
        : this.buildEmergencyAnnotation(report);
      const emergencyExpenseXAxis = hideEmergencyOverlays
        ? []
        : this.buildEmergencyExpenseAnnotation(report);

      const points = this.buildEventAnnotations(this.events);
      this.currentAnnotationPoints = points;

      // Only rebuild legend and annotations when NOT in animated-update mode (or on first render).
      // Re-assigning these inputs triggers ng-apexcharts updateOptions → full re-render.
      if (!this.animateUpdates || !this.chartInitialized) {
        // legends formatter to hide specific series names (marker colours set below for every update)
        this.chartOptions.legend = {
          ...this.chartOptions.legend,

          formatter: (seriesName: string, opts?: { seriesIndex?: number }) => {
            const idx = opts?.seriesIndex;
            const raw =
              typeof idx === 'number'
                ? this.seriesColorsForTooltip[idx]?.name
                : undefined;
            if (
              raw === 'Current Account (Negative)' ||
              raw === 'Emergency Expense'
            ) {
              return '';
            }
            return seriesName;
          },
          onItemClick: {
            toggleDataSeries: true,
          },
          onItemHover: {
            highlightDataSeries: true,
          },
        };

        this.chartOptions.annotations = {
          points,
          xaxis: [...emergencyXAxis, ...emergencyExpenseXAxis],
        };
      } else if (this.chartInitialized) {
        // Scenario Lab: `updateSeries` path — Apex keeps old point markers; resync after render.
        this._pointAnnotationsNeedResync = true;
      }

      // Tooltip attachment and emergency overlays are now handled reliably by
      // postRenderSetup() which is triggered by ApexCharts mounted/updated events,
      // avoiding race conditions with arbitrary setTimeout delays.
    }

    // NOTE: animations.dynamicAnimation is configured in the constructor and stays stable.
    // Do NOT reassign chartOptions.chart here — that triggers a full re-render via updateOptions.

    // if (
    //   (changes['forecastStartDate'] || changes['forecastEndDate']) &&
    //   this.forecastStartDate &&
    //   this.forecastEndDate
    // ) {
    //   this.chartOptions.xaxis = {
    //     type: 'category', // Treat x-axis as numbers (years)
    //     categories: report.categories ?? [],
    //     stepSize: 5, // Each year is a distinct tick
    //     tickAmount: Math.floor((moment(this.forecastEndDate).year() - moment(this.forecastStartDate).year()) / 5),
    //     style: {
    //       cssClass: 'leftAlign'
    //     }
    //   }
    // }

    // Rebuild xaxis only when: first init, OR categories actually changed, OR NOT in animateUpdates mode.
    // When animateUpdates=true, forecastDate changes alone don't trigger xaxis rebuild because
    // the Scenario Lab aligns categories between baseline/scenario, making categories the
    // authoritative source. This keeps ng-apexcharts on the updateSeries path (smooth animation).
    const currentCategoriesKey = (report.categories ?? []).join(',');
    const categoriesChanged =
      currentCategoriesKey !== this.previousCategoriesKey;
    this.previousCategoriesKey = currentCategoriesKey;
    this.chartInitialized = true;

    if (!this.animateUpdates || categoriesChanged) {
      const categories = report.categories ?? [];

      let firstYear = categories.length ? Number(categories[0]) : undefined;
      let lastYear = categories.length
        ? Number(categories[categories.length - 1])
        : undefined;

      // Fallback to forecast dates only if categories are missing
      if (!Number.isFinite(firstYear) && this.forecastStartDate) {
        firstYear = moment(this.forecastStartDate).year();
      }
      if (!Number.isFinite(lastYear) && this.forecastEndDate) {
        lastYear = moment(this.forecastEndDate).year();
      }

      const tickAmount =
        Number.isFinite(firstYear) &&
        Number.isFinite(lastYear) &&
        lastYear! > firstYear!
          ? Math.max(1, Math.floor((lastYear! - firstYear!) / 5))
          : 1;

      const firstCategoryYear = Number.isFinite(firstYear)
        ? Number(firstYear)
        : null;
      const lastCategoryYear = Number.isFinite(lastYear)
        ? Number(lastYear)
        : null;

      this.chartOptions.xaxis = {
        type: 'category',
        categories,
        tickAmount,
        title: { text: this.getXAxisTitleText() },
        axisBorder: {
          show: true,
          color: '#0000001a', // change to whatever color you want
          height: 1, // thickness of the line
        },
        labels: {
          style: { cssClass: 'leftAlign' },
          formatter: (value: string) => {
            const year = Number(value);
            const age = this.getDisplayAgeForYear(
              year,
              firstCategoryYear,
              lastCategoryYear,
            );
            return age === '' ? value : String(age);
          },
        },
      };
    }

    if (changes['client']) {
      this.chartOptions.yaxis = {
        title: { text: '' },
        labels: {
          formatter: (value: any) =>
            value != null ? Number(value).toLocaleString() : '',
        },
      };
      if (this.chartOptions.xaxis) {
        this.chartOptions.xaxis = {
          ...this.chartOptions.xaxis,
          title: { text: this.getXAxisTitleText() },
        };
      }
      const birthYear = this.client?.clientDetails?.birthDate
        ? moment(this.client.clientDetails.birthDate).year()
        : null;
      if (this.chartOptions.xaxis?.labels && birthYear != null) {
        const cats = this.chartOptions.xaxis?.categories ?? [];
        const firstCategoryYear = cats.length ? Number(cats[0]) : null;
        const lastCategoryYear = cats.length
          ? Number(cats[cats.length - 1])
          : null;
        this.chartOptions.xaxis = {
          ...this.chartOptions.xaxis,
          title: { text: this.getXAxisTitleText() },
          labels: {
            ...this.chartOptions.xaxis.labels,
            formatter: (value: string) => {
              const year = Number(value);
              const age = this.getDisplayAgeForYear(
                year,
                Number.isFinite(firstCategoryYear) ? firstCategoryYear : null,
                Number.isFinite(lastCategoryYear) ? lastCategoryYear : null,
              );
              return age === '' ? value : String(age);
            },
          },
        };
      }
    }

    const legendFillColors = seriesForChart.map((s) =>
      s.name === 'Current Account (Negative)' || s.name === 'Emergency Expense'
        ? 'transparent'
        : s.color,
    );
    const prevFillColors: string[] | undefined =
      this.chartOptions.legend?.markers?.fillColors;
    const colorsChanged =
      !prevFillColors ||
      prevFillColors.length !== legendFillColors.length ||
      prevFillColors.some((c: string, i: number) => c !== legendFillColors[i]);
    if (colorsChanged) {
      this.chartOptions.legend = {
        ...this.chartOptions.legend,
        markers: {
          ...(this.chartOptions.legend?.markers ?? {}),
          fillColors: legendFillColors,
        },
      };
    }

    // final series assignment
    const mappedSeries = seriesForChart.map((s, idx) => ({
      ...s,
      name: formatLifetimePlanSeriesDisplayName(s, this.client, this.translate),
      color:
        s.name === 'Current Account (Negative)' ||
        s.name === 'Emergency Expense'
          ? 'transparent'
          : s.color,
      tack: 'stack1',
      order: s.name === 'Emergency Expense' ? seriesForChart.length : idx,
      fill: {
        opacity: 1,
      },
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.15,
          },
        },
        active: {
          filter: {
            type: 'none',
          },
        },
      },
    }));
    if (this.animateUpdates && chartWasAlreadyInitialized && changes['report']) {
      // Bypass ng-apexcharts entirely: do NOT assign chartOptions.series
      // (a new reference there triggers updateOptions → full chart rebuild).
      // Instead call updateSeries() directly for smooth bar morphing.
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.apxChartComponent?.updateSeries(mappedSeries, true);
        }, 0);
      });
    } else {
      this.chartOptions.series = mappedSeries;
    }
  }

  ngOnDestroy(): void {
    if (this.chartLayoutDebounceTimer !== null) {
      clearTimeout(this.chartLayoutDebounceTimer);
    }
    this.chartResizeObserver?.disconnect();
    this.chartResizeObserver = null;
    clearTimeout(this._postRenderTimer);
    clearTimeout(this._tooltipRetryTimer);
    this.cleanupHtmlTooltips();
    this.cleanupEmergencyElements();
    this.cleanupEventLabels();
    this.cleanupYAxisLabel();
  }

  private cleanupEmergencyElements(): void {
    for (const key of [
      'emergencyIconEl',
      'emergencyIconLineEl',
      'emergencyIconBandEl',
      'emergencyExpenseIconEl',
      'emergencyExpenseLineEl',
      'emergencyExpenseBandEl',
    ] as const) {
      const el = this[key] as HTMLElement | null;
      if (el) {
        el.remove();
        (this as any)[key] = null;
      }
    }
  }

  private cleanupEventLabels(): void {
    this.eventLabelElements.forEach((el) => el.remove());
    this.eventLabelElements = [];
  }

  private cleanupYAxisLabel(): void {
    if (this.yAxisLabelEl) {
      this.yAxisLabelEl.remove();
      this.yAxisLabelEl = null;
    }
  }

  /**
   * Creates an HTML label for the y-axis currency title and positions it
   * by reading the actual rendered positions of the legend and y-axis.
   */
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

  buildEventAnnotations(events: TimelineEvent[]) {
    const eventsByYear = new Map<string, TimelineEvent[]>();
    const DOT_SPACING = 10;

    events.forEach((event) => {
      const year = event.startYear.toString();
      if (!eventsByYear.has(year)) eventsByYear.set(year, []);
      eventsByYear.get(year)!.push(event);
    });

    const annotations: any[] = [];

    eventsByYear.forEach((groupEvents, year) => {
      groupEvents.forEach((event, index) => {
        // Only show markers; labels will be rendered as HTML overlays
        annotations.push({
          x: year,
          y: 0,
          marker: {
            size: 5,
            fillColor: this.calculateDotColor(event.iconUrl),
            strokeColor: '#fff',
            strokeWidth: 2,
            offsetY: -(index * DOT_SPACING),
          },
          label: { text: '' },
          customTooltip: `
            <div class="event-tooltip ${event.iconUrl}">
              <span style="display:none">${event.name}</span>
              <img src="/assets/images/svgs/${event.iconUrl}.svg" alt="${event.iconUrl}" />
              <span>${translateTimelineEventDisplayName(this.translate, event.name, this.getIncomeLabelContextForChart())}</span>
            </div>`,
        });
      });
    });

    return annotations;
  }

  /**
   * Attach HTML label overlays for timeline events.
   * These are rendered outside the SVG to prevent clipping.
   */
  private attachEventLabels(): void {
    this.cleanupEventLabels();

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const hostRect = chartHost.getBoundingClientRect();

    // Get plot area bounds
    const gridEl = chartHost.querySelector<SVGElement>('.apexcharts-grid');
    const gridRect = gridEl?.getBoundingClientRect();
    const plotTop = gridRect ? gridRect.top : 10;
    const plotBottom = gridRect ? gridRect.bottom : window.innerHeight - 10;

    const eventsByYear = new Map<string, TimelineEvent[]>();
    this.events.forEach((event) => {
      const year = event.startYear.toString();
      if (!eventsByYear.has(year)) eventsByYear.set(year, []);
      eventsByYear.get(year)!.push(event);
    });

    const labelHost = this.getTooltipHost();

    eventsByYear.forEach((groupEvents, year) => {
      groupEvents.forEach((event, index) => {
        // Find marker position for this event
        const markers = chartHost.querySelectorAll<SVGElement>(
          '.apexcharts-point-annotation-marker',
        );
        let markerCenterX = 0;
        let markerCenterY = 0;
        let found = false;

        // Match marker by checking if it's at this year with this event name in tooltip
        markers.forEach((marker) => {
          if (found) return;
          const annotationIdx = Array.from(markers).indexOf(marker);
          if (
            this.currentAnnotationPoints[
              annotationIdx
            ]?.customTooltip?.includes(event.name)
          ) {
            const rect = marker.getBoundingClientRect();
            markerCenterX = rect.left + rect.width / 2;
            markerCenterY = rect.top + rect.height / 2;
            found = true;
          }
        });

        if (!found) return;

        // Create label element with FIXED positioning (not clipped by chart overflow)
        const label = document.createElement('div');
        label.textContent = translateTimelineEventDisplayName(
          this.translate,
          event.name,
          this.getIncomeLabelContextForChart(),
        );
        label.className = 'event-label';
        label.style.position = 'fixed';
        label.style.pointerEvents = 'none';
        label.style.zIndex = '99999';
        label.style.fontSize = '12px';
        label.style.fontWeight = '500';
        label.style.color = '#333';
        label.style.backgroundColor = 'white';
        label.style.border = '1px solid #ddd';
        label.style.borderRadius = '4px';
        label.style.padding = '4px 8px';
        label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        label.style.whiteSpace = 'nowrap';
        label.style.transform = 'translateX(-50%)';

        labelHost.appendChild(label);

        // Get label dimensions after it's rendered
        setTimeout(() => {
          const labelRect = label.getBoundingClientRect();
          const labelHeight = labelRect.height;

          // Try to position above the marker
          let labelTop = Math.max(5, markerCenterY - 45 - index * 25);

          // If it goes off the top of the viewport, position it below instead
          if (labelTop < 5) {
            labelTop = plotBottom + 10 + index * 25;
          }

          label.style.left = `${markerCenterX}px`;
          label.style.top = `${labelTop}px`;
        }, 0);

        this.eventLabelElements.push(label);
      });
    });
  }

  /**
   * Locates the first year where shortfall begins and stores the data-point index.
   * The visual band is drawn as an HTML overlay in attachEmergencyIcon().
   */
  private buildEmergencyAnnotation(report: ChartSeries): any[] {
    this.shortfallDataPointIndex = -1;
    const shortfallSeries = report?.series?.find((s) => s.name === 'Shortfall');
    if (!shortfallSeries) return [];

    const index = shortfallSeries.data.findIndex((v: number) => v < 0);
    if (index < 0) return [];

    this.shortfallDataPointIndex = index;
    return [];
  }

  /**
   * Locates the year where the Emergency Expense falls and stores the data-point index.
   * The visual band is drawn as an HTML overlay in attachEmergencyExpenseIcon().
   */
  private buildEmergencyExpenseAnnotation(report: ChartSeries): any[] {
    this.emergencyExpenseDataPointIndex = -1;
    const emergencySeries = report?.series?.find(
      (s) => s.name === 'Emergency Expense',
    );
    if (!emergencySeries) return [];

    const index = emergencySeries.data.findIndex((v: number) => v > 0);
    if (index < 0) return [];

    this.emergencyExpenseDataPointIndex = index;
    return [];
  }

  /**
   * Places the emergency icon at the top of the plot area for the Emergency Expense year,
   * draws a full-height background band, and a vertical connector line from icon to bar top.
   */
  private attachEmergencyExpenseIcon(): void {
    if (this.emergencyExpenseIconEl) {
      this.emergencyExpenseIconEl.remove();
      this.emergencyExpenseIconEl = null;
    }
    if (this.emergencyExpenseLineEl) {
      this.emergencyExpenseLineEl.remove();
      this.emergencyExpenseLineEl = null;
    }
    if (this.emergencyExpenseBandEl) {
      this.emergencyExpenseBandEl.remove();
      this.emergencyExpenseBandEl = null;
    }
    if (this.emergencyExpenseDataPointIndex < 0) return;

    this.attachColumnOverlay(
      this.emergencyExpenseDataPointIndex,
      (icon, line, band) => {
        this.emergencyExpenseIconEl = icon;
        this.emergencyExpenseLineEl = line;
        this.emergencyExpenseBandEl = band;
      },
    );
  }

  /**
   * Places the shortfall ⚠ icon at the top of the plot area, draws a full-height
   * background band, and a vertical connector line from icon to the bar top.
   */
  private attachEmergencyIcon(): void {
    if (this.emergencyIconEl) {
      this.emergencyIconEl.remove();
      this.emergencyIconEl = null;
    }
    if (this.emergencyIconLineEl) {
      this.emergencyIconLineEl.remove();
      this.emergencyIconLineEl = null;
    }
    if (this.emergencyIconBandEl) {
      this.emergencyIconBandEl.remove();
      this.emergencyIconBandEl = null;
    }
    if (this.shortfallDataPointIndex < 0) return;

    this.attachColumnOverlay(
      this.shortfallDataPointIndex,
      (icon, line, band) => {
        this.emergencyIconEl = icon;
        this.emergencyIconLineEl = line;
        this.emergencyIconBandEl = band;
      },
    );
  }

  /**
   * Shared logic for rendering an emergency column overlay:
   * - full-height pink background band
   * - ⚠ icon pinned to the top of the plot area
   * - vertical connector line from icon bottom to the topmost bar segment
   */
  private attachColumnOverlay(
    dataPointIndex: number,
    assign: (
      icon: HTMLElement,
      line: HTMLElement | null,
      band: HTMLElement | null,
    ) => void,
  ): void {
    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const allSeries = chartHost.querySelectorAll(
      '.apexcharts-bar-series .apexcharts-series',
    );
    if (!allSeries.length) return;

    // Locate bar center-X and width at the target column
    let barCenterX = 0;
    let barWidth = 30;
    let foundBar = false;

    allSeries.forEach((seriesGroup: Element) => {
      if (foundBar) return;
      const bars = seriesGroup.querySelectorAll<SVGPathElement>(
        'path.apexcharts-bar-area',
      );
      const bar = bars[dataPointIndex];
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      if (rect.width === 0) return;
      barCenterX = rect.left + rect.width / 2;
      barWidth = rect.width;
      foundBar = true;
    });

    if (!foundBar) return;

    const hostRect = chartHost.getBoundingClientRect();

    // Ensure host is a positioning context
    if (getComputedStyle(chartHost).position === 'static') {
      chartHost.style.position = 'relative';
    }

    // Use the grid rect for exact plot-area bounds (excludes axis labels)
    const gridEl = chartHost.querySelector<SVGElement>('.apexcharts-grid');
    const gridRect = gridEl?.getBoundingClientRect();
    const plotTop = gridRect ? gridRect.top - hostRect.top : 10;
    const plotBottom = gridRect
      ? gridRect.bottom - hostRect.top
      : hostRect.height - 10;

    // ── full-height band (stays within the grid area) ────────────────────
    const band = document.createElement('div');
    band.style.position = 'absolute';
    band.style.pointerEvents = 'none';
    band.style.zIndex = '8';
    band.style.backgroundColor = '#FF4560';
    band.style.opacity = '0.12';
    band.style.width = `${barWidth}px`;
    band.style.left = `${barCenterX - hostRect.left - barWidth / 2}px`;
    band.style.top = `${plotTop}px`;
    band.style.height = `${plotBottom - plotTop}px`;
    chartHost.appendChild(band);

    // ── icon sits fully ABOVE the band top edge ─────────────────────────
    const iconSize = 24; // px — slightly larger than legacy 18px marker
    const iconTop = Math.max(2, plotTop - iconSize - 2);
    const icon = document.createElement('div');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 100 100"><path d="M 44 18 Q 50 8, 56 18 L 86 72 Q 92 82, 82 88 L 18 88 Q 8 82, 14 72 Z" fill="#E8384F"/><rect x="46" y="36" width="8" height="26" rx="4" ry="4" fill="white"/><circle cx="50" cy="74" r="5" fill="white"/></svg>`;
    icon.style.position = 'absolute';
    icon.style.pointerEvents = 'none';
    icon.style.zIndex = '11';
    icon.style.lineHeight = '1';
    icon.style.transform = 'translateX(-50%)';
    icon.style.left = `${barCenterX - hostRect.left}px`;
    icon.style.top = `${iconTop}px`;
    chartHost.appendChild(icon);

    assign(icon, null, band);
  }

  /**
   * Clears Apex annotations and reapplies point markers (and x-axis annotations) from
   * `currentAnnotationPoints`, using the trimmed report for emergency index calculation.
   */
  private applyPointAnnotationResync(chartContext: any): void {
    const report = this.getProcessedReport();
    if (!report) {
      return;
    }

    chartContext.clearAnnotations();

    if (!this._hideEmergencyOverlays) {
      const emergencyXAxis = this.buildEmergencyAnnotation(report);
      const emergencyExpenseXAxis = this.buildEmergencyExpenseAnnotation(report);
      [...emergencyXAxis, ...emergencyExpenseXAxis].forEach((a) =>
        chartContext.addXaxisAnnotation(a, false),
      );
    }

    this.currentAnnotationPoints.forEach((a) =>
      chartContext.addPointAnnotation(a, false),
    );
  }

  /** Rebuild event annotation strings when the UI language changes (Scenario Lab animated chart). */
  private onChartTranslationsChanged(): void {
    if (!this.chartInitialized) {
      return;
    }
    const report = this.getProcessedReport();
    if (!report?.series?.length) {
      return;
    }

    this.events = report.timelineEvents ?? [];
    this.currentAnnotationPoints = this.buildEventAnnotations(this.events);

    if (!this.animateUpdates) {
      return;
    }

    this._pointAnnotationsNeedResync = true;
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const comp = this.apxChartComponent;
        const series = this.chartOptions?.series;
        if (!comp?.chart || !series?.length) {
          return;
        }
        this.ngZone.run(() => comp.updateSeries(series, true));
      }, 0);
    });
  }

  /**
   * Called by ApexCharts `mounted` (after initial render / full rebuild) and
   * `updated` (after updateSeries animation completes). Only active when
   * animateUpdates=true (Scenario Lab). Rebuilds annotation markers that
   * updateSeries destroys and reattaches tooltip listeners.
   */
  private postRenderSetup(chartContext: any): void {
    clearTimeout(this._postRenderTimer);
    this._postRenderTimer = setTimeout(() => {
      const chartHost = this.chartElRef?.nativeElement;
      if (!chartHost) return;

      // For animated updates (Scenario Lab), updateSeries destroys annotation markers.
      // Re-add them via the chart API when missing.
      if (this.animateUpdates) {
        if (this._pointAnnotationsNeedResync) {
          this.applyPointAnnotationResync(chartContext);
          this._pointAnnotationsNeedResync = false;
        } else {
          const markers = chartHost.querySelectorAll<SVGElement>(
            '.apexcharts-point-annotation-marker',
          );

          if ((!markers || markers.length === 0) && this.events.length > 0) {
            const points = this.buildEventAnnotations(this.events);
            this.currentAnnotationPoints = points;
            points.forEach((a) => chartContext.addPointAnnotation(a, false));

            if (!this._hideEmergencyOverlays) {
              const trimmed = this.getProcessedReport();
              if (trimmed) {
                const emergencyXAxis = this.buildEmergencyAnnotation(trimmed);
                const emergencyExpenseXAxis =
                  this.buildEmergencyExpenseAnnotation(trimmed);
                [...emergencyXAxis, ...emergencyExpenseXAxis].forEach((a) =>
                  chartContext.addXaxisAnnotation(a, false),
                );
              }
            }
          }
        }
      }

      this.positionYAxisLabel();

      this.cleanupHtmlTooltips();
      if (this.events.length > 0) {
        this.attachHtmlTooltips();
      }

      if (this._hideEmergencyOverlays) {
        this.cleanupEmergencyElements();
      } else {
        this.attachEmergencyExpenseIcon();
        if (this.emergencyExpenseDataPointIndex < 0) {
          this.attachEmergencyIcon();
        } else {
          if (this.emergencyIconEl) {
            this.emergencyIconEl.remove();
            this.emergencyIconEl = null;
          }
          if (this.emergencyIconLineEl) {
            this.emergencyIconLineEl.remove();
            this.emergencyIconLineEl = null;
          }
          if (this.emergencyIconBandEl) {
            this.emergencyIconBandEl.remove();
            this.emergencyIconBandEl = null;
          }
        }
      }
    }, 50);
  }

  private _tooltipRetryTimer: any = null;

  private attachHtmlTooltips(retryCount = 0) {
    clearTimeout(this._tooltipRetryTimer);
    this.cleanupHtmlTooltips();

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const markers = chartHost.querySelectorAll<SVGElement>(
      '.apexcharts-point-annotation-marker',
    );

    // SVG annotation markers may not exist yet if the chart is still rendering.
    // Retry with progressive back-off to avoid the intermittent hover failure.
    if (markers.length === 0 && this.events.length > 0 && retryCount < 6) {
      this._tooltipRetryTimer = setTimeout(
        () => this.attachHtmlTooltips(retryCount + 1),
        150 * (retryCount + 1),
      );
      return;
    }

    const tooltipHost = this.getTooltipHost();

    markers.forEach((marker, i) => {
      const annotation = this.currentAnnotationPoints[i];
      if (!annotation?.customTooltip) return;

      const tooltip = document.createElement('div');
      tooltip.className = 'custom-html-tooltip';
      tooltip.innerHTML = annotation.customTooltip;
      tooltip.style.position = 'fixed';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.zIndex = '9999';
      tooltipHost.appendChild(tooltip);
      this.tooltipElements.push(tooltip);

      const onMouseEnter = () => {
        const rect = marker.getBoundingClientRect();
        chartHost.classList.add('event-tooltip-active');
        tooltip.style.display = 'block';
        tooltip.style.left = `${rect.left - tooltip.offsetWidth / 2 + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
      };

      const onMouseLeave = () => {
        chartHost.classList.remove('event-tooltip-active');
        tooltip.style.display = 'none';
      };

      marker.addEventListener('mouseenter', onMouseEnter);
      marker.addEventListener('mouseleave', onMouseLeave);
      this.markerListeners.push({ marker, onMouseEnter, onMouseLeave });
    });
  }

  private getTooltipHost(): HTMLElement {
    // Fullscreen overlay hides all other body children (including .cdk-overlay-container)
    // via CSS, so it must be checked first to keep tooltips visible.
    const fullscreenOverlay = document.querySelector<HTMLElement>(
      '.global-fullscreen-overlay',
    );
    if (fullscreenOverlay) return fullscreenOverlay;

    const dialogContainer = document.querySelector<HTMLElement>(
      '.cdk-overlay-container',
    );
    if (dialogContainer) return dialogContainer;

    return document.body;
  }

  private cleanupHtmlTooltips(): void {
    clearTimeout(this._tooltipRetryTimer);
    this.chartElRef?.nativeElement?.classList.remove('event-tooltip-active');

    this.markerListeners.forEach(({ marker, onMouseEnter, onMouseLeave }) => {
      marker.removeEventListener('mouseenter', onMouseEnter);
      marker.removeEventListener('mouseleave', onMouseLeave);
    });
    this.markerListeners = [];

    this.tooltipElements.forEach((tooltip) => tooltip.remove());
    this.tooltipElements = [];
  }

  /** Marker fill — timeline accent (matches .vis-item *::after / chip text in _customizer.scss) */
  private readonly ICON_COLORS: Record<string, string> = {
    'birth-icon': '#fe9614',
    'retirement-age-icon': '#3088ed',
    'partner-retirement-age-icon': '#fe9614',
    'mortality-icon': '#1c1c1c',
    'inheritance-icon': '#1c1c1c',
    /** Income-section inheritance marker (Goals-style inheritance-icon stays black for timeline chips). */
    'inheritance-green': '#34c759',
    'wedding-icon': '#6155f5',
    'state-pension-icon': '#1c1c1c',
    'home-icon': '#ff2d55',
    'travel-icon': '#0088ff',
    'car-icon': '#ac7f5e',
    'education-icon': '#00c8b3',
    'new-business-icon': '#34c759',
    'boat-icon': '#ff7504',
    'custom-icon': '#8388ff',
  };

  calculateDotColor(iconUrl: string): string {
    return this.ICON_COLORS[iconUrl] ?? '#8388ff';
  }

  formatCurrency(value: number): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return value != null ? String(value) : '';
    }
    const code = this.client?.clientDetails?.preferredCurrency;
    if (!code || code.length !== 3) {
      return value.toLocaleString();
    }
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

  private getDisplayAgeForYear(
    year: number,
    _firstCategoryYear: number | null,
    _lastCategoryYear: number | null,
  ): number | '' {
    const birthDate = this.getClientBirthDate();
    if (!birthDate || !Number.isFinite(year)) {
      return '';
    }
    const age = getProjectionColumnAgeLabel(
      birthDate,
      year,
      this.forecastStartDate ?? undefined,
      this.planDuration,
    );
    return Number.isNaN(age) ? '' : age;
  }

  private getClientBirthDate(): Date | null {
    const raw = this.client?.clientDetails?.birthDate;
    if (!raw) return null;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
