import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ClientEvent, FinancialTimeline } from '../models/financial-timeline';
import { DataSet, moment, Timeline, TimelineOptions } from 'vis-timeline/standalone';

import { MatDialog } from '@angular/material/dialog';
import { TimelineHttpService } from '../services/timeline-http.service';
import { AddEventDialogComponent, EventType } from '../add-event-dialog/add-event-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest, filter, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

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
    CommonModule,
    CdkDrag,
    CdkDropList
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss',
})
export class TimelineChartComponent implements OnInit {
  timeline: Timeline;
  customEventsLibrary: ClientEvent[];
  systemEventsLibrary: ClientEvent[];

  @Input() financialTimeline: FinancialTimeline;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  constructor(private dialog: MatDialog, private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef
  ) {
    this.updateTimelines = new EventEmitter<boolean>();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['financialTimeline']) {
      this.timeline?.redraw();
    }
  }

  ngOnInit() {
    this.initTimelineContainer();
    this.getTimelineEventsLibrary();
  }

  getTimelineEventsLibrary() {
    combineLatest([this.timelineHttpService.getSystemEvents(), this.timelineHttpService.getCustomEvents()]).pipe(
      filter(res => !!res),
      tap((res) => {
        this.systemEventsLibrary = res[0];
        this.customEventsLibrary = res[1];
        this.cdr.detectChanges();
      })
    ).subscribe()
  }

  onDrop(event: any) {
    console.log("onDrop", event);
  }

  onDragStart(event: any, customEvent: any) {
    console.log("onDragStart", event, customEvent);

  }

  onDragOver(event: any) {
    console.log("onDragOver", event);
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

    if(this.financialTimeline.startAt) {
      this.timeline.addCustomTime(this.financialTimeline.startAt?.year, 't1');
    }
  }

  get timelineData(): DataSet<{
    id: string;
    content: string;
    start: Date;
    end: Date;
    className: string;
}, "id"> {
    const dataArray = this.financialTimeline.clientEvents.map((event, index) => {
      console.log({index})
      return {
        id: event.id ?? (index+1).toString(),
        content: event.name,
        start: new Date(event.start.year, 0),
        end: new Date(event.end.year, 0),
        className: event.iconUrl
      }
    });
    console.log({dataArray})
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
      min: new Date(moment(this.financialTimeline.forecastStartDate).year(), 0),
      start: new Date(moment(this.financialTimeline.forecastStartDate).year(), 0),
      end: moment(this.financialTimeline.forecastStartDate).add(3, 'years').toDate(),
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
        eventType: EventType.CUSTOM,
        customEvents: this.customEventsLibrary,
        timelineId: this.financialTimeline.id
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if(result.status = 'Success') {
        this.updateTimelines.emit();
      }
    });
  }
}
