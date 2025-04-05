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
import moment from 'moment';
import { FundsViewModel } from '../model/withdrawals-contributions';
import { WithdrawalsContributionsHttpService } from '../services/withdrawals-contributions-http.service';
import { catchError, filter } from 'rxjs';

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
  isEditWorkflow = false;
  selectedContribution: FundsViewModel;
  showStartEnd = false;

  constructor(
    private dialogRef: MatDialogRef<AddContributionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService
  ) {
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.clientBirthYear = moment(data.clientBirthDate).year();
    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedContribution = data.selectedContribution;

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear;

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
    });

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedContribution.amount.cycle.id);
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
        ?.patchValue(this.selectedContribution.amount.cycle.id);
      this.contributionForm.get('start')?.patchValue(this.selectedContribution.start.year);
      this.contributionForm.get('end')?.patchValue(this.selectedContribution.end.year);
    }
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
      this.contributionForm.controls['end'].clearValidators();
      this.contributionForm.controls['end'].updateValueAndValidity();
    } else {
      this.contributionForm.controls['end'].addValidators(Validators.required);
      this.contributionForm.controls['end'].updateValueAndValidity();
    }
  }

  addIncome(): void {
    if (this.contributionForm.valid) {
      console.log('Form Submitted', this.contributionForm.value);
      var contribution: FundsViewModel = {
        id: this.isEditWorkflow ? this.selectedContribution.id : null,
        associatedSavingPotId: '',
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
}
