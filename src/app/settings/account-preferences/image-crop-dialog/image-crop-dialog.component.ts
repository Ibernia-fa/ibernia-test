import {
  ChangeDetectorRef,
  Component,
  Inject,
  ViewChild,
} from '@angular/core';
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
  /** Pan/zoom from last session (same source image) — reopen without resetting the editor. */
  initialTransform?: ImageTransform;
}

/** Returned on Select so parent can keep preview/save aligned with the cropper and restore state. */
export interface ImageCropDialogResult {
  croppedBase64: string;
  transform: ImageTransform;
}

function normalizeTransform(t?: ImageTransform): ImageTransform {
  return {
    translateUnit: 'px',
    scale: t?.scale ?? 1,
    translateH: t?.translateH ?? 0,
    translateV: t?.translateV ?? 0,
    rotate: t?.rotate,
    flipH: t?.flipH,
    flipV: t?.flipV,
  };
}

/**
 * Crop frame = viewport: static cropper size must match the visible box so the mask
 * sits on the model edges (not a smaller shape centered in empty space).
 */
const PROFILE_VIEWPORT_PX = 300;
const COMPANY_CROP_W = 400;
const COMPANY_CROP_H = 300;

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
        <mat-slider [min]="1" [max]="2.5" [step]="0.05">
          <input matSliderThumb [(ngModel)]="scale" (ngModelChange)="onZoomChange()">
        </mat-slider>
      </div>
      <div
        class="crop-container"
        [class.crop-container--profile]="data.cropType !== 'company'"
        [class.crop-container--company]="data.cropType === 'company'"
      >
        <image-cropper
          #cropper
          [imageBase64]="data.imageBase64"
          [maintainAspectRatio]="true"
          [containWithinAspectRatio]="true"
          [aspectRatio]="data.cropType === 'company' ? (4/3) : 1"
          [roundCropper]="data.cropType === 'profile'"
          [allowMoveImage]="true"
          [hideResizeSquares]="true"
          [cropperStaticWidth]="data.cropType === 'company' ? companyCropW : profileCropPx"
          [cropperStaticHeight]="data.cropType === 'company' ? companyCropH : profileCropPx"
          [transform]="transform"
          format="jpeg"
          output="base64"
          [resizeToWidth]="0"
          (imageCropped)="onImageCropped($event)"
          (transformChange)="onTransformChange($event)"
          (cropperReady)="onCropperReady()"
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
      margin: 0 auto;
      overflow: hidden;
      flex-shrink: 0;
    }
    .crop-container--profile {
      width: min(${PROFILE_VIEWPORT_PX}px, 85vw);
      aspect-ratio: 1;
      height: auto;
    }
    .crop-container--company {
      width: min(${COMPANY_CROP_W}px, 92vw);
      aspect-ratio: 4 / 3;
      height: auto;
    }
    .crop-container ::ng-deep image-cropper {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-height: none !important;
      padding: 0 !important;
      box-sizing: border-box;
    }
    .crop-container ::ng-deep image-cropper > div {
      width: 100%;
      height: 100%;
    }
    /*
     * Do NOT set object-fit / forced 100% width+height on .ngx-ic-source-image: the crop canvas
     * math assumes the same layout ngx computes; CSS letterboxing breaks preview vs export.
     * containWithinAspectRatio pads the bitmap inside ngx so display and crop() stay aligned.
     */
    .crop-container ::ng-deep .ngx-ic-overlay {
      box-sizing: border-box;
    }
    .crop-container ::ng-deep .ngx-ic-draggable {
      touch-action: none;
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
  @ViewChild('cropper') cropperRef?: ImageCropperComponent;

  croppedBase64: string | null = null;
  scale = 1;
  /** Pixel translation: default % in ngx-image-cropper makes drags feel wildly oversensitive. */
  transform: ImageTransform = normalizeTransform();

  readonly profileCropPx = PROFILE_VIEWPORT_PX;
  readonly companyCropW = COMPANY_CROP_W;
  readonly companyCropH = COMPANY_CROP_H;

  constructor(
    private dialogRef: MatDialogRef<ImageCropDialogComponent, ImageCropDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropDialogData,
    private cdr: ChangeDetectorRef,
  ) {
    if (data.initialTransform) {
      this.transform = normalizeTransform(data.initialTransform);
      this.scale = this.transform.scale ?? 1;
    }
  }

  onImageCropped(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.croppedBase64 = event.base64;
    }
  }

  onTransformChange(t: ImageTransform): void {
    this.transform = normalizeTransform(t);
    const s = t.scale;
    if (s != null && Math.abs(s - this.scale) > 0.001) {
      this.scale = s;
    }
  }

  onZoomChange(): void {
    this.transform = normalizeTransform({ ...this.transform, scale: this.scale });
  }

  /** Re-sync transform after layout when reopening so ngx applies pan/zoom to the loaded image. */
  onCropperReady(): void {
    if (!this.data.initialTransform) {
      return;
    }
    this.transform = normalizeTransform(this.transform);
  }

  onLoadFailed(): void {
    this.dialogRef.close(null);
  }

  apply(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      const latest = this.cropperRef?.crop('base64');
      const raw = latest?.base64 ?? this.croppedBase64;
      if (!raw) {
        return;
      }
      const croppedBase64 = raw.startsWith('data:') ? raw : `data:image/jpeg;base64,${raw}`;
      this.dialogRef.close({
        croppedBase64,
        transform: normalizeTransform(this.transform),
      });
    });
  }
}
