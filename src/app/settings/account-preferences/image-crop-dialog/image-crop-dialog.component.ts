import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { TranslateModule } from '@ngx-translate/core';

export type CropType = 'profile' | 'company';

export interface ImageCropDialogData {
  imageBase64: string;
  /** 'profile' = circle, 'company' = rectangle. Controls shape and fixed dimensions. */
  cropType?: CropType;
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
          [maintainAspectRatio]="true"
          [aspectRatio]="data.cropType === 'company' ? (4/3) : 1"
          [roundCropper]="data.cropType === 'profile'"
          [allowMoveImage]="true"
          [hideResizeSquares]="true"
          [cropperStaticWidth]="data.cropType === 'company' ? 400 : 300"
          [cropperStaticHeight]="data.cropType === 'company' ? 300 : 300"
          format="png"
          output="base64"
          [resizeToWidth]="0"
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
      min-height: 320px;
      max-height: 70vh;
    }
    .crop-container image-cropper {
      max-height: 60vh;
      width: 100%;
    }
    /* Fix crop overlay in place - user moves image only, not the crop box */
    .crop-container ::ng-deep .ngx-ic-overlay,
    .crop-container ::ng-deep .ngx-ic-cropper {
      pointer-events: none;
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
