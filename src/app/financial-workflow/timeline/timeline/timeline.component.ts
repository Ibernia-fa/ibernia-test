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
import { map, switchMap } from 'rxjs';
import { FinancialTimeline } from '../models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimelineChartComponent } from '../timeline-chart/timeline-chart.component';

@Component({
  selector: 'app-timeline',
  imports: [
    TablerIconsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TimelineChartComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent {
  cashflowId: string;
  financialTimeline: FinancialTimeline;
  isLoaderVisible: boolean;

  constructor(
    private timelineHttpService: TimelineHttpService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.getTimeline();
  }

  getTimeline() {
    this.isLoaderVisible = true;
    this.activatedRoute.params
          .pipe(
            switchMap((params) => {
              this.cashflowId = params['id']
              return this.timelineHttpService.getTimelinebyCashflowId(this.cashflowId)
            }),
            map((res) => {
              this.isLoaderVisible = false;
              this.financialTimeline = res;
            })
          )
          .subscribe();
  }

  updateTimelines(){
    this.getTimeline();
  }
}
