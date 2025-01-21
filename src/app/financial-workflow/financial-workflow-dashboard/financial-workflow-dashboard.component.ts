import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-financial-workflow-dashboard',
  imports: [
    TablerIconsModule,
    MatCardModule
  ],
  templateUrl: './financial-workflow-dashboard.component.html',
  styleUrl: './financial-workflow-dashboard.component.scss'
})
export class FinancialWorkflowDashboardComponent {

}
