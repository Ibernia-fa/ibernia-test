import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CashflowState } from './cashflow.reducer';

export const selectCashflowState = createFeatureSelector<CashflowState>('cashflow');

export const selectedCashflow = createSelector(selectCashflowState, (state) => state.selectedCashflow);
