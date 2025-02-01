import { Component, inject, Inject, Optional } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Client } from '../../client';

@Component({
  selector: 'app-add-model-dialog',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
  ],  templateUrl: './add-model-dialog.component.html',
  styleUrl: './add-model-dialog.component.scss'
})
export class AddModelDialogComponent {


  constructor(
    private dialogRef: MatDialogRef<AddModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public clientData: Client
  ) {
    console.log(clientData)
  }

  doAction(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}