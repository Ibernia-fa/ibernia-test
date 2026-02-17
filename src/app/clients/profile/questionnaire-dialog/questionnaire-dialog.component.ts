import { Component, Inject } from '@angular/core';
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
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

export interface QuestionnaireItem {
  id: string;
  text: string;
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
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    TranslateModule,
  ],
  templateUrl: './questionnaire-dialog.component.html',
  styleUrl: './questionnaire-dialog.component.scss',
})
export class QuestionnaireDialogComponent {
  questions: QuestionnaireItem[] = [
    { id: '1', text: 'The important people in your life', selected: true },
    { id: '2', text: 'Your short and long term goals', selected: true },
    {
      id: '3',
      text: 'Which range best describes your investable assets today?',
      selected: true,
    },
    {
      id: '4',
      text: 'How would you define your investment approach?',
      selected: true,
    },
    { id: '5', text: 'Which areas worry you most today?', selected: true },
    {
      id: '6',
      text: 'What would you improve in your current financial planning?',
      selected: true,
    },
  ];

  clientName: string;

  constructor(
    private dialogRef: MatDialogRef<QuestionnaireDialogComponent>,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: { client: Client }
  ) {
    this.clientName =
      data?.client?.clientDetails?.firstName && data?.client?.clientDetails?.lastName
        ? `${data.client.clientDetails.firstName} ${data.client.clientDetails.lastName}`
        : 'Client';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCopyLink(): void {
    this.toastr.success('Link copied!');
    this.dialogRef.close();
  }

  toggleQuestion(item: QuestionnaireItem): void {
    item.selected = !item.selected;
  }

  drop(event: CdkDragDrop<QuestionnaireItem[]>): void {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
  }
}
