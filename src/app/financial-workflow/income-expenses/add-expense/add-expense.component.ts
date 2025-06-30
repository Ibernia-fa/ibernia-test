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
import { IncomeExpensesHttpService } from '../services/income-expenses-http.service';
import moment from 'moment';
import { FinancialViewModel } from '../model/income-expense';
import { catchError, filter } from 'rxjs';

@Component({
  selector: 'app-add-expense',
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
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss',
})
export class AddExpenseComponent {
  expenseForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  years: number[] = [];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  isEditWorkflow = false;
  selectedExpense: FinancialViewModel;
  showStartEnd=false;
  eventsList: any;

  constructor(
    private dialogRef: MatDialogRef<AddExpenseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private incomeExpenseHttpService: IncomeExpensesHttpService
  ) {
    this.eventsList = data.eventsList;
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.clientBirthYear = moment(data.clientBirthDate).year();
    const birthDate = new Date(data.clientBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birth month/day is in the future
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    this.clientAge = age
    if(data.forecastStartDateYear - this.clientBirthYear > this.clientAge) this.clientBirthYear =  this.clientBirthYear+1

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedExpense = data.selectedExpense;

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
    });

    this.onCycleValueChange(this.cycles[1].id);

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedExpense.amount.cycle?.id)
      this.expenseForm
        .get('description')
        ?.patchValue(this.selectedExpense.description);
      this.expenseForm
        .get('currencySymbol')
        ?.patchValue(this.selectedExpense.amount.currencySymbol);
      this.expenseForm
        .get('amount')
        ?.patchValue(this.selectedExpense.amount.amount);
      this.expenseForm
        .get('cycle')
        ?.patchValue(this.selectedExpense.amount.cycle?.id);
      this.expenseForm.get('start')?.patchValue(this.selectedExpense.start.year);
      this.expenseForm.get('end')?.patchValue(this.selectedExpense.end.year);
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  
    onCycleValueChange(event: any) {
      console.log({event})
      this.showStartEnd = this.cycles.find(cycle => cycle.id === event)?.description !== 'One-off'
      if(!this.showStartEnd) {
        this.expenseForm.controls['end'].clearValidators();
        this.expenseForm.controls['end'].updateValueAndValidity();
      }
      else {
        this.expenseForm.controls['end'].addValidators(Validators.required);
        this.expenseForm.controls['end'].updateValueAndValidity();
      }
    }
  

  addExpense(): void {
    if (this.expenseForm.valid) {
      console.log('Form Submitted', this.expenseForm.value);
      var expense: FinancialViewModel = {
        id: this.isEditWorkflow ? this.selectedExpense.id : null,
        description: this.expenseForm.get('description')?.value,
        amount: {
          amount: this.expenseForm.get('amount')?.value,
          currencySymbol: this.expenseForm.get('currencySymbol')?.value,
          cycle: {
            id: this.expenseForm.get('cycle')?.value ?? '',
            description:
              this.cycles.find(
                (x) => x.id === this.expenseForm.get('cycle')?.value
              )?.description ?? '',
          },
        },
        start: {
          age:
            this.expenseForm.get('start')?.value !== null &&
            this.expenseForm.get('start')?.value !== ''
              ? this.expenseForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            this.expenseForm.get('start')?.value !== null &&
            this.expenseForm.get('start')?.value !== ''
              ? this.expenseForm.get('start')?.value
              : 0,
        },
        end: {
          age:
            this.expenseForm.get('end')?.value !== null &&
            this.expenseForm.get('end')?.value !== ''
              ? this.expenseForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
            this.expenseForm.get('end')?.value !== null &&
            this.expenseForm.get('end')?.value !== ''
              ? this.expenseForm.get('end')?.value
              : 0,
        },      
      };

      var action$ = this.incomeExpenseHttpService.addExpense(
        this.cashflowId,
        expense
      );

      if (this.isEditWorkflow)
        action$ = this.incomeExpenseHttpService.updateExpense(
          this.cashflowId,
          expense
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
