import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { WithdrawalsContributionsComponent } from '../../withdrawals-contributions/withdrawals-contributions.component';

@Component({
  selector: 'app-flows-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    WithdrawalsContributionsComponent,
  ],
  templateUrl: './flows-dialog.component.html',
  styleUrl: './flows-dialog.component.scss',
})
export class FlowsDialogComponent {
  constructor(private dialogRef: MatDialogRef<FlowsDialogComponent>) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
