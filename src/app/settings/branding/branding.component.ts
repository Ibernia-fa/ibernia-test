import { Component, OnInit } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { OrganizationProfilesService } from '../services/organization.profiles.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import {
  ImageCropDialogComponent,
  ImageCropDialogResult,
} from '../account-preferences/image-crop-dialog/image-crop-dialog.component';
import type { ImageTransform } from 'ngx-image-cropper';
import {
  isAllowedFileType,
  isWithinSizeLimit,
  fileToDataUrl,
  getImageDimensions,
  resizeImageToMin,
  compressImage,
  compressForProfilePayload,
  BACKGROUND_MIN_WIDTH,
  BACKGROUND_MIN_HEIGHT,
} from 'src/app/shared/utils/image-upload.utils';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [TranslateModule, MatCard, MatCardContent, NgIf, MatIconModule, MatTooltipModule],
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss'],
})
export class BrandingComponent implements OnInit {
  profileImage: string | null = null;   // Data URL preview
  backgroundImage: string | null = null;   // Data URL preview
  private logoCropSource: string | null = null;
  private logoCropTransform: ImageTransform | null = null;
  private initialProfileImage: string | null = null;
  private initialBackgroundImage: string | null = null;
  hasChanges = false;
  isSaving = false;
  isLoading = false;
  isUploading = false;  // Loading state for file read

  constructor(
    private navItemService: NavItemService,
    private orgProfiles: OrganizationProfilesService,
    private auth: AuthService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.navItemService.currentRouteName = 'Branding';
  }

  ngOnInit(): void {
    const user = this.auth.getUserProfile();
    const userId = user?.sub;
    if (!userId) return;

    this.isLoading = true;
    this.orgProfiles.getProfile(userId).subscribe({
      next: (p) => {
        console.log(p);
        this.profileImage = ensureDataUrl(p?.profilePhotoUrl ?? null);
        this.logoCropSource = this.profileImage;
        this.logoCropTransform = null;
        this.backgroundImage = ensureDataUrl(p?.backgroundPhotoUrl ?? null);
        this.initialProfileImage = this.profileImage;
        this.initialBackgroundImage = this.backgroundImage;
        this.hasChanges = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  async onFileSelected(evt: Event, imageType: 'profile' | 'background') {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!isAllowedFileType(file)) {
      this.toastr.error(this.translate.instant('Image format not allowed'), this.translate.instant('Error'));
      input.value = '';
      return;
    }
    if (!isWithinSizeLimit(file)) {
      this.toastr.error(this.translate.instant('Image too large'), this.translate.instant('Error'));
      input.value = '';
      return;
    }

    this.isUploading = true;
    try {
      let dataUrl = await fileToDataUrl(file);
      if (imageType === 'profile') {
        dataUrl = await compressImage(dataUrl);
        this.logoCropSource = dataUrl;
        this.logoCropTransform = null;
        this.openCropDialog(dataUrl);
      } else {
        const dims = await getImageDimensions(dataUrl);
        if (dims.width >= BACKGROUND_MIN_WIDTH && dims.height >= BACKGROUND_MIN_HEIGHT) {
          dataUrl = await compressImage(dataUrl);
          this.backgroundImage = dataUrl;
          this.updateHasChanges();
        } else {
          try {
            const resized = await resizeImageToMin(dataUrl, BACKGROUND_MIN_WIDTH, BACKGROUND_MIN_HEIGHT);
            this.backgroundImage = await compressImage(resized);
            this.updateHasChanges();
            this.toastr.info(this.translate.instant('Image resized to meet minimum size.'));
          } catch {
            const msg = this.translate.instant('Background image must be at least {{minW}}×{{minH}}px. Your image is {{w}}×{{h}}px.',
              { minW: BACKGROUND_MIN_WIDTH, minH: BACKGROUND_MIN_HEIGHT, w: dims.width, h: dims.height });
            this.toastr.error(msg, this.translate.instant('Image too small'));
          }
        }
      }
    } catch (e) {
      console.error('Image upload failed', e);
      this.toastr.error(this.translate.instant('Corrupt or invalid image'), this.translate.instant('Error'));
    } finally {
      this.isUploading = false;
      input.value = '';
    }
  }

  openCropDialog(imageBase64: string): void {
    const dialogRef = this.dialog.open(ImageCropDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'image-crop-dialog',
      data: {
        imageBase64,
        cropType: 'company' as const,
        title: this.translate.instant('Crop company logo'),
        initialTransform: this.logoCropTransform ?? undefined,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: ImageCropDialogResult | null) => {
      if (result?.croppedBase64) {
        this.logoCropTransform = result.transform;
        try {
          this.profileImage = await compressForProfilePayload(result.croppedBase64);
          this.updateHasChanges();
        } catch {
          this.profileImage = result.croppedBase64;
          this.updateHasChanges();
        }
      } else {
        this.isUploading = false;
      }
    });
  }

  cropImage(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const src = this.logoCropSource ?? this.profileImage;
    if (!src) return;
    this.openCropDialog(src);
  }

  clearImage(e: Event, type: 'profile' | 'background') {
    e.stopPropagation();
    e.preventDefault();
    if (type === 'profile') {
      this.profileImage = null;
      this.logoCropSource = null;
      this.logoCropTransform = null;
    } else if (type === 'background') {
      this.backgroundImage = null;
    }
    this.updateHasChanges();
  }

  save() {
    const userId = this.auth.getUserProfile()?.sub;
    if (!userId) {
      this.toastr.error(this.translate.instant('ERROR.NO_USER_SIGN_IN'), this.translate.instant('LABEL.ERROR'));
      return;
    }

    this.isSaving = true;
    this.orgProfiles
      .saveProfile({ userId, profilePhotoUrl: this.profileImage || "", backgroundPhotoUrl: this.backgroundImage || "" })
      .subscribe({
        next: () => {
          this.orgProfiles.setBrandingLogo(
            this.profileImage || null,
            userId,
          );
          this.orgProfiles.setBackgroundImage(this.backgroundImage || null);

          this.toastr.success(this.translate.instant('TOAST.IMAGE_SAVED'), this.translate.instant('LABEL.SUCCESS'));
          this.initialProfileImage = this.profileImage;
          this.initialBackgroundImage = this.backgroundImage;
          this.hasChanges = false;
          this.isSaving = false;
        },
        error: (err) => {
          console.error(err);
          this.toastr.error(this.translate.instant('TOAST.FAILED_SAVE_IMAGE'), this.translate.instant('LABEL.ERROR'));
          this.isSaving = false;
        },
      });
  }

  private updateHasChanges() {
    this.hasChanges =
      this.profileImage !== this.initialProfileImage ||
      this.backgroundImage !== this.initialBackgroundImage;
  }
}

/** If backend returns bare base64, wrap it as a data URL; otherwise pass through. */
function ensureDataUrl(s: string | null): string | null {
  if (!s) return null;
  return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
}
