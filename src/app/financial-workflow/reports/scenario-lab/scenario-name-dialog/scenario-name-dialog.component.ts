import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface ScenarioNameDialogData {
  defaultName: string;
  planName: string;
}

@Component({
  selector: 'app-scenario-name-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Create plan from scenario</h2>
    <mat-dialog-content>
      <p class="mat-body-2">Enter a name for the new plan. The new plan will use the current scenario settings.</p>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Plan name</mat-label>
        <input matInput [(ngModel)]="planName" (keyup.enter)="submit()" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()">Create plan</button>
    </mat-dialog-actions>
  `,
  styles: [`.w-100 { width: 100%; }`],
})
export class ScenarioNameDialogComponent {
  planName: string;

  constructor(
    private dialogRef: MatDialogRef<ScenarioNameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScenarioNameDialogData,
  ) {
    this.planName = data.defaultName ?? '';
  }

  submit(): void {
    this.dialogRef.close(this.planName?.trim() || undefined);
  }
}
