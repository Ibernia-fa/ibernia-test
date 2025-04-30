import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';

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
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./clients/clients.routes').then((m) => m.ClientsRoutes),
      },
      {
        path: 'cashflows',
        loadChildren: () =>
          import('./financial-workflow/financial-workflow.routes').then((m) => m.FinancialWorkflowRoutes),
      }
    ],
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
];
