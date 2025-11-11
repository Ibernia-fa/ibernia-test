import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Client } from 'src/app/clients/models/client';
import { FinancialTimeline } from '../../financial-workflow/timeline/models/financial-timeline';
import { ToastrModule, ToastrService } from 'ngx-toastr';

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

  @Input() financialTimeline: FinancialTimeline;
  @Input() clientBirthDate: Date;
  @Input() client: Client;
  @Input() title: string = 'Timeline';
  @Input() showOnReports: boolean = false;
  @Output() updateTimelines: EventEmitter<boolean>;
  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  constructor() { 

  }

  ngOnInit() {
    this.initTimelineContainer();
    // this.getTimelineEventsLibrary();
  }

  ngAfterViewInit() {
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

    this.timeline = new Timeline(this.timelineContainer.nativeElement, this.timelineData);
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
}
