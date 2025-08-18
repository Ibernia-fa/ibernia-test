import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsRoutingModule } from './setting-routing.module';
import { AccountPreferencesComponent } from './account-preferences/account-preferences.component';
import { PlanBillingComponent } from './plan-billing/plan-billing.component';
import { SecurityComponent } from './security/security.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { BrandingComponent } from './branding/branding.component';


@NgModule({
  declarations: [   
    PlanBillingComponent,
    SecurityComponent,
    NotificationsComponent,
    BrandingComponent,
    AccountPreferencesComponent,],
  imports: [
    CommonModule
, FormsModule, ReactiveFormsModule, SettingsRoutingModule
  ]
})
export class SettingsModule { }
