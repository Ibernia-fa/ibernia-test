// settings/settings-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrandingComponent } from './branding/branding.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SecurityComponent } from './security/security.component';
import { PlanBillingComponent } from './plan-billing/plan-billing.component';
import { AccountPreferencesComponent } from './account-preferences/account-preferences.component';
import { HelpAndContactComponent } from './help-and-contact/help-and-contact.component';
import { AiReccomendationsComponent } from './ai-reccomendations/ai-reccomendations.component';


const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'account-preferences' },
  { path: 'account-preferences', component: AccountPreferencesComponent, data: { showSidebar: true } },
  { path: 'plan-billing', component: PlanBillingComponent, data: { showSidebar: true } },
  { path: 'security', component: SecurityComponent, data: { showSidebar: true } },
  { path: 'notifications', component: NotificationsComponent, data: { showSidebar: true } },
  { path: 'branding', component: BrandingComponent, data: { showSidebar: true } },
  { path: 'help', component: HelpAndContactComponent, data: { showSidebar: true } },
  { path: 'ai-reccomendations', component: AiReccomendationsComponent, data: { showSidebar: true } },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
