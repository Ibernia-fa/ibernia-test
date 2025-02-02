import { Routes } from '@angular/router';
import { FinancialWorkflowDashboardComponent } from './financial-workflow-dashboard/financial-workflow-dashboard.component';


export const FinancialWorkflowRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id/timeline',
        component: FinancialWorkflowDashboardComponent,
        // data: {
        //   title: 'Clients',
          // urls: [
          //   { title: 'Dashboard', url: '/dashboards/dashboard1' },
          //   { title: 'Analytical' },
          // ],
        // },
      },
      // {
      //   path: 'add',
      //   component: ClientAddComponent,
      //   // data: {
      //   //   title: 'eCommerce',
      //   //   urls: [
      //   //     { title: 'Dashboard', url: '/dashboards/dashboard1' },
      //   //     { title: 'eCommerce' },
      //   //   ],
      //   // },
      // },
      // {
      //   path: ':id/edit',
      //   component: ClientEditComponent,
      // },
    ],
  },
];
