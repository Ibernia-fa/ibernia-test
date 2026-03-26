import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';
import {
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ClientHttpService } from '../services/client-http.service';
import { catchError, filter, map } from 'rxjs';
import { Client } from '../models/client';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { allCountries } from '../models/country';
import { CountryISO } from 'ngx-intl-tel-input';
import { countryDialCodes } from '../models/country-code';
import {
  MAT_CHECKBOX_DEFAULT_OPTIONS,
  MatCheckboxDefaultOptions,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import * as ClientActions from 'src/app/store/client/client.actions';

export const DMY_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

class DmyDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      if (digits.length === 8) {
        const day = Number(digits.slice(0, 2));
        const month = Number(digits.slice(2, 4));
        const year = Number(digits.slice(4, 8));
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        ) {
          return date;
        }
        return null;
      }
    }

    return super.parse(value);
  }
}

@Component({
  selector: 'app-client-edit',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    ToastrModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  providers: [
    ClientHttpService,
    ToastrService,
    {
      provide: MAT_CHECKBOX_DEFAULT_OPTIONS,
      useValue: { clickAction: 'noop' } as MatCheckboxDefaultOptions,
    },
    { provide: DateAdapter, useClass: DmyDateAdapter },
    // {
    //   provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
    //   useClass: FiveDayRangeSelectionStrategy,
    // },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: MAT_DATE_FORMATS, useValue: DMY_FORMATS }
  ],
  templateUrl: './client-edit.component.html',
  styleUrl: './client-edit.component.scss',
})
export class ClientEditComponent {
  clientForm: FormGroup;
  clientId: string;
  showPartner: boolean = false;
  /** True when the API returned a partner with a first name (cannot remove from this screen). */
  hasPersistedPartner = false;
  allCountries = allCountries;
  selectedClientCountryISO = CountryISO.UnitedStates;
  selectedPartnerCountryISO = CountryISO.UnitedStates;
  allControlCountries = countryDialCodes
  user: any;
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
    private authService: AuthService,
    private store: Store,
    private dialogRef: MatDialogRef<ClientEditComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: { clientId: string },
  ) {
    this.user = this.authService.getUserProfile();

    if (!this.user || !this.user?.sub) return;

    this.clientId = this.dialogData.clientId;

    this.clientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', [Validators.required, dobValidator]],
      gender: [''],
      country: [''],
      currency: [''],
      email: ['', [Validators.email, Validators.required]],
      inflationRate: [2.5, [Validators.required, Validators.min(0), Validators.max(100)]],
      phone: [''],
      notes: [''],

      partner: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        dob: ['', [Validators.required, dobValidator]],
        gender: [''],
        currency: [''],
        email: ['', [Validators.email, Validators.required]],
        phone: [''],
      }),
    });

    this.getClient();
    this.togglePartnerSection(false);
  }

  clientCountryValueChange(event: any) {
    const selectedCountry = allCountries.find(country => country.countryName === event);
    this.clientForm.controls['currency'].patchValue(selectedCountry?.currencySymbol);
    this.selectedClientCountryISO = (selectedCountry?.countryCode.toLowerCase() ?? '') as CountryISO;
    // Partner follows client country
    if (this.showPartner) {
      this.selectedPartnerCountryISO = this.selectedClientCountryISO;
      (this.clientForm.get('partner') as FormGroup).controls['currency'].patchValue(selectedCountry?.currencySymbol);
    }
  }

  get isFormInvalid() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    if (this.showPartner) {
      return this.clientForm.controls['firstName'].invalid
        || this.clientForm.controls['lastName'].invalid
        || this.clientForm.controls['dob'].invalid
        || this.clientForm.controls['email'].invalid
        || partnerGroup.controls['firstName'].invalid
        || partnerGroup.controls['lastName'].invalid
        || partnerGroup.controls['dob'].invalid
        || partnerGroup.controls['email'].invalid
    }

    return this.clientForm.controls['firstName'].invalid
      || this.clientForm.controls['lastName'].invalid
      || this.clientForm.controls['dob'].invalid
      || this.clientForm.controls['email'].invalid
  }

  get isSaveDisabled(): boolean {
    return this.isFormInvalid || !this.clientForm.dirty;
  }

  getClient() {
    this.clientHttpService.getClient(this.clientId).pipe(
      map((res) => {

        const clientBirthDate = new Date(res.clientDetails.birthDate);
        this.clientForm.controls['dob'].patchValue(clientBirthDate);
        this.clientDobDisplay = normalizeToDMY(clientBirthDate);
        this.age = calculateAge(clientBirthDate);

        

        //  this.clientForm.get('dob')!
        // .valueChanges
        // .subscribe(value => {
        //   console.log('Client name changed:', value);
        // });

        this.clientForm.controls['firstName'].patchValue(res.clientDetails.firstName);
        this.clientForm.controls['lastName'].patchValue(res.clientDetails.lastName);
        this.clientForm.controls['dob'].patchValue(clientBirthDate);
        this.clientForm.controls['gender'].patchValue(res.clientDetails.gender);
        this.clientForm.controls['country'].patchValue(res.clientDetails.country);
        this.clientForm.controls['currency'].patchValue(res.clientDetails?.preferredCurrency);
        this.clientForm.controls['email'].patchValue(res.clientDetails.email);
        this.clientForm.controls['inflationRate'].patchValue(
          res.clientDetails.inflationRate ?? 2.5
        );

        const index = countryDialCodes.findIndex(x => res.clientDetails?.phone?.slice(1, res.clientDetails.phone.length).startsWith(x.DialCode));
        this.clientForm.controls['phone'].patchValue(res.clientDetails?.phone?.slice(countryDialCodes[index].DialCode.length + 1));
        this.selectedClientCountryISO = countryDialCodes[index]?.ISOCode as CountryISO;

        this.clientForm.controls['notes'].patchValue(res?.notes);

        if (res.partnerDetail?.firstName) {
          this.hasPersistedPartner = true;
          this.togglePartnerSection(true);
          var partnerFormGroup = this.clientForm.get('partner') as FormGroup

          const partnerBirthDate = new Date(res.partnerDetail.birthDate);
          partnerFormGroup.controls['dob'].patchValue(partnerBirthDate);
          this.partnerDobDisplay = normalizeToDMY(partnerBirthDate);
          this.partnerAge = calculateAge(partnerBirthDate);

          

          partnerFormGroup.controls['firstName'].patchValue(res.partnerDetail?.firstName);
          partnerFormGroup.controls['lastName'].patchValue(res.partnerDetail?.lastName);
          // partnerFormGroup.controls['dob'].patchValue(res.partnerDetail?.birthDate);
          partnerFormGroup.controls['email'].patchValue(res.partnerDetail?.email);
          partnerFormGroup.controls['gender'].patchValue(res.partnerDetail?.gender);
          // Partner follows client country; no separate partner country field

          const index = countryDialCodes.findIndex(x => res.partnerDetail?.phone.slice(1, res.partnerDetail?.phone.length).startsWith(x.DialCode));
          partnerFormGroup.controls['phone'].patchValue(res.partnerDetail?.phone.slice(countryDialCodes[index]?.DialCode?.length + 1));
          // Partner follows client country for phone dial code
          this.selectedPartnerCountryISO = this.selectedClientCountryISO;
          partnerFormGroup.controls['currency'].patchValue(res.partnerDetail?.preferredCurrency);
        }

        this.clientForm.updateValueAndValidity();
      })
    ).subscribe()
  }

  onPartnerCheckboxClick() {
    if (this.hasPersistedPartner) {
      return;
    }
    this.togglePartnerSection(!this.showPartner);
  }

  togglePartnerSection(visible: boolean) {
    const hadPartnerVisible = this.showPartner;
    this.showPartner = visible;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (visible) {
      partnerGroup.get('firstName')?.setValidators(Validators.required);
      partnerGroup.get('lastName')?.setValidators(Validators.required);
      partnerGroup.get('dob')?.setValidators(Validators.required);
      partnerGroup.get('email')?.setValidators(Validators.required);
      // Partner follows client country and currency
      const clientCountry = this.clientForm.controls['country']?.value;
      const clientCurrency = this.clientForm.controls['currency']?.value;
      if (clientCountry) {
        const selectedCountry = allCountries.find(c => c.countryName === clientCountry);
        if (selectedCountry) {
          partnerGroup.controls['currency'].patchValue(clientCurrency ?? selectedCountry.currencySymbol);
          this.selectedPartnerCountryISO = (selectedCountry.countryCode.toLowerCase() ?? '') as CountryISO;
        }
      }

      // const partnerDob = partnerGroup.get('dob')?.value;
      // if (partnerDob instanceof Date) {
      //   this.partnerDobDisplay = normalizeToDMY(partnerDob);
      //   this.partnerAge = calculateAge(partnerDob);

      //   setTimeout(() => {
      //     const allInputs = document.querySelectorAll('input[matDatepicker]');
      //     const partnerInput = Array.from(allInputs).find((el: any) => 
      //       el.closest('[formGroupName="partnerPicker"]')
      //     ) as HTMLInputElement;
      //     if (partnerInput) {
      //       partnerInput.value = this.partnerDobDisplay;
      //     }
      //   }, 0);
      // }
    } else {
      partnerGroup.reset();
      // this.partnerDobDisplay = '';
      // this.partnerAge = null;
      Object.keys(partnerGroup.controls).forEach((key) => {
        partnerGroup.get(key)?.clearValidators();
        partnerGroup.get(key)?.updateValueAndValidity();
      });
      if (hadPartnerVisible) {
        this.clientForm.markAsDirty();
      }
    }
  }

  fixDate(d: Date): Date {
    if (!d) return d;
    const newDate = new Date(d);
    newDate.setHours(12, 0, 0, 0);
    return newDate;
  }

  onSubmit() {
    this.clientForm.markAllAsTouched();
    this.clientForm.markAsDirty();
    if (!this.isFormInvalid) {
      const partnerGroup = this.clientForm.get('partner') as FormGroup;
      var client: Client = {
        id: this.clientId,
        clientDetails: {
          firstName: this.clientForm.controls['firstName'].value,
          lastName: this.clientForm.controls['lastName'].value,
          birthDate: this.fixDate(this.clientForm.controls['dob'].value),
          country: this.clientForm.controls['country'].value,
          preferredCurrency: this.clientForm.controls['currency'].value,
          email: this.clientForm.controls['email'].value,
          gender: this.clientForm.controls['gender'].value,
          phone: this.clientForm.controls['phone'].value?.e164Number,
          inflationRate: round2(this.clientForm.controls['inflationRate'].value),
        },
        partnerDetail: this.showPartner || this.hasPersistedPartner ? {
          firstName: partnerGroup.controls['firstName']?.value,
          lastName: partnerGroup.controls['lastName']?.value,
          birthDate: this.fixDate(partnerGroup.controls['dob']?.value),
          email: partnerGroup.controls['email']?.value,
          gender: partnerGroup.controls['gender']?.value,
          country: this.clientForm.controls['country']?.value,
          phone: partnerGroup.controls['phone']?.value?.e164Number,
          inflationRate: 0,
          preferredCurrency:
            partnerGroup.controls['currency']?.value,
        } : null,
        financialAdvisor: {
          advisorId: this.user.sub,
          advisorName: this.user.given_name,
        },
        lastUpdated: new Date(),
        notes: this.clientForm.controls['notes'].value,
      };
      this.clientHttpService
        .updateClient(client)
        .pipe(
          filter((res) => !!res),
          map(() => {
            this.store.dispatch(ClientActions.selectClient({ client }));
            this.toastr.success('Client updated successfully', 'Success!');
            this.dialogRef.close({ action: 'updated', client });
          }),
          catchError((err) => {
            console.error(err);
            this.toastr.error('An error occured while saving client', 'Error!');
            throw err;
          })
        )
        .subscribe();
    } else {
      console.error('Form is invalid');
    }
  }

  // ---------- Typing & auto-format (Client) ----------
  onDobInput(event: any) {
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
    this.partnerDobDisplay = formatted;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    partnerGroup.get('dob')?.setValue(value, { emitEvent: false });

    requestAnimationFrame(() => {
      const allInputs = document.querySelectorAll('input[matDatepicker]');
      const partnerInput = Array.from(allInputs).find((el: any) => {
        return el.getAttribute('matDatepicker') === 'partnerPicker';
      }) as HTMLInputElement;
      if (partnerInput) {
        partnerInput.value = formatted;
      }
    });
  }

  parseDobToDate(value: string): Date | null {
    if (!value) return null;
    const digits = onlyDigits(value);
    const parsed = parseDMYFromDigits(digits);
    return parsed.ok ? parsed.date : null;
  }

  onDobTyping(inputEl: HTMLInputElement): void {
    const raw = inputEl.value;
    const cursor = inputEl.selectionStart ?? raw.length;

    const digitsBeforeCursor = raw
      .slice(0, cursor)
      .replace(/\D/g, '')
      .length;

    const digits = onlyDigits(raw);
    let formatted = formatDigitsToDMY(digits);

    if (formatted !== raw) {
      inputEl.value = formatted;

      let newCursor = digitsBeforeCursor;
      if (digitsBeforeCursor > 2) newCursor += 1;
      if (digitsBeforeCursor > 4) newCursor += 1;

      newCursor = Math.min(newCursor, formatted.length);

      requestAnimationFrame(() => {
        if (document.activeElement === inputEl) {
          inputEl.setSelectionRange(newCursor, newCursor);
        }
      });
    }

    this.updateClientAgePreview(digits);
  }

  onPartnerDobTyping(inputEl: HTMLInputElement): void {
    const raw = inputEl.value;
    const cursor = inputEl.selectionStart ?? raw.length;

    const digitsBeforeCursor = raw
      .slice(0, cursor)
      .replace(/\D/g, '')
      .length;

    const digits = onlyDigits(raw);
    let formatted = formatDigitsToDMY(digits);

    if (formatted !== raw) {
      inputEl.value = formatted;

      let newCursor = digitsBeforeCursor;
      if (digitsBeforeCursor > 2) newCursor += 1;
      if (digitsBeforeCursor > 4) newCursor += 1;

      newCursor = Math.min(newCursor, formatted.length);

      requestAnimationFrame(() => {
        if (document.activeElement === inputEl) {
          inputEl.setSelectionRange(newCursor, newCursor);
        }
      });
    }

    this.updatePartnerAgePreview(digits);
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



/** helpers */
function round2(n: number): number {
  return Math.round((+n) * 100) / 100;
}

