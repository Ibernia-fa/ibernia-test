import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-income',
  imports: [],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.scss'
})
export class AddIncomeComponent {

  constructor(
      private dialogRef: MatDialogRef<AddIncomeComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
  
    closeDialog(): void {
      this.dialogRef.close();
    }
}
