import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { LegacyHttpService } from '../services/legacy-http.service';
import { TaxSettingsModel } from '../models/legacy.model';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './tax-settings.component.html',
  styleUrl: './tax-settings.component.scss'
})
export class TaxSettingsComponent {
  form: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<TaxSettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      cashflowId: string;
      taxSettings: TaxSettingsModel;
    }
  ) {
    const ts = data.taxSettings;
    this.form = this.fb.group({
      partnerTaxRate: [ts?.partnerTaxRate ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      childTaxRate: [ts?.childTaxRate ?? 7, [Validators.required, Validators.min(0), Validators.max(100)]],
      siblingTaxRate: [ts?.siblingTaxRate ?? 15, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.isSaving = true;
    this.legacyHttp.updateTaxSettings(this.data.cashflowId, this.form.value).subscribe({
      next: (dashboard) => {
        this.toastr.success('Tax settings updated', 'Success');
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
