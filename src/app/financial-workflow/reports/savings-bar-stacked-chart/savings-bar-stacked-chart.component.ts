import { CommonModule } from '@angular/common';
import { Component, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ChartSeries } from '../models/charts-series.model';
import { Client } from 'src/app/clients/models/client';
import moment from 'moment';

@Component({
  selector: 'app-savings-bar-stacked-chart',
  imports: [
    CommonModule,
    TablerIconsModule,
    MatCardModule,
    NgApexchartsModule
  ],
  templateUrl: './savings-bar-stacked-chart.component.html',
  styleUrl: './savings-bar-stacked-chart.component.scss'
})
export class SavingsBarStackedChartComponent implements OnChanges {
  @ViewChild("chart") chart: ChartComponent;
  @Input() report: ChartSeries;
  @Input() forecastStartDate: Date;
  @Input() forecastEndDate: Date;
  @Input() client: Client;
  @Input() cashFlowName: string;
  isFullscreen: any;
  public chartOptions: any;
  showChart = true;

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

          // build custom html
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
            </div>`;
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
      const filteredSeries = this.report.series.filter(s => {
        if (s.name !== 'Shortfall')
          return true;

        return s.data?.some((v: number) => v !== 0);
      });

      this.showChart = false;

      setTimeout(() => {
        this.chartOptions.series = filteredSeries;

        this.chartOptions.legend = {
          ...this.chartOptions.legend,
          markers: {
            fillColors: filteredSeries.map(s => s.color)
          },
          onItemClick: { toggleDataSeries: true },
          onItemHover: { highlightDataSeries: true }
        };

        this.showChart = true;
      });
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