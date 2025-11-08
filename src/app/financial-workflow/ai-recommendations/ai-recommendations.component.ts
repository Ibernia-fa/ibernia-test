import { Component, OnInit } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { AiRecommendationsHttpService as AiRecommendationsHttpService } from './services/ai-recommendations-http.service';
import { AiRecommendationsModel as AiRecommendationsModel } from './models/ai-recommendations.model';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({

 imports: [CommonModule, MatCardModule,MatTooltipModule], 
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
    standalone: true,  
  styleUrl: './ai-recommendations.component.scss'
})

export class AiRecommendationsComponent implements OnInit {
  public isReccShown: any;
  constructor(
    private aiRecommendationsHttpService: AiRecommendationsHttpService,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  onClickShow(){
    this.isReccShown = true;
  }

  ngOnInit(): void {
    
  }
}
