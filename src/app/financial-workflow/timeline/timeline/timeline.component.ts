import { Component, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TimelineHttpService } from '../services/timeline-http.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatestWith, concatMap, filter, map, Observable, switchMap, take, takeUntil, tap } from 'rxjs';
import { FinancialTimeline, TimelineResponse, FinancialRecordLineItem } from '../models/financial-timeline';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimelineChartComponent } from '../timeline-chart/timeline-chart.component';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';
import { DialogComponent } from 'src/app/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';
import { Client } from 'src/app/clients/models/client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { FinancialWorkflowService } from '../../services/financial-workflow.service';
import { TranslateModule } from '@ngx-translate/core';
import { CashflowNavComponent } from '../../cashflow-nav/cashflow-nav.component';

@Component({
  selector: 'app-timeline',
  imports: [
    TablerIconsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TimelineChartComponent,
    MatSelectModule,
    MatTooltipModule,
    TranslateModule,
    CashflowNavComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnDestroy {
  cashflowId: string;
  financialTimeline: FinancialTimeline;
  financialRecords: FinancialRecordLineItem[] = [];
  clientBirthDate: Date;
  isLoaderVisible: boolean;
  forecastStartYears: number[] = [];
  forecastStartYear: number;
  forecastEndYear: number;
  clientBirthYear: number;
  clientAge: number;
  client: Client;
  selectedCashflow: Cashflow | null;
  enableForecastEdit = false;
  destroyed$: BehaviorSubject<boolean>;

  constructor(
    private timelineHttpService: TimelineHttpService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private store: Store
  ) {
    this.destroyed$ = new BehaviorSubject<boolean>(false);
    this.getTimeline();
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
  }

  getTimeline() {
    this.isLoaderVisible = true;

    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.cashflowId = params['id'];

          return this.timelineHttpService.getTimelineWithLinkedFinancialRecordsByCashflowId(
            this.cashflowId
          );
        }),
        combineLatestWith(
          this.store.select(selectedClient).pipe(takeUntilDestroyed()),
          this.store.select(selectedCashflow).pipe(takeUntilDestroyed())
        ),
        tap(([res, client, cashflow]) => {
          const timeline = res.timeline;

          if (!cashflow) {
            this.store.dispatch(CashflowActions.loadCashflow({ cashflowId: this.cashflowId }));
          }

          if (!client || client.id !== timeline.client.id) {
            this.store.dispatch(ClientActions.loadClient({ clientId: res.timeline.client.id }));
          }

          this.selectedCashflow = cashflow as Cashflow;
          this.client = client as Client;
        }),
        filter(
          ([res, client]) =>
            !!client && client.id === res.timeline.client.id
        ),
        map(([res, client]) => {
          if (client) {
            this.isLoaderVisible = false;

            const timeline = res.timeline;
            const financialRecords = res.financialRecords;
            this.financialTimeline = timeline;
            this.financialRecords = res.financialRecords;

            this.client = client;
            this.clientBirthDate = client.clientDetails.birthDate;

            const birthDate = new Date(client.clientDetails.birthDate);

            this.clientBirthYear = moment(
              client.clientDetails.birthDate
            ).year();

            this.forecastStartYear = moment(
              this.financialTimeline.forecastStartDate
            ).year();

            const forecastStart = new Date(this.forecastStartYear, 0, 1);
            let age = forecastStart.getFullYear() - birthDate.getFullYear();
            const monthDiff = forecastStart.getMonth() - birthDate.getMonth();
            const dayDiff = forecastStart.getDate() - birthDate.getDate();

            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
              age--;
            }

            this.clientAge = age;
            if (this.forecastStartYear - this.clientBirthYear > this.clientAge) this.clientBirthYear = this.clientBirthYear + 1

            this.forecastEndYear = moment(
              this.financialTimeline.forecastEndtDate
            ).year();

            this.forecastStartYears = Array.from(
              { length: this.forecastEndYear - this.forecastStartYear + 1 },
              (_, i) => this.forecastStartYear + i
            );
          }
        })
      )
      .subscribe();
  }

  onUpdateClicked() {
    this.financialTimeline.forecastStartDate = new Date(
      this.forecastStartYear,
      1
    );
    this.financialTimeline.forecastEndtDate = new Date(this.forecastEndYear, 1);
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        action: 'Update',
        text: 'This action will affect the timeline events?',
      },
      width: '460px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      this.enableForecastEdit = false
      if (result.event === 'Update') {
        this.updateTimeline();
      }
    });
  }

  updateTimeline() {
    this.timelineHttpService
      .updateTimeline(this.financialTimeline)
      .pipe(
        take(1),
        tap((res) => {
          this.updateTimelinesEmittedEvent();
        })
      )
      .subscribe();
  }

  onForecastStartChange(event: any) {
    this.forecastStartYear = event;
  }

  onForecastEndChange(event: any) {
    this.forecastEndYear = event;
  }

  updateTimelinesEmittedEvent() {
    this.timelineHttpService
      .getTimelineWithLinkedFinancialRecordsByCashflowId(this.cashflowId)
      .pipe(
        take(1),
        tap((res) => {
          this.financialTimeline = res.timeline;
          this.financialRecords = res.financialRecords;
        })
      )
      .subscribe();
  }
}
