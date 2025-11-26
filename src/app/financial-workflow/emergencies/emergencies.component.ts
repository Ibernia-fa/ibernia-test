import { Component, OnInit } from '@angular/core';
import { catchError, combineLatest, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EmergenciesHttpService as EmergenciesHttpService } from './services/emergencies-http.service';
// import { EmergenciesModel as EmergenciesModel } from './models/emergencies.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddEmergenciesComponent } from './add-emergencies/add-emergencies.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { EmergenciesResponse, Emergency, LookupItem, Money, StatsAndLookupData } from './models/emergencies.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { Client , Details} from 'src/app/clients/models/client';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
// import { Client } from '../../clients/models/client'
@Component({
  selector: 'app-emergencies',
  imports: [
    MatSliderModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    CommonModule,
    MatTooltipModule,
    MatButtonToggleModule
  ],

  templateUrl: './emergencies.component.html',
  styleUrl: './emergencies.component.scss'
})

export class EmergenciesComponent {
  // Route params (use what your route provides; supports both styles)
  clientId?: string;
  cashflowId!: string;

  // UI state
  isLoading = false;
  errorMessage = '';

  // Data
  emergencies: Emergency[] = [];
  stats?: StatsAndLookupData;

  // Lookups (for add/edit popup later)
  emergencyTypes: LookupItem[] = [];
  policyStatuses: LookupItem[] = [];
  coverageAdequacies: LookupItem[] = [];
  willStatuses: LookupItem[] = [];
  insuranceCostTemplate?: Money;
  client$: Observable<Client | null>;
  clientData: Details;
  amountCycles: any;

  constructor(
    private route: ActivatedRoute,
    private emergenciesHttp: EmergenciesHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private navItemService: NavItemService,
    private store: Store,
    private settingHttpService: SettingsHttpService,

  ) {
    this.load();
    this.navItemService.currentRouteName = 'Emergencies';
    this.settingHttpService.getAmountCycles().subscribe((cycles) => {
      this.amountCycles = cycles;
    })

  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.route.paramMap
      .pipe(
        map(pm => {
          // support either /clients/:clientId/cashflows/:cashflowId/emergencies
          // or /cashflows/:id/emergencies
          const cf = pm.get('cashflowId') || pm.get('id');
          const cl = pm.get('clientId') || undefined;
          if (!cf) throw new Error('cashflowId not found in route.');
          this.cashflowId = cf;
          this.clientId = cl;
          return cf;
        }),
        switchMap(cashflowId =>
          this.emergenciesHttp.getAllByCashflowId(cashflowId).pipe(
            catchError((err: HttpErrorResponse) => {
              this.errorMessage =
                err?.error?.message || 'Failed to load emergencies.';
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
        tap(() => (this.isLoading = false))
      )
      .subscribe();

    this.client$ = this.store.select(selectedClient);
    this.client$
      .subscribe(client => {
        if (client) {
          this.clientData = client.clientDetails;
          console.log('this client', this.clientData);

        }

      });
  }

  trackById(_: number, e: Emergency) {
    return e.id;
  }

  //     onAddClick(){
  //   this.dialog.open(AddEmergenciesComponent, {
  //   width: '700px',
  //   disableClose: true,
  //   data: {
  //     emergencyTypes: this.emergencyTypes,
  //     policyStatuses: this.stats?.policyStatuses,
  //     coverageAdequacies: this.coverageAdequacies,
  //     willStatuses:  this.willStatuses,
  //     // client: { id: client.id, name: client.clientDetails?.name },
  //     // cashflow: { id: cashflow.id, name: cashflow.name }
  //   }
  // }).afterClosed().subscribe(res => {
  //   if (res?.status === 'Success') {
  //     // refresh list
  //   }
  // });

  //   }


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
        this.load(); // re-fetch emergencies + stats
      }
    });
  }

  getTypeName(typeId: number): string {
    return this.emergencyTypes.find(t => t.id === typeId)?.name ?? 'Unknown';
  }

  getPolicyStatusLabel(statusId: number | null): string {
    if (statusId == null) return '-';
    return this.policyStatuses.find(p => p.id === statusId)?.description ?? 'Unknown';
  }

  getCoverageAdequacyLabel(id: number | null): string {
    if (id == null) return '-';
    return this.coverageAdequacies.find(c => c.id === id)?.description ?? 'Unknown';
  }

  getWillStatusLabel(id: number | null): string {
    if (id == null) return 'Not set';
    return this.willStatuses.find(w => w.id === id)?.description ?? 'Unknown';
  }

  getInsuranceCostLabel(e: Emergency): string {
    const cost = e.insuranceCost;
    if (!cost) return '-';
    const symbol = cost.currencySymbol ?? '';
    const amount = cost.amount ?? 0;
    const cycleDesc = cost.cycle?.description || cost.cycle?.id || '';
    return `${symbol}${amount} ${cycleDesc ? `(${cycleDesc})` : ''}`;
  }

  getIconName(e: Emergency): string {
    // you can tweak this mapping
    if (e.type === 1) {
      return 'health_and_safety'; // insurance
    }
    if (e.type === 2) {
      return 'description'; // will
    }
    return 'shield';
  }

  getCardCssClass(e: Emergency): string {
    // Simple example: mark "not covered" / bad adequacy as danger
    const isNotCovered = e.policyStatus === 2 || e.coverageAdequacy === 1;
    return isNotCovered ? 'danger-card' : 'health-card';
  }

  get hasHiddenEmergencies(): boolean {
    return this.emergencies?.some(e => e.isHidden) ?? false;
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


}


