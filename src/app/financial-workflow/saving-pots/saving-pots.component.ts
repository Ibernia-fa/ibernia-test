import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddNewPotComponent } from './add-new-pot/add-new-pot.component';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-saving-pots',
  imports: [MatDialogModule, MatCardModule, MatSliderModule, MatTooltipModule],
  templateUrl: './saving-pots.component.html',
  styleUrl: './saving-pots.component.scss',
})
export class SavingPotsComponent {
  constructor(private dialog: MatDialog) {}

  newEventClicked() {
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
