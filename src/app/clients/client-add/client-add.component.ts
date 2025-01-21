import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_RANGE_SELECTION_STRATEGY, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppBreadcrumbComponent } from 'src/app/layouts/full/shared/breadcrumb/breadcrumb.component';
import { MaterialModule } from 'src/app/material.module';
import { FiveDayRangeSelectionStrategy } from 'src/app/pages/forms/form-elements';
import { ClientHttpService } from '../client-http.service';
import { Client } from '../client';
import { catchError, filter, map } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-client-add',
  imports: [
    AppBreadcrumbComponent,
    MaterialModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    RouterModule,
    ToastrModule,
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
  templateUrl: './client-add.component.html',
  styleUrl: './client-add.component.scss'
})
export class ClientAddComponent {
  clientForm: FormGroup;
  showPartner: boolean = false;

  constructor(private fb: FormBuilder,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService,
  private router: Router) {
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
        phone: ['']
      })
    });

    this.togglePartnerSection(false); // Ensure partner section validations are off initially
  }

  togglePartnerSection(visible: boolean) {
    this.showPartner = visible;
    const partnerGroup = this.clientForm.get('partner') as FormGroup;

    if (visible) {
      partnerGroup.get('name')?.setValidators(Validators.required);
      partnerGroup.get('dob')?.setValidators(Validators.required);
    } else {
      partnerGroup.reset();
      Object.keys(partnerGroup.controls).forEach(key => {
        partnerGroup.get(key)?.clearValidators();
        partnerGroup.get(key)?.updateValueAndValidity();
      });
    }
  }

  getClientFormInfo() {
    const partnerGroup = this.clientForm.get('partner') as FormGroup;
    return {
      id: '',
      clientDetails: {
        birthDate: this.clientForm.controls['dob'].value,
        email: this.clientForm.controls['email'].value,
        gender: this.clientForm.controls['gender'].value,
        name: this.clientForm.controls['name'].value,
        phone: this.clientForm.controls['phone'].value,
        preferredCurrency: this.clientForm.controls['currency'].value
      },
      partnerDetail: this.showPartner ? {
        birthDate: partnerGroup.controls['dob']?.value,
        email: partnerGroup.controls['email']?.value,
        gender: partnerGroup.controls['gender']?.value,
        name: partnerGroup.controls['name']?.value,
        phone: partnerGroup.controls['phone']?.value,
        preferredCurrency: partnerGroup.controls['currency']?.value
      } : null,
      financialAdvisor: {
        advisorId: "678c93f32be72db4b9631be1",
        advisorName: "Matteo"
      },
      lastUpdated: new Date(),
      notes: this.clientForm.controls['notes'].value
    } 
  }

  onAddNewClientClicked() {
    if (this.clientForm.valid) {
      var client: Client = this.getClientFormInfo()
      this.clientHttpService.addClient(client).pipe(
        filter((res) => !!res),
        map((res) => {
          this.router.navigate(['/clients/' + res.id +'/profile']);
          this.toastr.success('Client created successfully', 'Success!');
        }),
        catchError((err) => {
          console.error(err);
          this.toastr.error("An error occured while saving client", "Error!");
          throw err
        })
      )
      .subscribe();
      console.log('Form Data:', this.clientForm.value);
      // Submit form data to the API or service
    } else {
      console.error('Form is invalid');
    }
  }

  onSubmit() {
    if (this.clientForm.valid) {
      var client: Client = this.getClientFormInfo()
      this.clientHttpService.addClient(client).pipe(
        filter((res) => !!res),
        map((res) => {
          this.router.navigate(['/finances']);
          this.toastr.success('Client created successfully', 'Success!');
        }),
        catchError((err) => {
          console.error(err);
          this.toastr.error("An error occured while saving client", "Error!");
          throw err
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
