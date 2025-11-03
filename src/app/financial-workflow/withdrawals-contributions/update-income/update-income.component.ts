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
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';

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
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './update-income.component.html',
  styleUrl: './update-income.component.scss',
})
export class UpdateIncomeComponent {
  constructor(
    private dialogRef: MatDialogRef<UpdateIncomeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue);
    try {
      (this as any)['incomeForm']?.get('amount')?.setValue(value, { emitEvent: true });
    } catch (e) {}
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
