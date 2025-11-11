import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientReportRoutes } from './client-report.routes';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(ClientReportRoutes),
    CommonModule
  ]
})
export class ClientReportModule { }
