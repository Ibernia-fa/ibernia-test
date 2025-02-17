import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ClientState } from './client.reducer';

export const selectClientState = createFeatureSelector<ClientState>('client');

export const selectClient = createSelector(selectClientState, (state) => state.selectedClient);
