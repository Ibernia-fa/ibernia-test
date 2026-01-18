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
import {
  ClientSaving,
  ComissionType,
  SavingPotsModel,
} from '../../saving-pots/models/saving-pots.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule } from '@ngx-translate/core';

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
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule
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
  savingPots: SavingPotsModel;
  eventsList: any;
  selectedEscalationDescription: string;

  // 🔽 New helpers for filtering
  allClientSavings: ClientSaving[] = [];
  clientSavings: ClientSaving[] = [];  // <-- bound in template
  private cashPot?: ClientSaving;

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

    // age
    const birthDate = new Date(data.clientBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    this.clientAge = age;
    if (data.forecastStartDateYear - this.clientBirthYear > this.clientAge) {
      this.clientBirthYear = this.clientBirthYear + 1;
    }

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedContribution = data.selectedContribution;
    this.savingPots = data.savingPots;

    // keep originals and find Cash pot
    this.allClientSavings = (this.savingPots?.clientSavings ?? []).slice();
    this.cashPot = this.allClientSavings.find(
      (s) => (s.name ?? '').toLowerCase() === 'cash'
    );

    // timeline years
    const iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1;
    for (let i = 0; i < iterations; i++) {
      this.years.push(data.forecastStartDateYear + i);
    }

    // form
    this.contributionForm = this.fb.group({
      description: ['', Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      savingPot: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: [''],
      contributionType: [1, Validators.required], // 1 = Cash, 2 = External

      // commission (percentage-only)
      commissions: [false],
      commissionPercentage: [''],
    });

    this.contributionForm.get('currencySymbol')?.disable();
    this.contributionForm.setValidators(this.endOnOrAfterStartValidator());
    this.contributionForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.cycles[1].id);

    // initial filter based on default contributionType (1)
    this.applySavingPotFilter();

    if (this.isEditWorkflow) {
      // hydrate commission
      const pctInit = this.selectedContribution?.comission?.percentage?.amount ?? 0;
      const hasCommInit = pctInit > 0;

      // hydrate core fields
      this.contributionForm.patchValue({
        contributionType: this.selectedContribution?.contributionType ?? 1,
        description: this.selectedContribution.description,
        currencySymbol: this.clientPreferredCurrency,
        amount: this.selectedContribution.amount.amount,
        cycle: this.selectedContribution.amount.cycle?.id,
        start: this.selectedContribution.start.year,
        end: this.selectedContribution.end.year,
        commissions: hasCommInit,
        commissionPercentage: pctInit,
      });

      // re-run filter for the (possibly) different type from edit
      this.applySavingPotFilter();

      // set saving pot if still valid under new filter; otherwise auto-fix
      // const savedId = this.selectedContribution.associatedSavingPotId;
      // const exists = this.clientSavings.some((s) => s.id === savedId);
      // if (exists) {
      //   this.contributionForm.get('savingPot')?.patchValue(savedId);
      // } else if (this.contributionForm.get('contributionType')?.value === 1 && this.cashPot) {
      //   // type Cash but saved pot not valid -> force Cash
      //   this.contributionForm.get('savingPot')?.patchValue(this.cashPot.id);
      // } else {
      //   // type External but saved pot is Cash -> clear
      //   this.contributionForm.get('savingPot')?.patchValue(null);
      // }

      const savedId = this.selectedContribution.associatedSavingPotId;
      const type = Number(this.contributionForm.get('contributionType')?.value ?? 1);

      if (type === 1) {
        // Cash mode: do NOT show Cash in list; preselect only if savedId is non-cash and present
        if (savedId && savedId !== this.cashPot?.id && this.clientSavings.some(s => s.id === savedId)) {
          this.contributionForm.get('savingPot')?.patchValue(savedId);
        } else {
          this.contributionForm.get('savingPot')?.patchValue(null);
        }
      } else {
        // External mode: show all, including Cash
        if (savedId && this.clientSavings.some(s => s.id === savedId)) {
          this.contributionForm.get('savingPot')?.patchValue(savedId);
        } else {
          this.contributionForm.get('savingPot')?.patchValue(null);
        }
      }

      // const pct = this.selectedContribution?.comission?.percentage?.amount ?? 0;
      const pct = this.selectedContribution?.comission?.percentage?.amount ?? null;
      const hasComm = pct > 0;
      this.contributionForm.get('commissions')?.patchValue(hasComm);
      this.contributionForm.get('commissionPercentage')?.patchValue(pct === 0 ? null : pct);
      this.isCommissionsChanged(hasCommInit);
      this.onCycleValueChange(this.selectedContribution.amount.cycle?.id);
    }

    const matchedEscalation = this.escalationRates.find(x => x.value === this.selectedContribution?.escalationRate?.value);

    if (matchedEscalation) {
      this.contributionForm.get('escalationRate')?.patchValue(matchedEscalation.value);
      this.selectedEscalationDescription = matchedEscalation.description;
    } else if (
      this.selectedContribution?.escalationRate &&
      this.selectedContribution?.escalationRate.description === 'Increases at custom rate'
    ) {
      this.escalationRates = this.escalationRates.filter(x => x.description !== 'Increases at custom rate')
      this.escalationRates.push({
        description: 'Increases at custom rate',
        value: this.selectedContribution?.escalationRate.value
      });

      this.contributionForm.get('escalationRate')?.patchValue(this.selectedContribution?.escalationRate.value);
      this.contributionForm.get('customEscalationRate')?.patchValue(this.selectedContribution?.escalationRate.value);
      this.selectedEscalationDescription = 'Increases at custom rate';

      // Trigger validators for custom rate
      const customControl = this.contributionForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.updateValueAndValidity();
    }
  }

  // === UI helpers ===
  closeDialog(): void {
    this.dialogRef.close();
  }

  selectContributionType(type: 1 | 2): void {
    this.contributionForm.patchValue({ contributionType: type });
    this.applySavingPotFilter();
  }

  isTypeSelected(type: 1 | 2): boolean {
    return this.contributionForm.get('contributionType')?.value === type;
  }

  onCycleValueChange(event: any) {
    const isOneOff = this.cycles.find(cycle => cycle.id === event)?.description === 'One-off';
    this.showStartEnd = !isOneOff;

    if (!this.showStartEnd) {
      this.contributionForm.controls['end'].clearValidators();
      this.contributionForm.controls['end'].updateValueAndValidity();
    } else {
      this.contributionForm.controls['end'].addValidators(Validators.required);
      this.contributionForm.controls['end'].updateValueAndValidity();
    }

    const escalationControl = this.contributionForm.get('escalationRate');

    if (isOneOff) {
      escalationControl?.clearValidators();
    } else {
      escalationControl?.setValidators(Validators.required);
    }
    escalationControl?.updateValueAndValidity();
  }

  isCommissionsChanged(enabled: boolean) {
    const ctrl = this.contributionForm.get('commissionPercentage');
    if (enabled) {
      ctrl?.setValidators([Validators.required, Validators.min(0)]);
      // if (ctrl?.value === null || ctrl?.value === '') ctrl?.setValue(0);
      if (ctrl?.value === 0) ctrl?.setValue(null);
    } else {
      ctrl?.clearValidators();
      // ctrl?.setValue(0);
      ctrl?.setValue(null);
    }
    ctrl?.updateValueAndValidity();
  }

  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue);
    this.contributionForm.get('amount')?.setValue(value, { emitEvent: true });
  }

  // 🔽 Core filtering logic
  // private applySavingPotFilter(): void {
  //   const type = Number(this.contributionForm.get('contributionType')?.value ?? 1);
  //   const all = this.allClientSavings;

  //   if (type === 1) {
  //     // Cash: only show “Cash”, auto-select it
  //     this.clientSavings = this.cashPot ? [this.cashPot] : [];
  //     if (this.cashPot) {
  //       this.contributionForm.get('savingPot')?.setValue(this.cashPot.id);
  //     } else {
  //       this.contributionForm.get('savingPot')?.setValue(null);
  //     }
  //   } else {
  //     // External: hide “Cash”, leave current selection if valid
  //     this.clientSavings = all.filter(
  //       (s) => (s.name ?? '').toLowerCase() !== 'cash'
  //     );
  //     const currentId = this.contributionForm.get('savingPot')?.value;
  //     if (this.cashPot && currentId === this.cashPot.id) {
  //       // selected cash but now external -> clear
  //       this.contributionForm.get('savingPot')?.setValue(null);
  //     }
  //   }
  // }

  private applySavingPotFilter(): void {
    const type = Number(this.contributionForm.get('contributionType')?.value ?? 1);

    if (type === 1) {
      // Cash selected ➜ hide Cash from the dropdown
      this.clientSavings = (this.allClientSavings ?? []).filter(
        (s) => (s.name ?? '').toLowerCase() !== 'cash'
      );

      // if previously selected is Cash (or not in list), clear it
      const currentId = this.contributionForm.get('savingPot')?.value;
      if (!currentId || currentId === this.cashPot?.id || !this.clientSavings.some(s => s.id === currentId)) {
        this.contributionForm.get('savingPot')?.setValue(null);
      }
    } else {
      // External selected ➜ show ALL (including Cash)
      this.clientSavings = (this.allClientSavings ?? []).slice();

      // keep current selection if still valid; otherwise clear
      const currentId = this.contributionForm.get('savingPot')?.value;
      if (currentId && !this.clientSavings.some(s => s.id === currentId)) {
        this.contributionForm.get('savingPot')?.setValue(null);
      }
    }
  }


  //   private applySavingPotFilter(): void {
  //   // Show everything, no filtering based on type
  //   const all = this.allClientSavings ?? [];
  //   this.clientSavings = [...all];

  //   // Keep current selection if it still exists; otherwise clear it
  //   const currentId = this.contributionForm.get('savingPot')?.value;
  //   if (currentId && !all.some(s => s.id === currentId)) {
  //     this.contributionForm.get('savingPot')?.setValue(null);
  //   }
  // }

  addIncome(): void {
    this.contributionForm.markAllAsTouched();
    this.contributionForm.markAsDirty();
    if (!this.contributionForm.valid) {
      console.log('Form is invalid');
      return;
    }

    const hasCommission = !!this.contributionForm.get('commissions')?.value;
    const commissionPct = Number(
      this.contributionForm.get('commissionPercentage')?.value ?? 0
    );

    const selectedPotId: string | null = this.contributionForm.get('savingPot')?.value ?? null;
    const type = Number(this.contributionForm.get('contributionType')?.value ?? 1);


    const associatedSavingPotId =
      type === 1
        ? (selectedPotId || this.cashPot?.id || '')
        : (selectedPotId || '');


    // helper NetAmount shells
    const emptyCycle = { id: '', description: '' };
    const emptyNetAmount: NetAmount = {
      amount: 0,
      currencySymbol: '',
      cycle: emptyCycle,
    };

    // contribution escalation
    const isCustomEscalation =
      this.selectedEscalationDescription === 'Increases at custom rate';
    const escalationRateValue = isCustomEscalation
      ? this.contributionForm.get('customEscalationRate')?.value
      : this.contributionForm.get('escalationRate')?.value;
    const matchedRate = this.escalationRates.find(
      (x) => x.value === escalationRateValue
    );

    const contribution: FundsViewModel = {
      id: this.isEditWorkflow ? this.selectedContribution.id : null,
      // associatedSavingPotId: this.contributionForm.get('savingPot')?.value ?? '',
      associatedSavingPotId: associatedSavingPotId,
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
      escalationRate:
        escalationRateValue !== null && escalationRateValue !== ''
          ? matchedRate ?? {
            description: this.selectedEscalationDescription ?? '',
            value: escalationRateValue,
          }
          : { description: '', value: 0 },

      contributionType: Number(this.contributionForm.get('contributionType')?.value),

      // commission payload (percentage-only)
      hasCommission: hasCommission,
      comission: hasCommission
        ? {
          type: ComissionType.Percentage,
          amount: emptyNetAmount, // not used here
          percentage: {
            amount: commissionPct, // e.g. 2.5
            currencySymbol: '',
            cycle: emptyCycle,
          },
          // IMPORTANT: value is a string per your Comission model typing
          escalationRate: { description: '', value: '0' },
        }
        : {
          // send empty-but-valid object when disabled
          type: ComissionType.Percentage, // keep consistent with your API
          amount: emptyNetAmount,
          percentage: emptyNetAmount,
          escalationRate: { description: '', value: '0' },
        },
    };

    let action$ = this.withdrawalsContributionsHttpService.addContributions(
      this.cashflowId,
      contribution
    );

    if (this.isEditWorkflow) {
      action$ =
        this.withdrawalsContributionsHttpService.updateContributions(
          this.cashflowId,
          contribution
        );
    }

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
    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }
    customControl?.updateValueAndValidity();
  }
}
