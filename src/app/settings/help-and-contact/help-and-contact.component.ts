import { Component } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-help-and-contact',
  // imports: [],
  standalone: false,

  templateUrl: './help-and-contact.component.html',
  styleUrl: './help-and-contact.component.scss'
})
export class HelpAndContactComponent {
  constructor(
      private navItemService: NavItemService,
    ) {
      this.navItemService.currentRouteName = 'Help & Contact';
    }
}
