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
import { EMPTY, catchError, filter, map, switchMap, take } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Client } from '../../models/client';
import { ReportsHttpService } from 'src/app/financial-workflow/reports/services/reports-http.service';
import { TimelineHttpService } from 'src/app/financial-workflow/timeline/services/timeline-http.service';
import { MaterialModule } from "src/app/material.module";

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
    TranslateModule,
    MaterialModule
],
  templateUrl: './edit-model-dialog.component.html',
  styleUrl: './edit-model-dialog.component.scss',
})
export class EditModelDialogComponent {
  form: FormGroup;
  birthDate!: Date;
  minAge!: number;
  isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<EditModelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cashflow: Cashflow,
    @Inject(MAT_DIALOG_DATA) public clientData: Client,
    private fb: FormBuilder,
    private cashflowHttpService: CashflowHttpService,
    private reportsHttpService: ReportsHttpService,
    private timelineHttpService: TimelineHttpService,
    private toaster: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
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
      inflationRate: [
        this.cashflow.inflationRate,
        [Validators.required, Validators.min(0), Validators.max(1000)]
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
    if (this.form.invalid) {
      this.isLoading = false;
      return;
    }

    if (this.form.valid) {
      this.isLoading = true;
      const planDuration = Number(this.form.get('planDuration')?.value);
      const cashflow: Cashflow = {
        id: this.cashflow.id,
        description: this.form.get('description')?.value,
        name: this.form.get('name')?.value,
        planDuration: planDuration,
        inflationRate: this.form.get('inflationRate')?.value,
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
          map((res) => {
            this.isLoading = false;
            return res;
          }),
          catchError((err) => {
            const title = this.translate.instant('LABEL.ERROR');
            const fallback = this.translate.instant('ERROR.PLAN_UPDATE_FAILED');
            let msg = fallback;
            if (typeof err?.error === 'string' && err.error.trim()) {
              msg = err.error;
            } else if (typeof err?.error?.message === 'string' && err.error.message.trim()) {
              msg = err.error.message;
            } else if (typeof err?.message === 'string' && err.message.trim()) {
              msg = err.message;
            }
            this.toaster.error(msg, title);
            this.isLoading = false;
            console.error('An error occurred while updating cashflow', err);
            throw err;
          })
        )
        .subscribe((res) => {
          this.isLoading = false;
          console.log(res);
          this.toaster.success(
            this.translate.instant('TOAST.PLAN_UPDATED_SUCCESSFULLY'),
            this.translate.instant('LABEL.SUCCESS'),
          );
          this.refreshReportForecastEndDate(res);
          this.dialogRef.close();
          // this.router.navigate([`cashflows/${res.id}/timeline`]);
        });
    }
  }

  private refreshReportForecastEndDate(updatedCashflow: Cashflow): void {
    const planDuration = Number(updatedCashflow.planDuration);
    if (!Number.isFinite(planDuration)) {
      return;
    }

    const birthDateValue =
      updatedCashflow.clientBirthDate ?? this.birthDate;
    const birthDate = birthDateValue ? new Date(birthDateValue) : null;
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      return;
    }

    this.timelineHttpService
      .getTimelinebyCashflowId(updatedCashflow.id)
      .pipe(
        take(1),
        switchMap((timeline) => {
          const forecastEndDate = this.buildForecastEndDate(
            planDuration,
            birthDate,
            new Date(timeline.forecastEndtDate)
          );

          const forecastStartDate = this.toIsoString(timeline.forecastStartDate);
          const forecastEndDateIso = this.toIsoString(forecastEndDate);

          if (!forecastStartDate || !forecastEndDateIso) {
            return EMPTY;
          }

          return this.reportsHttpService.getReportbyCashflowIdWithForecastDates(
            updatedCashflow.id,
            {
              ForecastStartDate: forecastStartDate,
              ForecastEndDate: forecastEndDateIso
            }
          );
        }),
        catchError((err) => {
          console.error('Failed to refresh report after plan update', err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  private buildForecastEndDate(
    planDuration: number,
    birthDate: Date,
    existingEndDate?: Date
  ): Date {
    const birthYear = birthDate.getFullYear();
    const endYear = birthYear + planDuration;

    if (existingEndDate && !Number.isNaN(existingEndDate.getTime())) {
      const nextEnd = new Date(existingEndDate);
      nextEnd.setFullYear(endYear);
      return nextEnd;
    }

    return new Date(endYear, 1);
  }

  private toIsoString(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString();
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

  private round1(n: number): number {
    return Math.round((n + Number.EPSILON) * 10) / 10;
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
