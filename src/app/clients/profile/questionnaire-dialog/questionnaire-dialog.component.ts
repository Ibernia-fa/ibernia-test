import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { TranslateModule } from '@ngx-translate/core';
import { QuestionnaireHttpService } from '../../services/questionnaire-http.service';

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
  ],
  templateUrl: './questionnaire-dialog.component.html',
  styleUrl: './questionnaire-dialog.component.scss',
})
export class QuestionnaireDialogComponent implements OnInit {
  questions: QuestionnaireItem[] = [];
  clientName: string;
  isLoaderVisible = false;
  isCopying = false;

  constructor(
    private dialogRef: MatDialogRef<QuestionnaireDialogComponent>,
    private toastr: ToastrService,
    private questionnaireHttpService: QuestionnaireHttpService,
    @Inject(MAT_DIALOG_DATA) public data: { client: Client }
  ) {
    this.clientName =
      data?.client?.clientDetails?.firstName && data?.client?.clientDetails?.lastName
        ? `${data.client.clientDetails.firstName} ${data.client.clientDetails.lastName}`
        : 'Client';
  }

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.isLoaderVisible = true;
    this.questionnaireHttpService.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions.map((q) => ({ id: q.id, text: q.text, subtitle: q.subtitle, selected: true }));
        this.isLoaderVisible = false;
      },
      error: (err) => {
        this.isLoaderVisible = false;
        this.toastr.error('Failed to load questions. Please try again.');
        console.error(err);
      },
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCopyLink(): void {
    const selectedIds = this.questions.filter((q) => q.selected).map((q) => q.id);
    if (selectedIds.length === 0) {
      this.toastr.warning('Please select at least one question.');
      return;
    }

    const advisorId = this.data?.client?.financialAdvisor?.advisorId ?? '';
    if (!advisorId) {
      this.toastr.error('Unable to identify advisor.');
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
          navigator.clipboard.writeText(response.shareableUrl).then(() => {
            this.toastr.success('Link copied!');
            this.dialogRef.close();
          }).catch(() => {
            this.toastr.info('Link created. Share this URL: ' + response.shareableUrl);
            this.dialogRef.close();
          });
          this.isCopying = false;
        },
        error: (err) => {
          this.isCopying = false;
          this.toastr.error('Failed to create link. Please try again.');
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
