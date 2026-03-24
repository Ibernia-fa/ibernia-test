// settings/settings-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrandingComponent } from './branding/branding.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { AdminGuard } from './admin-notifications/admin-guard.service';
import { AdminNotificationsContainerComponent } from './admin-notifications/admin-notifications-container.component';
import { SecurityComponent } from './security/security.component';
import { PlanBillingComponent } from './plan-billing/plan-billing.component';
import { AccountPreferencesComponent } from './account-preferences/account-preferences.component';
import { HelpAndContactComponent } from './help-and-contact/help-and-contact.component';
import { AiReccomendationsComponent } from './ai-reccomendations/ai-reccomendations.component';


const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'account-preferences' },
  { path: 'account-preferences',  loadComponent: () =>
    import('./account-preferences/account-preferences.component')
      .then(m => m.AccountPreferencesComponent), data: { showSidebar: true } },
  { path: 'default-assumptions', loadComponent: () =>
    import('./default-assumptions/default-assumptions.component')
      .then(m => m.DefaultAssumptionsComponent), data: { showSidebar: true } },
  { path: 'plan-billing', loadComponent: () =>
    import('./plan-billing/plan-billing.component')
      .then(m => m.PlanBillingComponent), data: { showSidebar: true } },
  { path: 'security', loadComponent: () =>
    import('./security/security.component')
      .then(m => m.SecurityComponent), data: { showSidebar: true } },
  { path: 'notifications', loadComponent: () =>
    import('./notifications/notifications.component')
      .then(m => m.NotificationsComponent), data: { showSidebar: true } },
  { path: 'admin-notifications', component: AdminNotificationsContainerComponent, canActivate: [AdminGuard], data: { showSidebar: true }, children: [
    { path: '', loadComponent: () => import('./admin-notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent) },
    { path: 'create', loadComponent: () => import('./admin-notifications/notification-form.component').then(m => m.NotificationFormComponent) },
    { path: 'detail/:id', loadComponent: () => import('./admin-notifications/notification-detail.component').then(m => m.NotificationDetailComponent) },
  ]},
  { path: 'branding', loadComponent: () =>
    import('./branding/branding.component')
      .then(m => m.BrandingComponent), data: { showSidebar: true } },
  { path: 'help', loadComponent: () =>
    import('./help-and-contact/help-and-contact.component')
      .then(m => m.HelpAndContactComponent), data: { showSidebar: true } },
  { path: 'ai-reccomendations', loadComponent: () =>
    import('./ai-reccomendations/ai-reccomendations.component')
      .then(m => m.AiReccomendationsComponent), data: { showSidebar: true } },
  { path: 'privacy-data', loadComponent: () =>
    import('./privacy-data/privacy-data.component')
      .then(m => m.PrivacyDataComponent), data: { showSidebar: true } },
];

@NgModule({
  imports: [RouterModule.forChild(routes), AdminNotificationsContainerComponent],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
