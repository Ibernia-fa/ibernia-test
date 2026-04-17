import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ChangeDetectionStrategy } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
// import { Timeline } from 'vis-timeline';
// import { DataSet } from 'vis-data';

import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import { Moment } from 'moment';
import { AddEventDialogComponent } from '../timeline/add-event-dialog/add-event-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-financial-workflow-dashboard',
  imports: [
    TablerIconsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    // AddEventDialogComponent,
    MatChipsModule,
    MatIconModule,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './financial-workflow-dashboard.component.html',
  styleUrl: './financial-workflow-dashboard.component.scss',
})
export class FinancialWorkflowDashboardComponent implements OnInit {
  timeline: Timeline;
  options: {};
  data: any;
  groups: any;

  @ViewChild('timelineContainer', { static: true })
  timelineContainer!: ElementRef;

  constructor(private dialog: MatDialog) {
    this.getTimelineData();
    this.getTimelineGroups();
    this.getOptions();
  }

  // ngOnInit(): void {
  //   this.timeline = new Timeline(this.timelineContainer.nativeElement, this.data, this.groups, this.options);
  //   this.timeline.setGroups(this.groups);
  //   this.timeline.setData(this.data);
  // }

  ngOnInit() {
    const container = this.timelineContainer.nativeElement;

    // Define timeline events
    const items = new DataSet([
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
    const birthYear = 2000;
    // Define timeline options
    const options: TimelineOptions = {
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
      min: '2000-01-01',
      start: '2025-06-10',
      end: '2030-06-10',
      minHeight: '252px',
      align: 'left',
      showCurrentTime: false, // Hide default current time marker
      // showCustomTime: true, // Allows custom markers
      showMajorLabels: true,
      timeAxis: { scale: 'year', step: 1 },
      format: {
        minorLabels: function (date: any) {
          return `${date.year() - birthYear} years <br/> ${date.year()}`; // Calculate Age
        },
        majorLabels: function (date: any) {
          return ``; // Show actual years
        },
      },
    };

    // Initialize timeline
    var timeline = new Timeline(container, items, options);

    const customDate = new Date('2026-06-10');
    timeline.addCustomTime(customDate, 't1');
  }

  getTimelineData() {
    this.data = new DataSet();
    this.data.add({
      id: 0,
      group: 0,
      content: 'item 1',
      start: 0,
      end: 3,
    });
  }

  getTimelineGroups() {
    this.groups = new DataSet([
      {
        id: 0,
        content: 'Group 1',
      },
    ]);
  }

  getOptions() {
    this.options = {
      stack: true,
      start: 0,
      end: 10,
      itemsAlwaysDraggable: true,
      editable: true,
      margin: {
        axis: 0,
      },
      showMajorLabels: false,
      orientation: 'top',
    };
  }

  newEventClicked() {
    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      data: {
        client: {},
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
