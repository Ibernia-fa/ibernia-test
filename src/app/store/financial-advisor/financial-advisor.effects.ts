import { Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as FinancialAdvisorActions from './financial-advisor.actions';
// import { FinancialAdvisorService } from '../services/financial-advisor.service';

@Injectable()
export class FinancialAdvisorEffects {
  constructor(private actions$: Actions, 
    // private financialAdvisorService: FinancialAdvisorService
) {}

//   loadFinancialAdvisor$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(FinancialAdvisorActions.loadFinancialAdvisor),
//       mergeMap(() =>
//         this.financialAdvisorService.getAdvisor().pipe(
//           map((advisor) => FinancialAdvisorActions.loadFinancialAdvisorSuccess({ advisor })),
//           catchError((error) => of(FinancialAdvisorActions.loadFinancialAdvisorFailure({ error: error.message })))
//         )
//       )
//     )
//   );
}
