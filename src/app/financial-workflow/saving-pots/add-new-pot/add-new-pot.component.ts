import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import {
  AbstractControl,
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
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  SavingPotOwnership,
  SavingPotType,
} from '../models/saving-pots.model';
import { catchError, filter, finalize } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateEscalationDescriptionPipe } from 'src/app/core/pipes/translate-escalation-description.pipe';
import { getAmountCycleLabel } from 'src/app/shared/utils/amount-cycle-label';
import { resolveEscalationMatch } from 'src/app/shared/utils/escalation-rate-utils';
import {
  getCashflowDialogEndCalendarYear,
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionAgeForClientEvent,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import { calendarYearOrEventRefValidator } from 'src/app/shared/utils/calendar-year-or-event-ref.validator';
import { extractEventId, resolveYear } from 'src/app/shared/utils/event-date-utils';
import { getStartEndDurationLabel } from 'src/app/shared/utils/start-end-duration-label';

@Component({
  selector: 'app-add-new-pot',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    TablerIconsModule,
    MatCheckboxModule,
    ThousandSeparatorInputDirective,
    TranslateModule,
    TranslateEscalationDescriptionPipe,
  ],
  templateUrl: './add-new-pot.component.html',
  styleUrl: './add-new-pot.component.scss',
})
export class AddNewPotComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('contributionAmountInput')
  contributionAmountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('renameInputRef') renameInputRef?: ElementRef<HTMLInputElement>;
  savingsForm: FormGroup;
  years: number[] = [];
  countries = allCountries;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  /** Calendar year of the active ownership’s retirement timeline event (API field; not “age”). */
  retirementAge: number = 65;
  /** Projection age at that retirement year (for labels / defaults). */
  retirementAgeValue: number = 65;
  cycles: Cycle[];
  escalationRates: EscalationRate[];
  eventsList: any;
  cashflowId: string;
  formattedReturnRate: string = '';
  formattedCommissionPercentage: string = '';
  selectedName: string = '';
  selectedNameIconUrl: string = '';
  inflationRate = 0;
  isEditWorkflow = false;
  scenarioMode: boolean = false;
  selectedPot: ClientSaving;
  savingPotType= SavingPotType
  selectedEscalationDescription: string | null = null;
  editDialogTitle: string = '';
  isRenamingEntry: boolean = false;
  renamedCustomName: string = '';
  existingSavingPots: any[] = [];
  showNameEdit: boolean = false;
  hasPartner: boolean = false;
  fromNetWorth: boolean = false;
  clientFirstName: string = '';
  partnerFirstName: string = '';
  /** Full display label for ownership radio (first + last); falls back to firstName. */
  clientDisplayName: string = '';
  partnerDisplayName: string = '';
  SavingPotOwnership = SavingPotOwnership;
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
      name: 'Pension fund',
      iconUrl: 'cashflow-pension-icon',
      type: SavingPotType.PensionFund,
    },
  ];
  forecastEndDateYear: any;
  forecastStartDateYear: any;
  /** Inclusive last calendar year in this dialog’s year dropdowns (plan end, not API+1). */
  dialogEndCalendarYear: number;
  isCashPotEditMode: boolean;
  userReturnRate: any = 3.5;
  pensionFundReturnRate: any = 4;
  /** Mat slider thumb binding (must be defined — template uses [value]). */
  sliderReturnRate = 0;
  /** Return rate text field next to slider (numeric part only; % is separate in UI). */
  returnRateText = '0';
  loggedInUserPreferences: any;
  comissionTypes = [
    { label: 'Amount', value: ComissionType.Amount },
    { label: 'Percentage', value: ComissionType.Percentage },
    { label: 'Both', value: ComissionType.Both },
  ];
  /** When advisor preference is None, no commission type/amount/percentage is prefilled */
  loggedInUserComissionType: string | undefined;
  isAddComissionChecked: any;
  currentYear: number = new Date().getFullYear();
  amount: number | null;
  private readonly allOwnershipOptions: SavingPotOwnership[] = [
    SavingPotOwnership.Joint,
    SavingPotOwnership.Person1,
    SavingPotOwnership.Person2
  ];
  private contributionEndManuallyOverridden = false;
  /** True while the save HTTP request is in flight (disables actions + shows spinner). */
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddNewPotComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private savingPotsHttpService: SavingsPotsHttpService,
    private translate: TranslateService
  ) {
    this.loggedInUserPreferences = data.loggedInUserPreferences;
    const infl = Number(data.inflationRate);
    this.inflationRate = Number.isFinite(infl) ? infl : 0;
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.eventsList = data.eventsList;
    this.existingSavingPots = data.existingSavingPots || [];  // Get existing pots for smart defaults
    this.hasPartner = data.hasPartner ?? false;
    this.fromNetWorth = data.fromNetWorth ?? false;
    this.scenarioMode = data.scenarioMode ?? false;
    this.clientFirstName = data.clientFirstName ?? '';
    this.partnerFirstName = data.partnerFirstName ?? '';
    this.clientDisplayName = (
      data.clientDisplayName ??
      data.clientFirstName ??
      ''
    ).trim();
    this.partnerDisplayName = (
      data.partnerDisplayName ??
      data.partnerFirstName ??
      ''
    ).trim();
    this.clientBirthYear = moment(data.clientBirthDate).year();
    this.userReturnRate = data.returnRate;
    this.pensionFundReturnRate = data.pensionFundReturnRate ?? 4;
    const birthDate = new Date(data.clientBirthDate);
    const forecastStart = data.forecastStartDate
      ? new Date(data.forecastStartDate)
      : new Date(data.forecastStartDateYear, 0, 1);
    const prefType = this.loggedInUserPreferences?.comissionType;
    this.loggedInUserComissionType = prefType === ComissionType.None || prefType == null
      ? undefined
      : this.comissionTypes.find(x => x.value === prefType)?.label.toLowerCase();
    this.clientAge = getCompletedYearsAgeAtDate(birthDate, forecastStart);

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedPot = data.event
    this.forecastStartDateYear = data.forecastStartDateYear;
    this.forecastEndDateYear = data.forecastEndDateYear;
    const resolvedDialogEnd = getCashflowDialogEndCalendarYear(
      data.clientBirthDate,
      data.planDuration,
      data.forecastEndDateYear,
    );
    this.dialogEndCalendarYear = Number.isFinite(resolvedDialogEnd)
      ? resolvedDialogEnd
      : Number(data.forecastEndDateYear);
    if (!Number.isFinite(this.dialogEndCalendarYear)) {
      this.dialogEndCalendarYear = data.forecastStartDateYear;
    }

    /** Joint: main client retirement for dropdown highlight; aligns with timeline axis ages. */
    this.applyRetirementLabelsFromEvent(this.findRetirementEventForPerson(false));

    // Determine if this is a Cash pot edit mode EARLY (before form creation)
    if (this.isEditWorkflow) {
      this.isCashPotEditMode = (this.selectedPot?.name ?? '').trim().toLowerCase() === 'cash';
    }

    // Set edit dialog title if in edit mode
    if (this.isEditWorkflow && this.selectedPot) {
      this.editDialogTitle = `Edit ${this.selectedPot.name}`;
    }

    const endYear = this.dialogEndCalendarYear;
    const iterations = endYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    // Determine default type based on smart logic (Cases 1-4)
    let defaultType = 'Investment';  // Default fallback
    if (!this.isEditWorkflow) {
      defaultType = this.getSmartDefaultType();
    } else {
      // In edit mode, use the current pot's type
      defaultType = this.selectedPot?.name || 'Investment';
    }

    const defaultReturnRate = defaultType === 'Pension fund'
      ? this.normalizeReturnRate(this.pensionFundReturnRate)
      : this.normalizeReturnRate(this.userReturnRate);

    this.savingsForm = this.fb.group({
      name: [defaultType, Validators.required],
      currency: [this.clientPreferredCurrency, Validators.required],
      amount: [0, [Validators.required, this.minPositiveValue()]],
      customName: [''],  // For Custom pots
      returnRate: [defaultReturnRate],
      // lockPot: [true],
      lockPot: [defaultType === 'Pension fund'],  // Auto-check for Pension fund only
      start: [data.forecastStartDateYear, [calendarYearOrEventRefValidator()]],
      end: [this.dialogEndCalendarYear, [calendarYearOrEventRefValidator()]],
      // Commissions always start unchecked - user must manually enable
      commissions: [false],
      commissionType: [this.loggedInUserComissionType ?? ''],
      commissionCurrency: [this.clientPreferredCurrency],
      commissionAmount: [this.loggedInUserComissionType ? (this.loggedInUserPreferences?.comissionAmount ?? 0) : 0],
      commissionCycle: [this.loggedInUserComissionType ? (this.loggedInUserPreferences?.comissionCycle ?? this.cycles[2]?.id) : ''],
      commissionPercentageCurrency: [this.clientPreferredCurrency],
      commissionPercentageCycle: [this.loggedInUserComissionType ? (this.loggedInUserPreferences?.comissionPercentageCycle ?? this.cycles[2]?.id) : ''],
      commissionPercentage: [this.loggedInUserComissionType ? (this.loggedInUserPreferences?.comissionPercentage ?? 0) : 0],
      escalationRate: [''],
      customEscalationRate: [''],
      // Pension fund specific fields
      contributionAmount: [0],
      contributionFrequency: [1],  // Monthly (1) by default
      contributionStartDate: [data.forecastStartDateYear, [calendarYearOrEventRefValidator()]],
      contributionEndDate: [null as number | string | null, [calendarYearOrEventRefValidator()]],
      ownership: [SavingPotOwnership.Joint]
    });

  this.savingsForm.setValidators(this.endOnOrAfterStartValidator());

    this.savingsForm.get('currency')?.disable();
    this.savingsForm.get('commissionCurrency')?.disable();


    this.savingsForm.get('returnRate')?.valueChanges.subscribe((value) => {
      this.formattedReturnRate = this.formatWithPercentage(value);
      const n = typeof value === 'number' ? value : Number(value);
      this.sliderReturnRate = Number.isFinite(n) ? Math.max(0, Math.min(10, this.round2(n))) : 0;
      this.syncReturnRateTextFromForm();
    });

    // Keep the local amount property in sync with the form control
    const amountControl = this.savingsForm.get('amount');
    this.amount = (amountControl?.value ?? null) as number | null;
    amountControl?.valueChanges.subscribe((value) => {
      this.amount = (value ?? null) as number | null;
    });
    
    // Set up initial validators for Pension fund fields if default type is Pension fund
    this.updatePensionFundValidators(defaultType);

    if (!this.isEditWorkflow && defaultType === 'Pension fund') {
      const ownership = this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint;
      this.syncRetirementFieldsForOwnership(ownership);
      this.savingsForm
        .get('contributionEndDate')
        ?.setValue(this.getDefaultContributionEndFormValue(ownership), { emitEvent: false });
    }

    if(this.isEditWorkflow) {
      this.patchFormValues();
      if (this.isCashPotEditMode) {
        // Freeze the Type as Cash and don’t emit changes
        this.savingsForm.get('name')?.setValue('Cash', { emitEvent: false });
        this.savingsForm.get('name')?.disable({ emitEvent: false });
        this.selectedNameIconUrl = 'cashflow-moneys-icon';
      }
      if (this.selectedPot?.name === 'Pension fund') {
        const ownership =
          this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint;
        this.syncRetirementFieldsForOwnership(ownership);
      }
    }

    this.syncOwnershipForSelectedType();
    this.syncLockPotForPensionFund();
    this.syncReturnRateTextFromForm();
    this.syncSliderReturnRateFromForm();
  }


  private noCashNameValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const val = (control.value ?? '').toString().trim().toLowerCase();
      if (val !== 'cash') return null;
      if (!this.hasPartner || !this.canAddCashPot) {
        return { cashNameNotAllowed: true };
      }
      return null;
    };
  }

  minPositiveValue(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (value === null || value === '' || value === undefined) {
        return null; // Let Validators.required handle empty values
      }
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      // Allow 0 or positive for all saving pots
      return numValue >= 0 ? null : { minPositiveValue: { value: control.value } };
    };
  }

  onAmountFocus(e: Event) {
  // show raw (no commas) while typing
  const c = this.savingsForm.get('amount')!;
  (e.target as HTMLInputElement).value = (c.value ?? '').toString();
}

onAmountBlur(e: Event) {
  const c = this.savingsForm.get('amount')!;
  const rawValue = (e.target as HTMLInputElement).value;
  const num = parseFormattedNumber(rawValue, this.translate.currentLang);
  c.setValue(num, { emitEvent: false }); // model stays numeric

  const locale = this.translate.currentLang === 'it' ? 'it-IT' : 'en-US';
  (e.target as HTMLInputElement).value = num.toLocaleString(locale);
}

  onContributionAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue ?? '', this.translate.currentLang);
    this.savingsForm.get('contributionAmount')?.setValue(value, { emitEvent: true });
  }

  onContributionAmountBlur(e: Event) {
    const c = this.savingsForm.get('contributionAmount')!;
    const rawValue = (e.target as HTMLInputElement).value;
    const num = parseFormattedNumber(rawValue, this.translate.currentLang);
    c.setValue(num, { emitEvent: false });

    const locale = this.translate.currentLang === 'it' ? 'it-IT' : 'en-US';
    (e.target as HTMLInputElement).value = num.toLocaleString(locale);
  }

  patchFormValues() {
    this.isAddComissionChecked = this.selectedPot?.hasCommission;
    var savingPotValue = this.savingPotValues.find(x => x.name === this.selectedPot.name);
        if(savingPotValue) {
      this.savingsForm.get('name')?.patchValue(savingPotValue.name)
    }
    else {
      this.savingsForm.get('name')?.patchValue('Custom');
      this.onNameValueChange('Custom');
      this.savingsForm.get('customName')?.patchValue(this.selectedPot.name);
    }
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
    this.savingsForm.get('amount')?.updateValueAndValidity(); // Force re-validation after patching
    this.amount = (this.savingsForm.get('amount')?.value ?? null) as number | null;
    // Ensure thousandSeparatorInput formats the patched value (it formats on blur)
    setTimeout(() => {
      const el = this.amountInput?.nativeElement;
      if (!el || this.amount === null || this.amount === undefined) return;
      el.value = this.amount.toLocaleString('en-US');
      el.dispatchEvent(new Event('blur'));
    });
    // this.savingsForm.get('returnRate')?.patchValue(this.selectedPot.returnRate, { emitEvent: false });
    this.savingsForm.get('returnRate')?.patchValue(
      this.round2(this.selectedPot.returnRate),
      { emitEvent: false }
    );
    const isPensionFundEdit = this.selectedPot.name === 'Pension fund';
    this.savingsForm.get('lockPot')?.patchValue(isPensionFundEdit ? true : this.selectedPot.hasPotLocked, { emitEvent: false });

    const lockStartVal = this.selectedPot.startEventId
      ? 'event:' + this.selectedPot.startEventId
      : (this.selectedPot.lockedFrom?.year || this.forecastStartDateYear);
    const lockEndVal = this.selectedPot.endEventId
      ? 'event:' + this.selectedPot.endEventId
      : (this.selectedPot.lockedTill?.year || this.dialogEndCalendarYear);
    this.savingsForm.get('start')?.patchValue(lockStartVal, { emitEvent: false });
    this.savingsForm.get('end')?.patchValue(lockEndVal, { emitEvent: false });
    
    // Patch Pension fund specific fields if applicable
    if (this.selectedPot.name === 'Pension fund') {
      this.savingsForm.get('contributionAmount')?.patchValue(this.selectedPot.contributionAmount, { emitEvent: false });
      this.savingsForm.get('contributionFrequency')?.patchValue(this.selectedPot.contributionFrequency, { emitEvent: false });
      const contribVal = this.savingsForm.get('contributionAmount')?.value;
      setTimeout(() => {
        const el = this.contributionAmountInput?.nativeElement;
        if (!el || contribVal === null || contribVal === undefined) return;
        el.value = Number(contribVal).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
      });

      const contribStartVal = this.selectedPot.contributionStartEventId
        ? 'event:' + this.selectedPot.contributionStartEventId
        : this.selectedPot.contributionStartDate?.year ?? null;
      const contribEndVal = this.selectedPot.contributionEndEventId
        ? 'event:' + this.selectedPot.contributionEndEventId
        : this.selectedPot.contributionEndDate?.year ?? null;
      this.savingsForm.get('contributionStartDate')?.patchValue(contribStartVal, { emitEvent: false });
      this.savingsForm.get('contributionEndDate')?.patchValue(contribEndVal, { emitEvent: false });
    }
    
    this.savingsForm.get('ownership')?.patchValue(this.selectedPot.ownership ?? SavingPotOwnership.Joint, { emitEvent: false });
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

    const matchedEscalation = resolveEscalationMatch(
      this.escalationRates,
      this.selectedPot.comission.escalationRate,
    );

    if (matchedEscalation) {
      this.savingsForm.get('escalationRate')?.patchValue(matchedEscalation.description, { emitEvent: false });
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
      this.savingsForm.get('escalationRate')?.patchValue('Increases at custom rate', { emitEvent: false });
      this.savingsForm.get('customEscalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value, { emitEvent: false });
      this.selectedEscalationDescription = 'Increases at custom rate';

      const customControl = this.savingsForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.updateValueAndValidity({ emitEvent: false });
    }

    // Sync lock-pot validators: clear start/end validators when pot is not locked
    const isLocked = this.savingsForm.get('lockPot')?.value;
    if (!isLocked) {
      this.savingsForm.get('start')?.clearValidators();
      this.savingsForm.get('start')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('end')?.clearValidators();
      this.savingsForm.get('end')?.updateValueAndValidity({ emitEvent: false });
    }

    // Force form to recalculate validity after all patches are applied
    this.savingsForm.updateValueAndValidity();
    this.syncReturnRateTextFromForm();
    this.syncSliderReturnRateFromForm();
  }

  ngOnInit() {
    this.updateFormattedValue('returnRate');
    // When user selects commission type, apply type-specific validators
    // Defer to next tick so dropdown closes immediately (better UX)
    this.savingsForm.get('commissionType')?.valueChanges.subscribe((type: string) => {
      setTimeout(() => {
        if (type) {
          this.onCommissionTypeControlClicked(type);
        } else {
          this.clearCommissionTypeValidators();
        }
      }, 0);
    });

    this.savingsForm.get('contributionEndDate')?.valueChanges.subscribe(() => {
      this.contributionEndManuallyOverridden = true;
    });

    this.savingsForm.get('ownership')?.valueChanges.subscribe((ownership: SavingPotOwnership) => {
      if (
        this.savingsForm.get('name')?.value === 'Pension fund' &&
        !this.contributionEndManuallyOverridden
      ) {
        this.syncRetirementFieldsForOwnership(ownership);
        this.savingsForm
          .get('contributionEndDate')
          ?.setValue(this.getDefaultContributionEndFormValue(ownership), { emitEvent: false });
      }
    });
  }

  private clearCommissionTypeValidators(): void {
    this.savingsForm.get('commissionCurrency')?.removeValidators(Validators.required);
    this.savingsForm.get('commissionAmount')?.removeValidators(Validators.required);
    this.savingsForm.get('commissionCycle')?.removeValidators(Validators.required);
    this.savingsForm.get('commissionPercentageCurrency')?.removeValidators(Validators.required);
    this.savingsForm.get('commissionPercentage')?.removeValidators(Validators.required);
    this.savingsForm.get('commissionPercentageCycle')?.removeValidators(Validators.required);
    this.savingsForm.get('escalationRate')?.removeValidators(Validators.required);
    ['commissionCurrency', 'commissionAmount', 'commissionCycle',
     'commissionPercentageCurrency', 'commissionPercentage', 'commissionPercentageCycle', 'escalationRate']
      .forEach(name => this.savingsForm.get(name)?.updateValueAndValidity({ emitEvent: false }));
  }

  /**
   * Implements smart default pot type selection based on existing pots
   * Case 1: Existing pot: Cash → New pot default: Investment
   * Case 2: Existing pot: Cash, Investment → New pot default: Pension fund
   * Case 3: Existing pot: Cash, Pension fund → New pot default: Investment
   * Case 4: Existing pot: Cash, Investment, Pension fund or more → New pot default: Custom
   */
  getSmartDefaultType(): string {
    if (!this.existingSavingPots || this.existingSavingPots.length === 0) {
      return 'Investment';  // Default if no existing pots
    }

    // Get unique pot types from existing pots
    const existingTypes = new Set(
      this.existingSavingPots.map((pot: any) => pot.name)
    );

    const hasCash = existingTypes.has('Cash');
    const hasInvestment = existingTypes.has('Investment');
    const hasPension = existingTypes.has('Pension fund');

    // Case 4: Multiple types already exist
    if (existingTypes.size >= 3) {
      return 'Custom';
    }

    // Case 1: Only Cash exists
    if (existingTypes.size === 1 && hasCash) {
      return 'Investment';
    }

    // Case 2: Cash and Investment exist
    if (existingTypes.size === 2 && hasCash && hasInvestment) {
      return 'Pension fund';
    }

    // Case 3: Cash and Pension fund exist
    if (existingTypes.size === 2 && hasCash && hasPension) {
      return 'Investment';
    }

    // Default fallback
    return 'Investment';
  }
  
  private findRetirementEventForPerson(isPartner: boolean): any | null {
    const events = this.eventsList ?? [];
    return (
      events.find((e: any) => {
        const n = (e?.name ?? '').toString().trim().toLowerCase();
        const isRetirementName =
          n.startsWith('retirement age') || n.includes('pensione');
        return isRetirementName && !!e?.isPartnerEvent === isPartner;
      }) ?? null
    );
  }

  private applyRetirementLabelsFromEvent(retirementEvent: any | null): void {
    if (!retirementEvent) return;
    const ry = Number(retirementEvent.start?.year);
    if (!Number.isFinite(ry) || ry <= 0) return;
    this.retirementAge = ry;
    this.retirementAgeValue = getProjectionAgeForClientEvent(retirementEvent, {
      clientBirthDate: this.data.clientBirthDate,
      partnerBirthDate: this.data.partnerBirthDate,
      forecastStartDate: this.data.forecastStartDate,
      planDuration: this.data.planDuration,
      projectionInclusiveEndYear: this.dialogEndCalendarYear,
    });
  }

  private getDefaultContributionEndFormValue(
    ownership: SavingPotOwnership,
  ): number | string | null {
    const isPartner = ownership === SavingPotOwnership.Person2;
    const ev = this.findRetirementEventForPerson(isPartner);
    if (ev?.id) {
      return 'event:' + ev.id;
    }
    const y = Number(ev?.start?.year);
    return Number.isFinite(y) && y > 0 ? y : this.getRetirementYearForOwnership(ownership);
  }

  private syncRetirementFieldsForOwnership(ownership: SavingPotOwnership): void {
    const isPartner = ownership === SavingPotOwnership.Person2;
    this.applyRetirementLabelsFromEvent(this.findRetirementEventForPerson(isPartner));
  }

  /** Age label for a timeline event; matches projection axis (not raw stored age). */
  displayAgeForTimelineEvent(event: any): number {
    return getProjectionAgeForClientEvent(event, {
      clientBirthDate: this.data.clientBirthDate,
      partnerBirthDate: this.data.partnerBirthDate,
      forecastStartDate: this.data.forecastStartDate,
      planDuration: this.data.planDuration,
      projectionInclusiveEndYear: this.dialogEndCalendarYear,
    });
  }

  private getRetirementYearForOwnership(ownership: SavingPotOwnership): number | null {
    const isPartner = ownership === SavingPotOwnership.Person2;
    const event = this.findRetirementEventForPerson(isPartner);
    const year = Number(event?.start?.year);
    return Number.isFinite(year) && year > 0 ? year : null;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  get displayPotName(): string {
    if (!this.savingsForm) return '';
    const name = (this.savingsForm.get('name')?.value ?? '').toString();

    if (name === 'Custom') {
      const customName = (this.savingsForm.get('customName')?.value ?? '').toString().trim();
      return customName || this.selectedPot?.name || 'Custom';
    }

    return name || this.selectedPot?.name || '';
  }

  get canEditName(): boolean {
    return this.isEditWorkflow && this.savingsForm?.get('name')?.value === 'Custom';
  }

  toggleNameEdit(): void {
    this.showNameEdit = !this.showNameEdit;
  }

  /** Number of existing pots with name "Cash". */
  get cashPotCount(): number {
    return (this.existingSavingPots || []).filter(
      (p: { name?: string }) => (p?.name ?? '').trim().toLowerCase() === 'cash'
    ).length;
  }

  get canAddCashPot(): boolean {
    if (!this.hasPartner) {
      const hasCash = (this.existingSavingPots || []).some(
        (pot: any) => (pot?.name ?? '').toString().trim().toLowerCase() === 'cash'
      );
      return !hasCash;
    }
    return this.availableCashOwnerships.length > 0;
  }

  get isCashTypeSelected(): boolean {
    return (this.savingsForm?.get('name')?.value ?? '').toString().trim().toLowerCase() === 'cash';
  }

  get showCashOwnershipFilter(): boolean {
    return this.hasPartner && this.isCashTypeSelected;
  }

  get availableCashOwnerships(): SavingPotOwnership[] {
    const baseOptions = this.hasPartner
      ? this.allOwnershipOptions
      : [SavingPotOwnership.Joint];

    const used = this.getUsedCashOwnerships();
    return baseOptions.filter((ownership) => !used.has(ownership));
  }

  isOwnershipAvailableForCash(ownership: SavingPotOwnership): boolean {
    return this.availableCashOwnerships.includes(ownership);
  }

  private getUsedCashOwnerships(): Set<SavingPotOwnership> {
    const isEditingCash = this.isEditWorkflow && this.isCashPotEditMode;
    const currentId = isEditingCash ? this.selectedPot?.id : null;
    const used = new Set<SavingPotOwnership>();

    (this.existingSavingPots || []).forEach((pot: any) => {
      const isCash = (pot?.name ?? '').toString().trim().toLowerCase() === 'cash';
      if (!isCash) return;
      if (currentId && pot?.id === currentId) return;

      used.add((pot?.ownership ?? SavingPotOwnership.Joint) as SavingPotOwnership);
    });

    return used;
  }

  private syncOwnershipForSelectedType(): void {
    const ownershipControl = this.savingsForm.get('ownership');
    if (!ownershipControl) return;

    if (!this.isCashTypeSelected) {
      // For non-cash pots keep current behavior/default.
      return;
    }

    const current = ownershipControl.value as SavingPotOwnership;
    if (this.isOwnershipAvailableForCash(current)) {
      ownershipControl.setErrors(null);
      return;
    }

    const fallback = this.availableCashOwnerships[0];
    if (fallback != null) {
      ownershipControl.patchValue(fallback, { emitEvent: false });
      ownershipControl.setErrors(null);
    } else {
      ownershipControl.setErrors({ duplicateCashOwnership: true });
    }
  }

  /**
   * Pension funds must always be locked. Call after any change that
   * affects pot type or lock state to keep UI + model in sync.
   */
  private syncLockPotForPensionFund(): void {
    const lockPotCtrl = this.savingsForm.get('lockPot');
    if (!lockPotCtrl) return;

    if (this.savingsForm.get('name')?.value === 'Pension fund') {
      lockPotCtrl.setValue(true, { emitEvent: false });
      lockPotCtrl.disable({ emitEvent: false });
    } else {
      lockPotCtrl.enable({ emitEvent: false });
    }
  }

  onNameValueChange(name: any) {
    this.selectedName = name;
    this.renamedCustomName = '';  // Reset renamed value when type changes
    this.isRenamingEntry = false;  // Reset rename mode
    
    if (name === 'Custom') {
      this.savingsForm.setControl(
        'customName',
        new FormControl('', [Validators.required, this.noCashNameValidator()])
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
    
    // Switch return rate default based on pot type
    if (!this.isEditWorkflow) {
      if (name === 'Pension fund') {
        this.savingsForm.get('returnRate')?.setValue(
          this.normalizeReturnRate(this.pensionFundReturnRate),
          { emitEvent: true }
        );
      } else if (name !== 'Cash') {
        this.savingsForm.get('returnRate')?.setValue(
          this.normalizeReturnRate(this.userReturnRate),
          { emitEvent: true }
        );
      }
    }

    // Auto-tick lockPot for Pension fund, untick for other types
    if (name === 'Pension fund') {
      if (!this.isEditWorkflow) {
        this.contributionEndManuallyOverridden = false;
        const ownership = this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint;
        this.syncRetirementFieldsForOwnership(ownership);
        this.savingsForm
          .get('contributionEndDate')
          ?.setValue(this.getDefaultContributionEndFormValue(ownership), { emitEvent: false });
      }
    } else {
      this.savingsForm.get('lockPot')?.setValue(false);
    }

    this.syncLockPotForPensionFund();
    // Update Pension fund field validators based on type
    this.updatePensionFundValidators(name);
    this.syncOwnershipForSelectedType();
  }
  
  // Update validators for Pension fund specific fields
  private updatePensionFundValidators(potType: string): void {
    const contributionAmountControl = this.savingsForm.get('contributionAmount');
    const contributionStartControl = this.savingsForm.get('contributionStartDate');
    const contributionEndControl = this.savingsForm.get('contributionEndDate');
    const commissionsControl = this.savingsForm.get('commissions');
    
    if (potType === 'Pension fund') {
      // Make Pension fund fields required
      contributionAmountControl?.setValidators([Validators.required, this.minPositiveValue()]);
      contributionStartControl?.setValidators([calendarYearOrEventRefValidator()]);
      contributionEndControl?.setValidators([calendarYearOrEventRefValidator()]);
      
      // Do NOT auto-check commissions - user must manually enable it
    } else {
      // Clear validators for non-Pension fund types
      contributionAmountControl?.setValidators([]);
      contributionStartControl?.setValidators([]);
      contributionEndControl?.setValidators([]);
    }
    
    contributionAmountControl?.updateValueAndValidity();
    contributionStartControl?.updateValueAndValidity();
    contributionEndControl?.updateValueAndValidity();
  }

  toggleRenameEntry(): void {
    this.isRenamingEntry = !this.isRenamingEntry;
    if (this.isRenamingEntry) {
      // Initialize with current custom name
      this.renamedCustomName = this.savingsForm.get('customName')?.value || '';
      // Auto-focus and select text for rename input
      setTimeout(() => {
        if (this.renameInputRef) {
          this.renameInputRef.nativeElement.focus();
          this.renameInputRef.nativeElement.select();
        }
      }, 0);
    }
  }

  saveRenamedEntry(): void {
    const currentValue = this.savingsForm.get('customName')?.value?.trim();
    if (currentValue) {
      this.renamedCustomName = currentValue;
      this.isRenamingEntry = false;
      // Update the dialog title if it's in edit mode
      if (this.isEditWorkflow) {
        this.editDialogTitle = `Edit ${currentValue}`;
      }
    }
  }

  isLockPotChanged(event: any) {
    if (this.savingsForm.get('name')?.value === 'Pension fund') {
      this.savingsForm.get('lockPot')?.setValue(true, { emitEvent: false });
      return;
    }
    if (event) {
      this.savingsForm.get('start')?.setValidators([calendarYearOrEventRefValidator()]);
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.setValidators([calendarYearOrEventRefValidator()]);
      this.savingsForm.get('end')?.updateValueAndValidity();

      this.savingsForm.get('end')?.patchValue(this.eventsList[0].start.year > 0 ? this.eventsList[0].start.year : this.forecastStartDateYear)
    } else {
      this.savingsForm.get('start')?.clearValidators();
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.clearValidators();
      this.savingsForm.get('end')?.updateValueAndValidity();

      this.savingsForm.get('end')?.patchValue(this.dialogEndCalendarYear);
    }
  }

  isCommissionsChanged(event: any) {
    this.isAddComissionChecked = event;
    // Defer form updates to next tick so checkbox updates immediately (better UX)
    setTimeout(() => {
      const defaultType = this.loggedInUserComissionType ?? '';
      this.savingsForm.get('commissionType')?.setValue(defaultType, { emitEvent: false });

      if (event) {
        this.savingsForm.get('commissionCurrency')?.setValue(this.clientPreferredCurrency, { emitEvent: false });
        this.savingsForm.get('commissionPercentageCurrency')?.setValue(this.clientPreferredCurrency, { emitEvent: false });
        this.savingsForm.get('commissionType')?.setValidators(Validators.required);

        if (this.loggedInUserComissionType) {
          this.savingsForm.get('commissionCurrency')?.setValidators(Validators.required);
          this.savingsForm.get('commissionAmount')?.setValidators(Validators.required);
          this.savingsForm.get('commissionCycle')?.setValidators(Validators.required);
          this.savingsForm.get('commissionCycle')?.setValue(this.loggedInUserPreferences?.comissionCycle ?? this.cycles[2].id, { emitEvent: false });
          this.savingsForm.get('escalationRate')?.setValidators(Validators.required);
          this.savingsForm.get('escalationRate')?.setValue(this.escalationRates[1]?.description ?? '', { emitEvent: false });
          if (this.loggedInUserPreferences?.comissionAmount) {
            this.savingsForm.get('commissionAmount')?.setValue(this.loggedInUserPreferences.comissionAmount, { emitEvent: false });
          }
          if (this.loggedInUserPreferences?.comissionPercentage) {
            this.savingsForm.get('commissionPercentage')?.setValue(this.loggedInUserPreferences.comissionPercentage, { emitEvent: false });
          }
          if (this.loggedInUserPreferences?.comissionCycle) {
            this.savingsForm.get('commissionCycle')?.setValue(this.loggedInUserPreferences.comissionCycle, { emitEvent: false });
          }
          if (this.loggedInUserPreferences?.comissionPercentageCycle) {
            this.savingsForm.get('commissionPercentageCycle')?.setValue(this.loggedInUserPreferences.comissionPercentageCycle, { emitEvent: false });
          }
          this.onCommissionTypeControlClicked(this.loggedInUserComissionType);
        }

        this.savingsForm.get('commissionCurrency')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('commissionAmount')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('commissionType')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('commissionCycle')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('escalationRate')?.updateValueAndValidity({ emitEvent: false });
      } else {
        this.savingsForm.get('commissionCurrency')?.removeValidators(Validators.required);
        this.savingsForm.get('commissionAmount')?.removeValidators(Validators.required);
        this.savingsForm.get('commissionType')?.removeValidators(Validators.required);
        this.savingsForm.get('commissionCycle')?.removeValidators(Validators.required);
        this.savingsForm.get('escalationRate')?.removeValidators(Validators.required);

        this.savingsForm.get('commissionCurrency')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('commissionAmount')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('commissionType')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('commissionCycle')?.updateValueAndValidity({ emitEvent: false });
        this.savingsForm.get('escalationRate')?.updateValueAndValidity({ emitEvent: false });
      }
      this.savingsForm.updateValueAndValidity();
    }, 0);
  }

  // onSliderChange(value: any) {
  //   if (!isNaN(value)) {
  //     this.savingsForm.get('returnRate')?.setValue(value, { emitEvent: true });
  //   }
  // }

  get isCustomEscalationSelected(): boolean {
    return this.savingsForm.get('escalationRate')?.value === 'Increases at custom rate';
  }


  onEscalationRateChange(event: MatSelectChange): void {
    const description = (event.value as string) ?? null;

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
    const value = parseFormattedNumber(rawValue ?? '', this.translate.currentLang);
    this.savingsForm.get('amount')?.setValue(value, { emitEvent: true });
    this.amount = value;
  }
  formatWithPercentage(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '0%';
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return '0%';
    return `${this.round2(n)}%`;
  }

  private normalizeReturnRate(v: unknown): number {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? this.round2(n) : 3.5;
  }

  private syncReturnRateTextFromForm(): void {
    const raw = this.savingsForm.get('returnRate')?.value;
    const n = typeof raw === 'number' ? raw : Number(raw);
    const val = Number.isFinite(n) ? this.round2(n) : 0;
    this.returnRateText = this.formatReturnRateInputLabel(val);
  }

  private syncSliderReturnRateFromForm(): void {
    const raw = this.savingsForm.get('returnRate')?.value;
    const n = typeof raw === 'number' ? raw : Number(raw);
    this.sliderReturnRate = Number.isFinite(n) ? Math.max(0, Math.min(10, this.round2(n))) : 0;
  }

  /** Human-readable percent for the side input (no % suffix). */
  private formatReturnRateInputLabel(n: number): string {
    if (!Number.isFinite(n)) return '0';
    const r = this.round2(n);
    if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r));
    return String(r);
  }

  /** mat-select may bind year as number or string; both must count for Save guards. */
  private parseCalendarYearFromControl(raw: unknown): number {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) {
        return n;
      }
    }
    return 0;
  }

  /**
   * Save stays off until the form is valid and (for pension fund) a contribution end calendar year is chosen.
   */
  get contributionDurationHint(): string | null {
    return getStartEndDurationLabel(
      this.savingsForm.get('contributionStartDate')?.value,
      this.savingsForm.get('contributionEndDate')?.value,
      this.eventsList,
      this.translate,
    );
  }

  get lockDurationHint(): string | null {
    return getStartEndDurationLabel(
      this.savingsForm.get('start')?.value,
      this.savingsForm.get('end')?.value,
      this.eventsList,
      this.translate,
    );
  }

  get isSaveDisabled(): boolean {
    if (this.isSaving) {
      return true;
    }
    if (this.savingsForm.invalid) {
      return true;
    }
    const potName = this.savingsForm.get('name')?.value;
    if (potName === 'Custom') {
      const cn = (this.savingsForm.get('customName')?.value ?? '')
        .toString()
        .trim();
      if (!cn) {
        return true;
      }
    }
    if (this.fromNetWorth) {
      return false;
    }
    if (potName !== 'Pension fund') {
      return false;
    }
    const raw = this.savingsForm.get('contributionEndDate')?.value;
    return resolveYear(raw, this.eventsList) <= 0;
  }

  saveCashflow(): void {
    if (this.isSaving) {
      return;
    }
    this.savingsForm.markAllAsTouched();
    const selectedEscDesc = this.savingsForm.get('escalationRate')?.value as string;
    const isCustomEscalation = selectedEscDesc === 'Increases at custom rate';
    const selectedEscalationRateValue = isCustomEscalation
      ? this.savingsForm.get('customEscalationRate')?.value
      : this.escalationRates.find((x) => x.description === selectedEscDesc)?.value;
    const picked =
      !isCustomEscalation
        ? this.escalationRates.find((x) => x.description === selectedEscDesc)
        : undefined;
 const rr = this.round2(this.savingsForm.get('returnRate')?.value ?? 0);
  const real = this.savingsForm.get('name')?.value !== 'Cash'
    ? this.round2(rr - this.inflationRate)
    : 0;
    const isPensionFund = this.savingsForm.get('name')?.value === 'Pension fund';
    const isPotLocked = isPensionFund ? true : this.savingsForm.get('lockPot')?.value;
    if (this.isCashTypeSelected) {
      const selectedOwnership =
        (this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint) as SavingPotOwnership;
      if (!this.isOwnershipAvailableForCash(selectedOwnership)) {
        this.savingsForm.get('ownership')?.setErrors({ duplicateCashOwnership: true });
        this.savingsForm.markAllAsTouched();
        return;
      }
    }

    const potName = this.savingsForm.get('name')?.value;
    const isPensionFundPot = potName === 'Pension fund';
    const contribAmt = Number(this.savingsForm.get('contributionAmount')?.value ?? 0);
    const contribEndRaw = this.savingsForm.get('contributionEndDate')?.value;
    const contribEndYear = resolveYear(contribEndRaw, this.eventsList);
    if (
      isPensionFundPot &&
      contribAmt > 0 &&
      contribEndYear <= 0
    ) {
      const endCtrl = this.savingsForm.get('contributionEndDate');
      endCtrl?.setErrors({ ...(endCtrl.errors ?? {}), required: true });
      endCtrl?.markAsTouched();
      return;
    }

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
        inflationRate: this.inflationRate ??  0,
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
            amount: (this.isAddComissionChecked && this.savingsForm.get('commissionAmount')?.value) ? 
            this.savingsForm.get('commissionAmount')?.value : 0,
            currencySymbol:
             ( this.isAddComissionChecked && this.savingsForm.get('commissionCurrency')?.value) ? 
             this.savingsForm.get('commissionCurrency')?.value : '',
            cycle:
              ( this.isAddComissionChecked
                && this.savingsForm.get('commissionCycle')?.value !== null &&
              this.savingsForm.get('commissionCycle')?.value !== '')
                ? this.cycles.find(x => x.id === this.savingsForm.get('commissionCycle')?.value) ??
                this.savingsForm.get('commissionCycle')?.value
                : null,
          },
          percentage: {
            amount:   ( this.isAddComissionChecked
                &&  this.savingsForm.get('commissionPercentage')?.value) ? 
                this.savingsForm.get('commissionPercentage')?.value :  0,
            currencySymbol:
              ( this.isAddComissionChecked
                &&  this.savingsForm.get('commissionPercentageCurrency')?.value) ? 
                this.savingsForm.get('commissionPercentageCurrency')?.value : '',
            cycle:
               ( this.isAddComissionChecked
                && this.savingsForm.get('commissionPercentageCycle')?.value !== null &&
              this.savingsForm.get('commissionPercentageCycle')?.value !== '')
                ? this.cycles.find(x => x.id === this.savingsForm.get('commissionPercentageCycle')?.value) ??
                this.savingsForm.get('commissionPercentageCycle')?.value
                : {
                    id: '',
                    description: '',
                  },
          },
  escalationRate:
  selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
    ? picked ??
      {
        description: isCustomEscalation
          ? 'Increases at custom rate'
          : this.selectedEscalationDescription ?? selectedEscDesc,
        value: selectedEscalationRateValue
      }
    : {
        description: '',
        value: 0
      },
          type: ( this.isAddComissionChecked
                &&  this.savingsForm.get('commissionType')?.value === 'amount')
            ? ComissionType.Amount
            :  ( this.isAddComissionChecked
                && this.savingsForm.get('commissionType')?.value === 'percentage')
            ? ComissionType.Percentage : ComissionType.Both,
        },
        hasCommission: this.savingsForm.get('commissions')?.value,
        orderNumber: this.isEditWorkflow ? this.selectedPot.orderNumber : 0,
        hasPotLocked: isPotLocked,
        iconUrl: this.savingsForm.get('name')?.value !== 'Custom'
          ? this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.iconUrl ?? 'cashflow-moneys-icon'
          : 'custom-option-icon',
        start: {
          age:
            this.forecastStartDateYear != null
              ? getPersistedAgeForCalendarYear(
                  this.data.clientBirthDate,
                  this.forecastStartDateYear,
                  this.data.forecastStartDate,
                  this.data.planDuration,
                  this.dialogEndCalendarYear,
                )
              : 0,
          year:
            this.forecastStartDateYear != null
              ? this.forecastStartDateYear
              : 0,
        },
        lockedFrom: (() => {
          const raw = this.savingsForm.get('start')?.value;
          const yr = isPotLocked && raw != null && raw !== ''
            ? resolveYear(raw, this.eventsList) : 0;
          return {
            age: yr > 0 ? getPersistedAgeForCalendarYear(
              this.data.clientBirthDate, yr,
              this.data.forecastStartDate, this.data.planDuration,
              this.dialogEndCalendarYear) : 0,
            year: yr,
          };
        })(),
        lockedTill: (() => {
          const raw = this.savingsForm.get('end')?.value;
          const yr = isPotLocked && raw != null && raw !== ''
            ? resolveYear(raw, this.eventsList) : 0;
          return {
            age: yr > 0 ? getPersistedAgeForCalendarYear(
              this.data.clientBirthDate, yr,
              this.data.forecastStartDate, this.data.planDuration,
              this.dialogEndCalendarYear) : 0,
            year: yr,
          };
        })(),
        end: {
          age:
            Number.isFinite(this.dialogEndCalendarYear)
              ? getPersistedAgeForCalendarYear(
                  this.data.clientBirthDate,
                  this.dialogEndCalendarYear,
                  this.data.forecastStartDate,
                  this.data.planDuration,
                  this.dialogEndCalendarYear,
                )
              : 0,
          year: Number.isFinite(this.dialogEndCalendarYear)
            ? this.dialogEndCalendarYear
            : 0,
        },
        // returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? this.savingsForm.get('returnRate')?.value : 0,
          returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? rr : 0,
        type:
        this.savingsForm.get('name')?.value === 'Cash' ||
        this.savingsForm.get('customName')?.value === 'Cash'
          ? SavingPotType.Cash
          : this.savingPotValues.find(
              (x) => this.savingsForm.get('name')?.value === x.name
            )?.type ?? SavingPotType.Other,
        // realReturn: this.savingsForm.get('name')?.value !== 'Cash' ?
        //   this.savingsForm.get('returnRate')?.value - this.inflationRate : 0,
        realReturn: real,
        // Pension fund specific fields
        contributionAmount: this.savingsForm.get('name')?.value === 'Pension fund' 
          ? this.savingsForm.get('contributionAmount')?.value 
          : null,
        contributionFrequency: this.savingsForm.get('name')?.value === 'Pension fund'
          ? this.savingsForm.get('contributionFrequency')?.value
          : null,
        contributionStartDate: this.savingsForm.get('name')?.value === 'Pension fund'
          ? (() => {
              const raw = this.savingsForm.get('contributionStartDate')?.value;
              const yr = resolveYear(raw, this.eventsList);
              return {
                year: yr,
                age: yr > 0 ? getPersistedAgeForCalendarYear(
                  this.data.clientBirthDate, yr,
                  this.data.forecastStartDate, this.data.planDuration,
                  this.dialogEndCalendarYear) : 0,
              };
            })()
          : null,
        contributionEndDate: this.savingsForm.get('name')?.value === 'Pension fund'
          ? (() => {
              const raw = this.savingsForm.get('contributionEndDate')?.value;
              const yr = resolveYear(raw, this.eventsList);
              return {
                year: yr,
                age: yr > 0 ? getPersistedAgeForCalendarYear(
                  this.data.clientBirthDate, yr,
                  this.data.forecastStartDate, this.data.planDuration,
                  this.dialogEndCalendarYear) : 0,
              };
            })()
          : null,
        retirementAge: this.savingsForm.get('name')?.value === 'Pension fund'
          ? this.retirementAge
          : null,
        startEventId: extractEventId(this.savingsForm.get('start')?.value),
        endEventId: extractEventId(this.savingsForm.get('end')?.value),
        contributionStartEventId: this.savingsForm.get('name')?.value === 'Pension fund'
          ? extractEventId(this.savingsForm.get('contributionStartDate')?.value)
          : null,
        contributionEndEventId: this.savingsForm.get('name')?.value === 'Pension fund'
          ? extractEventId(this.savingsForm.get('contributionEndDate')?.value)
          : null,
        ownership: this.hasPartner ? (this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint) : SavingPotOwnership.Joint
      };
      if (this.scenarioMode) {
        this.dialogRef.close({
          status: 'Success',
          savingPot: null,
          scenarioItem: clientSaving,
        });
        return;
      }
      this.isSaving = true;
      const function$ = this.savingPotsHttpService.addNewSavingPot(
        this.cashflowId,
        clientSaving,
      );

      function$
        .pipe(
          filter((res) => !!res),
          catchError((err) => {
            console.error(err);
            throw err;
          }),
          finalize(() => {
            this.isSaving = false;
          }),
        )
        .subscribe({
          next: (res) => {
            this.dialogRef.close({
              status: 'Success',
              savingPot: res,
            });
          },
          error: () => {
            // isSaving cleared in finalize
          },
        });
    }
  }

  onCommissionTypeControlClicked(amountType: string) {
    // Use emitEvent: false to avoid infinite loop with valueChanges subscription
    this.savingsForm.get('commissionType')?.setValue(amountType, { emitEvent: false });

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
        ?.setValue(this.cycles[2].id, { emitEvent: false });
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency, { emitEvent: false });
      this.savingsForm
        .get('commissionPercentage')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id, { emitEvent: false });
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1]?.description ?? '', { emitEvent: false });

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionType')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('escalationRate')?.updateValueAndValidity({ emitEvent: false });
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
        ?.setValue(this.clientPreferredCurrency, { emitEvent: false });
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id, { emitEvent: false });
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency, { emitEvent: false });
      this.savingsForm
        .get('commissionPercentage')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.removeValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id, { emitEvent: false });
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1]?.description ?? '', { emitEvent: false });

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionType')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('escalationRate')?.updateValueAndValidity({ emitEvent: false });
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
        ?.setValue(this.clientPreferredCurrency, { emitEvent: false });
      this.savingsForm
        .get('commissionAmount')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.removeValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id, { emitEvent: false });
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency, { emitEvent: false });
      this.savingsForm
        .get('commissionPercentage')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id, { emitEvent: false });
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1]?.description ?? '', { emitEvent: false });

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionType')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity({ emitEvent: false });
      this.savingsForm.get('escalationRate')?.updateValueAndValidity({ emitEvent: false });
      this.updateFormattedValue('commissionPercentage');
    }
    this.savingsForm.updateValueAndValidity();
  }

  blockComma(e: KeyboardEvent) {
  if (e.key === ',') e.preventDefault();
}

      private endOnOrAfterStartValidator(): ValidatorFn {
      return (group: AbstractControl) => {
        const startRaw = group.get('start')?.value;
        const endRaw   = group.get('end')?.value;
        const endCtrl = group.get('end');
        const start = resolveYear(startRaw, this.eventsList);
        const end   = resolveYear(endRaw, this.eventsList);

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

    onReturnRateInput(event: Event) {
  // when typing, ensure the control holds a number (so slider updates smoothly)
  const raw = (event.target as HTMLInputElement).value;
  const num = Number(raw);
  const val = isNaN(num) ? 0 : this.round2(num);
  this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });

}

  onReturnRateTextInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.returnRateText = el.value.replace('%', '').trim();
    const normalized = this.returnRateText.replace(',', '.');
    if (normalized === '' || normalized === '-' || normalized === '.') return;
    if (/^-?\d+\.$/.test(normalized)) return;
    const num = parseFloat(normalized);
    if (Number.isNaN(num)) return;
    this.savingsForm.get('returnRate')?.setValue(this.round2(num), { emitEvent: true });
  }

  

  onReturnRateBlur(): void {
    this.syncReturnRateTextFromForm();
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

getContributionStartYear(): number {
  const val = this.savingsForm.get('contributionStartDate')?.value;
  const resolved = resolveYear(val, this.eventsList);
  if (resolved > 0) {
    return resolved;
  }
  const fallback = Number(this.forecastStartDateYear);
  return Number.isFinite(fallback) ? fallback : 0;
}

getContributionEndEvents(): any[] {
  const startYear = this.getContributionStartYear();
  return (this.eventsList ?? []).filter((e: any) => (e?.start?.year ?? 0) >= startYear);
}

getContributionEndYears(): number[] {
  const startYear = this.getContributionStartYear();
  return (this.years ?? []).filter((y) => y >= startYear);
}

getLockStartYear(): number {
  const val = this.savingsForm.get('start')?.value;
  return typeof val === 'number' && Number.isFinite(val) ? val : this.forecastStartDateYear;
}

getLockEndEvents(): any[] {
  const startYear = this.getLockStartYear();
  return (this.eventsList ?? []).filter((e: any) => (e?.start?.year ?? 0) >= startYear);
}

getLockEndYears(): number[] {
  const startYear = this.getLockStartYear();
  return (this.years ?? []).filter((y) => y >= startYear);
}

  getAgeForYear(year: number): number {
    const ownership =
      this.savingsForm?.get('ownership')?.value ?? SavingPotOwnership.Joint;
    const birth =
      ownership === SavingPotOwnership.Person2 && this.data.partnerBirthDate
        ? this.data.partnerBirthDate
        : this.data.clientBirthDate;
    const a = getProjectionColumnAgeLabel(
      birth,
      Number(year),
      this.data.forecastStartDate,
      this.data.planDuration,
      this.dialogEndCalendarYear,
    );
    return Number.isNaN(a) ? 0 : a;
  }

getCycleLabel(cycle: Cycle): string {
  return getAmountCycleLabel(cycle, this.translate);
}

}

