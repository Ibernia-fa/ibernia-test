import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Temporarily blocks School / AI Chat while keeping routes and components in the codebase.
 * Sends users to the plan (reports) for the same cashflow.
 */
export const redirectHiddenCashflowModuleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const cashflowId = route.parent?.snapshot.paramMap.get('id');
  if (cashflowId) {
    return router.createUrlTree(['/cashflows', cashflowId, 'reports']);
  }
  return router.createUrlTree(['/']);
};
