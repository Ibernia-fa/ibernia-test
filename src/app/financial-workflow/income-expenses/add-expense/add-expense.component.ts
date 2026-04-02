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
import { extractEventId, resolveYear } from 'src/app/shared/utils/event-date-utils';
import { catchError, filter, finalize } from 'rxjs';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateIncomeExpenseLabelPipe } from 'src/app/core/pipes/translate-income-expense-label.pipe';
import { getAmountCycleLabel } from 'src/app/shared/utils/amount-cycle-label';
import { CommonModule } from '@angular/common';

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
    CommonModule,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule,
    TranslateIncomeExpenseLabelPipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.scss',
})
export class AddExpenseComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;

  onAmountInput(rawValue: string) {
    const { parseFormattedNumber } = require('src/app/shared/utils/number-utils');
    if (!rawValue || rawValue.trim() === '') {
      this.expenseForm.get('amount')?.setValue('');
      return;
    }
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
  customDescriptionAutoRenamed: string;
  showNameEdit: boolean = false;
  forecastEndYear: number;
  isSaving = false;
  scenarioMode: boolean = false;
  private initialFormSnapshot = '';

  constructor(
    private dialogRef: MatDialogRef<AddExpenseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private incomeExpenseHttpService: IncomeExpensesHttpService,
    private translate: TranslateService,
  ) {
    this.expenseTypes = data.expenseType;
    this.eventsList = data.eventsList ?? [];
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.clientBirthYear = moment(data.clientBirthDate).year();
    const birthDate = new Date(data.clientBirthDate);
    const forecastStart = new Date(data.forecastStartDateYear, 0, 1);
    let age = forecastStart.getFullYear() - birthDate.getFullYear();
    const monthDiff = forecastStart.getMonth() - birthDate.getMonth();
    const dayDiff = forecastStart.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    this.clientAge = age;
    if (data.forecastStartDateYear - this.clientBirthYear > this.clientAge) this.clientBirthYear = this.clientBirthYear + 1


    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.scenarioMode = data.scenarioMode ?? false;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedExpense = data.selectedExpense;
    this.isNameEditable = this.selectedExpense?.description != "Living costs"
      && this.selectedExpense?.description != "Housing"
      && this.selectedExpense?.description != "Debt repayment";

    const planEndYear = this.resolvePlanEndYear(data);
    const iterations = planEndYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.forecastEndYear = planEndYear;

    this.expenseForm = this.fb.group({
      description: [this.selectedExpense?.description, Validators.required],
      expenseType: [this.expenseTypes[0], Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: ['', [Validators.required, this.greaterThanZero()]],
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

    if (!this.isEditWorkflow) {
      this.customDescriptionAutoRenamed = this.autoRenameCustom();
    }

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedExpense.amount.cycle?.id)
      this.expenseForm.get('description')?.patchValue(this.selectedExpense.description);
      this.expenseForm.get('currencySymbol')?.patchValue(this.clientPreferredCurrency);
      const amountVal = this.selectedExpense.amount.amount;
      this.expenseForm.get('amount')?.patchValue(amountVal === 0 || amountVal === null || amountVal === undefined ? '' : amountVal);

      // thousand comma seperator (skip when amount is 0 to avoid showing error by default)
      setTimeout(() => {
        const el = this.amountInput?.nativeElement;
        const amount = this.expenseForm.get('amount')?.value;
        if (!el || amount === null || amount === undefined || amount === '') return;
        el.value = Number(amount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
      });

      this.expenseForm.get('cycle')?.patchValue(this.selectedExpense.amount.cycle?.id);
      if (this.selectedExpense.startEventId) {
        this.expenseForm.get('start')?.patchValue('event:' + this.selectedExpense.startEventId);
      } else {
        this.expenseForm.get('start')?.patchValue(this.selectedExpense.start?.year);
      }
      if (this.selectedExpense.endEventId) {
        this.expenseForm.get('end')?.patchValue('event:' + this.selectedExpense.endEventId);
      } else {
        this.expenseForm.get('end')?.patchValue(this.selectedExpense.end?.year);
      }
      const matchedEscalation = this.escalationRates.find(x => x.value === this.selectedExpense.escalationRate?.value);

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

    if (this.isEditWorkflow
      && this.selectedExpense?.description != null
      && (this.selectedExpense.description == "Living costs"
        || this.selectedExpense.description == "Housing"
        || this.selectedExpense.description == "Debt repayment"
      )) {
      this.onExpenseTypeChange(this.selectedExpense.description);
    }
    else if (this.isEditWorkflow && this.selectedExpense != null) {
      this.expenseForm.get('expenseType')?.patchValue('Custom');
      this.onExpenseTypeChange('Custom');
    }
    else {
      this.onExpenseTypeChange(this.expenseTypes[0]);
    }

    this.setIsDefaultExpense();
    this.setExpenseIcon();
    this.captureInitialFormState();
  }

  autoRenameCustom(): string {
    let baseName = this.expenseForm.get('expenseType')?.value;

    if (baseName == undefined || this.expenseForm.get('expenseType')?.value == "Custom")
      baseName = "Custom expense";

    if (baseName !== "Custom expense")
      return baseName;

    const existing = this.data.expenses
      ?.filter((e: any) =>
        e.isDefault == false && e.description != "Debt repayment" && e.description != "Insurance"
      ) ?? [];

    if (existing.length === 0 && baseName !== "Custom expense") {
      return baseName;
    }

    return `${baseName} #${existing.length + 1}`;
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

  getCycleLabel(cycle: Cycle): string {
    return getAmountCycleLabel(cycle, this.translate);
  }

  addExpense(): void {
    if (this.isSaving) return;
    this.expenseForm.markAllAsTouched();
    this.expenseForm.markAsDirty();

    if (this.expenseForm.valid) {
      this.isSaving = true;
      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.expenseForm.get('customEscalationRate')?.value
        : this.expenseForm.get('escalationRate')?.value;
      const matchedRate = this.escalationRates.find(
        (x) => x.value === escalationRateValue
      );

      const startVal = this.expenseForm.get('start')?.value;
      const endVal = this.expenseForm.get('end')?.value;
      const startYear = resolveYear(startVal, this.eventsList);
      const endYear = resolveYear(endVal, this.eventsList);
      const startEventId = extractEventId(startVal);
      const endEventId = extractEventId(endVal);

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
          age: startYear ? startYear - this.clientBirthYear : 0,
          year: startYear || 0,
        },
        end: {
          age: endYear ? endYear - this.clientBirthYear : 0,
          year: endYear || 0,
        },
        startEventId,
        endEventId,
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

      if (this.scenarioMode) {
        this.isSaving = false;
        this.dialogRef.close({
          status: 'Success',
          incomeExpense: null,
          scenarioItem: expense
        });
        return;
      }

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
          }),
          finalize(() => {
            this.isSaving = false;
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

  private greaterThanZero(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = Number(control.value);
      if (control.value === '' || control.value === null || control.value === undefined) return null;
      return value > 0 ? null : { greaterThanZero: true };
    };
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const startRaw = group.get('start')?.value;
      const endRaw = group.get('end')?.value;
      const start = resolveYear(startRaw, this.eventsList);
      const end = resolveYear(endRaw, this.eventsList);
      const endCtrl = group.get('end');

      if (endCtrl) {
        const existing = endCtrl.errors ?? null;

        if (start > 0 && end > 0 && end < start) {
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
    if (!this.isEditWorkflow) return 'Add expense';
    return this.selectedExpense?.description ?? this.customDescriptionAutoRenamed ?? 'Expense';
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

    if (!descriptionCtrl) return;

    this.isNameEditable = false;
    this.isDefaultExpense = false;

    const expenseConfig: Record<string, {
      icon: string;
      description?: string;
      editableName?: boolean;
      isDefault?: boolean;
      requireDescription?: boolean;
    }> = {
      'Custom': {
        icon: 'custom-expense',
        editableName: true
      },
      'Living costs': {
        icon: 'living-costs',
        description: 'Living costs',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'Housing': {
        icon: 'housing',
        description: 'Housing',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'Debt repayment': {
        icon: 'debt-repayment',
        description: 'Debt repayment',
        requireDescription: true,
        editableName: false
      }
    };

    const isCustom = this.selectedExpense != null
      && this.selectedExpense.description != "Living costs"
      && this.selectedExpense.description != "Housing"
      && this.selectedExpense.description != "Debt repayment";

    const config = isCustom ? expenseConfig["Custom"] : expenseConfig[value];
    if (!config || !descriptionCtrl) return;

    this.expenseIcon = config.icon;
    this.isNameEditable = !!config.editableName;
    this.isDefaultExpense = !!config.isDefault;

    if (!this.isEditWorkflow && this.isNameEditable) {
      this.showNameEdit = true;
    } else if (!this.isNameEditable) {
      this.showNameEdit = false;
    }

    if (!this.isEditWorkflow) {
      this.applyDefaultStartEnd(value);
    }

    if (this.isEditWorkflow) {
      if (this.selectedExpense?.description != undefined) {
        descriptionCtrl.setValue(this.selectedExpense?.description, { emitEvent: true });
      }
      else {
        descriptionCtrl.setValue(value, { emitEvent: true });
      }
    }
    else {
      const nextDescription = value === 'Custom'
        ? ''
        : (config.description ?? value);
      descriptionCtrl.setValue(nextDescription, { emitEvent: true });
    }

    if (config.requireDescription || value === 'Custom') {
      descriptionCtrl.setValidators([Validators.required]);
    } else {
      descriptionCtrl.clearValidators();
    }

    descriptionCtrl.updateValueAndValidity();
  }

  toggleNameEdit() {
    this.showNameEdit = !this.showNameEdit;
  }

  private applyDefaultStartEnd(expenseType: string): void {
    const startCtrl = this.expenseForm.get('start');
    const endCtrl = this.expenseForm.get('end');

    if (!startCtrl || !endCtrl) return;

    switch (expenseType) {
      case 'Living costs':
      case 'Housing':
        startCtrl.setValue(this.currentYear);
        endCtrl.setValue(this.forecastEndYear);
        break;

      default:
        startCtrl.reset();
        endCtrl.reset();
        break;
    }

    startCtrl.updateValueAndValidity();
    endCtrl.updateValueAndValidity();
  }

  getAgeForYear(year: number): number {
    return Number(year) - this.clientBirthYear;
  }

  getStartYear(): number {
    return resolveYear(this.expenseForm.get('start')?.value, this.eventsList);
  }

  getEndEvents(): any[] {
    const startYear = this.getStartYear();
    return (this.eventsList ?? []).filter((e: any) => (e?.start?.year ?? 0) >= startYear);
  }

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }

  private resolvePlanEndYear(data: any): number {
    const planEndYear = Number(data?.planEndYear);
    if (Number.isFinite(planEndYear) && planEndYear > 0) {
      return planEndYear;
    }
    const fallback = Number(data?.forecastEndDateYear);
    if (Number.isFinite(fallback) && fallback > 0) {
      return fallback;
    }
    return new Date().getFullYear();
  }

  hasFormChanges(): boolean {
    return JSON.stringify(this.expenseForm.getRawValue()) !== this.initialFormSnapshot;
  }

  private captureInitialFormState(): void {
    this.initialFormSnapshot = JSON.stringify(this.expenseForm.getRawValue());
    this.expenseForm.markAsPristine();
  }
}
