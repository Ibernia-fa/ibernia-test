import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import {
  Cycle,
  EscalationRate,
} from '../../timeline/models/financial-timeline';
import moment from 'moment';
import { FinancialViewModel } from '../model/income-expense';
import { IncomeExpensesHttpService } from '../services/income-expenses-http.service';
import { catchError, filter } from 'rxjs';

@Component({
  selector: 'app-add-income',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSliderModule,
    ReactiveFormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.scss',
})
export class AddIncomeComponent {
  incomeForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  years: number[] = [];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  isEditWorkflow = false;
  selectedIncome: FinancialViewModel;
  showStartEnd = false;

  constructor(
    private dialogRef: MatDialogRef<AddIncomeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private incomeExpenseHttpService: IncomeExpensesHttpService
  ) {
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.clientBirthYear = moment(data.clientBirthDate).year();
    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedIncome = data.selectedIncome;

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.incomeForm = this.fb.group({
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
    });

    this.onCycleValueChange(this.cycles[1].id);

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedIncome.amount.cycle.id)
      this.incomeForm
        .get('description')
        ?.patchValue(this.selectedIncome.description);
      this.incomeForm
        .get('currencySymbol')
        ?.patchValue(this.selectedIncome.amount.currencySymbol);
      this.incomeForm
        .get('amount')
        ?.patchValue(this.selectedIncome.amount.amount);
      this.incomeForm
        .get('cycle')
        ?.patchValue(this.selectedIncome.amount.cycle.id);
      this.incomeForm.get('start')?.patchValue(this.selectedIncome.start.year);
      this.incomeForm.get('end')?.patchValue(this.selectedIncome.end.year);

    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCycleValueChange(event: any) {
    console.log({event})
    this.showStartEnd = this.cycles.find(cycle => cycle.id === event)?.description !== 'One-off'
    if(!this.showStartEnd) {
      this.incomeForm.controls['end'].clearValidators();
      this.incomeForm.controls['end'].updateValueAndValidity();
    }
    else {
      this.incomeForm.controls['end'].addValidators(Validators.required);
      this.incomeForm.controls['end'].updateValueAndValidity();
    }
  }

  addIncome(): void {
    if (this.incomeForm.valid) {
      console.log('Form Submitted', this.incomeForm.value);
      var income: FinancialViewModel = {
        id: this.isEditWorkflow ? this.selectedIncome.id : null,
        description: this.incomeForm.get('description')?.value,
        amount: {
          amount: this.incomeForm.get('amount')?.value,
          currencySymbol: this.incomeForm.get('currencySymbol')?.value,
          cycle: {
            id: this.incomeForm.get('cycle')?.value ?? '',
            description:
              this.cycles.find(
                (x) => x.id === this.incomeForm.get('cycle')?.value
              )?.description ?? '',
          },
        },
        start: {
          age:
            this.incomeForm.get('start')?.value !== null &&
            this.incomeForm.get('start')?.value !== ''
              ? this.incomeForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            this.incomeForm.get('start')?.value !== null &&
            this.incomeForm.get('start')?.value !== ''
              ? this.incomeForm.get('start')?.value
              : 0,
        },
        end: {
          age:
            this.incomeForm.get('end')?.value !== null &&
            this.incomeForm.get('end')?.value !== ''
              ? this.incomeForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
            this.incomeForm.get('end')?.value !== null &&
            this.incomeForm.get('end')?.value !== ''
              ? this.incomeForm.get('end')?.value
              : 0,
        },
      };

      var action$ = this.incomeExpenseHttpService.addIncome(
        this.cashflowId,
        income
      );

      if (this.isEditWorkflow)
        action$ = this.incomeExpenseHttpService.updateIncome(
          this.cashflowId,
          income
        );

      action$
        .pipe(
          filter((res) => !!res),
          catchError((err) => {
            console.error(err);
            throw err;
          })
        )
        .subscribe((res) => {
          this.dialogRef.close({
            status: 'Success',
            incomeExpense: res,
          });
        });
      // Handle form submission logic
    } else {
      console.log('Form is invalid');
    }
  }
}
