import { Routes } from '@angular/router';
import { ViewReportComponent } from './view-report.component';

export const ViewReportRoutes: Routes = [
  {
    path: 'view/report/:token',
    component: ViewReportComponent
  }
];
