import { createReducer, on } from '@ngrx/store';
import * as CashflowActions from './cashflow.actions';
import { Cashflow } from 'src/app/clients/models/cashflow';

export interface CashflowState {
  selectedCashflow: Cashflow | null;
}

const initialState: CashflowState = {
  selectedCashflow: null
};

export const cashflowReducer = createReducer(
  initialState,
  on(CashflowActions.selectCashflow, (state, { cashflow }) => ({ ...state, selectedCashflow: cashflow })),
  on(CashflowActions.clearCashflow, () => ({ selectedCashflow: null }))
);
