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
import {
  ClientEvent,
  EventIncomeType,
  FinancialTimeline,
} from '../models/financial-timeline';
import {
  DataSet,
  moment,
  Timeline,
  TimelineOptions,
} from 'vis-timeline/standalone';

import { MatDialog } from '@angular/material/dialog';
import { TimelineHttpService } from '../services/timeline-http.service';
import {
  AddEventDialogComponent,
  EventType,
} from '../add-event-dialog/add-event-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest, filter, tap } from 'rxjs';
import { CommonModule } from '@angular/common';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss',
})
export class TimelineChartComponent implements OnInit {
  timeline: Timeline;
  customEventsLibrary: ClientEvent[];
  systemEventsLibrary: ClientEvent[];
  draggedEvent: ClientEvent | null;

  @Input() financialTimeline: FinancialTimeline;
  @Input() clientBirthDate: Date;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private timelineHttpService: TimelineHttpService,
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
    combineLatest([
      this.timelineHttpService.getSystemEvents(),
      this.timelineHttpService.getCustomEvents(),
    ])
      .pipe(
        filter((res) => !!res),
        tap((res) => {
          this.systemEventsLibrary = res[0];
          this.customEventsLibrary = res[1];
          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }

  onDragStart(event: DragEvent, customEvent: any) {
    if (!event.dataTransfer) {
      console.error("🚨 dataTransfer is null, drag won't work!");
      return;
    }

    this.draggedEvent = customEvent; // Store dragged event
    event.dataTransfer?.setData('text/plain', JSON.stringify(customEvent));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    if (!this.draggedEvent || !this.timeline) return;

    // Get the dropped position on the timeline
    const dropTime = this.timeline.getEventProperties(event).time;

    const newEvent = {
      id: this.draggedEvent.id, // Unique ID
      content: this.draggedEvent.name,
      start: new Date(dropTime.getFullYear(), 0),
      end: new Date(dropTime.getFullYear() + 1, 0), // Example: Default to 1-day duration
      className: this.draggedEvent.iconUrl,
    };

    console.log(newEvent);

    // Add the new event to the timeline dataset
    // this.timeline.itemsData.add(newEvent);

    console.log(`Event "${this.draggedEvent.name}" dropped at:`, dropTime);

    if (
      this.draggedEvent.isOneOff &&
      this.financialTimeline.clientEvents.find(
        (event) => event.name === this.draggedEvent?.name
      )
    )
      return;

    if (this.draggedEvent.isPlaceHolder) return;

    if (
      this.draggedEvent.name === 'Inheritance' ||
      this.draggedEvent.name === 'Wedding'
    ) {
      const dialogRef = this.dialog.open(AddEventDialogComponent, {
        width: '600px',
        disableClose: true,
        data: {
          eventType: EventType.INHERITANCE,
          timelineId: this.financialTimeline.id,
          isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
          systemEvent: this.draggedEvent,
          dropTime: new Date(dropTime.getFullYear(), 0),
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if ((result.status = 'Success')) {
          this.updateTimelines.emit();
        }
      });
    }

    if (this.draggedEvent.name === 'State Pension') {
      const dialogRef = this.dialog.open(AddEventDialogComponent, {
        width: '600px',
        disableClose: true,
        data: {
          eventType: EventType.STATE_PENSION,
          timelineId: this.financialTimeline.id,
          isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
          systemEvent: this.draggedEvent,
          dropTime: new Date(dropTime.getFullYear(), 0),
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if ((result.status = 'Success')) {
          this.updateTimelines.emit();
        }
      });
    }

    // Create a new event on the timeline

    // Reset draggedEvent
    this.draggedEvent = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Allows dropping
  }

  initTimelineContainer() {
    if (!this.timelineContainer?.nativeElement) return;

    this.timeline = new Timeline(
      this.timelineContainer.nativeElement,
      this.timelineData,
      this.timelineOptions
    );


    if (this.financialTimeline.startAt) {
      this.timeline.addCustomTime(this.financialTimeline.startAt?.year, 't1');
    }
  }

  onEventMove(eventProperties: any) {
    console.log({ eventProperties });
  }

  get timelineData(): DataSet<
    {
      id: string;
      content: string;
      start: Date;
      end: Date | string;
      className: string;
    },
    'id'
  > {
    const dataArray = this.financialTimeline.clientEvents.map(
      (event, index) => {
        console.log({ index });
        return {
          id: event.id ?? (index + 1).toString(),
          content: this.getContent(event.name, event.iconUrl),
          start: new Date(event.start.year, 0),
          end: event.end ? new Date(event.end.year, 0) : '',
          className: event.iconUrl,
        };
      }
    );
    console.log({ dataArray });
    return new DataSet(dataArray);
  }
  get timelineOptions(): TimelineOptions {
    const clientBirthDateYear = moment(this.financialTimeline.forecastStartDate).year();
    return {
      editable: {
        add: false, // Prevent adding new events directly
        updateTime: false, // Allow changing event time by dragging
        updateGroup: false, // Prevent moving events between groups
        remove: true, // Prevent deletion via UI
      },
      stack: true, // Prevent overlapping events
      zoomable: true, // Allow zooming
      horizontalScroll: true, // Enable scrolling
      orientation: 'bottom', // Place events at the top
      margin: { item: 10 }, // Adds spacing between events
      min: new Date(moment(this.financialTimeline.forecastStartDate).year(), 0),
      start: new Date(
        moment(this.financialTimeline.forecastStartDate).year(),
        0
      ),
      end: moment(this.financialTimeline.forecastStartDate)
        .add(3, 'years')
        .toDate(),
      max: this.financialTimeline.forecastEndtDate,
      minHeight: '252px',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      // showCustomTime: true, // Allows custom markers
      showMajorLabels: true,
      timeAxis: { scale: 'year', step: 1 },
      format: {
        minorLabels: function (date: any) {
          return `${date.year() - clientBirthDateYear} years <br/> ${date.year()}`; // Calculate Age
        },
        majorLabels: function (date: any) {
          return ``; // Show actual years
        },
      },
    };
  }

  newEventClicked() {
    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '900px',
      disableClose: true,
      data: {
        eventType: EventType.CUSTOM,
        customEvents: this.customEventsLibrary,
        timelineId: this.financialTimeline.id,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if ((result.status = 'Success')) {
        this.updateTimelines.emit();
      }
    });
  }

  
  private getContent(title: string, img: string): string {
    return `<div><img src="/assets/images/svgs/${img}.svg"><span>${title}</span></div>`;
  }
}
