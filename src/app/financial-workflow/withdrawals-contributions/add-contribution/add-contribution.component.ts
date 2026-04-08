import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
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
import { catchError, concatMap, filter } from 'rxjs';
import {
  ClientSaving,
  ComissionType,
  SavingPotsModel,
} from '../../saving-pots/models/saving-pots.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getAmountCycleLabel } from 'src/app/shared/utils/amount-cycle-label';
import {
  extractEventId,
  resolveYear,
} from 'src/app/shared/utils/event-date-utils';
import { MaterialModule } from 'src/app/material.module';
import { Client } from 'src/app/clients/models/client';
import { formatSavingPotSelectLabel } from 'src/app/shared/utils/saving-pot-select-label';
import {
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionColumnAgeLabel,
  getCashflowDialogEndCalendarYear,
} from 'src/app/shared/utils/client-age-at-reference';

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
    TranslateModule,
    MaterialModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-contribution.component.html',
  styleUrl: './add-contribution.component.scss',
})
export class AddContributionComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
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
  existingContributions: FundsViewModel[] = [];

  // 🔽 New helpers for filtering
  allClientSavings: ClientSaving[] = [];
  clientSavings: ClientSaving[] = []; // <-- bound in template
  private cashPot?: ClientSaving;
  currentYear: number = new Date().getFullYear();
  selectedClient: Client | null = null;
  dialogEndCalendarYear = 0;

  constructor(
    private dialogRef: MatDialogRef<AddContributionComponent>,
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
    this.selectedContribution = data.selectedContribution;
    this.savingPots = data.savingPots;
    this.selectedClient = data.selectedClient ?? null;
    this.existingContributions = data.existingContributions ?? [];

    // keep originals and find Cash pot
    this.allClientSavings = (this.savingPots?.clientSavings ?? []).slice();
    this.cashPot = this.allClientSavings.find(
      (s) => (s.name ?? '').toLowerCase() === 'cash',
    );

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

    for (let i = 0; i < iterations; i++) {
      this.years.push(data.forecastStartDateYear + i);
    }

    // form
    this.contributionForm = this.fb.group({
      description: [''],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      cycle: [this.cycles[1].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      savingPot: [''],
      escalationRate: [this.escalationRates[0].value, Validators.required],
      customEscalationRate: [''],
      contributionType: [1, Validators.required], // 1 = Cash, 2 = External, 3 = Both

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

    this.initializeDefaultSelections();

    if (this.isEditWorkflow) {
      // hydrate commission
      const pctInit =
        this.selectedContribution?.comission?.percentage?.amount ?? 0;
      const hasCommInit = pctInit > 0;

      // hydrate core fields
      this.contributionForm.patchValue({
        contributionType: this.selectedContribution?.contributionType ?? 1,
        currencySymbol: this.clientPreferredCurrency,
        amount: this.selectedContribution.amount.amount,
        cycle: this.selectedContribution.amount.cycle?.id,
        start: this.selectedContribution.startEventId
          ? 'event:' + this.selectedContribution.startEventId
          : this.selectedContribution.start.year,
        end: this.selectedContribution.endEventId
          ? 'event:' + this.selectedContribution.endEventId
          : this.selectedContribution.end.year,
        commissions: hasCommInit,
        commissionPercentage: pctInit,
      });

      // Ensure the patched amount displays with thousand separators immediately
      setTimeout(() => {
        const el = this.amountInput?.nativeElement;
        const amount = this.contributionForm.get('amount')?.value;
        if (!el || amount === null || amount === undefined || amount === '')
          return;
        el.value = Number(amount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
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
      const type = Number(
        this.contributionForm.get('contributionType')?.value ?? 1,
      );

      if (type === 1) {
        // Cash mode: do NOT show Cash in list; preselect only if savedId is non-cash and present
        if (
          savedId &&
          savedId !== this.cashPot?.id &&
          this.clientSavings.some((s) => s.id === savedId)
        ) {
          this.contributionForm.get('savingPot')?.patchValue(savedId);
        } else {
          this.contributionForm.get('savingPot')?.patchValue(null);
        }
      } else {
        // External mode: show all, including Cash
        if (savedId && this.clientSavings.some((s) => s.id === savedId)) {
          this.contributionForm.get('savingPot')?.patchValue(savedId);
        } else {
          this.contributionForm.get('savingPot')?.patchValue(null);
        }
      }

      // const pct = this.selectedContribution?.comission?.percentage?.amount ?? 0;
      const pct =
        this.selectedContribution?.comission?.percentage?.amount ?? null;
      const hasComm = pct > 0;
      this.contributionForm.get('commissions')?.patchValue(hasComm);
      this.contributionForm
        .get('commissionPercentage')
        ?.patchValue(pct === 0 ? null : pct);
      this.isCommissionsChanged(hasCommInit);
      this.onCycleValueChange(this.selectedContribution.amount.cycle?.id);
    }

    const matchedEscalation = this.escalationRates.find(
      (x) => x.value === this.selectedContribution?.escalationRate?.value,
    );

    if (matchedEscalation) {
      this.contributionForm
        .get('escalationRate')
        ?.patchValue(matchedEscalation.value);
      this.selectedEscalationDescription = matchedEscalation.description;
    } else if (
      this.selectedContribution?.escalationRate &&
      this.selectedContribution?.escalationRate.description ===
        'Increases at custom rate'
    ) {
      this.escalationRates = this.escalationRates.filter(
        (x) => x.description !== 'Increases at custom rate',
      );
      this.escalationRates.push({
        description: 'Increases at custom rate',
        value: this.selectedContribution?.escalationRate.value,
      });

      this.contributionForm
        .get('escalationRate')
        ?.patchValue(this.selectedContribution?.escalationRate.value);
      this.contributionForm
        .get('customEscalationRate')
        ?.patchValue(this.selectedContribution?.escalationRate.value);
      this.selectedEscalationDescription = 'Increases at custom rate';

      // Trigger validators for custom rate
      const customControl = this.contributionForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.updateValueAndValidity();
    }
  }

  /** i18n key — use with `| translate` in template (sentence case in EN/IT). */
  get dialogTitle(): string {
    return this.isEditWorkflow ? 'Edit contribution' : 'Add contribution';
  }

  // === UI helpers ===
  closeDialog(): void {
    this.dialogRef.close();
  }

  selectContributionType(type: 1 | 2 | 3): void {
    this.contributionForm.patchValue({ contributionType: type });
    this.applySavingPotFilter();
    // Both requires a saving pot selection
    const savingPotCtrl = this.contributionForm.get('savingPot');
    if (type === 3) {
      savingPotCtrl?.setValidators(Validators.required);
    } else {
      savingPotCtrl?.clearValidators();
    }
    savingPotCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  isTypeSelected(type: 1 | 2 | 3): boolean {
    return this.contributionForm.get('contributionType')?.value === type;
  }

  onCycleValueChange(event: any) {
    const isOneOff =
      this.cycles.find((cycle) => cycle.id === event)?.description ===
      'One-off';
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

  getCycleLabel(cycle: Cycle): string {
    return getAmountCycleLabel(cycle, this.translate);
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
    const type = Number(
      this.contributionForm.get('contributionType')?.value ?? 1,
    );

    if (type === 1) {
      // Cash selected ➜ hide Cash from the dropdown
      this.clientSavings = (this.allClientSavings ?? []).filter(
        (s) => (s.name ?? '').toLowerCase() !== 'cash',
      );

      // if previously selected is Cash (or not in list), clear it
      const currentId = this.contributionForm.get('savingPot')?.value;
      if (
        !currentId ||
        currentId === this.cashPot?.id ||
        !this.clientSavings.some((s) => s.id === currentId)
      ) {
        this.contributionForm.get('savingPot')?.setValue(null);
      }
    } else {
      // External or Both selected ➜ show ALL (including Cash)
      this.clientSavings = (this.allClientSavings ?? []).slice();

      // keep current selection if still valid; otherwise clear
      const currentId = this.contributionForm.get('savingPot')?.value;
      if (currentId && !this.clientSavings.some((s) => s.id === currentId)) {
        this.contributionForm.get('savingPot')?.setValue(null);
      }
    }
  }

  getSavingPotSelectLabel(saving: ClientSaving): string {
    return formatSavingPotSelectLabel(
      { name: saving.name, ownership: saving.ownership },
      this.selectedClient,
      this.translate,
    );
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
      this.contributionForm.get('commissionPercentage')?.value ?? 0,
    );

    const selectedPotId: string | null =
      this.contributionForm.get('savingPot')?.value ?? null;
    const type = Number(
      this.contributionForm.get('contributionType')?.value ?? 1,
    );

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
      (x) => x.value === escalationRateValue,
    );

    const startVal = this.contributionForm.get('start')?.value;
    const endVal = this.contributionForm.get('end')?.value;
    const startYear = resolveYear(startVal, this.eventsList);
    const endYear = resolveYear(endVal, this.eventsList);
    const startEventId = extractEventId(startVal);
    const endEventId = extractEventId(endVal);

    // For Both (type 3), we create two contributions - skip single-contribution path
    if (type === 3 && !this.isEditWorkflow) {
      this.submitBothContributions(
        selectedPotId,
        hasCommission,
        commissionPct,
        emptyCycle,
        emptyNetAmount,
        escalationRateValue,
        matchedRate,
        startYear,
        endYear,
        startEventId,
        endEventId,
      );
      return;
    }

    const associatedSavingPotId =
      type === 1
        ? selectedPotId || this.cashPot?.id || ''
        : selectedPotId || '';

    const contribution: FundsViewModel = {
      id: this.isEditWorkflow ? this.selectedContribution.id : null,
      associatedSavingPotId: associatedSavingPotId,
      description: this.getDescriptionForSubmit(),
      amount: {
        amount: this.contributionForm.get('amount')?.value,
        currencySymbol: this.contributionForm.get('currencySymbol')?.value,
        cycle: {
          id: this.contributionForm.get('cycle')?.value ?? '',
          description:
            this.cycles.find(
              (x) => x.id === this.contributionForm.get('cycle')?.value,
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
      escalationRate:
        escalationRateValue !== null && escalationRateValue !== ''
          ? (matchedRate ?? {
              description: this.selectedEscalationDescription ?? '',
              value: escalationRateValue,
            })
          : { description: '', value: 0 },

      contributionType: Number(
        this.contributionForm.get('contributionType')?.value,
      ),

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
      contribution,
    );

    if (this.isEditWorkflow) {
      action$ = this.withdrawalsContributionsHttpService.updateContributions(
        this.cashflowId,
        contribution,
      );
    }

    action$
      .pipe(
        filter((res) => !!res),
        catchError((err) => {
          console.error(err);
          throw err;
        }),
      )
      .subscribe((res) => {
        this.dialogRef.close({
          status: 'Success',
          contributionWithdrawal: res,
        });
      });
  }

  private submitBothContributions(
    selectedPotId: string | null,
    hasCommission: boolean,
    commissionPct: number,
    emptyCycle: { id: string; description: string },
    emptyNetAmount: NetAmount,
    escalationRateValue: string | number | null,
    matchedRate: EscalationRate | undefined,
    startYear: number,
    endYear: number,
    startEventId: string | null,
    endEventId: string | null,
  ): void {
    const associatedSavingPotId = selectedPotId || '';
    const baseContribution: Omit<FundsViewModel, 'contributionType'> = {
      id: null,
      associatedSavingPotId,
      description: this.getDescriptionForSubmit(),
      amount: {
        amount: this.contributionForm.get('amount')?.value,
        currencySymbol: this.contributionForm.get('currencySymbol')?.value,
        cycle: {
          id: this.contributionForm.get('cycle')?.value ?? '',
          description:
            this.cycles.find(
              (x) => x.id === this.contributionForm.get('cycle')?.value,
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
      escalationRate:
        escalationRateValue !== null && escalationRateValue !== ''
          ? (matchedRate ?? {
              description: this.selectedEscalationDescription ?? '',
              value: String(escalationRateValue),
            })
          : { description: '', value: '0' },
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
            escalationRate: { description: '', value: '0' },
          }
        : {
            type: ComissionType.Percentage,
            amount: emptyNetAmount,
            percentage: emptyNetAmount,
            escalationRate: { description: '', value: '0' },
          },
    };

    const contributionCash: FundsViewModel = {
      ...baseContribution,
      contributionType: 1,
    };
    const contributionExternal: FundsViewModel = {
      ...baseContribution,
      contributionType: 2,
    };

    this.withdrawalsContributionsHttpService
      .addContributions(this.cashflowId, contributionCash)
      .pipe(
        concatMap((res) =>
          this.withdrawalsContributionsHttpService.addContributions(
            this.cashflowId,
            contributionExternal,
          ),
        ),
        filter((res) => !!res),
        catchError((err) => {
          console.error(err);
          throw err;
        }),
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

  onEscalationRateChange(event: MatSelectChange): void {
    const val = event.value;
    const rate = this.escalationRates.find((e) => e.value === val);
    const description = rate?.description ?? null;

    this.selectedEscalationDescription = description ?? '';

    const customControl = this.contributionForm.get('customEscalationRate');
    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }
    customControl?.updateValueAndValidity();
  }

  private initializeDefaultSelections(): void {
    if (this.isEditWorkflow) return;
    this.setDefaultStartEndDates();
    this.setDefaultSavingPot();
  }

  private setDefaultStartEndDates(): void {
    const startControl = this.contributionForm.get('start');
    if (
      startControl &&
      (startControl.value === null ||
        startControl.value === undefined ||
        startControl.value === '')
    ) {
      startControl.setValue(this.currentYear);
    }

    const endControl = this.contributionForm.get('end');
    const retirementEvent = this.getRetirementEvent();
    if (!endControl || !retirementEvent) return;

    const retirementYear = retirementEvent?.start?.year;
    if (
      retirementYear === null ||
      retirementYear === undefined ||
      retirementYear === ''
    )
      return;
    if (
      endControl.value === null ||
      endControl.value === undefined ||
      endControl.value === ''
    ) {
      endControl.setValue(retirementYear);
    }
  }

  private getRetirementEvent(): any | null {
    const events = this.eventsList ?? [];
    return (
      events.find(
        (event: any) =>
          (event?.name ?? '').toString().toLowerCase() === 'retirement age',
      ) ?? null
    );
  }

  private setDefaultSavingPot(): void {
    const savingPotControl = this.contributionForm.get('savingPot');
    if (!savingPotControl || savingPotControl.value) return;

    const nonCashSavings = this.getNonCashSavings();
    if (!nonCashSavings.length) return;

    let candidates = nonCashSavings;
    if (nonCashSavings.length > 1) {
      const usedPotIds = this.getExistingContributionPotIds();
      if (usedPotIds.length > 0) {
        const unused = nonCashSavings.filter(
          (pot) => pot.id && !usedPotIds.includes(pot.id),
        );
        if (unused.length > 0) {
          candidates = unused;
        }
      }
    }

    const defaultPot = this.getLargestPot(candidates);
    if (!defaultPot) return;

    if (
      this.clientSavings?.length &&
      !this.clientSavings.some((pot) => pot.id === defaultPot.id)
    ) {
      return;
    }

    savingPotControl.setValue(defaultPot.id);
  }

  private getNonCashSavings(): ClientSaving[] {
    return (this.allClientSavings ?? []).filter(
      (pot) => (pot.name ?? '').toLowerCase() !== 'cash',
    );
  }

  private getExistingContributionPotIds(): string[] {
    return (this.existingContributions ?? [])
      .map((contribution) => contribution?.associatedSavingPotId)
      .filter((id): id is string => !!id);
  }

  /** For Pension fund: use contributionAmount as fallback when startingPotValue is 0 (common for new pensions) */
  private getLargestPot(pots: ClientSaving[]): ClientSaving | null {
    if (!pots.length) return null;
    return pots.reduce((largest, pot) => {
      const potAmount = this.getEffectivePotValueForComparison(pot);
      const largestAmount = this.getEffectivePotValueForComparison(largest);
      return potAmount > largestAmount ? pot : largest;
    });
  }

  private getEffectivePotValueForComparison(pot: ClientSaving): number {
    const starting = Number(pot.startingPotValue?.amount ?? 0);
    if (starting > 0) return starting;
    const isPensionFund = (pot.name ?? '').toLowerCase() === 'pension fund';
    if (isPensionFund && (pot.contributionAmount ?? 0) > 0) {
      return Number(pot.contributionAmount ?? 0);
    }
    return starting;
  }

  private getDescriptionForSubmit(): string {
    const selectedPotId = this.contributionForm.get('savingPot')?.value ?? null;
    const type = Number(
      this.contributionForm.get('contributionType')?.value ?? 1,
    );
    const effectiveId =
      type === 1 ? selectedPotId || this.cashPot?.id : selectedPotId;
    const pot = (this.allClientSavings ?? []).find((p) => p.id === effectiveId);
    return this.buildDefaultDescription(pot?.name);
  }

  private buildDefaultDescription(potName: string | null | undefined): string {
    const name = (potName ?? '').toString().trim();
    return name ? `Contribution to ${name}` : 'Contribution to';
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
    return resolveYear(
      this.contributionForm.get('start')?.value,
      this.eventsList,
    );
  }

  getEndEvents(): any[] {
    const startYear = this.getStartYear();
    return (this.eventsList ?? []).filter(
      (e: any) => (e?.start?.year ?? 0) >= startYear,
    );
  }

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }
}
