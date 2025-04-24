import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatestWith,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import { Client } from 'src/app/clients/models/client';
import { FinancialTimeline } from '../timeline/models/financial-timeline';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { SavingsBarStackedChartComponent } from './savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { MatTableModule } from '@angular/material/table';

export interface PeriodicElement {
  name: string;
  position: string;
  start_age: string | number;
  end_age: string | number;
  inflation_rate: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 'Accountant Salary (MR)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: 'Graphic Design Salary - Part Time (Mrs)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: 'NHS DB Pension (MRS)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: 'Tax free cash from NHS (Mrs)',
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 58,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 'Retirement (60)',
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 'Retirement - Mrs (60)',
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 67,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 67,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
  {
    position: "New Example Client's State Pension",
    name: '£4,000/month',
    start_age: 67,
    end_age: 58,
    inflation_rate: 'Default (2.5%)',
  },
];

@Component({
  selector: 'app-reports',
  imports: [
    TablerIconsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    SavingsBarStackedChartComponent,
    MatTableModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  displayedColumns: string[] = [
    'position',
    'start_age',
    'end_age',
    'name',
    'inflation_rate',
  ];
  dataSource = ELEMENT_DATA;

  cashflowId: string;
  cashflow: Cashflow | null;
  isLoaderVisible: boolean;
  client: Client;
  destroyed$: BehaviorSubject<boolean>;

  constructor(
    private timelineHttpService: TimelineHttpService,
    private activatedRoute: ActivatedRoute,
    private navItemService: NavItemService,
    private store: Store
  ) {
    this.destroyed$ = new BehaviorSubject<boolean>(false);
    this.navItemService.currentRouteName = 'Goals & Events';
    this.getTimeline();
  }

  getTimeline() {
    this.isLoaderVisible = true;
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.cashflowId = params['id'];
          return this.timelineHttpService.getTimelinebyCashflowId(
            this.cashflowId
          );
        }),
        combineLatestWith(
          this.store.select(selectedClient).pipe(takeUntilDestroyed()),
          this.store.select(selectedCashflow).pipe(takeUntilDestroyed())
        ),
        tap(([res, client, cashflow]) => {
          if (!cashflow) {
            this.store.dispatch(
              CashflowActions.loadCashflow({ cashflowId: this.cashflowId })
            );
          }
          if (!client || client.id !== res.client.id) {
            this.store.dispatch(
              ClientActions.loadClient({ clientId: res.client.id })
            );
          }
        }),
        filter(
          ([res, client, cashflow]) =>
            !!client && !!cashflow && client.id === res.client.id
        ),
        map(([res, client, cashflow]) => {
          if (client) {
            this.isLoaderVisible = false;
            this.cashflow = cashflow;
            this.client = client;
          }
        })
      )
      .subscribe();
  }
}
