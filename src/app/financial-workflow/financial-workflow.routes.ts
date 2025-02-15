import { Routes } from '@angular/router';
import { FinancialWorkflowDashboardComponent } from './financial-workflow-dashboard/financial-workflow-dashboard.component';
import { TimelineComponent } from './timeline/timeline/timeline.component';
import { SavingPotsComponent } from './saving-pots/saving-pots.component';


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
        component: SavingPotsComponent,
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
