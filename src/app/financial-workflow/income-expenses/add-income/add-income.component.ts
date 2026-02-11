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
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { Cycle, EscalationRate } from '../../timeline/models/financial-timeline';
import moment from 'moment';
import { FinancialViewModel } from '../model/income-expense';
import { IncomeExpensesHttpService } from '../services/income-expenses-http.service';
import { catchError, filter } from 'rxjs';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

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
    CommonModule,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.scss',
})
export class AddIncomeComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  eventsList: any[] = [];
  incomeForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  years: number[] = [];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  isEditWorkflow = false;
  selectedIncome: FinancialViewModel;
  showStartEnd = false;
  selectedEscalationDescription: string | null;
  currentYear: number = new Date().getFullYear();
  isNameEditable: boolean | false;
  incomeTypes: string[] = [];
  isDefaultIncome: boolean = false;
  incomeIcon: string;
  customDescriptionAutoRenamed: string;
  showNameEdit: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AddIncomeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private incomeExpenseHttpService: IncomeExpensesHttpService
  ) {
    this.incomeTypes = data.incomeType;
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
    this.selectedIncome = data.selectedIncome;

    this.isNameEditable = this.selectedIncome?.description != "Salary"
      && this.selectedIncome?.description != "State pension"
      && this.selectedIncome?.description != "Rental income";

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.incomeForm = this.fb.group({
      description: [this.selectedIncome?.description, Validators.required],
      incomeType: [this.incomeTypes[0], Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: ['']
    });
    this.incomeForm.get('currencySymbol')?.disable();
    this.incomeForm.setValidators(this.endOnOrAfterStartValidator());
    this.incomeForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.cycles[1].id);

    if (!this.isEditWorkflow) {
      this.customDescriptionAutoRenamed = this.autoRenameCustom();
    }

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedIncome.amount.cycle?.id)
      this.incomeForm.get('description')?.patchValue(this.selectedIncome.description);
      this.incomeForm.get('currencySymbol')?.patchValue(this.clientPreferredCurrency);
      this.incomeForm.get('amount')?.patchValue(this.selectedIncome.amount.amount);

      // thousand comma seperator
      setTimeout(() => {
        const el = this.amountInput?.nativeElement;
        const amount = this.incomeForm.get('amount')?.value;
        if (!el || amount === null || amount === undefined || amount === '') return;
        el.value = Number(amount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
      });

      this.incomeForm.get('cycle')?.patchValue(this.selectedIncome.amount.cycle?.id);
      this.incomeForm.get('start')?.patchValue(this.selectedIncome.start?.year);
      this.incomeForm.get('end')?.patchValue(this.selectedIncome.end?.year);

      const matchedEscalation = this.escalationRates.find(x => x.value === this.selectedIncome.escalationRate?.value);
      const cycleId = this.selectedIncome.amount.cycle?.id;
      const cycle = this.cycles.find(x => x.id === cycleId);

      if (cycle?.description === 'One-off') {
        this.incomeForm.get('cycle')?.disable();
      }

      if (matchedEscalation) {
        // Standard escalation rate selected
        this.incomeForm.get('escalationRate')?.patchValue(matchedEscalation.value);
        this.selectedEscalationDescription = matchedEscalation.description;
      } else if (
        this.selectedIncome.escalationRate &&
        this.selectedIncome.escalationRate.description === 'Increases at custom rate'
      ) {
        // Custom escalation
        this.escalationRates = this.escalationRates.filter(
          x => x.description !== 'Increases at custom rate'
        );

        // Then add the custom rate value to escalationRates
        this.escalationRates.push({
          description: 'Increases at custom rate',
          value: this.selectedIncome.escalationRate.value
        });

        this.incomeForm.get('escalationRate')?.patchValue(this.selectedIncome.escalationRate.value);
        this.incomeForm.get('customEscalationRate')?.patchValue(this.selectedIncome.escalationRate.value);
        this.selectedEscalationDescription = 'Increases at custom rate';

        // Trigger validators for custom rate
        const customControl = this.incomeForm.get('customEscalationRate');
        customControl?.setValidators([Validators.required, Validators.min(0)]);
        customControl?.updateValueAndValidity();
      }
    }

    if (this.isEditWorkflow
      && this.selectedIncome?.description != null
      && (this.selectedIncome.description == "Salary"
        || this.selectedIncome.description == "State pension"
        || this.selectedIncome.description == "Rental income"
      )) {
      this.onIncomeTypeChange(this.selectedIncome.description);
    }
    else {
      this.onIncomeTypeChange(this.incomeTypes[0]);
    }

    this.setIsDefaultIncome();
    this.setIncomeIcon();
  }

  autoRenameCustom(): string {
    let baseName = this.incomeForm.get('incomeType')?.value;

    if (baseName == undefined || this.incomeForm.get('incomeType')?.value == "Custom")
      baseName = "Custom income";

    if (baseName !== "Custom income")
      return baseName;

    const existing = this.data.incomes
      ?.filter((e: any) =>
        e.isDefault == false && e.description != "Rental income" && e.description != "Pension Fund"
      ) ?? [];

    if (existing.length === 0 && baseName !== "Custom income") {
      return baseName;
    }

    return `${baseName} #${existing.length + 1}`;
  }

  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue);
    this.incomeForm.get('amount')?.setValue(value, { emitEvent: true });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCycleValueChange(event: any) {
    const isOneOff = this.cycles.find(cycle => cycle.id === event)?.description === 'One-off';
    this.showStartEnd = !isOneOff;
    if (!this.showStartEnd) {
      this.incomeForm.controls['end'].clearValidators();
      this.incomeForm.controls['end'].updateValueAndValidity();
    }
    else {
      this.incomeForm.controls['end'].addValidators(Validators.required);
      this.incomeForm.controls['end'].updateValueAndValidity();
    }
    const escalationControl = this.incomeForm.get('escalationRate');
    if (isOneOff) {
      escalationControl?.clearValidators();
    } else {
      escalationControl?.setValidators(Validators.required);
    }
    escalationControl?.updateValueAndValidity();
  }

  addIncome(): void {
    this.incomeForm.markAllAsTouched();
    this.incomeForm.markAsDirty();

    if (this.incomeForm.valid) {
      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.incomeForm.get('customEscalationRate')?.value
        : this.incomeForm.get('escalationRate')?.value;
      const matchedRate = this.escalationRates.find((x) => x.value === escalationRateValue);
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
        escalationRate: escalationRateValue !== null && escalationRateValue !== ''
          ? matchedRate ?? {
            description: this.selectedEscalationDescription ?? '',
            value: escalationRateValue
          }
          : {
            description: '',
            value: 0
          },
        isDefault: this.isDefaultIncome,
        isIncomeExpenseSource: this.selectedIncome?.isIncomeExpenseSource ?? true,
        icon: this.incomeIcon
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
    } else {
      console.log('Form is invalid');
    }
  }

  get isCustomEscalationSelected(): boolean {
    const selectedValue = this.incomeForm.get('escalationRate')?.value;

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

    const customControl = this.incomeForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }

    customControl?.updateValueAndValidity();
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('start')?.value;
      const end = group.get('end')?.value;
      const endCtrl = group.get('end');

      // Only validate when both are present (or when end is present)
      if (endCtrl) {
        const existing = endCtrl.errors ?? null;

        if (start != null && start !== '' && end != null && end !== '' && end < start) {
          // attach/merge the error onto the END control
          endCtrl.setErrors({ ...(existing ?? {}), endBeforeStart: true });
        } else {
          // remove just our error, keep any others
          if (existing && 'endBeforeStart' in existing) {
            const { endBeforeStart, ...rest } = existing;
            endCtrl.setErrors(Object.keys(rest).length ? rest : null);
          }
        }
      }
      return null;
    };
  }

  get incomeTitle(): string {
    const operation = this.isEditWorkflow ? "Edit - " : "Add - ";
    const title = this.selectedIncome?.description ?? this.customDescriptionAutoRenamed ?? "Income";
    return operation + (title[0].toUpperCase() + title.slice(1));
  }

  setIncomeIcon(): void {
    if (this.selectedIncome?.icon != null) {
      this.incomeIcon = this.selectedIncome.icon;
    }
    else if (this.incomeForm.get("description")?.value == "Salary") {
      this.incomeIcon = "salary";
    }
    else if (this.incomeForm.get("description")?.value == "State pension") {
      this.incomeIcon = "state-pension";
    }
    else if (this.incomeForm.get("description")?.value == "Rental income") {
      this.incomeIcon = "rental-income";
    }
    else {
      this.incomeIcon = "custom-income";
    }
  }

  setIsDefaultIncome(): void {
    if (this.selectedIncome?.isDefault != null) {
      this.isDefaultIncome = this.selectedIncome.isDefault;
    }
    else if (this.incomeForm.get("description")?.value == "Salary"
      || this.incomeForm.get("description")?.value == "State pension") {
      this.isDefaultIncome = true;
    }
    else {
      this.isDefaultIncome = false;
    }
  }

  onIncomeTypeChange(value: string): void {
    const descriptionCtrl = this.incomeForm.get('description');

    this.isNameEditable = false;
    this.isDefaultIncome = false;

    const incomeConfig: Record<string, {
      icon: string;
      description?: string;
      editableName?: boolean;
      isDefault?: boolean;
      requireDescription?: boolean;
    }> = {
      'Custom': {
        icon: 'custom-income',
        editableName: true
      },
      'Salary': {
        icon: 'salary',
        description: 'Salary',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'State pension': {
        icon: 'state-pension',
        description: 'State pension',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'Rental income': {
        icon: 'rental-income',
        description: 'Rental income',
        requireDescription: true,
        editableName: false
      }
    };

    const isCustom = this.selectedIncome != null
      && this.selectedIncome.description != "Salary"
      && this.selectedIncome.description != "State pension"
      && this.selectedIncome.description != "Rental income";

    const config = isCustom ? incomeConfig["Custom"] : incomeConfig[value];
    if (!config || !descriptionCtrl) return;

    this.incomeIcon = config.icon;
    this.isNameEditable = !!config.editableName;
    this.isDefaultIncome = !!config.isDefault;

    if (this.isEditWorkflow) {
      if (this.selectedIncome?.description != undefined) {
        descriptionCtrl.setValue(this.selectedIncome?.description, { emitEvent: true });
      }
      else {
        descriptionCtrl.setValue(value, { emitEvent: true });
      }
    }
    else {
      descriptionCtrl.setValue(this.customDescriptionAutoRenamed, { emitEvent: true });
    }

    if (config.requireDescription) {
      descriptionCtrl.setValidators([Validators.required]);
    } else {
      descriptionCtrl.clearValidators();
    }

    descriptionCtrl.updateValueAndValidity();
  }

  toggleNameEdit() {
    this.showNameEdit = !this.showNameEdit;
  }
}
