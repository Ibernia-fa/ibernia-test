import { Component } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-notifications',
  standalone: false,
  
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {

  constructor(
      private navItemService: NavItemService,
    ) {
      this.navItemService.currentRouteName = 'Notifications';
    }
  toggleStatus = true; // default ON
  toggleStatus1 = true; // default ON
  toggleStatus2 = true; // default ON
  toggleStatus3 = true; // default ON
}
