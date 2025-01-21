import { Routes } from '@angular/router';
import { ClientListComponent } from './client-list/client-list.component';
import { ClientAddComponent } from './client-add/client-add.component';
import { ClientEditComponent } from './client-edit/client-edit.component';
import { ProfileComponent } from './profile/profile.component';


export const ClientsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ClientListComponent,
        // data: {
        //   title: 'Clients',
          // urls: [
          //   { title: 'Dashboard', url: '/dashboards/dashboard1' },
          //   { title: 'Analytical' },
          // ],
        // },
      },
      {
        path: 'add',
        component: ClientAddComponent,
        // data: {
        //   title: 'eCommerce',
        //   urls: [
        //     { title: 'Dashboard', url: '/dashboards/dashboard1' },
        //     { title: 'eCommerce' },
        //   ],
        // },
      },
      {
        path: ':id/edit',
        component: ClientEditComponent,
      },
      {
        path: ':id/profile',
        component: ProfileComponent,
      },
    ],
  },
];
