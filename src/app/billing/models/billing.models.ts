/** Mirrors backend `PlanModel` (Stripe Price + Product projection). */
export interface PlanModel {
  priceId: string;
  productId: string;
  productName: string;
  description: string;
  unitAmount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  displayOrder: number;
  tier: string;
  modules: string[];
}

/** Mirrors backend `SubscriptionDto` (no Stripe ids). */
export interface SubscriptionDto {
  status: string;
  priceId: string;
  productId: string;
  currentPeriodStartUtc: string | null;
  currentPeriodEndUtc: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAtUtc: string | null;
  pastDueSinceUtc: string | null;
  activatedModules: string[];
  currency: string;
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface SyncSessionResponse {
  status: string;
  subscription: SubscriptionDto | null;
}
