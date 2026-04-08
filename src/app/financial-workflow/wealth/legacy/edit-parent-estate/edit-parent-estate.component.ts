import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { LegacyHttpService } from '../services/legacy-http.service';

@Component({
  selector: 'app-edit-parent-estate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CurrencySymbolPipe,
    ThousandSeparatorInputDirective,
    TranslateModule,
  ],
  templateUrl: './edit-parent-estate.component.html',
  styleUrl: './edit-parent-estate.component.scss'
})
export class EditParentEstateComponent {
  form: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<EditParentEstateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      cashflowId: string;
      side: 'client' | 'partner';
      currentValue: number;
      currency: string;
      personFirstName: string;
    }
  ) {
    this.form = this.fb.group({
      jointNetWorth: [data.currentValue, [Validators.required, Validators.min(0)]]
    });
  }

  get parentsModalTitleParams(): { name: string } {
    const trimmed = (this.data.personFirstName ?? '').trim();
    if (trimmed) {
      return { name: trimmed };
    }
    const fallbackKey =
      this.data.side === 'client'
        ? 'LEGACY.PARENTS_NET_WORTH_MODAL_NAME_FALLBACK_CLIENT'
        : 'LEGACY.PARENTS_NET_WORTH_MODAL_NAME_FALLBACK_PARTNER';
    return { name: this.translate.instant(fallbackKey) };
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.patchValue(
      { jointNetWorth: parseFormattedNumber(input.value, this.translate.currentLang) },
      { emitEvent: false },
    );
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.isSaving = true;
    this.legacyHttp.updateParentEstate(this.data.cashflowId, {
      side: this.data.side,
      jointNetWorth: this.form.value.jointNetWorth
    }).subscribe({
      next: (dashboard) => {
        this.toastr.success('Parent estate updated', 'Success');
        this.dialogRef.close({ dashboard });
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to update', 'Error');
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
