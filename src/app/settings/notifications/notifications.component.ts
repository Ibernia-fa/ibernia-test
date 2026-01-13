import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [TranslateModule, MatCard, MatCardContent, MatSlideToggle, FormsModule],
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
