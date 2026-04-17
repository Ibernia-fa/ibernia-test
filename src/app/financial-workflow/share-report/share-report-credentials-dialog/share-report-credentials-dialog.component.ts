import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

export interface ShareReportCredentialsDialogData {
  shareableUrl: string;
  password: string;
  fullCopyText: string;
}

@Component({
  selector: 'app-share-report-credentials-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './share-report-credentials-dialog.component.html',
  styleUrl: './share-report-credentials-dialog.component.scss',
})
export class ShareReportCredentialsDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ShareReportCredentialsDialogComponent>,
    private toastr: ToastrService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: ShareReportCredentialsDialogData,
  ) {}

  copyAll(): void {
    const text = this.data.fullCopyText?.trim() ?? '';
    if (!text) {
      this.dialogRef.close();
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastr.success(
          this.translate.instant('TOAST.COPIED_TO_CLIPBOARD'),
        );
        this.dialogRef.close();
      })
      .catch(() => {
        this.toastr.info(
          this.translate.instant('TOAST.LINK_CREATED') + ' ' + text,
        );
        this.dialogRef.close();
      });
  }
}
