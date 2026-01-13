import { Component, inject, Inject, Optional } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CashflowHttpService } from '../../services/cashflow-http.service';
import { Cashflow } from '../../models/cashflow';
import { catchError, filter } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-model-dialog',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './edit-model-dialog.component.html',
  styleUrl: './edit-model-dialog.component.scss',
})
export class EditModelDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cashflow: Cashflow,
    private fb: FormBuilder,
    private cashflowHttpService: CashflowHttpService,
    private toaster: ToastrService,
    private router: Router
  ) {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      name: [this.cashflow.name, Validators.required],
      description: [this.cashflow.description],
    });
    this.form.updateValueAndValidity();
  }

  doAction(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.form.valid) {
      const cashflow: Cashflow = {
        id: this.cashflow.id,
        description: this.form.get('description')?.value,
        name: this.form.get('name')?.value,
        clientBirthDate: this.cashflow.clientBirthDate,
        client: {
          id: this.cashflow.client.id,
          name: this.cashflow.client.name,
        },
        financialAdvisor: this.cashflow.financialAdvisor,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.cashflowHttpService
        .updateCashflow(cashflow)
        .pipe(
          filter((res) => !!res),
          catchError((err) => {
            if (err.error)
              this.toaster.error(err.error);
            else
              this.toaster.error('An error occurred while updating plan');

            console.error('An error occurred while updating cashflow', err);
            throw err;
          })
        )
        .subscribe((res) => {
          this.toaster.success('Plan Updated Successfully');
          this.dialogRef.close();
          // this.router.navigate([`cashflows/${res.id}/timeline`]);
        });
    }
  }
}
