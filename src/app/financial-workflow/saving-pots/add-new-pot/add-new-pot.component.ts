import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  ControlEvent,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderChange, MatSliderModule } from '@angular/material/slider';
import { allCountries } from 'src/app/clients/models/country';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {
  Cycle,
  EscalationRate,
} from '../../timeline/models/financial-timeline';
import moment from 'moment';
import { SavingsPotsHttpService } from '../services/savings-pots-http.service';
import {
  ClientSaving,
  ComissionType,
  SavingPotType,
} from '../models/saving-pots.model';
import { catchError, filter } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { IntegerOnlyDirective } from 'src/app/directives/integerOnly.directive';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
@Component({
  selector: 'app-add-new-pot',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSliderModule,
    TablerIconsModule,
    MatCheckboxModule,
    // IntegerOnlyDirective,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective
  ],
  templateUrl: './add-new-pot.component.html',
  styleUrl: './add-new-pot.component.scss',
})
export class AddNewPotComponent {
  savingsForm: FormGroup;
  years: number[] = [];
  countries = allCountries;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  // isAmountType: boolean = true;
  cycles: Cycle[];
  escalationRates: EscalationRate[];
  eventsList: any;
  cashflowId: string;
  formattedReturnRate: string = '';
  formattedCommissionPercentage: string = '';
  selectedName: string = '';
  selectedNameIconUrl: string = '';
  inflationRate = 2.5;
  isEditWorkflow = false;
  selectedPot: ClientSaving;
  savingPotType= SavingPotType
  selectedEscalationDescription: string | null = null;
  savingPotValues = [
    // {
    //   name: 'Cash',
    //   iconUrl: 'cashflow-moneys-icon',
    //   type: SavingPotType.Cash,
    // },
    {
      name: 'Investment',
      iconUrl: 'cashflow-investment-icon',
      type: SavingPotType.Investment,
    },
    {
      name: 'Pension Fund',
      iconUrl: 'cashflow-pension-icon',
      type: SavingPotType.PensionFund,
    },
  ];
  forecastEndDateYear: any;
  forecastStartDateYear: any;
  isCashPotEditMode: boolean;

  constructor(
    private dialogRef: MatDialogRef<AddNewPotComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private savingPotsHttpService: SavingsPotsHttpService
  ) {
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.eventsList = data.eventsList;
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
    this.selectedPot = data.event
    this.forecastStartDateYear = data.forecastStartDateYear;
    this.forecastEndDateYear = data.forecastEndDateYear;

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.savingsForm = this.fb.group({
      name: ['', Validators.required],
      currency: [this.clientPreferredCurrency, Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      returnRate: [3.5],
      // lockPot: [true],
      lockPot: [false],
      start: [data.forecastStartDateYear, Validators.required],
      end: [data.forecastEndDateYear-1, Validators.required],
      // commissions: [true],
      commissions: [false],
      commissionType: ['amount'],
      commissionCurrency: [''],
      commissionAmount: [0],
      commissionCycle: [''],
      commissionPercentageCurrency: [''],
      commissionPercentageCycle: [this.cycles[2].id],
      commissionPercentage: [0],
      escalationRate: [''],
      customEscalationRate: [0]
    });

  this.savingsForm.setValidators(this.endOnOrAfterStartValidator());

    this.savingsForm.get('currency')?.disable();
    this.savingsForm.get('commissionCurrency')?.disable();


    this.savingsForm.get('returnRate')?.valueChanges.subscribe((value) => {
      this.formattedReturnRate = this.formatWithPercentage(value);
    });

    if(this.isEditWorkflow) {
      this.isCashPotEditMode = (this.selectedPot?.name ?? '').trim().toLowerCase() === 'cash';
      this.patchFormValues();
    if (this.isCashPotEditMode) {
        // Freeze the Type as Cash and don’t emit changes
        this.savingsForm.get('name')?.setValue('Cash', { emitEvent: false });
        this.savingsForm.get('name')?.disable({ emitEvent: false });
        this.selectedNameIconUrl = 'cashflow-moneys-icon';
      }
    }
  }


  onAmountFocus(e: Event) {
  // show raw (no commas) while typing
  const c = this.savingsForm.get('amount')!;
  (e.target as HTMLInputElement).value = (c.value ?? '').toString();
}

onAmountBlur(e: Event) {
  // pretty-print with commas when leaving the field
  const c = this.savingsForm.get('amount')!;
  const num = Number(String(c.value).replace(/,/g, ''));
  if (!isNaN(num)) {
    c.setValue(num, { emitEvent: false }); // model stays numeric
    (e.target as HTMLInputElement).value = num.toLocaleString('en-US');
  }
}

//   patchFormValues() {
//     var savingPotValue = this.savingPotValues.find(x => x.name === this.selectedPot.name);
//     if(savingPotValue) {
//       this.savingsForm.get('name')?.patchValue(savingPotValue.name)
//     }
//     else {
//       this.savingsForm.get('name')?.patchValue('Custom');
//       this.onNameValueChange('Custom');
//       this.savingsForm.get('customName')?.patchValue(this.selectedPot.name);
//     }

//     this.savingsForm.get('currency')?.patchValue(this.selectedPot.startingPotValue.currencySymbol);
//     this.savingsForm.get('amount')?.patchValue(this.selectedPot.startingPotValue.amount);
//     this.savingsForm.get('returnRate')?.patchValue(this.selectedPot.returnRate);
//     this.savingsForm.get('lockPot')?.patchValue(this.selectedPot.hasPotLocked);
//     this.savingsForm.get('start')?.patchValue(this.selectedPot.start.year);
//     this.savingsForm.get('end')?.patchValue(this.selectedPot.end.year);
//     this.savingsForm.get('commissions')?.patchValue(this.selectedPot.hasCommission);
//     var selectedComissionType = 'amount';
//     if(this.selectedPot.comission.type === ComissionType.Amount) {
//       selectedComissionType = 'amount'
//     }
//     if(this.selectedPot.comission.type === ComissionType.Percentage) {
//       selectedComissionType = 'percentage'
//     }
//     if(this.selectedPot.comission.type === ComissionType.Both) {
//       selectedComissionType = 'both'
//     }
//     this.savingsForm.get('commissionType')?.patchValue(selectedComissionType);
//     if(this.selectedPot.comission.type === ComissionType.Amount || this.selectedPot.comission.type === ComissionType.Both) {
//       this.savingsForm.get('commissionCurrency')?.patchValue(this.selectedPot.comission.amount.currencySymbol);
//       this.savingsForm.get('commissionAmount')?.patchValue(this.selectedPot.comission.amount.amount);
//       this.savingsForm.get('commissionCycle')?.patchValue(this.selectedPot.comission.amount.cycle?.id);
//     }
//     if(this.selectedPot.comission.type === ComissionType.Percentage || this.selectedPot.comission.type === ComissionType.Both) {
//       this.savingsForm.get('commissionPercentageCurrency')?.patchValue(this.selectedPot.comission.percentage?.currencySymbol);
//       this.savingsForm.get('commissionPercentageCycle')?.patchValue(this.selectedPot.comission.percentage?.cycle?.id);
//       this.savingsForm.get('commissionPercentage')?.patchValue(this.selectedPot.comission.percentage?.amount);
//     }
//     //this.savingsForm.get('escalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value);
// const matchedEscalation = this.escalationRates.find(
//   x =>
//     x.value === this.selectedPot.comission.escalationRate?.value &&
//     x.description === this.selectedPot.comission.escalationRate?.description
// );

// if (matchedEscalation) {
//   // Predefined escalation rate
//   this.savingsForm.get('escalationRate')?.patchValue(matchedEscalation.value);
//   this.selectedEscalationDescription = matchedEscalation.description;
// } else if (
//   this.selectedPot.comission.escalationRate &&
//   this.selectedPot.comission.escalationRate.description === 'Increases at custom rate'
// ) {
//   // Custom escalation case
//   this.escalationRates = this.escalationRates.filter(
//   x => x.description !== 'Increases at custom rate'
// );

// // Then add the custom rate value to escalationRates
// this.escalationRates.push({
//   description: 'Increases at custom rate',
//   value: this.selectedPot?.comission?.escalationRate?.value
// });
//   this.savingsForm.get('escalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value);
//   this.savingsForm.get('customEscalationRate')?.patchValue(
//     this.selectedPot.comission.escalationRate.value
//   );
//   this.selectedEscalationDescription = 'Increases at custom rate';

//   // Set validators again
//   const customControl = this.savingsForm.get('customEscalationRate');
//   customControl?.setValidators([Validators.required, Validators.min(0)]);
//   customControl?.updateValueAndValidity();
// }

//     console.log(this.selectedPot);
//     if(this.selectedPot.name.toLowerCase() == 'cash'){
//       this.savingsForm.get('name')?.disable();
//       this.savingsForm.get('customName')?.disable();
//     }

//   }


  patchFormValues() {
    // --- Type (name) ---
    if (this.isCashPotEditMode) {
      // Keep it Cash, do not touch customName control
      const savingPotValue = this.savingPotValues.find(x => x.name === this.selectedPot.name);
      if (savingPotValue) {
        this.savingsForm.get('name')?.patchValue(savingPotValue.name, { emitEvent: false });
      } else {
        this.savingsForm.get('name')?.patchValue('Custom', { emitEvent: false });
        this.onNameValueChange('Custom'); // will add customName control
        this.savingsForm.get('customName')?.patchValue(this.selectedPot.name, { emitEvent: false });
      }
    }

    // --- The rest of fields (unchanged behavior) ---
    this.savingsForm.get('currency')?.patchValue(this.selectedPot.startingPotValue.currencySymbol, { emitEvent: false });
    this.savingsForm.get('amount')?.patchValue(this.selectedPot.startingPotValue.amount, { emitEvent: false });
    // this.savingsForm.get('returnRate')?.patchValue(this.selectedPot.returnRate, { emitEvent: false });
  this.savingsForm.get('returnRate')?.patchValue(
  this.round2(this.selectedPot.returnRate),
  { emitEvent: false }
);
    this.savingsForm.get('lockPot')?.patchValue(this.selectedPot.hasPotLocked, { emitEvent: false });
    this.savingsForm.get('start')?.patchValue(this.selectedPot.start.year, { emitEvent: false });
    this.savingsForm.get('end')?.patchValue(this.selectedPot.end.year, { emitEvent: false });
    this.savingsForm.get('commissions')?.patchValue(this.selectedPot.hasCommission, { emitEvent: false });

    let selectedComissionType = 'amount';
    if (this.selectedPot.comission.type === ComissionType.Percentage) selectedComissionType = 'percentage';
    if (this.selectedPot.comission.type === ComissionType.Both) selectedComissionType = 'both';
    this.savingsForm.get('commissionType')?.patchValue(selectedComissionType, { emitEvent: false });

    if (this.selectedPot.comission.type === ComissionType.Amount || this.selectedPot.comission.type === ComissionType.Both) {
      this.savingsForm.get('commissionCurrency')?.patchValue(this.selectedPot.comission.amount.currencySymbol, { emitEvent: false });
      this.savingsForm.get('commissionAmount')?.patchValue(this.selectedPot.comission.amount.amount, { emitEvent: false });
      this.savingsForm.get('commissionCycle')?.patchValue(this.selectedPot.comission.amount.cycle?.id, { emitEvent: false });
    }
    if (this.selectedPot.comission.type === ComissionType.Percentage || this.selectedPot.comission.type === ComissionType.Both) {
      this.savingsForm.get('commissionPercentageCurrency')?.patchValue(this.selectedPot.comission.percentage?.currencySymbol, { emitEvent: false });
      this.savingsForm.get('commissionPercentageCycle')?.patchValue(this.selectedPot.comission.percentage?.cycle?.id, { emitEvent: false });
      this.savingsForm.get('commissionPercentage')?.patchValue(this.selectedPot.comission.percentage?.amount, { emitEvent: false });
    }

    const matchedEscalation = this.escalationRates.find(
      x =>
        x.value === this.selectedPot.comission.escalationRate?.value &&
        x.description === this.selectedPot.comission.escalationRate?.description
    );

    if (matchedEscalation) {
      this.savingsForm.get('escalationRate')?.patchValue(matchedEscalation.value, { emitEvent: false });
      this.selectedEscalationDescription = matchedEscalation.description;
    } else if (
      this.selectedPot.comission.escalationRate &&
      this.selectedPot.comission.escalationRate.description === 'Increases at custom rate'
    ) {
      this.escalationRates = this.escalationRates.filter(x => x.description !== 'Increases at custom rate');
      this.escalationRates.push({
        description: 'Increases at custom rate',
        value: this.selectedPot?.comission?.escalationRate?.value,
      });
      this.savingsForm.get('escalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value, { emitEvent: false });
      this.savingsForm.get('customEscalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value, { emitEvent: false });
      this.selectedEscalationDescription = 'Increases at custom rate';

      const customControl = this.savingsForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.updateValueAndValidity({ emitEvent: false });
    }
  }

  ngOnInit() {
    this.updateFormattedValue('returnRate');
  }
  closeDialog(): void {
    this.dialogRef.close();
  }

  onNameValueChange(name: any) {
    this.selectedName = name;
    if (name === 'Custom') {
      this.savingsForm.addControl(
        'customName',
        new FormControl('', [Validators.required])
      );
      this.savingsForm.updateValueAndValidity();
      this.selectedNameIconUrl = 'custom-option-icon'
    } else {
      this.savingsForm.removeControl('customName');
      this.savingsForm.updateValueAndValidity();

      const cusEvent = this.savingPotValues.find(
        (customEvent) => customEvent.name === name
      );
      this.selectedNameIconUrl = cusEvent?.iconUrl ?? '';
    }
  }

  isLockPotChanged(event: any) {
    console.log(event);

    if (event) {
      this.savingsForm.get('start')?.setValidators(Validators.required);
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.setValidators(Validators.required);
      this.savingsForm.get('end')?.updateValueAndValidity();

      this.savingsForm.get('end')?.patchValue(this.eventsList[0].start.year > 0 ? this.eventsList[0].start.year : this.forecastStartDateYear)
    } else {
      this.savingsForm.get('start')?.removeValidators(Validators.required);
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.removeValidators(Validators.required);
      this.savingsForm.get('end')?.updateValueAndValidity();

      this.savingsForm.get('end')?.patchValue(this.forecastEndDateYear-1)
    }
  }

  isCommissionsChanged(event: any) {
    console.log(event);
    this.savingsForm
    .get('commissionType')
    ?.setValue('amount');

    if (event) {
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
    } else {
      this.savingsForm
        .get('commissionCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionAmount')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionType')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.removeValidators(Validators.required);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
    }
  }

  // onSliderChange(value: any) {
  //   if (!isNaN(value)) {
  //     this.savingsForm.get('returnRate')?.setValue(value, { emitEvent: true });
  //   }
  // }

get isCustomEscalationSelected(): boolean {
  const selectedValue = this.savingsForm.get('escalationRate')?.value;


  // Find exact match by both value and description
  return this.escalationRates.some(e =>
    e.value === selectedValue && e.description === 'Increases at custom rate'
  );
}

  get isOneOff(): boolean {
    // const selectedValue = this.savingsForm.get('escalationRate')?.value;
    return this.cycles.find(cycle => cycle.id === this.savingsForm.get('commissionCycle')?.value)?.description === 'One-off';
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

  const customControl = this.savingsForm.get('customEscalationRate');

  if (description === 'Increases at custom rate') {
    customControl?.setValidators([Validators.required, Validators.min(0)]);
  } else {
    customControl?.clearValidators();
    customControl?.setValue(null); // Optionally reset field
  }

  customControl?.updateValueAndValidity();
}

  onInputChange(event: any, controlName: string) {
    let value = event.target.value.replace('%', '').trim();
    if (!isNaN(value) && value !== '') {
      this.savingsForm
        .get(controlName)
        ?.setValue(parseFloat(value), { emitEvent: true });
    }
  }

  onInputBlur(event: any, controlName: string) {
    let value = this.savingsForm.get(controlName)?.value || 0;
    this.savingsForm.get(controlName)?.setValue(value, { emitEvent: true });
    this.updateFormattedValue(controlName);
  }

  updateFormattedValue(controlName: string) {
    let value = this.savingsForm.get(controlName)?.value || 0;
    if(controlName === 'returnRate') {
      this.formattedReturnRate = this.formatWithPercentage(value);
    }
    if(controlName === 'commissionPercentage') {
      this.formattedCommissionPercentage = this.formatWithPercentage(value);
    }
  }

  onAmountInput(rawValue: string) {
    if (rawValue == null) rawValue = '';
    const cleaned = rawValue.replace(/[^0-9.]/g, '');
    const parsed = cleaned === '' ? 0 : parseFloat(cleaned);
    const value = isNaN(parsed) ? 0 : parsed;
    this.savingsForm.get('amount')?.setValue(value, { emitEvent: true });
  }

  formatWithPercentage(value: number | string): string {
    return value !== null && value !== '' ? `${value}%` : '0%';
  }

  saveCashflow(): void {
    console.log(this.savingsForm);
    this.savingsForm.markAllAsTouched();
    const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
    const selectedEscalationRateValue = isCustomEscalation
      ? this.savingsForm.get('customEscalationRate')?.value
      : this.savingsForm.get('escalationRate')?.value;
 const rr = this.round2(this.savingsForm.get('returnRate')?.value ?? 0);
  const real = this.savingsForm.get('name')?.value !== 'Cash'
    ? this.round2(rr - this.inflationRate)
    : 0;
    if (this.savingsForm.valid) {
      var clientSaving: ClientSaving = {
        id: this.isEditWorkflow ? this.selectedPot.id : null,
        name: this.savingsForm.get('name')?.value !== 'Custom'
        ? this.savingsForm.get('name')?.value
        : this.savingsForm.get('customName')?.value,
        isGrowing: false,
        nominalValue: 0,
        realValue: 0,
        realGrowthRate: 0,
        inflationRate: this.savingsForm.get('name')?.value !== 'Cash' ? this.inflationRate : 0,
        startingPotValue: {
          amount: this.savingsForm.get('amount')?.value,
          currencySymbol: this.savingsForm.get('currency')?.value,
          cycle: {
            id: '',
            description: '',
          },
        },
        comission: {
          amount: {
            amount: this.savingsForm.get('commissionAmount')?.value ?? 0,
            currencySymbol:
              this.savingsForm.get('commissionCurrency')?.value ?? '',
            cycle:
              this.savingsForm.get('commissionCycle')?.value !== null &&
              this.savingsForm.get('commissionCycle')?.value !== ''
                ? this.cycles.find(x => x.id === this.savingsForm.get('commissionCycle')?.value) ??
                this.savingsForm.get('commissionCycle')?.value
                : null,
          },
          percentage: {
            amount: this.savingsForm.get('commissionPercentage')?.value ?? 0,
            currencySymbol:
              this.savingsForm.get('commissionPercentageCurrency')?.value ?? '',
            cycle:
              this.savingsForm.get('commissionPercentageCycle')?.value !== null &&
              this.savingsForm.get('commissionPercentageCycle')?.value !== ''
                ? this.cycles.find(x => x.id === this.savingsForm.get('commissionPercentageCycle')?.value) ??
                this.savingsForm.get('commissionPercentageCycle')?.value
                : {
                    id: '',
                    description: '',
                  },
          },
          // escalationRate:
          //   this.savingsForm.get('escalationRate')?.value !== null &&
          //   this.savingsForm.get('escalationRate')?.value !== ''
          //     ? this.escalationRates.find(x => x.value === this.savingsForm.get('escalationRate')?.value) ??
          //     this.savingsForm.get('escalationRate')?.value
          //     : {
          //         id: '',
          //         description: '',
          //       },
  escalationRate:
  selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
    ? this.escalationRates.find(x => x.value === selectedEscalationRateValue) ??
      {
        description: this.selectedEscalationDescription ?? selectedEscalationRateValue,
        value: selectedEscalationRateValue
      }
    : {
        description: '',
        value: 0
      },
          type: this.savingsForm.get('commissionType')?.value === 'amount'
            ? ComissionType.Amount
            : this.savingsForm.get('commissionType')?.value === 'percentage'
            ? ComissionType.Percentage : ComissionType.Both,
        },
        hasCommission: this.savingsForm.get('commissions')?.value,
        orderNumber: this.isEditWorkflow ? this.selectedPot.orderNumber : 0,
        hasPotLocked: this.savingsForm.get('lockPot')?.value,
        iconUrl: this.savingsForm.get('name')?.value !== 'Custom'
          ? this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.iconUrl ?? 'cashflow-moneys-icon'
          : 'custom-option-icon',
        start: {
          age:
            this.savingsForm.get('start')?.value !== null &&
            this.savingsForm.get('start')?.value !== ''
              ? this.savingsForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            this.savingsForm.get('start')?.value !== null &&
            this.savingsForm.get('start')?.value !== ''
              ? this.savingsForm.get('start')?.value
              : 0,
        },
        end: {
          age:
            this.savingsForm.get('end')?.value !== null &&
            this.savingsForm.get('end')?.value !== ''
              ? this.savingsForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
            this.savingsForm.get('end')?.value !== null &&
            this.savingsForm.get('end')?.value !== ''
              ? this.savingsForm.get('end')?.value
              : 0,
        },
        // returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? this.savingsForm.get('returnRate')?.value : 0,
          returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? rr : 0,
        type:
          this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.type ?? SavingPotType.Cash,
        // realReturn: this.savingsForm.get('name')?.value !== 'Cash' ?
        //   this.savingsForm.get('returnRate')?.value - this.inflationRate : 0,
        realReturn: real,
      };
      console.log(clientSaving);
      var function$ = !this.isEditWorkflow ? this.savingPotsHttpService
      .addNewSavingPot(this.cashflowId, clientSaving) :
      this.savingPotsHttpService
        .addNewSavingPot(this.cashflowId, clientSaving)

      function$
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
            savingPot: res,
          });
        });

      console.log('Form Submitted', this.savingsForm.value);
      // Handle form submission logic
    } else {
      console.log('Form is invalid');
    }
  }

  onCommissionTypeControlClicked(amountType: string) {
    this.savingsForm.get('commissionType')?.setValue(amountType)

    if(amountType === 'both') {
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentage')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
      this.updateFormattedValue('commissionPercentage')

    }

    if(amountType === 'amount') {
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentage')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.removeValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
    }


    if(amountType === 'percentage') {
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionAmount')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.removeValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentage')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
      this.updateFormattedValue('commissionPercentage')

    }
  }

  blockComma(e: KeyboardEvent) {
  if (e.key === ',') e.preventDefault();
}

      private endOnOrAfterStartValidator(): ValidatorFn {
      return (group: AbstractControl) => {
        const start = group.get('start')?.value;
        const end   = group.get('end')?.value;
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

    onReturnRateInput(event: Event) {
  // when typing, ensure the control holds a number (so slider updates smoothly)
  const raw = (event.target as HTMLInputElement).value;
  const num = Number(raw);
  const val = isNaN(num) ? 0 : this.round2(num);
  this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });

}

// onSliderChange(val: number) {
//   // coerce to number and push into the form control
//   const num = Number(val);
//   this.savingsForm.get('returnRate')?.setValue(isNaN(num) ? 0 : num, { emitEvent: true });
// }

onSliderInput(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  const value = Number(inputElement.value);

  const val = isNaN(value) ? 0 : this.round2(value);
  this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });
}

private round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

}

