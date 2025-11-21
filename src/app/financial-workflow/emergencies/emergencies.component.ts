import { Component, OnInit } from '@angular/core';
import { catchError, combineLatest, filter, map, of, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EmergenciesHttpService as EmergenciesHttpService } from './services/emergencies-http.service';
// import { EmergenciesModel as EmergenciesModel } from './models/emergencies.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddEmergenciesComponent } from './add-emergencies/add-emergencies.component';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import { EmergenciesResponse, Emergency, LookupItem, Money, StatsAndLookupData } from './models/emergencies.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-emergencies',
   imports: [
      MatSliderModule,
      MatIconModule,
  MatCardModule,
  MatChipsModule
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

  constructor(
    private route: ActivatedRoute,
    private emergenciesHttp: EmergenciesHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private navItemService: NavItemService,
  ) {
    this.load();
    this.navItemService.currentRouteName = 'Emergencies';
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
  }

  trackById(_: number, e: Emergency) {
    return e.id;
  }

    onAddClick(){
  this.dialog.open(AddEmergenciesComponent, {
  width: '700px',
  disableClose: true,
  data: {
    emergencyTypes: this.emergencyTypes,
    policyStatuses: this.stats?.policyStatuses,
    coverageAdequacies: this.coverageAdequacies,
    willStatuses:  this.willStatuses,
    // client: { id: client.id, name: client.clientDetails?.name },
    // cashflow: { id: cashflow.id, name: cashflow.name }
  }
}).afterClosed().subscribe(res => {
  if (res?.status === 'Success') {
    // refresh list
  }
});

  }
}


