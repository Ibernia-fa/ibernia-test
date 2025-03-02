import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-expense',
  imports: [],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss'
})
export class AddExpenseComponent {

  constructor(
      private dialogRef: MatDialogRef<AddExpenseComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
  
    closeDialog(): void {
      this.dialogRef.close();
    }
}
