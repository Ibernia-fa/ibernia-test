import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgApexchartsModule } from 'ng-apexcharts';
import moment from 'moment';
import { ChartSeries, Series, TimelineEvent } from '../../models/charts-series.model';
import { Client } from 'src/app/clients/models/client';

@Component({
  selector: 'app-view-savings-bar-stacked-chart',
  imports: [
    TablerIconsModule,
    MatCardModule,
    NgApexchartsModule
  ],
  templateUrl: './view-savings-bar-stacked-chart.component.html',
  styleUrl: './view-savings-bar-stacked-chart.component.scss'
})
export class ViewSavingsBarStackedChartComponent implements OnChanges, OnDestroy {
  @ViewChild("chart", { read: ElementRef }) chartElRef: ElementRef<HTMLDivElement>;
  @Input() report: ChartSeries;
  @Input() forecastStartDate: Date;
  @Input() forecastEndDate: Date;
  @Input() client: Client;
  @Input() cashFlowName: string;

  isFullscreen: any;
  public chartOptions: any;
  events: TimelineEvent[] = [];
  private tooltipElements: HTMLElement[] = [];
  private markerListeners: Array<{
    marker: SVGElement;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }> = [];
  private _postRenderTimer: any = null;
  private _tooltipRetryTimer: any = null;

  constructor() {
    this.chartOptions = {

      series: [
      ],
      chart: {
        type: "bar",
        height: 500,
        stacked: true,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        states: {
          hover: {
            filter: { type: 'none' }
          },
          active: {
            filter: { type: 'none' }
          }
        },
        events: {
          mounted: () => this.postRenderSetup(),
          updated: () => this.postRenderSetup(),
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
          const comp = (this as unknown as ViewSavingsBarStackedChartComponent);
          const { series, dataPointIndex, w } = opts;

          const xValue = w.globals.labels[dataPointIndex];
          const year = Number(xValue);
          const labels = w.globals.labels ?? [];
          const firstYear = labels.length ? Number(labels[0]) : null;
          const lastYear = labels.length ? Number(labels[labels.length - 1]) : null;
          const age = comp.getDisplayAgeForYear(year, Number.isFinite(firstYear) ? firstYear : null, Number.isFinite(lastYear) ? lastYear : null);

          const bodyRows = w.globals.seriesNames
            .map((seriesName: string, i: number) => {
              const value = series[i]?.[dataPointIndex];
              if (value === undefined || (typeof value === 'number' && value === 0)) return '';
              const originalSeries = comp.report?.series?.find((s: Series) => s.name === seriesName);
              const color = (originalSeries?.color && originalSeries.color !== 'transparent') ? originalSeries.color : w.globals.colors[i];
              const displayValue = typeof value === 'number'
                ? comp.formatCurrency(value)
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
            },
          },
        },
      ],
      plotOptions: {
        bar: {
          horizontal: false,
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
        offsetX: 100,
        fillColors: ['#4CAF50', '#8BC34A', '#FF5722', '#FF5700']
      },
      fill: {
        opacity: 1,
      },
      annotations: { points: [] },
    };
  }

  /** Trims report to only include years up to forecastEndDate (projection end year). */
  private trimReportToEndYear(report: ChartSeries | null | undefined): ChartSeries | null | undefined {
    if (!report?.categories?.length || !this.forecastEndDate) return report;
    const endYear = moment(this.forecastEndDate).year();
    const indicesToKeep: number[] = [];
    report.categories.forEach((cat, i) => {
      const y = Number(cat);
      if (Number.isFinite(y) && y <= endYear) indicesToKeep.push(i);
    });
    if (indicesToKeep.length === report.categories.length) return report;
    const categories = indicesToKeep.map((i) => report.categories[i]);
    const series = report.series.map((s) => ({
      ...s,
      data: indicesToKeep.map((i) => s.data[i] ?? 0),
    }));
    const timelineEvents = (report.timelineEvents ?? []).filter((e) =>
      Number.isFinite(e.startYear) && e.startYear <= endYear
    );
    return { ...report, categories, series, timelineEvents };
  }

  ngOnChanges(changes: SimpleChanges): void {
    const report = this.trimReportToEndYear(this.report);

    if (changes['report'] && report?.series?.length) {
      const seriesList = report.series;

      // dynamically build fillColors array based on series names (match advisor)
      const fillColors = seriesList.map((s: Series) =>
        s.name === 'Current Account (Negative)' || s.name === 'Emergency Expense' ? 'transparent' : s.color
      );
      this.chartOptions.legend = {
        ...this.chartOptions.legend,
        showForZeroSeries: false, // hide Cash when all zeros (shortfall scenario)
        formatter: (seriesName: string) =>
          seriesName === 'Current Account (Negative)' || seriesName === 'Emergency Expense' ? '' : seriesName,
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

      this.events = report.timelineEvents ?? [];
      this.chartOptions.annotations = { points: this.buildEventAnnotations(this.events) };
      this.chartOptions.series = report.series.map((s) => ({ ...s, tack: 'stack1' }));

      if (this.events.length === 0) {
        this.cleanupHtmlTooltips();
      }
      // Tooltip attachment is handled by postRenderSetup() via ApexCharts
      // mounted/updated events, avoiding race conditions with the DOM.
    } else if (changes['report']) {
      this.chartOptions.annotations = { points: [] };
      this.cleanupHtmlTooltips();
    }

    if (changes['report'] || changes['forecastStartDate'] || changes['forecastEndDate']) {
      const categories = report?.categories ?? [];
      const firstCategoryYear = categories.length ? Number(categories[0]) : null;
      const lastCategoryYear = categories.length ? Number(categories[categories.length - 1]) : null;
      this.chartOptions.xaxis = {
        type: 'category',
        categories,
        stepSize: 5,
        tickAmount: Math.floor((moment(this.forecastEndDate).year() - moment(this.forecastStartDate).year()) / 5),
        style: {
          cssClass: 'leftAlign'
        },
        labels: {
          formatter: (value: string) => {
            const year = Number(value);
            const age = this.getDisplayAgeForYear(
              year,
              Number.isFinite(firstCategoryYear) ? firstCategoryYear : null,
              Number.isFinite(lastCategoryYear) ? lastCategoryYear : null
            );
            return age === '' ? value : String(age);
          }
        }
      }
    }

    if (changes['client']) {
      this.chartOptions.yaxis = {
        title: {
          text: this.client.clientDetails.preferredCurrency
        },
        labels: {
          formatter: (value: any) => {
            return value?.toLocaleString();
          }
        }
      }
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this._postRenderTimer);
    clearTimeout(this._tooltipRetryTimer);
    this.cleanupHtmlTooltips();
  }

  private postRenderSetup(): void {
    clearTimeout(this._postRenderTimer);
    this._postRenderTimer = setTimeout(() => {
      this.cleanupHtmlTooltips();
      if (this.events.length > 0) {
        this.attachHtmlTooltips();
      }
    }, 50);
  }

  private buildEventAnnotations(events: TimelineEvent[]) {
    const eventsByYear = new Map<string, TimelineEvent[]>();
    const dotSpacing = 10;

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
            offsetY: -(index * dotSpacing),
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

  private attachHtmlTooltips(retryCount = 0) {
    clearTimeout(this._tooltipRetryTimer);
    this.cleanupHtmlTooltips();

    const chartHost = this.chartElRef?.nativeElement;
    if (!chartHost) return;

    const markers = chartHost.querySelectorAll<SVGElement>('.apexcharts-point-annotation-marker');

    if (markers.length === 0 && this.events.length > 0 && retryCount < 6) {
      this._tooltipRetryTimer = setTimeout(
        () => this.attachHtmlTooltips(retryCount + 1),
        150 * (retryCount + 1)
      );
      return;
    }

    const tooltipHost = this.getTooltipHost();

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

  private getTooltipHost(): HTMLElement {
    const fullscreenOverlay = document.querySelector<HTMLElement>('.global-fullscreen-overlay');
    return fullscreenOverlay ?? document.body;
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

  private calculateDotColor(iconUrl: string): string {
    return this.ICON_COLORS[iconUrl] ?? '#8388ff';
  }

  private getDisplayAgeForYear(year: number, firstCategoryYear: number | null, lastCategoryYear: number | null): number | '' {
    if (!Number.isFinite(year)) {
      return '';
    }

    // If report already sends age values instead of calendar years, keep them as-is.
    if (year < 1000) {
      return year;
    }

    const birthDate = this.getClientBirthDate();
    if (!birthDate) {
      return '';
    }

    // First year: age at forecast start (e.g. 45 if projection starts before they turn 46).
    if (
      firstCategoryYear != null &&
      year === firstCategoryYear &&
      this.forecastStartDate
    ) {
      return this.calculateAgeAtDate(this.forecastStartDate, birthDate);
    }
    // Age at start of year (Jan 1) to match timeline chart convention
    return this.calculateAgeAtDate(new Date(year, 0, 1), birthDate);
  }

  private calculateAgeAtDate(referenceDate: Date, birthDate: Date): number {
    const date = new Date(referenceDate);
    let age = date.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      date.getMonth() > birthDate.getMonth() ||
      (date.getMonth() === birthDate.getMonth() && date.getDate() >= birthDate.getDate());
    if (!hasBirthdayPassed) age--;
    return age;
  }

  private getClientBirthDate(): Date | null {
    const raw = this.client?.clientDetails?.birthDate;
    if (!raw) return null;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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
}
