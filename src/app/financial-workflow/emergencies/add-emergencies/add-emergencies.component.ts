import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ToastrService } from 'ngx-toastr';

import {
  Emergency,
  CreateEmergencyRequest,
  LookupItem,
  Money,
} from '../models/emergencies.model';

import { EmergenciesHttpService } from '../services/emergencies-http.service';
import { allCountries } from 'src/app/clients/models/country';

// export interface AddEmergenciesDialogData {
//   emergencyTypes: LookupItem[];        // from stats.emergencyTypes
//   policyStatuses: LookupItem[];        // from stats.policyStatuses
//   coverageAdequacies: LookupItem[];    // from stats.coverageAdequacies
//   willStatuses: LookupItem[];          // from stats.willStatuses (not used yet in UI)
//   insuranceCostTemplate?: Money;       // from stats.insuranceCost
//   client?: { id: string; name: string };
//   cashflow?: { id: string; name: string };
//   defaultTypeId?: number;              // optional: Insurance = 1, Will = 2, etc.
// }

export interface AddEmergencyDialogData {
  mode: 'add' | 'edit';
  emergency?: Emergency;
  emergencyTypes: LookupItem[];
  policyStatuses: LookupItem[];
  coverageAdequacies: LookupItem[];
  willStatuses: LookupItem[];
  insuranceCostTemplate?: Money;
  client?: { id: string; name: string };
  cashflow?: { id: string; name: string };
    clientPreferredCurrency?: string;
  cycles?: { id: string; description: string }[]; 
}

@Component({
  selector: 'app-add-emergencies',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './add-emergencies.component.html',
  styleUrl: './add-emergencies.component.scss',
})
export class AddEmergenciesComponent {
  form: FormGroup;

  policyStatuses: LookupItem[] = [];
  coverageAdequacies: LookupItem[] = [];
  emergencyTypes: LookupItem[] = [];
  willStatuses: LookupItem[] = [];
  insuranceCostTemplate?: Money;
  countries = allCountries;

  // used for display
insuranceCycles: { id: string; description: string }[] = [];
currencySymbol: string;

  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddEmergenciesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEmergencyDialogData,
    private fb: FormBuilder,
    private emergenciesHttp: EmergenciesHttpService,
    private toastr: ToastrService
  ) {
    this.emergencyTypes = data.emergencyTypes ?? [];
    this.policyStatuses = data.policyStatuses ?? [];
    this.coverageAdequacies = data.coverageAdequacies ?? [];
    this.willStatuses = data.willStatuses ?? [];
    this.insuranceCostTemplate = data.insuranceCostTemplate;
this.currencySymbol =
  data.clientPreferredCurrency ?? '';
    this.insuranceCycles = data.cycles ?? [];
    this.form = this.fb.group({
      name: ['', Validators.required],
      policyStatus: [null, Validators.required],
      currencySymbol: [this.currencySymbol, Validators.required],
      insuranceAmount: [
        this.insuranceCostTemplate?.amount ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      insuranceCycleId: [
        this.insuranceCycles[0].id,
        Validators.required,
      ],
      coverageAdequacy: [null, Validators.required],
      coverage: [0, [Validators.required, Validators.min(0)]],
    });

    this.form.get('currencySymbol')?.disable();

  if (this.data.mode === 'edit' && this.data.emergency) {
    this.patchForm(this.data.emergency);
  }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private patchForm(e: Emergency): void {
  // this.form.patchValue({
  //   type: e.type || 1,
  //   policyStatus: e.policyStatus,
  //   name: e.name,
  //   insuranceAmount: e.insuranceCost?.amount ?? 0,
  //   insuranceCycleId: e.insuranceCost?.cycle?.id ?? 'annual',
  //   coverage: e.coverage ?? 0,
  //   coverageAdequacy: e.coverageAdequacy ?? 1,
  //   willStatus: e.willStatus ?? 1,
  //   isHidden: e.isHidden ?? false,
  // });
    this.form.patchValue({
    name: e.name,
    policyStatus: e.policyStatus,
    insuranceAmount: e.insuranceCost?.amount ?? 0,
    insuranceCycleId: e.insuranceCost?.cycle?.id ?? 'annual',
    coverage: e.coverage ?? 0,
    coverageAdequacy: e.coverageAdequacy ?? 1,
    currencySymbol:e.insuranceCost.currencySymbol
  });
}


//   save(): void {
//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     const v = this.form.value;
//     const now = new Date().toISOString();

//     const selectedCycle =
//       this.insuranceCycles.find(c => c.id === v.insuranceCycleId) ??
//       this.insuranceCycles[0];

//     // Choose a type; for now default to Insurance (1) unless caller passes something else
//     const typeId = this.data.defaultTypeId ?? 1;
//   const form = this.form.value; 
//  const payload: CreateEmergencyRequest = {
//   type: form.type,
//   policyStatus: form.policyStatus,
//   insuranceCost: {
//     currencySymbol: '£',
//     amount: form.insuranceAmount,
//     cycle: {
//       id: form.insuranceCycleId,
//       description: form.insuranceCycleDescription,
//     },
//   },
//   coverage: form.coverage,
//   coverageAdequacy: form.coverageAdequacy,
//   willStatus: form.type === 2 ? form.willStatus : 1,
//   name: form.name,
//   iconUrl: '',          // or some default
//   isHidden: false,      // or from a checkbox later
//   client: {
//     id: this.data.client?.id ?? '', 
//     name: this.data.client?.name ?? '',
//   },
//   cashflow: {
//     id: this.data.cashflow?.id  ?? '',
//     name: this.data.cashflow?.name ?? '',
//   },
// };


//     this.isSaving = true;
//     this.emergenciesHttp.createEmergency(payload).subscribe({
//       next: (res) => {
//         this.isSaving = false;
//         this.toastr.success('Cover added successfully', 'Success');
//         this.dialogRef.close({ status: 'Success', emergency: res });
//       },
//       error: (err) => {
//         console.error(err);
//         this.isSaving = false;
//         this.toastr.error('Failed to add cover', 'Error');
//       },
//     });
//   }

// onSave(): void {
//   if (this.form.invalid) {
//     this.form.markAllAsTouched();
//     return;
//   }

//   const form = this.form.value;
//   const existing = this.data.emergency;

//   const nowIso = new Date().toISOString();
//   const payload: CreateEmergencyRequest = {
//      id: existing?.id ?? '',
//     type: form.type,
//     policyStatus: form.policyStatus,
//     insuranceCost: {
//       currencySymbol: '£', // or from template / user preference
//       amount: form.insuranceAmount,
//       cycle: {
//         id: form.insuranceCycleId,
//         description: null,
//       }
//     },
//     coverage: form.coverage,
//     coverageAdequacy: form.coverageAdequacy,
//     willStatus: form.type === 2 ? form.willStatus : 1,
//     name: form.name,
//     iconUrl: '',
//     isHidden: form.isHidden ?? false,
//     client: this.data.client ?? { id: '', name: '' },
//     cashflow: this.data.cashflow ?? { id: '', name: '' },
//   };

//   if (this.data.mode === 'edit' && this.data.emergency) {
//     // TODO: call update API
//     // this.emergenciesHttp.updateEmergency(this.data.emergency.id, payload)...
//         this.emergenciesHttp.updateEmergency(payload).subscribe({
//       next: (res: Emergency) => {
//         this.dialogRef.close({ status: 'Success', emergency: res });
//       },
//       error: (err) => {
//         console.error(err);
//         // optional: show toastr.error
//       },
//     });
//   } else {
//     // create
//     this.emergenciesHttp.createEmergency(payload).subscribe({
//       next: (res) => this.dialogRef.close({ status: 'Success', emergency: res }),
//       error: (err) => console.error(err),
//     });
//   }
// }


onSave(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const form = this.form.getRawValue(); 
  const existing = this.data.emergency;
  const nowIso = new Date().toISOString();

  // derive type / will / hidden from existing for now
  const type = existing?.type ?? 1;              // 1 = Insurance default
  const willStatus = existing?.willStatus ?? 1;  // default Done
  const isHidden = existing?.isHidden ?? false;

  // const insuranceCost: Money = {
  //   currencySymbol: this.currencySymbol,
  //   amount: form.insuranceAmount,
  //   cycle: {
  //     id: form.insuranceCycleId,
  //     description: null,
  //   },
  // };

  const insuranceCost: Money = {
  currencySymbol: form.currencySymbol,  // now comes from control
  amount: form.insuranceAmount,
  cycle: {
    id: form.insuranceCycleId,
    description: null,
  },
};

  // 🔹 CREATE payload (no id, no createdAt/updatedAt)
  const createPayload: CreateEmergencyRequest = {
    type,
    policyStatus: form.policyStatus,
    insuranceCost,
    coverage: form.coverage,
    coverageAdequacy: form.coverageAdequacy,
    willStatus: type === 2 ? willStatus : 1,
    name: form.name,
    iconUrl: this.resolveIconUrl(type),
    isHidden,
    client: this.data.client ?? { id: '', name: '' },
    cashflow: this.data.cashflow ?? { id: '', name: '' },
  };

  if (this.data.mode === 'edit' && existing) {
    // 🔹 UPDATE payload: full Emergency, includes id + timestamps
    const updatePayload: Emergency = {
      id: existing.id,
      type,
      policyStatus: form.policyStatus,
      insuranceCost,
      coverage: form.coverage,
      coverageAdequacy: form.coverageAdequacy,
      willStatus: type === 2 ? willStatus : 1,
      name: form.name,
      iconUrl: this.resolveIconUrl(type),
      isHidden,
      client: existing.client ?? this.data.client ?? { id: '', name: '' },
      cashflow:
        existing.cashflow ?? this.data.cashflow ?? { id: '', name: '' },
      createdAt: existing.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    this.emergenciesHttp.updateEmergency(updatePayload).subscribe({
      next: (res: Emergency) => {
        this.toastr.success('Cover updated successfully', 'Success');
        this.dialogRef.close({ status: 'Success', emergency: res });
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to update cover', 'Error');
      },
    });
  } else {
    // 🔹 CREATE
    this.emergenciesHttp.createEmergency(createPayload).subscribe({
      next: (res: Emergency) => {
        this.toastr.success('Cover added successfully', 'Success');
        this.dialogRef.close({ status: 'Success', emergency: res });
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to add cover', 'Error');
      },
    });
  }
}



  private resolveIconUrl(typeId: number): string {
    const t = this.emergencyTypes.find(e => e.id === typeId);
    if (!t) return 'default-emergency-icon.svg';

    const name = (t.name || '').toLowerCase();
    if (name.includes('insurance')) return 'insurance-icon.svg';
    if (name.includes('will')) return 'will-icon.svg';
    return 'default-emergency-icon.svg';
  }
}
