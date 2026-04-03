import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div class="d-flex flex-column">
      <div class="dialog-header">
        <h2 class="dialog-title text-center">Create plan from scenario</h2>
        <button
          type="button"
          mat-icon-button
          disableRipple
          class="dialog-close-btn"
          mat-dialog-close
          aria-label="Close dialog"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="event-dialog-content">
        <div class="d-flex flex-column gap-16">
          <p class="scenario-name-dialog-hint">
            Enter a name for the new plan. The new plan will use the current
            scenario settings.
          </p>
          <div class="w-100 form-field gap-8">
            <mat-label
              class="f-s-16 f-w-500 d-block ibr-black"
              style="line-height: 16px"
              >Plan name</mat-label
            >
            <input
              matInput
              [(ngModel)]="planName"
              (keyup.enter)="submit()"
            />
          </div>
        </div>
      </mat-dialog-content>

      <div class="row justify-content-end gap-16 modal-action p-t-24">
        <div>
          <button
            type="button"
            mat-dialog-close
            class="button-icon-outline w-100 d-block"
          >
            <span class="f-s-16">Cancel</span>
          </button>
        </div>
        <div>
          <button
            type="button"
            (click)="submit()"
            class="button-icon w-100 d-block"
          >
            <span class="f-s-16">Create plan</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .scenario-name-dialog-hint {
        margin: 0;
        font-size: 14px;
        line-height: 16px;
        color: #5a596e;
      }
      .event-dialog-content.mat-mdc-dialog-content {
        margin-top: 24px;
        padding: 0 !important;
      }
    `,
  ],
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
