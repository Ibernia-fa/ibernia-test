// src/app/settings/default-preferance/default-preferance.component.ts
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, startWith, takeUntil } from 'rxjs/operators';
import { DefaultPreferencesPayload, SettingsService, CommissionType } from '../services/default-preferance.http.service';

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

  // Common currencies – extend if needed
  currencies = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'PKR'];

  // Typed reactive form
  form = this.fb.nonNullable.group({
    inflationRate: [2.5 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
    currency: ['USD', [Validators.required]],
    netInvestmentReturn: [2 as number, [Validators.required, Validators.min(-100), Validators.max(100)]],
    advisorCommissionType: ['none' as CommissionType, [Validators.required]],
    commissionPercentage: [null as number | null],
    commissionAmount: [null as number | null],
    acknowledged: [true as boolean],
  });

  constructor(
    private fb: FormBuilder,
    private api: SettingsService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Dynamic validators based on commission type
    this.form.controls.advisorCommissionType.valueChanges
      .pipe(startWith(this.form.controls.advisorCommissionType.value), takeUntil(this.destroy$))
      .subscribe((t) => this.applyCommissionValidation(t));

    // (Optional) preload existing preferences
    // this.api.getDefaultPreferences()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(v => this.form.patchValue(v));
  }

  private applyCommissionValidation(t: CommissionType) {
    const pct = this.form.controls.commissionPercentage;
    const amt = this.form.controls.commissionAmount;

    // Reset validators
    pct.clearValidators();
    amt.clearValidators();
    pct.disable({ emitEvent: false });
    amt.disable({ emitEvent: false });

    if (t === 'percentage') {
      pct.enable({ emitEvent: false });
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      amt.setValue(null, { emitEvent: false });
    } else if (t === 'amount') {
      amt.enable({ emitEvent: false });
      amt.setValidators([Validators.required, Validators.min(0.01)]);
      pct.setValue(null, { emitEvent: false });
    }

    pct.updateValueAndValidity({ emitEvent: false });
    amt.updateValueAndValidity({ emitEvent: false });
  }

  get f() { return this.form.controls; }

  submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Please fix the highlighted fields.', 'Close', { duration: 3000 });
      return;
    }

    const v = this.form.getRawValue();
    const payload: DefaultPreferencesPayload = {
      inflationRate: round2(v.inflationRate),
      currency: v.currency,
      netInvestmentReturn: round2(v.netInvestmentReturn),
      advisorCommissionType: v.advisorCommissionType,
      commissionPercentage: v.advisorCommissionType === 'percentage' ? round2(v.commissionPercentage!) : null,
      commissionAmount: v.advisorCommissionType === 'amount' ? round2(v.commissionAmount!) : null,
      acknowledged: v.acknowledged,
    };

    this.isSaving = true;
    this.api
      .saveDefaultPreferences(payload)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          const msg = err?.error?.message ?? 'Failed to save preferences. Please try again.';
          this.snack.open(msg, 'Close', { duration: 4000 });
          return EMPTY;
        }),
        finalize(() => (this.isSaving = false))
      )
      .subscribe(() => {
        this.snack.open('Preferences saved.', undefined, { duration: 2000 });
        // Navigate if this is a one-time setup
        this.router.navigate(['/dashboard']);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Helpers
function round2(n: number | null | undefined): number {
  if (n == null || Number.isNaN(+n)) return 0;
  return Math.round(+n * 100) / 100;
}
