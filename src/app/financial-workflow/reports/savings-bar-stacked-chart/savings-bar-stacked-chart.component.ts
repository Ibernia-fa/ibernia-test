import { Component, ViewChild, Input, OnChanges, OnDestroy, SimpleChanges, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ChartSeries, TimelineEvent } from '../models/charts-series.model';
import { Client } from 'src/app/clients/models/client';
import moment from 'moment';
import { set } from 'date-fns';

@Component({
  selector: 'app-savings-bar-stacked-chart',
  imports: [
    TablerIconsModule,
    MatCardModule,
    NgApexchartsModule
  ],
  templateUrl: './savings-bar-stacked-chart.component.html',
  styleUrl: './savings-bar-stacked-chart.component.scss'
})
export class SavingsBarStackedChartComponent implements OnChanges, OnDestroy {
  // @ViewChild("chart") chart: ChartComponent;
  @ViewChild("chart", { read: ElementRef }) chartElRef: ElementRef<HTMLDivElement>;
  @Input() report: ChartSeries;
  @Input() forecastStartDate: Date;
  @Input() forecastEndDate: Date;
  @Input() client: Client;
  @Input() cashFlowName: string;
  @Input() chartHeight: number = 500;
  @Input() emergencyIconUrl?: string;
  /** When true, enables smooth bar morphing animation on data updates (dynamicAnimation). */
  @Input() animateUpdates: boolean = false;
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
  private shortfallDataPointIndex: number = -1;
  private emergencyExpenseDataPointIndex: number = -1;
  /** Tracks whether the chart has been rendered at least once (used to skip full re-inits on subsequent series updates). */
  private chartInitialized = false;
  /** Last categories string used to detect genuine axis changes vs. same-length updates. */
  private previousCategoriesKey = '';

  private getCurrencyAxisTitle(): string {
    return this.client?.clientDetails?.preferredCurrency ?? '';
  }

  constructor() {
    this.chartOptions = {
      series: [],
      chart: {
        type: "bar",
        height: 500,
        stacked: true,
        animations: {
          // Keep disabled by default to preserve existing report-page behavior.
          // Scenario Lab passes `animateUpdates=true`, which turns this on in ngOnChanges.
          enabled: false,
          dynamicAnimation: {
            enabled: true,
            speed: 450,
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
              type: 'none'
            }
          },
          active: {
            filter: {
              type: 'none'
            }
          }
        },
        events: {
          dataPointSelection: () => undefined
        },
        selection: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
  enabled: true,
  shared: true,
  intersect: false,
  custom: (opts: any) => {
    const { series, dataPointIndex, w } = opts;

    const xValue = w.globals.labels[dataPointIndex];
    const year = Number(xValue);
    const firstYear = Number(w.globals.labels?.[0]);
    const age = this.getDisplayAgeForYear(year, firstYear);

    const bodyRows = w.globals.seriesNames
      .map((seriesName: string, i: number) => {
        const value = series[i]?.[dataPointIndex];
        if (value === undefined || (typeof value === 'number' && value === 0)) return '';
        // Use the original series color (before transparent override) so tooltip dots are always visible
        const originalSeries = this.report?.series?.find(s => s.name === seriesName);
        const color = (originalSeries?.color && originalSeries.color !== 'transparent') ? originalSeries.color : w.globals.colors[i];
        const displayValue = typeof value === 'number'
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

    return `
      <div class="savings-tooltip">
        <div class="savings-tooltip__header">
          <div>Age: ${age} </div>  <div> Year: ${xValue}</div> 
        </div>
        ${bodyRows}
      </div>
    `;
  }
},
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "bottom",
              offsetX: -10,
              offsetY: 0,
              onItemClick: {
                toggleDataSeries: false
              }
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
                type: 'none'
              }
            }
          }
        },
      },
      grid: {
        show: true,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        offsetX: 0,
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
      annotations: { points: [] }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    const hideEmergencyOverlays = this.emergencyIconUrl === 'none';

    const parsedHeight = Number(this.chartHeight);
    const effectiveHeight =
      Number.isFinite(parsedHeight) && parsedHeight > 0
        ? parsedHeight
        : 500;

    // Only update chart options (triggers full re-render) when chartHeight itself changed.
    // Doing this unconditionally was causing a full re-render on every series update.
    if (changes['chartHeight']) {
      this.chartOptions.chart = {
        ...this.chartOptions.chart,
        height: effectiveHeight
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
        }
      };
    }

    if (!this.report?.series?.length) {
      if (changes['client'] && this.client) {
        this.chartOptions.yaxis = {
          title: {
            text: this.getCurrencyAxisTitle(),
            style: { fontWeight: 500 }
          },
          labels: {
            formatter: (value: any) => value != null ? Number(value).toLocaleString() : '',
          },
        };
      }
      return;
    }

    const report = this.report;

    if (changes['report']) {
      this.cleanupHtmlTooltips();
      this.cleanupEmergencyElements();
      this.cleanupEventLabels();

      // goals and events dots
      this.events = report.timelineEvents ?? [];

      // Always compute shortfall/emergency indices (needed for overlay rendering)
      const emergencyXAxis = hideEmergencyOverlays ? [] : this.buildEmergencyAnnotation(report);
      const emergencyExpenseXAxis = hideEmergencyOverlays ? [] : this.buildEmergencyExpenseAnnotation(report);

      // Only rebuild legend and annotations when NOT in animated-update mode (or on first render).
      // Re-assigning these inputs triggers ng-apexcharts updateOptions → full re-render.
      if (!this.animateUpdates || !this.chartInitialized) {
        const seriesList = report.series;

        // dynamically build fillColors array based on series names
        const fillColors = seriesList.map((s, i) => {
          if (s.name === 'Current Account (Negative)' || s.name === 'Emergency Expense') {
            return 'transparent';
          }
          return s.color
        });

        // legends formatter to hide specific series names
        this.chartOptions.legend = {
          ...this.chartOptions.legend,

          formatter: (seriesName: string) => {
            if (seriesName === 'Current Account (Negative)' || seriesName === 'Emergency Expense') {
              return '';
            }
            return seriesName;
          },
          markers: {
            fillColors: fillColors
          },
          onItemClick: {
            toggleDataSeries: true
          },
          onItemHover: {
            highlightDataSeries: true
          }
        };

        this.chartOptions.annotations = {
          points: this.buildEventAnnotations(this.events),
          xaxis: [...emergencyXAxis, ...emergencyExpenseXAxis]
        };
      }

      setTimeout(() => {
        if (this.events.length > 0) {
          this.attachHtmlTooltips();
        }
        if (hideEmergencyOverlays) {
          this.cleanupEmergencyElements();
        } else {
          this.attachEmergencyExpenseIcon();
          // Show the shortfall icon only when there is no emergency-expense column.
          // If an emergency expense exists it already marks the relevant date; showing
          // a second shortfall icon on a different column would be confusing.
          if (this.emergencyExpenseDataPointIndex < 0) {
            this.attachEmergencyIcon();
          } else {
            // Clean up any stale shortfall overlay from a previous render
            if (this.emergencyIconEl) { this.emergencyIconEl.remove(); this.emergencyIconEl = null; }
            if (this.emergencyIconLineEl) { this.emergencyIconLineEl.remove(); this.emergencyIconLineEl = null; }
            if (this.emergencyIconBandEl) { this.emergencyIconBandEl.remove(); this.emergencyIconBandEl = null; }
          }
        }
      }, 600);
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
    // Skipping this when animateUpdates + same categories avoids triggering updateOptions (full re-render).
    const currentCategoriesKey = (report.categories ?? []).join(',');
    const categoriesChanged = currentCategoriesKey !== this.previousCategoriesKey;
    this.previousCategoriesKey = currentCategoriesKey;
    this.chartInitialized = true;

    if (!this.animateUpdates || categoriesChanged || changes['forecastStartDate'] || changes['forecastEndDate']) {
    const categories = report.categories ?? [];

    let firstYear = categories.length ? Number(categories[0]) : undefined;
    let lastYear = categories.length ? Number(categories[categories.length - 1]) : undefined;

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

    const firstCategoryYear = Number.isFinite(firstYear) ? Number(firstYear) : null;

    this.chartOptions.xaxis = {
      type: 'category',
      categories, // keep years for data mapping; display as age via formatter
      tickAmount,
      title: {
        text: 'Age',
        offsetY: 0,
        style: {
          fontWeight: 500
        }
      },
      labels: {
        style: { cssClass: 'leftAlign' },
        formatter: (value: string) => {
          const year = Number(value);
          const age = this.getDisplayAgeForYear(year, firstCategoryYear);
          return age === '' ? value : String(age);
        },
      },
    };
  }

    if (changes['client']) {
      this.chartOptions.yaxis = {
        title: {
          text: this.getCurrencyAxisTitle(),
          style: { fontWeight: 500 }
        },
        labels: {
          formatter: (value: any) => value != null ? Number(value).toLocaleString() : '',
        }
      };
      const birthYear = this.client?.clientDetails?.birthDate
        ? moment(this.client.clientDetails.birthDate).year()
        : null;
      if (this.chartOptions.xaxis?.labels && birthYear != null) {
        const firstCategoryYear = Number(this.chartOptions.xaxis?.categories?.[0]);
        this.chartOptions.xaxis = {
          ...this.chartOptions.xaxis,
          labels: {
            ...this.chartOptions.xaxis.labels,
            formatter: (value: string) => {
              const year = Number(value);
              const age = this.getDisplayAgeForYear(year, Number.isFinite(firstCategoryYear) ? firstCategoryYear : null);
              return age === '' ? value : String(age);
            },
          },
        };
      }
    }

    // final series assignment
    this.chartOptions.series = report.series.map((s, idx) => ({
      ...s,
      color: (s.name === 'Current Account (Negative)' || s.name === 'Emergency Expense') ? 'transparent' : s.color,
      tack: 'stack1',
      order: s.name === 'Emergency Expense' ? report.series.length : idx,
      fill: {
        opacity: 1
      },
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.15
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      }
    }));
  }

  ngOnDestroy(): void {
    this.cleanupHtmlTooltips();
    this.cleanupEmergencyElements();
    this.cleanupEventLabels();
  }

  private cleanupEmergencyElements(): void {
    for (const key of [
      'emergencyIconEl', 'emergencyIconLineEl', 'emergencyIconBandEl',
      'emergencyExpenseIconEl', 'emergencyExpenseLineEl', 'emergencyExpenseBandEl'
    ] as const) {
      const el = this[key] as HTMLElement | null;
      if (el) { el.remove(); (this as any)[key] = null; }
    }
  }

  private cleanupEventLabels(): void {
    this.eventLabelElements.forEach(el => el.remove());
    this.eventLabelElements = [];
  }

  buildEventAnnotations(events: TimelineEvent[]) {
    const eventsByYear = new Map<string, TimelineEvent[]>();
    const DOT_SPACING = 10;

    events.forEach(event => {
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
              <img src="/assets/images/svgs/${event.iconUrl}.svg" alt="${event.iconUrl}" />
              <span>${event.name}</span>
            </div>`
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
    this.events.forEach(event => {
      const year = event.startYear.toString();
      if (!eventsByYear.has(year)) eventsByYear.set(year, []);
      eventsByYear.get(year)!.push(event);
    });

    const labelHost = this.getTooltipHost();

    eventsByYear.forEach((groupEvents, year) => {
      groupEvents.forEach((event, index) => {
        // Find marker position for this event
        const markers = chartHost.querySelectorAll<SVGElement>('.apexcharts-point-annotation-marker');
        let markerCenterX = 0;
        let markerCenterY = 0;
        let found = false;

        // Match marker by checking if it's at this year with this event name in tooltip
        markers.forEach((marker) => {
          if (found) return;
          const annotationIdx = Array.from(markers).indexOf(marker);
          if (this.chartOptions.annotations?.points[annotationIdx]?.customTooltip?.includes(event.name)) {
            const rect = marker.getBoundingClientRect();
            markerCenterX = rect.left + rect.width / 2;
            markerCenterY = rect.top + rect.height / 2;
            found = true;
          }
        });

        if (!found) return;

        // Create label element with FIXED positioning (not clipped by chart overflow)
        const label = document.createElement('div');
        label.textContent = event.name;
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
    const shortfallSeries = report?.series?.find(s => s.name === 'Shortfall');
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
    const emergencySeries = report?.series?.find(s => s.name === 'Emergency Expense');
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
    if (this.emergencyExpenseIconEl) { this.emergencyExpenseIconEl.remove(); this.emergencyExpenseIconEl = null; }
    if (this.emergencyExpenseLineEl) { this.emergencyExpenseLineEl.remove(); this.emergencyExpenseLineEl = null; }
    if (this.emergencyExpenseBandEl) { this.emergencyExpenseBandEl.remove(); this.emergencyExpenseBandEl = null; }
    if (this.emergencyExpenseDataPointIndex < 0) return;

    this.attachColumnOverlay(
      this.emergencyExpenseDataPointIndex,
      (icon, line, band) => {
        this.emergencyExpenseIconEl = icon;
        this.emergencyExpenseLineEl = line;
        this.emergencyExpenseBandEl = band;
      }
    );
  }

  /**
   * Places the shortfall ⚠ icon at the top of the plot area, draws a full-height
   * background band, and a vertical connector line from icon to the bar top.
   */
  private attachEmergencyIcon(): void {
    if (this.emergencyIconEl) { this.emergencyIconEl.remove(); this.emergencyIconEl = null; }
    if (this.emergencyIconLineEl) { this.emergencyIconLineEl.remove(); this.emergencyIconLineEl = null; }
    if (this.emergencyIconBandEl) { this.emergencyIconBandEl.remove(); this.emergencyIconBandEl = null; }
    if (this.shortfallDataPointIndex < 0) return;

    this.attachColumnOverlay(
      this.shortfallDataPointIndex,
      (icon, line, band) => {
        this.emergencyIconEl = icon;
        this.emergencyIconLineEl = line;
        this.emergencyIconBandEl = band;
      }
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
    assign: (icon: HTMLElement, line: HTMLElement | null, band: HTMLElement | null) => void
  ): void {
    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const allSeries = chartHost.querySelectorAll('.apexcharts-bar-series .apexcharts-series');
    if (!allSeries.length) return;

    // Locate bar center-X and width at the target column
    let barCenterX = 0;
    let barWidth = 30;
    let foundBar = false;

    allSeries.forEach((seriesGroup: Element) => {
      if (foundBar) return;
      const bars = seriesGroup.querySelectorAll<SVGPathElement>('path.apexcharts-bar-area');
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
    const plotBottom = gridRect ? gridRect.bottom - hostRect.top : hostRect.height - 10;

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
    const iconSize = 18; // px — matches font-size
    const iconTop = Math.max(2, plotTop - iconSize - 2);
    const icon = document.createElement('div');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF4560" width="${iconSize}" height="${iconSize}"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`;
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

  private attachHtmlTooltips() {
    this.cleanupHtmlTooltips();

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;
    const tooltipHost = this.getTooltipHost();

    const markers = chartHost.querySelectorAll<SVGElement>('.apexcharts-point-annotation-marker');

    markers.forEach((marker, i) => {
      const annotation = this.chartOptions.annotations.points[i];
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
    // Look for dialog container first (highest priority)
    const dialogContainer = document.querySelector<HTMLElement>('.cdk-overlay-container');
    if (dialogContainer) return dialogContainer;

    const fullscreenOverlay = document.querySelector<HTMLElement>('.global-fullscreen-overlay');
    return fullscreenOverlay ?? document.body;
  }

  private cleanupHtmlTooltips(): void {
    this.chartElRef?.nativeElement?.classList.remove('event-tooltip-active');

    this.markerListeners.forEach(({ marker, onMouseEnter, onMouseLeave }) => {
      marker.removeEventListener('mouseenter', onMouseEnter);
      marker.removeEventListener('mouseleave', onMouseLeave);
    });
    this.markerListeners = [];

    this.tooltipElements.forEach((tooltip) => tooltip.remove());
    this.tooltipElements = [];
  }

  private readonly ICON_COLORS: Record<string, string> = {
    'birth-icon': '#feb63d',
    'retirement-age-icon': '#ff8f6b',
    'inheritance-icon': '#00d492',
    'wedding-icon': '#7b3dfe',
    'state-pension-icon': '#516ce8',
    'home-icon': '#016aa2',
    'travel-icon': '#363f72',
    'car-icon': '#b93814',
    'education-icon': '#3538cd',
    'new-business-icon': '#b42318',
    'boat-icon': '#047a48'
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

  private getDisplayAgeForYear(year: number, firstCategoryYear: number | null): number | '' {
    const birthDate = this.getClientBirthDate();
    if (!birthDate || !Number.isFinite(year)) {
      return '';
    }

    // Derive every age from the precise base age at the first plotted year
    // so the sequence always increments by exactly 1 per year (no gaps).
    if (
      firstCategoryYear != null &&
      Number.isFinite(firstCategoryYear) &&
      this.forecastStartDate
    ) {
      const baseAge = this.calculateAgeAtDate(this.forecastStartDate, birthDate);
      return baseAge + (year - firstCategoryYear);
    }

    // Fallback when there is no first category year or forecast start date
    const birthYear = birthDate.getFullYear();
    return year - birthYear;
  }

  private calculateAgeAtDate(referenceDate: Date, birthDate: Date): number {
    const date = new Date(referenceDate);
    let age = date.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      date.getMonth() > birthDate.getMonth() ||
      (date.getMonth() === birthDate.getMonth() &&
        date.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return age;
  }

  private getClientBirthDate(): Date | null {
    const raw = this.client?.clientDetails?.birthDate;
    if (!raw) return null;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
