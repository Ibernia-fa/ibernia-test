import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, Subject, takeUntil } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { AiRecommendationsHttpService } from './services/ai-recommendations-http.service';
import { PlanAnalysisResponse } from './models/ai-recommendations.model';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { Store } from '@ngrx/store';
import { Client } from 'src/app/clients/models/client';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ClientHttpService } from 'src/app/clients/services/client-http.service';
import { environment } from 'src/environments/environment';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
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

  public usageUsed = 0;
  public usageLimit = 5;
  public clientNotes = '';
  public advisorGuidelines = '';
  public readonly termsUrl = `${environment.authority}/terms-and-conditions`;

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
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private clientHttpService: ClientHttpService
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  loadUsage(): void {
    this.aiRecommendationsHttpService.getUsage().pipe(takeUntil(this.destroy$)).subscribe({
      next: (u) => {
        this.usageUsed = u.used;
        this.usageLimit = u.limit;
      },
      error: () => {}
    });
  }

  onClickShow(): void {
    this.cashflowId = this.activatedRoute.snapshot.params['id'];

    if (!this.cashflowId) {
      this.errorMessage = 'Unable to determine the cashflow. Please try again.';
      return;
    }

    if (this.usageUsed >= this.usageLimit) {
      this.errorMessage = `Daily limit reached (${this.usageUsed}/${this.usageLimit}). Try again tomorrow.`;
      return;
    }

    this.isLoading = true;
    this.isReccShown = false;
    this.errorMessage = null;
    this.analysis = null;

    this.aiRecommendationsHttpService.analyzePlan({
      cashflowId: this.cashflowId,
      advisorGuidelines: this.advisorGuidelines || null,
      clientNotes: this.clientNotes || null
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.analysis = data;
        this.isReccShown = true;
        this.isLoading = false;
        this.loadUsage();
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.status === 429) {
          this.usageUsed = err?.error?.used ?? this.usageUsed;
          this.usageLimit = err?.error?.limit ?? this.usageLimit;
          this.errorMessage = `Daily limit reached (${this.usageUsed}/${this.usageLimit}). Try again tomorrow.`;
        } else {
          this.errorMessage = 'Failed to generate recommendations. Please try again.';
        }
      }
    });
  }

  ngOnInit(): void {
    this.cashflowId = this.activatedRoute.snapshot.params['id'];
    this.loadUsage();

    this.client$ = this.store.select(selectedClient);
    this.client$.pipe(takeUntil(this.destroy$)).subscribe(client => {
      if (client) {
        this.clientName = client.clientDetails?.firstName + ' ' + client.clientDetails?.lastName;
        this.clientNotes = client.notes ?? '';
      }
    });

    this.settingService.userData$
      .pipe(
        filter((v): v is NonNullable<typeof v> => v != null),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.userData = data;
        this.advisorGuidelines = (data as { advisorGuidelines?: string })?.advisorGuidelines ?? '';
      });

    if (this.cashflowId) {
      this.clientHttpService.getClientByCashflowId(this.cashflowId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (client) => {
          this.clientName = client?.clientDetails?.firstName + ' ' + (client?.clientDetails?.lastName ?? '');
          this.clientNotes = client?.notes ?? '';
        },
        error: () => {}
      });
    }

    const user = this.authService.getUserProfile();
    if (user?.sub) {
      this.settingService.getUserProfileResponse(user.sub).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          const body = res?.body;
          if (body && (body as { advisorGuidelines?: string }).advisorGuidelines != null) {
            this.advisorGuidelines = (body as { advisorGuidelines: string }).advisorGuidelines ?? '';
          }
        },
        error: () => {}
      });
    }
  }

  onFeedback(rating: number): void {
    if (!this.analysis?.providerName || !this.cashflowId) return;
    const value = rating === 1 ? 5 : 0;
    this.aiRecommendationsHttpService.submitFeedback(this.cashflowId, this.analysis.providerName, value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => {}, error: () => {} });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
