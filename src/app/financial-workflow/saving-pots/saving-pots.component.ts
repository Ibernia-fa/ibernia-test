import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddNewPotComponent } from './add-new-pot/add-new-pot.component';

@Component({
  selector: 'app-saving-pots',
  imports: [
    MatDialogModule
  ],
  templateUrl: './saving-pots.component.html',
  styleUrl: './saving-pots.component.scss',
})
export class SavingPotsComponent {
  constructor(private dialog: MatDialog) {}

  newEventClicked() {
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '600px',
      disableClose: true,
      data: {
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
