import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
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
    MatSliderModule,
    MatTooltipModule,
    FormsModule,
    ImageCropperComponent,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data.title || 'Crop profile photo') | translate }}</h2>
    <mat-dialog-content class="image-crop-dialog-content">
      <p class="crop-hint">{{ 'Drag the image to position it.' | translate }}</p>
      <div class="zoom-control">
        <label class="zoom-label">{{ 'Zoom' | translate }}</label>
        <mat-slider [min]="1" [max]="3" [step]="0.1" discrete>
          <input matSliderThumb [(ngModel)]="scale" (ngModelChange)="onZoomChange()">
        </mat-slider>
      </div>
      <div class="crop-container" [class.crop-container--company]="data.cropType === 'company'">
        <image-cropper
          [imageBase64]="data.imageBase64"
          [maintainAspectRatio]="true"
          [aspectRatio]="data.cropType === 'company' ? (4/3) : 1"
          [roundCropper]="data.cropType === 'profile'"
          [allowMoveImage]="true"
          [hideResizeSquares]="true"
          [cropperStaticWidth]="data.cropType === 'company' ? 400 : 300"
          [cropperStaticHeight]="data.cropType === 'company' ? 300 : 300"
          [transform]="transform"
          format="jpeg"
          output="base64"
          [resizeToWidth]="0"
          (imageCropped)="onImageCropped($event)"
          (loadImageFailed)="onLoadFailed()"
        ></image-cropper>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'Cancel' | translate }}</button>
      <button mat-flat-button color="primary" [disabled]="!croppedBase64" (click)="apply()" [matTooltip]="!croppedBase64 ? ('Drag the image to position it.' | translate) : ''">
        {{ 'Select' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .image-crop-dialog-content.mat-mdc-dialog-content {
      overflow-x: hidden !important;
      overflow-y: hidden !important;
    }
    .crop-hint {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
    }
    .zoom-control {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 0;
    }
    .zoom-label {
      font-size: 14px;
      min-width: 40px;
    }
    .zoom-control mat-slider {
      flex: 1;
    }
    .crop-container {
      min-height: 320px;
      max-height: 70vh;
      overflow: hidden;
      margin-top: 0;
    }
    /* Company logo: remove top spacing between zoom and image (ngx-image-cropper has padding: 5px) */
    .crop-container--company ::ng-deep image-cropper {
      padding: 0 !important;
    }
    .crop-container image-cropper {
      max-height: 60vh;
      overflow: hidden;
    }
    .crop-container ::ng-deep image-cropper,
    .crop-container ::ng-deep .ngx-ic-source-image,
    .crop-container ::ng-deep .ngx-ic-draggable {
      overflow: hidden !important;
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
  scale = 1;
  transform: ImageTransform = {};

  constructor(
    private dialogRef: MatDialogRef<ImageCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropDialogData,
  ) {}

  onImageCropped(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.croppedBase64 = event.base64;
    }
  }

  onZoomChange(): void {
    this.transform = { ...this.transform, scale: this.scale };
  }

  onLoadFailed(): void {
    this.dialogRef.close(null);
  }

  apply(): void {
    this.dialogRef.close(this.croppedBase64 ?? null);
  }
}
