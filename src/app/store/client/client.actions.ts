import { createAction, props } from '@ngrx/store';
import { Client } from 'src/app/clients/models/client';

export const selectClient = createAction('[Client] Select Client', props<{ client: Client }>());
export const loadClient = createAction('[Client] Load Client', props<{ clientId: string }>());
export const loadClientSuccess = createAction('[Client] Load Client Success', props<{ client: Client }>());
export const loadClientFailure = createAction('[Client] Load Client Failure', props<{ error: any }>());
export const clearClient = createAction('[Client] Clear Client');
