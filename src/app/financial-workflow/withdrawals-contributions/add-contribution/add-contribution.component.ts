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
  NetAmount,
} from '../../timeline/models/financial-timeline';
import moment from 'moment';
import { FundsViewModel } from '../model/withdrawals-contributions';
import { WithdrawalsContributionsHttpService } from '../services/withdrawals-contributions-http.service';
import { catchError, filter } from 'rxjs';
import { ComissionType, SavingPotsModel } from '../../saving-pots/models/saving-pots.model';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-add-contribution',
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
  templateUrl: './add-contribution.component.html',
  styleUrl: './add-contribution.component.scss',
})
export class AddContributionComponent {
  contributionForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  years: number[] = [];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  isEditWorkflow = false;
  selectedContribution: FundsViewModel;
  showStartEnd = false;
  savingPots: SavingPotsModel
  eventsList: any;
  selectedEscalationDescription: string;

  constructor(
    private dialogRef: MatDialogRef<AddContributionComponent>,
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
    this.selectedContribution = data.selectedContribution;
    this.savingPots = data.savingPots

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.contributionForm = this.fb.group({
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      savingPot: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: [0],
        contributionType: [1, Validators.required] ,
          commissions: [false],
  commissionPercentage: [0],
    });
    this.contributionForm.get('currencySymbol')?.disable();
    this.contributionForm.setValidators(this.endOnOrAfterStartValidator());
    this.contributionForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.cycles[1].id);

    if (this.isEditWorkflow) {
  this.contributionForm.get('commissions')?.patchValue(this.selectedContribution?.hasCommission ?? false);
  const pct = this.selectedContribution?.comission?.percentage?.amount ?? 0;
  this.contributionForm.get('commissionPercentage')?.patchValue(pct);
  
  this.contributionForm
    .get('contributionType')
    ?.patchValue(this.selectedContribution?.contributionType ?? 1);

      this.onCycleValueChange(this.selectedContribution.amount.cycle?.id);
      this.contributionForm
        .get('description')
        ?.patchValue(this.selectedContribution.description);
      this.contributionForm
        .get('currencySymbol')
        ?.patchValue(this.selectedContribution.amount.currencySymbol);
      this.contributionForm
        .get('amount')
        ?.patchValue(this.selectedContribution.amount.amount);
      this.contributionForm
        .get('cycle')
        ?.patchValue(this.selectedContribution.amount.cycle?.id);
      this.contributionForm.get('start')?.patchValue(this.selectedContribution.start.year);
      this.contributionForm.get('end')?.patchValue(this.selectedContribution.end.year);
      this.contributionForm.get('savingPot')?.patchValue(this.selectedContribution.associatedSavingPotId);
          this.contributionForm.get('savingPot')?.patchValue(this.selectedContribution.associatedSavingPotId);
            const hasComm = !!this.selectedContribution?.comission;
      this.contributionForm.get('commissions')?.patchValue(hasComm);
      const pct1 =
        this.selectedContribution?.comission?.percentage?.amount ?? 0;
      this.contributionForm.get('commissionPercentage')?.patchValue(pct1);
      this.isCommissionsChanged(hasComm);
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  selectContributionType(type: 1 | 2): void {
  this.contributionForm.patchValue({ contributionType: type });
}

isTypeSelected(type: 1 | 2): boolean {
  return this.contributionForm.get('contributionType')?.value === type;
}

  onCycleValueChange(event: any) {
    console.log({ event });
    this.showStartEnd =
      this.cycles.find((cycle) => cycle.id === event)?.description !==
      'One-off';
    if (!this.showStartEnd) {
      this.contributionForm.controls['end'].clearValidators();
      this.contributionForm.controls['end'].updateValueAndValidity();
    } else {
      this.contributionForm.controls['end'].addValidators(Validators.required);
      this.contributionForm.controls['end'].updateValueAndValidity();
    }
  }

isCommissionsChanged(enabled: boolean) {
  if (enabled) {
    this.contributionForm.get('commissionPercentage')?.setValidators([Validators.required, Validators.min(0)]);
    if (
      this.contributionForm.get('commissionPercentage')?.value === null ||
      this.contributionForm.get('commissionPercentage')?.value === ''
    ) {
      this.contributionForm.get('commissionPercentage')?.setValue(0);
    }
  } else {
    this.contributionForm.get('commissionPercentage')?.clearValidators();
    this.contributionForm.get('commissionPercentage')?.setValue(0);
  }
  this.contributionForm.get('commissionPercentage')?.updateValueAndValidity();
}


  addIncome(): void {
    if (this.contributionForm.valid) {
      console.log('Form Submitted', this.contributionForm.value);
      const hasCommission = !!this.contributionForm.get('commissions')?.value;
const commissionPct = Number(this.contributionForm.get('commissionPercentage')?.value ?? 0);

// helper empty objects to satisfy NetAmount shape
const emptyCycle = { id: '', description: '' };
const emptyNetAmount: NetAmount = { amount: 0, currencySymbol: '', cycle: emptyCycle };
// const neutralEscRate: EscalationRate = { description: '', value: 0 };
            const isCustomEscalation =
        this.selectedEscalationDescription === 'Increase at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.contributionForm.get('customEscalationRate')?.value
        : this.contributionForm.get('escalationRate')?.value;
   const matchedRate = this.escalationRates.find(
        (x) => x.value === escalationRateValue
      );
      var contribution: FundsViewModel = {
        id: this.isEditWorkflow ? this.selectedContribution.id : null,
        associatedSavingPotId: this.contributionForm.get('savingPot')?.value ?? '',
        description: this.contributionForm.get('description')?.value,
        amount: {
          amount: this.contributionForm.get('amount')?.value,
          currencySymbol: this.contributionForm.get('currencySymbol')?.value,
          cycle: {
            id: this.contributionForm.get('cycle')?.value ?? '',
            description:
              this.cycles.find(
                (x) => x.id === this.contributionForm.get('cycle')?.value
              )?.description ?? '',
          },
        },
        start: {
          age:
            this.contributionForm.get('start')?.value !== null &&
            this.contributionForm.get('start')?.value !== ''
              ? this.contributionForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            this.contributionForm.get('start')?.value !== null &&
            this.contributionForm.get('start')?.value !== ''
              ? this.contributionForm.get('start')?.value
              : 0,
        },
        end: {
          age:
            this.contributionForm.get('end')?.value !== null &&
            this.contributionForm.get('end')?.value !== ''
              ? this.contributionForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
            this.contributionForm.get('end')?.value !== null &&
            this.contributionForm.get('end')?.value !== ''
              ? this.contributionForm.get('end')?.value
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
    contributionType: Number(this.contributionForm.get('contributionType')?.value),      
            hasCommission: !!this.contributionForm.get('commissions')?.value,
 comission: hasCommission
    ? {
        type: ComissionType.Percentage,
        amount: emptyNetAmount, // not used in this component
        percentage: {
          amount: commissionPct,      // <-- the actual percentage value (e.g., 2.5)
          currencySymbol: '',         // not applicable
          cycle: emptyCycle           // not applicable
        },
        escalationRate: {
        description: '',
        value: 0
      } // no commission-specific escalation in this component
      }
    : {
        // send a valid “empty” commission object when disabled
        type: ComissionType.Percentage, // or ComissionType.Amount — whichever your backend expects
        amount: emptyNetAmount,
        percentage: emptyNetAmount,
        escalationRate: {
        description: '',
        value: 0
      }
      }
        
      };

      var action$ = this.withdrawalsContributionsHttpService.addContributions(
        this.cashflowId,
        contribution
      );

      if (this.isEditWorkflow)
        action$ = this.withdrawalsContributionsHttpService.updateContributions(
          this.cashflowId,
          contribution
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
    
      const customControl = this.contributionForm.get('customEscalationRate');
    
      if (description === 'Increase at custom rate') {
        customControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        customControl?.clearValidators();
        customControl?.setValue(null); // Optionally reset field
      }
    
      customControl?.updateValueAndValidity();
    }
}
