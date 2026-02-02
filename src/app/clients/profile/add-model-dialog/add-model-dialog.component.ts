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
import { catchError, combineLatestWith, filter, map, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as ClientActions from 'src/app/store/client/client.actions';
import { ClientHttpService } from '../../services/client-http.service';

@Component({
  selector: 'app-add-model-dialog',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslateModule
  ],  templateUrl: './add-model-dialog.component.html',
  styleUrl: './add-model-dialog.component.scss'
})
export class AddModelDialogComponent {

  form: FormGroup;
  birthDate!: Date;
  minAge!: number;
  clientId: string;

  constructor(
    private dialogRef: MatDialogRef<AddModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public clientData: Client,
    private fb: FormBuilder,
    private cashflowHttpService: CashflowHttpService,
    private toaster: ToastrService,
    private router: Router,
  ) {
    this.birthDate = new Date(this.clientData?.clientDetails?.birthDate);
    this.minAge = this.calculateAge(this.birthDate);
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      // name: ['Lifetime Plan', Validators.required],
      name: ['', Validators.required],
      planDuration: [
        null,
        [Validators.required, Validators.min(this.minAge), Validators.max(100)]
      ],
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
        planDuration: this.form.get('planDuration')?.value,
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

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
