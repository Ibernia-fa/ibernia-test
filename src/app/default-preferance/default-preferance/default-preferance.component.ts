// src/app/settings/default-preferance/default-preferance.component.ts
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, startWith, takeUntil } from 'rxjs/operators';
import { SettingsService, ComissionType, UserProfileDto } from '../services/default-preferance.http.service';
import { allCountries } from 'src/app/clients/models/country'; 
import { AuthService } from 'src/app/auth/services/auth.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-default-preferance',
  templateUrl: './default-preferance.component.html',
  styleUrls: ['./default-preferance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DefaultPreferanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isSaving = false;
  submitted = false;
  countries = allCountries;

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
      comissionType: [ComissionType.Amount as ComissionType, [Validators.required]],
      comissionPercentage: [1 as number | null],
      comissionAmount: [null as number | null],
      currency: ['EUR', [Validators.required]],
      country: ['' as string],
    }),
  });
  user: any;
ComissionType = ComissionType;
  constructor(
    private fb: FormBuilder,
    private api: SettingsService,
    private snack: MatSnackBar,
    private router: Router,
    private Authservice: AuthService,
    @Optional() private dialogRef?: MatDialogRef<DefaultPreferanceComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  ngOnInit(): void {
    this.user = this.Authservice.getUserProfile();
    this.form.controls.preferences.controls.comissionType.valueChanges
      .pipe(
        startWith(this.form.controls.preferences.controls.comissionType.value),
        takeUntil(this.destroy$)
      )
      .subscribe((t) => this.applyComissionValidation(t));
  }

  private applyComissionValidation(t: ComissionType) {
    const prefs = this.form.controls.preferences;
    const pct = prefs.controls.comissionPercentage;
    const amt = prefs.controls.comissionAmount;

    pct.clearValidators();
    amt.clearValidators();

    // reset enable/disable
    pct.enable({ emitEvent: false });
    amt.enable({ emitEvent: false });

    if (t === ComissionType.Amount) {
      pct.setValue(null, { emitEvent: false });
      pct.disable({ emitEvent: false });
      amt.setValidators([Validators.required, Validators.min(0.01)]);
    } else if (t === ComissionType.Percentage) {
      amt.setValue(null, { emitEvent: false });
      amt.disable({ emitEvent: false });
          if (!pct.value) {
      pct.setValue(1, { emitEvent: false });
    }
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

    clientCountryValueChange(event: any) {
      const selectedCountry = allCountries.find(country => country.countryName === event);
      this.p['currency'].patchValue(selectedCountry?.currencySymbol || '');
    }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Please fix the highlighted fields.', 'Close', { duration: 3000 });
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UserProfileDto = {
      userId: this.user?.sub,
      profilePhotoUrl: blankToNull(raw.profilePhotoUrl),
      firstName: this.user?.family_name,
      lastName: this.user?.given_name,
      email: this.user?.email,
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
    this.api
      .postUserProfile(payload)
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
        this.snack.open('Preferences saved.', undefined, { duration: 2000 });
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

  get comTypeCtrl() {
  return this.form.controls.preferences.controls.comissionType;
}
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
