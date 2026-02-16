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
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ClientEvent, Cycle, EscalationRate, EventIncomeType, FinancialTimeline, FinancialRecordLineItem } from '../models/financial-timeline';
import { DataSet, moment, Timeline, TimelineOptions, } from 'vis-timeline/standalone';
import { MatDialog } from '@angular/material/dialog';
import { TimelineHttpService } from '../services/timeline-http.service';
import { AddEventDialogComponent, EventType } from '../add-event-dialog/add-event-dialog.component';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    TranslateModule
  ],
  providers: [
    ToastrService,
    TranslateService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss'
})
export class TimelineChartComponent implements OnInit, OnChanges, OnDestroy {
  private readonly CHIP_ORDER = [
    'Retirement age',
    'Birth',
    'Wedding',
    'Home',
    'Travel',
    'Car',
    'Education',
    'New business',
    'Boat',
    'Inheritance',
  ];

  private readonly DIALOG_SYSTEM_EVENTS = [
    'Inheritance',
    'Wedding',
    'Travel',
    'Education',
    'New business'
  ];

  private readonly DIALOG_FINANCING_EVENTS = [
    'Home',
    'Car',
    'Boat'
  ];

  timeline: Timeline;
  customEventsLibrary: ClientEvent[];
  systemEventsLibrary: ClientEvent[];
  cachedSystemEventsLibrary: ClientEvent[];
  draggedEvent: ClientEvent | null;

  @Input() financialTimeline: FinancialTimeline;
  @Input() financialRecords: FinancialRecordLineItem[] | [];
  @Input() clientBirthDate: Date;
  @Input() client: Client;
  @Input() title: string = 'Timeline';
  @Input() showOnReports: boolean = false;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;
  escalationRates: EscalationRate[];
  amountCycles: Cycle[];

  private hoverLineId = 'hoverLine';
  private tooltipPollingInterval: any;
  private tooltipMouseX: number = 0;
  private tooltipMouseY: number = 0;
  private timelineHoverSubscription: Subscription;
  private isDragging = false; // Track drag state
  private boundDocumentDrop: ((e: DragEvent) => void) | null = null;

  constructor(
    private dialog: MatDialog,
    private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService,
    private settingHttpService: SettingsHttpService,
    private translate: TranslateService
  ) {
    this.updateTimelines = new EventEmitter<boolean>();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.client) return;

    if (changes['financialTimeline']) {
      if (this.timeline) {
        this.timeline.setItems(this.timelineData);
        this.timeline.setOptions(this.timelineOptions);
        this.timeline.redraw();
      }
    }
  }

  ngOnInit() {
    this.initTimelineContainer();
    this.getTimelineEventsLibrary();
  }

  ngOnDestroy() {
    this.removeDocumentDropListener();
  }

  ngAfterViewInit() {
    this.settingHttpService
      .getEscalationRates(this.client.id)
      .subscribe((escalationRatesResponse) => {
        escalationRatesResponse = escalationRatesResponse ?? { escalationRates: [] };
        this.escalationRates = escalationRatesResponse.escalationRates;
      }
      );

    this.settingHttpService
      .getAmountCycles()
      .subscribe((cycles) => {
        this.amountCycles = cycles;
      });
  }

  getTimelineEventsLibrary() {
    combineLatest([
      this.timelineHttpService.getSystemEvents(),
      this.timelineHttpService.getCustomEvents(),
    ])
      .pipe(
        filter((res) => !!res),
        tap((res) => {

          // cash all events
          this.cachedSystemEventsLibrary = [
            ...res[0],
            ...res[1],
          ]
            .filter(event =>
              event.name !== 'State pension'
            )
            .sort((a, b) => {
              return (
                this.CHIP_ORDER.indexOf(a.name) -
                this.CHIP_ORDER.indexOf(b.name)
              );
            });

          this.systemEventsLibrary = [
            ...res[0],
            ...res[1],
          ]
            .filter(event =>
              event.name !== 'State pension' &&
              !(
                event.name === 'Retirement age' &&
                this.financialTimeline?.clientEvents?.some(
                  ce => ce.name === 'Retirement age'
                )
              )
            )
            .sort((a, b) => {
              return (
                this.CHIP_ORDER.indexOf(a.name) -
                this.CHIP_ORDER.indexOf(b.name)
              );
            });

          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }

  onDragStart(event: DragEvent, customEvent: any) {
    if (!event.dataTransfer) {
      console.error("dataTransfer is null, drag won't work!");
      return;
    }

    this.isDragging = true;
    this.draggedEvent = customEvent;
    event.dataTransfer?.setData('text/plain', JSON.stringify(customEvent));
    this.timeline.addCustomTime(new Date(), 'dragOver');
    this.timelineContainer.nativeElement.classList.add('external-dragging');

    // Add a document-level drop listener to capture drops even when they land
    // on vis-timeline's internal item elements that intercept the event
    this.boundDocumentDrop = (e: DragEvent) => this.onDocumentDrop(e);
    document.addEventListener('drop', this.boundDocumentDrop, true); // capture phase
  }

  onDragEnd(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.clearLabelHighlight();
    this.timelineContainer.nativeElement.classList.remove('external-dragging');
    this.removeDocumentDropListener();
    this.timeline.removeCustomTime('dragOver');
    this.timeline.redraw();
  }

  private removeDocumentDropListener() {
    if (this.boundDocumentDrop) {
      document.removeEventListener('drop', this.boundDocumentDrop, true);
      this.boundDocumentDrop = null;
    }
  }

  private onDocumentDrop(event: DragEvent) {
    // Only handle if we're in an external drag and the drop is inside the timeline container
    if (!this.isDragging || !this.draggedEvent) return;

    const rect = this.timelineContainer.nativeElement.getBoundingClientRect();
    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.onDrop(event);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.timelineContainer.nativeElement.classList.remove('external-dragging');
    this.removeDocumentDropListener();

    if (!this.draggedEvent || !this.timeline) {
      this.draggedEvent = null;
      return;
    }

    // get the dropped position on the timeline
    const props = this.timeline.getEventProperties(event);
    let dropTime = props.time;

    // If dropped on an existing item, time may be null — fall back to snapped position
    if (!dropTime && props.snappedTime) {
      dropTime = props.snappedTime;
    }
    if (!dropTime) {
      // Last resort: calculate from the mouse X position on the timeline
      const rect = this.timelineContainer.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const timelineRange = this.timeline.getWindow();
      const ratio = x / rect.width;
      const ms = timelineRange.start.valueOf() + ratio * (timelineRange.end.valueOf() - timelineRange.start.valueOf());
      dropTime = this.snapToNearestYear(new Date(ms));
    }

    if (this.draggedEvent?.name === 'Retirement age') {

      // drop only once
      if (this.financialTimeline.clientEvents.find((event) => event.name === this.draggedEvent?.name)) {
        this.draggedEvent = null;
        return;
      }

      const retirementYear = this.getRetirementDropYear();
      if (!retirementYear) {
        this.draggedEvent = null;
        return;
      }

      dropTime = new Date(retirementYear, 0, 1);
    }

    if (
      moment(dropTime).year() <
      moment(this.financialTimeline.forecastStartDate).year() ||
      moment(dropTime).year() >
      moment(this.financialTimeline.forecastEndtDate).year()
    )
      return;

    if (this.draggedEvent.isPlaceHolder) {
      const clientEvent: ClientEvent = {
        ...this.draggedEvent
      };

      if (clientEvent.name === 'Birth') {
        clientEvent.name = this.getNextBirthName();
      }

      clientEvent.start = {
        year: moment(dropTime).year(),
        age: moment(dropTime).year() - moment(this.clientBirthDate).year(),
      };

      clientEvent.id = "";

      this.timelineHttpService
        .addEvent(clientEvent, this.financialTimeline.cashflow.id)
        .pipe(
          take(1),
          map((res) => {
            if (this.financialTimeline.clientEvents.length < 1) {
              this.financialTimeline.startAt = {
                age: clientEvent.start.age,
                year: clientEvent.start.year,
              };
            }
            this.updateTimelines.emit();
            this.financialTimeline.clientEvents.push(clientEvent);
            if (clientEvent.name === 'Retirement age') {
              this.removeRetirementFromChips();
            }
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

      this.draggedEvent = null;
      return;
    }

    const dropEventType = this.DIALOG_SYSTEM_EVENTS.some(baseName => this.draggedEvent?.name.startsWith(baseName))
      ? EventType.SYSTEM
      : EventType.FINANCING;

    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '900px',
      disableClose: true,
      data: {
        eventType: dropEventType,
        amountCycles: this.amountCycles,
        customEvents: this.customEventsLibrary,
        escalataionRates: this.escalationRates,
        timelineId: this.financialTimeline.id,
        cashflowId: this.financialTimeline.cashflow.id,
        clientBirthDate: this.clientBirthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
        isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
        isCashEvent: dropEventType === EventType.FINANCING ? true : false,
        patchEvent: this.draggedEvent,
        dropTime: new Date(moment(dropTime).year(), 0),
        eventsList: this.financialTimeline.clientEvents.map((event) => {
          return {
            name: event.name,
            year: event.start.year,
            age: event.start.year - moment(new Date(this.clientBirthDate)).year()
          };
        })
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if ((result.status = 'Success')) {
        this.draggedEvent = null;
        this.updateTimelines.emit();
      }
    });

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
  }

  highlightHoveredYearLabel(snappedYear: number) {
    const allMinorLabels = document.querySelectorAll('.vis-text.vis-minor');

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
        const originalShortYear = spanTag.getAttribute('data-short-year');
        if (originalShortYear) {
          spanTag.textContent = originalShortYear;
          spanTag.removeAttribute('data-short-year');
        }
      }

      (label as HTMLElement).style.display = '';
      (label as HTMLElement).style.backgroundColor = '';
      (label as HTMLElement).style.opacity = '';
      (label as HTMLElement).style.zIndex = '';
      (label as HTMLElement).style.padding = '';
      (label as HTMLElement).classList.remove('highlighted');
    });

    // Highlight the matching year
    allMinorLabels.forEach((label) => {
      const pTag = label.querySelector('p') as HTMLElement;
      const spanTag = label.querySelector('span') as HTMLElement;

      if (spanTag?.textContent?.trim() === snappedYear.toString()) {
        (label as HTMLElement).style.display = 'inline-block';
        (label as HTMLElement).style.backgroundColor = '#ffffffff';
        (label as HTMLElement).style.opacity = '1';
        (label as HTMLElement).style.zIndex = '9999';
        (label as HTMLElement).style.padding = '2px 6px';
        (label as HTMLElement).classList.add('highlighted');

        if (spanTag) {
          spanTag.setAttribute('data-short-year', spanTag.textContent ?? '');
          spanTag.textContent = snappedYear.toString();
          spanTag.style.fontSize = '16px';
          spanTag.style.fontWeight = 'bold';
          spanTag.style.color = '#000000';
        }

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

      (label as HTMLElement).style.display = '';
      (label as HTMLElement).style.backgroundColor = '';
      (label as HTMLElement).style.opacity = '';
      (label as HTMLElement).style.zIndex = '';
      (label as HTMLElement).style.padding = '';

    });
  }

  private snapToNearestYear(date: Date): Date {
    const year = date.getFullYear();
    return new Date(year, 0, 1);
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
      if (event.event.type === 'dblclick') {
        var clientEvent = this.financialTimeline.clientEvents.find(ce => ce.id === event.item);

        if (clientEvent && !clientEvent.isPlaceHolder)
          this.updateEventByDoubleClick(clientEvent);
      }
    });
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
        const startYear = event.start.year;
        const hasRealEnd = event.end && event.end.year && event.end.year > startYear;
        const isOneOff = event.isOneOff;
        const forecastEndYear = moment(this.financialTimeline.forecastEndtDate).year();

        // Non-one-off events: show actual duration
        if (!isOneOff) {
          const endYear = hasRealEnd ? event.end!.year : forecastEndYear;
          return {
            id: event.id,
            content: this.getContent(event.name, event.iconUrl),
            start: new Date(startYear, 0, 1),
            end: new Date(endYear, 0, 1),
            className: event.iconUrl,
            editable: {
              updateTime: true,
              remove: true,
            }
          };
        } else {
          // ONE-OFF EVENTS (or events without a valid end date)
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
            start: new Date(startYear, 0, 1),
            end: new Date(startYear + calculatedWidth, 0, 1),
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
    const birthDate = new Date(this.clientBirthDate);
    const birthYear = moment(this.clientBirthDate).year();
    const forecastStartDate = new Date(this.financialTimeline.forecastStartDate);
    const forecastStartYear = moment(this.financialTimeline.forecastStartDate).year();

    const timelineEndYear = moment(this.financialTimeline.forecastEndtDate).year();

    // Adjust start year so that (startYear - birthYear) is even
    let startYear = forecastStartYear;

    const timelineEndDate = new Date(timelineEndYear + 1, 0, 1);

    return {
      editable: {
        add: false, // Prevent adding new events directly
        updateTime: !this.showOnReports, // Allow changing event time by dragging
        updateGroup: false, // Prevent moving events between groups
        remove: !this.showOnReports, // Prevent deletion via UI
        overrideItems: false
      },
      selectable: true,

      stack: true, // Prevent overlapping events
      zoomable: false, // Allow zooming
      moveable: !this.showOnReports,
      horizontalScroll: false, // Enable scrolling
      orientation: 'bottom', // Place events at the top
      margin: { item: 10 }, // Adds spacing between events
      start: new Date(startYear, 0, 1),
      min: new Date(startYear, 0, 1),
      end: timelineEndDate,
      max: timelineEndDate,
      minHeight: '304px',
      width: '100%',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      showMajorLabels: true,
      timeAxis: { scale: 'month', step: 12 },
      format: {
        minorLabels: (date: any) => {
          const year = date.year();
          const age = this.getTimelineLabelAge(
            year,
            forecastStartYear,
            forecastStartDate,
            birthDate,
            birthYear
          );
          return year >= forecastStartYear && year <= timelineEndYear
            ? `<div id='selected'><p>${age}</p><span>${year}</span></div>`
            : '';
        },
        majorLabels: function (date: any) {
          return ``; // Show actual years
        },
      },
      onRemove: (item, callback) => {
        this.handleEventRemoval(item, callback);
      },
      onMove: (item, callback) => {
        this.handleEventUpdate(item, callback);
      },
      onMoving: (item, callback) => {
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

  private getTimelineLabelAge(
    year: number,
    forecastStartYear: number,
    forecastStartDate: Date,
    birthDate: Date,
    birthYear: number
  ): number {
    // First label should reflect the actual current age at forecast start.
    if (year === forecastStartYear) {
      return this.calculateAgeForTimeline(forecastStartDate, birthDate);
    }

    return year - birthYear;
  }

  handleEventMoving(item: any, callback: (item: any) => void) {
    try {
      const snappedTime = new Date(item.start);
      this.timeline.setCustomTime(snappedTime, 'dragOver');

      const year = snappedTime.getFullYear();
      const age = this.calculateAgeForTimeline(snappedTime, new Date(this.clientBirthDate));
      requestAnimationFrame(() => {
        this.highlightHoveredYearLabel(year);
      });

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
      this.currentZoomPercentage = this.currentZoomPercentage + 0.05;
      this.timeline.zoomIn(this.currentZoomPercentage);
    }
  }

  zoomOut() {
    if (this.currentZoomPercentage >= 0.05) {
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
    this.clearLabelHighlight();

    const dropTime = item.start;

    if (
      moment(dropTime).year() < moment(this.financialTimeline.forecastStartDate).year() ||
      moment(dropTime).year() > moment(this.financialTimeline.forecastEndtDate).year()
    ) {
      this.timeline.setItems(this.timelineData);
      this.cdr.detectChanges();
      this.timeline.redraw();
      return;
    }

    const existing = this.financialTimeline.clientEvents.find(ev => ev.id === item.id);
    if (!existing) {
      this.timeline.setItems(this.timelineData);
      this.cdr.detectChanges();
      this.timeline.redraw();
      return;
    }

    const newStartYear = moment(new Date(moment(item.start).year(), 1)).year();
    const newEndYear = moment(new Date(moment(item.end).year(), 1)).year();

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
        age: newStartYear - moment(this.clientBirthDate).year(),
      },
      // if event had no end, keep it undefined OR keep previous end if it existed and user didn't resize
      end: (() => {
        if (!existing.end || !existing.end.year) return existing.end; // one-off stays one-off
        return {
          year: newEndYear,
          age: newEndYear - moment(this.clientBirthDate).year(),
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
    const linkedIncomesAndExpenses = 
      this.financialRecords.filter(e => e.parentId === clientEvent.id);

    const eventType = this.DIALOG_SYSTEM_EVENTS.some(baseName => clientEvent.name.startsWith(baseName))
      ? EventType.SYSTEM
      : this.DIALOG_FINANCING_EVENTS.some(baseName => clientEvent.name.startsWith(baseName))
        ? EventType.FINANCING
        : EventType.CUSTOM;

    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventType: eventType,
        escalataionRates: this.escalationRates,
        customEvents: this.customEventsLibrary,
        timelineId: this.financialTimeline.id,
        isIncomeEvent: clientEvent.type === EventIncomeType.Income,
        cashflowId: this.financialTimeline.cashflow.id,
        clientBirthDate: this.clientBirthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
        eventsList: this.financialTimeline.clientEvents.map((event) => {
          return {
            name: event.name,
            year: event.start.year,
            age: event.start.year - moment(new Date(this.clientBirthDate)).year(),
          };
        }),
        isEditWorkflow: true,
        patchEvent: clientEvent,
        financialRecords: linkedIncomesAndExpenses
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && (result.status = 'Success')) {
        this.updateTimelines.emit();
      }
    });
  }

  newEventClicked() {
    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '700px',
      disableClose: true,
      data: {
        eventType: EventType.CUSTOM,
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
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
            age: event.start.year - moment(new Date(this.clientBirthDate)).year()
          };
        }),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if ((result.status = 'Success')) {
        this.updateTimelines.emit();
      }
    });
  }

  handleEventRemoval(item: any, callback: (item: any) => void) {
    let isDeleteFinanceEvent = false;

    if (item.content?.includes('Home') 
      || item.content?.includes('Car')
    || item.content?.includes('Boat')) {
      isDeleteFinanceEvent = true;
    }
    
    if (isDeleteFinanceEvent) {
      this.timelineHttpService
        .deleteFinancingEvent(this.financialTimeline.cashflow.id, item.id)
        .pipe(
          take(1),
          map((res) => {
            this.financialTimeline.clientEvents.splice(
              this.financialTimeline.clientEvents.findIndex(
                (event) => event.id === item.id
              ),
              1
            );
            if (item.content?.includes('Retirement age')) {
              this.addRetirementBackToChips();
            }
            this.timeline.setItems(this.timelineData);
            this.timeline.redraw();
            callback(item);
          })
        )
        .subscribe();
    }
    else {
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
            if (item.content?.includes('Retirement age')) {
              this.addRetirementBackToChips();
            }
            this.timeline.setItems(this.timelineData);
            this.timeline.redraw();
            callback(item);
          })
        )
        .subscribe();
    }
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
          try { this.timeline.removeCustomTime(this.hoverLineId); } catch { }
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
      try { this.timeline.removeCustomTime(this.hoverLineId); } catch { }
      this.clearLabelHighlight();
    }
  }

  private getRetirementDropYear(): number | null {
    const lang = this.translate.currentLang || this.translate.defaultLang;

    const retirementAge =
      lang === 'it' ? 67 :
        lang === 'en' ? 64 :
          null;

    if (!retirementAge) return null;

    const currentAge = this.calculateAge(new Date(this.clientBirthDate));
    if (currentAge >= retirementAge) return null;

    return moment(this.clientBirthDate).year() + retirementAge;
  }

  private removeRetirementFromChips(): void {
    this.systemEventsLibrary = this.systemEventsLibrary.filter(
      e => e.name !== 'Retirement age'
    );
    this.cdr.detectChanges();
  }

  private addRetirementBackToChips(): void {
    const alreadyExists = this.systemEventsLibrary.some(
      e => e.name === 'Retirement age'
    );

    if (alreadyExists) return;

    const retirement = this.cachedSystemEventsLibrary.find(
      e => e.name === 'Retirement age'
    );

    if (!retirement) return;

    this.systemEventsLibrary = [
      ...this.systemEventsLibrary,
      retirement,
    ].sort(
      (a, b) =>
        this.CHIP_ORDER.indexOf(a.name) -
        this.CHIP_ORDER.indexOf(b.name)
    );

    this.cdr.detectChanges();
  }

  private getNextBirthName(): string {
    const birthEvents = this.financialTimeline.clientEvents
      .filter(e => e.name.startsWith('Birth'));

    if (birthEvents.length === 0) return 'Birth';

    return `Birth ${birthEvents.length + 1}`;
  }
}
