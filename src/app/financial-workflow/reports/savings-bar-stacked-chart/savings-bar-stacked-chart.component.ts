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

  public chartOptions: any;

  constructor() {
    this.chartOptions = {
      series: [
      ],
      chart: {
        type: "bar",
        height: 350,
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
              show: true
          }
        },   
        yaxis: {
            lines: {
                show: true
            }
        }, 
      },
      xaxis: {
        type: 'numeric', // Treat x-axis as numbers (years)
        min: 2023, // Start from 2023
        max: 2123, // End at 2133 for a 100-year range
        stepSize: 5, // Each year is a distinct tick
        tickAmount: 19,
        title: {
          text: 'Year'
        },
        offsetX:-10,
        style: {
          cssClass: 'leftAlign'
        },
        labels: {
          formatter: function(value: any) {
            return [(Math.floor(value)-1993), Math.floor(value)]; // Ensure the year is displayed as an integer (remove fraction part)
          }
        }
      },
      yaxis: {
        title: {
          text: 'AED'
        },
        labels: {
          formatter: function(value: any) {
            return 'AED ' + value;
          }
        }
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
    if (changes['forecastStartDate'] || changes['forecastEndDate']) {
      this.chartOptions.xaxis = {
        type: 'numeric', // Treat x-axis as numbers (years)
        min: moment(this.forecastStartDate).year(), // Start from 2023
        max: moment(this.forecastEndDate).year(), // End at 2133 for a 100-year range
        stepSize: 5, // Each year is a distinct tick
        tickAmount: Math.floor((moment(this.forecastEndDate).year() - moment(this.forecastStartDate).year()) / 5),
        title: {
          text: 'Year'
        },
        offsetX:-10,
        style: {
          cssClass: 'leftAlign'
        },
        labels: {
          formatter: (value: any) => {
            return [(Math.floor(value) - moment(this.client.clientDetails.birthDate).year()), Math.floor(value)]; // Ensure the year is displayed as an integer (remove fraction part)
          }
        }
      }
    }

    if(changes['client']) {
      this.chartOptions.yaxis={
        title: {
          text: this.client.clientDetails.preferredCurrency
        },
        labels: {
          formatter: (value: any) => {
            return `${this.client.clientDetails.preferredCurrency} ` + value;
          }
        }
      }
    }
    
  }

}



// export type ChartOptions = {
//   series: ApexAxisChartSeries;
//   chart: ApexChart;
//   dataLabels: ApexDataLabels;
//   plotOptions: ApexPlotOptions;
//   responsive: ApexResponsive[];
//   xaxis: ApexXAxis;
//   legend: ApexLegend;
//   fill: ApexFill;
// };