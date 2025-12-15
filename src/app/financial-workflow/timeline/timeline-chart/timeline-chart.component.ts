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
  AfterViewChecked
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import {
  ClientEvent,
  Cycle,
  EscalationRate,
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
import { catchError, combineLatest, filter, fromEvent, map, Subscription, take, tap, throttleTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Client } from 'src/app/clients/models/client';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SettingsHttpService } from '../../settings/services/settings-http.service';

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
  @Input() title: string = 'Timeline';
  @Input() showOnReports: boolean = false;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;
  private hoverLineId = 'hoverLine';

  private tooltipPollingInterval: any;
  private tooltipMouseX: number = 0;
  private tooltipMouseY: number = 0;
  escalationRates: EscalationRate[];
  amountCycles: Cycle[];
  private timelineHoverSubscription: Subscription;
  private isDragging = false; // Track drag state
  constructor(
    private dialog: MatDialog,
    private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService,
    private settingHttpService: SettingsHttpService 
  ) { 
    this.updateTimelines = new EventEmitter<boolean>();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.client) return;

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

  

  ngAfterViewInit() {
    // this.timelineContainer.nativeElement.addEventListener('mousemove', (e: MouseEvent) => {
    //   this.tooltipMouseX = e.clientX;
    //   this.tooltipMouseY = e.clientY;
    // });
    this.settingHttpService
      .getEscalationRates(this.client.id)
      .subscribe((escalationRatesResponse) => {
        escalationRatesResponse = escalationRatesResponse ?? {escalationRates: []};
        this.escalationRates = escalationRatesResponse.escalationRates;
      }
    );

    this.settingHttpService
      .getAmountCycles()
      .subscribe((cycles) => {
        this.amountCycles = cycles;
      }
    );
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
     this.isDragging = true; 
    this.draggedEvent = customEvent; // Store dragged event
    event.dataTransfer?.setData('text/plain', JSON.stringify(customEvent));
    this.timeline.addCustomTime(new Date(), 'dragOver');
  }

  onDragEnd(event: DragEvent) {
  event.preventDefault();

  // this.hoveredYear = null;
  this.isDragging = false;
  this.clearLabelHighlight();
  this.timeline.removeCustomTime('dragOver');
  this.timeline.redraw();
  // this.stopTooltipPolling();
  }

  onDrop(event: DragEvent) {

  // this.stopTooltipPolling();

    event.preventDefault();
    this.isDragging = false; 
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

    if(this.draggedEvent?.name == 'Retirement age' && this.financialTimeline.clientEvents.find(
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
      clientEvent.id = "";
      console.log('client event', clientEvent);
      console.log('1');
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
            this.updateTimelines.emit(); // optional, if parent reloads timelines
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
        amountCycles: this.amountCycles,
          eventType: EventType.INHERITANCE,
        escalataionRates : this.escalationRates,
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
          amountCycles: this.amountCycles,
          eventType: EventType.STATE_PENSION,
          escalataionRates : this.escalationRates,
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


onDragOver(event: DragEvent) {
  event.preventDefault();

  if (!this.timeline) return;

  const props = this.timeline.getEventProperties(event);
  if (!props?.time) return;

  const snappedTime = this.snapToNearestYear(props.time);
  this.timeline.setCustomTime(snappedTime, 'dragOver');

  const snappedYear = snappedTime.getFullYear();
  const age = this.calculateAgeForTimeline(snappedTime, new Date(this.clientBirthDate));

  this.highlightHoveredYearLabel(snappedYear);
  // this.showTooltip(event, `Year: ${snappedYear}, Age: ${age}`);
}

highlightHoveredYearLabel(snappedYear: number) {
  const allMinorLabels = document.querySelectorAll('.vis-text.vis-minor');

  // Clear previous highlights completely
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
      spanTag.style.fontSize = '';
      // Restore original short year text if we modified it
      const originalShortYear = spanTag.getAttribute('data-short-year');
      if (originalShortYear) {
        spanTag.textContent = originalShortYear;
        spanTag.removeAttribute('data-short-year');
      }
    }

    (label as HTMLElement).style.display  = '';
    (label as HTMLElement).style.backgroundColor = '';
    (label as HTMLElement).style.opacity  = '';
    (label as HTMLElement).style.zIndex  = '';
    (label as HTMLElement).style.padding  = '';
    (label as HTMLElement).classList.remove('highlighted');
  });

  // Highlight the matching year
  allMinorLabels.forEach((label) => {
    const pTag = label.querySelector('p') as HTMLElement;
    const spanTag = label.querySelector('span') as HTMLElement;

    if (spanTag?.textContent?.trim() === snappedYear.toString()) {
      (label as HTMLElement).style.display  = 'inline-block';
      (label as HTMLElement).style.backgroundColor = '#ffffffff';
      (label as HTMLElement).style.opacity  = '1';
      (label as HTMLElement).style.zIndex  = '9999';
      (label as HTMLElement).style.padding  = '2px 6px';
      (label as HTMLElement).classList.add('highlighted');

      // Enlarge and update the year label
      if (spanTag) {
        console.log('span tag found');
        spanTag.setAttribute('data-short-year', spanTag.textContent ?? ''); // Store original
        console.log(snappedYear.toString());
        spanTag.textContent = snappedYear.toString(); // Show full year
        spanTag.style.fontSize = '16px';
        spanTag.style.fontWeight = 'bold';
        spanTag.style.color = '#000000';
      }

      // Emphasize the age
      if (pTag) {
        pTag.style.fontSize = '14px';
        pTag.style.fontWeight = '500';
        pTag.style.color = '#333';
      }
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

    (label as HTMLElement).style.display  = '';
    (label as HTMLElement).style.backgroundColor = '';
    (label as HTMLElement).style.opacity  = '';
    (label as HTMLElement).style.zIndex  = '';
    (label as HTMLElement).style.padding  = '';
  
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

  this.initTimelineHover();

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
// get timelineData(): DataSet<
//   {
//     id: string;
//     content: string;
//     start: Date;
//     end: Date | string;
//     className: string;
//   },
//   'id'
// > {
//   const dataArray = this.financialTimeline.clientEvents.map(
//     (event, index) => {
//       const startYear = event.start.year;
      
//       // Calculate the proportional width based on timeline length
//       const timelineStartYear = moment(this.financialTimeline.forecastStartDate).year();
//       const timelineEndYear = moment(this.financialTimeline.forecastEndtDate).year();
//       const timelineTotalYears = timelineEndYear - timelineStartYear;
      
//       // Base width calculation from name (similar to original)
//       const baseWidthFromName = Math.floor(0.5 * event.name.length + 3); // Reduced from +5
      
//       // Scale factor based on timeline length
//       let scaleFactor = 1.0;
//       if (timelineTotalYears < 30) {
//         scaleFactor = 0.5; // Half width for very short timelines
//       } else if (timelineTotalYears < 50) {
//         scaleFactor = 0.7; // Reduced width for short timelines
//       } else if (timelineTotalYears < 80) {
//         scaleFactor = 0.9; // Slightly reduced for medium timelines
//       }
//       // For long timelines (>80 years), keep scaleFactor at 1.0
      
//       let endDate: Date;
      
//       if (!event.end || !event.end.year || event.end.year === startYear) {
//         // ONE-OFF EVENTS
//         const calculatedWidth = Math.max(
//           2, // Minimum width
//           Math.min(
//             10, // Maximum width
//             Math.ceil(baseWidthFromName * scaleFactor)
//           )
//         );
//         endDate = new Date(startYear + calculatedWidth, 1);
//       } else {
//         // EVENTS WITH DURATION
//         const endYear = event.end.year;
//         const actualDuration = endYear - startYear;
        
//         // Only adjust very short duration events
//         if (actualDuration <= 2) {
//           const minWidthForVisibility = Math.max(
//             actualDuration,
//             Math.ceil(baseWidthFromName * 0.3 * scaleFactor) // Much smaller factor for duration events
//           );
//           endDate = new Date(startYear + minWidthForVisibility, 1);
//         } else {
//           // Normal duration - use actual
//           endDate = new Date(endYear, 1);
//         }
//       }
      
//       return {
//         id: event.id,
//         content: this.getContent(event.name, event.iconUrl),
//         start: new Date(startYear, 1),
//         end: endDate,
//         className: event.iconUrl,
//         editable: {
//           updateTime: true,
//           remove: true,
//         }
//       };
//     }
//   );
  
//   return new DataSet(dataArray);
// }


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
      const startYear = event.start.year;
      
      // For events with an end year (like State Pension that runs from 2040 to 2088)
      if (event.end && event.end.year && event.end.year > startYear) {
        // Events with duration - use their actual start and end years
        return {
          id: event.id,
          content: this.getContent(event.name, event.iconUrl),
          start: new Date(startYear, 12, 1), // Jan 1st of start year
          end: new Date(event.end.year, 12, 1), // Jan 1st of end year
          className: event.iconUrl,
          editable: {
            updateTime: true,
            remove: true,
          }
        };
      } else {
        // ONE-OFF EVENTS (or events without end date)
        // Calculate the proportional width based on timeline length
        const timelineStartYear = moment(this.financialTimeline.forecastStartDate).year();
        const timelineEndYear = moment(this.financialTimeline.forecastEndtDate).year();
        const timelineTotalYears = timelineEndYear - timelineStartYear;
        
        // Base width calculation from name (similar to original)
        const baseWidthFromName = Math.floor(0.5 * event.name.length + 3);
        
        // Scale factor based on timeline length
        let scaleFactor = 1.0;
        if (timelineTotalYears < 30) {
          scaleFactor = 0.5;
        } else if (timelineTotalYears < 50) {
          scaleFactor = 0.7;
        } else if (timelineTotalYears < 80) {
          scaleFactor = 0.9;
        }
        
        const calculatedWidth = Math.max(
          1, // Minimum width (1 year)
          Math.min(
            10, // Maximum width
            Math.ceil(baseWidthFromName * scaleFactor)
          )
        );
        
        return {
          id: event.id,
          content: this.getContent(event.name, event.iconUrl),
          start: new Date(startYear, 12, 1), // Jan 1st of start year
          end: new Date(startYear + calculatedWidth, 12, 1), // End based on calculated width
          className: event.iconUrl,
          editable: {
            updateTime: true,
            remove: true,
          }
        };
      }
    }
  );
  
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
      min: new Date(startYear, 0, 1),
      end: new Date(timelineEndYear + 2, 0, 1),
      max: new Date(timelineEndYear + 2, 0, 1),

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
          ? `<div id='selected'><p>${age}</p><span>${date.year()}</span></div>`
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
    const snappedTime = new Date(item.start);
    this.timeline.setCustomTime(snappedTime, 'dragOver');

    const year = snappedTime.getFullYear();
    const age = this.calculateAgeForTimeline(snappedTime, new Date(this.clientBirthDate));
    // this.highlightHoveredYearLabel(year);
requestAnimationFrame(() => {
  this.highlightHoveredYearLabel(year);
});

    // this.startTooltipPolling(`Year: ${year}, Age: ${age}`);
    callback(item);
  } catch (ex) {
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

  // handleEventUpdate(item: any, callback: (item: any) => void) {
  //   this.timeline.removeCustomTime('dragOver');
  //   // this.stopTooltipPolling();

  //   const dropTime = item.start;
  //   this.clearLabelHighlight();
  //   if (
  //     moment(dropTime).year() <
  //       moment(this.financialTimeline.forecastStartDate).year() ||
  //     moment(dropTime).year() >
  //       moment(this.financialTimeline.forecastEndtDate).year()
  //   )
  //   {
  //     this.timeline.setItems(this.timelineData);
  //     return;
  //   }

  //   var clientEvent = JSON.parse(JSON.stringify(this.financialTimeline.clientEvents.find(
  //     (event) => event.id === item.id
  //   )));
  //   if (clientEvent) {

  //     if( clientEvent.isOneOff &&
  //       clientEvent.start.year ===  moment(new Date(moment(item.start).year(), 1)).year() &&
  //       clientEvent.end?.year !==  moment(new Date(moment(item.end).year(), 1)).year()
  //     ) {
  //       this.toastrService.error("You cannot edit the duration of \"one off\" events");
  //       this.timeline.setItems(this.timelineData);
  //       this.cdr.detectChanges();
  //       this.timeline.redraw();
  //       return;
  //     }

  //     if (
  //       this.systemEventsLibrary
  //         .filter((event) => event.isPlaceHolder)
  //         .some((event) => event.name === clientEvent?.name)
  //     ) {
  //       clientEvent.start = {
  //         year: moment(new Date(moment(item.start).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.start).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       };
  //       this.timelineHttpService
  //         .addEvent(clientEvent, this.financialTimeline.cashflow.id)
  //         .pipe(
  //           // filter(res => !!res),
  //           take(1),
  //           map((res) => {
  //             // this.financialTimeline.clientEvents.push(clientEvent);
  //             this.draggedEvent = null;
  //             this.updateTimelines.emit();
  //             this.timeline.setItems(this.timelineData);
  //             this.cdr.detectChanges();
  //             this.timeline.redraw();
  //           }),
  //           catchError((err) => {
  //             console.error(err);
  //             this.draggedEvent = null;
  //             throw err;
  //           })
  //         )
  //         .subscribe((res) => {
  //           callback(item);
  //         });
  //     }

  //     if (
  //       clientEvent.name === 'Inheritance' ||
  //       clientEvent.name === 'Wedding'
  //     ) {
  //       clientEvent.start = {
  //         year: moment(new Date(moment(item.start).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.start).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       }
  //       clientEvent.end = {
  //         year: moment(new Date(moment(item.end).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.end).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       }
  //       const dialogRef = this.dialog.open(AddEventDialogComponent, {
  //         width: '600px',
  //         disableClose: true,
  //         data: {
  //           amountCycles: this.amountCycles,
  //           eventType: EventType.INHERITANCE,
  //           escalataionRates : this.escalationRates,
  //           timelineId: this.financialTimeline.id,
  //           cashflowId: this.financialTimeline.cashflow.id,
  //           isIncomeEvent: clientEvent.type === EventIncomeType.Income,
  //           systemEvent: clientEvent,
  //           dropTime: new Date(moment(item.start).year(), 0),
  //           clientBirthDate: this.clientBirthDate,
  //           clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
  //           forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
  //           forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
  //           isEditWorkflow: true,
  //           patchEvent: clientEvent,
  //         },
  //       });

  //       dialogRef.afterClosed().subscribe((result: any) => {
  //         console.log('Dialog closed with result:', result);
  //         if ((result.status = 'Success')) {
  //           this.updateTimelines.emit();
  //           callback(item);
  //         }
  //         this.timeline.setItems(this.timelineData);
  //         this.cdr.detectChanges();
  //         this.timeline.redraw();
  //       });
  //     }

  //     if (clientEvent.name === 'State pension') {
  //       clientEvent.start = {
  //         year: moment(new Date(moment(item.start).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.start).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       }
  //       clientEvent.end = {
  //         year: moment(new Date(moment(item.end).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.end).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       }
  //       const dialogRef = this.dialog.open(AddEventDialogComponent, {
  //         width: '600px',
  //         disableClose: true,
  //         data: {
  //           amountCycles: this.amountCycles,
  //           eventType: EventType.STATE_PENSION,
  //           escalataionRates : this.escalationRates,
  //           timelineId: this.financialTimeline.id,
  //           cashflowId: this.financialTimeline.cashflow.id,
  //           isIncomeEvent: clientEvent.type === EventIncomeType.Income,
  //           systemEvent: clientEvent,
  //           dropTime: new Date(moment(item.start).year(), 0),
  //           clientBirthDate: this.clientBirthDate,
  //           clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
  //           forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
  //           forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
  //           eventsList: this.financialTimeline.clientEvents.map((event) => {
  //             return {
  //               name: event.name,
  //               year: event.start.year,
  //               age:
  //                 event.start.year -
  //                 moment(new Date(this.clientBirthDate)).year(),
  //             };
  //           }),
  //           isEditWorkflow: true,
  //           patchEvent: clientEvent,
  //         },
  //       });

  //       dialogRef.afterClosed().subscribe((result: any) => {
  //         console.log('Dialog closed with result:', result);
  //         if ((result.status = 'Success')) {
  //           this.updateTimelines.emit();
  //           callback(item);
  //         }
  //         this.timeline.setItems(this.timelineData);
  //         this.cdr.detectChanges();
  //         this.timeline.redraw();
  //       });
  //     }

  //     if (
  //       this.systemEventsLibrary.every(
  //         (event) => event.name !== clientEvent?.name
  //       )
  //     ) {

  //       clientEvent.start = {
  //         year: moment(new Date(moment(item.start).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.start).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       }
  //       clientEvent.end = {
  //         year: moment(new Date(moment(item.end).year(), 1)).year(),
  //         age:
  //           moment(new Date(moment(item.end).year(), 1)).year() -
  //           moment(this.clientBirthDate).year(),
  //       }
  //       const dialogRef = this.dialog.open(AddEventDialogComponent, {
  //         width: '900px',
  //         disableClose: true,
  //         data: {
  //           eventType: EventType.CUSTOM,
  //           amountCycles: this.amountCycles,
  //           escalataionRates : this.escalationRates,
  //           customEvents: this.customEventsLibrary,
  //           timelineId: this.financialTimeline.id,
  //           isIncomeEvent: true,
  //           cashflowId: this.financialTimeline.cashflow.id,
  //           clientBirthDate: this.clientBirthDate,
  //           clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
  //           forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
  //           forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
  //           eventsList: this.financialTimeline.clientEvents.map((event) => {
  //             return {
  //               name: event.name,
  //               year: event.start.year,
  //               age:
  //                 event.start.year -
  //                 moment(new Date(this.clientBirthDate)).year(),
  //             };
  //           }),
  //           isEditWorkflow: true,
  //           patchEvent: clientEvent,
  //         },
  //       });

  //       dialogRef.afterClosed().subscribe((result: any) => {
  //         console.log('Dialog closed with result:', result);
  //         if ((result.status = 'Success')) {
  //           this.updateTimelines.emit();
  //           callback(item);
  //         }
  //         this.timeline.setItems(this.timelineData);
  //         this.cdr.detectChanges();
  //         this.timeline.redraw();
  //       });
  //     } else {
  //       const clientEvent: ClientEvent | undefined =
  //         this.financialTimeline.clientEvents.find(
  //           (event) => event.id === item.id
  //         );
  //       // Object.assign<ClientEvent, ClientEvent>(clientEvent, this.draggedEvent);

  //       if (clientEvent) {
  //       }
  //     }
  //   }
  // }


  handleEventUpdate(item: any, callback: (item: any) => void) {
  // remove hover marker + clear highlight
  this.timeline.removeCustomTime('dragOver');
  this.clearLabelHighlight();

  const dropTime = item.start;

  // guard: outside forecast window → revert
  if (
    moment(dropTime).year() < moment(this.financialTimeline.forecastStartDate).year() ||
    moment(dropTime).year() > moment(this.financialTimeline.forecastEndtDate).year()
  ) {
    this.timeline.setItems(this.timelineData);
    this.cdr.detectChanges();
    this.timeline.redraw();
    return;
  }

  // clone current event from the model
  const existing = this.financialTimeline.clientEvents.find(ev => ev.id === item.id);
  if (!existing) {
    // nothing to update; just refresh UI
    this.timeline.setItems(this.timelineData);
    this.cdr.detectChanges();
    this.timeline.redraw();
    return;
  }

  // compute snapped years from vis item
  const newStartYear = moment(new Date(moment(item.start).year(), 1)).year();
  const newEndYear   = moment(new Date(moment(item.end).year(),   1)).year();

  // one-off rule: allow moving the date (year), but DON'T allow changing duration
  if (
    existing.isOneOff &&
    existing.start?.year === newStartYear &&
    existing.end?.year !== newEndYear
  ) {
    this.toastrService.error('You cannot edit the duration of "one off" events');
    this.timeline.setItems(this.timelineData);
    this.cdr.detectChanges();
    this.timeline.redraw();
    return;
  }

  // build the payload to upsert
  const updated = {
    ...existing,
    start: {
      year: newStartYear,
      age:  newStartYear - moment(this.clientBirthDate).year(),
    },
    // if event had no end, keep it undefined OR keep previous end if it existed and user didn't resize
    end: (() => {
      if (!existing.end || !existing.end.year) return existing.end; // one-off stays one-off
      return {
        year: newEndYear,
        age:  newEndYear - moment(this.clientBirthDate).year(),
      };
    })(),
  };

  // persist WITHOUT opening any dialog (upsert pattern)
  this.timelineHttpService
    .addEvent(updated, this.financialTimeline.cashflow.id) // server treats as upsert by id
    .pipe(take(1))
    .subscribe({
      next: () => {
        // update local model
        const idx = this.financialTimeline.clientEvents.findIndex(e => e.id === updated.id);
        if (idx > -1) this.financialTimeline.clientEvents[idx] = updated;

        // refresh UI
        this.updateTimelines.emit(); // optional, if parent reloads timelines
        this.timeline.setItems(this.timelineData);
        this.cdr.detectChanges();
        this.timeline.redraw();

        callback(item);
      },
      error: (err) => {
        console.error(err);
        this.toastrService.error('Failed to save event position');
        // revert UI if save failed
        this.timeline.setItems(this.timelineData);
        this.cdr.detectChanges();
        this.timeline.redraw();
      },
    });
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
          amountCycles: this.amountCycles,
          escalataionRates : this.escalationRates,
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
        if (result && (result.status = 'Success')) {
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
          amountCycles: this.amountCycles,
          timelineId: this.financialTimeline.id,
          escalataionRates : this.escalationRates,
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
        amountCycles: this.amountCycles,
          eventType: EventType.CUSTOM,
          escalataionRates : this.escalationRates,
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
        amountCycles: this.amountCycles,
        escalataionRates : this.escalationRates,
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

// showTooltip(event: DragEvent | MouseEvent, text: string) {
//   const tooltip = document.getElementById('year-tooltip');
//   if (tooltip) {
//     tooltip.innerText = text;
//     tooltip.style.left = `${event.clientX + 12}px`;
//     tooltip.style.top = `${event.clientY + 12}px`;
//     tooltip.hidden = false;
//   }
// }

// hideTooltip() {
//   const tooltip = document.getElementById('year-tooltip');
//   if (tooltip) tooltip.hidden = true;
// }

// private startTooltipPolling(text: string) {
//   this.stopTooltipPolling(); // Clear if already running
//   const tooltip = document.getElementById('year-tooltip');
//   if (!tooltip) return;

//   tooltip.hidden = false;

//   this.tooltipPollingInterval = setInterval(() => {
//     tooltip.innerText = text;

//     const offsetX = 12;
//     const offsetY = 12;

//     // Use current mouse coordinates updated by document.mousemove
//     tooltip.style.left = `${this.tooltipMouseX + offsetX}px`;
//     tooltip.style.top = `${this.tooltipMouseY + offsetY}px`;
//   }, 33); // ~33 times/sec
// }


// private stopTooltipPolling() {
//   if (this.tooltipPollingInterval) {
//     clearInterval(this.tooltipPollingInterval);
//     this.tooltipPollingInterval = null;
//   }

//   const tooltip = document.getElementById('year-tooltip');
//   if (tooltip) tooltip.hidden = true;
// }



 // Add this method for timeline hover
  // initTimelineHover() {
  //   if (!this.timelineContainer?.nativeElement || !this.timeline) return;

  //   // Create observable for mousemove on timeline container
  //   this.timelineHoverSubscription = fromEvent<MouseEvent>(
  //     this.timelineContainer.nativeElement, 
  //     'mousemove'
  //   ).pipe(
  //     throttleTime(50) // Throttle to avoid excessive updates
  //   ).subscribe((event: MouseEvent) => {
  //     // Only process if NOT dragging
  //     if (this.isDragging || this.draggedEvent) return;
      
  //     this.handleTimelineHover(event);
  //   });

  //   // Also handle mouse leave to clear highlights
  //   fromEvent(this.timelineContainer.nativeElement, 'mouseleave')
  //     .subscribe(() => {
  //       if (!this.isDragging && !this.draggedEvent) {
  //         this.clearLabelHighlight();
  //       }
  //     });
  // }




  //  private handleTimelineHover(event: MouseEvent) {
  //   if (!this.timeline) return;

  //   // Get the time at the mouse position
  //   const props = this.timeline.getEventProperties(event);
  //   if (!props?.time) return;

  //   const hoverTime = props.time;
  //   const snappedTime = this.snapToNearestYear(hoverTime);
  //   const snappedYear = snappedTime.getFullYear();
    
  //   // Only highlight if within forecast range
  //   if (
  //     snappedYear >= moment(this.financialTimeline.forecastStartDate).year() &&
  //     snappedYear <= moment(this.financialTimeline.forecastEndtDate).year()
  //   ) {
  //     const age = this.calculateAgeForTimeline(snappedTime, new Date(this.clientBirthDate));
  //     this.highlightHoveredYearLabel(snappedYear);
  //   } else {
  //     this.clearLabelHighlight();
  //   }
  // }

  /* ===========================================
     3. HOVER LOGIC (UPDATED)
     =========================================== */
  private initTimelineHover(): void {
    if (!this.timelineContainer?.nativeElement || !this.timeline) return;

    this.timelineHoverSubscription = fromEvent<MouseEvent>(
      this.timelineContainer.nativeElement,
      'mousemove'
    )
      .pipe(throttleTime(30))
      .subscribe((event) => {
        if (this.isDragging || this.draggedEvent) return;
        this.handleTimelineHover(event);
      });

    fromEvent(this.timelineContainer.nativeElement, 'mouseleave')
      .subscribe(() => {
        if (!this.isDragging) {
          try { this.timeline.removeCustomTime(this.hoverLineId); } catch {}
          this.clearLabelHighlight();
        }
      });
  }

  private handleTimelineHover(event: MouseEvent): void {
    if (!this.timeline) return;

    const props = this.timeline.getEventProperties(event);
    if (!props?.time) return;

    const snappedTime = this.snapToNearestYear(props.time);
    const year = snappedTime.getFullYear();

    const startYear = moment(this.financialTimeline.forecastStartDate).year();
    const endYear = moment(this.financialTimeline.forecastEndtDate).year();

    if (year >= startYear && year <= endYear) {
      try {
        this.timeline.setCustomTime(snappedTime, this.hoverLineId);
      } catch {
        this.timeline.addCustomTime(snappedTime, this.hoverLineId);
      }

      this.highlightHoveredYearLabel(year);
    } else {
      try { this.timeline.removeCustomTime(this.hoverLineId); } catch {}
      this.clearLabelHighlight();
    }
  }

}
