import { Routes } from '@angular/router';
import { TimelineComponent } from './timeline/timeline/timeline.component';
import { SavingPotsComponent } from './saving-pots/saving-pots.component';
import { IncomeExpensesComponent } from './income-expenses/income-expenses.component';
import { WithdrawalsContributionsComponent } from './withdrawals-contributions/withdrawals-contributions.component';
import { ReportsComponent } from './reports/reports.component';
import { ScenarioLabComponent } from './reports/scenario-lab/scenario-lab.component';
import { EmergenciesComponent } from './emergencies/emergencies.component';
import { WealthComponent } from './wealth/wealth.component';
import { AiRecommendationsComponent } from './ai-recommendations/ai-recommendations.component';
import { AgentChatComponent } from './agent-chat/agent-chat.component';
import { CashflowResolver } from './resolvers/cashflow.resolver';
import { CashflowLayoutComponent } from './cashflow-layout/cashflow-layout.component';
import { SchoolComponent } from './school/school.component';
import { redirectHiddenCashflowModuleGuard } from './guards/hidden-cashflow-modules.guard';

export const FinancialWorkflowRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id',
        component: CashflowLayoutComponent,
        resolve: { cashflow: CashflowResolver },
        children: [
          { path: 'timeline', component: TimelineComponent },
          { path: 'finances', component: SavingPotsComponent },
          { path: 'income', component: IncomeExpensesComponent },
          { path: 'withdrawal', component: WithdrawalsContributionsComponent },
          { path: 'reports', component: ReportsComponent },
          { path: 'scenario-lab', component: ScenarioLabComponent },
          { path: 'emergencies', component: EmergenciesComponent },
          { path: 'wealth', component: WealthComponent },
          { path: 'ai-recommendations', component: AiRecommendationsComponent },
          {
            path: 'school',
            canActivate: [redirectHiddenCashflowModuleGuard],
            component: SchoolComponent,
          },
          {
            path: 'agent-chat',
            canActivate: [redirectHiddenCashflowModuleGuard],
            component: AgentChatComponent,
          },
        ],
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
