import { Routes } from '@angular/router';
import { FinancialWorkflowDashboardComponent } from './financial-workflow-dashboard/financial-workflow-dashboard.component';
import { TimelineComponent } from './timeline/timeline/timeline.component';


export const FinancialWorkflowRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id/timeline',
        component: TimelineComponent,
      },
      {
        path: 'finances',
        component: FinancialWorkflowDashboardComponent,
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
