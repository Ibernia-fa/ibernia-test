import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, EMPTY } from 'rxjs';
import { catchError, filter, finalize, takeUntil } from 'rxjs/operators';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SettingsService, UserProfileDto } from 'src/app/default-preferance/services/default-preferance.http.service';
import { SystemPromptService } from './system-prompt.service';

const PROMPT_KEY = 'financial-advisor-prompt';

@Component({
  selector: 'app-ai-reccomendations',
  standalone: true,
  templateUrl: './ai-reccomendations.component.html',
  styleUrl: './ai-reccomendations.component.scss',
  imports: [
    MatCard,
    MatCardContent,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    FormsModule,
    TranslateModule,
  ],
})
export class AiReccomendationsComponent implements OnInit, OnDestroy {
  isAdmin = false;

  advisorGuidelines = '';
  isGuidelinesLoading = true;
  isGuidelinesSaving = false;
  private savedGuidelinesSnapshot = '';
  private userProfile: UserProfileDto | null = null;

  promptContent = '';
  isPromptLoading = true;
  isPromptSaving = false;
  private savedPromptSnapshot = '';

  private destroy$ = new Subject<void>();

  constructor(
    private navItemService: NavItemService,
    private authService: AuthService,
    private settingsService: SettingsService,
    private systemPromptService: SystemPromptService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  async ngOnInit(): Promise<void> {
    this.isAdmin =
      (await this.authService.hasRole('Administrator')) ||
      (await this.authService.hasRole('IberniaIdentityAdminAdministrator'));

    this.loadAdvisorGuidelines();

    if (this.isAdmin) {
      this.loadSystemPrompt();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasGuidelinesChanges(): boolean {
    return this.advisorGuidelines !== this.savedGuidelinesSnapshot;
  }

  get hasPromptChanges(): boolean {
    return this.promptContent !== this.savedPromptSnapshot;
  }

  loadAdvisorGuidelines(): void {
    this.isGuidelinesLoading = true;
    const user = this.authService.getUserProfile();
    if (!user?.sub) {
      this.isGuidelinesLoading = false;
      return;
    }

    this.settingsService.getUserProfileResponse(user.sub)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.toastr.error('Failed to load advisor guidelines', 'Error!');
          return EMPTY;
        }),
        finalize(() => {
          this.isGuidelinesLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res) => {
        const body = res?.body as UserProfileDto | null;
        if (body) {
          this.userProfile = body;
          this.advisorGuidelines = body.advisorGuidelines ?? '';
          this.savedGuidelinesSnapshot = this.advisorGuidelines;
        }
        this.cdr.markForCheck();
      });
  }

  saveAdvisorGuidelines(): void {
    if (!this.hasGuidelinesChanges || this.isGuidelinesSaving) return;

    this.isGuidelinesSaving = true;

    const payload: UserProfileDto = {
      ...this.userProfile!,
      advisorGuidelines: this.advisorGuidelines,
    };

    this.settingsService.updateUserProfile(payload)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? 'Failed to save guidelines';
          this.toastr.error(msg, 'Error!');
          return EMPTY;
        }),
        finalize(() => {
          this.isGuidelinesSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.savedGuidelinesSnapshot = this.advisorGuidelines;
        this.toastr.success('Guidelines saved', 'Success!');
        this.cdr.markForCheck();
      });
  }

  loadSystemPrompt(): void {
    this.isPromptLoading = true;
    this.systemPromptService
      .getPrompt(PROMPT_KEY)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.toastr.error('Failed to load system prompt', 'Error!');
          return EMPTY;
        }),
        finalize(() => {
          this.isPromptLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((response) => {
        this.promptContent = response.content ?? '';
        this.savedPromptSnapshot = this.promptContent;
        this.cdr.markForCheck();
      });
  }

  saveSystemPrompt(): void {
    if (!this.hasPromptChanges || this.isPromptSaving) return;

    this.isPromptSaving = true;
    this.systemPromptService
      .updatePrompt({ key: PROMPT_KEY, content: this.promptContent })
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? 'Failed to save system prompt';
          this.toastr.error(msg, 'Error!');
          return EMPTY;
        }),
        finalize(() => {
          this.isPromptSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.savedPromptSnapshot = this.promptContent;
        this.toastr.success('System prompt saved', 'Success!');
        this.cdr.markForCheck();
      });
  }
}
