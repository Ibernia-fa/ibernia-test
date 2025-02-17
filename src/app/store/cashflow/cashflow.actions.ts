import { createAction, props } from '@ngrx/store';
import { Cashflow } from 'src/app/clients/models/cashflow';

export const selectCashflow = createAction('[Cashflow] Select Cashflow', props<{ cashflow: Cashflow }>());
export const clearCashflow = createAction('[Cashflow] Clear Cashflow');