import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, filter, map, Observable, of, switchMap, tap, forkJoin } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EmergenciesHttpService as EmergenciesHttpService } from './services/emergencies-http.service';
import { ClientHttpService as ClientHttpService } from 'src/app/clients/services/client-http.service';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { AddEmergenciesComponent } from './add-emergencies/add-emergencies.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { EmergenciesResponse, Emergency, LookupItem, Money, StatsAndLookupData } from './models/emergencies.model';
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
    CurrencySymbolPipe
  ],
  templateUrl: './emergencies.component.html',
  styleUrl: './emergencies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class EmergenciesComponent implements OnInit {
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
  amountCycles: any;
  isClientLoaded = false;
  isEmergenciesLoaded = false;

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
    private cdr: ChangeDetectorRef
  ) {
    this.navItemService.currentRouteName = 'Risk & Insurance';
  }

  ngOnInit(): void {
    this.load();

    this.settingHttpService.getAmountCycles().subscribe((cycles) => {
      this.amountCycles = cycles.filter(x => x.description != "One-off");
    });
  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.route.paramMap
      .pipe(
        map(pm => {
          const cf = pm.get('cashflowId') || pm.get('id');
          const cl = pm.get('clientId') || undefined;

          if (!cf)
            throw new Error('cashflowId not found in route.');
          
          this.cashflowId = cf;
          this.clientId = cl;
          
          return cf;
        }),
        switchMap(cashflowId =>
          this.emergenciesHttp.getAllByCashflowId(cashflowId).pipe(
            catchError((err: HttpErrorResponse) => {
              this.errorMessage =
                err?.error?.message || 'Failed to load emergencies';
              this.toastr.error(this.errorMessage, 'Error');
              return of(null);
            })
          )
        ),
        filter((res): res is EmergenciesResponse => !!res),
        tap(res => {
          this.emergencies = res.emergencies ?? [];
          this.stats = res.statsAndLookupData;

          // expose lookups for popup usage
          this.emergencyTypes = this.stats?.emergencyTypes ?? [];
          this.policyStatuses = this.stats?.policyStatuses ?? [];
          this.coverageAdequacies = this.stats?.coverageAdequacies ?? [];
          this.willStatuses = this.stats?.willStatuses ?? [];
          this.insuranceCostTemplate = this.stats?.insuranceCost ?? undefined;
        }),
        tap(() =>  {
          this.isEmergenciesLoaded = true;
          this.checkFullyLoaded();
        })
      )
      .subscribe();

      // load client
      this.client$ = this.store.select(selectedClient);
      this.client$
        .pipe(
          switchMap(client => {

            // load client from store
            if (client) {
              this.clientData = client.clientDetails;
              this.isClientLoaded = true;
              this.checkFullyLoaded();
              return of(client);
            }

            // if client is not in store load it from the api
            return this.clientHttpService.getClientByCashflowId(this.cashflowId).pipe(
              tap(apiClient => {
                if (apiClient) {
                  this.store.dispatch({
                    type: '[Client API] Load Success',
                    client: apiClient
                  });
                
                  this.clientData = apiClient.clientDetails;
                  this.isClientLoaded = true;
                  this.checkFullyLoaded();
                }
              }),
              catchError(() => of(null))
            );
          })
        ).subscribe();
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
    this.dialog.open(AddEmergenciesComponent, {
      width: '700px',
      disableClose: true,
      data: {
        emergencyTypes: this.emergencyTypes,
        policyStatuses: this.policyStatuses,
        coverageAdequacies: this.coverageAdequacies,
        willStatuses: this.willStatuses,
        insuranceCostTemplate: this.insuranceCostTemplate,
        client: this.clientId
          ? { id: this.clientId, name: '' }
          : undefined,
        cashflow: this.cashflowId
          ? {
            id: this.cashflowId,
            name: ''
          }
          : undefined,
        defaultTypeId: 1, // Insurance for now; later you can pass 2 for Will etc.
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        cycles: this.amountCycles
      },
    }).afterClosed().subscribe(res => {
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
    return this.emergencyTypes.find(t => t.id === typeId)?.name ?? 'Unknown';
  }

  getPolicyStatusLabel(statusId: number | null): string {
    if (statusId == null) 
      return '-';
    
    return this.policyStatuses.find(p => p.id === statusId)?.description ?? 'Unknown';
  }

  getCoverageAdequacyLabel(id: number | null): string {
    if (id == null) return '-';
    return this.coverageAdequacies.find(c => c.id === id)?.description ?? 'Unknown';
  }

  getWillStatusLabel(id: number | null): string {
    if (id == null) return 'Not set';

    return this.policyStatuses.find(w => w.id === id)?.description ?? 'Unknown';
  }

  getIconName(e: Emergency): string {
    const key = (e.name || '').toLowerCase();

    if (key === 'natural hazards') {
      return `assets/images/svgs/${this.iconMap['naturalHazards']}`;
    }

    return `assets/images/svgs/${this.iconMap[key] ?? this.defaultIcon}`;
  }

  getProtectionScoreCssClass(score: number | null): string {
    if (score == null || score < 50) {
      return 'basic';
    } else if (score < 75) {
      return 'good';
    } else {
      return 'excellent';
    }
  }

  getCardCssClass(e: Emergency): string {
    if(e.type === 1)
    {
      const isNotCovered = e.policyStatus == 2;
      return isNotCovered ? 'danger-card' 
        : e.coverageAdequacy === 1 ? 'basic-card' : e.coverageAdequacy === 2 ? 'good-card' : 'excellent-card';
    }

    if(e.type === 2)
    {
      const isNotDone = e.willStatus == 2;
      return isNotDone ? 'danger-card' : 'home-card';
    }

    return 'danger-card';
  }

  getDotClass(e: Emergency): string {
    if(e.type === 1)
    {
      const isNotCovered = e.policyStatus == 2;
      return isNotCovered ? 'dot-red' : 'dot';
    }

    if(e.type === 2)
    {
      const isNotDone = e.willStatus == 2;
      return isNotDone ? 'dot-red' : 'dot';
    }

    return 'dot-red';
  }

  onEditClick(emergency: Emergency): void {
    const dialogRef = this.dialog.open(AddEmergenciesComponent, {
      width: '700px',
      disableClose: true,
      data: {
        mode: 'edit',
        emergency,
        emergencyTypes: this.emergencyTypes,
        policyStatuses: this.policyStatuses,
        coverageAdequacies: this.coverageAdequacies,
        willStatuses: this.willStatuses,
        insuranceCostTemplate: this.insuranceCostTemplate,
        client: emergency.client,      // may be empty for now but still fine
        cashflow: emergency.cashflow,  // has id at least
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        cycles: this.amountCycles
      },
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.status === 'Success') {
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
        }
      });
  }

  showHiddenEmergencies(): void {
    const hiddenEmergencies = this.emergencies.filter(e => e.isHidden);

    if (hiddenEmergencies.length === 0) {
      return;
    }

    // update all hidden emergencies in API first
    const updates$ = hiddenEmergencies.map(e => {
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
      }
    });
  }

  onCoverageAdequacyChange(e: Emergency, newId: number): void {
    if (newId === e.coverageAdequacy) {
      return;
    }

    const updated: Emergency = { ...e, coverageAdequacy: newId };

    this.emergenciesHttp.updateEmergency(updated).subscribe({
      next: (res: Emergency) => {
        e.coverageAdequacy = res.coverageAdequacy;
        this.load();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to update coverage adequacy', 'Error');
      }
    });
  }

  get hasHiddenEmergencies(): boolean {
    return this.emergencies?.some(e => e.isHidden) ?? false;
  }

  get filteredEmergencies(): Emergency[] {
    return this.emergencies.filter(e => !e.isHidden);
  }
}


