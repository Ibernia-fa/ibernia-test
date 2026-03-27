import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  MortgageCalculatorComponent,
  MortgageCalculatorState,
  MortgageOutput,
} from '../mortgage-calculator/mortgage-calculator.component';

export interface MortgageCalculatorDialogData {
  title?: string;
  clientCountryCode: string;
  currencySymbol: string;
  calculatorKind: 'mortgage' | 'loan';
  advisorDefaultInterestRate: number | null;
  initialState: MortgageCalculatorState | null;
}

export interface MortgageCalculatorDialogResult {
  applied: boolean;
  output?: MortgageOutput;
  state: MortgageCalculatorState | null;
}

@Component({
  selector: 'app-mortgage-calculator-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MortgageCalculatorComponent],
  templateUrl: './mortgage-calculator-dialog.component.html',
  styleUrl: './mortgage-calculator-dialog.component.scss',
})
export class MortgageCalculatorDialogComponent {
  currentState: MortgageCalculatorState | null;

  constructor(
    private dialogRef: MatDialogRef<MortgageCalculatorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MortgageCalculatorDialogData
  ) {
    this.currentState = data.initialState ?? null;
  }

  closeDialog(): void {
    this.dialogRef.close({
      applied: false,
      state: this.currentState,
    } satisfies MortgageCalculatorDialogResult);
  }

  onCalculatorStateChanged(state: MortgageCalculatorState): void {
    this.currentState = state;
  }

  onApply(output: MortgageOutput): void {
    this.dialogRef.close({
      applied: true,
      output,
      state: this.currentState,
    } satisfies MortgageCalculatorDialogResult);
  }
}
