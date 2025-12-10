import { Component, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import moment from 'moment';
import { ChartSeries } from '../../models/charts-series.model';
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
export class ViewSavingsBarStackedChartComponent implements OnChanges {
  @ViewChild("chart") chart: ChartComponent;
  @Input() report: ChartSeries;
  @Input() forecastStartDate: Date;
  @Input() forecastEndDate: Date;
  @Input() client: Client;
  @Input() cashFlowName: string;

  isFullscreen: any;
  public chartOptions: any;

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
          const age = [(Math.floor(xValue) - moment(this.client.clientDetails.birthDate).year())]
          return `
          <div class="savings-tooltip">
            <div class="savings-tooltip__header">
              <div>Age: ${age} </div>  <div> Year: ${xValue}</div> 
            </div>
            <div class="savings-tooltip__body">
              <div class="savings-tooltip__label">${seriesName}:</div>
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
        offsetX: 100,
        fillColors: ['#4CAF50', '#8BC34A', '#FF5722', '#FF5700']
      },
      fill: {
        opacity: 1,
      },
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['report'] && this.report?.series?.length) {
      const seriesList = this.report.series;
      const seriesColors = this.chartOptions.colors || [];

      // dynamically build fillColors array based on series names
      const fillColors = seriesList.map((s, i) =>
        s.name === 'Current Account (Negative)' ? 'transparent' : s.color
      );
      console.log(fillColors);
      this.chartOptions.legend = {
        ...this.chartOptions.legend,
        formatter: (seriesName: string, opts: any) =>
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
    }

    if (changes['forecastStartDate'] || changes['forecastEndDate']) {
      this.chartOptions.xaxis = {
        type: 'category', // treat x-axis as numbers (years)
        categories: this.report.categories,
        stepSize: 5, // each year is a distinct tick
        tickAmount: Math.floor((moment(this.forecastEndDate).year() - moment(this.forecastStartDate).year()) / 5),
        style: {
          cssClass: 'leftAlign'
        },
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
}