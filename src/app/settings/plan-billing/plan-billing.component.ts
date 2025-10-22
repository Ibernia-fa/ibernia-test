import { Component } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-plan-billing',
  standalone: false,
  
  templateUrl: './plan-billing.component.html',
  styleUrl: './plan-billing.component.scss'
})
export class PlanBillingComponent {
  constructor(
      private navItemService: NavItemService,
    ) {
      this.navItemService.currentRouteName = 'Plans & Billing';
    }
}
