import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getStartEndDurationLabel } from 'src/app/shared/utils/start-end-duration-label';

@Component({
  selector: 'app-update-income',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSliderModule,
    ThousandSeparatorInputDirective,
    TranslateModule,
    ReactiveFormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './update-income.component.html',
  styleUrl: './update-income.component.scss',
})
export class UpdateIncomeComponent {
  formattedInflationRate: string;
  incomeForm = this.fb.group({
    name: ['' as string, [Validators.required]],
    currency: ['£' as string],
    amount: [0 as number],
    cycle: ['' as string],
    start: ['' as string],
    end: ['' as string],
    escalationRate: ['' as string],
  });

  constructor(
    private dialogRef: MatDialogRef<UpdateIncomeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService,
    private fb: FormBuilder,
  ) {
    const rate = Number(data?.inflationRate ?? 0);
    this.formattedInflationRate = Number.isInteger(rate) ? `${rate}.0` : `${rate}`;

    // Best-effort initialization (this component previously relied on [value] bindings).
    const selected = data?.selectedIncome;
    if (selected) {
      this.incomeForm.patchValue(
        {
          name: selected?.name ?? selected?.description ?? '',
          currency: selected?.amount?.currencySymbol ?? '£',
          amount: Number(selected?.amount?.amount ?? 0),
          cycle: selected?.amount?.cycle?.id ?? selected?.amount?.cycle ?? '',
          start: selected?.start?.year ?? selected?.start ?? '',
          end: selected?.end?.year ?? selected?.end ?? '',
          escalationRate: selected?.escalationRate ?? '',
        },
        { emitEvent: false },
      );
    }
  }

  get startEndDurationHint(): string | null {
    return getStartEndDurationLabel(
      this.incomeForm.get('start')?.value,
      this.incomeForm.get('end')?.value,
      [],
      this.translate,
    );
  }

  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.incomeForm.get('amount')?.setValue(value, { emitEvent: true });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
