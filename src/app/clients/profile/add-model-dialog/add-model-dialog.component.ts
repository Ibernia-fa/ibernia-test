import { Component, inject, Inject, Optional } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Client } from '../../models/client';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CashflowHttpService } from '../../services/cashflow-http.service';
import { Cashflow } from '../../models/cashflow';
import { catchError, filter } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-model-dialog',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule
  ],  templateUrl: './add-model-dialog.component.html',
  styleUrl: './add-model-dialog.component.scss'
})
export class AddModelDialogComponent {

  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public clientData: Client,
    private fb: FormBuilder,
    private cashflowHttpService: CashflowHttpService,
    private toaster: ToastrService,
    private router: Router
  ) {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['Lifetime Plan', Validators.required],
      description: ['']
    });
  }

  doAction(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    if(this.form.valid) {
      const cashflow: Cashflow = {
        id: '',
        description: this.form.get('description')?.value,
        name: this.form.get('name')?.value,
        clientBirthDate: this.clientData.clientDetails.birthDate,
        client: {
          id: this.clientData.id,
          name: this.clientData.clientDetails.firstName
        },
        financialAdvisor: this.clientData.financialAdvisor,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.cashflowHttpService.createCashflow(cashflow).pipe(
        filter(res => !!res),
        catchError((err) => {
          if (err.error)
            this.toaster.error(err.error);
          else
            this.toaster.error('An error occurred while creating plan');
          
          console.error("An error occurred while creating cashflow", err);
          throw err;
        })
      ).subscribe((res) => {
        this.toaster.success('Plan Created Successfully');
        this.dialogRef.close();
        this.router.navigate([`cashflows/${res.id}/timeline`]);
      });
    }
  }
}