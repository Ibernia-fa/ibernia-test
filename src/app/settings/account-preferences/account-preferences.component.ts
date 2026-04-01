import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { Subject, EMPTY, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import {
  SettingsService,
  ComissionType,
  UserProfileDto,
} from '../../default-preferance/services/default-preferance.http.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import {
  ImageCropDialogComponent,
  ImageCropDialogResult,
} from './image-crop-dialog/image-crop-dialog.component';
import type { ImageTransform } from 'ngx-image-cropper';
import { TranslateService } from '@ngx-translate/core';
import {
  isAllowedFileType,
  isWithinSizeLimit,
  fileToDataUrl,
  compressImage,
  compressForProfilePayload,
} from 'src/app/shared/utils/image-upload.utils';

@Component({
  selector: 'app-account-preferences',
  templateUrl: './account-preferences.component.html',
  styleUrls: ['./account-preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslateModule,
    NgIf,
  ]
})
export class AccountPreferencesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = false;
  isSavingProfile = false;
  isUploadingProfile = false;  // Loading state for profile image file read
  submitted = false;

  private profileSnapshot: { firstName: string; lastName: string; bio: string; profilePhotoUrl: string } | null = null;
  user: any;
  profileImagePreview: string | null = null;
  /** Uncropped source for the crop dialog; preview/payload use the cropped bitmap. */
  private profileCropSource: string | null = null;
  private profileCropTransform: ImageTransform | null = null;
  private objectUrlToRevoke: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  form = this.fb.nonNullable.group({
    userId: ['' as string],
    profilePhotoUrl: ['' as string],
    firstName: ['' as string],
    lastName: ['' as string],
    email: ['' as string],
    bio: ['' as string, [Validators.maxLength(250)]],
  });
  userprofile: UserProfileDto;

  constructor(
    private fb: FormBuilder,
    private api: SettingsService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private navItemService: NavItemService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.navItemService.currentRouteName = 'Account Preferences';
  }

  ngOnInit(): void {
    this.user = this.auth.getUserProfile();
    this.form.patchValue({
      userId: this.user?.sub ?? '',
      firstName: this.user?.firstName ?? '',
      lastName: this.user?.lastName ?? '',
      email: this.user?.email ?? '',
    });

    this.loadProfile();

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
  }

  private loadProfile() {
    if (!this.user?.sub) return;
    this.isLoading = true;

    this.api.getUserProfileResponse(this.user.sub)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('getUserProfile failed', err);
          return of(new HttpResponse<UserProfileDto | null>({ status: 500 }));
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((res: HttpResponse<UserProfileDto | null>) => {
        if (res.status === 204) {
          this.userprofile = { id: undefined, userId: this.user?.sub, preferences: DEFAULT_PREFERENCES } as UserProfileDto;
          this.profileCropSource = null;
          this.profileCropTransform = null;
          this.updateSnapshots();
          this.cdr.markForCheck();
          return;
        }
        if (res.ok && res.body) {
          this.userprofile = res.body;
          const p = res.body;
          this.form.patchValue({
            userId: p.userId ?? this.user?.sub ?? '',
            profilePhotoUrl: p.profilePhotoUrl ?? '',
            firstName: p.firstName ?? this.user?.firstName ?? '',
            lastName: p.lastName ?? this.user?.lastName ?? '',
            email: p.email ?? this.user?.email ?? '',
            bio: (p.bio ?? '').slice(0, 250),
          });

          this.profileImagePreview = ensureDataUrl(p.profilePhotoUrl);
          this.profileCropSource = this.profileImagePreview;
          this.profileCropTransform = null;

          this.updateSnapshots();
          this.cdr.markForCheck();
        }
      });
  }

  // private applyComissionValidation(t: ComissionType) {
  //   const prefs = this.form.controls.preferences;
  //   const pct = prefs.controls.comissionPercentage;
  //   const amt = prefs.controls.comissionAmount;

  //   pct.clearValidators();
  //   amt.clearValidators();

  //   pct.enable({ emitEvent: false });
  //   amt.enable({ emitEvent: false });

  //   if (t === ComissionType.Amount) {
  //     pct.setValue(null, { emitEvent: false });
  //     pct.disable({ emitEvent: false });
  //     amt.setValidators([Validators.required, Validators.min(0.01)]);
  //   } else if (t === ComissionType.Percentage) {
  //     amt.setValue(null, { emitEvent: false });
  //     amt.disable({ emitEvent: false });
  //     if (!pct.value) pct.setValue(1, { emitEvent: false });
  //     pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
  //   } else if (t === ComissionType.None) {
  //   } else if (t === ComissionType.Both) {
  //     pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
  //     amt.setValidators([Validators.required, Validators.min(0.01)]);
  //   }

  //   pct.updateValueAndValidity({ emitEvent: false });
  //   amt.updateValueAndValidity({ emitEvent: false });
  // }


  private _removedApplyComissionValidation(_t: ComissionType) {
    void _t;
    const prefs = (this.form as any).controls?.preferences as any;
    if (!prefs) return;
    const pct = prefs.controls?.comissionPercentage;
    const amt = prefs.controls.comissionAmount;
    if (!pct || !amt) return;
    // Reset validators only (don’t wipe values)
    pct.clearValidators();
    amt.clearValidators();

    // Enable both first so we can set values safely, then disable the irrelevant one.
    pct.enable({ emitEvent: false });
    amt.enable({ emitEvent: false });

    const fromApiPct: number | null = null;
    const fromApiAmt: number | null = null;

    if (_t === ComissionType.None) {
      // No commission fields required when None
      pct.disable({ emitEvent: false });
      amt.disable({ emitEvent: false });
    } else if (_t === ComissionType.Amount) {
      // Validators
      amt.setValidators([Validators.required, Validators.min(0.01)]);
      // If amount is empty, seed from API or fallback default
      if (amt.value == null) {
        amt.setValue(fromApiAmt ?? 100, { emitEvent: false }); // <- choose your default
      }
      // Disable the other without clearing its value
      pct.disable({ emitEvent: false });
    } else if (_t === ComissionType.Percentage) {
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      if (pct.value == null) {
        pct.setValue(fromApiPct ?? 1, { emitEvent: false }); // <- default %
      }
      amt.disable({ emitEvent: false });
    } else { // Both
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      amt.setValidators([Validators.required, Validators.min(0.01)]);

      if (pct.value == null) pct.setValue(fromApiPct ?? 1, { emitEvent: false });
      if (amt.value == null) amt.setValue(fromApiAmt ?? 100, { emitEvent: false });
    }

    pct.updateValueAndValidity({ emitEvent: false });
    amt.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }


  get hasProfileChanges(): boolean {
    if (!this.profileSnapshot) return false;
    const v = this.form.getRawValue();
    return (
      (v.firstName?.trim() ?? '') !== (this.profileSnapshot.firstName?.trim() ?? '') ||
      (v.lastName?.trim() ?? '') !== (this.profileSnapshot.lastName?.trim() ?? '') ||
      (v.bio?.trim() ?? '') !== (this.profileSnapshot.bio?.trim() ?? '') ||
      (v.profilePhotoUrl ?? '') !== (this.profileSnapshot.profilePhotoUrl ?? '')
    );
  }

  private updateSnapshots(): void {
    const v = this.form.getRawValue();
    this.profileSnapshot = {
      firstName: v.firstName ?? '',
      lastName: v.lastName ?? '',
      bio: v.bio ?? '',
      profilePhotoUrl: v.profilePhotoUrl ?? '',
    };
  }

  // local preview only (no upload)
  // onFileSelected(evt: Event) {
  //   const input = evt.target as HTMLInputElement;
  //   const file = input?.files?.[0];
  //   if (!file) return;

  //   // revoke previous preview URL (if any)
  //   if (this.objectUrlToRevoke) {
  //     URL.revokeObjectURL(this.objectUrlToRevoke);
  //     this.objectUrlToRevoke = null;
  //   }

  //   const url = URL.createObjectURL(file);
  //   this.profileImagePreview = url;
  //   this.objectUrlToRevoke = url;

  //   // NOTE: we're NOT setting profilePhotoUrl here since there's no upload yet.
  //   // The payload will keep whatever URL came from backend (if any).
  // }

  // local preview + store base64 in form control
  // async onFileSelected(evt: Event) {
  //   const input = evt.target as HTMLInputElement;
  //   const file = input?.files?.[0];
  //   if (!file) return;

  //   try {
  //     const dataUrl = await fileToDataUrl(file); // "data:image/png;base64,...."
  //     // preview uses the same string
  //     this.profileImagePreview = dataUrl;

  //     // store in the form so it goes to backend
  //     this.form.get('profilePhotoUrl')?.setValue(dataUrl);
  //   } catch (e) {
  //     console.error('Failed to read image', e);
  //     this.toastr.error('Could not read the selected image.', 'Error!');
  //   } finally {
  //     // allow selecting same file again later
  //     input.value = '';
  //   }
  // }

  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
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

    this.isUploadingProfile = true;
    try {
      let dataUrl = await fileToDataUrl(file);
      dataUrl = await compressImage(dataUrl);
      this.profileCropSource = dataUrl;
      this.profileCropTransform = null;
      this.openCropDialog(dataUrl);
    } catch (e) {
      console.error('Failed to read image', e);
      this.toastr.error(this.translate.instant('Corrupt or invalid image'), this.translate.instant('Error'));
    } finally {
      this.isUploadingProfile = false;
      this.cdr.markForCheck();
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  openCropDialog(imageBase64: string): void {
    const dialogRef = this.dialog.open(ImageCropDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'image-crop-dialog',
      data: {
        imageBase64,
        cropType: 'profile' as const,
        initialTransform: this.profileCropTransform ?? undefined,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: ImageCropDialogResult | null) => {
      if (result?.croppedBase64) {
        this.profileCropTransform = result.transform;
        try {
          const compressed = await compressForProfilePayload(result.croppedBase64);
          this.profileImagePreview = compressed;
          this.form.get('profilePhotoUrl')?.setValue(compressed);
        } catch {
          this.profileImagePreview = result.croppedBase64;
          this.form.get('profilePhotoUrl')?.setValue(result.croppedBase64);
        }
      } else {
        this.isUploadingProfile = false;
      }
      this.cdr.markForCheck();
    });
  }

  cropImage(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    const src = this.profileCropSource ?? this.profileImagePreview;
    if (!src) return;
    this.openCropDialog(src);
  }


  private buildPayload(): UserProfileDto {
    const raw = this.form.getRawValue();
    return {
      id: this.userprofile?.id,
      userId: this.user?.sub,
      profilePhotoUrl: raw.profilePhotoUrl,
      firstName: raw.firstName?.trim() || this.user?.firstName,
      lastName: raw.lastName?.trim() || this.user?.lastName,
      email: raw.email?.trim() || this.user?.email,
      bio: blankToNull(raw.bio),
      preferences: this.userprofile?.preferences ?? DEFAULT_PREFERENCES,
    };
  }

  submitProfile(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fix the highlighted fields', 'Error!');
      return;
    }
    this.isSavingProfile = true;
    this.api.updateUserProfile(this.buildPayload())
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? 'Failed to save profile';
          this.toastr.error(msg, 'Error!');
          return EMPTY;
        }),
        finalize(() => {
          this.isSavingProfile = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.updateSnapshots();
        this.toastr.success('Profile saved', 'Success!');
        const payload = this.buildPayload();
        this.userprofile = { ...(this.userprofile ?? { preferences: DEFAULT_PREFERENCES }), ...payload };
        this.profileImagePreview = ensureDataUrl(payload.profilePhotoUrl ?? null);
        this.api.setUserData(this.userprofile);
        this.api.notifyProfileChanged();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (this.objectUrlToRevoke) {
      URL.revokeObjectURL(this.objectUrlToRevoke);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  //   clearImage(event: Event): void {
  //   event.stopPropagation(); // Prevents opening file dialog when clicking the cross
  //   this.profileImagePreview = null;
  //   this.form.get('profilePhotoUrl')?.setValue('');
  // }

  clearImage(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.profileImagePreview = null;
    this.profileCropSource = null;
    this.profileCropTransform = null;
    this.form.get('profilePhotoUrl')?.setValue('');
    // also clear the native input here (important for the "2nd pick" case)
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

}

/* helpers */
const DEFAULT_PREFERENCES = {
  inflationRate: 2.5,
  investmentReturn: 6,
  pensionFundReturn: 4,
  comissionType: ComissionType.None,
  comissionPercentage: null as number | null,
  comissionAmount: null as number | null,
  currency: 'EUR',
  country: '',
  mortgageInterestRate: 3.5,
  loanInterestRate: 8,
};
function blankToNull(s?: string | null): string | null {
  return s && s.trim().length ? s.trim() : null;
}
function ensureDataUrl(s?: string | null): string | null {
  if (!s) return null;
  // If it's already a data URL, keep it; otherwise assume JPEG and prefix.
  return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
}
