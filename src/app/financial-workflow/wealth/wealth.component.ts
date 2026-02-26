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
import { Observable, of, switchMap, tap, catchError, map, filter } from 'rxjs';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { ClientHttpService } from 'src/app/clients/services/client-http.service';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { Client, Details } from 'src/app/clients/models/client';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';

import { WealthHttpService } from './services/wealth-http.service';
import { WealthDashboardModel, WealthAssetModel, WealthLiabilityModel } from './models/wealth.model';
import { AddAssetComponent } from './add-asset/add-asset.component';
import { AddLiabilityComponent } from './add-liability/add-liability.component';

@Component({
  selector: 'app-wealth',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CurrencySymbolPipe
  ],
  templateUrl: './wealth.component.html',
  styleUrl: './wealth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WealthComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  cashflowId!: string;
  isLoading = false;
  dashboard: WealthDashboardModel | null = null;
  clientData: Details | null = null;
  client$: Observable<Client | null>;

  private isClientLoaded = false;
  private isDashboardLoaded = false;

  readonly assetSections = [
    { key: 'Cash', label: 'Cash' },
    { key: 'Investments', label: 'Investments' },
    { key: 'Real estate', label: 'Real Estate' },
    { key: 'Personal property', label: 'Personal Property' },
  ];

  readonly liquidityNextMap: Record<string, string> = {
    'Liquid': 'Partial',
    'Partial': 'Illiquid',
    'Illiquid': 'Liquid'
  };

  constructor(
    private route: ActivatedRoute,
    private wealthHttp: WealthHttpService,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private navItemService: NavItemService,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {
    this.navItemService.currentRouteName = 'Wealth & Inheritance';
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.isClientLoaded = false;
    this.isDashboardLoaded = false;

    this.route.paramMap
      .pipe(
        map(pm => {
          const cf = pm.get('cashflowId') || pm.get('id');
          if (!cf) throw new Error('cashflowId not found in route.');
          this.cashflowId = cf;
          return cf;
        }),
        switchMap(cashflowId =>
          this.wealthHttp.getDashboard(cashflowId).pipe(
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

    this.client$ = this.store.select(selectedClient);
    this.client$
      .pipe(
        switchMap(client => {
          if (client) {
            this.clientData = client.clientDetails;
            this.isClientLoaded = true;
            this.checkFullyLoaded();
            return of(client);
          }
          return this.clientHttpService.getClientByCashflowId(this.cashflowId).pipe(
            tap(apiClient => {
              if (apiClient) {
                this.store.dispatch({ type: '[Client API] Load Success', client: apiClient });
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

  getAssetsForSection(sectionKey: string): WealthAssetModel[] {
    return this.dashboard?.assets?.filter(a => a.category === sectionKey) ?? [];
  }

  onAddAsset(): void {
    const dialogRef = this.dialog.open(AddAssetComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'add',
        cashflowId: this.cashflowId,
        clientPreferredCurrency: this.clientData?.preferredCurrency
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
    const dialogRef = this.dialog.open(AddAssetComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'edit',
        cashflowId: this.cashflowId,
        asset,
        clientPreferredCurrency: this.clientData?.preferredCurrency
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
    this.wealthHttp.deleteAsset(this.cashflowId, asset.id).subscribe({
      next: () => {
        this.toastr.success('Asset deleted', 'Success');
        this.refreshDashboard();
      },
      error: () => this.toastr.error('Failed to delete asset', 'Error')
    });
  }

  onToggleLiquidity(asset: WealthAssetModel): void {
    if (!asset.isLiquidityEditable) return;

    const nextLiquidity = this.liquidityNextMap[asset.liquidity] || 'Liquid';
    this.wealthHttp.updateAssetLiquidity(this.cashflowId, asset.id, nextLiquidity).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.cdr.markForCheck();
      },
      error: () => this.toastr.error('Failed to update liquidity', 'Error')
    });
  }

  onAddLiability(): void {
    const dialogRef = this.dialog.open(AddLiabilityComponent, {
      width: '500px',
      disableClose: true,
      data: {
        mode: 'add',
        cashflowId: this.cashflowId,
        clientPreferredCurrency: this.clientData?.preferredCurrency
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
        clientPreferredCurrency: this.clientData?.preferredCurrency
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

  getLiquidityClass(liquidity: string): string {
    switch (liquidity) {
      case 'Liquid': return 'liquidity-liquid';
      case 'Partial': return 'liquidity-partial';
      case 'Illiquid': return 'liquidity-illiquid';
      default: return 'liquidity-illiquid';
    }
  }

  getLiquidityLabel(liquidity: string): string {
    switch (liquidity) {
      case 'Liquid': return 'Liquid';
      case 'Partial': return 'Partial liquid';
      case 'Illiquid': return 'Illiquid';
      default: return liquidity;
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
