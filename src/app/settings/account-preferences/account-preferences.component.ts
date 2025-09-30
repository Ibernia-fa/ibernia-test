import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpResponse } from '@angular/common/http';
import { Subject, EMPTY, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import {
  SettingsService,
  ComissionType,
  UserProfileDto,
} from '../../default-preferance/services/default-preferance.http.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { allCountries } from 'src/app/clients/models/country';

@Component({
  selector: 'app-account-preferences',
  templateUrl: './account-preferences.component.html',
  styleUrls: ['./account-preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountPreferencesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  countries = allCountries;
  ComissionType = ComissionType;

  isLoading = false;
  isSaving = false;
  submitted = false;
  // UI helpers
  comissionTypes = [
    { label: 'Amount', value: ComissionType.Amount },
    { label: 'Percentage', value: ComissionType.Percentage },
    { label: 'Both', value: ComissionType.Both },
  ];
  user: any;
  // local-only preview (no upload)
  profileImagePreview: string | null = null;
  private objectUrlToRevoke: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
// profileImagePreview: string | null = null;
  form = this.fb.nonNullable.group({
    userId: ['' as string],
    profilePhotoUrl: ['' as string],  // stays whatever backend returned
    firstName: ['' as string],
    lastName: ['' as string],
    email: ['' as string],
    preferences: this.fb.nonNullable.group({
      inflationRate: [2.5 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      investmentReturn: [5 as number, [Validators.required, Validators.min(-100), Validators.max(100)]],
      comissionType: [ComissionType.Amount as ComissionType, [Validators.required]],
      comissionPercentage: [1 as number | null],
      comissionAmount: [null as number | null],
      currency: ['EUR', [Validators.required]],
      country: ['' as string],
    }),
  });
  userprofile: UserProfileDto;

  constructor(
    private fb: FormBuilder,
    private api: SettingsService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUserProfile();
    this.form.patchValue({
      userId: this.user?.sub ?? '',
      firstName: this.user?.firstName ?? '',
      lastName: this.user?.lastName ?? '',
      email: this.user?.email ?? '',
    });

    // dynamic validators for commission fields
    this.form.controls.preferences.controls.comissionType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => this.applyComissionValidation(t as ComissionType));

    // initial apply
    this.applyComissionValidation(this.form.controls.preferences.controls.comissionType.value);

    // load existing profile (handles 204)
    this.loadProfile();
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
          // nothing saved yet; keep defaults
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
            preferences: {
              inflationRate: p.preferences?.inflationRate ?? this.form.value.preferences?.inflationRate,
              investmentReturn: p.preferences?.investmentReturn ?? this.form.value.preferences?.investmentReturn,
              comissionType: (p.preferences?.comissionType as ComissionType) ?? this.form.value.preferences?.comissionType,
              comissionPercentage: p.preferences?.comissionPercentage ?? this.form.value.preferences?.comissionPercentage ?? null,
              comissionAmount: p.preferences?.comissionAmount ?? this.form.value.preferences?.comissionAmount ?? null,
              currency: p.preferences?.currency ?? this.form.value.preferences?.currency,
              country: p.preferences?.country ?? this.form.value.preferences?.country,
            },
          });

          // show backend avatar if present (local preview only)
          // if (p.profilePhotoUrl) {
          //   this.profileImagePreview = p.profilePhotoUrl;
          // }

          this.profileImagePreview = ensureDataUrl(p.profilePhotoUrl);

          // re-apply validators in case type changed
          this.applyComissionValidation(this.form.controls.preferences.controls.comissionType.value);
        }
      });
  }

  private applyComissionValidation(t: ComissionType) {
    const prefs = this.form.controls.preferences;
    const pct = prefs.controls.comissionPercentage;
    const amt = prefs.controls.comissionAmount;

    pct.clearValidators();
    amt.clearValidators();

    pct.enable({ emitEvent: false });
    amt.enable({ emitEvent: false });

    if (t === ComissionType.Amount) {
      pct.setValue(null, { emitEvent: false });
      pct.disable({ emitEvent: false });
      amt.setValidators([Validators.required, Validators.min(0.01)]);
    } else if (t === ComissionType.Percentage) {
      amt.setValue(null, { emitEvent: false });
      amt.disable({ emitEvent: false });
      if (!pct.value) pct.setValue(1, { emitEvent: false });
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (t === ComissionType.Both) {
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      amt.setValidators([Validators.required, Validators.min(0.01)]);
    }

    pct.updateValueAndValidity({ emitEvent: false });
    amt.updateValueAndValidity({ emitEvent: false });
  }

  get p() {
    return this.form.controls.preferences.controls;
  }

  clientCountryValueChange(countryName: string) {
    const selectedCountry = this.countries.find(c => c.countryName === countryName);
    this.p['currency'].patchValue(selectedCountry?.currencySymbol || '');
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
//     this.snack.open('Could not read the selected image.', 'Close', { duration: 3000 });
//   } finally {
//     // allow selecting same file again later
//     input.value = '';
//   }
// }

  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file); // data:image/...;base64,...
      this.profileImagePreview = dataUrl;
      this.form.get('profilePhotoUrl')?.setValue(dataUrl);
      this.cdr.markForCheck();                // <-- ensure UI updates under OnPush
    } catch (e) {
      console.error('Failed to read image', e);
      this.snack.open('Could not read the selected image.', 'Close', { duration: 3000 });
    } finally {
      // reset the native input so picking the *same file* again will fire (change)
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }


  submit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Please fix the highlighted fields.', 'Close', { duration: 3000 });
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UserProfileDto = {
      id: this.userprofile.id,
      userId: this.user?.sub,
      // keep existing backend URL; do not use preview blob URL
      // profilePhotoUrl: blankToNull(raw.profilePhotoUrl),
      profilePhotoUrl: raw.profilePhotoUrl, // <-- keep as-is (may be base64 or null)
      firstName: raw.firstName?.trim() || this.user?.firstName,
      lastName: raw.lastName?.trim() || this.user?.lastName,
      email: raw.email?.trim() || this.user?.email,
      preferences: {
        inflationRate: round2(raw.preferences.inflationRate),
        investmentReturn: round2(raw.preferences.investmentReturn),
        comissionType: raw.preferences.comissionType,
        comissionPercentage:
          raw.preferences.comissionType === ComissionType.Amount
            ? null
            : roundOrNull(raw.preferences.comissionPercentage),
        comissionAmount:
          raw.preferences.comissionType === ComissionType.Percentage
            ? null
            : intOrNull(raw.preferences.comissionAmount),
        currency: raw.preferences.currency,
        country: blankToNull(raw.preferences.country),
      },
    };

    this.isSaving = true;
    this.api.updateUserProfile(payload)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? 'Failed to save preferences.';
          this.snack.open(msg, 'Close', { duration: 4000 });
          return EMPTY;
        }),
        finalize(() => (this.isSaving = false))
      )
      .subscribe(() => {
        this.isSaving = false;
        this.snack.open('Preferences saved.', undefined, { duration: 2000 });
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
    this.form.get('profilePhotoUrl')?.setValue('');
    // also clear the native input here (important for the "2nd pick" case)
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

}

/* helpers */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function roundOrNull(n: number | null): number | null {
  return n == null || Number.isNaN(+n) ? null : round2(+n);
}
function blankToNull(s?: string | null): string | null {
  return s && s.trim().length ? s.trim() : null;
}
function intOrNull(n: number | null): number | null {
  if (n == null || Number.isNaN(+n)) return null;
  return Math.trunc(n);
}
function ensureDataUrl(s?: string | null): string | null {
  if (!s) return null;
  // If it's already a data URL, keep it; otherwise assume JPEG and prefix.
  return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
}
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
