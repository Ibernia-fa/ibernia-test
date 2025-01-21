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
import { MaterialModule } from 'src/app/material.module';
import { FiveDayRangeSelectionStrategy } from 'src/app/pages/forms/form-elements';
import { ClientHttpService } from '../client-http.service';
import { catchError, filter, map, switchMap } from 'rxjs';
import { Client } from '../client';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-client-edit',
  imports: [
    AppBreadcrumbComponent,
    MaterialModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    ToastrModule,
    RouterModule,
    MatSelectModule
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

  constructor(
    private fb: FormBuilder,
    private clientHttpService: ClientHttpService,
    private router: Router,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute
  ) {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      dob: ['', Validators.required],
      gender: [''],
      currency: [''],
      email: ['', [Validators.email]],
      phone: [''],
      notes: [''],
      partner: this.fb.group({
        name: [''],
        dob: [''],
        gender: [''],
        currency: [''],
        email: ['', [Validators.email]],
        phone: [''],
      }),
    });

    this.getClient();
    this.togglePartnerSection(false); // Ensure partner section validations are off initially
  }

  getClient() {
    this.activatedRoute.params.pipe(
      switchMap((params) => {
        this.clientId = params['id']
        return this.clientHttpService.getClient(this.clientId);
      }),
      map((res) => {
        this.clientForm.controls['dob'].patchValue(res.clientDetails.birthDate);
        this.clientForm.controls['email'].patchValue(res.clientDetails.email);
        this.clientForm.controls['gender'].patchValue(res.clientDetails.gender);
        this.clientForm.controls['name'].patchValue(res.clientDetails.name);
        this.clientForm.controls['phone'].patchValue(res.clientDetails.phone);
        this.clientForm.controls['currency'].patchValue(res.clientDetails.preferredCurrency);
        this.clientForm.controls['notes'].patchValue(res.notes);
        if(res.partnerDetail?.name) {
          this.togglePartnerSection(true);
          var partnerFormGroup = this.clientForm.get('partner') as FormGroup
          partnerFormGroup.controls['dob'].patchValue(res.partnerDetail.birthDate);
          partnerFormGroup.controls['email'].patchValue(res.partnerDetail.email);
          partnerFormGroup.controls['gender'].patchValue(res.partnerDetail.gender);
          partnerFormGroup.controls['name'].patchValue(res.partnerDetail.name);
          partnerFormGroup.controls['phone'].patchValue(res.partnerDetail.phone);
          partnerFormGroup.controls['currency'].patchValue(res.partnerDetail.preferredCurrency);
        }

        this.clientForm.updateValueAndValidity();
        
      })
    ).subscribe()
  }

  togglePartnerSection(visible: boolean) {
    this.showPartner = visible;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (visible) {
      partnerGroup.get('name')?.setValidators(Validators.required);
      partnerGroup.get('dob')?.setValidators(Validators.required);
    } else {
      partnerGroup.reset();
      Object.keys(partnerGroup.controls).forEach((key) => {
        partnerGroup.get(key)?.clearValidators();
        partnerGroup.get(key)?.updateValueAndValidity();
      });
    }
  }

  onSubmit() {
    if (this.clientForm.valid) {
      const partnerGroup = this.clientForm.get('partner') as FormGroup;
      var client: Client = {
        id: this.clientId,
        clientDetails: {
          birthDate: this.clientForm.controls['dob'].value,
          email: this.clientForm.controls['email'].value,
          gender: this.clientForm.controls['gender'].value,
          name: this.clientForm.controls['name'].value,
          phone: this.clientForm.controls['phone'].value,
          preferredCurrency: this.clientForm.controls['currency'].value,
        },
        partnerDetail: this.showPartner ? {
          birthDate: partnerGroup.controls['dob']?.value,
          email: partnerGroup.controls['email']?.value,
          gender: partnerGroup.controls['gender']?.value,
          name: partnerGroup.controls['name']?.value,
          phone: partnerGroup.controls['phone']?.value,
          preferredCurrency:
            partnerGroup.controls['currency']?.value,
        } : null,
        financialAdvisor: {
          advisorId: '678c93f32be72db4b9631be1',
          advisorName: 'Matteo',
        },
        lastUpdated: new Date(),
        notes: this.clientForm.controls['notes'].value,
      };
      this.clientHttpService
        .updateClient(client)
        .pipe(
          filter((res) => !!res),
          map((res) => {
            this.router.navigate(['/clients']);
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
