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
  compressForBackground,
  compressImage,
  compressForProfilePayload,
  ensureBackgroundDataUrlWithinLimit,
  dataUrlToBlob,
  BACKGROUND_MIN_WIDTH,
  BACKGROUND_MIN_HEIGHT,
} from 'src/app/shared/utils/image-upload.utils';
import { firstValueFrom } from 'rxjs';

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

    // Session + BehaviorSubject so previews render before GET /profiles completes (matches logo in header/sidebar).
    this.orgProfiles.hydrateBrandingLogoFromSession(userId);
    this.orgProfiles.hydrateBackgroundFromSession(userId);
    const logoCached = this.orgProfiles.getBrandingLogoValue();
    const bgCached = this.orgProfiles.getBackgroundImageValue();
    if (logoCached?.trim()) {
      this.profileImage = ensureDataUrl(logoCached);
      this.logoCropSource = this.profileImage;
    }
    if (bgCached?.trim()) {
      this.backgroundImage = ensureDataUrl(bgCached);
    }

    // Dirty-check baseline must match what we show from cache; otherwise clearing before GET completes
    // leaves both current and initial null and Save stays disabled.
    this.initialProfileImage = this.profileImage;
    this.initialBackgroundImage = this.backgroundImage;
    this.hasChanges = false;

    const formSnapshotProfile = this.profileImage;
    const formSnapshotBg = this.backgroundImage;

    this.isLoading = true;
    this.orgProfiles.getProfile(userId).subscribe({
      next: (p) => {
        const serverProfile = ensureDataUrl(p?.profilePhotoUrl ?? null);
        const serverBg = ensureDataUrl(p?.backgroundPhotoUrl ?? null);

        const userEditedWhileLoading =
          normalizeBrandingImageRef(this.profileImage) !==
            normalizeBrandingImageRef(formSnapshotProfile) ||
          normalizeBrandingImageRef(this.backgroundImage) !==
            normalizeBrandingImageRef(formSnapshotBg);

        this.initialProfileImage = serverProfile;
        this.initialBackgroundImage = serverBg;

        if (!userEditedWhileLoading) {
          this.profileImage = serverProfile;
          this.logoCropSource = this.profileImage;
          this.logoCropTransform = null;
          this.backgroundImage = serverBg;
          this.orgProfiles.setBrandingLogo(this.profileImage || null, userId);
          this.orgProfiles.setBackgroundImage(this.backgroundImage || null, userId);
        }

        this.isLoading = false;
        this.updateHasChanges();
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
          dataUrl = await compressForBackground(dataUrl);
          this.backgroundImage = dataUrl;
          this.updateHasChanges();
        } else {
          try {
            const resized = await resizeImageToMin(dataUrl, BACKGROUND_MIN_WIDTH, BACKGROUND_MIN_HEIGHT);
            this.backgroundImage = await compressForBackground(resized);
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

  async save() {
    const userId = this.auth.getUserProfile()?.sub;
    if (!userId) {
      this.toastr.error(this.translate.instant('ERROR.NO_USER_SIGN_IN'), this.translate.instant('LABEL.ERROR'));
      return;
    }

    const logoChanged =
      normalizeBrandingImageRef(this.profileImage) !==
      normalizeBrandingImageRef(this.initialProfileImage);
    const bgChanged =
      normalizeBrandingImageRef(this.backgroundImage) !==
      normalizeBrandingImageRef(this.initialBackgroundImage);

    if (!logoChanged && !bgChanged) {
      return;
    }

    if (bgChanged && this.backgroundImage) {
      try {
        const shrunk = await ensureBackgroundDataUrlWithinLimit(this.backgroundImage);
        if (shrunk !== this.backgroundImage) {
          this.backgroundImage = shrunk;
        }
      } catch (e) {
        console.error('Background shrink before save failed', e);
      }
    }

    this.isSaving = true;
    try {
      const requests: Array<ReturnType<typeof firstValueFrom>> = [];
      if (logoChanged) {
        if (this.profileImage) {
          requests.push(
            firstValueFrom(
              this.orgProfiles.postOrganizationImage('logo', dataUrlToBlob(this.profileImage), false),
            ),
          );
        } else {
          requests.push(
            firstValueFrom(this.orgProfiles.postOrganizationImage('logo', null, true)),
          );
        }
      }
      if (bgChanged) {
        if (this.backgroundImage) {
          requests.push(
            firstValueFrom(
              this.orgProfiles.postOrganizationImage(
                'background',
                dataUrlToBlob(this.backgroundImage),
                false,
              ),
            ),
          );
        } else {
          requests.push(
            firstValueFrom(this.orgProfiles.postOrganizationImage('background', null, true)),
          );
        }
      }
      if (requests.length > 0) {
        await Promise.all(requests);
      }

      this.orgProfiles.setBrandingLogo(this.profileImage || null, userId);
      this.orgProfiles.setBackgroundImage(this.backgroundImage || null, userId);

      this.toastr.success(this.translate.instant('TOAST.IMAGE_SAVED'), this.translate.instant('LABEL.SUCCESS'));
      this.initialProfileImage = this.profileImage;
      this.initialBackgroundImage = this.backgroundImage;
      this.hasChanges = false;
    } catch (err) {
      console.error(err);
      this.toastr.error(this.translate.instant('TOAST.FAILED_SAVE_IMAGE'), this.translate.instant('LABEL.ERROR'));
    } finally {
      this.isSaving = false;
    }
  }

  private updateHasChanges() {
    this.hasChanges =
      normalizeBrandingImageRef(this.profileImage) !==
        normalizeBrandingImageRef(this.initialProfileImage) ||
      normalizeBrandingImageRef(this.backgroundImage) !==
        normalizeBrandingImageRef(this.initialBackgroundImage);
  }
}

/** If backend returns bare base64, wrap it as a data URL; otherwise pass through. */
function ensureDataUrl(s: string | null): string | null {
  if (!s) return null;
  return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
}

/** Treat null/empty as equivalent so clear vs "" matches server and dirty state is correct. */
function normalizeBrandingImageRef(s: string | null | undefined): string | null {
  if (s == null || String(s).trim() === '') return null;
  return s;
}
