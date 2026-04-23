import { Component, DestroyRef, Inject, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { allCountries } from 'src/app/clients/models/country';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { AutoFocusDirective } from 'src/app/directives/auto-focus.directive';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';

import { capitalizeFirstLetter } from 'src/app/shared/utils/capitalize-first-letter';
import { WealthHttpService } from '../services/wealth-http.service';
import { WealthLiabilityModel } from '../models/wealth.model';

export interface AddLiabilityDialogData {
  mode: 'add' | 'edit';
  cashflowId: string;
  liability?: WealthLiabilityModel;
  /** Existing liabilities on the dashboard (add mode) — used to preselect the first unused category. */
  existingLiabilities?: WealthLiabilityModel[];
  clientPreferredCurrency?: string;
  hasPartner?: boolean;
  clientFirstName?: string;
  partnerFirstName?: string;
}

/** Order matches the dropdown and backend `AllowedLiabilityTypes`. */
export const LIABILITY_CATEGORY_ORDER = [
  'Mortgage',
  'Loan',
  'Credit Card',
  'Student Loan',
  'Other',
] as const;

export function pickDefaultLiabilityCategory(
  existing: Pick<WealthLiabilityModel, 'type'>[],
): string {
  const used = new Set(
    existing
      .map((l) => l.type?.trim())
      .filter((t): t is string => !!t)
      .map((t) => t.toLowerCase()),
  );
  for (const type of LIABILITY_CATEGORY_ORDER) {
    if (!used.has(type.toLowerCase())) {
      return type;
    }
  }
  return 'Other';
}

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? null : { required: true };
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
    MatRadioModule,
    MatSelectModule,
    ThousandSeparatorInputDirective,
    AutoFocusDirective,
    TranslateModule,
  ],
  templateUrl: './add-liability.component.html',
  styleUrl: './add-liability.component.scss',
})
export class AddLiabilityComponent {
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup;
  isEditMode: boolean;
  isSaving = false;
  countries = allCountries;
  hasPartner: boolean;

  liabilityTypes = [...LIABILITY_CATEGORY_ORDER];

  ownershipOptions: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddLiabilityComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddLiabilityDialogData,
    private wealthHttp: WealthHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
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

    const initialType = this.isEditMode
      ? data.liability!.type
      : pickDefaultLiabilityCategory(data.existingLiabilities ?? []);

    this.form = this.fb.group({
      type: [initialType, Validators.required],
      name: [this.isEditMode ? (data.liability!.name || '') : ''],
      outstanding: [this.isEditMode ? data.liability!.outstanding : null, [Validators.required, Validators.min(0)]],
      ownership: [ownershipValue],
      currencySymbol: [data.clientPreferredCurrency || 'EUR']
    });

    this.form
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncNameValidators());
    this.syncNameValidators();
  }

  get liabilityNameLabelKey(): string {
    return this.form.get('type')?.value === 'Other' ? 'Name' : 'WEALTH.NAME_OPTIONAL';
  }

  private syncNameValidators(): void {
    const nameCtrl = this.form.get('name');
    if (this.form.get('type')?.value === 'Other') {
      nameCtrl?.setValidators([trimmedRequired]);
    } else {
      nameCtrl?.clearValidators();
    }
    nameCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  /** i18n key for contextual name placeholder by selected liability category */
  get liabilityNamePlaceholderKey(): string {
    const type = this.form.get('type')?.value as string;
    switch (type) {
      case 'Mortgage':
        return 'WEALTH.NAME_PLACEHOLDER_LIABILITY_MORTGAGE';
      case 'Loan':
        return 'WEALTH.NAME_PLACEHOLDER_LIABILITY_LOAN';
      case 'Credit Card':
        return 'WEALTH.NAME_PLACEHOLDER_LIABILITY_CREDIT_CARD';
      case 'Student Loan':
        return 'WEALTH.NAME_PLACEHOLDER_LIABILITY_STUDENT_LOAN';
      case 'Other':
        return 'WEALTH.NAME_PLACEHOLDER_LIABILITY_OTHER';
      default:
        return 'WEALTH.NAME_PLACEHOLDER_LIABILITY_PENDING';
    }
  }

  onAmountInput(rawValue: string): void {
    if (!rawValue || rawValue.trim() === '') {
      this.form.get('outstanding')?.setValue('', { emitEvent: true });
      return;
    }
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.form.get('outstanding')?.setValue(value, { emitEvent: true });
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;

    const formValue = this.form.value;
    const trimmedName = typeof formValue.name === 'string' ? formValue.name.trim() : '';
    const nameOrNull = trimmedName
      ? (this.isEditMode ? trimmedName : capitalizeFirstLetter(trimmedName))
      : null;

    if (this.isEditMode) {
      const request = {
        id: this.data.liability!.id,
        type: formValue.type,
        name: nameOrNull,
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
        name: nameOrNull,
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
