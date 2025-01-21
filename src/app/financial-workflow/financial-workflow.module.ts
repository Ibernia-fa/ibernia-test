import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialWorkflowRoutes } from './financial-workflow.routes';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(FinancialWorkflowRoutes),
    CommonModule
  ]
})
export class FinancialWorkflowModule { }
