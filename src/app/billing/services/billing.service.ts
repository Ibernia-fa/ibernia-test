import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  CheckoutSessionResponse,
  CreateCheckoutSessionRequest,
  PlanModel,
  PortalSessionResponse,
  SubscriptionDto,
  SyncSessionResponse,
} from '../models/billing.models';

/**
 * User billing API (`/api/v1/billing`). Requires JWT; paths are relative so
 * `httpRequestInterceptor` can prefix `environment.apiUrl`.
 *
 * Configure Stripe Checkout `SuccessUrl` to return here with
 * `?session_id={CHECKOUT_SESSION_ID}` (e.g.
 * `https://host/settings/plan-billing?session_id={CHECKOUT_SESSION_ID}`)
 * so `PlanBillingComponent` can call `syncCheckoutSession`.
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly base = '/api/v1/billing';

  constructor(private readonly http: HttpClient) {}

  getPlans(): Observable<PlanModel[]> {
    return this.http.get<PlanModel[]>(`${this.base}/plans`);
  }

  /**
   * Returns `null` when the user has no subscription (HTTP 204) or on
   * recoverable errors (then of(null)).
   */
  getSubscription(): Observable<SubscriptionDto | null> {
    return this.http
      .get<SubscriptionDto>(`${this.base}/subscription`, { observe: 'response' })
      .pipe(
        map((r) => (r.status === 204 || r.body == null ? null : r.body)),
        catchError(() => of(null)),
      );
  }

  createCheckoutSession(
    body: CreateCheckoutSessionRequest,
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.base}/checkout-session`,
      body,
    );
  }

  createPortalSession(): Observable<PortalSessionResponse> {
    return this.http.post<PortalSessionResponse>(
      `${this.base}/portal-session`,
      {},
    );
  }

  syncCheckoutSession(sessionId: string): Observable<SyncSessionResponse> {
    const id = encodeURIComponent(sessionId);
    return this.http.post<SyncSessionResponse>(
      `${this.base}/session/${id}/sync`,
      {},
    );
  }
}
