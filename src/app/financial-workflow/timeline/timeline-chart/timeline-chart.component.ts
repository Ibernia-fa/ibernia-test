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
import { Client } from 'src/app/clients/models/client';
import { ToastrModule, ToastrService } from 'ngx-toastr';

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
    ToastrModule,
    CommonModule,
  ],
  providers: [
    ToastrService
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
  @Input() client: Client;
  @Input() title: string = 'Events';
  @Input() showOnReports: boolean = false;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService
  ) {
    this.updateTimelines = new EventEmitter<boolean>();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['financialTimeline']) {
      if (this.timeline) {
        this.timeline.setItems(this.timelineData);
        this.timeline.setOptions(this.timelineOptions);
        // this.timeline.removeCustomTime('t1');
        // if (
        //   this.financialTimeline.startAt &&
        //   this.financialTimeline.clientEvents.length > 0
        // )
        //   this.timeline.addCustomTime(
        //     new Date(this.financialTimeline.startAt.year, 0),
        //     't1'
        //   );
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

  // this.hoveredYear = null;

  this.clearLabelHighlight();
  this.timeline.removeCustomTime('dragOver');
  this.timeline.redraw();
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

    if(this.draggedEvent.isDefault && this.financialTimeline.clientEvents.find(
      (event) => event.name === this.draggedEvent?.name
    )) {
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
        .addEvent(clientEvent, this.financialTimeline.cashflow.id)
        .pipe(
          // filter(res => !!res),
          take(1),
          map((res) => {
            if (this.financialTimeline.clientEvents.length < 1) {
              this.financialTimeline.startAt = {
                age: clientEvent.start.age,
                year: clientEvent.start.year,
              };
              // this.timeline.addCustomTime(
              //   new Date(this.financialTimeline.startAt.year, 1),
              //   't1'
              // );
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
          cashflowId: this.financialTimeline.cashflow.id,
          isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
          systemEvent: this.draggedEvent,
          dropTime: new Date(moment(dropTime).year(), 0),
          clientBirthDate: this.clientBirthDate,
          clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
          forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
          forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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

    if (this.draggedEvent.name === 'State pension') {
      const dialogRef = this.dialog.open(AddEventDialogComponent, {
        width: '700px',
        disableClose: true,
        data: {
          eventType: EventType.STATE_PENSION,
          timelineId: this.financialTimeline.id,
          cashflowId: this.financialTimeline.cashflow.id,
          isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
          systemEvent: this.draggedEvent,
          dropTime: new Date(moment(dropTime).year(), 0),
          clientBirthDate: this.clientBirthDate,
          clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
          forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
          forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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

  // onDragOver(event: DragEvent) {
  //   this.timeline.setCustomTime(
  //     this.timeline.getEventProperties(event).time,
  //     'dragOver'
  //   );
  //   this.timeline.setCustomTimeTitle(
  //     moment(this.timeline.getEventProperties(event).time).year().toString(),
  //     'dragOver'
  //   );
  //   event.preventDefault(); // Allows dropping
  //   // var isCustomTimeCreated = false;
  //   // try {
  //   //   console.log('dragover', (this.timeline.getEventProperties(event) as any).customTime);
  //   //   console.log('dragover', !(this.timeline.getEventProperties(event) as any).customTime);
  //   //   if(!(this.timeline.getEventProperties(event) as any).customTime) {
  //   //     console.log()
  //   //     isCustomTimeCreated = true;
  //   //   }

  //   // } catch(err) {
  //   //   console.log('called err', err);
  //   //   // this.timeline.removeCustomTime('dragOver');
  //   //   // this.timeline.addCustomTime(this.timeline.getEventProperties(event).time, 'dragOver');
  //   //   // this.timeline.setCustomTimeTitle(moment(this.timeline.getEventProperties(event).time).year().toString(), 'dragOver');
  //   // }
  //   // finally {
  //   //   console.log('called after');
  //   //   if(isCustomTimeCreated) {
  //   //     this.timeline.removeCustomTime('dragOver');
  //   //   }
  //   //   // this.timeline.redraw()
  //   // }
  // }

  onDragOver(event: DragEvent) {
  event.preventDefault();

  if (!this.timeline) return;

  const props = this.timeline.getEventProperties(event);
  if (!props?.time) return;

  const snappedTime = this.snapToNearestYear(props.time);
  this.timeline.setCustomTime(snappedTime, 'dragOver');

  this.highlightHoveredYearLabel(snappedTime.getFullYear() % 100);
}


highlightHoveredYearLabel(snappedYear: number) {
  const allMinorLabels = document.querySelectorAll('.vis-text.vis-minor');
  // Clear previous highlights completely
  console.log(snappedYear);
  allMinorLabels.forEach((label) => {
    const pTag = label.querySelector('p') as HTMLElement;
    const spanTag = label.querySelector('span') as HTMLElement;

    if (pTag) {
      pTag.style.color = '';
      pTag.style.fontWeight = '';
      pTag.style.fontSize = '';
    }

    if (spanTag) {
      spanTag.style.color = '';
      spanTag.style.fontWeight = '';
    }

    (label as HTMLElement).style.backgroundColor = '';
    (label as HTMLElement).style.borderRadius = '';
    (label as HTMLElement).style.border = '';
  });

  // Highlight the new one
  allMinorLabels.forEach((label) => {
    const pTag = label.querySelector('p');
    const spanTag = label.querySelector('span');

    if (spanTag?.textContent?.trim() === snappedYear.toString()) {
      // if (pTag) {
      //   pTag.style.color = 'blue';
      //   pTag.style.fontWeight = 'bold';
      //   pTag.style.fontSize = '14px';
      // }

      // if (spanTag) {
      //   spanTag.style.color = 'blue';
      //   spanTag.style.fontWeight = 'bold';
      // }

(label as HTMLElement).style.backgroundColor = '#66B2FF';
// (label as HTMLElement).style.fontWeight = 'bold';
// (label as HTMLElement).style.fontSize = 'large';
(label as HTMLElement).style.border = '1px solid #004C99';

    }
  });
}


clearLabelHighlight() {
  const minorLabels = document.querySelectorAll('.vis-text.vis-minor');
  minorLabels.forEach((label) => {
    const pTag = label.querySelector('p') as HTMLElement;
    const spanTag = label.querySelector('span') as HTMLElement;

    if (pTag) {
      pTag.style.color = '';
      pTag.style.fontWeight = '';
      pTag.style.fontSize = '';
    }

    if (spanTag) {
      spanTag.style.color = '';
      spanTag.style.fontWeight = '';
    }

    (label as HTMLElement).style.backgroundColor = '';
    (label as HTMLElement).style.borderRadius = '';
    (label as HTMLElement).style.border = '';
  
  });
}


private snapToNearestYear(date: Date): Date {
  const year = date.getFullYear();
  return new Date(year, 0, 1); // Always snap to Jan 1st of the year
}


  initTimelineContainer() {
    if (!this.timelineContainer?.nativeElement) return;

    this.timeline = new Timeline(
      this.timelineContainer.nativeElement,
      this.timelineData,
      this.timelineOptions
    );

this.timeline.on('mouseDown', (props) => {
  if (props.item) {
    this.timeline.setSelection(props.item);
  }
});

    this.timeline.on('doubleClick', (event) => {
      event.event.preventDefault();
      event.event.stopPropagation();
      console.log({event});
      if(event.event.type === 'dblclick') {
        var clientEvent = this.financialTimeline.clientEvents.find(ce => ce.id === event.item);
        if(clientEvent)
          this.updateEventByDoubleClick(clientEvent);

      }
    })

    console.log(this.financialTimeline.startAt);
    // if (
    //   this.financialTimeline.startAt &&
    //   this.financialTimeline.clientEvents.length > 0
    // )
    //   this.timeline.addCustomTime(
    //     new Date(this.financialTimeline.startAt.year, 1),
    //     't1'
    //   );
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
          end: (() => {
              if (!event.end || !event.end.year || event.end.year === event.start.year) {
                // One-off or no meaningful end date
                return new Date(event.start.year + Math.floor(0.5 * event.name.length + 5), 1);
              }
              
              const startYear = event.start.year;
              const endYear = event.end.year;

              if ((endYear - startYear) <= 10) {
                // Too short duration, make it visually wider
                return new Date(startYear + Math.floor(0.5 * event.name.length + 5), 1);
              }

              return new Date(endYear, 1);
            })(),

          // end:
          //   event.end && event.end.year > 0
          //     ? new Date(event.end.year, 1)
          //     : new Date(event.start.year + Math.floor(0.45 * event.name.length + 5), 1),
          //     // : new Date(event.start.year + Math.min(11, Math.floor(0.6 * event.name.length + 5)), 1),
          className: event.iconUrl,
          editable: {
            updateTime: true,
            remove: true,
          }
        };
      }
    );
    console.log({ dataArray });
    return new DataSet(dataArray);
  }
  get timelineOptions(): TimelineOptions {
    console.log(this.clientBirthDate);
    const birthDate = new Date(this.clientBirthDate);
    let age = this.calculateAge(birthDate);

    console.log("age " + age);
   
    //console.log(moment(this.financialTimeline.forecastStartDate).year() - clientBirthDateYear)

    //if(moment(this.financialTimeline.forecastStartDate).year() - clientBirthDateYear > age) clientBirthDateYear =  clientBirthDateYear+1
 
    const birthYear = moment(this.clientBirthDate).year();
    console.log("birthYear " + birthYear);

    const forecastStartYear = moment(this.financialTimeline.forecastStartDate).year();


    const timelineEndYear = new Date(
      new Date(this.financialTimeline.forecastStartDate).setFullYear(
        new Date(this.financialTimeline.forecastStartDate).getFullYear() + (100 - age)
      )
    ).getFullYear();

    console.log("resultDate " + timelineEndYear);

    const visualBufferYears = (timelineEndYear % 2 === 0 ? 1 : 2);

    console.log(visualBufferYears);
    console.log(forecastStartYear);
  // Adjust start year so that (startYear - birthYear) is even
    let startYear = forecastStartYear;
    // if ((startYear - birthYear) % 2 !== 0) {
    //   startYear += 1;
    // }

    console.log(startYear);

    return {
      editable: {
        add: false, // Prevent adding new events directly
        updateTime:  !this.showOnReports, // Allow changing event time by dragging
        updateGroup: false, // Prevent moving events between groups
        remove: !this.showOnReports, // Prevent deletion via UI
        overrideItems: false
      },
      selectable: true,
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
      zoomable: false, // Allow zooming
      moveable: !this.showOnReports,
      horizontalScroll: false, // Enable scrolling
      orientation: 'bottom', // Place events at the top
      margin: { item: 10 }, // Adds spacing between events
      // min: new Date(moment(this.financialTimeline.forecastStartDate).year(), 0),
      // min: moment(new Date(moment(this.financialTimeline.forecastStartDate).year(), 1))
      //   .subtract(42, 'months')
      //   .toDate(), // Set a minimum Date for the visible range. It will not be possible to move beyond this minimum.
      // start: new Date(
      //   moment(this.financialTimeline.forecastStartDate).year(),
      //   1
      // ), //The initial start date for the axis of the timeline. If not provided, the earliest date present in the events is taken as start date.
      // // start: moment(this.financialTimeline.forecastStartDate)
      // // .subtract(5, 'years')
      // // .toDate(),
      // end: moment(new Date(moment(this.financialTimeline.forecastEndtDate).year(), 1))
      //   .add(100, 'years')
      //   .toDate(),
      // max: moment(new Date(moment(this.financialTimeline.forecastEndtDate).year(), 1))
      //   .add(30, 'months')
      //   .toDate(),
      start: new Date(startYear, 0, 1),
      //min: new Date(startYear, 0, 1),
      end: new Date(timelineEndYear + 2, 0, 1),
      //max: new Date(timelineEndYear + visualBufferYears, 0, 1),

      minHeight: '304px',
      width: '100%',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      // showCustomTime: true, // Allows custom markers
      showMajorLabels: true,
      timeAxis: { scale: 'month', step: 12 },
      format: {
      minorLabels: (date: any) => {
        const today = new Date(date); // assuming date is a JS Date or something convertible
        const age = this.calculateAgeForTimeline(today, birthDate);
        return age >= 0 && age <= 100
          ? `<div id='selected'><p>${age}</p><span>${date.year() % 100}</span></div>`
          : '';
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
        console.log('onMove Called')
        console.log(item);
        this.handleEventUpdate(item, callback);
      },
      onMoving: (item, callback) => {
        console.log('onMoving Called')
        console.log(item);
        this.handleEventMoving(item, callback)
      },
        snap: (date: Date) => {
    const year = date.getFullYear();
    const midYear = new Date(year, 6, 1); // July 1st
    const nextYearStart = new Date(year + 1, 0, 1);
    const currentYearStart = new Date(year, 0, 1);
    return date < midYear ? currentYearStart : nextYearStart;
  }
    };
  }

  handleEventMoving(item: any, callback: (item: any) => void) {
    try {
      this.timeline.getCustomTime('dragOver')
      this.timeline.setCustomTime(item.start, 'dragOver');
      const year = new Date(item.start).getFullYear();

      this.highlightHoveredYearLabel(year % 100);

      callback(item)
    }
    catch(ex) {
      this.timeline.addCustomTime(new Date(), 'dragOver');
      callback(item);
    }
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
    this.timeline.removeCustomTime('dragOver');

    const dropTime = item.start;
    this.clearLabelHighlight();
    if (
      moment(dropTime).year() <
        moment(this.financialTimeline.forecastStartDate).year() ||
      moment(dropTime).year() >
        moment(this.financialTimeline.forecastEndtDate).year()
    )
    {
      this.timeline.setItems(this.timelineData);
      return;
    }

    var clientEvent = JSON.parse(JSON.stringify(this.financialTimeline.clientEvents.find(
      (event) => event.id === item.id
    )));
    if (clientEvent) {

      if( clientEvent.isOneOff &&
        clientEvent.start.year ===  moment(new Date(moment(item.start).year(), 1)).year() &&
        clientEvent.end?.year !==  moment(new Date(moment(item.end).year(), 1)).year()
      ) {
        this.toastrService.error("You cannot edit the duration of \"one off\" events");
        this.timeline.setItems(this.timelineData);
        this.cdr.detectChanges();
        this.timeline.redraw();
        return;
      }

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
          .addEvent(clientEvent, this.financialTimeline.cashflow.id)
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
        clientEvent.start = {
          year: moment(new Date(moment(item.start).year(), 1)).year(),
          age:
            moment(new Date(moment(item.start).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        }
        clientEvent.end = {
          year: moment(new Date(moment(item.end).year(), 1)).year(),
          age:
            moment(new Date(moment(item.end).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        }
        const dialogRef = this.dialog.open(AddEventDialogComponent, {
          width: '600px',
          disableClose: true,
          data: {
            eventType: EventType.INHERITANCE,
            timelineId: this.financialTimeline.id,
            cashflowId: this.financialTimeline.cashflow.id,
            isIncomeEvent: clientEvent.type === EventIncomeType.Income,
            systemEvent: clientEvent,
            dropTime: new Date(moment(item.start).year(), 0),
            clientBirthDate: this.clientBirthDate,
            clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
            forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
            forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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
          this.timeline.setItems(this.timelineData);
          this.cdr.detectChanges();
          this.timeline.redraw();
        });
      }

      if (clientEvent.name === 'State pension') {
        clientEvent.start = {
          year: moment(new Date(moment(item.start).year(), 1)).year(),
          age:
            moment(new Date(moment(item.start).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        }
        clientEvent.end = {
          year: moment(new Date(moment(item.end).year(), 1)).year(),
          age:
            moment(new Date(moment(item.end).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        }
        const dialogRef = this.dialog.open(AddEventDialogComponent, {
          width: '600px',
          disableClose: true,
          data: {
            eventType: EventType.STATE_PENSION,
            timelineId: this.financialTimeline.id,
            cashflowId: this.financialTimeline.cashflow.id,
            isIncomeEvent: clientEvent.type === EventIncomeType.Income,
            systemEvent: clientEvent,
            dropTime: new Date(moment(item.start).year(), 0),
            clientBirthDate: this.clientBirthDate,
            clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
            forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
            forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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
          this.timeline.setItems(this.timelineData);
          this.cdr.detectChanges();
          this.timeline.redraw();
        });
      }

      if (
        this.systemEventsLibrary.every(
          (event) => event.name !== clientEvent?.name
        )
      ) {

        clientEvent.start = {
          year: moment(new Date(moment(item.start).year(), 1)).year(),
          age:
            moment(new Date(moment(item.start).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        }
        clientEvent.end = {
          year: moment(new Date(moment(item.end).year(), 1)).year(),
          age:
            moment(new Date(moment(item.end).year(), 1)).year() -
            moment(this.clientBirthDate).year(),
        }
        const dialogRef = this.dialog.open(AddEventDialogComponent, {
          width: '900px',
          disableClose: true,
          data: {
            eventType: EventType.CUSTOM,
            customEvents: this.customEventsLibrary,
            timelineId: this.financialTimeline.id,
            isIncomeEvent: true,
            cashflowId: this.financialTimeline.cashflow.id,
            clientBirthDate: this.clientBirthDate,
            clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
            forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
            forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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
          this.timeline.setItems(this.timelineData);
          this.cdr.detectChanges();
          this.timeline.redraw();
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

  updateEventByDoubleClick(clientEvent: ClientEvent) {
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
          cashflowId: this.financialTimeline.cashflow.id,
          isIncomeEvent: clientEvent.type === EventIncomeType.Income,
          systemEvent: clientEvent,
          dropTime: new Date(clientEvent.start.year, 0),
          clientBirthDate: this.clientBirthDate,
          clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
          forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
          forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
          isEditWorkflow: true,
          patchEvent: clientEvent,
        },
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if ((result.status = 'Success')) {
          this.updateTimelines.emit();
        }
      });
    }

    if (clientEvent.name === 'State pension') {
      const dialogRef = this.dialog.open(AddEventDialogComponent, {
        width: '600px',
        disableClose: true,
        data: {
          eventType: EventType.STATE_PENSION,
          timelineId: this.financialTimeline.id,
          cashflowId: this.financialTimeline.cashflow.id,
          isIncomeEvent: clientEvent.type === EventIncomeType.Income,
          systemEvent: clientEvent,
          dropTime: new Date(clientEvent.start.year, 0),
          clientBirthDate: this.clientBirthDate,
          clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
          forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
          forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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
          isIncomeEvent: true,
          cashflowId: this.financialTimeline.cashflow.id,
          clientBirthDate: this.clientBirthDate,
          clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
          forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
          forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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
        }
      });
    }
  }

  handleEventRemoval(item: any, callback: (item: any) => void) {
    console.log('❌ Attempting to remove event:', item);

    this.timelineHttpService
      .deleteEvent(this.financialTimeline.cashflow.id, item.id)
      .pipe(
        take(1),
        map((res) => {
          this.financialTimeline.clientEvents.splice(
            this.financialTimeline.clientEvents.findIndex(
              (event) => event.id === item.id
            ),
            1
          );
          // if (this.financialTimeline.clientEvents.length < 1) {
          //   this.timeline.removeCustomTime('t1');
          // }
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
        cashflowId: this.financialTimeline.cashflow.id,
        clientBirthDate: this.clientBirthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
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
  return `
    <div class="timeline-event-chip with-padding">
      <div class="event-left">
        <img src="/assets/images/svgs/${img}.svg" class="icon" />
        <span class="label">${title}</span>
      </div>
    </div>`;
}

private calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const birthMonth = dateOfBirth.getMonth();
  const birthDay = dateOfBirth.getDate();

  // If birthday hasn't occurred yet this year, subtract one from age
  const hasBirthdayPassedThisYear =
    today.getMonth() > birthMonth ||
    (today.getMonth() === birthMonth && today.getDate() >= birthDay);

  if (!hasBirthdayPassedThisYear) {
    age--;
  }

  return age;
}

private calculateAgeForTimeline = (date: Date, dateOfBirth: Date): number => {
  let age = date.getFullYear() - dateOfBirth.getFullYear();

  const hasBirthdayPassed =
    date.getMonth() > dateOfBirth.getMonth() ||
    (date.getMonth() === dateOfBirth.getMonth() && date.getDate() >= dateOfBirth.getDate());

  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
};



}
