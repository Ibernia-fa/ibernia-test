import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-ai-reccomendations',
  standalone: true,
  templateUrl: './ai-reccomendations.component.html',
  styleUrl: './ai-reccomendations.component.scss',
  imports: [MatCard, MatCardContent, TranslateModule]
})
export class AiReccomendationsComponent {
  constructor(
      private navItemService: NavItemService,
    ) {
      this.navItemService.currentRouteName = 'AI Recommendations';
    }
    selectedPlan: string = 'enterprise'; // or bind this from radio buttons
companyContext: string = '';
}
