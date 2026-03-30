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
  AfterViewChecked,
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
  FinancialRecordLineItem,
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
import {
  combineLatest,
  filter,
  fromEvent,
  Subscription,
  take,
  tap,
  throttleTime,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { Client } from 'src/app/clients/models/client';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SettingsHttpService } from '../../settings/services/settings-http.service';
import { TranslateModule } from '@ngx-translate/core';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';

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
    TranslateModule,
  ],
  providers: [ToastrService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-chart.component.html',
  styleUrl: './timeline-chart.component.scss',
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
  ];

  private readonly DIALOG_SYSTEM_EVENTS = [
    'Wedding',
    'Travel',
    'Education',
    'New business',
  ];

  private readonly DIALOG_FINANCING_EVENTS = ['Home', 'Car', 'Boat'];

  timeline: Timeline;
  customEventsLibrary: ClientEvent[];
  systemEventsLibrary: ClientEvent[];
  cachedSystemEventsLibrary: ClientEvent[];
  draggedEvent: ClientEvent | null;

  @Input() financialTimeline: FinancialTimeline;
  @Input() financialRecords: FinancialRecordLineItem[] | [];
  @Input() clientBirthDate: Date;
  @Input() client: Client;
  @Input() planDuration?: number;
  @Input() title: string = 'Timeline';

  /** True when client has a partner. */
  get hasPartner(): boolean {
    return !!this.client?.partnerDetail?.birthDate;
  }

  get showDualAxis(): boolean {
    if (!this.hasPartner) return false;
    return (
      this.financialTimeline?.clientEvents?.some(
        (ce) => ce.isPartnerEvent && this.isEventInVisibleRange(ce),
      ) ?? false
    );
  }
  /** Main client initial for axis label (e.g. "Age M"). */
  get mainClientInitial(): string {
    const name = this.client?.clientDetails?.firstName ?? '';
    return name.trim().length ? name.trim().charAt(0).toUpperCase() : '?';
  }
  /** Partner initial for axis label (e.g. "Age L"). */
  get partnerInitial(): string {
    const name = this.client?.partnerDetail?.firstName ?? '';
    return name.trim().length ? name.trim().charAt(0).toUpperCase() : '?';
  }
  /** Partner birth date for age calculation; null if no partner. */
  get partnerBirthDate(): Date | null {
    const d = this.client?.partnerDetail?.birthDate;
    return d ? new Date(d) : null;
  }
  @Input() showOnReports: boolean = false;
  @Input() cashflowInflationRate: number = 0;
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
  private lastValidDragTime: Date | null = null; // Store last valid drag position from onDragOver
  private lastRetirementDependencyKey: string | null = null;

  constructor(
    private dialog: MatDialog,
    private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService,
    private settingHttpService: SettingsHttpService,
  ) {
    this.updateTimelines = new EventEmitter<boolean>();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.client) return;

    if (this.haveRetirementDependenciesChanged()) {
      this.recalculateRetirementEventPositions();
    }

    if (
      changes['financialTimeline'] ||
      changes['client'] ||
      changes['clientBirthDate'] ||
      changes['planDuration']
    ) {
      if (this.timeline) {
        this.timeline.setItems(this.timelineData);
        this.timeline.setOptions(this.timelineOptions);
        this.timeline.redraw();
      }
      // Re-sync retirement chip visibility based on updated clientEvents
      this.syncRetirementChipVisibility();
    }
  }

  ngOnInit() {
    this.lastRetirementDependencyKey = this.getRetirementDependencyKey();
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
        escalationRatesResponse = escalationRatesResponse ?? {
          escalationRates: [],
        };
        this.escalationRates = patchInflationRateDescription(
          escalationRatesResponse.escalationRates,
          this.cashflowInflationRate,
        );
      });

    this.settingHttpService.getAmountCycles().subscribe((cycles) => {
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
          // Merge system + custom events, deduplicate by name to prevent chips like
          // 'Retirement age' appearing twice if returned by both endpoints.
          const dedupeByName = (events: any[]) => {
            const seen = new Set<string>();
            return events.filter((e) => {
              if (seen.has(e.name)) return false;
              seen.add(e.name);
              return true;
            });
          };

          // cache all events
          this.cachedSystemEventsLibrary = dedupeByName([...res[0], ...res[1]])
            .filter((event) => event.name !== 'State pension')
            .sort((a, b) => {
              return (
                this.CHIP_ORDER.indexOf(a.name) -
                this.CHIP_ORDER.indexOf(b.name)
              );
            });

          // Hide/show Retirement age chip based on client age vs default retirement age.
          // For joint accounts, always filter out generic "Retirement age" - syncRetirementChipVisibility adds named chips.
          this.systemEventsLibrary = [...res[0], ...res[1]]
            .filter((event) => {
              if (event.name === 'State pension') return false;
              if (event.name === 'Inheritance') return false;
              if (event.name === 'Retirement age') {
                if (this.hasPartner) return false; // Joint: add named chips via syncRetirementChipVisibility
                return !this.shouldHideRetirementChip(); // Solo: filter when on timeline
              }
              return true;
            })
            .sort(
              (a, b) =>
                this.getChipSortOrder(a.name) - this.getChipSortOrder(b.name),
            );

          this.cdr.detectChanges();
          // Single source of truth: hide/show Retirement age chip based on timeline state
          this.syncRetirementChipVisibility();
        }),
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
    this.clearDragAndHoverVisuals();
    this.timelineContainer.nativeElement.classList.remove('external-dragging');
    this.removeDocumentDropListener();
    this.lastValidDragTime = null;
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
    this.clearDragAndHoverVisuals();
    this.timelineContainer.nativeElement.classList.remove('external-dragging');
    this.removeDocumentDropListener();

    if (!this.draggedEvent || !this.timeline) {
      this.draggedEvent = null;
      return;
    }

    let dropTime: Date | null = this.getTimeFromMouseX(event.clientX);

    if (!dropTime) {
      const props = this.timeline.getEventProperties(event);
      if (props?.time) {
        dropTime = this.snapToNearestYear(props.time);
      }
      if (!dropTime && props?.snappedTime) {
        dropTime = this.snapToNearestYear(props.snappedTime);
      }
    }

    if (!dropTime) {
      dropTime = this.lastValidDragTime ?? null;
    }

    this.lastValidDragTime = null;

    if (this.draggedEvent?.name?.toLowerCase().startsWith('retirement age')) {
      const existingPrimary = this.financialTimeline.clientEvents.find(
        (event) =>
          event.name.toLowerCase().startsWith('retirement age') &&
          !event.isPartnerEvent,
      );
      const existingPartner = this.financialTimeline.clientEvents.find(
        (event) =>
          event.name.toLowerCase().startsWith('retirement age') &&
          !!event.isPartnerEvent,
      );
      const isPartnerChip = !!this.draggedEvent?.isPartnerEvent;

      const canDropClient = !existingPrimary;
      const canDropPartner = this.hasPartner && !existingPartner;
      const allowed = isPartnerChip ? canDropPartner : canDropClient;

      if (!allowed) {
        this.draggedEvent = null;
        return;
      }
    }

    // Validate dropTime exists and is within bounds
    if (
      !dropTime ||
      moment(dropTime).year() <
        moment(this.financialTimeline.forecastStartDate).year() ||
      moment(dropTime).year() > this.effectiveForecastEndYear
    ) {
      this.draggedEvent = null;
      return;
    }

    if (this.draggedEvent.isPlaceHolder) {
      const clientEvent: ClientEvent = {
        ...this.draggedEvent,
      };

      if (clientEvent.name === 'Birth') {
        clientEvent.name = this.getNextBirthName();
      }

      const isPartnerRetirement =
        clientEvent.name?.toLowerCase().startsWith('retirement age') &&
        (this.draggedEvent?.isPartnerEvent === true ||
          (this.hasPartner &&
            this.financialTimeline.clientEvents.some(
              (e) =>
                e.name.toLowerCase().startsWith('retirement age') &&
                !e.isPartnerEvent,
            )));

      if (isPartnerRetirement) {
        clientEvent.isPartnerEvent = true;
      }

      const birthDate =
        isPartnerRetirement && this.partnerBirthDate
          ? this.partnerBirthDate
          : this.clientBirthDate;

      clientEvent.start = {
        year: moment(dropTime).year(),
        age: moment(dropTime).year() - moment(birthDate).year(),
      };

      clientEvent.id = '';

      if (this.financialTimeline.clientEvents.length < 1) {
        this.financialTimeline.startAt = {
          age: clientEvent.start.age,
          year: clientEvent.start.year,
        };
      }

      this.financialTimeline.clientEvents.push(clientEvent);
      if (clientEvent.name === 'Retirement age') {
        this.syncRetirementChipVisibility();
      }
      this.timeline.setItems(this.timelineData);
      this.cdr.detectChanges();
      this.timeline.redraw();
      this.draggedEvent = null;

      this.timelineHttpService
        .addEvent(clientEvent, this.financialTimeline.cashflow.id)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.updateTimelines.emit();
          },
          error: (err) => {
            console.error(err);
            const idx =
              this.financialTimeline.clientEvents.indexOf(clientEvent);
            if (idx > -1) this.financialTimeline.clientEvents.splice(idx, 1);
            if (clientEvent.name === 'Retirement age') {
              this.syncRetirementChipVisibility();
            }
            this.timeline.setItems(this.timelineData);
            this.cdr.detectChanges();
            this.timeline.redraw();
            this.toastrService.error('Failed to add event');
          },
        });

      return;
    }

    const dropEventType = this.DIALOG_SYSTEM_EVENTS.some((baseName) =>
      this.draggedEvent?.name.startsWith(baseName),
    )
      ? EventType.SYSTEM
      : EventType.FINANCING;

    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '612px',
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
        clientCountryCode: this.client.clientDetails.country,
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate,
        ).year(),
        isIncomeEvent: this.draggedEvent.type === EventIncomeType.Income,
        isCashEvent: dropEventType === EventType.FINANCING ? true : false,
        patchEvent: this.draggedEvent,
        dropTime: new Date(moment(dropTime).year(), 0),
        forecastStartDate: new Date(this.financialTimeline.forecastStartDate),
        eventsList: this.financialTimeline.clientEvents.map((event) => ({
          name: this.getEventDisplayNameForList(event),
          year: event.start.year,
          age: this.getAgeAtYearForEvent(event, event.start.year),
        })),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.status === 'Success') {
        this.draggedEvent = null;
        this.updateTimelines.emit();
      }
    });

    this.draggedEvent = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();

    if (!this.timeline) return;

    let snappedTime: Date | null = this.getTimeFromMouseX(event.clientX);

    if (!snappedTime) {
      const props = this.timeline.getEventProperties(event);
      if (props?.time) {
        snappedTime = this.snapToNearestYear(props.time);
      }
    }

    if (!snappedTime) return;

    this.lastValidDragTime = snappedTime;

    try {
      this.timeline.setCustomTime(snappedTime, 'dragOver');
    } catch {
      /* custom time may not exist yet */
    }

    this.highlightHoveredYearLabel(snappedTime.getFullYear());
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
        (label as HTMLElement).style.padding = '3px';
        (label as HTMLElement).classList.add('highlighted');

        if (spanTag) {
          spanTag.setAttribute('data-short-year', spanTag.textContent ?? '');
          spanTag.textContent = snappedYear.toString();
          spanTag.style.fontSize = '16px';
          spanTag.style.fontWeight = 'bold';
          spanTag.style.color = '#1c1c1c';
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
      const el = label as HTMLElement;
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

      el.style.display = '';
      el.style.backgroundColor = '';
      el.style.opacity = '';
      el.style.zIndex = '';
      el.style.padding = '';
      el.classList.remove('highlighted');
    });
  }

  /** Clears blue line and year highlight after drag ends. Call from all drop/dragend paths. */
  private clearDragAndHoverVisuals(): void {
    if (this.timeline) {
      try {
        this.timeline.removeCustomTime('dragOver');
      } catch {}
      try {
        this.timeline.removeCustomTime(this.hoverLineId);
      } catch {}
      this.timeline.redraw();
    }
    this.clearLabelHighlight();
  }

  private getTimeFromMouseX(clientX: number): Date | null {
    if (clientX <= 0) return null;

    const centerPanel = this.timelineContainer.nativeElement.querySelector(
      '.vis-panel.vis-center',
    );
    if (!centerPanel) return null;

    const panelRect = centerPanel.getBoundingClientRect();
    if (panelRect.width <= 0) return null;

    const x = clientX - panelRect.left;
    const ratio = x / panelRect.width;
    if (ratio < 0 || ratio > 1) return null;

    const timelineRange = this.timeline.getWindow();
    const ms =
      timelineRange.start.valueOf() +
      ratio * (timelineRange.end.valueOf() - timelineRange.start.valueOf());
    return this.snapToNearestYear(new Date(ms));
  }

  private snapToNearestYear(date: Date): Date {
    const year = date.getFullYear();
    const midYear = new Date(year, 6, 1); // July 1st as midpoint
    return date < midYear ? new Date(year, 0, 1) : new Date(year + 1, 0, 1);
  }

  /**
   * The effective forecast end year from the plan projection.
   */
  private get effectiveForecastEndYear(): number {
    const forecastStartDate = new Date(
      this.financialTimeline.forecastStartDate,
    );
    const forecastStartYear = moment(forecastStartDate).year();
    const birthDate = new Date(this.clientBirthDate);
    const startAge = this.calculateAgeForTimeline(forecastStartDate, birthDate);
    const planEndYear = Number.isFinite(this.planDuration as number)
      ? forecastStartYear + (Number(this.planDuration) - startAge)
      : null;
    const forecastEndYear = moment(
      this.financialTimeline.forecastEndtDate,
    ).year();
    return Math.max(forecastStartYear, planEndYear ?? forecastEndYear);
  }

  initTimelineContainer() {
    if (!this.timelineContainer?.nativeElement) return;

    this.timeline = new Timeline(
      this.timelineContainer.nativeElement,
      this.timelineData,
      this.timelineOptions,
    );

    this.timeline.on('mouseDown', (props) => {
      if (props.item) {
        this.timeline.setSelection(props.item);
      }
    });

    this.initTimelineHover();
    this.stripTimelineTooltips();

    this.timeline.on('changed', () => {
      this.adjustItemZIndex();
      this.renderConnectorLines();
    });

    this.timeline.on('doubleClick', (event) => {
      event.event.preventDefault();
      event.event.stopPropagation();
      if (event.event.type === 'dblclick') {
        var clientEvent = this.financialTimeline.clientEvents.find(
          (ce) => ce.id === event.item,
        );

        if (clientEvent && !clientEvent.isPlaceHolder)
          this.updateEventByDoubleClick(clientEvent);
      }
    });
  }

  private adjustItemZIndex(): void {
    const container = this.timelineContainer?.nativeElement;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll('.vis-item'),
    ) as HTMLElement[];

    items.forEach((item) => {
      const top = parseFloat(item.style.top) || 0;
      item.style.zIndex = String(Math.max(1, Math.round(top) + 1));
    });
  }

  private readonly CONNECTOR_LINE_COLORS: Record<string, string> = {
    'birth-icon': '#fe9614',
    'wedding-icon': '#6155f5',
    'home-icon': '#ff2d55',
    'travel-icon': '#0088ff',
    'car-icon': '#ac7f5e',
    'education-icon': '#00c8b3',
    'new-business-icon': '#34c759',
    'boat-icon': '#ff7504',
    'retirement-age-icon': '#0088ff',
    'partner-retirement-age-icon': '#fe9614',
    'custom-icon': '#8388ff',
  };

  private renderConnectorLines(): void {
    const container = this.timelineContainer?.nativeElement;
    if (!container) return;

    const centerPanel = container.querySelector(
      '.vis-panel.vis-center',
    ) as HTMLElement;
    if (!centerPanel) return;

    let linesLayer = centerPanel.querySelector(
      '.connector-lines-layer',
    ) as HTMLElement;
    if (!linesLayer) {
      linesLayer = document.createElement('div');
      linesLayer.className = 'connector-lines-layer';
      centerPanel.insertBefore(linesLayer, centerPanel.firstChild);
    }
    linesLayer.innerHTML = '';

    const centerRect = centerPanel.getBoundingClientRect();
    const items = Array.from(
      container.querySelectorAll('.vis-item'),
    ) as HTMLElement[];

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const lineLeft = itemRect.left - centerRect.left + 1;
      const lineTop = itemRect.bottom - centerRect.top - 12;
      const lineHeight = centerRect.height - lineTop - 4;
      if (lineHeight <= 0) return;

      const line = document.createElement('div');
      line.className = 'connector-line';
      line.style.position = 'absolute';
      line.style.left = `${lineLeft}px`;
      line.style.top = `${lineTop}px`;
      line.style.width = '1.5px';
      line.style.height = `${lineHeight}px`;
      line.style.backgroundColor = this.getConnectorLineColor(item);
      linesLayer.appendChild(line);
    });
  }

  private getConnectorLineColor(item: HTMLElement): string {
    for (const [cls, color] of Object.entries(this.CONNECTOR_LINE_COLORS)) {
      if (item.classList.contains(cls)) return color;
    }
    return '#ccc';
  }

  get timelineData(): DataSet<
    {
      id: string;
      content: string;
      start: Date;
      end: Date | string;
      className: string;
      type?: string;
    },
    'id'
  > {
    const timelineStartYear = moment(
      this.financialTimeline.forecastStartDate,
    ).year();
    const timelineEndYear = this.effectiveForecastEndYear;
    const timelineTotalYears = timelineEndYear - timelineStartYear;

    // Pixel width of the timeline container (used to compute years-per-pixel)
    const containerPxWidth =
      this.timelineContainer?.nativeElement?.clientWidth || 1200;
    // Approximate pixel width per year in the timeline
    const pxPerYear = containerPxWidth / timelineTotalYears;

    const dataArray = this.financialTimeline.clientEvents
      .filter((event) => {
        const inVisibleRange =
          event.start.year >= timelineStartYear &&
          event.start.year <= timelineEndYear;
        if (!inVisibleRange) return false;

        return true;
      })
      .map((event, index) => {
        const startYear = event.start.year;
        const hasRealEnd =
          event.end && event.end.year && event.end.year > startYear;
        const isOneOff = event.isOneOff;
        const forecastEndYear = timelineEndYear;

        const eventId = event.id || `placeholder-${event.name}-${index}`;

        // Estimate the pixel width needed to display icon + event name + padding
        // Icon ~20px, padding ~24px, text ~9px per character (bold 14px font)
        const estimatedTextPx = 20 + 28 + event.name.length * 9;
        // Minimum years to fit the text (always at least 1)
        const minYearsForText = Math.max(
          1,
          Math.ceil(estimatedTextPx / pxPerYear),
        );

        let minContainerWidth = minYearsForText;

        const maxAvailableWidth = Math.max(1, forecastEndYear - startYear);

        if (!isOneOff && hasRealEnd) {
          const realDuration =
            Math.min(event.end!.year, forecastEndYear + 1) - startYear;
          const visualWidth = Math.min(
            Math.max(realDuration, minContainerWidth),
            maxAvailableWidth,
          );
          return {
            id: eventId,
            content: this.getContent(event),
            start: new Date(startYear, 0, 1),
            end: new Date(startYear + visualWidth, 0, 1),
            type: 'range',
            className: this.getTimelineVisClassName(event),
            editable: {
              updateTime: true,
              remove: true,
            },
          };
        } else {
          const finalWidth = Math.min(minContainerWidth, maxAvailableWidth);
          const clampedEndYear = Math.min(
            forecastEndYear + 1,
            startYear + finalWidth,
          );
          return {
            id: eventId,
            content: this.getContent(event),
            start: new Date(startYear, 0, 1),
            end: new Date(clampedEndYear, 0, 1),
            className: this.getTimelineVisClassName(event),
            editable: {
              updateTime: true,
              remove: true,
            },
          };
        }
      });

    return new DataSet(dataArray);
  }

  get timelineOptions(): TimelineOptions {
    const birthDate = new Date(this.clientBirthDate);
    const birthYear = moment(this.clientBirthDate).year();
    const forecastStartDate = new Date(
      this.financialTimeline.forecastStartDate,
    );
    const forecastStartYear = moment(
      this.financialTimeline.forecastStartDate,
    ).year();

    const timelineEndYear = this.effectiveForecastEndYear;

    // Adjust start year so that (startYear - birthYear) is even
    let startYear = forecastStartYear;

    const timelineEndDate = new Date(timelineEndYear + 1, 0, 1);

    return {
      editable: {
        add: false, // Prevent adding new events directly
        updateTime: !this.showOnReports, // Allow changing event time by dragging
        updateGroup: false, // Prevent moving events between groups
        remove: !this.showOnReports, // Prevent deletion via UI
        overrideItems: false,
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
      minHeight: '376px',
      width: '100%',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      showMajorLabels: true,
      timeAxis: { scale: 'month', step: 12 },
      format: {
        minorLabels: (date: any) => {
          const year = date.year();
          if (year < forecastStartYear || year > timelineEndYear) return '';
          const ageM = this.getTimelineLabelAge(
            year,
            forecastStartYear,
            forecastStartDate,
            birthDate,
            birthYear,
          );
          if (this.showDualAxis && this.partnerBirthDate) {
            const partnerBirthYear = moment(this.partnerBirthDate).year();
            const ageL = this.getTimelineLabelAge(
              year,
              forecastStartYear,
              forecastStartDate,
              this.partnerBirthDate,
              partnerBirthYear,
            );
            return `<div id='selected'><p>${ageM}</p><p>${ageL}</p><span>${year}</span></div>`;
          }
          return `<div id='selected'><p>${ageM}</p><span>${year}</span></div>`;
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
        this.handleEventMoving(item, callback);
      },
      snap: (date: Date) => {
        const year = date.getFullYear();
        const midYear = new Date(year, 6, 1); // July 1st
        const nextYearStart = new Date(year + 1, 0, 1);
        const currentYearStart = new Date(year, 0, 1);
        return date < midYear ? currentYearStart : nextYearStart;
      },
    };
  }

  private getTimelineLabelAge(
    year: number,
    forecastStartYear: number,
    forecastStartDate: Date,
    birthDate: Date,
    _birthYear: number,
  ): number {
    const baseAge = this.calculateAgeForTimeline(forecastStartDate, birthDate);
    return baseAge + (year - forecastStartYear);
  }

  handleEventMoving(item: any, callback: (item: any) => void) {
    const snappedTime = this.snapToNearestYear(new Date(item.start));

    try {
      this.timeline.setCustomTime(snappedTime, 'dragOver');
    } catch {
      this.timeline.addCustomTime(snappedTime, 'dragOver');
    }

    requestAnimationFrame(() => {
      this.highlightHoveredYearLabel(snappedTime.getFullYear());
    });

    callback(item);
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
    this.clearDragAndHoverVisuals();

    const snappedEnd = item.end
      ? this.snapToNearestYear(new Date(item.end))
      : null;

    let existing = this.financialTimeline.clientEvents.find(
      (ev) => ev.id === item.id,
    );

    if (!existing && item.id && item.id.startsWith('placeholder-')) {
      const parts = item.id.split('-');
      const eventName = parts.slice(1, -1).join('-');
      existing = this.financialTimeline.clientEvents.find(
        (ev) => ev.name === eventName && !ev.id,
      );
    }

    if (!existing) {
      callback(null);
      return;
    }

    const newStartYear = this.snapToNearestYear(
      new Date(item.start),
    ).getFullYear();

    if (
      newStartYear < moment(this.financialTimeline.forecastStartDate).year() ||
      newStartYear > this.effectiveForecastEndYear
    ) {
      callback(null);
      return;
    }

    const newEndYear = snappedEnd
      ? snappedEnd.getFullYear()
      : moment(new Date(moment(item.end).year(), 1)).year();

    if (existing.isOneOff && existing.start?.year === newStartYear) {
      callback(null);
      return;
    }

    const updated = {
      ...existing,
      start: {
        year: newStartYear,
        age: newStartYear - moment(this.clientBirthDate).year(),
      },
      end: (() => {
        if (!existing.end || !existing.end.year) return existing.end;
        return {
          year: newEndYear,
          age: newEndYear - moment(this.clientBirthDate).year(),
        };
      })(),
    };

    const idx = this.financialTimeline.clientEvents.indexOf(existing);
    if (idx > -1) this.financialTimeline.clientEvents[idx] = updated;
    callback(item);

    this.timelineHttpService
      .addEvent(updated, this.financialTimeline.cashflow.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.updateTimelines.emit();
        },
        error: (err) => {
          console.error('Failed to save event position:', err);
          this.toastrService.error('Failed to save event position');
          if (idx > -1) this.financialTimeline.clientEvents[idx] = existing;
          this.timeline.setItems(this.timelineData);
          this.cdr.detectChanges();
          this.timeline.redraw();
        },
      });
  }

  updateEventByDoubleClick(clientEvent: ClientEvent) {
    const linkedIncomesAndExpenses = this.financialRecords.filter(
      (e) => e.parentId === clientEvent.id,
    );

    const eventType = this.DIALOG_SYSTEM_EVENTS.some((baseName) =>
      clientEvent.name.startsWith(baseName),
    )
      ? EventType.SYSTEM
      : this.DIALOG_FINANCING_EVENTS.some((baseName) =>
            clientEvent.name.startsWith(baseName),
          )
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
        clientCountryCode: this.client.clientDetails.country,
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate,
        ).year(),
        forecastStartDate: new Date(this.financialTimeline.forecastStartDate),
        eventsList: this.financialTimeline.clientEvents.map((event) => ({
          name: this.getEventDisplayNameForList(event),
          year: event.start.year,
          age: this.getAgeAtYearForEvent(event, event.start.year),
        })),
        isEditWorkflow: true,
        patchEvent: clientEvent,
        financialRecords: linkedIncomesAndExpenses,
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
      width: '612px',
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
        clientCountryCode: this.client.clientDetails.country,
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate,
        ).year(),
        forecastStartDate: new Date(this.financialTimeline.forecastStartDate),
        eventsList: this.financialTimeline.clientEvents.map((event) => ({
          name: this.getEventDisplayNameForList(event),
          year: event.start.year,
          age: this.getAgeAtYearForEvent(event, event.start.year),
        })),
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

    if (
      item.content?.includes('Home') ||
      item.content?.includes('Car') ||
      item.content?.includes('Boat')
    ) {
      isDeleteFinanceEvent = true;
    }

    const onSuccess = () => {
      // Let the parent refresh handle state updates via ngOnChanges
      this.updateTimelines.emit();
      callback(item);
    };

    const onError = (err: any) => {
      console.error('Failed to delete event:', err);
      // On error, user can try again - don't modify local state
    };

    if (isDeleteFinanceEvent) {
      this.timelineHttpService
        .deleteFinancingEvent(this.financialTimeline.cashflow.id, item.id)
        .pipe(take(1))
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this.timelineHttpService
        .deleteEvent(this.financialTimeline.cashflow.id, item.id)
        .pipe(take(1))
        .subscribe({ next: onSuccess, error: onError });
    }
  }

  private isPartnerRetirementEvent(event: ClientEvent): boolean {
    return !!(
      event?.name?.toLowerCase().startsWith('retirement age') &&
      event.isPartnerEvent
    );
  }

  /** SVG base name for draggable chips and vis item content (distinct asset for partner retirement). */
  getTimelineEventIconBase(event: ClientEvent): string {
    if (this.isPartnerRetirementEvent(event)) {
      return 'partner-retirement-age-icon';
    }
    return event.iconUrl;
  }

  /** vis-timeline CSS class for item background, connector line, and selection state. */
  getTimelineVisClassName(event: ClientEvent): string {
    if (this.isPartnerRetirementEvent(event)) {
      return 'partner-retirement-age-icon';
    }
    return event.iconUrl;
  }

  private getContent(event: ClientEvent): string {
    const title = this.getEventTitleForDisplay(event);
    const img = this.getTimelineEventIconBase(event);
    const extraClass = event.name?.toLowerCase().startsWith('retirement age')
      ? this.isPartnerRetirementEvent(event)
        ? ' partner-retirement-age-chip'
        : ' retirement-age-chip'
      : '';
    return `
    <div class="timeline-event-chip with-padding${extraClass}" title="${title}">
      <div class="event-left">
        <img src="/assets/images/svgs/${img}.svg" class="icon" />
        <span class="label">${title}</span>
      </div>
    </div>`;
  }

  private getEventTitleForDisplay(event: ClientEvent): string {
    const rawTitle = (event?.name ?? '').trim();
    if (!rawTitle.toLowerCase().startsWith('retirement age')) {
      return rawTitle;
    }

    if (!this.hasPartner) {
      return 'Retirement age';
    }

    const personName = event.isPartnerEvent
      ? this.client?.partnerDetail?.firstName?.trim()
      : this.client?.clientDetails?.firstName?.trim();

    return personName ? `Retirement age ${personName}` : 'Retirement age';
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
      (date.getMonth() === dateOfBirth.getMonth() &&
        date.getDate() >= dateOfBirth.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return age;
  };

  private getAgeAtYearForEvent(clientEvent: ClientEvent, year: number): number {
    const birthDate =
      clientEvent.isPartnerEvent && this.partnerBirthDate
        ? new Date(this.partnerBirthDate)
        : new Date(this.clientBirthDate);
    const forecastStartDate = new Date(
      this.financialTimeline.forecastStartDate,
    );
    const forecastStartYear = moment(forecastStartDate).year();
    const baseAge = this.calculateAgeForTimeline(forecastStartDate, birthDate);
    return baseAge + (year - forecastStartYear);
  }

  private getEventDisplayNameForList(clientEvent: ClientEvent): string {
    if (
      !clientEvent.name ||
      !clientEvent.name.toLowerCase().startsWith('retirement age')
    ) {
      return clientEvent.name ?? '';
    }
    if (!this.hasPartner) {
      return 'Retirement age';
    }
    const hasPrimary = this.financialTimeline.clientEvents.some(
      (e) =>
        e.name?.toLowerCase().startsWith('retirement age') && !e.isPartnerEvent,
    );
    const hasPartner = this.financialTimeline.clientEvents.some(
      (e) =>
        e.name?.toLowerCase().startsWith('retirement age') &&
        !!e.isPartnerEvent,
    );
    if (!hasPrimary || !hasPartner) {
      return 'Retirement age';
    }
    const personName = clientEvent.isPartnerEvent
      ? this.client?.partnerDetail?.firstName?.trim()
      : this.client?.clientDetails?.firstName?.trim();
    return personName ? `Retirement age ${personName}` : 'Retirement age';
  }

  private isEventInVisibleRange(event: any): boolean {
    const startYear = event?.start?.year;
    if (!startYear) return false;
    const timelineStart = moment(
      this.financialTimeline.forecastStartDate,
    ).year();
    const timelineEnd = this.effectiveForecastEndYear;
    return startYear >= timelineStart && startYear <= timelineEnd;
  }

  private isRetirementEvent(event: any): boolean {
    return !!event?.name?.toLowerCase?.().startsWith('retirement age');
  }

  private getRetirementYearForBirthDate(birthDate: Date | null): number | null {
    if (!birthDate) return null;
    const forecastStartDate = new Date(
      this.financialTimeline.forecastStartDate,
    );
    const forecastStartYear = moment(forecastStartDate).year();
    const baseAge = this.calculateAgeForTimeline(forecastStartDate, birthDate);
    return forecastStartYear + (this.getDefaultRetirementAge() - baseAge);
  }

  private getRetirementDependencyKey(): string {
    const clientBirth = this.clientBirthDate
      ? new Date(this.clientBirthDate).toISOString()
      : '';
    const partnerBirth = this.partnerBirthDate
      ? new Date(this.partnerBirthDate).toISOString()
      : '';
    const country = (this.client?.clientDetails?.country ?? '')
      .trim()
      .toLowerCase();
    return `${clientBirth}|${partnerBirth}|${country}`;
  }

  private haveRetirementDependenciesChanged(): boolean {
    const current = this.getRetirementDependencyKey();
    if (this.lastRetirementDependencyKey === null) {
      this.lastRetirementDependencyKey = current;
      return false;
    }
    const changed = this.lastRetirementDependencyKey !== current;
    this.lastRetirementDependencyKey = current;
    return changed;
  }

  private recalculateRetirementEventPositions(): void {
    if (!this.financialTimeline?.clientEvents?.length) return;

    const primaryYear = this.getRetirementYearForBirthDate(
      new Date(this.clientBirthDate),
    );
    const partnerYear = this.getRetirementYearForBirthDate(
      this.partnerBirthDate,
    );

    const retirementAge = this.getDefaultRetirementAge();

    this.financialTimeline.clientEvents =
      this.financialTimeline.clientEvents.map((event) => {
        if (!this.isRetirementEvent(event)) return event;

        const targetYear = event.isPartnerEvent ? partnerYear : primaryYear;
        if (!targetYear) return event;

        return {
          ...event,
          start: {
            ...event.start,
            year: targetYear,
            age: retirementAge,
          },
        };
      });
  }

  private stripTimelineTooltips(): void {
    if (!this.timelineContainer?.nativeElement) return;
    const container = this.timelineContainer.nativeElement as HTMLElement;

    const strip = () => {
      container
        .querySelectorAll('.vis-delete[title], .vis-item[title]')
        .forEach((el) => {
          el.removeAttribute('title');
        });
    };

    strip();

    const observer = new MutationObserver(() => strip());
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title'],
    });
  }

  private initTimelineHover(): void {
    if (!this.timelineContainer?.nativeElement || !this.timeline) return;

    this.timelineHoverSubscription = fromEvent<MouseEvent>(
      this.timelineContainer.nativeElement,
      'mousemove',
    )
      .pipe(throttleTime(30))
      .subscribe((event) => {
        if (this.isDragging || this.draggedEvent) return;
        this.handleTimelineHover(event);
      });

    fromEvent(this.timelineContainer.nativeElement, 'mouseleave').subscribe(
      () => {
        if (!this.isDragging) {
          try {
            this.timeline.removeCustomTime(this.hoverLineId);
          } catch {}
          this.clearLabelHighlight();
        }
      },
    );
  }

  private handleTimelineHover(event: MouseEvent): void {
    if (!this.timeline) return;

    const props = this.timeline.getEventProperties(event);
    if (!props?.time) return;

    const snappedTime = this.snapToNearestYear(props.time);
    const year = snappedTime.getFullYear();

    const startYear = moment(this.financialTimeline.forecastStartDate).year();
    const endYear = this.effectiveForecastEndYear;

    if (year >= startYear && year <= endYear) {
      try {
        this.timeline.setCustomTime(snappedTime, this.hoverLineId);
      } catch {
        this.timeline.addCustomTime(snappedTime, this.hoverLineId);
      }

      this.highlightHoveredYearLabel(year);
    } else {
      try {
        this.timeline.removeCustomTime(this.hoverLineId);
      } catch {}
      this.clearLabelHighlight();
    }
  }

  /**
   * Re-evaluates whether the Retirement age chip(s) should be shown or hidden.
   * Solo: one chip when retirement not on timeline.
   * Joint: one chip per person whose retirement is not on timeline (labeled with name).
   */
  private syncRetirementChipVisibility(): void {
    if (!this.systemEventsLibrary || !this.cachedSystemEventsLibrary) return;

    if (this.hasPartner) {
      this.syncJointAccountRetirementChips();
    } else {
      if (this.shouldHideRetirementChip()) {
        this.removeRetirementFromChips();
      } else {
        this.addRetirementBackToChips();
      }
    }
  }

  private syncJointAccountRetirementChips(): void {
    const events = this.financialTimeline?.clientEvents ?? [];
    const hasPrimaryRetirement = events.some(
      (ce) =>
        this.isRetirementEvent(ce) &&
        !ce.isPartnerEvent &&
        this.isEventInVisibleRange(ce),
    );
    const hasPartnerRetirement = events.some(
      (ce) =>
        this.isRetirementEvent(ce) &&
        !!ce.isPartnerEvent &&
        this.isEventInVisibleRange(ce),
    );

    const clientName = this.client?.clientDetails?.firstName?.trim() ?? '';
    const partnerName = this.client?.partnerDetail?.firstName?.trim() ?? '';
    const clientChipName = clientName
      ? `Retirement age ${clientName}`
      : 'Retirement age';
    const partnerChipName = partnerName
      ? `Retirement age ${partnerName}`
      : 'Retirement age (partner)';

    // Remove chips for people who have retirement on timeline
    this.systemEventsLibrary = this.systemEventsLibrary.filter((e) => {
      if (!e.name?.toLowerCase().startsWith('retirement age')) return true;
      if (e.name === clientChipName && hasPrimaryRetirement) return false;
      if (e.name === partnerChipName && hasPartnerRetirement) return false;
      if (
        e.name === 'Retirement age' &&
        (hasPrimaryRetirement || hasPartnerRetirement)
      )
        return false;
      return true;
    });

    // Add chips for people who don't have retirement on timeline
    const retirement = this.cachedSystemEventsLibrary.find(
      (e) => e.name === 'Retirement age',
    );
    if (!retirement) return;

    if (
      !hasPrimaryRetirement &&
      !this.systemEventsLibrary.some((e) => e.name === clientChipName)
    ) {
      this.systemEventsLibrary = [
        ...this.systemEventsLibrary,
        { ...retirement, name: clientChipName, isPartnerEvent: false },
      ];
    }
    if (
      !hasPartnerRetirement &&
      !this.systemEventsLibrary.some((e) => e.name === partnerChipName)
    ) {
      this.systemEventsLibrary = [
        ...this.systemEventsLibrary,
        { ...retirement, name: partnerChipName, isPartnerEvent: true },
      ];
    }

    this.systemEventsLibrary = [...this.systemEventsLibrary].sort(
      (a, b) => this.getChipSortOrder(a.name) - this.getChipSortOrder(b.name),
    );
    this.cdr.detectChanges();
  }

  private getChipSortOrder(name: string): number {
    if (name?.toLowerCase().startsWith('retirement age')) {
      return this.CHIP_ORDER.indexOf('Retirement age');
    }
    return this.CHIP_ORDER.indexOf(name);
  }

  private shouldHideRetirementChip(): boolean {
    const events = this.financialTimeline?.clientEvents ?? [];
    const hasPrimaryRetirement = events.some(
      (ce) =>
        this.isRetirementEvent(ce) &&
        !ce.isPartnerEvent &&
        this.isEventInVisibleRange(ce),
    );
    const hasPartnerRetirement = events.some(
      (ce) =>
        this.isRetirementEvent(ce) &&
        !!ce.isPartnerEvent &&
        this.isEventInVisibleRange(ce),
    );

    if (this.hasPartner) {
      // Joint account: hide chip only when both primary and partner events exist
      return hasPrimaryRetirement && hasPartnerRetirement;
    }

    // Solo account: hide when primary retirement event is on the timeline
    return hasPrimaryRetirement;
  }

  private getDefaultRetirementAge(): number {
    const country = (this.client?.clientDetails?.country ?? '')
      .trim()
      .toLowerCase();
    return country === 'italy' || country === 'it' ? 67 : 64;
  }

  private isClientAtOrPastRetirementAge(): boolean {
    const currentAge = this.calculateAge(new Date(this.clientBirthDate));
    return currentAge >= this.getDefaultRetirementAge();
  }

  private removeRetirementFromChips(): void {
    this.systemEventsLibrary = this.systemEventsLibrary.filter(
      (e) => e.name !== 'Retirement age',
    );
    this.cdr.detectChanges();
  }

  private addRetirementBackToChips(): void {
    const alreadyExists = this.systemEventsLibrary.some(
      (e) => e.name === 'Retirement age',
    );

    if (alreadyExists) return;

    const retirement = this.cachedSystemEventsLibrary.find(
      (e) => e.name === 'Retirement age',
    );

    if (!retirement) return;

    this.systemEventsLibrary = [...this.systemEventsLibrary, retirement].sort(
      (a, b) => this.getChipSortOrder(a.name) - this.getChipSortOrder(b.name),
    );

    this.cdr.detectChanges();
  }

  private getNextBirthName(): string {
    const birthEvents = this.financialTimeline.clientEvents.filter((e) =>
      e.name.startsWith('Birth'),
    );

    if (birthEvents.length === 0) return 'Birth';

    return `Birth ${birthEvents.length + 1}`;
  }
}
