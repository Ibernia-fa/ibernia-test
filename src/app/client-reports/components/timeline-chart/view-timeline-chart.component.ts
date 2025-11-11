import { 
  Component,
  ElementRef,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DataSet, moment, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Client } from 'src/app/clients/models/client';
import { ClientEvent, Cycle, EscalationRate, EventIncomeType, FinancialTimeline } from '../../../financial-workflow/timeline/models/financial-timeline';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SettingsHttpService } from '../../../financial-workflow/settings/services/settings-http.service';
import { TimelineHttpService } from '../../../financial-workflow/timeline/services/timeline-http.service';
import { catchError, combineLatest, filter, map, take, tap } from 'rxjs';
 
@Component({
  selector: 'app-view-timeline-chart',
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
  templateUrl: './view-timeline-chart.component.html',
  styleUrl: './view-timeline-chart.component.scss',
})

export class ViewTimelineChartComponent implements OnInit {
  timeline: Timeline;
  customEventsLibrary: ClientEvent[];
  systemEventsLibrary: ClientEvent[];

  @Input() financialTimeline: FinancialTimeline;
  @Input() clientBirthDate: Date;
  @Input() client: Client;
  @Input() title: string = 'Timeline';
  @Input() showOnReports: boolean = false;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  private tooltipPollingInterval: any;
  private tooltipMouseX: number = 0;
  private tooltipMouseY: number = 0;
  escalationRates: EscalationRate[];
  amountCycles: Cycle[];

  constructor(
    private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef,
    private settingHttpService: SettingsHttpService
  ) { 
    this.updateTimelines = new EventEmitter<boolean>();
        this.settingHttpService.getEscalationRates(
             '678c93f32be72db4b9631be1'
            ).subscribe((escalationRatesResponse) => {
              this.escalationRates = escalationRatesResponse.escalationRates;
            })

            this.settingHttpService.getAmountCycles().subscribe((cycles) => {
              this.amountCycles = cycles;
            });
  }

  ngOnChanges(changes: SimpleChanges) {
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

  getTimelineEventsLibrary() {
    combineLatest([
      this.timelineHttpService.getSystemEvents(),
      this.timelineHttpService.getCustomEvents(),
    ]).pipe(
    filter((res) => !!res),
      tap((res) => {
        this.systemEventsLibrary = res[0];
        this.customEventsLibrary = res[1];
        this.cdr.detectChanges();
      })
    ).subscribe();
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
          spanTag.setAttribute('data-short-year', spanTag.textContent ?? ''); // Store original
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
  }

  get timelineData(): DataSet<
  {
    id: string;
    content: string;
    start: Date;
    end: Date | string;
    className: string;
  }, 'id' > {
    const dataArray = this.financialTimeline.clientEvents.map(
      (event, index) => {
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
          className: event.iconUrl,
          editable: {
            updateTime: true,
            remove: true,
          }
        };
      }
    );
    return new DataSet(dataArray);
  }

  get timelineOptions(): TimelineOptions {
    console.log(this.clientBirthDate);
    const birthDate = new Date(this.clientBirthDate);
    let age = this.calculateAge(birthDate);
    const birthYear = moment(this.clientBirthDate).year();
    const forecastStartYear = moment(this.financialTimeline.forecastStartDate).year();

    const timelineEndYear = new Date(
      new Date(this.financialTimeline.forecastStartDate).setFullYear(
        new Date(this.financialTimeline.forecastStartDate).getFullYear() + (100 - age)
      )
    ).getFullYear();

    const visualBufferYears = (timelineEndYear % 2 === 0 ? 1 : 2);
    let startYear = forecastStartYear;

    return {
      editable: {
        add: false,
        updateTime: !this.showOnReports,
        updateGroup: false,
        remove: !this.showOnReports,
        overrideItems: false
      },
      selectable: true,
      stack: true,
      zoomable: false,
      moveable: !this.showOnReports,
      horizontalScroll: false,
      orientation: 'bottom',
      margin: { item: 10 },
      start: new Date(startYear, 0, 1),
      min: new Date(startYear, 0, 1),
      end: new Date(timelineEndYear + 2, 0, 1),
      max: new Date(timelineEndYear + 2, 0, 1),
      minHeight: '304px',
      width: '100%',
      align: 'left',
      showCurrentTime: false,
      showMajorLabels: true,
      timeAxis: { scale: 'month', step: 12 },
      format: {
      minorLabels: (date: any) => {
        const today = new Date(date);
        const age = this.calculateAgeForTimeline(today, birthDate);
        return age >= 0 && age <= 100
          ? `<div id='selected'><p>${age}</p><span>${date.year()}</span></div>`
          : '';
      },
      majorLabels: function (date: any) {
          return ``;
        },
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

  currentZoomPercentage = 0.1;
  
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
}
}
