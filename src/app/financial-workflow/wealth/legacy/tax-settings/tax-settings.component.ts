import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { LegacyHttpService } from '../services/legacy-http.service';
import { TaxSettingsModel } from '../models/legacy.model';
import { SettingsService, UserProfileDto } from 'src/app/default-preferance/services/default-preferance.http.service';
import { DEFAULT_INHERITANCE_TAX_THRESHOLD } from 'src/app/shared/utils/inheritance-tax.utils';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './tax-settings.component.html',
  styleUrl: './tax-settings.component.scss'
})
export class TaxSettingsComponent {
  form: FormGroup;
  isSaving = false;

  get currencySymbol(): string {
    return (
      (this.settingsService.currentUserData as UserProfileDto | null)?.preferences?.currency ??
      'EUR'
    );
  }

  constructor(
    private fb: FormBuilder,
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<TaxSettingsComponent>,
    private settingsService: SettingsService,
    @Inject(MAT_DIALOG_DATA) public data: {
      cashflowId: string;
      taxSettings: TaxSettingsModel;
    }
  ) {
    const ts = data.taxSettings;
    const userPrefs = (this.settingsService.currentUserData as UserProfileDto | null)?.preferences;
    const defaultPartner = userPrefs?.partnerInheritanceTaxRate ?? 4;
    const defaultChild = userPrefs?.childInheritanceTaxRate ?? 4;
    const defaultSibling = userPrefs?.siblingInheritanceTaxRate ?? 6;
    const defaultPartnerTh = userPrefs?.partnerInheritanceTaxThreshold ?? DEFAULT_INHERITANCE_TAX_THRESHOLD;
    const defaultChildTh = userPrefs?.childInheritanceTaxThreshold ?? DEFAULT_INHERITANCE_TAX_THRESHOLD;
    const defaultSiblingTh = userPrefs?.siblingInheritanceTaxThreshold ?? DEFAULT_INHERITANCE_TAX_THRESHOLD;

    this.form = this.fb.group({
      partnerTaxRate: [ts?.partnerTaxRate ?? defaultPartner, [Validators.required, Validators.min(0), Validators.max(100)]],
      childTaxRate: [ts?.childTaxRate ?? defaultChild, [Validators.required, Validators.min(0), Validators.max(100)]],
      siblingTaxRate: [ts?.siblingTaxRate ?? defaultSibling, [Validators.required, Validators.min(0), Validators.max(100)]],
      partnerTaxThreshold: [ts?.partnerTaxThreshold ?? defaultPartnerTh, [Validators.required, Validators.min(0)]],
      childTaxThreshold: [ts?.childTaxThreshold ?? defaultChildTh, [Validators.required, Validators.min(0)]],
      siblingTaxThreshold: [ts?.siblingTaxThreshold ?? defaultSiblingTh, [Validators.required, Validators.min(0)]],
    });
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.isSaving = true;
    this.legacyHttp.updateTaxSettings(this.data.cashflowId, this.form.value).subscribe({
      next: (dashboard) => {
        this.toastr.success('Tax settings updated', 'Success');
        this.settingsService.notifyProfileChanged();
        this.dialogRef.close({ dashboard });
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to update tax settings', 'Error');
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
