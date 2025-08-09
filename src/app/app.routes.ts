import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/clients',
        // redirectTo: '/dashboards/dashboard1',
        pathMatch: 'full',
        // canActivate:[AuthGuard]
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./clients/clients.routes').then((m) => m.ClientsRoutes),
        canActivate:[AuthGuard]
      },
      {
        path: 'cashflows',
        loadChildren: () =>
          import('./financial-workflow/financial-workflow.routes').then((m) => m.FinancialWorkflowRoutes),
        canActivate:[AuthGuard]
      }
    ],
        canActivate:[AuthGuard]
  },
  {
    path: '',
    component: BlankComponent,
    children: [
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
              { path: 'signin-oidc', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },

            { path: 'signout-callback-oidc', redirectTo: '' },
];
