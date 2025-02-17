import { createAction, props } from '@ngrx/store';
import { Client } from 'src/app/clients/models/client';

export const selectClient = createAction('[Client] Select Client', props<{ client: Client }>());
export const clearClient = createAction('[Client] Clear Client');
