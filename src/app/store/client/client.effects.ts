import { Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as ClientActions from './client.actions';
import { ClientHttpService } from 'src/app/clients/services/client-http.service';

@Injectable()
export class ClientEffects {
  constructor(
    private actions$: Actions,
    private clientHttpService: ClientHttpService
  ) {}

  loadClient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClientActions.loadClient),
      mergeMap((props: { clientId: string }) =>
        this.clientHttpService.getClient(props.clientId).pipe(
          map((client) => ClientActions.loadClientSuccess({ client })),
          catchError((error) =>
            of(ClientActions.loadClientFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
