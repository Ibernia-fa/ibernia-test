import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  catchError,
  filter,
  map,
  Observable,
  of,
  combineLatest,
  switchMap,
  tap,
  forkJoin,
  Subject,
  EMPTY,
  groupBy,
  mergeMap,
} from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EmergenciesHttpService as EmergenciesHttpService } from './services/emergencies-http.service';
import { ClientHttpService as ClientHttpService } from 'src/app/clients/services/client-http.service';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { AddEmergenciesComponent } from './add-emergencies/add-emergencies.component';
import { SimulateEmergencyComponent } from './simulate-emergency/simulate-emergency.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import {
  EmergenciesResponse,
  Emergency,
  LookupItem,
  Money,
  StatsAndLookupData,
} from './models/emergencies.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Client, Details } from 'src/app/clients/models/client';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import moment from 'moment';
import { Cashflow } from 'src/app/clients/models/cashflow';
import {
  Cycle,
  EscalationRate,
  FinancialTimeline,
} from '../timeline/models/financial-timeline';
import { IncomeExpense } from '../income-expenses/model/income-expense';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import { IncomeExpensesHttpService } from '../income-expenses/services/income-expenses-http.service';
import {
  DestroyRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SimulateEmergencyModel } from './models/simulate-emergency.model';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-emergencies',
  imports: [
    MatSliderModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    CommonModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    CurrencySymbolPipe,
    MaterialModule,
  ],
  templateUrl: './emergencies.component.html',
  styleUrl: './emergencies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmergenciesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private envInjector = inject(EnvironmentInjector);
  clientId?: string = '';
  cashflowId!: string;
  isLoading = false;
  errorMessage = '';
  emergencies: Emergency[] = [];
  stats?: StatsAndLookupData;
  emergencyTypes: LookupItem[] = [];
  policyStatuses: LookupItem[] = [];
  coverageAdequacies: LookupItem[] = [];
  willStatuses: LookupItem[] = [];
  insuranceCostTemplate?: Money;
  client$: Observable<Client | null>;
  clientData: Details;
  amountCycles: Cycle[];
  isClientLoaded = false;
  isEmergenciesLoaded = false;
  // simulation data
  isSimulationDataLoaded = false;
  amountCyclesAll: Cycle[];
  monthlyCycleId: string | null;
  timeline: FinancialTimeline;
  escalationRates: EscalationRate[];
  clientPreferredCurrency: string;
  eventsList: any;
  selectedClient: Client;
  selectedCashflow: Cashflow;
  incomeExpense: IncomeExpense;
  private coverageAdequacyUpdates$ = new Subject<{
    emergency: Emergency;
    newId: number;
    previousValue: number;
  }>();
  private refreshEmergencies$ = new Subject<void>();
  private readonly defaultEmergencyNames = new Set([
    'Home',
    'Life',
    'Disability',
    'Health',
    'Natural hazards',
    'Will',
  ]);
  private defaultEmergencyIds = new Set<string>();

  private readonly defaultIcon = 'shield.svg';
  private readonly iconMap: Record<string, string> = {
    home: 'home.svg',
    disability: 'disability.svg',
    health: 'health.svg',
    will: 'will.svg',
    life: 'user.png',
    naturalHazards: 'naturalHazards.png',
  };

  constructor(
    private route: ActivatedRoute,
    private emergenciesHttp: EmergenciesHttpService,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private navItemService: NavItemService,
    private store: Store,
    private settingHttpService: SettingsHttpService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private timelineHttpService: TimelineHttpService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
  ) {
    this.navItemService.currentRouteName = 'Risk & Insurance';
  }

  ngOnInit(): void {
    this.bindRefreshEmergencies();
    this.bindCoverageAdequacyUpdates();
    this.load();

    this.settingHttpService.getAmountCycles().subscribe((cycles) => {
      this.amountCycles = cycles.filter((x) => x.description != 'One-off');
      this.monthlyCycleId = this.amountCycles.filter(
        (x: any) => x.description === 'Every month',
      )[0]?.id;
    });

    // preloaded data for simulation
    this.getSimulateData();
  }

  private bindRefreshEmergencies(): void {
    this.refreshEmergencies$
      .pipe(
        switchMap(() => {
          this.errorMessage = '';

          if (!this.cashflowId) {
            return of(null);
          }

          return this.emergenciesHttp.getAllByCashflowId(this.cashflowId).pipe(
            catchError((err: HttpErrorResponse) => {
              this.errorMessage =
                err?.error?.message || 'Failed to load emergencies';
              this.toastr.error(this.errorMessage, 'Error');
              return of(null);
            }),
          );
        }),
        filter((res): res is EmergenciesResponse => !!res),
        tap((res) => this.applyEmergenciesResponse(res)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private bindCoverageAdequacyUpdates(): void {
    this.coverageAdequacyUpdates$
      .pipe(
        groupBy((update) => update.emergency.id),
        mergeMap((group$) =>
          group$.pipe(
            switchMap((update) => {
              const updated: Emergency = {
                ...update.emergency,
                coverageAdequacy: update.newId,
              };

              return this.emergenciesHttp.updateEmergency(updated).pipe(
                tap((res: Emergency) => {
                  update.emergency.coverageAdequacy = res.coverageAdequacy;
                  this.cdr.markForCheck();
                }),
                catchError((err) => {
                  console.error(err);
                  this.toastr.error(
                    'Failed to update coverage adequacy',
                    'Error',
                  );
                  update.emergency.coverageAdequacy = update.previousValue;
                  this.cdr.markForCheck();
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private getParamsFromRoute(): { cashflowId: string; clientId?: string } {
    let r: ActivatedRoute | null = this.activatedRoute;
    let cashflowId: string | null = null;
    let clientId: string | undefined;
    while (r) {
      if (!cashflowId)
        cashflowId =
          r.snapshot.paramMap.get('id') ||
          r.snapshot.paramMap.get('cashflowId');
      if (!clientId)
        clientId = r.snapshot.paramMap.get('clientId') || undefined;
      if (cashflowId) break;
      r = r.parent;
    }
    if (!cashflowId) throw new Error('cashflowId not found in route.');
    return { cashflowId, clientId };
  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const { cashflowId, clientId } = this.getParamsFromRoute();
    this.cashflowId = cashflowId;
    this.clientId = clientId;

    of(cashflowId)
      .pipe(
        switchMap((cfId: string) =>
          this.emergenciesHttp.getAllByCashflowId(cfId).pipe(
            catchError((err: HttpErrorResponse) => {
              this.errorMessage =
                err?.error?.message || 'Failed to load emergencies';
              this.toastr.error(this.errorMessage, 'Error');
              return of(null);
            }),
          ),
        ),
        filter((res): res is EmergenciesResponse => !!res),
        tap((res) => this.applyEmergenciesResponse(res)),
      )
      .subscribe();

    // load client
    this.client$ = this.store.select(selectedClient);
    this.client$
      .pipe(
        switchMap((client) => {
          // load client from store
          if (client) {
            this.clientData = client.clientDetails;
            this.isClientLoaded = true;
            this.checkFullyLoaded();
            return of(client);
          }

          // if client is not in store load it from the api
          return this.clientHttpService
            .getClientByCashflowId(this.cashflowId)
            .pipe(
              tap((apiClient) => {
                if (apiClient) {
                  this.store.dispatch({
                    type: '[Client API] Load Success',
                    client: apiClient,
                  });

                  this.clientData = apiClient.clientDetails;
                  this.isClientLoaded = true;
                  this.checkFullyLoaded();
                }
              }),
              catchError(() => of(null)),
            );
        }),
      )
      .subscribe();
  }

  private applyEmergenciesResponse(res: EmergenciesResponse): void {
    this.emergencies = res.emergencies ?? [];
    this.stats = res.statsAndLookupData;

    // expose lookups for popup usage
    this.emergencyTypes = this.stats?.emergencyTypes ?? [];
    this.policyStatuses = this.stats?.policyStatuses ?? [];
    this.coverageAdequacies = this.stats?.coverageAdequacies ?? [];
    this.willStatuses = this.stats?.willStatuses ?? [];
    this.insuranceCostTemplate = this.stats?.insuranceCost ?? undefined;

    this.isEmergenciesLoaded = true;
    this.checkFullyLoaded();
  }

  checkFullyLoaded() {
    if (this.isEmergenciesLoaded && this.isClientLoaded) {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  trackById(_: number, e: Emergency) {
    return e.id;
  }

  onAddClick() {
    this.dialog
      .open(AddEmergenciesComponent, {
        width: '612px',
        disableClose: true,
        data: {
          emergencyTypes: this.emergencyTypes,
          policyStatuses: this.policyStatuses,
          coverageAdequacies: this.coverageAdequacies,
          willStatuses: this.willStatuses,
          insuranceCostTemplate: this.insuranceCostTemplate,
          client: this.clientId ? { id: this.clientId, name: '' } : undefined,
          cashflow: this.cashflowId
            ? {
                id: this.cashflowId,
                name: '',
              }
            : undefined,
          defaultTypeId: 1, // Insurance for now; later you can pass 2 for Will etc.
          clientPreferredCurrency: this.clientData?.preferredCurrency,
          cycles: this.amountCycles,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status === 'Success') {
          this.load();
        }
      });
  }

  getCashflowName(): string {
    const e = this.emergencies[0];
    return e.cashflow?.name || '-';
  }

  getTypeName(typeId: number): string {
    return this.emergencyTypes.find((t) => t.id === typeId)?.name ?? 'Unknown';
  }

  getPolicyStatusLabel(statusId: number | null): string {
    if (statusId == null) return '-';

    return (
      this.policyStatuses.find((p) => p.id === statusId)?.description ??
      'Unknown'
    );
  }

  getCoverageAdequacyLabel(id: number | null): string {
    if (id == null) return '-';
    return (
      this.coverageAdequacies.find((c) => c.id === id)?.description ?? 'Unknown'
    );
  }

  getWillStatusLabel(id: number | null): string {
    if (id == null) return 'Not set';

    return (
      this.policyStatuses.find((w) => w.id === id)?.description ?? 'Unknown'
    );
  }

  getIconName(e: Emergency): string {
    const key = (e.name || '').toLowerCase();

    if (key === 'natural hazards') {
      return `assets/images/svgs/${this.iconMap['naturalHazards']}`;
    }

    return `assets/images/svgs/${this.iconMap[key] ?? this.defaultIcon}`;
  }

  get computedProtectionScore(): number | null {
    const visible = this.emergencies?.filter((e) => !e.isHidden) ?? [];
    if (visible.length === 0) return null;

    const scores = visible.map((e) => {
      if (e.type === 2) return e.willStatus === 1 ? 100 : 0;
      if (e.policyStatus === 2) return 0;
      switch (e.coverageAdequacy) {
        case 1:
          return 100 / 3;
        case 2:
          return 200 / 3;
        case 3:
          return 100;
        default:
          return 0;
      }
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  getProtectionScoreCssClass(score: number | null): string {
    if (score == null || score < 50) {
      return 'ibernia-red';
    } else if (score < 75) {
      return 'ibernia-orange';
    } else if (score < 89) {
      return 'ibernia-light-green';
    } else {
      return 'ibernia-dark-green';
    }
  }

  getProgressBarStyles(score: number | null): Record<string, string> {
    const pct = score != null ? Math.min(Math.max(score, 0), 100) : 0;
    let color: string;

    if (score == null || score < 50) {
      color = '#ff383c';
    } else if (score < 75) {
      color = '#deb511';
    } else if (score < 89) {
      color = '#54e97c';
    } else {
      color = '#09ac65';
    }

    return { width: `${pct}%`, 'background-color': color };
  }

  getCardCssClass(e: Emergency): string {
    if (e.type === 1) {
      const isNotCovered = e.policyStatus == 2;
      return isNotCovered
        ? 'danger-card'
        : e.coverageAdequacy === 1
          ? 'basic-card'
          : e.coverageAdequacy === 2
            ? 'good-card'
            : 'excellent-card';
    }

    if (e.type === 2) {
      const isNotDone = e.willStatus == 2;
      return isNotDone ? 'danger-card' : 'excellent-card';
    }

    return 'danger-card';
  }
  getCardHeaderCssClass(e: Emergency): string {
    if (e.type === 1) {
      const isNotCovered = e.policyStatus == 2;
      return isNotCovered
        ? 'danger-header-card'
        : e.coverageAdequacy === 1
          ? 'basic-header-card'
          : e.coverageAdequacy === 2
            ? 'good-header-card'
            : 'excellent-header-card';
    }

    if (e.type === 2) {
      const isNotDone = e.willStatus == 2;
      return isNotDone ? 'danger-header-card' : 'excellent-header-card';
    }

    return 'danger-header-card';
  }

  getDotClass(e: Emergency): string {
    if (e.type === 1) {
      const isNotCovered = e.policyStatus == 2;
      return isNotCovered ? 'dot-red' : 'dot';
    }

    if (e.type === 2) {
      const isNotDone = e.willStatus == 2;
      return isNotDone ? 'dot-red' : 'dot';
    }

    return 'dot-red';
  }

  getAdequacyClass(e: Emergency): string {
    if (e.policyStatus === 2) {
      return 'ibernia-red'; // not covered case
    }

    switch (e.coverageAdequacy) {
      case 1:
        return 'ibernia-orange'; // Basic
      case 2:
        return 'ibernia-light-green'; // Good
      case 3:
        return 'ibernia-dark-green'; // Excellent
      default:
        return 'ibernia-red';
    }
  }

  onEditClick(emergency: Emergency): void {
    const isDefaultEmergency =
      this.defaultEmergencyIds.has(emergency.id) ||
      this.defaultEmergencyNames.has(emergency.name);
    const dialogRef = this.dialog.open(AddEmergenciesComponent, {
      width: '612px',
      disableClose: true,
      data: {
        mode: 'edit',
        emergency,
        isDefaultEmergency,
        emergencyTypes: this.emergencyTypes,
        policyStatuses: this.policyStatuses,
        coverageAdequacies: this.coverageAdequacies,
        willStatuses: this.willStatuses,
        insuranceCostTemplate: this.insuranceCostTemplate,
        client: emergency.client, // may be empty for now but still fine
        cashflow: emergency.cashflow, // has id at least
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        cycles: this.amountCycles,
      },
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.status === 'Success' || res?.deleted) {
        // Reload list so updated values show
        this.load();
      }
    });
  }

  hideEmergency(e: Emergency) {
    e.isHidden = true;
    const updated: Emergency = { ...e };

    this.emergenciesHttp.updateEmergency(updated).subscribe({
      next: (res: Emergency) => {
        Object.assign(e, res);

        // Reload list so updated values show
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to hide emergency', 'Error');
        e.isHidden = !e.isHidden;
      },
    });
  }

  showHiddenEmergencies(): void {
    const hiddenEmergencies = this.emergencies.filter((e) => e.isHidden);

    if (hiddenEmergencies.length === 0) {
      return;
    }

    // update all hidden emergencies in API first
    const updates$ = hiddenEmergencies.map((e) => {
      const updated: Emergency = { ...e, isHidden: false };
      return this.emergenciesHttp.updateEmergency(updated);
    });

    // wait for all api calls to finish then reload once
    forkJoin(updates$).subscribe({
      next: () => {
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to show hidden emergencies', 'Error');
      },
    });
  }

  onCoverageAdequacyChange(e: Emergency, newId: number): void {
    if (newId === e.coverageAdequacy) {
      return;
    }

    const previousValue = e.coverageAdequacy;
    e.coverageAdequacy = newId;
    this.cdr.markForCheck();
    this.coverageAdequacyUpdates$.next({ emergency: e, newId, previousValue });
  }

  calculateAnnualCost(e: Emergency): number {
    let annualCost = 0;
    if (!e.insuranceCost) return 0;

    if (
      e.insuranceCost.amount > 0 &&
      this.monthlyCycleId &&
      e.insuranceCost.cycle?.id === this.monthlyCycleId
    ) {
      annualCost = e.insuranceCost.amount * 12;
    } else {
      annualCost = e.insuranceCost.amount ?? 0;
    }

    return annualCost;
  }

  get hasHiddenEmergencies(): boolean {
    return this.emergencies?.some((e) => e.isHidden) ?? false;
  }

  get filteredEmergencies(): Emergency[] {
    return this.emergencies.filter((e) => !e.isHidden);
  }

  getSimulateData() {
    (this.activatedRoute.parent?.params ?? this.activatedRoute.params)
      .pipe(
        switchMap((params) =>
          runInInjectionContext(this.envInjector, () =>
            this.financialWorkflowService.loadClientCashflowMetadata(params),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
        tap(([client, cashflow]) => {
          this.selectedClient = client as Client;
          this.selectedCashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          return combineLatest([
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              (cashflow as Cashflow).id,
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              (cashflow as Cashflow).id,
            ),
            this.settingHttpService.getAmountCycles(),
            this.settingHttpService.getEscalationRates((client as Client).id),
          ]);
        }),
        tap(
          ([
            incomeExpense,
            timeline,
            amountCycles,
            escalationRatesResponse,
          ]) => {
            this.incomeExpense = incomeExpense;
            this.amountCyclesAll = amountCycles;
            this.escalationRates = patchInflationRateDescription(
              escalationRatesResponse?.escalationRates ?? [],
              this.selectedCashflow?.inflationRate ?? 0,
            );
            this.timeline = timeline;
            this.eventsList = this.timeline?.clientEvents.sort(
              (a, b) => a.start.age - b.start.age,
            );
          },
        ),
      )
      .subscribe();
  }

  simulateEmergency(emergency: Emergency) {
    const emergencyExpense =
      this.stats?.emergencyExpenses?.find(
        (x) => x.emergencyId == emergency.id,
      ) ?? null;

    const dialogRef = this.dialog.open(SimulateEmergencyComponent, {
      width: '612px',
      disableClose: true,
      data: {
        client: this.selectedClient,
        cashflow: this.selectedCashflow,
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        clientBirthDate: this.clientData?.birthDate,
        emergency,
        emergencyExpense,
        amountCycles: this.amountCyclesAll,
        escalationRates: this.escalationRates,
        eventsList: this.timeline.clientEvents.sort(
          (a, b) => a.start.age - b.start.age,
        ),
        incomes: this.incomeExpense?.incomes,
        forecastEndDate: this.timeline.forecastEndtDate,
        forecastStartDate: this.timeline.forecastStartDate,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((updatedExpense: SimulateEmergencyModel | null) => {
        if (!updatedExpense) return;

        if (this.stats != null) {
          this.stats.emergencyExpenses ??= [];

          const index =
            this.stats?.emergencyExpenses.findIndex(
              (x) => x.emergencyId === updatedExpense.emergencyId,
            ) ?? -1;

          if (index > -1) {
            this.stats.emergencyExpenses[index] = updatedExpense;
          } else {
            this.stats?.emergencyExpenses.push(updatedExpense);
          }
        }
      });
  }

  private markDefaultEmergencyIds(emergencies: Emergency[]): void {
    emergencies.forEach((e) => {
      if (this.defaultEmergencyNames.has(e.name)) {
        this.defaultEmergencyIds.add(e.id);
      }
    });
  }
}
