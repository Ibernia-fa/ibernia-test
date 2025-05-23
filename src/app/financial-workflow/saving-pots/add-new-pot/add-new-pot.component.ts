import { Component, Inject } from '@angular/core';
import {
  ControlEvent,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { allCountries } from 'src/app/clients/models/country';
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

@Component({
  selector: 'app-add-new-pot',
  imports: [
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
    TablerIconsModule
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

  savingPotValues = [
    {
      name: 'Cash',
      iconUrl: 'cashflow-moneys-icon',
      type: SavingPotType.Cash,
    },
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
    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedPot = data.event

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear;

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
    });

    this.savingsForm.get('returnRate')?.valueChanges.subscribe((value) => {
      this.formattedReturnRate = this.formatWithPercentage(value);
    });

    if(this.isEditWorkflow) {
      this.patchFormValues();
    }
  }

  patchFormValues() {
    var savingPotValue = this.savingPotValues.find(x => x.name === this.selectedPot.name);
    if(savingPotValue) {
      this.savingsForm.get('name')?.patchValue(savingPotValue.name)
    }
    else {
      this.savingsForm.get('name')?.patchValue('Custom');
      this.onNameValueChange('Custom');
      this.savingsForm.get('customName')?.patchValue(this.selectedPot.name);
    }

    this.savingsForm.get('currency')?.patchValue(this.selectedPot.startingPotValue.currencySymbol);
    this.savingsForm.get('amount')?.patchValue(this.selectedPot.startingPotValue.amount);
    this.savingsForm.get('returnRate')?.patchValue(this.selectedPot.returnRate);
    this.savingsForm.get('lockPot')?.patchValue(this.selectedPot.hasPotLocked);
    this.savingsForm.get('start')?.patchValue(this.selectedPot.start.year);
    this.savingsForm.get('end')?.patchValue(this.selectedPot.end.year);
    this.savingsForm.get('commissions')?.patchValue(this.selectedPot.hasCommission);
    var selectedComissionType = 'amount';
    if(this.selectedPot.comission.type === ComissionType.Amount) {
      selectedComissionType = 'amount'
    }
    if(this.selectedPot.comission.type === ComissionType.Percentage) {
      selectedComissionType = 'percentage'
    }
    if(this.selectedPot.comission.type === ComissionType.Both) {
      selectedComissionType = 'both'
    }
    this.savingsForm.get('commissionType')?.patchValue(selectedComissionType);
    if(this.selectedPot.comission.type === ComissionType.Amount || this.selectedPot.comission.type === ComissionType.Both) {
      this.savingsForm.get('commissionCurrency')?.patchValue(this.selectedPot.comission.amount.currencySymbol);
      this.savingsForm.get('commissionAmount')?.patchValue(this.selectedPot.comission.amount.amount);
      this.savingsForm.get('commissionCycle')?.patchValue(this.selectedPot.comission.amount.cycle?.id);
    }
    if(this.selectedPot.comission.type === ComissionType.Percentage || this.selectedPot.comission.type === ComissionType.Both) {
      this.savingsForm.get('commissionPercentageCurrency')?.patchValue(this.selectedPot.comission.percentage?.currencySymbol);
      this.savingsForm.get('commissionPercentageCycle')?.patchValue(this.selectedPot.comission.percentage?.cycle?.id);
      this.savingsForm.get('commissionPercentage')?.patchValue(this.selectedPot.comission.percentage?.amount);
    }
    this.savingsForm.get('escalationRate')?.patchValue(this.selectedPot.comission.escalationRate.id);

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
    } else {
      this.savingsForm.get('start')?.removeValidators(Validators.required);
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.removeValidators(Validators.required);
      this.savingsForm.get('end')?.updateValueAndValidity();
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
        ?.setValue(this.escalationRates[1].id);

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

  onSliderChange(value: any) {
    if (!isNaN(value)) {
      this.savingsForm.get('returnRate')?.setValue(value, { emitEvent: true });
    }
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

  formatWithPercentage(value: number | string): string {
    return value !== null && value !== '' ? `${value}%` : '0%';
  }

  saveCashflow(): void {
    console.log(this.savingsForm);
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
          escalationRate:
            this.savingsForm.get('escalationRate')?.value !== null &&
            this.savingsForm.get('escalationRate')?.value !== ''
              ? this.escalationRates.find(x => x.id === this.savingsForm.get('escalationRate')?.value) ??
              this.savingsForm.get('escalationRate')?.value
              : {
                  id: '',
                  description: '',
                },
          type: this.savingsForm.get('commissionType')?.value === 'amount'
            ? ComissionType.Amount
            : this.savingsForm.get('commissionType')?.value === 'percentage'
            ? ComissionType.Percentage : ComissionType.Both,
        },
        hasCommission: this.savingsForm.get('commissions')?.value,
        hasPotLocked: this.savingsForm.get('lockPot')?.value,
        iconUrl: this.savingsForm.get('name')?.value !== 'Custom'
          ? this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.iconUrl ?? ''
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
        returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? this.savingsForm.get('returnRate')?.value : 0,
        type:
          this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.type ?? SavingPotType.Cash,
        realReturn: this.savingsForm.get('name')?.value !== 'Cash' ?
          this.savingsForm.get('returnRate')?.value - this.inflationRate : 0,
      };

      var function$ = !this.isEditWorkflow ? this.savingPotsHttpService
      .addNewSavingPot(this.cashflowId, clientSaving) :
      this.savingPotsHttpService
        .updateSavingPot(this.cashflowId, clientSaving)

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
        ?.setValue(this.escalationRates[1].id);

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
        ?.setValue(this.escalationRates[1].id);

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
        .get('commissionCurrency')
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
        ?.setValue(this.escalationRates[1].id);

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
}
