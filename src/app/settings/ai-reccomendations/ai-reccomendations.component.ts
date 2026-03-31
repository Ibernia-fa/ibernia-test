import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
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
    FormsModule,
    TranslateModule,
  ],
})
export class AiReccomendationsComponent implements OnInit, OnDestroy {
  promptContent = '';
  isLoading = true;
  isSaving = false;

  private savedSnapshot = '';
  private destroy$ = new Subject<void>();

  constructor(
    private navItemService: NavItemService,
    private systemPromptService: SystemPromptService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.navItemService.currentRouteName = 'AI Recommendations';
  }

  ngOnInit(): void {
    this.loadPrompt();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasChanges(): boolean {
    return this.promptContent !== this.savedSnapshot;
  }

  loadPrompt(): void {
    this.isLoading = true;
    this.systemPromptService
      .getPrompt(PROMPT_KEY)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? 'Failed to load system prompt';
          this.toastr.error(msg, 'Error!');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((response) => {
        this.promptContent = response.content ?? '';
        this.savedSnapshot = this.promptContent;
        this.cdr.markForCheck();
      });
  }

  savePrompt(): void {
    if (!this.hasChanges || this.isSaving) return;

    this.isSaving = true;
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
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.savedSnapshot = this.promptContent;
        this.toastr.success('System prompt saved', 'Success!');
        this.cdr.markForCheck();
      });
  }
}
