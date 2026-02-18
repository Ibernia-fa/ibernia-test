import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, Subject, takeUntil } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { AiRecommendationsHttpService } from './services/ai-recommendations-http.service';
import { PlanAnalysisResponse } from './models/ai-recommendations.model';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { Store } from '@ngrx/store';
import { Client } from 'src/app/clients/models/client';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  imports: [CommonModule, MatCardModule, MatTooltipModule, MatProgressSpinnerModule],
  selector: 'app-ai-recommendations',
  templateUrl: './ai-recommendations.component.html',
  standalone: true,
  styleUrl: './ai-recommendations.component.scss'
})
export class AiRecommendationsComponent implements OnInit, OnDestroy {
  public isReccShown = false;
  public isLoading = false;
  public errorMessage: string | null = null;
  public analysis: PlanAnalysisResponse | null = null;

  public userData: any;
  client$: Observable<Client | null>;
  clientName: string;

  private cashflowId: string;
  private destroy$ = new Subject<void>();

  constructor(
    private aiRecommendationsHttpService: AiRecommendationsHttpService,
    private navItemService: NavItemService,
    private settingService: SettingsService,
    private store: Store,
    private activatedRoute: ActivatedRoute
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  onClickShow(): void {
    this.cashflowId = this.activatedRoute.snapshot.params['id'];

    if (!this.cashflowId) {
      this.errorMessage = 'Unable to determine the cashflow. Please try again.';
      return;
    }

    this.isLoading = true;
    this.isReccShown = false;
    this.errorMessage = null;
    this.analysis = null;

    this.aiRecommendationsHttpService.analyzePlan(this.cashflowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analysis = data;
          this.isReccShown = true;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to generate recommendations. Please try again.';
          this.isLoading = false;
        }
      });
  }

  ngOnInit(): void {
    this.client$ = this.store.select(selectedClient);
    this.client$.pipe(takeUntil(this.destroy$)).subscribe(client => {
      if (client) {
        this.clientName = client.clientDetails?.firstName + ' ' + client.clientDetails?.lastName;
      }
    });

    this.settingService.userData$
      .pipe(
        filter((v): v is NonNullable<typeof v> => v != null),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.userData = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
