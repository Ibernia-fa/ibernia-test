import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { OnlyPreferanceService, ComissionType, UserProfileDto } from '../services/only-preferance.http.service';
import { allCountries } from 'src/app/clients/models/country'; 
import { AuthService } from 'src/app/auth/services/auth.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageCode, LanguageService } from 'src/app/core/language.service';

@Component({
  selector: 'app-default-preferance',
  templateUrl: './default-preferance.component.html',
  styleUrls: ['./default-preferance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  // imports: [TranslateModule]
})
export class DefaultPreferanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isSaving = false;
  submitted = false;
  countries = allCountries;
  currentLanguage: LanguageCode = 'en';
  readonly languages: { label: string; value: LanguageCode }[] = [
    { label: 'English', value: 'en' },
    { label: 'Italian', value: 'it' },
  ];

  // UI helpers
  comissionTypes = [
    { label: 'Amount', value: ComissionType.Amount },
    { label: 'Percentage', value: ComissionType.Percentage },
    { label: 'Both', value: ComissionType.Both },
  ];

  // Form structure mirrors Swagger exactly
  form = this.fb.nonNullable.group({
    userId: ['' as string],         
    profilePhotoUrl: ['' as string],
    firstName: ['' as string],
    lastName: ['' as string],
    email: ['' as string],
    preferences: this.fb.nonNullable.group({
      inflationRate: [2.5 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      investmentReturn: [5 as number, [Validators.required, Validators.min(-100), Validators.max(100)]],
      // comissionType: [ComissionType.Amount as ComissionType, [Validators.required]],
      // comissionPercentage: [1 as number | null],
      // comissionAmount: [null as number | null],
      currency: ['EUR', [Validators.required]],
      country: ['' as string, [Validators.required]],
      language: ['en' as LanguageCode, [Validators.required]],
    }),
  });
  user: any;
ComissionType = ComissionType;
  constructor(
    private fb: FormBuilder,
    private api: OnlyPreferanceService,
    private toastr: ToastrService,
    private router: Router,
    private Authservice: AuthService,
    private languageService: LanguageService,
    @Optional() private dialogRef?: MatDialogRef<DefaultPreferanceComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  ngOnInit(): void {
    this.user = this.Authservice.getUserProfile();
    this.currentLanguage = this.form.controls.preferences.controls.language.value === 'it' ? 'it' : 'en';
    this.p.language.setValue(this.currentLanguage);
    // this.form.controls.preferences.controls.comissionType.valueChanges
    //   .pipe(
    //     startWith(this.form.controls.preferences.controls.comissionType.value),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe((t) => this.applyComissionValidation(t));
  }

  // private applyComissionValidation(t: ComissionType) {
  //   const prefs = this.form.controls.preferences;
  //   const pct = prefs.controls.comissionPercentage;
  //   const amt = prefs.controls.comissionAmount;

  //   pct.clearValidators();
  //   amt.clearValidators();

  //   // reset enable/disable
  //   pct.enable({ emitEvent: false });
  //   amt.enable({ emitEvent: false });

  //   if (t === ComissionType.Amount) {
  //     pct.setValue(null, { emitEvent: false });
  //     pct.disable({ emitEvent: false });
  //     amt.setValidators([Validators.required, Validators.min(0.01)]);
  //   } else if (t === ComissionType.Percentage) {
  //     amt.setValue(null, { emitEvent: false });
  //     amt.disable({ emitEvent: false });
  //         if (!pct.value) {
  //     pct.setValue(1, { emitEvent: false });
  //   }
  //     pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
  //   } else if (t === ComissionType.Both) {
  //     pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
  //     amt.setValidators([Validators.required, Validators.min(0.01)]);
  //   }

  //   pct.updateValueAndValidity({ emitEvent: false });
  //   amt.updateValueAndValidity({ emitEvent: false });
  // }

  get p() {
    return this.form.controls.preferences.controls;
  }

  onLanguageChange(language: LanguageCode): void {
    this.currentLanguage = language === 'it' ? 'it' : 'en';
    this.p.language.setValue(this.currentLanguage);
  }

    clientCountryValueChange(event: any) {
      const selectedCountry = allCountries.find(country => country.countryName === event);
      this.p['currency'].patchValue(selectedCountry?.currencySymbol || '');
    }

  submit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    // this.form.markAsDirty();
    if (this.form.invalid) {
      this.toastr.error('Please complete the highlighted fields', 'Error!');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UserProfileDto = {
      userId: this.user?.sub,
      profilePhotoUrl: blankToNull(raw.profilePhotoUrl),
      firstName: this.user?.given_name,
      lastName: this.user?.family_name,
      email: this.user?.email,
      preferences: {
        inflationRate: round2(raw.preferences.inflationRate),
        investmentReturn: round2(raw.preferences.investmentReturn),
        // comissionType: raw.preferences.comissionType,
        // comissionPercentage:
        //   raw.preferences.comissionType === ComissionType.Amount
        //     ? null
        //     : roundOrNull(raw.preferences.comissionPercentage),
        // comissionAmount:
        //   raw.preferences.comissionType === ComissionType.Percentage
        //     ? null
        //     : intOrNull(raw.preferences.comissionAmount),
        currency: raw.preferences.currency,
        country: blankToNull(raw.preferences.country),
        language: raw.preferences.language,
      },
    };

    this.isSaving = true;
    this.api
      .postUserProfile(payload)
      .pipe(
        switchMap(() => this.api.updateLanguage(this.user?.sub, raw.preferences.language)),
        switchMap(() => this.api.getUserProfileResponse(this.user?.sub)),
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? 'Failed to save preferences';
          this.toastr.error(msg, 'Error!');
          return EMPTY;
        }),
        finalize(() => (this.isSaving = false))
      )
      .subscribe((res) => {
        this.languageService.use(raw.preferences.language);
        if (res?.ok && res.body) {
          this.api.setUserData(res.body);
        }
        this.api.notifyProfileChanged();
        this.toastr.success('Preferences saved', 'Success!');
          if (this.dialogRef) {
          this.dialogRef.close(true);
          return;
        }
        // If routed page → navigate back to clients
        this.router.navigate(['/clients']);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

//   get comTypeCtrl() {
//   return this.form.controls.preferences.controls.comissionType;
// }
}


// helpers
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
