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
import { catchError, combineLatest, filter, map, take, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { group } from '@angular/animations';
import { E } from '@angular/cdk/keycodes';

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
export class TimelineChartComponent implements OnInit, OnChanges {
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
      if (this.timeline) {
        this.timeline.setItems(this.timelineData);
        this.timeline.setOptions(this.timelineOptions);
        this.timeline.removeCustomTime('t1');
        if (
          this.financialTimeline.startAt &&
          this.financialTimeline.clientEvents.length > 0
        )
          this.timeline.addCustomTime(
            new Date(this.financialTimeline.startAt.year, 0),
            't1'
          );
        this.timeline.redraw();
      }
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

    console.log('drag started');
    this.draggedEvent = customEvent; // Store dragged event
    event.dataTransfer?.setData('text/plain', JSON.stringify(customEvent));
    this.timeline.addCustomTime(new Date(), 'dragOver');
  }

  onDragEnd(event: DragEvent) {
    event.preventDefault();
    console.log(event.dataTransfer?.dropEffect);

    this.timeline.removeCustomTime('dragOver');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    console.log(this.draggedEvent);
    console.log(this.timeline);

    if (!this.draggedEvent || !this.timeline) {
      this.draggedEvent = null;
      return;
    }

    // Get the dropped position on the timeline
    const dropTime = this.timeline.getEventProperties(event).time;

    if (
      moment(dropTime).year() <
        moment(this.financialTimeline.forecastStartDate).year() ||
      moment(dropTime).year() >
        moment(this.financialTimeline.forecastEndtDate).year()
    )
      return;

    const newEvent = {
      id: this.draggedEvent.id, // Unique ID
      content: this.draggedEvent.name,
      start: new Date(moment(dropTime).year(), 0),
      end: new Date(moment(dropTime).year() + 1, 0), // Example: Default to 1-day duration
      className: this.draggedEvent.iconUrl,
    };

    console.log(newEvent);

    // Add the new event to the timeline dataset
    // this.timeline.itemsData.add(newEvent);

    console.log(`Event "${this.draggedEvent.name}" dropped at:`, dropTime);
    console.log(this.financialTimeline);

    if (
      this.draggedEvent.isOneOff &&
      this.financialTimeline.clientEvents.find(
        (event) => event.name === this.draggedEvent?.name
      )
    ) {
      this.draggedEvent = null;
      return;
    }

    if (this.draggedEvent.isPlaceHolder) {
      const clientEvent: ClientEvent = this.draggedEvent;
      // Object.assign<ClientEvent, ClientEvent>(clientEvent, this.draggedEvent);

      clientEvent.start = {
        year: moment(dropTime).year(),
        age: moment(dropTime).year() - moment(this.clientBirthDate).year(),
      };
      this.timelineHttpService
        .addEvent(clientEvent, this.financialTimeline.id)
        .pipe(
          // filter(res => !!res),
          take(1),
          map((res) => {
            if (this.financialTimeline.clientEvents.length < 1) {
              this.financialTimeline.startAt = {
                age: clientEvent.start.age,
                year: clientEvent.start.year,
              };
              this.timeline.addCustomTime(
                new Date(this.financialTimeline.startAt.year, 1),
                't1'
              );
            }
            this.financialTimeline.clientEvents.push(clientEvent);
            this.draggedEvent = null;
            this.timeline.setItems(this.timelineData);
            this.cdr.detectChanges();
            this.timeline.redraw();
          }),
          catchError((err) => {
            console.error(err);
            this.draggedEvent = null;
            throw err;
          })
        )
        .subscribe((res) => {
          this.draggedEvent = null;
        });
    }

    // if (
    //   this.draggedEvent.isOneOff &&
    //   !this.draggedEvent.isPlaceHolder &&
    //   (this.financialTimeline.clientEvents.length >= 1 ||
    //     this.financialTimeline.clientEvents.find(
    //       (event) => event.name === this.draggedEvent?.name
    //     ))
    // ) {
    //   console.log('First if: oneOff')
    //   this.draggedEvent = null;
    //   return;
    // }

    // console.log(
    //   this.financialTimeline.clientEvents.find(
    //     (event) => event.name === this.draggedEvent?.name
    //   )
    // );

    // if (this.draggedEvent.isPlaceHolder) {
    //   if (
    //     this.financialTimeline.clientEvents.find(
    //       (event) => event.name === this.draggedEvent?.name
    //     )
    //   ) {
    //     this.draggedEvent = null;
    //     return;
    //   } else {
    //     const clientEvent: ClientEvent = this.draggedEvent;
    //     // Object.assign<ClientEvent, ClientEvent>(clientEvent, this.draggedEvent);

    //     clientEvent.start = {
    //       year: moment(dropTime).year(),
    //       age: moment(dropTime).year() - moment(this.clientBirthDate).year(),
    //     };
    //     this.timelineHttpService
    //       .addEvent(clientEvent, this.financialTimeline.id)
    //       .pipe(
    //         // filter(res => !!res),
    //         take(1),
    //         map((res) => {
    //           if(this.financialTimeline.clientEvents.length < 1) {
    //             this.financialTimeline.startAt = {
    //               age: clientEvent.start.age,
    //               year: clientEvent.start.year
    //             }
    //             this.timeline.addCustomTime(new Date(this.financialTimeline.startAt.year, 1), 't1');
    //           }
    //           this.financialTimeline.clientEvents.push(clientEvent);
    //           this.draggedEvent = null;
    //           this.timeline.setItems(this.timelineData);
    //           this.cdr.detectChanges();
    //           this.timeline.redraw();
    //         }),
    //         catchError((err) => {
    //           console.error(err);
    //           this.draggedEvent = null;
    //           throw err;
    //         })
    //       )
    //       .subscribe((res) => {
    //         this.draggedEvent = null;
    //       });
    //   }
    // }
    // console.log('Before Popup:', this.draggedEvent)
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
          dropTime: new Date(moment(dropTime).year(), 0),
          clientBirthDate: this.clientBirthDate,
          forecastStartDateYear: moment(
            this.financialTimeline.forecastStartDate
          ).year(),
          forecastEndDateYear: moment(
            this.financialTimeline.forecastEndtDate
          ).year(),
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if ((result.status = 'Success')) {
          this.draggedEvent = null;
          this.updateTimelines.emit();
        }
      });
    }

    if (this.draggedEvent.name === 'State Pension') {
      const dialogRef = this.dialog.open(AddEventDialogComponent, {
        width: '700px',
        disableClose: true,
        data: {
          eventType: EventType.STATE_PENSION,
          timelineId: this.financialTimeline.id,
          isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
          systemEvent: this.draggedEvent,
          dropTime: new Date(moment(dropTime).year(), 0),
          clientBirthDate: this.clientBirthDate,
          forecastStartDateYear: moment(
            this.financialTimeline.forecastStartDate
          ).year(),
          forecastEndDateYear: moment(
            this.financialTimeline.forecastEndtDate
          ).year(),
          eventsList: this.financialTimeline.clientEvents.map((event) => {
            return {
              name: event.name,
              year: event.start.year,
              age:
                event.start.year -
                moment(new Date(this.clientBirthDate)).year(),
            };
          }),
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if ((result.status = 'Success')) {
          this.draggedEvent = null;
          this.updateTimelines.emit();
        }
      });
    }

    // Create a new event on the timeline

    // Reset draggedEvent
    this.draggedEvent = null;
  }

  onDragOver(event: DragEvent) {
    this.timeline.setCustomTime(
      this.timeline.getEventProperties(event).time,
      'dragOver'
    );
    this.timeline.setCustomTimeTitle(
      moment(this.timeline.getEventProperties(event).time).year().toString(),
      'dragOver'
    );
    event.preventDefault(); // Allows dropping
    // var isCustomTimeCreated = false;
    // try {
    //   console.log('dragover', (this.timeline.getEventProperties(event) as any).customTime);
    //   console.log('dragover', !(this.timeline.getEventProperties(event) as any).customTime);
    //   if(!(this.timeline.getEventProperties(event) as any).customTime) {
    //     console.log()
    //     isCustomTimeCreated = true;
    //   }

    // } catch(err) {
    //   console.log('called err', err);
    //   // this.timeline.removeCustomTime('dragOver');
    //   // this.timeline.addCustomTime(this.timeline.getEventProperties(event).time, 'dragOver');
    //   // this.timeline.setCustomTimeTitle(moment(this.timeline.getEventProperties(event).time).year().toString(), 'dragOver');
    // }
    // finally {
    //   console.log('called after');
    //   if(isCustomTimeCreated) {
    //     this.timeline.removeCustomTime('dragOver');
    //   }
    //   // this.timeline.redraw()
    // }
  }

  initTimelineContainer() {
    if (!this.timelineContainer?.nativeElement) return;

    this.timeline = new Timeline(
      this.timelineContainer.nativeElement,
      this.timelineData,
      this.timelineOptions
    );

    console.log(this.financialTimeline.startAt);
    if (
      this.financialTimeline.startAt &&
      this.financialTimeline.clientEvents.length > 0
    )
      this.timeline.addCustomTime(
        new Date(this.financialTimeline.startAt.year, 1),
        't1'
      );
    //   this.timeline.addCustomTime(
    //     moment(this.financialTimeline.startAt.year).toDate(),
    //     't1'
    //   );
    // }
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
          id: event.id,
          content: this.getContent(event.name, event.iconUrl),
          start: new Date(event.start.year, 1),
          end:
            event.end && event.end.year > 0
              ? new Date(event.end.year, 1)
              : new Date(event.start.year + 10, 1),
          className: event.iconUrl,
        };
      }
    );
    console.log({ dataArray });
    return new DataSet(dataArray);
  }
  get timelineOptions(): TimelineOptions {
    console.log(this.clientBirthDate);
    const clientBirthDateYear = moment(new Date(this.clientBirthDate)).year();
    console.log({ clientBirthDateYear });
    return {
      editable: {
        add: false, // Prevent adding new events directly
        updateTime: true, // Allow changing event time by dragging
        updateGroup: false, // Prevent moving events between groups
        remove: true, // Prevent deletion via UI
      },
      // snap: function (date: Date) {
      //   const year = moment(date).year();
      //   const snappedYear = Math.round(year / 5) * 5;
      //   return new Date(snappedYear, 0, 1);
      // },
      // snap: function (date, scale, step) {
      //   var hour = 60 * 60 * 1000;
      //   return Math.round(date / hour) * hour;
      // },
      stack: true, // Prevent overlapping events
      zoomable: true, // Allow zooming
      moveable: true,
      horizontalScroll: false, // Enable scrolling
      orientation: 'bottom', // Place events at the top
      margin: { item: 10 }, // Adds spacing between events
      // min: new Date(moment(this.financialTimeline.forecastStartDate).year(), 0),
      min: moment(this.financialTimeline.forecastStartDate)
        .subtract(5, 'years')
        .toDate(),
      start: new Date(
        moment(this.financialTimeline.forecastStartDate).year(),
        1
      ),
      // start: moment(this.financialTimeline.forecastStartDate)
      // .subtract(5, 'years')
      // .toDate(),
      end: moment(this.financialTimeline.forecastStartDate)
        .add(100, 'years')
        .toDate(),
      max: moment(this.financialTimeline.forecastEndtDate)
        .add(3, 'years')
        .toDate(),
      minHeight: '304px',
      width: '100%',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      // showCustomTime: true, // Allows custom markers
      showMajorLabels: true,
      timeAxis: { scale: 'year', step: 5 },
      format: {
        minorLabels: function (date: any) {
          return `
          <div id='selected'>
            <p>${date.year() - clientBirthDateYear}</p>
            <span>${date.year()}</span>
          </div>`;
        },
        majorLabels: function (date: any) {
          return ``; // Show actual years
        },
      },
      onRemove: (item, callback) => {
        console.log(item);
        this.handleEventRemoval(item, callback);
      },
      onMove: (item, callback) => {
        console.log(item);
        this.handleEventUpdate(item, callback);
      },
    };
  }

  currentZoomPercentage = 0.1;
  moveable = false;
  zoomIn() {
    if (this.currentZoomPercentage <= 0.95) {
      console.log('zoomin', this.currentZoomPercentage);
      this.currentZoomPercentage = this.currentZoomPercentage + 0.05;
      this.timeline.zoomIn(this.currentZoomPercentage);
    }
  }

  zoomOut() {
    if (this.currentZoomPercentage >= 0.05) {
      console.log('zoomout', this.currentZoomPercentage);
      this.currentZoomPercentage = this.currentZoomPercentage - 0.05;
      this.timeline.zoomOut(this.currentZoomPercentage);
    }
  }

  toggleMoveable() {
    this.moveable = !this.moveable;
    this.timeline.setOptions(this.timelineOptions);
  }

  handleEventUpdate(item: any, callback: (item: any) => void) {
    var clientEvent = this.financialTimeline.clientEvents.find(
      (event) => event.id === item.id
    );
    if (clientEvent) {
      if (
        this.systemEventsLibrary
          .filter((event) => event.isPlaceHolder)
          .some((event) => event.name === clientEvent?.name)
      ) {
        clientEvent.start = {
          year: moment(new Date(moment(item.start).year(), 1)).year(),
          age:
            moment(new Date(moment(item.start).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        };
        this.timelineHttpService
          .addEvent(clientEvent, this.financialTimeline.id)
          .pipe(
            // filter(res => !!res),
            take(1),
            map((res) => {
              // this.financialTimeline.clientEvents.push(clientEvent);
              this.draggedEvent = null;
              this.timeline.setItems(this.timelineData);
              this.cdr.detectChanges();
              this.timeline.redraw();
            }),
            catchError((err) => {
              console.error(err);
              this.draggedEvent = null;
              throw err;
            })
          )
          .subscribe((res) => {
            callback(item);
          });
      }

      if (
        clientEvent.name === 'Inheritance' ||
        clientEvent.name === 'Wedding'
      ) {
        const dialogRef = this.dialog.open(AddEventDialogComponent, {
          width: '600px',
          disableClose: true,
          data: {
            eventType: EventType.INHERITANCE,
            timelineId: this.financialTimeline.id,
            isIncomeEvent: clientEvent.type === EventIncomeType.Income,
            systemEvent: clientEvent,
            dropTime: new Date(moment(item.start).year(), 0),
            clientBirthDate: this.clientBirthDate,
            forecastStartDateYear: moment(
              this.financialTimeline.forecastStartDate
            ).year(),
            forecastEndDateYear: moment(
              this.financialTimeline.forecastEndtDate
            ).year(),
            isEditWorkflow: true,
            patchEvent: clientEvent,
          },
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          console.log('Dialog closed with result:', result);
          if ((result.status = 'Success')) {
            this.updateTimelines.emit();
            callback(item);
          }
        });
      }

      if (clientEvent.name === 'State Pension') {
        const dialogRef = this.dialog.open(AddEventDialogComponent, {
          width: '600px',
          disableClose: true,
          data: {
            eventType: EventType.STATE_PENSION,
            timelineId: this.financialTimeline.id,
            isIncomeEvent: clientEvent.type === EventIncomeType.Income,
            systemEvent: clientEvent,
            dropTime: new Date(moment(item.start).year(), 0),
            clientBirthDate: this.clientBirthDate,
            forecastStartDateYear: moment(
              this.financialTimeline.forecastStartDate
            ).year(),
            forecastEndDateYear: moment(
              this.financialTimeline.forecastEndtDate
            ).year(),
            eventsList: this.financialTimeline.clientEvents.map((event) => {
              return {
                name: event.name,
                year: event.start.year,
                age:
                  event.start.year -
                  moment(new Date(this.clientBirthDate)).year(),
              };
            }),
            isEditWorkflow: true,
            patchEvent: clientEvent,
          },
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          console.log('Dialog closed with result:', result);
          if ((result.status = 'Success')) {
            this.updateTimelines.emit();
            callback(item);
          }
        });
      }

      if (
        this.systemEventsLibrary.every(
          (event) => event.name !== clientEvent?.name
        )
      ) {
        const dialogRef = this.dialog.open(AddEventDialogComponent, {
          width: '900px',
          disableClose: true,
          data: {
            eventType: EventType.CUSTOM,
            customEvents: this.customEventsLibrary,
            timelineId: this.financialTimeline.id,
            clientBirthDate: this.clientBirthDate,
            forecastStartDateYear: moment(
              this.financialTimeline.forecastStartDate
            ).year(),
            forecastEndDateYear: moment(
              this.financialTimeline.forecastEndtDate
            ).year(),
            eventsList: this.financialTimeline.clientEvents.map((event) => {
              return {
                name: event.name,
                year: event.start.year,
                age:
                  event.start.year -
                  moment(new Date(this.clientBirthDate)).year(),
              };
            }),
            isEditWorkflow: true,
            patchEvent: clientEvent,
          },
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          console.log('Dialog closed with result:', result);
          if ((result.status = 'Success')) {
            this.updateTimelines.emit();
            callback(item);
          }
        });
      } else {
        const clientEvent: ClientEvent | undefined =
          this.financialTimeline.clientEvents.find(
            (event) => event.id === item.id
          );
        // Object.assign<ClientEvent, ClientEvent>(clientEvent, this.draggedEvent);

        if (clientEvent) {
        }
      }
    }
  }

  handleEventRemoval(item: any, callback: (item: any) => void) {
    console.log('❌ Attempting to remove event:', item);

    this.timelineHttpService
      .deleteEvent(this.financialTimeline.id, item.id)
      .pipe(
        take(1),
        map((res) => {
          this.financialTimeline.clientEvents.splice(
            this.financialTimeline.clientEvents.findIndex(
              (event) => event.id === item.id
            ),
            1
          );
          if (this.financialTimeline.clientEvents.length < 1) {
            this.timeline.removeCustomTime('t1');
          }
          this.timeline.setItems(this.timelineData);
          this.timeline.redraw();
          console.log(this.financialTimeline);
          callback(item);
        })
      )
      .subscribe();
  }

  newEventClicked() {
    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        eventType: EventType.CUSTOM,
        customEvents: this.customEventsLibrary,
        timelineId: this.financialTimeline.id,
        clientBirthDate: this.clientBirthDate,
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate
        ).year(),
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate
        ).year(),
        eventsList: this.financialTimeline.clientEvents.map((event) => {
          return {
            name: event.name,
            year: event.start.year,
            age:
              event.start.year - moment(new Date(this.clientBirthDate)).year(),
          };
        }),
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
