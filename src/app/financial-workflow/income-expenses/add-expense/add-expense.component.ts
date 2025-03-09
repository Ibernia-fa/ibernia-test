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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import { Cycle, EscalationRate } from '../../timeline/models/financial-timeline';
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
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss',
})
export class AddExpenseComponent {
  expenseForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  isEditWorkflow = false;
  selectedExpense: FinancialViewModel;

  constructor(
    private dialogRef: MatDialogRef<AddExpenseComponent>,
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
    this.selectedExpense = data.selectedExpense

    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: ['', Validators.required],
      expensedate: ['', Validators.required]
    });

    if(this.isEditWorkflow) {
      this.expenseForm.get('description')?.patchValue(this.selectedExpense.description)
      this.expenseForm.get('currencySymbol')?.patchValue(this.selectedExpense.amount.currencySymbol)
      this.expenseForm.get('amount')?.patchValue(this.selectedExpense.amount.amount)
      this.expenseForm.get('cycle')?.patchValue(this.selectedExpense.amount.cycle.id)
      this.expenseForm.get('expensedate')?.patchValue(this.selectedExpense.date)
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
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
            id: this.expenseForm.get('cycle')?.value ?? "",
            description: this.cycles.find(x => x.id === this.expenseForm.get('cycle')?.value)?.description ?? "",
          },
        },
        date: this.expenseForm.get('expensedate')?.value
      };

      var action$ = this.incomeExpenseHttpService.addExpense(this.cashflowId, expense);
      
      if(this.isEditWorkflow)
        action$ = this.incomeExpenseHttpService.updateExpense(this.cashflowId, expense);
        
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
          incomeExpense: res
        });
      });
      // Handle form submission logic
    } else {
      console.log('Form is invalid');
    }
  }
}
