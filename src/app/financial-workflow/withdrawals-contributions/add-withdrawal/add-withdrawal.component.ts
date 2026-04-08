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
import { Cycle, EscalationRate } from '../../timeline/models/financial-timeline';
import { WithdrawalsContributionsHttpService } from '../services/withdrawals-contributions-http.service';
import moment from 'moment';
import { FundsViewModel } from '../model/withdrawals-contributions';
import { catchError, filter } from 'rxjs';
import { ClientSaving, ComissionType, SavingPotsModel } from '../../saving-pots/models/saving-pots.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getAmountCycleLabel } from 'src/app/shared/utils/amount-cycle-label';
import { extractEventId, resolveYear } from 'src/app/shared/utils/event-date-utils';
import { Client } from 'src/app/clients/models/client';
import { formatSavingPotSelectLabel } from 'src/app/shared/utils/saving-pot-select-label';
import {
  getCashflowDialogEndCalendarYear,
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';

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
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-withdrawal.component.html',
  styleUrl: './add-withdrawal.component.scss',
})
export class AddWithdrawalComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
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
  existingWithdrawals: FundsViewModel[] = [];
  currentYear: number = new Date().getFullYear();
  selectedClient: Client | null = null;
  dialogEndCalendarYear = 0;

  constructor(
    private dialogRef: MatDialogRef<AddWithdrawalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
    private translate: TranslateService,
  ) {
    this.eventsList = data.eventsList ?? [];
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.clientBirthYear = moment(data.clientBirthDate).year();
    const birthDate = new Date(data.clientBirthDate);
    const forecastStart = data.forecastStartDate
      ? new Date(data.forecastStartDate)
      : new Date(data.forecastStartDateYear, 0, 1);
    this.clientAge = getCompletedYearsAgeAtDate(birthDate, forecastStart);

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedWithdrawal = data.selectedWithdrawal;
    this.savingPots = data.savingPots;
    this.selectedClient = data.selectedClient ?? null;
    this.existingWithdrawals = data.existingWithdrawals ?? [];

    const availableSavings = (this.savingPots?.clientSavings ?? []).filter(
      (saving) =>
        !saving.hasPotLocked &&
        (saving.name ?? '').toLowerCase() !== 'cash'
    );
    this.savingPots.clientSavings = availableSavings;
    
    const resolvedEndYear = getCashflowDialogEndCalendarYear(
      data.clientBirthDate,
      data.planDuration,
      data.forecastEndDateYear,
    );
    let endYear = Number.isFinite(resolvedEndYear)
      ? resolvedEndYear
      : Number(data.forecastEndDateYear);
    if (!Number.isFinite(endYear)) {
      endYear = data.forecastStartDateYear;
    }
    this.dialogEndCalendarYear = endYear;
    const iterations = endYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.withdrawalForm = this.fb.group({
      description: [''],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      savingPot: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: [''],
      commissions: [false],
      commissionPercentage: [0],
    });
    this.withdrawalForm.get('currencySymbol')?.disable();
    this.withdrawalForm.setValidators(this.endOnOrAfterStartValidator());
    this.withdrawalForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.cycles[1].id);

    this.initializeDefaultSelections();

    if (this.isEditWorkflow) {
      this.onCycleValueChange(this.selectedWithdrawal.amount.cycle?.id);
      this.withdrawalForm
        .get('currencySymbol')
        ?.patchValue(this.clientPreferredCurrency);
      this.withdrawalForm
        .get('amount')
        ?.patchValue(this.selectedWithdrawal.amount.amount);
      // Ensure the patched amount displays with thousand separators immediately
      setTimeout(() => {
        const el = this.amountInput?.nativeElement;
        const amount = this.withdrawalForm.get('amount')?.value;
        if (!el || amount === null || amount === undefined || amount === '') return;
        el.value = Number(amount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
      });
      this.withdrawalForm
        .get('cycle')
        ?.patchValue(this.selectedWithdrawal.amount.cycle?.id);
      if (this.selectedWithdrawal.startEventId) {
        this.withdrawalForm.get('start')?.patchValue('event:' + this.selectedWithdrawal.startEventId);
      } else {
        this.withdrawalForm.get('start')?.patchValue(this.selectedWithdrawal.start.year);
      }
      if (this.selectedWithdrawal.endEventId) {
        this.withdrawalForm.get('end')?.patchValue('event:' + this.selectedWithdrawal.endEventId);
      } else {
        this.withdrawalForm.get('end')?.patchValue(this.selectedWithdrawal.end.year);
      }

      const matchedEscalation = this.escalationRates.find(x => x.value === this.selectedWithdrawal?.escalationRate?.value);

      if (matchedEscalation) {
        this.withdrawalForm.get('escalationRate')?.patchValue(matchedEscalation.value);
        this.selectedEscalationDescription = matchedEscalation.description;
      } else if (
        this.selectedWithdrawal.escalationRate &&
        this.selectedWithdrawal.escalationRate.description === 'Increases at custom rate'
      ) {
        this.escalationRates = this.escalationRates.filter(x => x.description !== 'Increases at custom rate')
        this.escalationRates.push({
          description: 'Increases at custom rate',
          value: this.selectedWithdrawal.escalationRate.value
        });

        this.withdrawalForm.get('escalationRate')?.patchValue(this.selectedWithdrawal.escalationRate.value);
        this.withdrawalForm.get('customEscalationRate')?.patchValue(this.selectedWithdrawal.escalationRate.value);
        this.selectedEscalationDescription = 'Increases at custom rate';

        // Trigger validators for custom rate
        const customControl = this.withdrawalForm.get('customEscalationRate');
        customControl?.setValidators([Validators.required, Validators.min(0)]);
        customControl?.updateValueAndValidity();
      }

      const savedId = this.selectedWithdrawal.associatedSavingPotId;
      const stillExists = this.savingPots.clientSavings.some(s => s.id === savedId);
      this.withdrawalForm.get('savingPot')?.patchValue(stillExists ? savedId : null);
    }

  }

  /** i18n key — use with `| translate` in template (sentence case in EN/IT). */
  get dialogTitle(): string {
    return this.isEditWorkflow ? 'Edit withdrawal' : 'Add withdrawal';
  }

  getSavingPotSelectLabel(saving: ClientSaving): string {
    return formatSavingPotSelectLabel(
      { name: saving.name, ownership: saving.ownership },
      this.selectedClient,
      this.translate,
    );
  }

  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue);
    this.withdrawalForm.get('amount')?.setValue(value, { emitEvent: true });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCycleValueChange(event: any) {
    console.log({ event });
    const isOneOff = this.cycles.find(cycle => cycle.id === event)?.description === 'One-off';
    this.showStartEnd = !isOneOff;

    if (!this.showStartEnd) {
      this.withdrawalForm.controls['end'].clearValidators();
      this.withdrawalForm.controls['end'].updateValueAndValidity();
    } else {
      this.withdrawalForm.controls['end'].addValidators(Validators.required);
      this.withdrawalForm.controls['end'].updateValueAndValidity();
    }

    const escalationControl = this.withdrawalForm.get('escalationRate');

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
    this.withdrawalForm.markAllAsTouched();
    this.withdrawalForm.markAsDirty();
    if (this.withdrawalForm.valid) {
      const hasCommission = false;
      const commissionPct = Number(
        this.withdrawalForm.get('commissionPercentage')?.value ?? 0
      );

      const emptyCycle = { id: '', description: '' };
      const emptyNetAmount = {
        amount: 0,
        currencySymbol: '',
        cycle: emptyCycle,
      };

      // ensure the selected pot is one of the allowed (non-Cash) options
      const selectedPotId = this.withdrawalForm.get('savingPot')?.value ?? '';
      const validPotId = this.savingPots.clientSavings.some(s => s.id === selectedPotId) ? selectedPotId : '';

      const neutralCommissionEscRate: EscalationRate = { description: '', value: '0' };

      console.log('Form Submitted', this.withdrawalForm.value);
      const isCustomEscalation =
        this.selectedEscalationDescription === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.withdrawalForm.get('customEscalationRate')?.value
        : this.withdrawalForm.get('escalationRate')?.value;
      const matchedRate = this.escalationRates.find(
        (x) => x.value === escalationRateValue
      );
      const startVal = this.withdrawalForm.get('start')?.value;
      const endVal = this.withdrawalForm.get('end')?.value;
      const startYear = resolveYear(startVal, this.eventsList);
      const endYear = resolveYear(endVal, this.eventsList);
      const startEventId = extractEventId(startVal);
      const endEventId = extractEventId(endVal);

      var withdrawal: FundsViewModel = {
        id: this.isEditWorkflow ? this.selectedWithdrawal.id : null,
        associatedSavingPotId: validPotId,
        description: this.getDescriptionForSubmit(),
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
          age: startYear
            ? getPersistedAgeForCalendarYear(
                this.data.clientBirthDate,
                startYear,
                this.data.forecastStartDate,
                this.data.planDuration,
                this.dialogEndCalendarYear,
              )
            : 0,
          year: startYear || 0,
        },
        end: {
          age: endYear
            ? getPersistedAgeForCalendarYear(
                this.data.clientBirthDate,
                endYear,
                this.data.forecastStartDate,
                this.data.planDuration,
                this.dialogEndCalendarYear,
              )
            : 0,
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
        contributionType: 0,
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
      const startRaw = group.get('start')?.value;
      const endRaw = group.get('end')?.value;
      const start = resolveYear(startRaw, this.eventsList);
      const end = resolveYear(endRaw, this.eventsList);
      const endCtrl = group.get('end');

      if (endCtrl) {
        const existing = endCtrl.errors ?? null;

        if (start > 0 && end > 0 && end < start) {
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
    const val = event.value;
    const rate = this.escalationRates.find((e) => e.value === val);
    const description = rate?.description ?? null;

    this.selectedEscalationDescription = description ?? '';

    const customControl = this.withdrawalForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null); // Optionally reset field
    }

    customControl?.updateValueAndValidity();
  }

  private initializeDefaultSelections(): void {
    if (this.isEditWorkflow) return;
    this.setDefaultStartEndDates();
    this.setDefaultSavingPot();
  }

  private setDefaultStartEndDates(): void {
    const lastYear = this.years[this.years.length - 1];
    const endControl = this.withdrawalForm.get('end');
    if (endControl && lastYear !== null && lastYear !== undefined && lastYear.toString() !== '') {
      if (endControl.value === null || endControl.value === undefined || endControl.value === '') {
        endControl.setValue(lastYear);
      }
    }

    const retirementEvent = this.getRetirementEvent();
    if (!retirementEvent) return;

    const startControl = this.withdrawalForm.get('start');
    const retirementYear = retirementEvent?.start?.year;
    if (startControl && retirementYear !== null && retirementYear !== undefined && retirementYear !== '') {
      if (startControl.value === null || startControl.value === undefined || startControl.value === '') {
        startControl.setValue(retirementYear);
      }
    }
  }

  private getRetirementEvent(): any | null {
    const events = this.eventsList ?? [];
    return events.find(
      (event: any) =>
        (event?.name ?? '').toString().toLowerCase() === 'retirement age'
    ) ?? null;
  }

  private setDefaultSavingPot(): void {
    const savingPotControl = this.withdrawalForm.get('savingPot');
    if (!savingPotControl || savingPotControl.value) return;

    const availablePots = this.savingPots?.clientSavings ?? [];
    if (!availablePots.length) return;

    let candidates = availablePots;
    if (availablePots.length > 1) {
      const usedPotIds = this.getExistingWithdrawalPotIds();
      if (usedPotIds.length > 0) {
        const unused = availablePots.filter(
          (pot) => pot.id && !usedPotIds.includes(pot.id)
        );
        if (unused.length > 0) {
          candidates = unused;
        }
      }
    }

    const defaultPot =
      candidates.length === 1 ? candidates[0] : this.getLargestPot(candidates);

    if (defaultPot?.id) {
      savingPotControl.setValue(defaultPot.id);
    }
  }

  private getExistingWithdrawalPotIds(): string[] {
    return (this.existingWithdrawals ?? [])
      .map((withdrawal) => withdrawal?.associatedSavingPotId)
      .filter((id): id is string => !!id);
  }

  private getLargestPot(pots: ClientSaving[]): ClientSaving | null {
    if (!pots.length) return null;
    return pots.reduce((largest, pot) => {
      const potAmount = Number(pot.startingPotValue?.amount ?? 0);
      const largestAmount = Number(largest.startingPotValue?.amount ?? 0);
      return potAmount > largestAmount ? pot : largest;
    });
  }

  private getDescriptionForSubmit(): string {
    const savingPotId = this.withdrawalForm.get('savingPot')?.value ?? null;
    const pot = (this.savingPots?.clientSavings ?? []).find((p) => p.id === savingPotId);
    return this.buildDefaultDescription(pot?.name);
  }

  private buildDefaultDescription(potName: string | null | undefined): string {
    const name = (potName ?? '').toString().trim();
    return name ? `Withdrawal from ${name}` : 'Withdrawal from';
  }

  getAgeForYear(year: number): number {
    const a = getProjectionColumnAgeLabel(
      this.data.clientBirthDate,
      Number(year),
      this.data.forecastStartDate,
      this.data.planDuration,
      this.dialogEndCalendarYear,
    );
    return Number.isNaN(a) ? 0 : a;
  }

  getStartYear(): number {
    return resolveYear(this.withdrawalForm.get('start')?.value, this.eventsList);
  }

  getEndEvents(): any[] {
    const startYear = this.getStartYear();
    return (this.eventsList ?? []).filter((e: any) => (e?.start?.year ?? 0) >= startYear);
  }

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }
}
