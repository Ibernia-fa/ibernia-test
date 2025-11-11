import { Routes } from '@angular/router';
import { ClientReportComponent } from './client-report.component';

export const ClientReportRoutes: Routes = [
  {
    path: 'report/:token',
    component: ClientReportComponent
  }
];