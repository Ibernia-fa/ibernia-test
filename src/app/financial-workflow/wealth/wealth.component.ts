import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngrx/store';
import { of, switchMap, tap, catchError, filter, forkJoin } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import moment from 'moment';

import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { ClientHttpService } from 'src/app/clients/services/client-http.service';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { Client, Details } from 'src/app/clients/models/client';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { SavingsPotsHttpService } from '../saving-pots/services/savings-pots-http.service';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { AddNewPotComponent } from '../saving-pots/add-new-pot/add-new-pot.component';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';
import { WealthHttpService } from './services/wealth-http.service';
import { WealthDashboardModel, WealthAssetModel, WealthLiabilityModel } from './models/wealth.model';
import { AddAssetComponent } from './add-asset/add-asset.component';
import { AddLiabilityComponent } from './add-liability/add-liability.component';
import { LegacyComponent } from './legacy/legacy.component';

@Component({
  selector: 'app-wealth',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CurrencySymbolPipe,
    LegacyComponent
  ],
  templateUrl: './wealth.component.html',
  styleUrl: './wealth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WealthComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  activeTab: 'networth' | 'legacy' = 'networth';
  cashflowId!: string;
  isLoading = false;
  dashboard: WealthDashboardModel | null = null;
  clientData: Details | null = null;
  selectedClient: Client | null = null;

  private isClientLoaded = false;
  private isDashboardLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private wealthHttp: WealthHttpService,
    private clientHttpService: ClientHttpService,
    private savingPotsHttp: SavingsPotsHttpService,
    private timelineHttp: TimelineHttpService,
    private settingsHttp: SettingsHttpService,
    private authService: AuthService,
    private settingsService: SettingsService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private navItemService: NavItemService,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {
    this.navItemService.currentRouteName = 'Wealth & Inheritance';
  }

  get hasPartner(): boolean {
    return this.dashboard?.hasPartner ?? false;
  }

  get clientFirstName(): string {
    return this.selectedClient?.clientDetails?.firstName ?? '';
  }

  get partnerFirstName(): string {
    return this.selectedClient?.partnerDetail?.firstName ?? '';
  }

  ngOnInit(): void {
    this.load();
  }

  switchTab(tab: 'networth' | 'legacy'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  private getCashflowId(): string {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const id = r.snapshot.paramMap.get('id') || r.snapshot.paramMap.get('cashflowId');
      if (id) return id;
      r = r.parent;
    }
    throw new Error('cashflowId not found in route.');
  }

  private load(): void {
    this.isLoading = true;
    this.isClientLoaded = false;
    this.isDashboardLoaded = false;

    const cashflowId = this.getCashflowId();
    this.cashflowId = cashflowId;

    of(cashflowId)
      .pipe(
        switchMap((cfId: string) =>
          this.wealthHttp.getDashboard(cfId).pipe(
            catchError(err => {
              this.toastr.error(err?.error?.message || 'Failed to load wealth data', 'Error');
              return of(null);
            })
          )
        ),
        filter((res): res is WealthDashboardModel => !!res),
        tap(res => {
          this.dashboard = res;
          this.isDashboardLoaded = true;
          this.checkFullyLoaded();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.store.select(selectedClient)
      .pipe(
        switchMap(client => {
          if (client) {
            this.selectedClient = client;
            this.clientData = client.clientDetails;
            this.isClientLoaded = true;
            this.checkFullyLoaded();
            return of(client);
          }
          return this.clientHttpService.getClientByCashflowId(this.cashflowId).pipe(
            tap(apiClient => {
              if (apiClient) {
                this.store.dispatch({ type: '[Client API] Load Success', client: apiClient });
                this.selectedClient = apiClient;
                this.clientData = apiClient.clientDetails;
                this.isClientLoaded = true;
                this.checkFullyLoaded();
              }
            }),
            catchError(() => of(null))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private checkFullyLoaded(): void {
    if (this.isDashboardLoaded && this.isClientLoaded) {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  // --- Asset actions ---

  onAddAsset(): void {
    const dialogRef = this.dialog.open(AddAssetComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'add',
        cashflowId: this.cashflowId,
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        hasPartner: this.hasPartner,
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.cdr.markForCheck();
      }
    });
  }

  onEditAsset(asset: WealthAssetModel): void {
    if (asset.isFromSavingPots) {
      this.onEditSavingPot(asset);
      return;
    }

    const dialogRef = this.dialog.open(AddAssetComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'edit',
        cashflowId: this.cashflowId,
        asset,
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        hasPartner: this.hasPartner,
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.cdr.markForCheck();
      } else if (result?.deleted) {
        this.refreshDashboard();
      }
    });
  }

  onDeleteAsset(asset: WealthAssetModel): void {
    if (asset.isFromSavingPots) return;
    this.wealthHttp.deleteAsset(this.cashflowId, asset.id).subscribe({
      next: () => {
        this.toastr.success('Asset deleted', 'Success');
        this.refreshDashboard();
      },
      error: () => this.toastr.error('Failed to delete asset', 'Error')
    });
  }

  private onEditSavingPot(asset: WealthAssetModel): void {
    forkJoin([
      this.savingPotsHttp.getAllSavingsPots(this.cashflowId),
      this.timelineHttp.getTimelinebyCashflowId(this.cashflowId),
      this.settingsHttp.getAmountCycles(),
      this.settingsHttp.getEscalationRates(this.selectedClient?.id ?? '')
    ]).subscribe({
      next: ([savingPots, timeline, amountCycles, escalationRatesResponse]) => {
        const pot = savingPots?.clientSavings?.find((s: any) => s.id === asset.id);
        if (!pot) {
          this.toastr.error('Saving pot not found', 'Error');
          return;
        }

        const escalationRates = patchInflationRateDescription(
          escalationRatesResponse?.escalationRates ?? [],
          0
        );

        let userPreferences: any = null;
        let returnRate = 3.5;
        this.settingsService.userData$.pipe(
          filter((v): v is NonNullable<typeof v> => v != null),
        ).subscribe(data => {
          userPreferences = data.preferences;
          returnRate = data.preferences?.investmentReturn ?? 3.5;
        });

        const dialogRef = this.dialog.open(AddNewPotComponent, {
          width: '700px',
          disableClose: true,
          data: {
            returnRate,
            inflationRate: this.selectedClient?.clientDetails?.inflationRate ?? 0,
            loggedInUserPreferences: userPreferences,
            amountCycles,
            escalataionRates: escalationRates,
            eventsList: [...(timeline?.clientEvents ?? [])].sort((a: any, b: any) => a.start.age - b.start.age),
            clientBirthDate: this.selectedClient?.clientDetails?.birthDate,
            clientPreferredCurrency: this.selectedClient?.clientDetails?.preferredCurrency,
            forecastEndDateYear: moment(timeline?.forecastEndtDate).year(),
            forecastStartDateYear: moment(timeline?.forecastStartDate).year(),
            cashflowId: this.cashflowId,
            isEditWorkflow: true,
            event: pot,
            existingSavingPots: savingPots?.clientSavings || [],
            hasPartner: this.hasPartner,
            clientFirstName: this.clientFirstName,
            partnerFirstName: this.partnerFirstName
          }
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result?.savingPot || result?.status === 'Success') {
            this.refreshDashboard();
          }
        });
      },
      error: () => this.toastr.error('Failed to load saving pot data', 'Error')
    });
  }

  // --- Liability actions ---

  onAddLiability(): void {
    const dialogRef = this.dialog.open(AddLiabilityComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'add',
        cashflowId: this.cashflowId,
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        hasPartner: this.hasPartner,
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.cdr.markForCheck();
      }
    });
  }

  onEditLiability(liability: WealthLiabilityModel): void {
    const dialogRef = this.dialog.open(AddLiabilityComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'edit',
        cashflowId: this.cashflowId,
        liability,
        clientPreferredCurrency: this.clientData?.preferredCurrency,
        hasPartner: this.hasPartner,
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.cdr.markForCheck();
      } else if (result?.deleted) {
        this.refreshDashboard();
      }
    });
  }

  onDeleteLiability(liability: WealthLiabilityModel): void {
    this.wealthHttp.deleteLiability(this.cashflowId, liability.id).subscribe({
      next: () => {
        this.toastr.success('Liability deleted', 'Success');
        this.refreshDashboard();
      },
      error: () => this.toastr.error('Failed to delete liability', 'Error')
    });
  }

  getOwnershipLabel(ownership: string): string {
    if (!ownership || ownership === 'Joint') return 'Joint';
    if (ownership === 'Client') return this.clientFirstName || 'Client';
    if (ownership === 'Partner') return this.partnerFirstName || 'Partner';
    return ownership;
  }

  getOwnershipClass(ownership: string): string {
    switch (ownership) {
      case 'Client': return 'ownership-client';
      case 'Partner': return 'ownership-partner';
      default: return 'ownership-joint';
    }
  }

  private refreshDashboard(): void {
    this.wealthHttp.getDashboard(this.cashflowId).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.cdr.markForCheck();
      },
      error: () => this.toastr.error('Failed to refresh data', 'Error')
    });
  }
}
