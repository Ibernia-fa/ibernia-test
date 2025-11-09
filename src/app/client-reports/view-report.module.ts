import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewReportRoutes } from './view-report.routes';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(ViewReportRoutes),
    CommonModule
  ]
})
export class ViewReportModule { }
