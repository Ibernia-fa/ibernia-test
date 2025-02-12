import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TimelineHttpService } from '../services/timeline-http.service';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap, take, tap } from 'rxjs';
import { FinancialTimeline } from '../models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimelineChartComponent } from '../timeline-chart/timeline-chart.component';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';
import { DialogComponent } from 'src/app/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-timeline',
  imports: [
    TablerIconsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TimelineChartComponent,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  cashflowId: string;
  financialTimeline: FinancialTimeline;
  clientBirthDate: Date;
  isLoaderVisible: boolean;
  forecastStartYears: number[] = [];
  forecastStartYear: number;
  forecastEndYear: number;
  clientBirthYear: number;
  enableForecastEdit=false;

  constructor(
    private timelineHttpService: TimelineHttpService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'Goals & Events';
    this.getTimeline();
  }

  getTimeline() {
    this.isLoaderVisible = true;
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.cashflowId = params['id'];
          return this.timelineHttpService.getTimelinebyCashflowId(
            this.cashflowId
          );
        }),
        map((res) => {
          this.isLoaderVisible = false;
          this.financialTimeline = res;
          this.clientBirthDate = this.financialTimeline.clientBirthDate;
          this.clientBirthYear = moment(
            this.financialTimeline.clientBirthDate
          ).year();
          this.forecastStartYear = moment(
            this.financialTimeline.forecastStartDate
          ).year();
          this.forecastEndYear = moment(
            this.financialTimeline.forecastEndtDate
          ).year();

          var iterations = this.forecastEndYear - this.forecastStartYear;

          for (let index = 0; index <= iterations; index++) {
            const element = this.forecastStartYear + index;
            this.forecastStartYears.push(element);
          }
          // this.clientBirthDate = new Date();
        })
      )
      .subscribe();
  }

  onUpdateClicked() {
    this.financialTimeline.forecastStartDate = new Date(
      this.forecastStartYear,
      1
    );
    this.financialTimeline.forecastEndtDate = new Date(this.forecastEndYear, 1);
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        action: 'Update',
        text: 'This action will affect the timeline events?',
      },
      width: '460px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      this.enableForecastEdit=false
      if (result.event === 'Update') {
        this.updateTimeline();
      }
    });
  }
  
  updateTimeline() {
    this.timelineHttpService
      .updateTimeline(this.financialTimeline)
      .pipe(
        take(1),
        tap((res) => {
          this.updateTimelinesEmittedEvent();
        })
      )
      .subscribe();
  }

  onForecastStartChange(event: any) {
    this.forecastStartYear = event;
  }

  onForecastEndChange(event: any) {
    this.forecastEndYear = event;
  }

  updateTimelinesEmittedEvent() {
    // this.getTimeline();
    this.timelineHttpService
      .getTimelinebyCashflowId(this.cashflowId)
      .pipe(
        take(1),
        tap((res) => {
          this.financialTimeline = res;
          this.clientBirthDate = this.financialTimeline.clientBirthDate;
        })
      )
      .subscribe();
  }
}
