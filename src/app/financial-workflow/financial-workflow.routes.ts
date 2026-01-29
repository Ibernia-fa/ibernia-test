import { Routes } from '@angular/router';
import { FinancialWorkflowDashboardComponent } from './financial-workflow-dashboard/financial-workflow-dashboard.component';
import { TimelineComponent } from './timeline/timeline/timeline.component';
import { SavingPotsComponent } from './saving-pots/saving-pots.component';
import { IncomeExpensesComponent } from './income-expenses/income-expenses.component';
import { WithdrawalsContributionsComponent } from './withdrawals-contributions/withdrawals-contributions.component';
import { ReportsComponent } from './reports/reports.component';
import { EmergenciesComponent } from './emergencies/emergencies.component';
import { AiRecommendationsComponent } from './ai-recommendations/ai-recommendations.component';
import { CashflowResolver } from './resolvers/cashflow.resolver';

export const FinancialWorkflowRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id/timeline',
        component: TimelineComponent,
        resolve: { cashflow: CashflowResolver },
      },
      {
        path: ':id/finances',
        component: SavingPotsComponent,
        resolve: { cashflow: CashflowResolver },
      },
      {
        path: ':id/income',
        component: IncomeExpensesComponent,
        resolve: { cashflow: CashflowResolver },
      },
      {
        path: ':id/withdrawal',
        component: WithdrawalsContributionsComponent,
        resolve: { cashflow: CashflowResolver },
      },
      {
        path: ':id/reports',
        component: ReportsComponent,
        resolve: { cashflow: CashflowResolver },
      },
      {
        path: ':id/emergencies',
        component: EmergenciesComponent,
        resolve: { cashflow: CashflowResolver },
      },
      {
        path: ':id/ai-recommendations',
        component: AiRecommendationsComponent,
        resolve: { cashflow: CashflowResolver },
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
