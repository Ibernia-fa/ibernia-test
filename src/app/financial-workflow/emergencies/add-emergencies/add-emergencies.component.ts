import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ToastrService } from 'ngx-toastr';
import { Emergency, CreateEmergencyRequest, LookupItem, Money } from '../models/emergencies.model';
import { EmergenciesHttpService } from '../services/emergencies-http.service';
import { allCountries } from 'src/app/clients/models/country';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
    ThousandSeparatorInputDirective,
    MatButtonToggleModule 
  ],
  templateUrl: './add-emergencies.component.html',
  styleUrl: './add-emergencies.component.scss',
})
export class AddEmergenciesComponent {
  private NOT_COVERED_STATUS_ID = 2;
  form: FormGroup;
  policyStatuses: LookupItem[] = [];
  coverageAdequacies: LookupItem[] = [];
  emergencyTypes: LookupItem[] = [];
  willStatuses: LookupItem[] = [];
  insuranceCostTemplate?: Money;
  countries = allCountries;
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
    this.currencySymbol = data.clientPreferredCurrency ?? '';
    this.insuranceCycles = data.cycles ?? [];

    this.form = this.fb.group({
      name: ['', Validators.required],
      policyStatus: [this.policyStatuses[1].id, Validators.required],
      currencySymbol: [this.currencySymbol, Validators.required],
      insuranceAmount: [this.insuranceCostTemplate?.amount === 0
    ? null
    : this.insuranceCostTemplate?.amount ?? null, [Validators.required, Validators.min(0)]],
      insuranceCycleId: [this.insuranceCycles[1]?.id, Validators.required],
      coverageAdequacy: [null, Validators.required],
      coverage: [this.data.emergency?.coverage === 0
      ? null
      : this.data.emergency?.coverage ?? null, [Validators.required, Validators.min(0)]],
      willStatus: [null]
    });

    this.form.get('currencySymbol')?.disable();
    this.updateValidatorsForFormByType();

    // subscribe policyStatus changes only if Insurance
    if (!this.isWill) {
      this.form.get('policyStatus')?.valueChanges.subscribe(status => {
        this.updateValidatorsForPolicyStatus(status);
      });
    }

    if (this.data.mode === 'edit' && this.data.emergency) {
      this.patchForm(this.data.emergency);
    }
    else {
      setTimeout(() => this.setDefaultAdequacy());
    }
  }

  getCoverageClass(optionName: string, isActive: boolean) {
    const name = optionName.toLowerCase();
    return isActive ? `${name}-active` : name;
  }

  setDefaultAdequacy() {
    const good = this.coverageAdequacies.find(a => a.name === 'Good');

    if (good) {
      this.form.patchValue({ coverageAdequacy: good.id });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private patchForm(e: Emergency): void {
    this.form.patchValue({
      name: e.name,
      policyStatus: e.policyStatus,
      // insuranceAmount: e.insuranceCost?.amount ?? null,
      insuranceAmount: e.insuranceCost?.amount === 0 ? null : e.insuranceCost?.amount,
      insuranceCycleId: e.insuranceCost?.cycle?.id ?? 'annual',
      coverage: e.coverage === 0
      ? null
      : e.coverage,
      coverageAdequacy: e.coverageAdequacy ?? 2,
      currencySymbol: e.insuranceCost.currencySymbol,
      willStatus: e.willStatus ?? null
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const form = this.form.getRawValue();
    const existing = this.data.emergency;
    const nowIso = new Date().toISOString();
    const type = existing?.type ?? 1;
    const isHidden = existing?.isHidden ?? false;
    const emergencyType = type == 2 ? "Will" : "Insurance";

    const insuranceCost: Money = {
      currencySymbol: form.currencySymbol,
      amount: form.insuranceAmount,
      cycle: {
        id: form.insuranceCycleId,
        description: null,
      },
    };

    // CREATE payload
    const createPayload: CreateEmergencyRequest = {
      type,
      policyStatus: form.policyStatus,
      insuranceCost,
      coverage: form.coverage,
      coverageAdequacy: form.coverageAdequacy,
      willStatus: type === 2 ? form.willStatus : 1,
      name: form.name,
      iconUrl: this.resolveIconUrl(type),
      isHidden,
      client: this.data.client ?? { id: '', name: '' },
      cashflow: this.data.cashflow ?? { id: '', name: '' },
    };

    // UPDATE payload
    if (this.data.mode === 'edit' && existing) {
      const updatePayload: Emergency = {
        id: existing.id,
        type,
        policyStatus: form.policyStatus,
        insuranceCost,
        coverage: form.coverage,
        coverageAdequacy: form.coverageAdequacy,
        willStatus: type === 2 ? form.willStatus : 1,
        name: form.name,
        iconUrl: this.resolveIconUrl(type),
        isHidden,
        client: existing.client ?? this.data.client ?? { id: '', name: '' },
        cashflow: existing.cashflow ?? this.data.cashflow ?? { id: '', name: '' },
        createdAt: existing.createdAt ?? nowIso,
        updatedAt: nowIso,
      };

      this.emergenciesHttp.updateEmergency(updatePayload).subscribe({
        next: (res: Emergency) => {
          this.toastr.success(`${emergencyType} updated successfully`, 'Success');
          this.dialogRef.close({ status: 'Success', emergency: res });
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to update cover', 'Error');
        },
      });
    } else {
      // CREATE
      this.emergenciesHttp.createEmergency(createPayload).subscribe({
        next: (res: Emergency) => {
          this.toastr.success(`${emergencyType} added successfully`, 'Success');
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

  private updateValidatorsForPolicyStatus(status: number | null): void {
    const insuranceAmountCtrl = this.form.get('insuranceAmount');
    const insuranceCycleIdCtrl = this.form.get('insuranceCycleId');
    const coverageAdequacyCtrl = this.form.get('coverageAdequacy');
    const coverageCtrl = this.form.get('coverage');

    if (!insuranceAmountCtrl || !insuranceCycleIdCtrl || !coverageAdequacyCtrl || !coverageCtrl) {
      return;
    }

    const isNotCovered = status === this.NOT_COVERED_STATUS_ID;

    if (isNotCovered || this.isWill) {
      // remove validators when NotCovered (fields hidden)
      insuranceAmountCtrl.clearValidators();
      insuranceCycleIdCtrl.clearValidators();
      coverageAdequacyCtrl.clearValidators();
      coverageCtrl.clearValidators();
    } else {
      // re-apply validators when status is Covered (or anything else)
      insuranceAmountCtrl.setValidators([Validators.required, Validators.min(0)]);
      insuranceCycleIdCtrl.setValidators([Validators.required]);
      coverageAdequacyCtrl.setValidators([Validators.required]);
      coverageCtrl.setValidators([Validators.required, Validators.min(0)]);
    }

    insuranceAmountCtrl.updateValueAndValidity({ emitEvent: false });
    insuranceCycleIdCtrl.updateValueAndValidity({ emitEvent: false });
    coverageAdequacyCtrl.updateValueAndValidity({ emitEvent: false });
    coverageCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private updateValidatorsForFormByType(): void {
    if (this.isWill) {
      // Will: only name + willStatus required
      this.form.get('name')?.setValidators([Validators.required]);
      this.form.get('willStatus')?.setValidators([Validators.required]);

      // clear insurance validators
      ['policyStatus', 'insuranceAmount', 'insuranceCycleId', 'coverageAdequacy', 'coverage']
        .forEach(f => this.form.get(f)?.clearValidators());

    } else {
      // insurance: restore insurance validators
      this.form.get('name')?.setValidators([Validators.required]);
      this.form.get('policyStatus')?.setValidators([Validators.required]);
      this.updateValidatorsForPolicyStatus(this.form.get('policyStatus')?.value ?? null);

      // clear Will validators
      this.form.get('willStatus')?.clearValidators();
    }

    // update all controls
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get isWill(): boolean {
    if (this.data.emergency) {
      return this.data.emergency.type === 2;
    }

    return this.data.emergencyTypes?.length === 1 && this.data.emergencyTypes[0].id === 2;
  }

  onDelete(): void {
    if (this.isDeleteEnabled) {
      const emergencyId = this.data?.emergency?.id;

      if (emergencyId) {
        this.emergenciesHttp.deleteEmergency(emergencyId).subscribe({
          next: () => {
            this.toastr.success(`Coverage deleted successfully`, 'Success');
            this.dialogRef.close({ deleted: true });
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Failed to delete coverage', 'Error');
          }
        });
      }
      else {
        console.log("failed to delete emergency, id: " + emergencyId);
      }
    }
  }

  get isDeleteEnabled(): boolean {
    if (this.data.emergency?.name == "Home"
      || this.data.emergency?.name == "Life"
      || this.data.emergency?.name == "Disability"
      || this.data.emergency?.name == "Health"
      || this.data.emergency?.name == "Natural hazards"
      || this.data.emergency?.name == "Will")
      return false;
    else
      return true;
  }
}
