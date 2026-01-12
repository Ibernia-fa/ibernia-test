import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-plan-billing',
  standalone: true,
  imports: [TranslateModule, MatCard, MatCardContent],
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
