import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
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
  isAmountType: boolean = true;
  cycles: Cycle[];
  escalationRates: EscalationRate[];
  eventsList: any;
  cashflowId: string;
  formattedReturnRate: string = '';
  inflationRate= 2.5;
  savingPotValues = [
    {
      name: 'Savings',
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
      lockPot: [true],
      start: ['', Validators.required],
      end: ['', Validators.required],
      commissions: [true],
      commissionCurrency: [this.clientPreferredCurrency, Validators.required],
      commissionType: ['amount'],
      commissionAmount: [0],
      commissionCycle: ['', Validators.required],
      escalationRate: ['', Validators.required],
    });

    this.savingsForm.get('returnRate')?.valueChanges.subscribe(value => {
      this.formattedReturnRate = this.formatWithPercentage(value);
    });
  }

  ngOnInit() {
    this.updateFormattedValue();
  }
  closeDialog(): void {
    this.dialogRef.close();
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

    if (event) {
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
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
        .get('escalationRate')
        ?.setValidators(Validators.required);

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

  onInputChange(event: any) {
    let value = event.target.value.replace('%', '').trim();
    if (!isNaN(value) && value !== '') {
      this.savingsForm.get('returnRate')?.setValue(parseFloat(value), { emitEvent: true });
    }
  }

  onInputBlur(event: any) {
    let value = this.savingsForm.get('returnRate')?.value || 0;
    this.savingsForm.get('returnRate')?.setValue(value, { emitEvent: true });
    this.updateFormattedValue();
  }

  updateFormattedValue() {
    let value = this.savingsForm.get('returnRate')?.value || 0;
    this.formattedReturnRate = this.formatWithPercentage(value);
  }

  formatWithPercentage(value: number | string): string {
    return value !== null && value !== '' ? `${value}%` : '0%';
  }

  saveCashflow(): void {
    console.log(this.savingsForm);
    if (this.savingsForm.valid) {
      var clientSaving: ClientSaving = {
        id: null,
        name: this.savingsForm.get('name')?.value,
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
                ? this.savingsForm.get('commissionCycle')?.value
                : {
                    id: '',
                    description: '',
                  },
          },
          escalationRate:
            this.savingsForm.get('escalationRate')?.value !== null &&
            this.savingsForm.get('escalationRate')?.value !== ''
              ? this.savingsForm.get('escalationRate')?.value
              : {
                  id: '',
                  description: '',
                },
          type: this.isAmountType
            ? ComissionType.Amount
            : ComissionType.Percentage,
        },
        hasCommission: this.savingsForm.get('commissions')?.value,
        hasPotLocked: this.savingsForm.get('lockPot')?.value,
        iconUrl:
          this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.iconUrl ?? '',
        start: {
          age: this.savingsForm.get('start')?.value !== null && this.savingsForm.get('start')?.value !== ''
            ? this.savingsForm.get('start')?.value - this.clientBirthYear
            : 0,
          year: this.savingsForm.get('start')?.value !== null && this.savingsForm.get('start')?.value !== ''
          ? this.savingsForm.get('start')?.value : 0,
        },
        end: {
          age: this.savingsForm.get('end')?.value !== null && this.savingsForm.get('end')?.value !== ''
            ? this.savingsForm.get('end')?.value - this.clientBirthYear
            : 0,
          year: this.savingsForm.get('end')?.value !== null && this.savingsForm.get('end')?.value !== ''
          ? this.savingsForm.get('end')?.value : 0,
        },
        returnRate: this.savingsForm.get('returnRate')?.value,
        type:
          this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.type ?? SavingPotType.Cash,
        realReturn: this.savingsForm.get('returnRate')?.value - this.inflationRate,
      };

      this.savingPotsHttpService
        .addNewSavingPot(this.cashflowId, clientSaving)
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
            clientSaving: clientSaving
          });
        });

      console.log('Form Submitted', this.savingsForm.value);
      // Handle form submission logic
    } else {
      console.log('Form is invalid');
    }
  }

  onCommissionTypeControlClicked(isAmountType: boolean) {
    this.isAmountType = isAmountType;
  }
}
