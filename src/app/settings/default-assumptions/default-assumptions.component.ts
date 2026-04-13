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
import { allCountries } from 'src/app/clients/models/country';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgFor, NgIf } from '@angular/common';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';

@Component({
  selector: 'app-default-assumptions',
  templateUrl: './default-assumptions.component.html',
  styleUrls: ['./default-assumptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelect,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslateModule,
    NgIf,
    NgFor,
    ThousandSeparatorInputDirective,
  ],
})
export class DefaultAssumptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  countries = allCountries;
  ComissionType = ComissionType;

  private apiCommissionSnapshot?: {
    comissionType: ComissionType | null;
    comissionAmount: number | null;
    comissionPercentage: number | null;
  };

  isLoading = false;
  isSavingPreferences = false;
  submitted = false;

  private preferencesSnapshot: Record<string, unknown> | null = null;
  private loadedProfile: UserProfileDto | null = null;

  comissionTypes: { label: string; value: ComissionType }[] = [];

  user: any;
  @ViewChild('commissionAmountInput') commissionAmountInput?: ElementRef<HTMLInputElement>;

  form = this.fb.nonNullable.group({
    preferences: this.fb.nonNullable.group({
      inflationRate: [2.5 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      investmentReturn: [6 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      pensionFundReturn: [4 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      pensionReplacementRate: [50 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      comissionType: [ComissionType.None as ComissionType, [Validators.required]],
      comissionPercentage: [1 as number | null],
      comissionAmount: [null as number | null],
      currency: ['EUR', [Validators.required]],
      country: ['' as string],
      mortgageInterestRate: [3.5 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      loanInterestRate: [8 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      partnerInheritanceTaxRate: [4 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      childInheritanceTaxRate: [4 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
      siblingInheritanceTaxRate: [6 as number, [Validators.required, Validators.min(0), Validators.max(100)]],
    }),
  });

  constructor(
    private fb: FormBuilder,
    private api: SettingsService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private navItemService: NavItemService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    this.navItemService.currentRouteName = 'Default Assumptions';
  }

  ngOnInit(): void {
    this.comissionTypes = [
      { label: this.translate.instant('LABEL.NONE'), value: ComissionType.None },
      { label: this.translate.instant('Percentage'), value: ComissionType.Percentage },
      { label: this.translate.instant('Fixed Amount'), value: ComissionType.Amount },
      { label: this.translate.instant('Both'), value: ComissionType.Both },
    ];
    this.user = this.auth.getUserProfile();

    this.form.controls.preferences.controls.comissionType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => this.applyComissionValidation(t as ComissionType));

    this.applyComissionValidation(this.form.controls.preferences.controls.comissionType.value);

    this.loadProfile();

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
  }

  private loadProfile() {
    if (!this.user?.sub) return;
    this.isLoading = true;

    this.api
      .getUserProfileResponse(this.user.sub)
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
          this.loadedProfile = {
            id: undefined,
            userId: this.user?.sub,
            preferences: this.form.getRawValue().preferences,
          } as UserProfileDto;
          this.updateSnapshots();
          this.cdr.markForCheck();
          return;
        }
        if (res.ok && res.body) {
          const p = res.body;
          this.loadedProfile = p;
          this.form.patchValue({
            preferences: {
              inflationRate: p.preferences?.inflationRate ?? 2.5,
              investmentReturn: p.preferences?.investmentReturn ?? 6,
              pensionFundReturn: p.preferences?.pensionFundReturn ?? 4,
              pensionReplacementRate: p.preferences?.pensionReplacementRate ?? 50,
              comissionType: (p.preferences?.comissionType as ComissionType) ?? ComissionType.None,
              comissionPercentage: p.preferences?.comissionPercentage ?? null,
              comissionAmount: p.preferences?.comissionAmount ?? null,
              currency: p.preferences?.currency ?? 'EUR',
              country: p.preferences?.country ?? '',
              mortgageInterestRate: p.preferences?.mortgageInterestRate ?? 3.5,
              loanInterestRate: p.preferences?.loanInterestRate ?? 8,
              partnerInheritanceTaxRate: p.preferences?.partnerInheritanceTaxRate ?? 4,
              childInheritanceTaxRate: p.preferences?.childInheritanceTaxRate ?? 4,
              siblingInheritanceTaxRate: p.preferences?.siblingInheritanceTaxRate ?? 6,
            },
          });

          this.apiCommissionSnapshot = {
            comissionType: p.preferences?.comissionType ?? null,
            comissionAmount: p.preferences?.comissionAmount ?? null,
            comissionPercentage: p.preferences?.comissionPercentage ?? null,
          };

          this.applyComissionValidation(this.form.controls.preferences.controls.comissionType.value);

          setTimeout(() => {
            const el = this.commissionAmountInput?.nativeElement;
            const amount = this.form.controls.preferences.controls.comissionAmount.value;
            if (!el || amount === null || amount === undefined) return;
            el.value = Number(amount).toLocaleString('en-US');
            el.dispatchEvent(new Event('blur'));
          });

          this.updateSnapshots();
          this.cdr.markForCheck();
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

    const fromApiPct = this.apiCommissionSnapshot?.comissionPercentage ?? null;
    const fromApiAmt = this.apiCommissionSnapshot?.comissionAmount ?? null;

    if (t === ComissionType.None) {
      pct.disable({ emitEvent: false });
      amt.disable({ emitEvent: false });
    } else if (t === ComissionType.Amount) {
      amt.setValidators([Validators.required, Validators.min(0.01)]);
      if (amt.value == null) {
        amt.setValue(fromApiAmt ?? 100, { emitEvent: false });
      }
      pct.disable({ emitEvent: false });
    } else if (t === ComissionType.Percentage) {
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      if (pct.value == null) {
        pct.setValue(fromApiPct ?? 1, { emitEvent: false });
      }
      amt.disable({ emitEvent: false });
    } else {
      pct.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      amt.setValidators([Validators.required, Validators.min(0.01)]);

      if (pct.value == null) pct.setValue(fromApiPct ?? 1, { emitEvent: false });
      if (amt.value == null) amt.setValue(fromApiAmt ?? 100, { emitEvent: false });
    }

    pct.updateValueAndValidity({ emitEvent: false });
    amt.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  get p() {
    return this.form.controls.preferences.controls;
  }

  get hasPreferencesChanges(): boolean {
    if (!this.preferencesSnapshot) return false;
    const prefs = this.form.getRawValue().preferences;
    const snap = this.preferencesSnapshot;
    return (
      prefs.inflationRate !== snap['inflationRate'] ||
      prefs.investmentReturn !== snap['investmentReturn'] ||
      prefs.pensionFundReturn !== snap['pensionFundReturn'] ||
      prefs.pensionReplacementRate !== snap['pensionReplacementRate'] ||
      prefs.comissionType !== snap['comissionType'] ||
      prefs.comissionPercentage !== snap['comissionPercentage'] ||
      prefs.comissionAmount !== snap['comissionAmount'] ||
      prefs.currency !== snap['currency'] ||
      (prefs.country ?? '') !== (snap['country'] ?? '') ||
      prefs.mortgageInterestRate !== snap['mortgageInterestRate'] ||
      prefs.loanInterestRate !== snap['loanInterestRate'] ||
      prefs.partnerInheritanceTaxRate !== snap['partnerInheritanceTaxRate'] ||
      prefs.childInheritanceTaxRate !== snap['childInheritanceTaxRate'] ||
      prefs.siblingInheritanceTaxRate !== snap['siblingInheritanceTaxRate']
    );
  }

  private updateSnapshots(): void {
    const v = this.form.getRawValue();
    this.preferencesSnapshot = { ...v.preferences };
  }

  clientCountryValueChange(countryName: string) {
    const selectedCountry = this.countries.find((c) => c.countryName === countryName);
    this.p['currency'].patchValue(selectedCountry?.currencySymbol || '');
  }

  private buildPayload(): UserProfileDto {
    const raw = this.form.getRawValue();
    const profile = this.loadedProfile;
    return {
      id: profile?.id,
      userId: this.user?.sub,
      profilePhotoUrl: profile?.profilePhotoUrl,
      firstName: profile?.firstName ?? this.user?.firstName,
      lastName: profile?.lastName ?? this.user?.lastName,
      email: profile?.email ?? this.user?.email,
      bio: profile?.bio ?? null,
      preferences: {
        inflationRate: round2(raw.preferences.inflationRate),
        investmentReturn: round2(raw.preferences.investmentReturn),
        pensionFundReturn: round2(raw.preferences.pensionFundReturn),
        pensionReplacementRate: round2(raw.preferences.pensionReplacementRate),
        comissionType: raw.preferences.comissionType,
        comissionPercentage:
          raw.preferences.comissionType === ComissionType.Amount ||
          raw.preferences.comissionType === ComissionType.None
            ? null
            : roundOrNull(raw.preferences.comissionPercentage),
        comissionAmount:
          raw.preferences.comissionType === ComissionType.Percentage ||
          raw.preferences.comissionType === ComissionType.None
            ? null
            : intOrNull(raw.preferences.comissionAmount),
        currency: raw.preferences.currency,
        country: blankToNull(raw.preferences.country),
        mortgageInterestRate: round2(raw.preferences.mortgageInterestRate),
        loanInterestRate: round2(raw.preferences.loanInterestRate),
        partnerInheritanceTaxRate: round2(raw.preferences.partnerInheritanceTaxRate),
        childInheritanceTaxRate: round2(raw.preferences.childInheritanceTaxRate),
        siblingInheritanceTaxRate: round2(raw.preferences.siblingInheritanceTaxRate),
      },
    };
  }

  submitPreferences(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error(this.translate.instant('ERROR.FIX_FIELDS'), this.translate.instant('LABEL.ERROR'));
      return;
    }
    this.isSavingPreferences = true;
    this.api
      .updateUserProfile(this.buildPayload())
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          const msg = err?.error?.message ?? this.translate.instant('ERROR.FAILED_SAVE_PREFERENCES');
          this.toastr.error(msg, this.translate.instant('LABEL.ERROR'));
          return EMPTY;
        }),
        finalize(() => {
          this.isSavingPreferences = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(() => {
        this.updateSnapshots();
        this.loadedProfile = { ...this.loadedProfile!, preferences: this.form.getRawValue().preferences };
        this.toastr.success(this.translate.instant('TOAST.PREFERENCES_SAVED'), this.translate.instant('LABEL.SUCCESS'));
        this.api.notifyProfileChanged();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCommissionAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.form.controls.preferences.controls.comissionAmount.setValue(value, { emitEvent: false });
    const el = this.commissionAmountInput?.nativeElement;
    if (!el) return;
    if (value === null || value === undefined || Number.isNaN(value)) {
      el.value = '';
      return;
    }
    el.value = Number(value).toLocaleString('en-US');
  }

  formatCommissionAmountOnFocus(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const amount = this.form.controls.preferences.controls.comissionAmount.value;
    if (!input || amount === null || amount === undefined) return;
    input.value = Number(amount).toLocaleString('en-US');
  }
}

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
