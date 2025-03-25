import { createAction, props } from '@ngrx/store';
import { Cashflow } from 'src/app/clients/models/cashflow';

export const selectCashflow = createAction('[Cashflow] Select Cashflow', props<{ cashflow: Cashflow }>());
export const loadCashflow = createAction('[Cashflow] Load Cashflow', props<{ cashflowId: string }>());
export const loadCashflowSuccess = createAction('[Cashflow] Load Cashflow Success', props<{ cashflow: Cashflow }>());
export const loadCashflowFailure = createAction('[Cashflow] Load Cashflow Failure', props<{ error: any }>());
export const clearCashflow = createAction('[Cashflow] Clear Cashflow');