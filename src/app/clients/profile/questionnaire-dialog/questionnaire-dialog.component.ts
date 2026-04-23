import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Client } from '../../models/client';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Subject, takeUntil } from 'rxjs';
import { QuestionnaireHttpService } from '../../services/questionnaire-http.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { MaterialModule } from 'src/app/material.module';
import { LanguageService } from 'src/app/core/language.service';
import { HttpErrorResponse } from '@angular/common/http';

export interface QuestionnaireItem {
  id: string;
  text: string;
  subtitle: string;
  selected: boolean;
}

@Component({
  selector: 'app-questionnaire-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    TranslateModule,
    RouterModule,
    TablerIconsModule,
    MaterialModule,
  ],
  templateUrl: './questionnaire-dialog.component.html',
  styleUrl: './questionnaire-dialog.component.scss',
})
export class QuestionnaireDialogComponent implements OnInit, OnDestroy {
  questions: QuestionnaireItem[] = [];
  clientName: string;
  isLoaderVisible = false;
  isCopying = false;
  isSending = false;
  hasProfilePicture = false;
  hasBio = false;
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<QuestionnaireDialogComponent>,
    private toastr: ToastrService,
    private translate: TranslateService,
    private questionnaireHttpService: QuestionnaireHttpService,
    private settingsService: SettingsService,
    private languageService: LanguageService,
    @Inject(MAT_DIALOG_DATA) public data: { client: Client },
  ) {
    this.clientName =
      data?.client?.clientDetails?.firstName &&
      data?.client?.clientDetails?.lastName
        ? `${data.client.clientDetails.firstName} ${data.client.clientDetails.lastName}`
        : 'Client';
  }

  ngOnInit(): void {
    this.loadQuestions();
    this.updateProfileStatus();
    this.settingsService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateProfileStatus());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateProfileStatus(): void {
    const profile = this.settingsService.currentUserData;
    this.hasProfilePicture = !!profile?.profilePhotoUrl?.trim();
    this.hasBio = !!profile?.bio?.trim();
  }

  loadQuestions(): void {
    this.isLoaderVisible = true;
    this.questionnaireHttpService.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions.map((q) => ({
          id: q.id,
          text: q.text,
          subtitle: q.subtitle,
          selected: true,
        }));
        this.isLoaderVisible = false;
      },
      error: (err) => {
        this.isLoaderVisible = false;
        this.toastr.error(this.translate.instant('ERROR.FAILED_LOAD_QUESTIONS'));
        console.error(err);
      },
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private get questionnaireLocale(): string {
    return this.languageService.current === 'it' ? 'it' : 'en';
  }

  onCopyLink(): void {
    const selectedIds = this.questions
      .filter((q) => q.selected)
      .map((q) => q.id);
    if (selectedIds.length === 0) {
      this.toastr.warning(this.translate.instant('ERROR.SELECT_QUESTION'));
      return;
    }

    const advisorId = this.data?.client?.financialAdvisor?.advisorId ?? '';
    if (!advisorId) {
      this.toastr.error(this.translate.instant('ERROR.UNABLE_IDENTIFY_ADVISOR'));
      return;
    }

    this.isCopying = true;
    this.questionnaireHttpService
      .createLink({
        clientId: this.data.client.id,
        advisorId,
        questionIds: selectedIds,
        locale: this.questionnaireLocale,
      })
      .subscribe({
        next: (response) => {
          const url = response.shareableUrl;
          navigator.clipboard
            .writeText(url)
            .then(() => {
              this.isCopying = false;
              this.toastr.success(this.translate.instant('TOAST.COPIED_TO_CLIPBOARD'));
              this.dialogRef.close();
            })
            .catch(() => {
              this.isCopying = false;
              this.toastr.info(
                this.translate.instant('TOAST.LINK_CREATED') + ' ' + url,
              );
              this.dialogRef.close();
            });
        },
        error: (err) => {
          this.isCopying = false;
          this.toastr.error(this.translate.instant('ERROR.FAILED_CREATE_LINK'));
          console.error(err);
        },
      });
  }

  onSendByEmail(): void {
    const selectedIds = this.questions
      .filter((q) => q.selected)
      .map((q) => q.id);
    if (selectedIds.length === 0) {
      this.toastr.warning(this.translate.instant('ERROR.SELECT_QUESTION'));
      return;
    }

    const advisorId = this.data?.client?.financialAdvisor?.advisorId ?? '';
    if (!advisorId) {
      this.toastr.error(this.translate.instant('ERROR.UNABLE_IDENTIFY_ADVISOR'));
      return;
    }

    const email = this.data?.client?.clientDetails?.email?.trim();
    if (!email) {
      this.toastr.error(this.translate.instant('ERROR.NO_CLIENT_EMAIL'));
      return;
    }

    this.isSending = true;
    this.questionnaireHttpService
      .sendToClient({
        clientId: this.data.client.id,
        advisorId,
        questionIds: selectedIds,
        locale: this.questionnaireLocale,
      })
      .subscribe({
        next: () => {
          this.isSending = false;
          this.toastr.success(
            this.translate.instant('TOAST.QUESTIONNAIRE_EMAIL_SENT', {
              email,
            }),
          );
          this.dialogRef.close(true);
        },
        error: (err: HttpErrorResponse) => {
          this.isSending = false;
          const code = this.parseQuestionnaireError(err);
          if (code === 'NO_CLIENT_EMAIL') {
            this.toastr.error(this.translate.instant('ERROR.NO_CLIENT_EMAIL'));
          } else if (code === 'EMAIL_SEND_FAILED') {
            this.toastr.error(
              this.translate.instant('ERROR.QUESTIONNAIRE_EMAIL_SEND_FAILED'),
            );
          } else {
            this.toastr.error(
              this.translate.instant('ERROR.QUESTIONNAIRE_SEND_FAILED'),
            );
          }
          console.error(err);
        },
      });
  }

  toggleQuestion(item: QuestionnaireItem): void {
    item.selected = !item.selected;
  }

  drop(event: CdkDragDrop<QuestionnaireItem[]>): void {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
  }

  private parseQuestionnaireError(error: HttpErrorResponse): string {
    const body = error?.error;
    if (typeof body === 'string') {
      const trimmed = body.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed) as { detail?: string };
          return parsed?.detail?.trim() ?? '';
        } catch {
          return trimmed;
        }
      }
      return trimmed.replace(/^"|"$/g, '');
    }
    if (body && typeof body === 'object' && 'detail' in body) {
      return String((body as { detail?: string }).detail ?? '').trim();
    }
    return '';
  }
}
