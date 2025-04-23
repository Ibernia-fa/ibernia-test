import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

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
export class SavingsBarStackedChartComponent {
  @ViewChild("chart") chart: ChartComponent;
  public chartOptions: any;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Current account',
          data: [
            { x: 2023, y: -400 },
            { x: 2024, y: -370 },
            { x: 2025, y: -350 },
            { x: 2026, y: -330 },
            { x: 2027, y: 300 },
            { x: 2028, y: 270 },
            { x: 2029, y: 240 },
            { x: 2030, y: 210 },
            { x: 2031, y: 180 },
            { x: 2032, y: 150 },
            { x: 2033, y: 120 },
            { x: 2034, y: 90 },
            { x: 2035, y: 60 },
            { x: 2036, y: 30 },
            { x: 2037, y: 0 }
          ],
          color: '#4CAF50' // Green for Current account
        },
        {
          name: 'Savings',
          data: [
            { x: 2023, y: 300 },
            { x: 2024, y: 310 },
            { x: 2025, y: 320 },
            { x: 2026, y: 330 },
            { x: 2027, y: 350 },
            { x: 2028, y: -360 },
            { x: 2029, y: -370 },
            { x: 2030, y: -380 },
            { x: 2031, y: -390 },
            { x: 2032, y: -400 },
            { x: 2033, y: 410 },
            { x: 2034, y: 420 },
            { x: 2035, y: 430 },
            { x: 2036, y: 440 },
            { x: 2037, y: 450 }
          ],
          color: '#8BC34A' // Light green for Savings
        },
        {
          name: 'Crypto',
          data: [
            { x: 2023, y: 150 },
            { x: 2024, y: 180 },
            { x: 2025, y: 200 },
            { x: 2026, y: 230 },
            { x: 2027, y: 250 },
            { x: 2028, y: 280 },
            { x: 2029, y: 300 },
            { x: 2030, y: 330 },
            { x: 2031, y: 350 },
            { x: 2032, y: 370 },
            { x: 2033, y: 380 },
            { x: 2034, y: 390 },
            { x: 2035, y: 400 },
            { x: 2036, y: 410 },
            { x: 2037, y: 420 },
            { x: 2123, y: -420 } // Intentional value, use as required
          ],
          color: '#FF5722' // Red for Crypto
        }
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