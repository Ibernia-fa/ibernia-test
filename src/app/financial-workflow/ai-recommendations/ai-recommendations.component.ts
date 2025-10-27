import { Component, OnInit } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { AiRecommendationsHttpService as AiRecommendationsHttpService } from './services/ai-recommendations-http.service';
import { AiRecommendationsModel as AiRecommendationsModel } from './models/ai-recommendations.model';

@Component({
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  styleUrl: './ai-recommendations.component.scss'
})

export class AiRecommendationsComponent implements OnInit {
  constructor(
    private aiRecommendationsHttpService: AiRecommendationsHttpService,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  ngOnInit(): void {
    
  }
}
