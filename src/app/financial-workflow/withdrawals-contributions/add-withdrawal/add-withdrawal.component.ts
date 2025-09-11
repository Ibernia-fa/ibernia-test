import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import {
  Cycle,
  EscalationRate,
} from '../../timeline/models/financial-timeline';
import { WithdrawalsContributionsHttpService } from '../services/withdrawals-contributions-http.service';
import moment from 'moment';
import { FundsViewModel } from '../model/withdrawals-contributions';
import { catchError, filter } from 'rxjs';
import { ComissionType, SavingPotsModel } from '../../saving-pots/models/saving-pots.model';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-add-withdrawal',
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
        MatCheckboxModule,
    
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-withdrawal.component.html',
  styleUrl: './add-withdrawal.component.scss',
})
export class AddWithdrawalComponent {
  withdrawalForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  years: number[] = [];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  isEditWorkflow = false;
  selectedWithdrawal: FundsViewModel;
  showStartEnd = false;
  savingPots: SavingPotsModel;
  eventsList: any;
  selectedEscalationDescription: string;

  constructor(
    private dialogRef: MatDialogRef<AddWithdrawalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService
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
    this.selectedWithdrawal = data.selectedWithdrawal;
    this.savingPots = data.savingPots

    this.savingPots.clientSavings = this.savingPots.clientSavings.filter(saving => !saving.hasPotLocked)
    var iterations = data.forecastEndDateYear - data.forecastStartDateYear;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.withdrawalForm = this.fb.group({
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      savingPot: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: [0],
          commissions: [false],
      commissionPercentage: [0],
    });
    this.withdrawalForm.get('currencySymbol')?.disable();
    this.withdrawalForm.setValidators(this.endOnOrAfterStartValidator());
    this.withdrawalForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.cycles[1].id);

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedWithdrawal.amount.cycle?.id);
      this.withdrawalForm
        .get('description')
        ?.patchValue(this.selectedWithdrawal.description);
      this.withdrawalForm
        .get('currencySymbol')
        ?.patchValue(this.selectedWithdrawal.amount.currencySymbol);
      this.withdrawalForm
        .get('amount')
        ?.patchValue(this.selectedWithdrawal.amount.amount);
      this.withdrawalForm
        .get('cycle')
        ?.patchValue(this.selectedWithdrawal.amount.cycle?.id);
      this.withdrawalForm
        .get('start')
        ?.patchValue(this.selectedWithdrawal.start.year);
      this.withdrawalForm.get('end')?.patchValue(this.selectedWithdrawal.end.year);
      // console.log(this.sele)
      this.withdrawalForm.get('savingPot')?.patchValue(this.selectedWithdrawal.associatedSavingPotId);
            const hasComm = !!this.selectedWithdrawal?.comission;
      this.withdrawalForm.get('commissions')?.patchValue(hasComm);
      const pct =
        this.selectedWithdrawal?.comission?.percentage?.amount ?? 0;
      this.withdrawalForm.get('commissionPercentage')?.patchValue(pct);
      this.onCommissionsToggled(hasComm);
    }
  }

    onCommissionsToggled(enabled: boolean) {
    const ctrl = this.withdrawalForm.get('commissionPercentage');
    if (enabled) {
      ctrl?.setValidators([Validators.required, Validators.min(0)]);
      if (ctrl?.value === null || ctrl?.value === '') ctrl?.setValue(0);
    } else {
      ctrl?.clearValidators();
      ctrl?.setValue(0);
    }
    ctrl?.updateValueAndValidity();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCycleValueChange(event: any) {
    console.log({ event });
    this.showStartEnd =
      this.cycles.find((cycle) => cycle.id === event)?.description !==
      'One-off';
    if (!this.showStartEnd) {
      this.withdrawalForm.controls['end'].clearValidators();
      this.withdrawalForm.controls['end'].updateValueAndValidity();
    } else {
      this.withdrawalForm.controls['end'].addValidators(Validators.required);
      this.withdrawalForm.controls['end'].updateValueAndValidity();
    }
  }

  addExpense(): void {
    if (this.withdrawalForm.valid) {
          const hasCommission = !!this.withdrawalForm.get('commissions')?.value;
    const commissionPct = Number(
      this.withdrawalForm.get('commissionPercentage')?.value ?? 0
    );

    const emptyCycle = { id: '', description: '' };
    const emptyNetAmount = {
      amount: 0,
      currencySymbol: '',
      cycle: emptyCycle,
    };
    const neutralCommissionEscRate: EscalationRate = { description: '', value: '0' };

      console.log('Form Submitted', this.withdrawalForm.value);
                  const isCustomEscalation =
        this.selectedEscalationDescription === 'Increase at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.withdrawalForm.get('customEscalationRate')?.value
        : this.withdrawalForm.get('escalationRate')?.value;
   const matchedRate = this.escalationRates.find(
        (x) => x.value === escalationRateValue
      );
      var withdrawal: FundsViewModel = {
        id: this.isEditWorkflow ? this.selectedWithdrawal.id : null,
        associatedSavingPotId: this.withdrawalForm.get('savingPot')?.value ?? '',
        description: this.withdrawalForm.get('description')?.value,
        amount: {
          amount: this.withdrawalForm.get('amount')?.value,
          currencySymbol: this.withdrawalForm.get('currencySymbol')?.value,
          cycle: {
            id: this.withdrawalForm.get('cycle')?.value ?? '',
            description:
              this.cycles.find(
                (x) => x.id === this.withdrawalForm.get('cycle')?.value
              )?.description ?? '',
          },
        },
        start: {
          age:
            this.withdrawalForm.get('start')?.value !== null &&
            this.withdrawalForm.get('start')?.value !== ''
              ? this.withdrawalForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            this.withdrawalForm.get('start')?.value !== null &&
            this.withdrawalForm.get('start')?.value !== ''
              ? this.withdrawalForm.get('start')?.value
              : 0,
        },
        end: {
          age:
            this.withdrawalForm.get('end')?.value !== null &&
            this.withdrawalForm.get('end')?.value !== ''
              ? this.withdrawalForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
            this.withdrawalForm.get('end')?.value !== null &&
            this.withdrawalForm.get('end')?.value !== ''
              ? this.withdrawalForm.get('end')?.value
              : 0,
        },
                   escalationRate:  escalationRateValue !== null && escalationRateValue !== ''
  ? matchedRate ?? {
      description: this.selectedEscalationDescription ?? '', // Use actual description
      value: escalationRateValue
    }
  : {
      description: '',
      value: 0
    },
    contributionType : 0,
     hasCommission: hasCommission,
     comission: hasCommission
  ? {
      type: ComissionType.Percentage,
      amount: emptyNetAmount,
      percentage: {
        amount: commissionPct,
        currencySymbol: '',
        cycle: emptyCycle,
      },
      escalationRate: neutralCommissionEscRate,  // <-- use the string-valued esc rate
    }
  : {
      type: ComissionType.Percentage, // or Amount if your API prefers for "none"
      amount: emptyNetAmount,
      percentage: emptyNetAmount,
      escalationRate: neutralCommissionEscRate,  // <-- here too
    },

      };

      var action$ = this.withdrawalsContributionsHttpService.addWithdrawals(
        this.cashflowId,
        withdrawal
      );

      if (this.isEditWorkflow)
        action$ = this.withdrawalsContributionsHttpService.updateWithdrawals(
          this.cashflowId,
          withdrawal
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
            contributionWithdrawal: res,
          });
        });
      // Handle form submission logic
    } else {
      console.log('Form is invalid');
    }
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

        onEscalationRateChange(event: MatSelectChange): void {
          const selectedOption = event.source.selected;
        
          let description: string | null = null;
        
          if (Array.isArray(selectedOption)) {
            description = selectedOption[0]?.viewValue ?? null;
          } else {
            description = selectedOption?.viewValue ?? null;
          }
        
          this.selectedEscalationDescription = description;
        
          const customControl = this.withdrawalForm.get('customEscalationRate');
        
          if (description === 'Increase at custom rate') {
            customControl?.setValidators([Validators.required, Validators.min(0)]);
          } else {
            customControl?.clearValidators();
            customControl?.setValue(null); // Optionally reset field
          }
        
          customControl?.updateValueAndValidity();
        }

        
}
