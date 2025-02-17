import { createReducer, on } from '@ngrx/store';
import * as ClientActions from './client.actions';
import { Client } from 'src/app/clients/models/client';

export interface ClientState {
  selectedClient: Client | null;
}

const initialState: ClientState = {
  selectedClient: null
};

export const clientReducer = createReducer(
  initialState,
  on(ClientActions.selectClient, (state, { client }) => ({ ...state, selectedClient: client })),
  on(ClientActions.loadClientSuccess, (state, { client }) => ({
      ...state,
      selectedClient: client,
      loading: false
    })),
    on(ClientActions.loadClientFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error
    })),
  on(ClientActions.clearClient, () => ({ selectedClient: null }))
);
