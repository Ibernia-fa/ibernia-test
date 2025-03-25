import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FinancialAdvisorState } from './financial-advisor.reducer';

export const selectFinancialAdvisorState = createFeatureSelector<FinancialAdvisorState>('financialAdvisor');

export const selectFinancialAdvisor = createSelector(selectFinancialAdvisorState, (state) => state.advisor);
export const selectFinancialAdvisorLoading = createSelector(selectFinancialAdvisorState, (state) => state.loading);
export const selectFinancialAdvisorError = createSelector(selectFinancialAdvisorState, (state) => state.error);
