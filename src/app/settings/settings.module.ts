import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsRoutingModule } from './setting-routing.module';
import { AccountPreferencesComponent } from './account-preferences/account-preferences.component';
import { PlanBillingComponent } from './plan-billing/plan-billing.component';
import { SecurityComponent } from './security/security.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { BrandingComponent } from './branding/branding.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; // ✅ This is required
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MaterialModule } from '../material.module';



@NgModule({
  declarations: [   
    PlanBillingComponent,
    SecurityComponent,
    NotificationsComponent,
    BrandingComponent,
    AccountPreferencesComponent,],
  imports: [
    MaterialModule,
    CommonModule, MatOptionModule,
     FormsModule, ReactiveFormsModule,MatCardModule,MatCheckboxModule, SettingsRoutingModule,MatFormFieldModule,MatInputModule,MatButtonModule,MatIconModule
  ]
})
export class SettingsModule { }
