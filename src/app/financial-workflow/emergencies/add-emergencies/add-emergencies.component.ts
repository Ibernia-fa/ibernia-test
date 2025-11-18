import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-emergencies',
  imports: [],
  templateUrl: './add-emergencies.component.html',
  styleUrl: './add-emergencies.component.scss'
})
export class AddEmergenciesComponent {

            
constructor(private dialogRef: MatDialogRef<AddEmergenciesComponent>) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
