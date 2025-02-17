import { createAction, props } from '@ngrx/store';
// import { FinancialAdvisor } from '../models/financial-advisor.model';

export const loadFinancialAdvisor = createAction('[Financial Advisor] Load Financial Advisor');
export const loadFinancialAdvisorSuccess = createAction(
  '[Financial Advisor] Load Financial Advisor Success',
  props<{ advisor: any }>()
);
export const loadFinancialAdvisorFailure = createAction(
  '[Financial Advisor] Load Financial Advisor Failure',
  props<{ error: string }>()
);
export const updateFinancialAdvisor = createAction(
  '[Financial Advisor] Update Financial Advisor',
  props<{ advisor: any }>()
);
