import { Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as CashflowActions from './cashflow.actions';

@Injectable()
export class CashflowEffects {
  constructor(private actions$: Actions, 
    // private CashflowService: CashflowService
) {}

//   loadCashflow$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(CashflowActions.loadCashflow),
//       mergeMap(() =>
//         this.CashflowService.getAdvisor().pipe(
//           map((advisor) => CashflowActions.loadCashflowSuccess({ advisor })),
//           catchError((error) => of(CashflowActions.loadCashflowFailure({ error: error.message })))
//         )
//       )
//     )
//   );
}
