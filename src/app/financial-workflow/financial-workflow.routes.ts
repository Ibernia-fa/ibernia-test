import { Routes } from '@angular/router';
import { FinancialWorkflowDashboardComponent } from './financial-workflow-dashboard/financial-workflow-dashboard.component';
import { TimelineComponent } from './timeline/timeline/timeline.component';
import { SavingPotsComponent } from './saving-pots/saving-pots.component';
import { IncomeExpensesComponent } from './income-expenses/income-expenses.component';
import { WithdrawalsContributionsComponent } from './withdrawals-contributions/withdrawals-contributions.component';
import { ReportsComponent } from './reports/reports.component';
import { EmergenciesComponent } from './emergencies/emergencies.component';

export const FinancialWorkflowRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id/timeline',
        component: TimelineComponent,
      },
      {
        path: ':id/finances',
        component: SavingPotsComponent,
      },
      {
        path: ':id/income',
        component: IncomeExpensesComponent,
      },
      {
        path: ':id/withdrawal',
        component: WithdrawalsContributionsComponent,
      },
      {
        path: ':id/reports',
        component: ReportsComponent,
      },
      {
        path: ':id/emergencies',
        component: EmergenciesComponent,
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
