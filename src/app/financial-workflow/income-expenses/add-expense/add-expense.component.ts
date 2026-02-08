import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import { Cycle, EscalationRate } from '../../timeline/models/financial-timeline';
import { IncomeExpensesHttpService } from '../services/income-expenses-http.service';
import moment from 'moment';
import { FinancialViewModel } from '../model/income-expense';
import { catchError, filter } from 'rxjs';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule } from '@ngx-translate/core';

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
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss',
})
export class AddExpenseComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;

  onAmountInput(rawValue: string) {
    const { parseFormattedNumber } = require('src/app/shared/utils/number-utils');
    const value = parseFormattedNumber(rawValue);
    this.expenseForm.get('amount')?.setValue(value);
  }

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
  showStartEnd = false;
  eventsList: any;
  selectedEscalationDescription: string;
  currentYear: number = new Date().getFullYear();
  isNameEditable: boolean | false;
  expenseTypes: string[] = [];
  isDefaultExpense: boolean = false;
  expenseIcon: string;

  constructor(
    private dialogRef: MatDialogRef<AddExpenseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private incomeExpenseHttpService: IncomeExpensesHttpService
  ) {
    this.expenseTypes = data.expenseType;
    this.eventsList = data.eventsList;
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.clientBirthYear = moment(data.clientBirthDate).year();
    const birthDate = new Date(data.clientBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    this.clientAge = age
    if (data.forecastStartDateYear - this.clientBirthYear > this.clientAge) this.clientBirthYear = this.clientBirthYear + 1

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedExpense = data.selectedExpense;
    this.isNameEditable = this.selectedExpense?.description != "Living costs"
      && this.selectedExpense?.description != "Housing"
      && this.selectedExpense?.description != "Debt repayment"; 

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.expenseForm = this.fb.group({
      expenseType: [this.expenseTypes[0], Validators.required],
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: ['']
    });
    this.expenseForm.get('currencySymbol')?.disable();
    this.expenseForm.setValidators(this.endOnOrAfterStartValidator());
    this.expenseForm.updateValueAndValidity({ emitEvent: false });
    console.log(this.expenseForm);
    this.onCycleValueChange(this.cycles[1].id);

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedExpense.amount.cycle?.id)
      this.expenseForm
        .get('description')
        ?.patchValue(this.selectedExpense.description);
      this.expenseForm
        .get('currencySymbol')
        ?.patchValue(this.clientPreferredCurrency);
      this.expenseForm
        .get('amount')
        ?.patchValue(this.selectedExpense.amount.amount);
      setTimeout(() => {
        const el = this.amountInput?.nativeElement;
        const amount = this.expenseForm.get('amount')?.value;
        if (!el || amount === null || amount === undefined || amount === '') return;
        el.value = Number(amount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
      });
      this.expenseForm
        .get('cycle')
        ?.patchValue(this.selectedExpense.amount.cycle?.id);
      this.expenseForm.get('start')?.patchValue(this.selectedExpense.start?.year);
      this.expenseForm.get('end')?.patchValue(this.selectedExpense.end?.year);
      const matchedEscalation = this.escalationRates.find(
        x => x.value === this.selectedExpense.escalationRate?.value
      );

      const cycleId = this.selectedExpense.amount.cycle?.id;
      const cycle = this.cycles.find(x => x.id === cycleId);

      if (cycle?.description === 'One-off') {
        this.expenseForm.get('cycle')?.disable();
      }

      if (matchedEscalation) {
        this.expenseForm.get('escalationRate')?.patchValue(matchedEscalation.value);
        this.selectedEscalationDescription = matchedEscalation.description;
      } else if (
        this.selectedExpense.escalationRate &&
        this.selectedExpense.escalationRate.description === 'Increases at custom rate'
      ) {
        this.escalationRates = this.escalationRates.filter(
          x => x.description !== 'Increases at custom rate'
        );

        this.escalationRates.push({
          description: 'Increases at custom rate',
          value: this.selectedExpense.escalationRate.value
        });

        this.expenseForm.get('escalationRate')?.patchValue(this.selectedExpense.escalationRate.value);
        this.expenseForm.get('customEscalationRate')?.patchValue(this.selectedExpense.escalationRate.value);
        this.selectedEscalationDescription = 'Increases at custom rate';

        const customControl = this.expenseForm.get('customEscalationRate');
        customControl?.setValidators([Validators.required, Validators.min(0)]);
        customControl?.updateValueAndValidity();
      }
    }

    this.onExpenseTypeChange(this.selectedExpense?.description ?? this.expenseTypes[0]);
    this.setIsDefaultExpense();
    this.setExpenseIcon();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCycleValueChange(event: any) {
    const isOneOff = this.cycles.find(cycle => cycle.id === event)?.description === 'One-off';

    this.showStartEnd = !isOneOff;

    if (!this.showStartEnd) {
      this.expenseForm.controls['end'].clearValidators();
      this.expenseForm.controls['end'].updateValueAndValidity();
    }
    else {
      this.expenseForm.controls['end'].addValidators(Validators.required);
      this.expenseForm.controls['end'].updateValueAndValidity();
    }

    const escalationControl = this.expenseForm.get('escalationRate');

    if (isOneOff) {
      escalationControl?.clearValidators();
    } else {
      escalationControl?.setValidators(Validators.required);
    }

    escalationControl?.updateValueAndValidity();
  }

  addExpense(): void {
    this.expenseForm.markAllAsTouched();
    this.expenseForm.markAsDirty();

    if (this.expenseForm.valid) {
      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.expenseForm.get('customEscalationRate')?.value
        : this.expenseForm.get('escalationRate')?.value;
      const matchedRate = this.escalationRates.find(
        (x) => x.value === escalationRateValue
      );

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
        escalationRate: escalationRateValue !== null && escalationRateValue !== ''
          ? matchedRate ?? {
            description: this.selectedEscalationDescription ?? '', // Use actual description
            value: escalationRateValue
          }
          : {
            description: '',
            value: 0
          },
        isDefault: this.isDefaultExpense,
        isIncomeExpenseSource: this.selectedExpense?.isIncomeExpenseSource ?? true,
        icon: this.expenseIcon
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
    } else {
      console.log('Form is invalid');
    }
  }

  get isCustomEscalationSelected(): boolean {
    const selectedValue = this.expenseForm.get('escalationRate')?.value;

    // Find exact match by both value and description
    return this.escalationRates.some(e =>
      e.value === selectedValue && e.description === 'Increases at custom rate'
    );
  }

  onEscalationRateChange(event: MatSelectChange): void {
    const selectedOption = event.source.selected;

    let description: string | null = null;

    if (Array.isArray(selectedOption)) {
      description = selectedOption[0]?.viewValue ?? null;
    } else {
      description = selectedOption?.viewValue ?? null;
    }

    this.selectedEscalationDescription = description;

    const customControl = this.expenseForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null); // Optionally reset field
    }

    customControl?.updateValueAndValidity();
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('start')?.value;
      const end = group.get('end')?.value;
      const endCtrl = group.get('end');

      if (endCtrl) {
        const existing = endCtrl.errors ?? null;

        if (start != null && start !== '' && end != null && end !== '' && end < start) {
          endCtrl.setErrors({ ...(existing ?? {}), endBeforeStart: true });
        } else {
          if (existing && 'endBeforeStart' in existing) {
            const { endBeforeStart, ...rest } = existing;
            endCtrl.setErrors(Object.keys(rest).length ? rest : null);
          }
        }
      }
      return null;
    };
  }

  get expenseTitle(): string {
    const value = String(this.expenseForm.get('description')?.value || '').trim();
    const title = value || 'Expense';

    return title[0].toUpperCase() + title.slice(1);
  }

  setExpenseIcon(): void {
    if (this.selectedExpense?.icon != null) {
      this.expenseIcon = this.selectedExpense.icon;
    }
    else if (this.expenseForm.get("description")?.value == "Living costs") {
      this.expenseIcon = "living-costs";
    }
    else if (this.expenseForm.get("description")?.value == "Housing") {
      this.expenseIcon = "housing";
    }
    else if (this.expenseForm.get("description")?.value == "Debt repayment") {
      this.expenseIcon = "debt-repayment";
    }
    else {
      this.expenseIcon = "custom-expense";
    }
  }

  setIsDefaultExpense(): void {
    if (this.selectedExpense?.isDefault != null) {
      this.isDefaultExpense = this.selectedExpense.isDefault;
    }
    else if (this.expenseForm.get("description")?.value == "Living costs"
      || this.expenseForm.get("description")?.value == "Housing") {
      this.isDefaultExpense = true;
    }
    else {
      this.isDefaultExpense = false;
    }
  }

  onExpenseTypeChange(value: string): void {
    const descriptionCtrl = this.expenseForm.get('description');

    this.isNameEditable = false;
    this.isDefaultExpense = false;

    const expenseConfig: Record<string, {
      icon: string;
      description?: string;
      editableName?: boolean;
      isDefault?: boolean;
      requireDescription?: boolean;
    }> = {
      'Living costs': {
        icon: 'living-costs',
        description: 'Living costs',
        isDefault: true,
        requireDescription: true
      },
      'Housing': {
        icon: 'housing',
        description: 'Housing',
        isDefault: true,
        requireDescription: true
      },
      'Debt repayment': {
        icon: 'debt-repayment',
        description: 'Debt repayment',
        requireDescription: true
      },
      'Custom': {
        icon: 'custom-expense',
        editableName: true
      }
    };

    const config = expenseConfig[value];
    if (!config || !descriptionCtrl) return;

    this.expenseIcon = config.icon;
    this.isNameEditable = !!config.editableName;
    this.isDefaultExpense = !!config.isDefault;

    if (config.description !== undefined) {
      descriptionCtrl.setValue(config.description, { emitEvent: true });
    } else {
      descriptionCtrl.setValue('', { emitEvent: true });
    }

    if (config.requireDescription) {
      descriptionCtrl.setValidators([Validators.required]);
    } else {
      descriptionCtrl.clearValidators();
    }

    descriptionCtrl.updateValueAndValidity();
  }
}
