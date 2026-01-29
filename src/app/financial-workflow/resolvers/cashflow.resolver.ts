import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';

@Injectable({ providedIn: 'root' })
export class CashflowResolver implements Resolve<boolean> {
  constructor(private store: Store) {}

  resolve(route: ActivatedRouteSnapshot): Observable<boolean> {
    const cashflowId = route.paramMap.get('id');
    if (!cashflowId) return of(true);
    
    this.store.dispatch(CashflowActions.loadCashflow({ cashflowId }));

    return this.store.select(selectedCashflow).pipe(
      filter((cf) => !!cf && cf.id === cashflowId),
      take(1),
      map(() => true)
    );
  }
}
