import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AppBreadcrumbComponent } from 'src/app/layouts/full/shared/breadcrumb/breadcrumb.component';
import { ClientHttpService } from '../services/client-http.service';
import { catchError, filter, map, switchMap } from 'rxjs';
import { Client } from '../models/client';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { allCountries } from '../models/country';
import { CountryISO, NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { countryDialCodes } from '../models/country-code';
import { FiveDayRangeSelectionStrategy } from 'src/app/core/five-day-range-selection-strategy';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';


@Component({
  selector: 'app-client-edit',
  imports: [
    AppBreadcrumbComponent,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    ToastrModule,
    RouterModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    NgxIntlTelInputModule,
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
  templateUrl: './client-edit.component.html',
  styleUrl: './client-edit.component.scss',
})
export class ClientEditComponent {
  clientForm: FormGroup;
  clientId: string;
  showPartner: boolean = false;
  allCountries = allCountries;
  selectedClientCountryISO = CountryISO.UnitedStates;
  selectedPartnerCountryISO = CountryISO.UnitedStates;
  allControlCountries= countryDialCodes
  user: any;

  constructor(
    private fb: FormBuilder,
    private clientHttpService: ClientHttpService,
    private router: Router,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private location: Location
  ) {
    this.user = this.authService.getUserProfile();

    if (!this.user || !this.user?.sub) return;

    this.clientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', Validators.required],
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
        dob: [''],
        gender: [''],
        country: [''],
        currency: [''],
        email: ['', [Validators.email]],
        phone: [''],
      }),
    });

    this.getClient();
    this.togglePartnerSection(false); // Ensure partner section validations are off initially
  }

  clientCountryValueChange(event: any) {
    const selectedCountry = allCountries.find(country => country.countryName === event);
    this.clientForm.controls['currency'].patchValue(selectedCountry?.currencySymbol);
    this.selectedClientCountryISO = (selectedCountry?.countryCode.toLowerCase() ?? '') as CountryISO
  }
  
  partnerCountryValueChange(event: any) {
    const selectedCountry = allCountries.find(country => country.countryName === event);
    (this.clientForm.get('partner') as FormGroup).controls['currency'].patchValue(selectedCountry?.currencySymbol);
    this.selectedPartnerCountryISO = (selectedCountry?.countryCode.toLowerCase() ?? '') as CountryISO
  }

  get isFormInvalid() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    if(this.showPartner) {
      return this.clientForm.controls['lastName'].invalid 
        || this.clientForm.controls['firstName'].invalid 
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

  getClient() {
    this.activatedRoute.params.pipe(
      switchMap((params) => {
        this.clientId = params['id']
        return this.clientHttpService.getClient(this.clientId);
      }),
      map((res) => {
        console.log('res', res);
        this.clientForm.controls['dob'].patchValue(res.clientDetails.birthDate);
        this.clientForm.controls['email'].patchValue(res.clientDetails.email);
        this.clientForm.controls['gender'].patchValue(res.clientDetails.gender);
        this.clientForm.controls['country'].patchValue(res.clientDetails.country);
        this.clientForm.controls['firstName'].patchValue(res.clientDetails.firstName);
        this.clientForm.controls['lastName'].patchValue(res.clientDetails.lastName);
          this.clientForm.controls['inflationRate'].patchValue(
            res.clientDetails.inflationRate ?? 2.5
          );
        const index = countryDialCodes.findIndex(x => res.clientDetails?.phone?.slice(1, res.clientDetails.phone.length).startsWith(x.DialCode));
        this.clientForm.controls['phone'].patchValue(res.clientDetails?.phone?.slice(countryDialCodes[index].DialCode.length + 1));
        this.selectedClientCountryISO = countryDialCodes[index]?.ISOCode as CountryISO;
        
        this.clientForm.controls['currency'].patchValue(res.clientDetails?.preferredCurrency);
        this.clientForm.controls['notes'].patchValue(res?.notes);
        if(res.partnerDetail?.firstName) {
          this.togglePartnerSection(true);
          var partnerFormGroup = this.clientForm.get('partner') as FormGroup
          partnerFormGroup.controls['dob'].patchValue(res.partnerDetail?.birthDate);
          partnerFormGroup.controls['email'].patchValue(res.partnerDetail?.email);
          partnerFormGroup.controls['gender'].patchValue(res.partnerDetail?.gender);
          partnerFormGroup.controls['country'].patchValue(res.partnerDetail?.country);
          partnerFormGroup.controls['firstName'].patchValue(res.partnerDetail?.firstName);
          partnerFormGroup.controls['lastName'].patchValue(res.partnerDetail?.lastName);

          const index = countryDialCodes.findIndex(x => res.partnerDetail?.phone.slice(1, res.partnerDetail?.phone.length).startsWith(x.DialCode));
          partnerFormGroup.controls['phone'].patchValue(res.partnerDetail?.phone.slice(countryDialCodes[index]?.DialCode?.length + 1));
          this.selectedPartnerCountryISO = countryDialCodes[index].ISOCode as CountryISO;
          partnerFormGroup.controls['currency'].patchValue(res.partnerDetail?.preferredCurrency);
        }

        this.clientForm.updateValueAndValidity();
        
      })
    ).subscribe()
  }

  togglePartnerSection(visible: boolean) {
    this.showPartner = visible;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (visible) {
      partnerGroup.get('firstName')?.setValidators(Validators.required);
      partnerGroup.get('lastName')?.setValidators(Validators.required);
      partnerGroup.get('dob')?.setValidators(Validators.required);
      partnerGroup.get('email')?.setValidators(Validators.required);
    } else {
      partnerGroup.reset();
      Object.keys(partnerGroup.controls).forEach((key) => {
        partnerGroup.get(key)?.clearValidators();
        partnerGroup.get(key)?.updateValueAndValidity();
      });
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
          birthDate: this.fixDate(this.clientForm.controls['dob'].value),
          email: this.clientForm.controls['email'].value,
          gender: this.clientForm.controls['gender'].value,
          country: this.clientForm.controls['country'].value,
          firstName: this.clientForm.controls['firstName'].value,
          lastName: this.clientForm.controls['lastName'].value,

          phone: this.clientForm.controls['phone'].value?.e164Number,
          preferredCurrency: this.clientForm.controls['currency'].value,
          inflationRate: round2(this.clientForm.controls['inflationRate'].value),
        },
        partnerDetail: this.showPartner ? {
          birthDate: this.fixDate(partnerGroup.controls['dob']?.value),
          email: partnerGroup.controls['email']?.value,
          gender: partnerGroup.controls['gender']?.value,
          country: partnerGroup.controls['country']?.value,
          firstName: partnerGroup.controls['firstName']?.value,
          lastName: partnerGroup.controls['lastName']?.value,
          phone: partnerGroup.controls['phone']?.value?.e164Number,
          inflationRate:0,
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
          map((res) => {
            this.location.back();
            this.toastr.success('Client updated successfully', 'Success!');
          }),
          catchError((err) => {
            console.error(err);
            this.toastr.error('An error occured while saving client', 'Error!');
            throw err;
          })
        )
        .subscribe();
      console.log('Form Data:', this.clientForm.value);
      // Submit form data to the API or service
    } else {
      console.error('Form is invalid');
    }
  }

}

/** helpers */
function round2(n: number): number {
  return Math.round((+n) * 100) / 100;
}