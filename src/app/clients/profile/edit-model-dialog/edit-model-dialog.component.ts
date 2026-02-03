import { Component, Inject } from '@angular/core';
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
import { catchError, filter, map, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Client } from '../../models/client';

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
  birthDate!: Date;
  minAge!: number;

  constructor(
    private dialogRef: MatDialogRef<EditModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cashflow: Cashflow,
    @Inject(MAT_DIALOG_DATA) public clientData: Client,
    private fb: FormBuilder,
    private cashflowHttpService: CashflowHttpService,
    private toaster: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    const birthDateValue =
      this.cashflow?.clientBirthDate ?? this.clientData?.clientDetails?.birthDate;
    this.birthDate = birthDateValue ? new Date(birthDateValue) : new Date();
    this.minAge = this.calculateAge(this.birthDate);
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      name: [this.cashflow.name, Validators.required],
      planDuration: [
        this.cashflow.planDuration,
        [Validators.required, Validators.min(this.minAge), Validators.max(100)]
      ],
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
        planDuration: this.form.get('planDuration')?.value,
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
          console.log(res);
          this.toaster.success('Plan Updated Successfully');
          this.dialogRef.close();
          // this.router.navigate([`cashflows/${res.id}/timeline`]);
        });
    }
  }

  private calculateAge(birthDate: Date): number {
    if (Number.isNaN(birthDate.getTime())) {
      return 0;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
