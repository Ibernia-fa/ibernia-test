import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_RANGE_SELECTION_STRATEGY, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppBreadcrumbComponent } from 'src/app/layouts/full/shared/breadcrumb/breadcrumb.component';
import { MaterialModule } from 'src/app/material.module';
import { FiveDayRangeSelectionStrategy } from 'src/app/pages/forms/form-elements';

@Component({
  selector: 'app-client-edit',
  imports: [
    AppBreadcrumbComponent,
    MaterialModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule
  ],
  providers: [
    provideNativeDateAdapter(),
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: FiveDayRangeSelectionStrategy,
    },
  ],
  templateUrl: './client-edit.component.html',
  styleUrl: './client-edit.component.scss'
})
export class ClientEditComponent {
  clientForm: FormGroup;
  showPartner: boolean = false;

  constructor(private fb: FormBuilder) {
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

  onSubmit() {
    if (this.clientForm.valid) {
      console.log('Form Data:', this.clientForm.value);
      // Submit form data to the API or service
    } else {
      console.error('Form is invalid');
    }
  }
}
