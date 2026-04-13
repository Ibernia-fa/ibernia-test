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
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';

import { WealthHttpService } from '../services/wealth-http.service';
import {
  WealthAssetModel,
  AssetCategory,
  ASSET_CATEGORY_LABELS
} from '../models/wealth.model';

export interface AddAssetDialogData {
  mode: 'add' | 'edit';
  cashflowId: string;
  asset?: WealthAssetModel;
  clientPreferredCurrency?: string;
  hasPartner?: boolean;
  clientFirstName?: string;
  partnerFirstName?: string;
}

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? null : { required: true };
}

@Component({
  selector: 'app-add-asset',
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
    TranslateModule,
  ],
  templateUrl: './add-asset.component.html',
  styleUrl: './add-asset.component.scss',
})
export class AddAssetComponent {
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup;
  isEditMode: boolean;
  isSaving = false;
  countries = allCountries;
  hasPartner: boolean;

  categories = [
    { value: AssetCategory.RealEstate, label: ASSET_CATEGORY_LABELS[AssetCategory.RealEstate] },
    { value: AssetCategory.PersonalProperty, label: ASSET_CATEGORY_LABELS[AssetCategory.PersonalProperty] },
    { value: AssetCategory.Other, label: ASSET_CATEGORY_LABELS[AssetCategory.Other] }
  ];

  ownershipOptions: { value: number; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddAssetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddAssetDialogData,
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

    const categoryValue = this.isEditMode
      ? this.getCategoryEnum(data.asset!.category)
      : AssetCategory.RealEstate;

    const ownershipValue = this.isEditMode
      ? this.getOwnershipValue(data.asset!.ownership)
      : 0;

    this.form = this.fb.group({
      category: [categoryValue, Validators.required],
      name: [this.isEditMode ? (data.asset!.name || '') : ''],
      value: [this.isEditMode ? data.asset!.value : null, [Validators.required, Validators.min(0)]],
      ownership: [ownershipValue],
      currencySymbol: [data.clientPreferredCurrency || 'EUR']
    });

    this.form
      .get('category')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncNameValidators());
    this.syncNameValidators();
  }

  get assetNameLabelKey(): string {
    return this.form.get('category')?.value === AssetCategory.Other ? 'Name' : 'WEALTH.NAME_OPTIONAL';
  }

  private syncNameValidators(): void {
    const nameCtrl = this.form.get('name');
    if (this.form.get('category')?.value === AssetCategory.Other) {
      nameCtrl?.setValidators([trimmedRequired]);
    } else {
      nameCtrl?.clearValidators();
    }
    nameCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  /** i18n key for contextual name placeholder by selected asset category */
  get assetNamePlaceholderKey(): string {
    const cat = this.form.get('category')?.value as AssetCategory;
    switch (cat) {
      case AssetCategory.PersonalProperty:
        return 'WEALTH.NAME_PLACEHOLDER_ASSET_PERSONAL_PROPERTY';
      case AssetCategory.Other:
        return 'WEALTH.NAME_PLACEHOLDER_ASSET_OTHER';
      case AssetCategory.RealEstate:
      default:
        return 'WEALTH.NAME_PLACEHOLDER_ASSET_REAL_ESTATE';
    }
  }

  onAmountInput(rawValue: string): void {
    if (!rawValue || rawValue.trim() === '') {
      this.form.get('value')?.setValue('', { emitEvent: true });
      return;
    }
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.form.get('value')?.setValue(value, { emitEvent: true });
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;

    const formValue = this.form.value;
    const trimmedName = typeof formValue.name === 'string' ? formValue.name.trim() : '';
    const nameOrNull = trimmedName ? trimmedName : null;

    if (this.isEditMode) {
      const request = {
        id: this.data.asset!.id,
        category: formValue.category,
        name: nameOrNull,
        value: formValue.value,
        ownership: this.hasPartner ? formValue.ownership : 0
      };
      this.wealthHttp.updateAsset(this.data.cashflowId, request).subscribe({
        next: (dashboard) => {
          this.toastr.success('Asset updated', 'Success');
          this.dialogRef.close({ dashboard });
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to update asset', 'Error');
        }
      });
    } else {
      const request = {
        category: formValue.category,
        name: nameOrNull,
        value: formValue.value,
        ownership: this.hasPartner ? formValue.ownership : 0
      };
      this.wealthHttp.addAsset(this.data.cashflowId, request).subscribe({
        next: (dashboard) => {
          this.toastr.success('Asset added', 'Success');
          this.dialogRef.close({ dashboard });
        },
        error: () => {
          this.isSaving = false;
          this.toastr.error('Failed to add asset', 'Error');
        }
      });
    }
  }

  onDelete(): void {
    if (!this.isEditMode || this.isSaving) return;
    this.isSaving = true;

    this.wealthHttp.deleteAsset(this.data.cashflowId, this.data.asset!.id).subscribe({
      next: () => {
        this.toastr.success('Asset deleted', 'Success');
        this.dialogRef.close({ deleted: true });
      },
      error: () => {
        this.isSaving = false;
        this.toastr.error('Failed to delete asset', 'Error');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private getCategoryEnum(category: string): AssetCategory {
    switch (category) {
      case 'Real estate': return AssetCategory.RealEstate;
      case 'Personal property': return AssetCategory.PersonalProperty;
      case 'Other': return AssetCategory.Other;
      default: return AssetCategory.RealEstate;
    }
  }

  private getOwnershipValue(ownership: string): number {
    switch (ownership) {
      case 'Client': return 1;
      case 'Partner': return 2;
      default: return 0;
    }
  }
}
