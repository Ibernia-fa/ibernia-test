import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-account-closure-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './account-closure-confirm-dialog.component.html',
  styleUrl: './account-closure-confirm-dialog.component.scss',
})
export class AccountClosureConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<AccountClosureConfirmDialogComponent, boolean>,
  ) {}

  close(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
