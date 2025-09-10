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
import { AppBreadcrumbComponent } from 'src/app/layouts/full/shared/breadcrumb/breadcrumb.component';
// import { FiveDayRangeSelectionStrategy } from 'src/app/pages/forms/form-elements';
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
import {MatCheckboxModule} from '@angular/material/checkbox';


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
    MatCheckboxModule
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
  selectedClientCountryISO = CountryISO.UnitedStates
  selectedPartnerCountryISO = CountryISO.UnitedStates


  constructor(
    private fb: FormBuilder,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.clientForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', Validators.required],
      gender: [''],
      country: [''],
      currency: [''],
      email: ['', [Validators.email]],
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

  togglePartnerSection(visible: boolean) {
    this.showPartner = visible;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (visible) {
      partnerGroup.get('lastName')?.setValidators(Validators.required);
      partnerGroup.get('firstName')?.setValidators(Validators.required);

      partnerGroup.get('dob')?.setValidators(Validators.required);
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
    if(this.showPartner) {
      return this.clientForm.controls['firstName'].invalid  || this.clientForm.controls['lastName'].invalid || this.clientForm.controls['dob'].invalid || 
      partnerGroup.controls['firstName'].invalid || partnerGroup.controls['lastName'].invalid || partnerGroup.controls['dob'].invalid
    }
    return this.clientForm.controls['firstName'].invalid || this.clientForm.controls['lastName'].invalid || this.clientForm.controls['dob'].invalid
  }


  getClientFormInfo() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    return {
      id: '',
      clientDetails: {
        birthDate: this.clientForm.controls['dob'].value,
        email: this.clientForm.controls['email'].value,
        gender: this.clientForm.controls['gender'].value,
        country: this.clientForm.controls['country'].value,
        firstName: this.clientForm.controls['firstName'].value,
        lastName: this.clientForm.controls['lastName'].value,

        phone: this.clientForm.controls['phone'].value?.e164Number,
        preferredCurrency: this.clientForm.controls['currency'].value,
      },
      partnerDetail: this.showPartner
        ? {
            birthDate: partnerGroup.controls['dob']?.value,
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
        advisorId: '678c93f32be72db4b9631be1',
        advisorName: 'Matteo',
      },
      lastUpdated: new Date(),
      notes: this.clientForm.controls['notes'].value,
    };
  }

  onAddNewClientClicked() {
    this.clientForm.markAllAsTouched();
    this.clientForm.markAsDirty();
    if (!this.isFormInvalid) {
      var client: Client = this.getClientFormInfo();
      this.clientHttpService
        .addClient(client)
        .pipe(
          filter((res) => !!res),
          map((res) => {
            this.router.navigate(['/clients/' + res.id + '/profile']);
            this.toastr.success('Client created successfully', 'Success!');
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

  openNewModelDialog(client: Client) {
    const dialog = this.dialog.open(AddModelDialogComponent, {
      width: '600px',
      disableClose: true,
      data: client,
    });

    dialog.afterClosed().subscribe((res: any) => {
      console.log('Dialog closed', res);
    });
  }

  onSubmit() {
    this.clientForm.markAllAsTouched();
    this.clientForm.markAsDirty();
    if (!this.isFormInvalid) {
      var client: Client = this.getClientFormInfo();
      this.clientHttpService
        .addClient(client)
        .pipe(
          filter((res) => !!res),
          map((res) => {
            this.toastr.success('Client created successfully', 'Success!');
            this.openNewModelDialog(res);
            // this.router.navigate(['/finances']);
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
