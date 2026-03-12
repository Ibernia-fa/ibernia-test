import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list/client-list.component';
import { ProfileComponent } from './profile/profile.component';

export const ClientsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ClientListComponent,
      },
      {
        path: ':id/profile',
        component: ProfileComponent,
      },
    ],
  },
];
