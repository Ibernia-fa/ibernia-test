import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

import { allCountries } from 'src/app/clients/models/country';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';

import { WealthHttpService } from '../services/wealth-http.service';
import { WealthLiabilityModel } from '../models/wealth.model';

export interface AddLiabilityDialogData {
  mode: 'add' | 'edit';
  cashflowId: string;
  liability?: WealthLiabilityModel;
  clientPreferredCurrency?: string;
  hasPartner?: boolean;
  clientFirstName?: string;
  partnerFirstName?: string;
}

@Component({
  selector: 'app-add-liability',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule,
  ],
  templateUrl: './add-liability.component.html',
  styleUrl: './add-liability.component.scss',
})
export class AddLiabilityComponent {
  form: FormGroup;
  isEditMode: boolean;
  isSaving = false;
  countries = allCountries;
  hasPartner: boolean;

  liabilityTypes = [
    'Mortgage',
    'Loan',
    'Credit Card',
    'Student Loan',
    'Other'
  ];

  ownershipOptions: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddLiabilityComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddLiabilityDialogData,
    private wealthHttp: WealthHttpService,
    private toastr: ToastrService
  ) {
    this.isEditMode = data.mode === 'edit';
    this.hasPartner = data.hasPartner ?? false;

    if (this.hasPartner) {
      this.ownershipOptions = [
        { value: 0, label: 'Joint' },
        { value: 1, label: data.clientFirstName || 'Client' },
        { value: 2, label: data.partnerFirstName || 'Partner' }
      ];
    }

    const ownershipValue = this.isEditMode
      ? this.getOwnershipValue(data.liability!.ownership)
      : 0;

    this.form = this.fb.group({
      type: [this.isEditMode ? data.liability!.type : '', Validators.required],
      name: [this.isEditMode ? (data.liability!.name || '') : ''],
      outstanding: [this.isEditMode ? data.liability!.outstanding : null, [Validators.required, Validators.min(0)]],
      ownership: [ownershipValue],
      currencySymbol: [data.clientPreferredCurrency || 'EUR']
    });

    if (this.isEditMode) {
      this.updateNameValidation(data.liability!.type);
    }
  }

  get isOtherType(): boolean {
    return this.form.get('type')?.value === 'Other';
  }

  onTypeChange(): void {
    const type = this.form.get('type')?.value;
    this.updateNameValidation(type);
    if (type !== 'Other') {
      this.form.patchValue({ name: '' });
    }
  }

  private updateNameValidation(type: string): void {
    const nameControl = this.form.get('name');
    if (type === 'Other') {
      nameControl?.setValidators(Validators.required);
    } else {
      nameControl?.clearValidators();
    }
    nameControl?.updateValueAndValidity();
  }

  onAmountInput(rawValue: string): void {
    if (!rawValue || rawValue.trim() === '') {
      this.form.get('outstanding')?.setValue('', { emitEvent: true });
      return;
    }
    const value = parseFormattedNumber(rawValue);
    this.form.get('outstanding')?.setValue(value, { emitEvent: true });
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;

    const formValue = this.form.value;

    if (this.isEditMode) {
      const request = {
        id: this.data.liability!.id,
        type: formValue.type,
        name: formValue.name || null,
        outstanding: formValue.outstanding,
        ownership: this.hasPartner ? formValue.ownership : 0
      };
      this.wealthHttp.updateLiability(this.data.cashflowId, request).subscribe({
        next: (dashboard) => {
          this.toastr.success('Liability updated', 'Success');
          this.dialogRef.close({ dashboard });
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to update liability', 'Error');
        }
      });
    } else {
      const request = {
        type: formValue.type,
        name: formValue.name || null,
        outstanding: formValue.outstanding,
        ownership: this.hasPartner ? formValue.ownership : 0
      };
      this.wealthHttp.addLiability(this.data.cashflowId, request).subscribe({
        next: (dashboard) => {
          this.toastr.success('Liability added', 'Success');
          this.dialogRef.close({ dashboard });
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to add liability', 'Error');
        }
      });
    }
  }

  onDelete(): void {
    if (!this.isEditMode || this.isSaving) return;
    this.isSaving = true;

    this.wealthHttp.deleteLiability(this.data.cashflowId, this.data.liability!.id).subscribe({
      next: () => {
        this.toastr.success('Liability deleted', 'Success');
        this.dialogRef.close({ deleted: true });
      },
      error: () => {
        this.isSaving = false;
        this.toastr.error('Failed to delete liability', 'Error');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private getOwnershipValue(ownership: string): number {
    switch (ownership) {
      case 'Client': return 1;
      case 'Partner': return 2;
      default: return 0;
    }
  }
}
