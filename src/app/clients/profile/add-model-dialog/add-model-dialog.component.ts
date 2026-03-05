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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as ClientActions from 'src/app/store/client/client.actions';
import { ClientHttpService } from '../../services/client-http.service';
import { MaterialModule } from "src/app/material.module";

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
    TranslateModule,
    MaterialModule
],  templateUrl: './add-model-dialog.component.html',
  styleUrl: './add-model-dialog.component.scss'
})
export class AddModelDialogComponent {

  form: FormGroup;
  birthDate!: Date;
  minAge!: number;
  isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AddModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public clientData: Client,
    private fb: FormBuilder,
    private cashflowHttpService: CashflowHttpService,
    private toaster: ToastrService,
    private router: Router,
    private translate: TranslateService,
  ) {
    this.birthDate = new Date(this.clientData?.clientDetails?.birthDate);
    this.minAge = this.calculateAge(this.birthDate);
    this.initForm();
    this.prefillPlanName();
  }

  private prefillPlanName(): void {
    if (!this.clientData?.id) return;
    this.cashflowHttpService.getByClientId(this.clientData.id).subscribe((cashflows) => {
      const nextNum = (cashflows?.length ?? 0) + 1;
      const prefix = this.translate.currentLang === 'it' ? 'Piano ' : 'Plan ';
      this.form.get('name')?.setValue(prefix + nextNum);
    });
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      planDuration: [
        90,
        [Validators.required, Validators.min(this.minAge), Validators.max(100)]
      ],
      inflationRate: [
        2.5,
        [Validators.required, Validators.min(0), Validators.max(1000)]
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
    if (this.form.invalid) {
      this.isLoading = false;
      return;
    }

    if(this.form.valid) {
      this.isLoading = true;
      const cashflow: Cashflow = {
        id: '',
        description: this.form.get('description')?.value,
        name: this.form.get('name')?.value,
        planDuration: this.form.get('planDuration')?.value,
        inflationRate: this.form.get('inflationRate')?.value,
        clientBirthDate: this.birthDate,
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
        map((res) => {
          this.isLoading = false;
          console.log(res);
          return res;
        }),
        catchError((err) => {
          if (err.error)
            this.toaster.error(err.error);
          else
            this.toaster.error('An error occurred while creating plan');
          this.isLoading = false;
          console.error("An error occurred while creating cashflow", err);
          throw err;
        })
      ).subscribe((res) => {
        this.isLoading = false;
        console.log("Cashflow created successfully", res);
        this.toaster.success('Plan Created Successfully');
        this.dialogRef.close();
        this.router.navigate([`cashflows/${res.id}/timeline`]);
      });
    }
  }

  onInflationSliderInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value);
    const val = isNaN(value) ? 0 : this.round1(value);
    this.form.get('inflationRate')?.setValue(val, { emitEvent: true });
  }

  onInflationInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const num = Number(raw);
    const val = isNaN(num) ? 0 : this.round1(num);
    this.form.get('inflationRate')?.setValue(val, { emitEvent: true });
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

  private round1(n: number): number {
    return Math.round((n + Number.EPSILON) * 10) / 10;
  }
}
