import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppBreadcrumbComponent } from 'src/app/layouts/full/shared/breadcrumb/breadcrumb.component';
import { ClientHttpService } from '../services/client-http.service';
import { Client } from '../models/client';
import { catchError, filter, map } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AddModelDialogComponent } from '../profile/add-model-dialog/add-model-dialog.component';
import { allCountries } from '../models/country';
import { CountryISO, NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { FiveDayRangeSelectionStrategy } from 'src/app/core/five-day-range-selection-strategy';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-client-add',
  imports: [
    AppBreadcrumbComponent,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    RouterModule,
    ToastrModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    NgxIntlTelInputModule,
    MatCheckboxModule,
    TranslateModule
  ],
  providers: [
    ClientHttpService,
    ToastrService,
    provideNativeDateAdapter(),
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: FiveDayRangeSelectionStrategy,
    },
  ],
  templateUrl: './client-add.component.html',
  styleUrl: './client-add.component.scss',
})
export class ClientAddComponent {
  clientForm: FormGroup;
  showPartner: boolean = false;
  allCountries = allCountries;
  selectedClientCountryISO = CountryISO.UnitedStates;
  selectedPartnerCountryISO = CountryISO.UnitedStates;
  user: any;
  isLoading: boolean = false;
  age: number | null = null;
  partnerAge: number | null = null;
  MAX_AGE: number = 120;
  private isPastingClient: boolean = false;
  private isPastingPartner: boolean = false;
  clientDobDisplay: string = '';
  partnerDobDisplay: string = '';

  constructor(
    private fb: FormBuilder,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    private settingsService: SettingsService,
    private authService: AuthService
  ) {
    this.clientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', [Validators.required, dobValidator]],
      gender: [''],
      country: [''],
      currency: [''],
      email: ['', [Validators.email, Validators.required]],
      inflationRate: [
        2.5,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      phone: [''],
      notes: [''],
      partner: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        dob: ['', dobValidator],
        gender: [''],
        country: [''],
        currency: [''],
        email: ['', [Validators.email]],
        phone: [''],
      }),
    });

    this.togglePartnerSection(false); // Ensure partner section validations are off initially
  }

  ngOnInit() {
    this.user = this.authService.getUserProfile();

    if (!this.user || !this.user?.sub) return;

    this.settingsService.getUserProfileResponse(this.user.sub).subscribe({
      next: (res: any) => {
        // Your API returns a plain object with a `preferences` bag
        const p = res?.body?.preferences;
        if (!p) return;

        // --- COUNTRY ---

        if (!this.clientForm.get('country')?.value && p.country) {
          this.clientForm
            .get('country')
            ?.patchValue(p.country, { emitEvent: false });

          // keep phone ISO in sync
          const countryMatch = allCountries.find(
            (c) => c.countryName === p.country
          );
          if (countryMatch?.countryCode) {
            this.selectedClientCountryISO =
              countryMatch.countryCode.toLowerCase() as any;
          }

          // if (!this.clientForm.get('currency')?.value && countryMatch?.currencySymbol) {
          //   this.clientForm.get('currency')?.patchValue(countryMatch.currencySymbol, { emitEvent: false });
          // }
        }

        if (!this.clientForm.get('currency')?.value && p.currency) {
          const curMatch =
            allCountries.find(
              (c) =>
                (c as any).currencyCode?.toUpperCase?.() ===
                String(p.currency).toUpperCase()
            ) || allCountries.find((c) => c.currencySymbol === p.currency);

          const preferredSymbol = curMatch?.currencySymbol ?? p.currency;
          this.clientForm
            .get('currency')
            ?.patchValue(preferredSymbol, { emitEvent: false });
        }
      },
      error: (e) => console.error('Failed to load user prefs', e),
    });
  }

  clientCountryValueChange(event: any) {
    const selectedCountry = allCountries.find(
      (country) => country.countryName === event
    );
    this.clientForm.controls['currency'].patchValue(
      selectedCountry?.currencySymbol
    );
    this.selectedClientCountryISO =
      (selectedCountry?.countryCode.toLowerCase() ?? '') as CountryISO;
  }

  partnerCountryValueChange(event: any) {
    const selectedCountry = allCountries.find(
      (country) => country.countryName === event
    );
    (this.clientForm.get('partner') as FormGroup).controls[
      'currency'
    ].patchValue(selectedCountry?.currencySymbol);
    this.selectedPartnerCountryISO =
      (selectedCountry?.countryCode.toLowerCase() ?? '') as CountryISO;
  }

  togglePartnerSection(visible: boolean) {
    this.showPartner = visible;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (visible) {
      partnerGroup.get('lastName')?.setValidators(Validators.required);
      partnerGroup.get('firstName')?.setValidators(Validators.required);
      partnerGroup
        .get('dob')
        ?.setValidators([Validators.required, dobValidator]);
      partnerGroup.get('email')?.setValidators(Validators.required);

      const clientCountryName = this.clientForm.get('country')?.value as
        | string
        | null;
      const clientCurrency = this.clientForm.get('currency')?.value as
        | string
        | null;

      if (clientCountryName) {
        const selectedCountry = allCountries.find(
          (c) => c.countryName === clientCountryName
        );
        if (selectedCountry) {
          partnerGroup.patchValue(
            {
              country: selectedCountry.countryName,
              // if client currency is set use it; otherwise use the country's default
              currency: clientCurrency ?? selectedCountry.currencySymbol,
            },
            { emitEvent: false }
          );

          // keep partner phone dropdown in sync
          this.selectedPartnerCountryISO =
            selectedCountry.countryCode.toLowerCase() as CountryISO;
        }
      } else if (clientCurrency) {
        // no country set on client, but currency is—still copy the currency
        partnerGroup.patchValue(
          { currency: clientCurrency },
          { emitEvent: false }
        );
      }

      // reflect validators
      Object.keys(partnerGroup.controls).forEach((key) =>
        partnerGroup.get(key)?.updateValueAndValidity({ emitEvent: false })
      );
    } else {
      partnerGroup.reset();
      Object.keys(partnerGroup.controls).forEach((key) => {
        partnerGroup.get(key)?.clearValidators();
        partnerGroup.get(key)?.updateValueAndValidity();
      });
    }
  }

  get isFormInvalid() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (this.showPartner) {
      return (
        this.clientForm.controls['firstName'].invalid ||
        this.clientForm.controls['lastName'].invalid ||
        this.clientForm.controls['dob'].invalid ||
        this.clientForm.controls['email'].invalid ||
        partnerGroup.controls['firstName'].invalid ||
        partnerGroup.controls['lastName'].invalid ||
        partnerGroup.controls['dob'].invalid ||
        partnerGroup.controls['email'].invalid
      );
    }

    return (
      this.clientForm.controls['firstName'].invalid ||
      this.clientForm.controls['lastName'].invalid ||
      this.clientForm.controls['dob'].invalid ||
      this.clientForm.controls['email'].invalid
    );
  }

  getClientFormInfo() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    // Convert DOB to Date if it's a string
    let clientDob = this.clientForm.controls['dob'].value;
    if (typeof clientDob === 'string') {
      clientDob = this.parseDobToDate(clientDob);
    }

    let partnerDob = partnerGroup.controls['dob']?.value;
    if (typeof partnerDob === 'string') {
      partnerDob = this.parseDobToDate(partnerDob);
    }

    return {
      id: '',
      clientDetails: {
        birthDate: this.fixDate(clientDob),
        email: this.clientForm.controls['email'].value,
        gender: this.clientForm.controls['gender'].value,
        country: this.clientForm.controls['country'].value,
        firstName: this.clientForm.controls['firstName'].value,
        lastName: this.clientForm.controls['lastName'].value,

        phone: this.clientForm.controls['phone'].value?.e164Number,
        preferredCurrency: this.clientForm.controls['currency'].value,
        inflationRate: round2(this.clientForm.controls['inflationRate'].value),
      },
      partnerDetail: this.showPartner
        ? {
            birthDate: this.fixDate(partnerDob),
            email: partnerGroup.controls['email']?.value,
            gender: partnerGroup.controls['gender']?.value,
            country: partnerGroup.controls['country']?.value,
            firstName: partnerGroup.controls['firstName']?.value,
            lastName: partnerGroup.controls['lastName']?.value,
            phone: partnerGroup.controls['phone']?.value?.e164Number,
            preferredCurrency: partnerGroup.controls['currency']?.value,
          }
        : null,
      financialAdvisor: {
        advisorId: this.user.sub,
        advisorName: this.user.given_name,
      },
      lastUpdated: new Date(),
      notes: this.clientForm.controls['notes'].value,
    } as Client;
  }

  onAddNewClientClicked() {
    this.isLoading = true;
    this.clientForm.markAllAsTouched();
    this.clientForm.markAsDirty();

    if (this.isFormInvalid) {
      this.isLoading = false;
      return;
    }

    if (!this.isFormInvalid) {
      var client: Client = this.getClientFormInfo();
      this.clientHttpService
        .addClient(client)
        .pipe(
          filter((res) => !!res),
          map((res) => {
            this.router.navigate(['/clients/' + res.id + '/profile']);
            this.toastr.success('Client created successfully', 'Success!');
            this.isLoading = false;
          }),
          catchError((err) => {
            console.error(err);
            this.toastr.error('An error occured while saving client', 'Error!');
            this.isLoading = false;
            throw err;
          })
        )
        .subscribe();
      console.log('Form Data:', this.clientForm.value);
      // Submit form data to the API or service
    } else {
      console.error('Form is invalid');
      this.isLoading = false;
    }
  }

  openNewModelDialog(client: Client, id: string) {
    const dialog = this.dialog.open(AddModelDialogComponent, {
      width: '600px',
      disableClose: true,
      data: client,
    });

    dialog.afterClosed().subscribe((res: any) => {
      this.router.navigate(['/clients/' + id + '/profile']);
    });
  }

  fixDate(d: Date): Date {
    if (!d) return d;
    const newDate = new Date(d);
    newDate.setHours(12, 0, 0, 0);
    return newDate;
  }

  onSubmit() {
    this.isLoading = true;
    this.clientForm.markAllAsTouched();
    this.clientForm.markAsDirty();

    if (this.isFormInvalid) {
      this.isLoading = false;
      return;
    }

    if (!this.isFormInvalid) {
      var client: Client = this.getClientFormInfo();
      this.clientHttpService
        .addClient(client)
        .pipe(
          filter((res) => !!res),
          map((res) => {
            this.toastr.success('Client created successfully', 'Success!');
            this.openNewModelDialog(res, res.id);
            this.isLoading = false;
          }),
          catchError((err) => {
            console.error(err);
            this.toastr.error('An error occured while saving client', 'Error!');
            this.isLoading = false;
            throw err;
          })
        )
        .subscribe();
      console.log('Form Data:', this.clientForm.value);
    } else {
      console.error('Form is invalid');
      this.isLoading = false;
    }
  }

  // ---------- Typing & auto-format (Client) ----------
  onDobInput(event: any) {
    // Skip if we're handling a paste event
    if (this.isPastingClient) {
      return;
    }

    const input = event.target as HTMLInputElement;
    let value: string = input.value || '';
    const cursorPos = input.selectionStart || 0;

    // Remove all non-digits
    const digits = onlyDigits(value);
    const formatted = formatDigitsToDMY(digits);

    // Only update input if the formatted value is different
    if (input.value !== formatted) {
      // Calculate new cursor position based on digits before cursor
      const beforeCursor = value.substring(0, cursorPos);
      const digitsBeforeCursor = onlyDigits(beforeCursor);
      let newCursorPos = digitsBeforeCursor.length;
      if (digitsBeforeCursor.length > 2) newCursorPos++;
      if (digitsBeforeCursor.length > 4) newCursorPos++;
      newCursorPos = Math.min(newCursorPos, formatted.length);

      // Set the formatted value directly on the input
      input.value = formatted;

      // Update display value for reference
      this.clientDobDisplay = formatted;

      // Restore cursor position immediately
      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    }

    // Update FormControl with formatted string (not Date object)
    const control = this.clientForm.get('dob');
    control?.setValue(formatted, { emitEvent: false });
    this.updateClientAgePreview(digits);
  }

  // ---------- Paste handler (Client) ----------
  onDobPaste(event: ClipboardEvent) {
    this.isPastingClient = true;
    event.preventDefault();
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const pastedText = (
      event.clipboardData || (window as any).clipboardData
    ).getData('text');

    // Extract digits from pasted text
    const digits = onlyDigits(pastedText);
    const formatted = formatDigitsToDMY(digits);

    // Set the formatted value directly
    input.value = formatted;
    this.clientDobDisplay = formatted;

    // Update form control
    const control = this.clientForm.get('dob');
    control?.setValue(formatted, { emitEvent: false });
    this.updateClientAgePreview(digits);

    // Set cursor to end
    requestAnimationFrame(() => {
      input.setSelectionRange(formatted.length, formatted.length);
      this.isPastingClient = false;
    });
  }

  // ---------- Typing & auto-format (Partner) ----------
  onPartnerDobInput(event: any) {
    // Skip if we're handling a paste event
    if (this.isPastingPartner) {
      console.log('[onPartnerDobInput] Skipping - paste in progress');
      return;
    }
    console.log('[onPartnerDobInput] Event triggered');
    const input = event.target as HTMLInputElement;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    const control = partnerGroup.get('dob');
    let value: string = input.value || '';
    const cursorPos = input.selectionStart || 0;
    console.log(
      '[onPartnerDobInput] Initial input.value:',
      value,
      'cursorPos:',
      cursorPos
    );

    // If form control has a Date object, convert it to string format first
    if (control?.value instanceof Date) {
      value = normalizeToDMY(control.value);
      console.log('[onPartnerDobInput] Converted Date to string:', value);
    }

    // Remove all non-digits
    const digits = onlyDigits(value);
    console.log('[onPartnerDobInput] Extracted digits:', digits);
    const formatted = formatDigitsToDMY(digits);
    console.log('[onPartnerDobInput] Formatted value:', formatted);

    // Only update if the formatted value is different
    if (input.value !== formatted) {
      console.log(
        '[onPartnerDobInput] Value changed, updating from:',
        input.value,
        'to:',
        formatted
      );

      // Calculate new cursor position based on digits before cursor
      const beforeCursor = value.substring(0, cursorPos);
      const digitsBeforeCursor = onlyDigits(beforeCursor);
      let newCursorPos = digitsBeforeCursor.length;
      if (digitsBeforeCursor.length > 2) newCursorPos++;
      if (digitsBeforeCursor.length > 4) newCursorPos++;
      newCursorPos = Math.min(newCursorPos, formatted.length);

      console.log('[onPartnerDobInput] Setting input.value to:', formatted);
      input.value = formatted;
      console.log(
        '[onPartnerDobInput] input.value after setting:',
        input.value
      );

      // Restore cursor position
      setTimeout(() => {
        console.log(
          '[onPartnerDobInput] Setting cursor position to:',
          newCursorPos
        );
        if (document.activeElement === input) {
          input.setSelectionRange(newCursorPos, newCursorPos);
          console.log(
            '[onPartnerDobInput] Cursor position set, input.value:',
            input.value
          );
        }
      }, 0);
    } else {
      console.log('[onPartnerDobInput] Value unchanged, no update needed');
    }

    // Update FormControl with formatted string (not Date object)
    control?.setValue(formatted, { emitEvent: false });
    this.updatePartnerAgePreview(digits);
  }

  // ---------- Paste handler (Partner) ----------
  onPartnerDobPaste(event: ClipboardEvent) {
    console.log('[onPartnerDobPaste] Paste event triggered');
    this.isPastingPartner = true;
    event.preventDefault();
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const pastedText = (
      event.clipboardData || (window as any).clipboardData
    ).getData('text');
    console.log('[onPartnerDobPaste] Pasted text:', pastedText);

    // Extract digits from pasted text
    const digits = onlyDigits(pastedText);
    console.log('[onPartnerDobPaste] Extracted digits:', digits);
    const formatted = formatDigitsToDMY(digits);
    console.log('[onPartnerDobPaste] Formatted value:', formatted);

    // Update form control FIRST with formatted string
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    const control = partnerGroup.get('dob');
    console.log(
      '[onPartnerDobPaste] FormControl value before:',
      control?.value
    );
    control?.setValue(formatted, { emitEvent: false });
    console.log(
      '[onPartnerDobPaste] FormControl value after setValue:',
      control?.value
    );

    console.log('[onPartnerDobPaste] Setting input.value to:', formatted);
    input.value = formatted;
    console.log('[onPartnerDobPaste] input.value after setting:', input.value);

    this.updatePartnerAgePreview(digits);
    console.log('[onPartnerDobPaste] Age preview updated:', this.partnerAge);

    setTimeout(() => {
      console.log('[onPartnerDobPaste] Timeout 1 - input.value:', input.value);
      if (input.value !== formatted) {
        console.log(
          '[onPartnerDobPaste] Value was changed, resetting to:',
          formatted
        );
        input.value = formatted;
        control?.setValue(formatted, { emitEvent: false });
      }
      input.setSelectionRange(formatted.length, formatted.length);
      console.log(
        '[onPartnerDobPaste] Timeout 1 - Final input.value:',
        input.value
      );
    }, 0);

    setTimeout(() => {
      console.log(
        '[onPartnerDobPaste] Timeout 2 - Final check input.value:',
        input.value
      );
      this.isPastingPartner = false;
    }, 100);
  }

  onDobBlur() {
    const control = this.clientForm.get('dob');
    const value = control?.value;
    if (!value) {
      return;
    }

    if (value instanceof Date) {
      const normalized = normalizeToDMY(value);
      setTimeout(() => {
        const input = document.querySelector(
          'input[formControlName="dob"]'
        ) as HTMLInputElement;
        if (input) {
          input.value = normalized;
        }
      }, 0);
      this.age = calculateAge(value);
      control?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    const digits = onlyDigits(value);
    const parsed = parseDMYFromDigits(digits);

    if (parsed.ok) {
      control?.setValue(parsed.date, { emitEvent: false });
      setTimeout(() => {
        const input = document.querySelector(
          'input[formControlName="dob"]'
        ) as HTMLInputElement;
        if (input) {
          input.value = parsed.normalized;
        }
      }, 0);
      this.age = parsed.age;
    } else {
      control?.setValue(formatDigitsToDMY(digits), { emitEvent: false });
      this.age = null;
    }

    control?.markAsTouched();
    control?.updateValueAndValidity({ emitEvent: false });
  }

  onPartnerDobBlur() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    const control = partnerGroup.get('dob');
    const value = control?.value;
    if (!value) {
      return;
    }

    if (value instanceof Date) {
      const normalized = normalizeToDMY(value);
      setTimeout(() => {
        const allInputs = document.querySelectorAll(
          'input[formControlName="dob"]'
        );
        const partnerInput = Array.from(allInputs).find((el: any) => {
          const formGroup = el.closest('[formGroupName="partner"]');
          return formGroup !== null;
        }) as HTMLInputElement;
        if (partnerInput) {
          partnerInput.value = normalized;
        }
      }, 0);
      this.partnerAge = calculateAge(value);
      control?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    const digits = onlyDigits(value);
    const parsed = parseDMYFromDigits(digits);

    if (parsed.ok) {
      control?.setValue(parsed.date, { emitEvent: false });
      setTimeout(() => {
        const allInputs = document.querySelectorAll(
          'input[formControlName="dob"]'
        );
        const partnerInput = Array.from(allInputs).find((el: any) => {
          const formGroup = el.closest('[formGroupName="partner"]');
          return formGroup !== null;
        }) as HTMLInputElement;
        if (partnerInput) {
          partnerInput.value = parsed.normalized;
        }
      }, 0);
      this.partnerAge = parsed.age;
    } else {
      control?.setValue(formatDigitsToDMY(digits), { emitEvent: false });
      this.partnerAge = null;
    }

    control?.markAsTouched();
    control?.updateValueAndValidity({ emitEvent: false });
  }

  private updateClientAgePreview(digits: string) {
    const parsed = parseDMYFromDigits(digits);
    this.age = parsed.ok ? parsed.age : null;
  }

  private updatePartnerAgePreview(digits: string) {
    const parsed = parseDMYFromDigits(digits);
    this.partnerAge = parsed.ok ? parsed.age : null;
  }

  get dobError(): string | null {
    const control = this.clientForm.get('dob');
    const err = control?.errors?.['dob'];
    return typeof err === 'string' ? err : null;
  }

  get partnerDobError(): string | null {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    const control = partnerGroup.get('dob');
    const err = control?.errors?.['dob'];
    return typeof err === 'string' ? err : null;
  }

  onCalendarChange(value: Date | null) {
    if (!value) {
      this.age = null;
      this.clientDobDisplay = '';
      this.clientForm.get('dob')?.setValue(null, { emitEvent: false });
      return;
    }
    const formatted = normalizeToDMY(value);
    this.age = calculateAge(value);
    this.clientDobDisplay = formatted;

    this.clientForm.get('dob')?.setValue(value, { emitEvent: false });

    requestAnimationFrame(() => {
      const allInputs = document.querySelectorAll('input[matDatepicker]');
      const clientInput = Array.from(allInputs).find((el: any) => {
        return el.getAttribute('matDatepicker') === 'picker';
      }) as HTMLInputElement;
      if (clientInput) {
        clientInput.value = formatted;
      }
    });
  }

  onPartnerCalendarChange(value: Date | null) {
    if (!value) {
      this.partnerAge = null;
      const partnerGroup = this.clientForm.get('partner') as FormGroup;
      partnerGroup.get('dob')?.setValue(null, { emitEvent: false });
      return;
    }
    const formatted = normalizeToDMY(value);
    this.partnerAge = calculateAge(value);
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    partnerGroup.get('dob')?.setValue(formatted, { emitEvent: false });
    setTimeout(() => {
      const allInputs = document.querySelectorAll(
        'input[formControlName="dob"]'
      );
      const partnerInput = Array.from(allInputs).find((el: any) => {
        const formGroup = el.closest('[formGroupName="partner"]');
        return formGroup !== null;
      }) as HTMLInputElement;
      if (partnerInput) {
        partnerInput.value = formatted;
      }
      partnerGroup.get('dob')?.setValue(value, { emitEvent: false });
    }, 0);
  }

  parseDobToDate(value: string): Date | null {
    if (!value) return null;
    const digits = onlyDigits(value);
    const parsed = parseDMYFromDigits(digits);
    return parsed.ok ? parsed.date : null;
  }
}

const MAX_AGE = 120;

function onlyDigits(s: string | Date | null | undefined): string {
  if (!s) return '';
  if (s instanceof Date) {
    const dd = pad2(s.getDate());
    const mm = pad2(s.getMonth() + 1);
    const yyyy = s.getFullYear();
    return `${dd}${mm}${yyyy}`;
  }
  return String(s).replace(/\D/g, '').slice(0, 8);
}

function formatDigitsToDMY(digits: string): string {
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return [d, m, y].filter(Boolean).join('/');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeToDMY(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(
    date.getMonth() + 1
  )}/${date.getFullYear()}`;
}

function parseDMYFromDigits(
  digits: string
):
  | { ok: true; date: Date; age: number; normalized: string }
  | { ok: false; error: string } {
  if (digits.length !== 8)
    return { ok: false, error: 'Please enter 8 digits (DDMMYYYY)' };

  const dd = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const yyyy = Number(digits.slice(4, 8));

  if (mm < 1 || mm > 12) return { ok: false, error: 'Month must be 01–12' };
  if (dd < 1 || dd > 31) return { ok: false, error: 'Day must be 01–31' };
  if (yyyy < 1800 || yyyy > 9999)
    return { ok: false, error: 'Year looks invalid' };

  const date = new Date(yyyy, mm - 1, dd);
  const isReal =
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd;

  if (!isReal) return { ok: false, error: "That date doesn't exist" };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date > today)
    return { ok: false, error: 'Date cannot be in the future' };

  let age = today.getFullYear() - yyyy;
  const hadBirthdayThisYear =
    today.getMonth() > mm - 1 ||
    (today.getMonth() === mm - 1 && today.getDate() >= dd);
  if (!hadBirthdayThisYear) age -= 1;

  if (age < 0) return { ok: false, error: 'Date cannot be in the future' };
  if (age > MAX_AGE) return { ok: false, error: `Age must be ≤ ${MAX_AGE}` };

  return { ok: true, date, age, normalized: normalizeToDMY(date) };
}

function calculateAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

function dobValidator(
  ctrl: FormControl<string | Date | null>
): ValidationErrors | null {
  const raw = ctrl.value;

  if (raw instanceof Date) {
    const age = calculateAge(raw);
    if (age < 0) return { dob: 'Date cannot be in the future' };
    if (age > MAX_AGE) return { dob: `Age must be ≤ ${MAX_AGE}` };
    return null;
  }

  if (!raw) return null;

  const digits = onlyDigits(raw);
  if (!digits) return null;
  const parsed = parseDMYFromDigits(digits);
  return parsed.ok ? null : { dob: parsed.error };
}

function round2(n: number): number {
  return Math.round(+n * 100) / 100;
}
