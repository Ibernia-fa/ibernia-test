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
  private emergencyExpenseIconEl: HTMLElement | null = null;
  private emergencyExpenseLineEl: HTMLElement | null = null;
  private shortfallDataPointIndex: number = -1;
  private emergencyExpenseDataPointIndex: number = -1;

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
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: false
          },
          dynamicAnimation: {
            enabled: true,
            speed: 400,
          },
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
        const color = w.globals.colors[i];
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
    const parsedHeight = Number(this.chartHeight);
    const effectiveHeight =
      Number.isFinite(parsedHeight) && parsedHeight > 0
        ? parsedHeight
        : 500;

    this.chartOptions.chart = {
      ...this.chartOptions.chart,
      height: effectiveHeight
    };

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

      const seriesList = report.series;
      const seriesColors = this.chartOptions.colors || [];

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

      // goals and events dots
      this.events = report.timelineEvents ?? [];

      // Build annotations: event dots + emergency year highlight
      const eventAnnotations = this.events.length > 0
        ? this.buildEventAnnotations(this.events)
        : [];
      const emergencyXAxis = this.buildEmergencyAnnotation(report);
      const emergencyExpenseXAxis = this.buildEmergencyExpenseAnnotation(report);

      this.chartOptions.annotations = {
        points: eventAnnotations,
        xaxis: [...emergencyXAxis, ...emergencyExpenseXAxis]
      };

      setTimeout(() => {
        if (this.events.length > 0) this.attachHtmlTooltips();
        this.attachEmergencyIcon();
        this.attachEmergencyExpenseIcon();
      }, 500);
    }

    this.chartOptions.chart = { ...this.chartOptions.chart };

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

    if (changes['report'] || changes['forecastStartDate'] || changes['forecastEndDate']) {
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
    if (this.emergencyIconEl) {
      this.emergencyIconEl.remove();
      this.emergencyIconEl = null;
    }
    if (this.emergencyExpenseIconEl) {
      this.emergencyExpenseIconEl.remove();
      this.emergencyExpenseIconEl = null;
    }
    if (this.emergencyExpenseLineEl) {
      this.emergencyExpenseLineEl.remove();
      this.emergencyExpenseLineEl = null;
    }
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
   * Builds an xaxis annotation (red band) for the first year where the shortfall begins.
   * Also stores the data-point index so the ⚠ icon can be placed via DOM.
   */
  private buildEmergencyAnnotation(report: ChartSeries): any[] {
    this.shortfallDataPointIndex = -1;
    const shortfallSeries = report?.series?.find(s => s.name === 'Shortfall');
    if (!shortfallSeries) return [];

    const index = shortfallSeries.data.findIndex(v => v < 0);
    if (index < 0) return [];

    const year = report.categories[index];
    if (!year) return [];

    this.shortfallDataPointIndex = index;

    return [{
      x: year,
      x2: year,
      fillColor: '#FF4560',
      opacity: 0.15,
      label: { text: '' }
    }];
  }

  /**
   * Builds an xaxis annotation (amber band) for the year where the Emergency Expense falls.
   * Also stores the data-point index so a 💸 icon can be placed via DOM.
   */
  private buildEmergencyExpenseAnnotation(report: ChartSeries): any[] {
    this.emergencyExpenseDataPointIndex = -1;
    const emergencySeries = report?.series?.find(s => s.name === 'Emergency Expense');
    if (!emergencySeries) return [];

    const index = emergencySeries.data.findIndex(v => v > 0);
    if (index < 0) return [];

    const year = report.categories[index];
    if (!year) return [];

    this.emergencyExpenseDataPointIndex = index;

    return [{
      x: year,
      x2: year,
      fillColor: '#FF4560',
      opacity: 0.2,
      label: { text: '' }
    }];
  }

  /**
   * Places the emergency icon above the chart column for the Emergency Expense year.
   * Uses x-center from a visible bar at that column, and y from the chart inner plot area top
   * so the icon is always visible regardless of how small the emergency expense bar is.
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
    if (this.emergencyExpenseDataPointIndex < 0) return;

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const allSeries = chartHost.querySelectorAll('.apexcharts-bar-series .apexcharts-series');
    if (!allSeries.length) return;

    // Get x-center and width from any visible bar at the emergency column
    let barCenterX = 0;
    let barWidth = 30;
    let found = false;

    allSeries.forEach(seriesGroup => {
      if (found) return;
      const bars = seriesGroup.querySelectorAll<SVGPathElement>('path.apexcharts-bar-area');
      const bar = bars[this.emergencyExpenseDataPointIndex];
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      if (rect.width === 0) return;

      barCenterX = rect.left + rect.width / 2;
      barWidth = rect.width;
      found = true;
    });

    if (!found) return;

    const hostRect = chartHost.getBoundingClientRect();

    // Use the inner plot area top for y-anchor so icon is always visible
    const innerPlot = chartHost.querySelector<SVGElement>('.apexcharts-inner.apexcharts-graphical');
    const plotTop = innerPlot
      ? innerPlot.getBoundingClientRect().top - hostRect.top
      : 10;

    const icon = document.createElement('div');
    icon.textContent = '⚠';
    icon.style.position = 'absolute';
    icon.style.pointerEvents = 'none';
    icon.style.zIndex = '11';
    icon.style.lineHeight = '1';
    icon.style.fontSize = '18px';
    icon.style.color = '#FF4560';
    icon.style.transform = 'translateX(-50%)';
    icon.style.left = `${barCenterX - hostRect.left}px`;

    const hostPosition = getComputedStyle(chartHost).position;
    if (hostPosition === 'static') {
      chartHost.style.position = 'relative';
    }

    const iconTop = Math.max(4, plotTop - 4);
    icon.style.top = `${iconTop}px`;

    // Find the top of the topmost bar segment at the emergency column
    let barTopY: number | null = null;
    allSeries.forEach(seriesGroup => {
      const bars = seriesGroup.querySelectorAll<SVGPathElement>('path.apexcharts-bar-area');
      const bar = bars[this.emergencyExpenseDataPointIndex];
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      if (rect.width === 0) return; // skip hidden/unrendered bars
      const relTop = rect.top - hostRect.top;
      if (barTopY === null || relTop < barTopY) {
        barTopY = relTop;
      }
    });

    // Draw vertical red connector line from icon top to bar top
    const lineEndY = barTopY ?? plotTop + 20; // fallback to just below plot top
    if (lineEndY > iconTop + 2) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.pointerEvents = 'none';
      line.style.zIndex = '10';
      line.style.width = `${barWidth}px`;
      line.style.backgroundColor = '#FF4560';
      line.style.opacity = '0.25';
      line.style.left = `${barCenterX - hostRect.left - barWidth / 2}px`;
      line.style.top = `${iconTop + 18}px`; // start just below the icon character
      line.style.height = `${lineEndY - (iconTop + 18)}px`;
      chartHost.appendChild(line);
      this.emergencyExpenseLineEl = line;
    }

    chartHost.appendChild(icon);
    this.emergencyExpenseIconEl = icon;
  }

  /**
   * Places a ⚠ icon above the top of the stacked bar at the shortfall year.
   * Uses an absolutely-positioned HTML element over the chart to avoid SVG clip-path issues.
   */
  private attachEmergencyIcon(): void {
    // Clean up previous icon
    if (this.emergencyIconEl) {
      this.emergencyIconEl.remove();
      this.emergencyIconEl = null;
    }
    if (this.shortfallDataPointIndex < 0) return;

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    // Find all bar series groups
    const allSeries = chartHost.querySelectorAll('.apexcharts-bar-series .apexcharts-series');
    if (!allSeries.length) return;

    // Find the topmost bar segment at the shortfall index using screen coordinates
    let minTop = Infinity;
    let barCenterX = 0;
    let found = false;

    allSeries.forEach(seriesGroup => {
      const bars = seriesGroup.querySelectorAll<SVGPathElement>('path.apexcharts-bar-area');
      const bar = bars[this.shortfallDataPointIndex];
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      if (rect.height === 0 && rect.width === 0) return;

      if (rect.top < minTop) {
        minTop = rect.top;
        barCenterX = rect.left + rect.width / 2;
        found = true;
      }
    });

    if (!found) return;

    // Get chart host position for relative placement
    const hostRect = chartHost.getBoundingClientRect();

    // Create an absolutely positioned HTML element
    const icon = document.createElement('div');
    icon.textContent = '⚠';
    icon.style.position = 'absolute';
    icon.style.color = '#FF4560';
    icon.style.fontSize = '18px';
    icon.style.fontWeight = '700';
    icon.style.pointerEvents = 'none';
    icon.style.zIndex = '10';
    icon.style.lineHeight = '1';
    icon.style.transform = 'translateX(-50%)';
    icon.style.left = `${barCenterX - hostRect.left}px`;
    icon.style.top = `${minTop - hostRect.top - 22}px`;

    // Make sure chart host is positioned for absolute children
    const hostPosition = getComputedStyle(chartHost).position;
    if (hostPosition === 'static') {
      chartHost.style.position = 'relative';
    }

    chartHost.appendChild(icon);
    this.emergencyIconEl = icon;
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
