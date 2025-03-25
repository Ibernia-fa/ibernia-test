import { Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as CashflowActions from './cashflow.actions';
import { CashflowHttpService } from 'src/app/clients/services/cashflow-http.service';

@Injectable()
export class CashflowEffects {
  constructor(private actions$: Actions, 
    private cashflowHttpService: CashflowHttpService
) {}

  loadCashflow$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CashflowActions.loadCashflow),
      mergeMap((props: { cashflowId: string }) =>
        this.cashflowHttpService.getByCashflowId(props.cashflowId).pipe(
          map((cashflow) => CashflowActions.loadCashflowSuccess({ cashflow })),
          catchError((error) => of(CashflowActions.loadCashflowFailure({ error: error.message })))
        )
      )
    )
  );
}
