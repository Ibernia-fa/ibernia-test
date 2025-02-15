import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-new-pot',
  imports: [],
  templateUrl: './add-new-pot.component.html',
  styleUrl: './add-new-pot.component.scss'
})
export class AddNewPotComponent {

  constructor(private dialogRef: MatDialogRef<AddNewPotComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
