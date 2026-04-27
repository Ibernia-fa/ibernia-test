import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PlanModel, SubscriptionDto } from 'src/app/billing/models/billing.models';
import { BillingService } from 'src/app/billing/services/billing.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-plan-billing',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './plan-billing.component.html',
  styleUrl: './plan-billing.component.scss',
})
export class PlanBillingComponent implements OnInit {
  private readonly billing = inject(BillingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly navItemService = inject(NavItemService);

  readonly loading = signal(true);
  readonly plans = signal<PlanModel[]>([]);
  readonly billingUnavailable = signal(false);
  readonly subscription = signal<SubscriptionDto | null>(null);
  readonly checkoutPriceId = signal<string | null>(null);
  readonly portalLoading = signal(false);

  constructor() {
    this.navItemService.currentRouteName = 'Plans & Billing';
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.syncAfterCheckout(sessionId);
    } else {
      this.loadPlansAndSubscription();
    }
  }

  formatPrice(plan: PlanModel): string {
    const amount = plan.unitAmount / 100;
    const code = (plan.currency || 'EUR').toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
      }).format(amount);
    } catch {
      return `${amount} ${code}`;
    }
  }

  billingInterval(plan: PlanModel): string {
    const n = plan.intervalCount || 1;
    const unit = plan.interval || 'month';
    if (n === 1) return unit;
    return `${n} ${unit}s`;
  }

  hasActiveSubscription(): boolean {
    const s = this.subscription();
    if (!s?.status) return false;
    return ['active', 'trialing', 'past_due'].includes(s.status);
  }

  subscribeToPlan(plan: PlanModel): void {
    if (!plan.priceId) return;
    this.checkoutPriceId.set(plan.priceId);
    this.billing
      .createCheckoutSession({ priceId: plan.priceId })
      .pipe(finalize(() => this.checkoutPriceId.set(null)))
      .subscribe({
        next: (res) => {
          if (res?.url) {
            window.location.href = res.url;
            return;
          }
          this.toastr.error(
            this.translate.instant('ERROR.BILLING_CHECKOUT'),
            this.translate.instant('LABEL.ERROR'),
          );
        },
        error: (err) => {
          this.toastr.error(
            this.apiMessage(err, 'ERROR.BILLING_CHECKOUT'),
            this.translate.instant('LABEL.ERROR'),
          );
        },
      });
  }

  openCustomerPortal(): void {
    this.portalLoading.set(true);
    this.billing
      .createPortalSession()
      .pipe(finalize(() => this.portalLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.url) {
            window.location.href = res.url;
            return;
          }
          this.toastr.error(
            this.translate.instant('ERROR.BILLING_PORTAL'),
            this.translate.instant('LABEL.ERROR'),
          );
        },
        error: (err) => {
          this.toastr.error(
            this.apiMessage(err, 'ERROR.BILLING_PORTAL'),
            this.translate.instant('LABEL.ERROR'),
          );
        },
      });
  }

  private syncAfterCheckout(sessionId: string): void {
    this.loading.set(true);
    this.billing
      .syncCheckoutSession(sessionId)
      .pipe(
        finalize(() => {
          this.clearCheckoutQueryParams();
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            this.translate.instant('TOAST.BILLING_CHECKOUT_SYNCED'),
            this.translate.instant('LABEL.SUCCESS'),
          );
          this.refreshAfterCheckout();
        },
        error: (err) => {
          this.toastr.error(
            this.apiMessage(err, 'ERROR.BILLING_SYNC'),
            this.translate.instant('LABEL.ERROR'),
          );
          this.loadPlansAndSubscription();
        },
      });
  }

  private clearCheckoutQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session_id: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Re-fetch plans + subscription after a successful checkout sync. */
  private refreshAfterCheckout(): void {
    this.loading.set(true);
    forkJoin({
      plans: this.billing.getPlans().pipe(
        catchError((err) => {
          this.setBillingUnavailable(err);
          return of([] as PlanModel[]);
        }),
      ),
      sub: this.billing.getSubscription(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ plans, sub }) => {
        this.plans.set(this.sortPlans(plans));
        this.subscription.set(sub);
      });
  }

  private loadPlansAndSubscription(): void {
    this.loading.set(true);
    forkJoin({
      plans: this.billing.getPlans().pipe(
        catchError((err) => {
          this.setBillingUnavailable(err);
          return of([] as PlanModel[]);
        }),
      ),
      sub: this.billing.getSubscription(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ plans, sub }) => {
        this.plans.set(this.sortPlans(plans));
        this.subscription.set(sub);
      });
  }

  private sortPlans(plans: PlanModel[]): PlanModel[] {
    return [...plans].sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        (a.unitAmount ?? 0) - (b.unitAmount ?? 0),
    );
  }

  private setBillingUnavailable(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.billingUnavailable.set(true);
    }
  }

  private apiMessage(err: unknown, fallbackKey: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const m = (body as { message?: string }).message;
        if (typeof m === 'string' && m.length > 0) {
          return m;
        }
      }
      if (typeof err.error === 'string' && err.error.length > 0) {
        return err.error;
      }
    }
    return this.translate.instant(fallbackKey);
  }
}
