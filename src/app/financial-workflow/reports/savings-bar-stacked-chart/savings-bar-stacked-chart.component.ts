import { Component, ViewChild, Input, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
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
export class SavingsBarStackedChartComponent implements OnChanges {
  // @ViewChild("chart") chart: ChartComponent;
  @ViewChild("chart", { read: ElementRef }) chartElRef: ElementRef<HTMLDivElement>;
  @Input() report: ChartSeries;
  @Input() forecastStartDate: Date;
  @Input() forecastEndDate: Date;
  @Input() client: Client;
  @Input() cashFlowName: string;
  isFullscreen: any;

  private readonly EVENT_DOT_SPACING = 20;
  public chartOptions: any;
  events: TimelineEvent[] = [];

  constructor() {
    this.chartOptions = {
      series: [],
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
      },
      dataLabels: {
        enabled: false
      },

      tooltip: {
        enabled: true,
        shared: false, // or true if you want stacked values together
        custom: (opts: any) => {
          const { series, seriesIndex, dataPointIndex, w } = opts;

          const value = series[seriesIndex][dataPointIndex];
          const seriesName = w.globals.seriesNames[seriesIndex];
          const xValue = w.globals.labels[dataPointIndex];
          const color = w.globals.colors[seriesIndex];

          const age = [(Math.floor(xValue) - moment(this.client.clientDetails.birthDate).year())]
          return `
          <div class="savings-tooltip">
            <div class="savings-tooltip__header">
              <div>Age: ${age} </div>  <div> Year: ${xValue}</div> 
            </div>
            <div class="savings-tooltip__body">
              <div class="savings-tooltip__label">
                  <span class="circle-wrapper" style="background-color: ${color};"></span>${seriesName}:</div>
              <div class="savings-tooltip__value">${value.toLocaleString()}</div>
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
        horizontalAlign: "right",
        offsetX: 100,
        fillColors: ['#4CAF50', '#8BC34A', '#FF5722', '#FF5700'],
        showForZeroSeries: false,

      },
      fill: {
        opacity: 1,
      },
      annotations: { points: [] }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['report'] && this.report?.series?.length) {
      const seriesList = this.report.series;
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
      this.events = this.report.timelineEvents;

      if (this.events.length > 0) {
        this.chartOptions.annotations = { points: this.buildEventAnnotations(this.events) };
        setTimeout(() => this.attachHtmlTooltips(), 500);
      }
    }

    this.chartOptions.chart = { ...this.chartOptions.chart };

    if (changes['forecastStartDate'] || changes['forecastEndDate']) {
      this.chartOptions.xaxis = {
        type: 'category', // Treat x-axis as numbers (years)
        categories: this.report.categories,
        stepSize: 5, // Each year is a distinct tick
        tickAmount: Math.floor((moment(this.forecastEndDate).year() - moment(this.forecastStartDate).year()) / 5),
        style: {
          cssClass: 'leftAlign'
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

    this.chartOptions.series = this.report.series;
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

  private attachHtmlTooltips() {
    document.querySelectorAll('.custom-html-tooltip').forEach(t => t.remove());

    const markers = document.querySelectorAll<SVGElement>('.apexcharts-point-annotation-marker');

    markers.forEach((marker, i) => {
      const annotation = this.chartOptions.annotations.points[i];
      if (!annotation?.customTooltip) return;

      const tooltip = document.createElement('div');
      tooltip.className = 'custom-html-tooltip';
      tooltip.innerHTML = annotation.customTooltip;
      tooltip.style.position = 'absolute';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.zIndex = '9999';
      document.body.appendChild(tooltip);

      const rect = marker.getBoundingClientRect();

      marker.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        tooltip.style.left = `${rect.x + window.scrollX - tooltip.offsetWidth / 2 + rect.width / 2}px`;
        tooltip.style.top = `${rect.y + window.scrollY - tooltip.offsetHeight - 8}px`;
      });

      marker.addEventListener('mouseleave', () => tooltip.style.display = 'none');
    });
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
}