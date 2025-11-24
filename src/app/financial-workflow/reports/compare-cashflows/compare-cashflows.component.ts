import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-compare-cashflows',
  imports: [],
  templateUrl: './compare-cashflows.component.html',
  styleUrl: './compare-cashflows.component.scss'
})
export class CompareCashflowsComponent {
constructor(
      private dialogRef: MatDialogRef<CompareCashflowsComponent>,
){}

    closeDialog(): void {
    this.dialogRef.close();
  }
}
