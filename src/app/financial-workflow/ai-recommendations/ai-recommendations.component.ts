import { Component, OnInit } from '@angular/core';
import { combineLatest, filter, map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { AiRecommendationsHttpService as AiRecommendationsHttpService } from './services/ai-recommendations-http.service';
import { AiRecommendationsModel as AiRecommendationsModel } from './models/ai-recommendations.model';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';

@Component({

 imports: [CommonModule, MatCardModule,MatTooltipModule], 
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
    standalone: true,  
  styleUrl: './ai-recommendations.component.scss'
})

export class AiRecommendationsComponent implements OnInit {
  public isReccShown: any;
  // public userData: any;
    private destroy$ = new Subject<void>();
  public userData: any;

  constructor(
    private aiRecommendationsHttpService: AiRecommendationsHttpService,
    private navItemService: NavItemService,
    private settingService: SettingsService
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  onClickShow(){
    this.isReccShown = true;
  }

  ngOnInit(): void {
    this.settingService.userData$
      .pipe(
        filter((v): v is NonNullable<typeof v> => v != null), // skip initial null
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        console.log('userData arrived', data);
        this.userData = data;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  }

