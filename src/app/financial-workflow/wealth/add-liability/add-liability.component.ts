import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';

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
}

@Component({
  selector: 'app-add-liability',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective
  ],
  templateUrl: './add-liability.component.html',
  styleUrl: './add-liability.component.scss',
})
export class AddLiabilityComponent {
  form: FormGroup;
  isEditMode: boolean;
  isSaving = false;
  countries = allCountries;

  liabilityTypes = [
    'Mortgage',
    'Loan',
    'Credit Card',
    'Student Loan',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddLiabilityComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddLiabilityDialogData,
    private wealthHttp: WealthHttpService,
    private toastr: ToastrService
  ) {
    this.isEditMode = data.mode === 'edit';

    this.form = this.fb.group({
      type: [this.isEditMode ? data.liability!.type : '', Validators.required],
      description: [this.isEditMode ? data.liability!.description : '', Validators.required],
      outstanding: [this.isEditMode ? data.liability!.outstanding : null, [Validators.required, Validators.min(0)]],
      currencySymbol: [data.clientPreferredCurrency || 'EUR']
    });
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
        description: formValue.description,
        outstanding: formValue.outstanding
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
        description: formValue.description,
        outstanding: formValue.outstanding
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
}
