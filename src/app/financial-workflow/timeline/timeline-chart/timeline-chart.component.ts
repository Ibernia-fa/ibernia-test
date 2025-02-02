import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FinancialTimeline } from '../models/financial-timeline';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';

import { MatDialog } from '@angular/material/dialog';
import { TimelineHttpService } from '../services/timeline-http.service';
import { AddEventDialogComponent } from '../add-event-dialog/add-event-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-timeline-chart',
  imports: [
    TablerIconsModule,
    MatCardModule,
    MatFormFieldModule,
    MatChipsModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss',
})
export class TimelineChartComponent implements OnInit {
  timeline: Timeline;
  options: {};
  data: any;
  groups: any;

  @Input() financialTimeline: FinancialTimeline;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  constructor(private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['financialTimeline']) {
      this.timeline?.redraw();
    }
  }

  ngOnInit() {
    this.initTimelineContainer();
  }

  initTimelineContainer() {
    // this.changeDetectorRef.detectChanges();
    // if(this.timelineContainer) {
    if (!this.timelineContainer?.nativeElement) return;


    
    // Define timeline events
    const items2 = new DataSet([
      {
        id: 1,
        content: 'Retirement',
        start: '2027-04-20',
        end: '2027-06-01',
        className: 'retirement',
      },
      {
        id: 2,
        content: 'Inheritance',
        start: '2027-05-15',
        className: 'inheritance',
      },
      { id: 3, content: 'Birth', start: '2026-06-10', className: 'birth' },
      {
        id: 4,
        content: 'Wedding',
        start: '2028-07-01',
        end: '2029-07-05',
        className: 'wedding',
      },
      {
        id: 5,
        content: 'State Pension Age',
        start: '2035-01-01',
        className: 'state-pension',
      },
    ]);

    // Initialize timeline
    this.timeline = new Timeline(this.timelineContainer.nativeElement, this.timelineData, this.timelineOptions);

    this.timeline.addCustomTime(this.financialTimeline.startAt?.year, 't1');
  }

  get timelineData(): DataSet<{
    id: string;
    content: string;
    start: number;
    end: number;
    className: string;
}, "id"> {
    const dataArray = this.financialTimeline.clientEvents.map((event) => {
      return {
        id: event.id,
        content: event.name,
        start: event.start.year,
        end: event.end.year,
        className: event.iconUrl
      }
    });
    return new DataSet(dataArray);
  }
  get timelineOptions(): TimelineOptions {
    return {
      editable: {
        add: false, // Prevent adding new events directly
        updateTime: true, // Allow changing event time by dragging
        updateGroup: false, // Prevent moving events between groups
        remove: true, // Prevent deletion via UI
      },
      stack: true, // Prevent overlapping events
      zoomable: true, // Allow zooming
      horizontalScroll: true, // Enable scrolling
      orientation: 'bottom', // Place events at the top
      margin: { item: 10 }, // Adds spacing between events
      min: this.financialTimeline.forecastStartDate,
      start: this.financialTimeline.forecastStartDate,
      end: this.financialTimeline.forecastEndtDate,
      max: this.financialTimeline.forecastEndtDate,
      minHeight: '252px',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      // showCustomTime: true, // Allows custom markers
      showMajorLabels: true,
      timeAxis: { scale: 'year', step: 1 },
      format: {
        minorLabels: function (date: any) {
          return `${date.year() - 2010} years <br/> ${date.year()}`; // Calculate Age
        },
        majorLabels: function (date: any) {
          return ``; // Show actual years
        },
      },
    };
  }

  newEventClicked() {
    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        client: {},
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
