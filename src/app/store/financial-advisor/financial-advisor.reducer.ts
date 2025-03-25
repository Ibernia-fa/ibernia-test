import { createReducer, on } from '@ngrx/store';
import * as FinancialAdvisorActions from './financial-advisor.actions';
// import { FinancialAdvisor } from '../models/financial-advisor.model';

export interface FinancialAdvisorState {
  advisor: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: FinancialAdvisorState = {
  advisor: null,
  loading: false,
  error: null
};

export const financialAdvisorReducer = createReducer(
  initialState,
  on(FinancialAdvisorActions.loadFinancialAdvisor, (state) => ({ ...state, loading: true })),
  on(FinancialAdvisorActions.loadFinancialAdvisorSuccess, (state, { advisor }) => ({
    ...state,
    advisor,
    loading: false
  })),
  on(FinancialAdvisorActions.loadFinancialAdvisorFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(FinancialAdvisorActions.updateFinancialAdvisor, (state, { advisor }) => ({
    ...state,
    advisor
  }))
);
