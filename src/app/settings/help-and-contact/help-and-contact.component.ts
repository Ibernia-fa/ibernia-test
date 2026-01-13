import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-help-and-contact',
  imports: [TranslateModule, MatCard, MatCardContent, MatAccordion, MatExpansionPanel, MatExpansionPanelHeader],
  standalone: true,
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
