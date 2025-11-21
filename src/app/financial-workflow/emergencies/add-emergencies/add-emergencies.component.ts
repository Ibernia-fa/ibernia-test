import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

// Replace with your actual service path
import { EmergenciesHttpService } from '../services/emergencies-http.service';

export interface EmergencyLookupData {
  // lookups
  emergencyTypes: Array<{ id: number; name: string; description: string }>;
  policyStatuses: Array<{ id: number; name: string; description: string }>;
  coverageAdequacies: Array<{ id: number; name: string; description: string }>;
  willStatuses: Array<{ id: number; name: string; description: string }>;

  // routing context
  client: { id: string; name?: string };
  cashflow: { id: string; name?: string };
}

@Component({
  selector: 'app-add-emergencies',
  standalone: true,
  templateUrl: './add-emergencies.component.html',
  styleUrl: './add-emergencies.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule
  ]
})
export class AddEmergenciesComponent {
  form: FormGroup;

  // lookups bound in the template
  emergencyTypes = this.data.emergencyTypes ?? [];
  policyStatuses = this.data.policyStatuses ?? [];
  coverageAdequacies = this.data.coverageAdequacies ?? [];
  willStatuses = this.data.willStatuses ?? [];

  constructor(
    private fb: FormBuilder,
    private api: EmergenciesHttpService,
    private dialogRef: MatDialogRef<AddEmergenciesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmergencyLookupData
  ) {
    this.form = this.fb.group({
      // basic
      name: ['', Validators.required],
      type: [this.emergencyTypes?.[0]?.id ?? null, Validators.required], // 1=Insurance, 2=Will (per your model)
      iconUrl: [''],
      isHidden: [false],

      // insurance-only fields
      policyStatus: [this.policyStatuses?.[0]?.id ?? null],
      coverage: [0],
      coverageAdequacy: [this.coverageAdequacies?.[0]?.id ?? null],
      insuranceCost: this.fb.group({
        currencySymbol: [''],
        amount: [0],
        cycle: this.fb.group({
          id: [''],
          description: ['']
        })
      }),

      // will-only field
      willStatus: [this.willStatuses?.[0]?.id ?? null]
    });

    // Optional: clean up fields when switching type
    this.form.get('type')?.valueChanges.subscribe((t: number) => {
      if (t === 1) {
        // Insurance
        this.form.get('policyStatus')?.enable();
        this.form.get('coverage')?.enable();
        this.form.get('coverageAdequacy')?.enable();
        this.form.get('insuranceCost')?.enable();
        this.form.get('willStatus')?.disable();
      } else if (t === 2) {
        // Will
        this.form.get('policyStatus')?.disable();
        this.form.get('coverage')?.disable();
        this.form.get('coverageAdequacy')?.disable();
        this.form.get('insuranceCost')?.disable();
        this.form.get('willStatus')?.enable();
      }
    });

    // initialize enable/disable state
    const t = this.form.get('type')?.value;
    if (t === 2) {
      this.form.get('policyStatus')?.disable();
      this.form.get('coverage')?.disable();
      this.form.get('coverageAdequacy')?.disable();
      this.form.get('insuranceCost')?.disable();
      this.form.get('willStatus')?.enable();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Build payload to match your POST schema
    const v = this.form.value;
    const payload = {
      id: '', // let backend generate
      type: v.type,                          // 1 or 2
      policyStatus: v.type === 1 ? v.policyStatus : 1, // backend needs a value; default 1 when will
      insuranceCost: v.type === 1 ? v.insuranceCost : { currencySymbol: null, amount: 0, cycle: null },
      coverage: v.type === 1 ? Number(v.coverage ?? 0) : 0,
      coverageAdequacy: v.type === 1 ? v.coverageAdequacy : 1,
      willStatus: v.type === 2 ? v.willStatus : 1,
      name: v.name,
      iconUrl: v.iconUrl,
      isHidden: !!v.isHidden,
      client: {
        id: this.data.client.id,
        name: this.data.client.name ?? ''
      },
      cashflow: {
        id: this.data.cashflow.id,
        name: this.data.cashflow.name ?? ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.api.createEmergency(payload).subscribe({
      next: (created) => this.dialogRef.close({ status: 'Success', emergency: created }),
      error: (err) => this.dialogRef.close({ status: 'Error', error: err })
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
