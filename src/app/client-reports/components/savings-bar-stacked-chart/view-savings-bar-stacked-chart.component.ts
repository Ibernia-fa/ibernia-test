import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgApexchartsModule } from 'ng-apexcharts';
import moment from 'moment';
import { ChartSeries, TimelineEvent } from '../../models/charts-series.model';
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
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        enabled: true,
        shared: false,
        custom: (opts: any) => {
          const { series, seriesIndex, dataPointIndex, w } = opts;

          const value = series[seriesIndex][dataPointIndex];
          const seriesName = w.globals.seriesNames[seriesIndex];
          const xValue = w.globals.labels[dataPointIndex];
          const year = Number(xValue);
          const firstYear = Number(w.globals.labels?.[0]);
          const age = this.getDisplayAgeForYear(year, Number.isFinite(firstYear) ? firstYear : null);
          return `
          <div class="savings-tooltip">
            <div class="savings-tooltip__header">
              <div>Age: ${age} </div>  <div> Year: ${xValue}</div> 
            </div>
            <div class="savings-tooltip__body">
              <div class="savings-tooltip__label">${seriesName}:</div>
              <div class="savings-tooltip__value">${Number(value ?? 0).toLocaleString()}</div>
            </div>
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['report'] && this.report?.series?.length) {
      const seriesList = this.report.series;

      // dynamically build fillColors array based on series names
      const fillColors = seriesList.map((s) =>
        s.name === 'Current Account (Negative)' ? 'transparent' : s.color
      );
      this.chartOptions.legend = {
        ...this.chartOptions.legend,
        formatter: (seriesName: string) =>
          seriesName === 'Current Account (Negative)' ? '' : seriesName,
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

      this.events = this.report.timelineEvents ?? [];
      this.chartOptions.annotations = { points: this.buildEventAnnotations(this.events) };
      this.chartOptions.series = this.report.series.map((s) => ({ ...s, tack: 'stack1' }));

      if (this.events.length > 0) {
        setTimeout(() => this.attachHtmlTooltips(), 500);
      } else {
        this.cleanupHtmlTooltips();
      }
    } else if (changes['report']) {
      this.chartOptions.annotations = { points: [] };
      this.cleanupHtmlTooltips();
    }

    if (changes['report'] || changes['forecastStartDate'] || changes['forecastEndDate']) {
      const categories = this.report?.categories ?? [];
      const firstCategoryYear = Number(categories[0]);
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
              Number.isFinite(firstCategoryYear) ? firstCategoryYear : null
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
    this.cleanupHtmlTooltips();
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

  private getDisplayAgeForYear(year: number, firstCategoryYear: number | null): number | '' {
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

    let age = year - birthDate.getFullYear();

    if (firstCategoryYear != null && year === firstCategoryYear && this.forecastStartDate) {
      age = this.calculateAgeAtDate(this.forecastStartDate, birthDate);
    }

    return age;
  }

  private calculateAgeAtDate(referenceDate: Date, birthDate: Date): number {
    const date = new Date(referenceDate);
    let age = date.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      date.getMonth() > birthDate.getMonth() ||
      (date.getMonth() === birthDate.getMonth() && date.getDate() >= birthDate.getDate());

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
