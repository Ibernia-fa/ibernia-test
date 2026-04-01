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
  hasProfilePicture = false;
  hasBio = false;
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<QuestionnaireDialogComponent>,
    private toastr: ToastrService,
    private translate: TranslateService,
    private questionnaireHttpService: QuestionnaireHttpService,
    private settingsService: SettingsService,
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
      })
      .subscribe({
        next: (response) => {
          navigator.clipboard
            .writeText(response.shareableUrl)
            .then(() => {
              this.toastr.success(this.translate.instant('TOAST.LINK_COPIED'));
              this.dialogRef.close();
            })
            .catch(() => {
              this.toastr.info(
                this.translate.instant('TOAST.LINK_CREATED') + ' ' + response.shareableUrl,
              );
              this.dialogRef.close();
            });
          this.isCopying = false;
        },
        error: (err) => {
          this.isCopying = false;
          this.toastr.error(this.translate.instant('ERROR.FAILED_CREATE_LINK'));
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
}
