import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Client } from 'src/app/clients/models/client';
interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-add-event-dialog',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-event-dialog.component.html',
  styleUrl: './add-event-dialog.component.scss',
})
export class AddEventDialogComponent {
  
  
  
  constructor(
    private dialogRef: MatDialogRef<AddEventDialogComponent>,
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
  
  foods: Food[] = [
    { value: '0', viewValue: '1' },
    { value: '1', viewValue: '2' },
    { value: '2', viewValue: '3' },
  ];
}
