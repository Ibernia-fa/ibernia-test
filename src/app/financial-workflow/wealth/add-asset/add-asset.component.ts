import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'ngx-toastr';

import { WealthHttpService } from '../services/wealth-http.service';
import {
  WealthAssetModel,
  AssetCategory,
  LiquidityLevel,
  ASSET_CATEGORY_LABELS,
  LIQUIDITY_LABELS
} from '../models/wealth.model';

export interface AddAssetDialogData {
  mode: 'add' | 'edit';
  cashflowId: string;
  asset?: WealthAssetModel;
  clientPreferredCurrency?: string;
}

@Component({
  selector: 'app-add-asset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './add-asset.component.html',
  styleUrl: './add-asset.component.scss',
})
export class AddAssetComponent {
  form: FormGroup;
  isEditMode: boolean;
  isSaving = false;

  categories = [
    { value: AssetCategory.RealEstate, label: ASSET_CATEGORY_LABELS[AssetCategory.RealEstate] },
    { value: AssetCategory.PersonalProperty, label: ASSET_CATEGORY_LABELS[AssetCategory.PersonalProperty] }
  ];

  liquidityLevels = [
    { value: LiquidityLevel.Liquid, label: LIQUIDITY_LABELS[LiquidityLevel.Liquid] },
    { value: LiquidityLevel.Partial, label: LIQUIDITY_LABELS[LiquidityLevel.Partial] },
    { value: LiquidityLevel.Illiquid, label: LIQUIDITY_LABELS[LiquidityLevel.Illiquid] }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddAssetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddAssetDialogData,
    private wealthHttp: WealthHttpService,
    private toastr: ToastrService
  ) {
    this.isEditMode = data.mode === 'edit';

    const categoryValue = this.isEditMode
      ? this.getCategoryEnum(data.asset!.category)
      : AssetCategory.RealEstate;

    const liquidityValue = this.isEditMode
      ? this.getLiquidityEnum(data.asset!.liquidity)
      : LiquidityLevel.Illiquid;

    this.form = this.fb.group({
      category: [categoryValue, Validators.required],
      description: [this.isEditMode ? data.asset!.description : '', Validators.required],
      value: [this.isEditMode ? data.asset!.value : null, [Validators.required, Validators.min(0)]],
      liquidity: [liquidityValue, Validators.required]
    });
  }

  onCategoryChange(): void {
    const cat = this.form.get('category')?.value;
    if (cat === AssetCategory.RealEstate || cat === AssetCategory.PersonalProperty) {
      this.form.patchValue({ liquidity: LiquidityLevel.Illiquid });
    }
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving) return;
    this.isSaving = true;

    const formValue = this.form.value;

    if (this.isEditMode) {
      const request = {
        id: this.data.asset!.id,
        category: formValue.category,
        description: formValue.description,
        value: formValue.value,
        liquidity: formValue.liquidity
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
        description: formValue.description,
        value: formValue.value,
        liquidity: formValue.liquidity
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
    if (category === 'Real estate') return AssetCategory.RealEstate;
    return AssetCategory.PersonalProperty;
  }

  private getLiquidityEnum(liquidity: string): LiquidityLevel {
    switch (liquidity) {
      case 'Liquid': return LiquidityLevel.Liquid;
      case 'Partial': return LiquidityLevel.Partial;
      default: return LiquidityLevel.Illiquid;
    }
  }
}
