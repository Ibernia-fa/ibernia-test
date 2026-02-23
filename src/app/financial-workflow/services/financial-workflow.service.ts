import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, filter, tap } from 'rxjs';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import { selectedClient } from 'src/app/store/client/client.selectors';

import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';

@Injectable({
  providedIn: 'root'
})
export class FinancialWorkflowService {

  constructor(private store: Store) { }

  loadClientCashflowMetadata(params: any) {
    const selectedClient$ = this.store.select(selectedClient);
    const selectedCashflow$ = this.store.select(selectedCashflow);
    return combineLatest([selectedClient$, selectedCashflow$])
      .pipe(
        tap(([client, cashflow]) => {
          if(!cashflow) {
            this.store.dispatch(CashflowActions.loadCashflow({cashflowId: params['id']}));
          }
          if(cashflow && (!client || client.id !== cashflow.client.id) ) {
            this.store.dispatch(ClientActions.loadClient({clientId: cashflow.client.id}));
          }
        }),
        filter(([client, cashflow]) => !!client && !!cashflow),
      )
  }
}
