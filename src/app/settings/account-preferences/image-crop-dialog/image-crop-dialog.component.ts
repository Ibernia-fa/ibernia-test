import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { TranslateModule } from '@ngx-translate/core';

export interface ImageCropDialogData {
  imageBase64: string;
  /** When false, allows free rectangular crop to fit image dimensions. Default true for profile. */
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  title?: string;
}

@Component({
  selector: 'app-image-crop-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    ImageCropperComponent,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data.title || 'Crop profile photo') | translate }}</h2>
    <mat-dialog-content>
      <div class="crop-container">
        <image-cropper
          [imageBase64]="data.imageBase64"
          [maintainAspectRatio]="data.maintainAspectRatio ?? false"
          [aspectRatio]="data.aspectRatio ?? 1"
          format="png"
          output="base64"
          [resizeToWidth]="0"
          [roundCropper]="false"
          (imageCropped)="onImageCropped($event)"
          (loadImageFailed)="onLoadFailed()"
        ></image-cropper>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'Cancel' | translate }}</button>
      <button mat-flat-button color="primary" [disabled]="!croppedBase64" (click)="apply()">
        {{ 'Apply' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .crop-container {
      min-height: 300px;
      max-height: 70vh;
    }
    .crop-container image-cropper {
      max-height: 60vh;
    }
  `],
})
export class ImageCropDialogComponent {
  croppedBase64: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<ImageCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropDialogData,
  ) {}

  onImageCropped(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.croppedBase64 = event.base64;
    }
  }

  onLoadFailed(): void {
    this.dialogRef.close(null);
  }

  apply(): void {
    this.dialogRef.close(this.croppedBase64 ?? null);
  }
}
