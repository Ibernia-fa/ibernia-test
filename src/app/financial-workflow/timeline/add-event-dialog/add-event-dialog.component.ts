import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Client } from 'src/app/clients/models/client';
import { ClientEvent, Cycle, EscalationRate, EventIncomeType, FinancialRecordLineItem } from '../models/financial-timeline';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Timeline } from 'vis-timeline';
import { TimelineHttpService } from '../services/timeline-http.service';
import { catchError, EMPTY, filter, finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import moment from 'moment';
import { allCountries } from 'src/app/clients/models/country';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { AutoFocusDirective } from 'src/app/directives/auto-focus.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateEscalationDescriptionPipe } from 'src/app/core/pipes/translate-escalation-description.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MortgageCalculatorState } from '../mortgage-calculator/mortgage-calculator.component';
import { MortgageOutput } from '../mortgage-calculator/mortgage-calculator.component';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { MortgageCalculatorDialogComponent, MortgageCalculatorDialogResult } from '../mortgage-calculator-dialog/mortgage-calculator-dialog.component';
import { LanguageService } from 'src/app/core/language.service';
import { formatAppDisplayNumber } from 'src/app/shared/utils/number-utils';
import { resolveEscalationMatch } from 'src/app/shared/utils/escalation-rate-utils';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';
import {
  getCashflowDialogEndCalendarYear,
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import { calendarYearOrEventRefValidator } from 'src/app/shared/utils/calendar-year-or-event-ref.validator';
import {
  financingMonthlyEndYearNotSelected,
  recurringEndYearNotSelected,
} from 'src/app/shared/utils/recurring-end-save-guard';
import { getStartEndDurationLabel } from 'src/app/shared/utils/start-end-duration-label';
import { extractEventId, resolveYear } from 'src/app/shared/utils/event-date-utils';
import { capitalizeFirstLetter } from 'src/app/shared/utils/capitalize-first-letter';

@Component({
  selector: 'app-add-event-dialog',
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
    ReactiveFormsModule,
    MatTooltipModule,
    CommonModule,
    ThousandSeparatorInputDirective,
    AutoFocusDirective,
    TranslateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    TranslateEscalationDescriptionPipe,
  ],
  providers: [provideNativeDateAdapter(),
    AgeCalculatorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-event-dialog.component.html',
  styleUrl: './add-event-dialog.component.scss'
})
export class AddEventDialogComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('monthlyPayment') monthlyPayment?: ElementRef<HTMLInputElement>;
  @ViewChild('resalePrice') resalePrice?: ElementRef<HTMLInputElement>;
  private readonly AUTO_RENAME_EVENTS = [
    'Wedding',
    'Travel',
    'Education',
    'New business',
    'Home',
    'Car',
    'Boat'
  ];

  private readonly FINANCING_EVENTS = [
    'Home',
    'Car',
    'Boat'
  ];

  isIncomeEvent = true;
  escalationRates: EscalationRate[];
  selectedEventType: string = EventType.CUSTOM;
  eventType = EventType;
  customEventsLibrary: ClientEvent[];
  eventForm: FormGroup;
  timelineId: string;
  cashflowId: string;
  dropTime: Date;
  clientBirthDate: Date;
  clientBirthYear: number;
  clientAge: number;
  years: number[] = []
  eventsList: any;
  selectedEventName: string;
  selectedEventIconUrl: string;
  isEditWorkflow: boolean = false;
  patchEvent: ClientEvent | undefined | null;
  countries = allCountries;
  clientPreferredCurrency: string;
  selectedEscalationDescription: string | null;
  amountCycles: Cycle[];
  saveClicked: boolean = false;
  currentYear: number = new Date().getFullYear();
  showNameEdit: boolean = false;
  /** Resolved async so the raw i18n key is never shown before translations load. */
  customGoalNamePlaceholderText = '';
  isAllowRename: boolean = false;
  hideEventType = false;
  isInheritanceOneOff = false;
  isCashEvent = false;
  financialRecords: FinancialRecordLineItem[] = [];
  clientCountryCode: string = '';
  showMortgageCalculator = false;
  showMortgageCalculatorCustom = false;
  /** Custom event: Cash vs Financing (mirrors financing events). */
  isCustomCashEvent = true;
  lastCalculatorState: MortgageCalculatorState | null = null;
  scenarioMode: boolean = false;
  /** Inclusive last calendar year in year dropdowns — for terminal age labels (90 in plan end year). */
  dialogEndCalendarYear = 0;

  get isHomeEvent(): boolean {
    return this.patchEvent?.name?.startsWith('Home') ?? false;
  }

  /** Home, Car, Boat financing: show mortgage/loan calculator when paying with financing. */
  get showFinancingMortgageCalculator(): boolean {
    const name = this.patchEvent?.name ?? '';
    return (
      this.selectedEventType === EventType.FINANCING &&
      !this.isCashEvent &&
      (name.startsWith('Home') || name.startsWith('Car') || name.startsWith('Boat'))
    );
  }

  private get prefsMortgageInterestRate(): number {
    return this.settings.currentUserData?.preferences?.mortgageInterestRate ?? 3.5;
  }

  private get prefsLoanInterestRate(): number {
    return this.settings.currentUserData?.preferences?.loanInterestRate ?? 8;
  }

  /** Interest default for financing calculator: mortgage rate for Home; loan rate for Car and Boat. */
  get financingCalculatorAdvisorRate(): number {
    if (this.patchEvent?.name?.startsWith('Home')) return this.prefsMortgageInterestRate;
    return this.prefsLoanInterestRate;
  }

  get customCalculatorAdvisorRate(): number {
    return this.prefsLoanInterestRate;
  }

  /** Home → mortgage UI; Car/Boat → loan UI. */
  get financingCalculatorKind(): 'mortgage' | 'loan' {
    return this.patchEvent?.name?.startsWith('Home') ? 'mortgage' : 'loan';
  }

  get financingCalculatorToggleLabelKey(): string {
    return this.financingCalculatorKind === 'mortgage'
      ? 'Use mortgage calculator'
      : 'Use loan calculator';
  }

  get financingCalculatorTitle(): string {
    return this.financingCalculatorKind === 'mortgage'
      ? 'Mortgage calculator'
      : 'Loan calculator';
  }

  get financingCalculatorPriceLabel(): string {
    const name = this.patchEvent?.name ?? '';
    if (name.startsWith('Home')) return 'Property price';
    if (name.startsWith('Car')) return 'Car price';
    if (name.startsWith('Boat')) return 'Boat price';
    return 'Price';
  }

  /** Default loan term for financing calculator when there is no saved calculator state yet. */
  get financingCalculatorDefaultLoanTermYears(): number {
    const name = this.patchEvent?.name ?? '';
    if (name.startsWith('Home')) return 25;
    if (name.startsWith('Car')) return 5;
    if (name.startsWith('Boat')) return 10;
    return 5;
  }

  get customCalculatorToggleLabelKey(): string {
    return 'Use loan calculator';
  }

  constructor(
    private dialogRef: MatDialogRef<AddEventDialogComponent>,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private timelineHttpService: TimelineHttpService,
    private cdr: ChangeDetectorRef,
    private settings: SettingsService,
    private language: LanguageService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.settings.profileChanged$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
    this.amountCycles = data.amountCycles;
    this.selectedEventType = data.eventType;
    this.scenarioMode = data.scenarioMode ?? false;
    this.clientCountryCode = this.resolveCountryCode(data.clientCountryCode ?? '');

    // Force Financing category based on event name
    if (
      this.selectedEventType === EventType.SYSTEM &&
      this.data?.patchEvent &&
      this.FINANCING_EVENTS.includes(this.data.patchEvent.name)
    ) {
      this.selectedEventType = EventType.FINANCING;
    }

    this.isIncomeEvent = data.isIncomeEvent;
    this.escalationRates = data.escalataionRates;
    this.customEventsLibrary = data.customEvents;
    this.timelineId = data.timelineId;
    this.cashflowId = data.cashflowId;
    this.dropTime = data.dropTime;
    this.clientBirthDate = data.clientBirthDate;
    this.clientBirthYear = moment(this.clientBirthDate).year();
    const birthDate = new Date(this.clientBirthDate);
    const forecastStart = data.forecastStartDate
      ? new Date(data.forecastStartDate)
      : new Date(data.forecastStartDateYear, 0, 1);
    this.clientAge = getCompletedYearsAgeAtDate(birthDate, forecastStart);

    this.eventsList = data.eventsList;
    this.eventsList?.sort((a: any, b: any) => (a.year ?? 0) - (b.year ?? 0));
    this.isEditWorkflow = data.isEditWorkflow;
    this.patchEvent = data.patchEvent
    this.clientPreferredCurrency = data.clientPreferredCurrency


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
    var iterations = endYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    if (this.selectedEventType == EventType.SYSTEM
      || this.selectedEventType == EventType.FINANCING) {

      // add new case
      if (!this.isEditWorkflow) {
        const existingEvent = this.data.eventsList
          ?.filter((e: any) =>
            e.name === this.data.patchEvent.name || e.name.startsWith(`${this.data.patchEvent.name} `)
          ) ?? [];

        const isAutoRenameRequired = existingEvent.length > 0;

        if (!this.AUTO_RENAME_EVENTS.includes(this.data.patchEvent.name) || isAutoRenameRequired) {
          this.isAllowRename = true;
        }
      }
      else { // update case
        if (!this.AUTO_RENAME_EVENTS.includes(this.data.patchEvent.name)) {
          this.isAllowRename = true;
        }
      }

      // not changeable event type (income/expense)
      if (
        this.data.patchEvent.name.startsWith("Inheritance") ||
        this.data.patchEvent.name.startsWith("Wedding") ||
        this.data.patchEvent.name.startsWith("Travel") ||
        this.data.patchEvent.name.startsWith("Education") ||
        this.data.patchEvent.name.startsWith("New business")
      ) {
        this.hideEventType = true;

        // inheritance is default one-off. 
        // diable cycle on one-off
        // Date is Default at 65 years of age. If the user is older than 65, no default date.
        if (this.data.patchEvent.name.startsWith("Inheritance")) {
          this.isInheritanceOneOff = true;
        }
      }
      else {
        this.hideEventType = false;
      }
    }

    this.initForm();

    this.eventForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());

    if (this.selectedEventType === EventType.FINANCING) {
      this.isIncomeEvent = false; // financing is always expense
      this.isCashEvent = this.isEditWorkflow ? this.patchEvent?.isCash ?? true : this.data.isCashEvent;
      this.eventForm.get('escalationRate')?.disable();
      this.eventForm.get('end')?.clearValidators();
      this.eventForm.get('end')?.updateValueAndValidity({ emitEvent: false });
      this.eventForm.get('cycle')?.setValue('One-off', { emitEvent: false });
      this.eventForm.get('cycle')?.disable();
    } else if (this.selectedEventType === EventType.CUSTOM) {
      this.isIncomeEvent = false; // custom events are always expenses
    }

    if (!this.isEditWorkflow) {
      const updatedName = this.getNextEventName(this.eventForm.get('name')?.value);
      this.eventForm.get('name')?.setValue(updatedName, { emitEvent: false });
    }

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => {
      this.refreshCustomGoalNamePlaceholder();
    });
    this.refreshCustomGoalNamePlaceholder();
  }

  private refreshCustomGoalNamePlaceholder(): void {
    const key = 'ADD_EVENT.CUSTOM_GOAL_NAME_PLACEHOLDER';
    if (this.isEditWorkflow) {
      this.customGoalNamePlaceholderText = '';
      this.cdr.markForCheck();
      return;
    }
    this.translate.get(key).subscribe((text) => {
      // Avoid showing the key if the bundle is stale or the string is not loaded yet
      this.customGoalNamePlaceholderText = text === key ? '' : text;
      this.cdr.markForCheck();
    });
  }

  doAction(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onIncomeControlClicked(value: boolean) {
    this.isIncomeEvent = value;
  }

  initForm() {
    let defaultCycle = 'One-off';

    // make travel one off (there could be multiple travel events with rename functionality,
    //  consider while changing iconUrl until there is some proper solution to this)
    const isTravelEvent = this.selectedEventType == EventType.SYSTEM
      && (this.patchEvent?.name.startsWith("Travel") ||
        this.patchEvent?.iconUrl == "travel-icon");
    if (isTravelEvent) {
      defaultCycle = 'Every year';
    }

    // Prefill Travel end year to 5 years before the plan ends (only on creation,
    // never on edit, so we don't overwrite a value the user has already chosen).
    const defaultSystemEnd: number | null = isTravelEvent && !this.isEditWorkflow
      ? this.computeDefaultTravelEndYear(moment(this.dropTime).year())
      : null;

    switch (this.selectedEventType) {
      case EventType.SYSTEM:
        this.eventForm = this.fb.group({
          name: [this.patchEvent?.name],
          isIncomeEvent: [false, Validators.required],
          currency: [this.clientPreferredCurrency, Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: [defaultCycle, [Validators.required]],
          ageDate: [moment(this.dropTime).year(), Validators.required],
          start: [moment(this.dropTime).year(), Validators.required],
          end: [defaultSystemEnd as number | string | null],
          escalationRate: [this.escalationRates[0]?.description ?? '', Validators.required],
          customEscalationRate: ['']
        });
        break;

      case EventType.FINANCING:
        this.isCashEvent = true;
        this.eventForm = this.fb.group({
          name: [this.patchEvent?.name],
          isIncomeEvent: [false],
          currency: [this.clientPreferredCurrency, Validators.required],
          paymentType: ['Cash', Validators.required],
          amount: [null],
          downPayment: [0],
          monthlyPayment: [0, Validators.min(0)],
          monthlyStart: [moment(this.dropTime).year()],
          monthlyEnd: [null],
          start: [moment(this.dropTime).year(), Validators.required],
          end: [null],
          hasResale: [false],
          resaleDate: [null],
          resalePrice: [0],
          cycle: ['One-off'],
          escalationRate: [0],
          customEscalationRate: ['']
        });

        this.hideEventType = true;

        this.applyFinancingValidators('Cash');

        // React to paymentType changes
        this.eventForm.get('paymentType')!
          .valueChanges
          .subscribe(type => this.applyFinancingValidators(type));

        this.setupFinancingSubscriptions();

        break;

      case EventType.CUSTOM:
        this.eventForm = this.fb.group({
          name: ['', Validators.required],
          isIncomeEvent: [false, Validators.required],
          currency: [this.clientPreferredCurrency, Validators.required],
          paymentType: ['Cash', Validators.required],
          amount: [null],
          downPayment: [0],
          monthlyPayment: [0, Validators.min(0)],
          monthlyStart: [moment(this.dropTime).year()],
          monthlyEnd: [null as number | string | null],
          cycle: ['One-off', [Validators.required]],
          start: [null, Validators.required],
          end: [null as number | string | null],
          escalationRate: [this.escalationRates[0]?.description ?? ''],
          customEscalationRate: [''],
        });
        this.isCustomCashEvent = true;
        this.applyCustomPaymentValidators('Cash');
        break;
    }

    if (this.isInheritanceOneOff) { // remove extra validation
      this.eventForm.get('start')?.clearValidators();
      this.eventForm.get('end')?.clearValidators();
      this.eventForm.get('escalationRate')?.clearValidators();

      this.eventForm.get('cycle')?.disable({ emitEvent: false });
    } else { // add back validations
      this.eventForm.get('start')?.setValidators(Validators.required);
      this.eventForm.get('cycle')?.enable({ emitEvent: false });

      // Only require end and escalationRate for recurrent (non-one-off) events
      const currentCycle = this.eventForm.get('cycle')?.value;
      if (currentCycle && currentCycle !== 'One-off') {
        this.eventForm.get('end')?.setValidators([calendarYearOrEventRefValidator()]);
        this.eventForm.get('escalationRate')?.setValidators(Validators.required);
      } else {
        this.eventForm.get('end')?.clearValidators();
        this.eventForm.get('escalationRate')?.clearValidators();
      }
    }

    this.eventForm.get('start')?.updateValueAndValidity({ emitEvent: false });
    this.eventForm.get('end')?.updateValueAndValidity({ emitEvent: false });
    this.eventForm.get('escalationRate')?.updateValueAndValidity({ emitEvent: false });

    this.eventForm.get('currency')?.disable();
    this.eventForm.setValidators(this.endOnOrAfterStartValidator());
    this.eventForm.updateValueAndValidity({ emitEvent: false });

    if (this.isEditWorkflow) {
      if (this.selectedEventType === EventType.FINANCING) {
        this.patchFinancingForm();
      } else {
        this.patchForm();
        const patchedCycle = this.eventForm.get('cycle')?.value;
        if (patchedCycle) {
          if (this.selectedEventType === EventType.CUSTOM) {
            if (this.eventForm.get('paymentType')?.value === 'Cash') {
              this.onCycleValueChange(patchedCycle);
            }
          } else {
            this.onCycleValueChange(patchedCycle);
          }
        }
      }
    }
  }

  patchForm() {
    switch (this.selectedEventType) {
      case EventType.SYSTEM:
        this.eventForm.controls['isIncomeEvent'].patchValue(this.patchEvent?.type === EventIncomeType.Income);
        this.eventForm.controls['currency'].patchValue(this.patchEvent?.netAmount.currencySymbol);
        this.eventForm.controls['amount'].patchValue(this.patchEvent?.netAmount.amount);
        this.eventForm.controls['cycle'].patchValue(this.patchEvent?.netAmount.cycle?.description);
        this.eventForm.controls['ageDate'].patchValue(this.patchEvent?.start.year);
        this.eventForm.controls['start'].patchValue(this.patchEvent?.start.year);
        this.eventForm.controls['end'].patchValue(
          this.patchEvent?.endEventId
            ? 'event:' + this.patchEvent.endEventId
            : this.patchEvent?.end?.year ?? null,
        );
        this.eventForm.controls['escalationRate'].patchValue(this.patchEvent?.escalationRate?.description);
        this.handleEscalationRatePatch(this.patchEvent?.escalationRate?.description, this.patchEvent?.escalationRate?.value);
        break;

      case EventType.CUSTOM:
        this.financialRecords = this.data.financialRecords ?? [];
        this.selectedEventIconUrl = this.patchEvent?.iconUrl ?? '';
        const monthlyRec = this.financialRecords?.find((x) =>
          x.description?.includes('Monthly payment')
        );
        const isCustomFinancing =
          !!monthlyRec || this.patchEvent?.isFinance === true;
        this.isCustomCashEvent = !isCustomFinancing;

        this.eventForm.controls['name'].patchValue(this.patchEvent?.name);
        this.eventForm.controls['isIncomeEvent'].patchValue(false);
        this.eventForm.controls['currency'].patchValue(
          this.patchEvent?.netAmount.currencySymbol
        );
        this.eventForm.controls['paymentType'].patchValue(
          isCustomFinancing ? 'Financing' : 'Cash'
        );
        this.eventForm.controls['amount'].patchValue(
          this.patchEvent?.netAmount.amount
        );
        this.eventForm.controls['start'].patchValue(this.patchEvent?.start.year);
        this.eventForm.controls['monthlyPayment'].patchValue(
          monthlyRec?.amount?.amount ?? 0
        );
        this.eventForm.controls['monthlyStart'].patchValue(
          monthlyRec?.start?.year ?? null
        );
        this.eventForm.controls['monthlyEnd'].patchValue(
          monthlyRec?.endEventId
            ? 'event:' + monthlyRec.endEventId
            : monthlyRec?.end?.year ?? null
        );
        this.eventForm.controls['cycle'].patchValue(
          this.patchEvent?.netAmount.cycle?.description
        );
        this.eventForm.controls['end'].patchValue(
          this.patchEvent?.endEventId
            ? 'event:' + this.patchEvent.endEventId
            : this.patchEvent?.end?.year ?? null,
        );
        this.applyCustomPaymentValidators(
          isCustomFinancing ? 'Financing' : 'Cash'
        );
        if (
          !isCustomFinancing &&
          this.patchEvent?.netAmount?.cycle?.description &&
          this.patchEvent.netAmount.cycle.description !== 'One-off'
        ) {
          this.handleEscalationRatePatch(
            this.patchEvent?.escalationRate?.description,
            this.patchEvent?.escalationRate?.value
          );
        }

        setTimeout(() => {
          const el = this.amountInput?.nativeElement;
          const amount = this.eventForm.get('amount')?.value;
          if (!el || amount === null || amount === undefined || amount === '')
            return;
          el.value = Number(amount).toLocaleString('en-US');
          el.dispatchEvent(new Event('blur'));
        });
        setTimeout(() => {
          const elM = this.monthlyPayment?.nativeElement;
          const mp = this.eventForm.get('monthlyPayment')?.value;
          if (!elM || mp === null || mp === undefined || mp === '') return;
          elM.value = Number(mp).toLocaleString('en-US');
          elM.dispatchEvent(new Event('blur'));
        });

        break;
    }

    const cycleDescription = this.patchEvent?.netAmount?.cycle?.description;

    if (cycleDescription === 'One-off') {
      this.eventForm.get('cycle')?.disable();
    }

    // Ensure the patched amount displays with thousand separators immediately
    setTimeout(() => {
      const el = this.amountInput?.nativeElement;
      const amount = this.eventForm.get('amount')?.value;
      if (!el || amount === null || amount === undefined || amount === '') return;
      el.value = Number(amount).toLocaleString('en-US');
      el.dispatchEvent(new Event('blur'));
    });
  }

  private handleEscalationRatePatch(description: string | any, value: number | any) {
    if (description === 'Increases at custom rate') {
      this.escalationRates = this.escalationRates.filter(
        (x) => x.description !== 'Increases at custom rate'
      );

      // Add the current custom rate to the dropdown
      this.escalationRates.push({
        description: 'Increases at custom rate',
        value: value
      });
      this.eventForm.controls['escalationRate'].patchValue('Increases at custom rate');
      this.selectedEscalationDescription = 'Increases at custom rate';

      // Configure the custom field
      const customControl = this.eventForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.setValue(value);
      customControl?.updateValueAndValidity();
    } else {
      let descToSet = description as string;
      if (
        typeof descToSet === 'string' &&
        !this.escalationRates.some((x) => x.description === descToSet)
      ) {
        const m = resolveEscalationMatch(this.escalationRates, {
          value,
          description,
        });
        if (m) descToSet = m.description;
      }
      this.eventForm.controls['escalationRate'].patchValue(descToSet);
      this.selectedEscalationDescription = descToSet;

      const customControl = this.eventForm.get('customEscalationRate');
      customControl?.clearValidators();
      customControl?.setValue(null);
      customControl?.updateValueAndValidity();
    }
  }

  onCycleValueChange(event: string) {
    if (event === 'One-off') {
      this.eventForm.controls['end'].clearValidators();
      this.eventForm.controls['end'].updateValueAndValidity();
      this.eventForm.controls['escalationRate'].clearValidators();
      this.eventForm.controls['escalationRate'].updateValueAndValidity();
      this.eventForm.controls['customEscalationRate'].clearValidators();
      this.eventForm.controls['customEscalationRate'].updateValueAndValidity();
    }
    else {
      this.eventForm.controls['end'].setValidators([calendarYearOrEventRefValidator()]);
      this.eventForm.controls['end'].updateValueAndValidity();
      this.eventForm.controls['escalationRate'].setValidators(Validators.required);
      this.eventForm.controls['escalationRate'].updateValueAndValidity();

      const currentValue = this.eventForm.get('escalationRate')?.value;
      if (currentValue === null || currentValue === '' || currentValue === undefined) {
        this.eventForm.get('escalationRate')?.setValue(this.escalationRates[0]?.description ?? '');
      }
    }
    this.eventForm.updateValueAndValidity();
  }

  onEventNameValueChange(event: any) {
    this.selectedEventName = event;

    if (event === EventType.CUSTOM) {
      this.eventForm.addControl('name', new FormControl('', [Validators.required]));
      this.eventForm.updateValueAndValidity();
      this.selectedEventIconUrl = 'custom-icon';
      this.isIncomeEvent = false; // custom events are always expenses
    } else {
      this.eventForm.removeControl('name');
      this.eventForm.updateValueAndValidity();

      const cusEvent = this.customEventsLibrary.find(
        (customEvent) => customEvent.name === event
      );
      this.selectedEventIconUrl = cusEvent?.iconUrl ?? '';
      this.isIncomeEvent = false; // custom events are always expenses
    }
  }

  onSystemEventSubmit() {
    this.eventForm.markAllAsTouched();

    if (
      this.selectedEventType !== EventType.SYSTEM ||
      !this.patchEvent
    ) {
      return;
    }
    if (this.isSystemEventSaveButtonDisabled) {
      return;
    }
    if (!this.eventForm.valid) {
      return;
    }

    this.saveClicked = true;
    this.cdr.markForCheck();

      // inheritance
      let escalataionRatesToSubmit = null;

      // non inheritance 
      if (!this.isInheritanceOneOff) {
        const selectedEscDesc = this.eventForm.get('escalationRate')?.value as string;
        const isCustomEscalation = selectedEscDesc === 'Increases at custom rate';
        const selectedEscalationRateValue = isCustomEscalation
          ? this.eventForm.get('customEscalationRate')?.value
          : this.escalationRates.find((x) => x.description === selectedEscDesc)?.value;
        const picked =
          !isCustomEscalation
            ? this.escalationRates.find((x) => x.description === selectedEscDesc)
            : undefined;

        escalataionRatesToSubmit =
          selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
            ? picked ?? {
              value: selectedEscalationRateValue,
              description: isCustomEscalation
                ? 'Increases at custom rate'
                : selectedEscDesc,
            }
            : {
              value: 0,
              description: ''
            }
      }

      let finalName = this.patchEvent.name;

      // auto rename
      if (!this.isEditWorkflow && this.AUTO_RENAME_EVENTS.includes(finalName)) {
        finalName = this.getNextEventName(finalName);
      }

      if (this.eventForm.get('name')?.value !== this.patchEvent?.name
        && this.eventForm.get('name')?.value !== finalName) {
        finalName = this.eventForm.get('name')?.value;
      }

      if (!this.isEditWorkflow) {
        finalName = capitalizeFirstLetter(finalName);
      }

      const { end: recurringEnd, endEventId } =
        this.buildRecurringEndFromEndControl();

      const clientEvent: ClientEvent = {
        id: this.isEditWorkflow ? this.patchEvent?.id ?? "" : "",
        name: finalName,
        netAmount: {
          cycle: {
            id: this.amountCycles.find(
              (x) => x.description === this.eventForm.get('cycle')?.value
            )?.id ?? '',
            description: this.eventForm.get('cycle')?.value,
          },
          amount: this.eventForm.get('amount')?.value,
          currencySymbol: this.eventForm.get('currency')?.value,
        },
        start: {
          year: this.isInheritanceOneOff ? this.eventForm.get('ageDate')?.value  // for inheritance one-off event
            : this.eventForm.get('start')?.value,
          age: this.isInheritanceOneOff
            ? getPersistedAgeForCalendarYear(
                this.data.clientBirthDate,
                this.eventForm.get('ageDate')?.value,
                this.data.forecastStartDate,
                this.data.planDuration,
                this.dialogEndCalendarYear,
              )
            : getPersistedAgeForCalendarYear(
                this.data.clientBirthDate,
                this.eventForm.get('start')?.value,
                this.data.forecastStartDate,
                this.data.planDuration,
                this.dialogEndCalendarYear,
              ),
        },
        end: recurringEnd,
        endEventId,
        escalationRate: escalataionRatesToSubmit,
        type: this.isIncomeEvent ? EventIncomeType.Income : EventIncomeType.Expense,
        iconUrl: this.patchEvent.iconUrl,
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-off',
        isPlaceHolder: false,
        isCash: false,
        isFinance: false,
        isParent: false
      };

      if (this.scenarioMode) {
        this.saveClicked = false;
        this.dialogRef.close({ status: 'Success', scenarioItem: clientEvent });
        return;
      }

      this.timelineHttpService
        .addEvent(clientEvent, this.cashflowId)
        .pipe(
          filter((res) => !!res),
          catchError((err) => {
            console.error(err);
            return EMPTY;
          }),
          finalize(() => {
            this.saveClicked = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe(() => {
          this.dialogRef.close({
            status: 'Success',
          });
        });
  }

  onCustomEventSubmit() {
    this.eventForm.markAllAsTouched();

    if (!this.eventForm.valid) {
      return;
    }
    if (this.isCustomEventSaveButtonDisabled) {
      return;
    }

    const paymentType = this.eventForm.get('paymentType')?.value as
      | 'Cash'
      | 'Financing';
    if (paymentType === 'Financing') {
      this.submitCustomFinancingPurchase();
      return;
    }

    this.saveClicked = true;
    this.cdr.markForCheck();

    const selectedEscDesc = this.eventForm.get('escalationRate')?.value as string;
    const isCustomEscalation = selectedEscDesc === 'Increases at custom rate';
    const selectedEscalationRateValue = isCustomEscalation
      ? this.eventForm.get('customEscalationRate')?.value
      : this.escalationRates.find((x) => x.description === selectedEscDesc)?.value;
    const picked =
      !isCustomEscalation
        ? this.escalationRates.find((x) => x.description === selectedEscDesc)
        : undefined;

    const { end: customRecurringEnd, endEventId: customEndEventId } =
      this.buildRecurringEndFromEndControl();

    const customName = this.isEditWorkflow
      ? this.eventForm.get('name')?.value
      : capitalizeFirstLetter(this.eventForm.get('name')?.value);

    const clientEvent: ClientEvent = {
      id: this.isEditWorkflow ? this.patchEvent?.id ?? '' : '',
      name: customName,
      netAmount: {
        cycle: {
          id:
            this.amountCycles.find(
              (x) => x.description === this.eventForm.get('cycle')?.value
            )?.id ?? '',
          description: this.eventForm.get('cycle')?.value,
        },
        amount: this.eventForm.get('amount')?.value,
        currencySymbol: this.eventForm.get('currency')?.value,
      },
      start: {
        year: this.eventForm.get('start')?.value,
        age: getPersistedAgeForCalendarYear(
          this.data.clientBirthDate,
          this.eventForm.get('start')?.value,
          this.data.forecastStartDate,
          this.data.planDuration,
          this.dialogEndCalendarYear,
        ),
      },
      end: customRecurringEnd,
      endEventId: customEndEventId,
      escalationRate:
        selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
          ? picked ?? {
              value: selectedEscalationRateValue,
              description: isCustomEscalation
                ? 'Increases at custom rate'
                : selectedEscDesc,
            }
          : {
              value: 0,
              description: '',
            },
      type: EventIncomeType.Expense,
      iconUrl: 'custom-icon',
      isDefault: false,
      isOneOff: this.eventForm.get('cycle')?.value === 'One-off',
      isPlaceHolder: false,
      isCash: true,
      isFinance: false,
      isParent: false,
    };

    if (this.scenarioMode) {
      this.saveClicked = false;
      this.dialogRef.close({ status: 'Success', scenarioItem: clientEvent });
      return;
    }

    this.timelineHttpService
      .addEvent(clientEvent, this.cashflowId)
      .pipe(
        filter((res) => !!res),
        catchError((err) => {
          this.saveClicked = false;
          console.error(err);
          throw err;
        })
      )
      .subscribe(() => {
        this.saveClicked = false;
        this.dialogRef.close({
          status: 'Success',
        });
      });
  }

  private submitCustomFinancingPurchase(): void {
    this.eventForm.markAllAsTouched();
    if (!this.eventForm.valid) {
      return;
    }
    if (this.isFinancingEventSaveButtonDisabled) {
      return;
    }

    this.saveClicked = true;
    this.cdr.markForCheck();
    const flags = { isCash: false, isFinance: true };
    const events: ClientEvent[] = [];
    events.push(
      this.buildOneOffExpense(
        this.eventForm.get('amount')?.value,
        this.eventForm.get('start')?.value,
        flags
      )
    );
    events.push(
      this.buildMonthlyExpense(
        this.eventForm.get('monthlyPayment')?.value,
        this.eventForm.get('monthlyStart')?.value,
        this.eventForm.get('monthlyEnd')?.value,
        flags
      )
    );

    if (this.scenarioMode) {
      this.saveClicked = false;
      this.dialogRef.close({ status: 'Success', scenarioItem: events });
      return;
    }

    this.timelineHttpService
      .addFinancingEvents(events, this.cashflowId)
      .pipe(
        filter((res) => !!res),
        catchError((err) => {
          console.error(err);
          return EMPTY;
        }),
        finalize(() => {
          this.saveClicked = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(() => {
        this.dialogRef.close({ status: 'Success' });
      });
  }

  cycles: string[] = ['One-off', 'Every month', 'Every year'];
  currencySymbols: string[] = ['$', '£', '€'];

  get startEndDurationHint(): string | null {
    if (this.eventForm.get('cycle')?.value === 'One-off') return null;
    return getStartEndDurationLabel(
      this.eventForm.get('start')?.value,
      this.eventForm.get('end')?.value,
      this.eventsList,
      this.translate,
    );
  }

  get monthlyStartEndDurationHint(): string | null {
    return getStartEndDurationLabel(
      this.eventForm.get('monthlyStart')?.value,
      this.eventForm.get('monthlyEnd')?.value,
      this.eventsList,
      this.translate,
    );
  }

  events: string[] = ['$', '£', '€'];

  get isCustomEscalationSelected(): boolean {
    return this.eventForm.get('escalationRate')?.value === 'Increases at custom rate';
  }

  onEscalationRateChange(event: MatSelectChange): void {
    const description = (event.value as string) ?? null;

    this.selectedEscalationDescription = description;

    const customControl = this.eventForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }

    customControl?.updateValueAndValidity();
  }

  /** System timeline event: recurring (e.g. monthly/yearly) requires end year or event. */
  get isSystemEventSaveButtonDisabled(): boolean {
    if (this.eventForm.invalid) {
      return true;
    }
    if (this.isInheritanceOneOff) {
      return false;
    }
    const cycle = this.eventForm.get('cycle')?.value as string | undefined;
    return recurringEndYearNotSelected(
      cycle,
      this.eventForm.get('end')?.value,
      this.eventsList,
    );
  }

  /** Financing (Home/Car/Boat): loan schedule requires monthly payment end year. */
  get isFinancingEventSaveButtonDisabled(): boolean {
    if (this.eventForm.invalid) {
      return true;
    }
    if (this.eventForm.get('paymentType')?.value === 'Financing') {
      return financingMonthlyEndYearNotSelected(
        this.eventForm.get('monthlyEnd')?.value,
        this.eventsList,
      );
    }
    return false;
  }

  /** Custom goal: recurring cash expense uses end; financing uses monthly end. */
  get isCustomEventSaveButtonDisabled(): boolean {
    if (this.eventForm.invalid) {
      return true;
    }
    if (this.eventForm.get('paymentType')?.value === 'Financing') {
      return financingMonthlyEndYearNotSelected(
        this.eventForm.get('monthlyEnd')?.value,
        this.eventsList,
      );
    }
    const cycle = this.eventForm.get('cycle')?.value as string | undefined;
    return recurringEndYearNotSelected(
      cycle,
      this.eventForm.get('end')?.value,
      this.eventsList,
    );
  }

  private buildRecurringEndFromEndControl(): {
    end: { year: number; age: number } | null;
    endEventId: string | null;
  } {
    const cycle = this.eventForm.get('cycle')?.value;
    if (cycle === 'One-off') {
      return { end: null, endEventId: null };
    }
    const endRaw = this.eventForm.get('end')?.value;
    const endYearResolved = resolveYear(endRaw, this.eventsList);
    const endEventId = extractEventId(endRaw);
    return {
      end: {
        year: endYearResolved,
        age: getPersistedAgeForCalendarYear(
          this.data.clientBirthDate,
          endYearResolved,
          this.data.forecastStartDate,
          this.data.planDuration,
          this.dialogEndCalendarYear,
        ),
      },
      endEventId: endEventId ?? null,
    };
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const cycle = group.get('cycle')?.value as string | null;
      const start = group.get('start')?.value as number | null;
      const endRaw = group.get('end')?.value as number | string | null;
      const end = resolveYear(endRaw, this.eventsList);
      const endCtrl = group.get('end');

      if (!endCtrl) return null;

      const existing = endCtrl.errors ?? null;

      // validate only when cycle is not One-off and both years are positive
      const shouldValidate =
        !!cycle && cycle !== 'One-off' &&
        start != null && endRaw != null && endRaw !== '' &&
        Number(start) > 0 && end > 0;

      if (shouldValidate && end < Number(start)) {
        endCtrl.setErrors({ ...(existing ?? {}), endBeforeStart: true });
      } else if (existing && 'endBeforeStart' in existing) {
        const { endBeforeStart, ...rest } = existing;
        endCtrl.setErrors(Object.keys(rest).length ? rest : null);
      }

      return null;
    };
  }

  private endOnOrAfterStartMonthlyValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('monthlyStart')?.value as number | null;
      const endRaw = group.get('monthlyEnd')?.value;
      const end = resolveYear(endRaw, this.eventsList);
      const endCtrl = group.get('monthlyEnd');

      if (!endCtrl) return null;

      const existing = endCtrl.errors ?? null;

      const shouldValidate =
        start != null &&
        endRaw != null &&
        endRaw !== '' &&
        Number(start) > 0 &&
        end > 0;

      if (shouldValidate && end < Number(start)) {
        endCtrl.setErrors({ ...(existing ?? {}), endBeforeStart: true });
      } else if (existing && 'endBeforeStart' in existing) {
        const { endBeforeStart, ...rest } = existing;
        endCtrl.setErrors(Object.keys(rest).length ? rest : null);
      }

      return null;
    };
  }

  toggleNameEdit() {
    this.showNameEdit = !this.showNameEdit;
  }

  private resolveCountryCode(countryNameOrCode: string): string {
    if (!countryNameOrCode) return '';
    if (countryNameOrCode.length === 2) return countryNameOrCode.toUpperCase();
    const match = allCountries.find(
      c => c.countryName.toLowerCase() === countryNameOrCode.toLowerCase()
    );
    return match?.countryCode ?? '';
  }

  /**
   * Default end year for a newly created Travel event: 5 years before the plan
   * ends, based on the plan's actual configured end (not a hardcoded age).
   * Falls back to the plan's last year if "plan end − 5" would be earlier than
   * the Travel start year.
   */
  private computeDefaultTravelEndYear(startYear: number): number | null {
    const planEndYear = this.dialogEndCalendarYear;
    if (!Number.isFinite(planEndYear) || planEndYear <= 0) {
      return null;
    }
    const candidate = planEndYear - 5;
    if (Number.isFinite(startYear) && candidate < startYear) {
      return planEndYear;
    }
    return candidate;
  }

  private getNextEventName(baseName: string): string {
    const existing = this.data.eventsList
      ?.filter((e: any) =>
        e.name === baseName || e.name.startsWith(`${baseName} `)
      ) ?? [];

    if (existing.length === 0) {
      return baseName;
    }

    return `${baseName} ${existing.length + 1}`;
  }

  // event with financing option (Home, Car, Boat)
  onFinancingEventSubmit() {
    this.eventForm.markAllAsTouched();

    if (!this.eventForm.valid) return;
    if (this.isFinancingEventSaveButtonDisabled) return;

    this.saveClicked = true;
    this.cdr.markForCheck();
    const paymentType = this.eventForm.get('paymentType')?.value;
    const cashFlags =
      paymentType === 'Cash'
        ? { isCash: true, isFinance: false }
        : { isCash: false, isFinance: true };
    const events: ClientEvent[] = [];

    // cash purchase or down payment for the financing purchase
    events.push(
      this.buildOneOffExpense(
        this.eventForm.get('amount')?.value,
        this.eventForm.get('start')?.value,
        cashFlags
      )
    );

    // financing
    if (paymentType === 'Financing') {
      events.push(
        this.buildMonthlyExpense(
          this.eventForm.get('monthlyPayment')?.value,
          this.eventForm.get('monthlyStart')?.value,
          this.eventForm.get('monthlyEnd')?.value,
          cashFlags
        )
      );
    }

    // resale income
    if (this.eventForm.get('hasResale')?.value) {
      events.push(this.buildOneOffIncome(
        this.eventForm.get('resalePrice')?.value,
        this.eventForm.get('resaleDate')?.value
      ));
    }

    if (!events.length) {
      this.saveClicked = false;
      return;
    }

    if (this.scenarioMode) {
      this.saveClicked = false;
      this.dialogRef.close({ status: 'Success', scenarioItem: events });
      return;
    }

    this.timelineHttpService
      .addFinancingEvents(events, this.cashflowId)
      .pipe(
        filter((res) => !!res),
        catchError((err) => {
          console.error(err);
          return EMPTY;
        }),
        finalize(() => {
          this.saveClicked = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(() => {
        this.dialogRef.close({
          status: 'Success',
        });
      });
  }

  onCashControlClicked(value: boolean) {
    this.isCashEvent = value;
    const paymentType: 'Cash' | 'Financing' = value ? 'Cash' : 'Financing';
    this.eventForm.get('paymentType')?.setValue(paymentType);
    this.applyFinancingValidators(paymentType);
  }

  onCustomCashControlClicked(value: boolean): void {
    this.isCustomCashEvent = value;
    const paymentType: 'Cash' | 'Financing' = value ? 'Cash' : 'Financing';
    this.eventForm.get('paymentType')?.setValue(paymentType, { emitEvent: false });
    this.applyCustomPaymentValidators(paymentType);
  }

  hasResaleChanged(event: any) {
    this.setupResaleValidation();
  }

  openFinancingCalculatorModal(): void {
    const dialogRef = this.dialog.open(MortgageCalculatorDialogComponent, {
      width: '612px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        title: this.financingCalculatorTitle,
        clientCountryCode: this.clientCountryCode,
        currencySymbol: this.clientPreferredCurrency,
        calculatorKind: this.financingCalculatorKind,
        priceLabel: this.financingCalculatorPriceLabel,
        advisorDefaultInterestRate: this.financingCalculatorAdvisorRate,
        initialState: this.lastCalculatorState,
        defaultLoanTermYears: this.financingCalculatorDefaultLoanTermYears,
      },
    });

    dialogRef.afterClosed().subscribe((result: MortgageCalculatorDialogResult | undefined) => {
      if (!result) return;
      if (result.state) this.lastCalculatorState = result.state;
      if (result.applied && result.output) this.onMortgageApplied(result.output);
      this.cdr.markForCheck();
    });
  }

  openCustomCalculatorModal(): void {
    const dialogRef = this.dialog.open(MortgageCalculatorDialogComponent, {
      width: '612px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        title: 'Loan calculator',
        clientCountryCode: this.clientCountryCode,
        currencySymbol: this.clientPreferredCurrency,
        calculatorKind: 'loan',
        priceLabel: 'Price',
        advisorDefaultInterestRate: this.customCalculatorAdvisorRate,
        initialState: this.lastCalculatorState,
        defaultLoanTermYears: 5,
      },
    });

    dialogRef.afterClosed().subscribe((result: MortgageCalculatorDialogResult | undefined) => {
      if (!result) return;
      if (result.state) this.lastCalculatorState = result.state;
      if (result.applied && result.output) this.onMortgageAppliedCustom(result.output);
      this.cdr.markForCheck();
    });
  }

  onMortgageApplied(output: MortgageOutput): void {
    this.isCashEvent = false;
    this.eventForm.get('paymentType')?.setValue('Financing', { emitEvent: true });

    this.eventForm.patchValue({
      amount: output.downPaymentAmount,
      monthlyPayment: output.monthlyEMI,
    }, { emitEvent: false });

    const startYear = this.eventForm.get('start')?.value
      ?? this.eventForm.get('monthlyStart')?.value
      ?? this.data.forecastStartDateYear;
    const endYear = startYear + output.loanTermYears;
    this.eventForm.patchValue({
      monthlyStart: startYear,
      monthlyEnd: endYear,
    }, { emitEvent: false });

    this.applyFinancingValidators('Financing');

    setTimeout(() => {
      const el = this.amountInput?.nativeElement;
      if (el) {
        el.value = formatAppDisplayNumber(this.language.current, Number(output.downPaymentAmount));
        el.dispatchEvent(new Event('blur'));
      }

      const elMonthly = this.monthlyPayment?.nativeElement;
      if (elMonthly) {
        elMonthly.value = formatAppDisplayNumber(this.language.current, Number(output.monthlyEMI));
        elMonthly.dispatchEvent(new Event('blur'));
      }
    });

  }

  onMortgageAppliedCustom(output: MortgageOutput): void {
    this.isCustomCashEvent = false;
    this.eventForm.get('paymentType')?.setValue('Financing', { emitEvent: false });
    this.eventForm.patchValue(
      {
        amount: output.downPaymentAmount,
        monthlyPayment: output.monthlyEMI,
      },
      { emitEvent: false }
    );
    const startYear =
      this.eventForm.get('start')?.value ?? this.data.forecastStartDateYear;
    const endYear = startYear + output.loanTermYears;
    this.eventForm.patchValue(
      {
        monthlyStart: startYear,
        monthlyEnd: endYear,
      },
      { emitEvent: false }
    );
    this.applyCustomPaymentValidators('Financing');
    setTimeout(() => {
      const el = this.amountInput?.nativeElement;
      if (el) {
        el.value = formatAppDisplayNumber(this.language.current, Number(output.downPaymentAmount));
        el.dispatchEvent(new Event('blur'));
      }
      const elMonthly = this.monthlyPayment?.nativeElement;
      if (elMonthly) {
        elMonthly.value = formatAppDisplayNumber(this.language.current, Number(output.monthlyEMI));
        elMonthly.dispatchEvent(new Event('blur'));
      }
    });
    this.cdr.markForCheck();
  }

  private applyCustomPaymentValidators(paymentType: 'Cash' | 'Financing'): void {
    this.isCustomCashEvent = paymentType === 'Cash';
    this.showMortgageCalculatorCustom = false;

    const amount = this.eventForm.get('amount');
    const monthlyPayment = this.eventForm.get('monthlyPayment');
    const monthlyStart = this.eventForm.get('monthlyStart');
    const monthlyEnd = this.eventForm.get('monthlyEnd');
    const cycle = this.eventForm.get('cycle');
    const escalationRate = this.eventForm.get('escalationRate');
    const customEscalationRate = this.eventForm.get('customEscalationRate');
    const end = this.eventForm.get('end');

    monthlyPayment?.clearValidators();
    monthlyStart?.clearValidators();
    monthlyEnd?.clearValidators();
    monthlyPayment?.setErrors(null);
    monthlyStart?.setErrors(null);
    monthlyEnd?.setErrors(null);

    if (paymentType === 'Cash') {
      amount?.setValidators([Validators.required, Validators.min(0)]);
      cycle?.enable({ emitEvent: false });
      this.eventForm.patchValue(
        { monthlyPayment: 0, monthlyEnd: null },
        { emitEvent: false }
      );
      this.eventForm.clearValidators();
      this.eventForm.setValidators(this.endOnOrAfterStartValidator());
      const cy = (cycle?.value as string) || 'One-off';
      this.onCycleValueChange(cy);
    } else {
      escalationRate?.clearValidators();
      customEscalationRate?.clearValidators();
      customEscalationRate?.setValue(null, { emitEvent: false });
      end?.clearValidators();
      amount?.setValidators([Validators.required, Validators.min(1)]);
      monthlyPayment?.setValidators([Validators.required, Validators.min(1)]);
      monthlyStart?.setValidators(Validators.required);
      monthlyEnd?.setValidators([calendarYearOrEventRefValidator()]);
      if (!monthlyStart?.value) {
        monthlyStart?.setValue(this.eventForm.get('start')?.value, {
          emitEvent: false,
        });
      }
      cycle?.setValue('One-off', { emitEvent: false });
      cycle?.disable({ emitEvent: false });
      this.eventForm.clearValidators();
      this.eventForm.setValidators(this.endOnOrAfterStartMonthlyValidator());
    }

    amount?.updateValueAndValidity({ emitEvent: false });
    monthlyPayment?.updateValueAndValidity({ emitEvent: false });
    monthlyStart?.updateValueAndValidity({ emitEvent: false });
    monthlyEnd?.updateValueAndValidity({ emitEvent: false });
    this.eventForm.updateValueAndValidity({ emitEvent: false });
  }

  private applyFinancingValidators(paymentType: 'Cash' | 'Financing') {
    const amount = this.eventForm.get('amount');
    const downPayment = this.eventForm.get('downPayment');
    const monthlyPayment = this.eventForm.get('monthlyPayment');
    const monthlyStart = this.eventForm.get('monthlyStart');
    const monthlyEnd = this.eventForm.get('monthlyEnd');

    // Reset everything first
    amount?.clearValidators();
    downPayment?.clearValidators();
    monthlyPayment?.clearValidators();
    monthlyStart?.clearValidators();
    monthlyEnd?.clearValidators();

    amount?.setErrors(null);
    downPayment?.setErrors(null);
    monthlyPayment?.setErrors(null);
    monthlyStart?.setErrors(null);
    monthlyEnd?.setErrors(null);

    if (paymentType === 'Cash') {
      amount?.setValidators([Validators.required, Validators.min(0)]);
      this.eventForm.patchValue({ cycle: 'One-off', downPayment: 0, monthlyPayment: 0, monthlyEnd: null }, { emitEvent: false });
      this.eventForm.get('cycle')?.disable();
    }

    if (paymentType === 'Financing') {
      amount?.setValidators([Validators.required, Validators.min(1)]);
      monthlyPayment?.setValidators([Validators.required, Validators.min(1)]);
      monthlyStart?.setValidators(Validators.required);
      monthlyEnd?.setValidators([calendarYearOrEventRefValidator()]);

      if (!monthlyStart?.value) {
        monthlyStart?.setValue(this.eventForm.get('start')?.value, { emitEvent: false });
      }

      // Downpayment is always one-off and non-editable
      this.eventForm.patchValue({ cycle: 'One-off' }, { emitEvent: false });
      this.eventForm.get('cycle')?.disable();

      this.eventForm.setValidators(this.endOnOrAfterStartMonthlyValidator());
      this.eventForm.updateValueAndValidity({ emitEvent: false });
    }

    amount?.updateValueAndValidity({ emitEvent: false });
    downPayment?.updateValueAndValidity({ emitEvent: false });
    monthlyPayment?.updateValueAndValidity({ emitEvent: false });
    monthlyStart?.updateValueAndValidity({ emitEvent: false });
    monthlyEnd?.updateValueAndValidity({ emitEvent: false });
  }

  private createBaseEvent(
    id: string,
    name: string,
    amount: number,
    year: number,
    cycle: 'One-off' | 'Every month',
    type: EventIncomeType,
    isParent: boolean,
    isCash: boolean,
    isFinance: boolean
  ): ClientEvent {
    const iconUrl =
      this.selectedEventType === EventType.CUSTOM
        ? this.patchEvent?.iconUrl ?? 'custom-icon'
        : this.patchEvent?.iconUrl ?? '';
    return {
      id,
      name,
      netAmount: {
        cycle: {
          id: this.amountCycles.find(x => x.description === cycle)?.id ?? '',
          description: cycle
        },
        amount,
        currencySymbol: this.clientPreferredCurrency
      },
      start: {
        year,
        age: getPersistedAgeForCalendarYear(
          this.data.clientBirthDate,
          year,
          this.data.forecastStartDate,
          this.data.planDuration,
          this.dialogEndCalendarYear,
        ),
      },
      end: cycle === 'One-off'
        ? null
        : {
          year,
          age: getPersistedAgeForCalendarYear(
            this.data.clientBirthDate,
            year,
            this.data.forecastStartDate,
            this.data.planDuration,
            this.dialogEndCalendarYear,
          ),
        },
      escalationRate: {
        value: "0",
        description: ''
      },
      type,
      iconUrl,
      isDefault: false,
      isOneOff: cycle === 'One-off',
      isPlaceHolder: false,
      isCash,
      isFinance,
      isParent
    };
  }

  // parent or main event
  private buildOneOffExpense(
    amount: number,
    year: number,
    flags?: { isCash: boolean; isFinance: boolean }
  ): ClientEvent {
    let finalName = this.patchEvent?.name ?? 'Asset purchase';

    // auto rename
    if (!this.isEditWorkflow && this.AUTO_RENAME_EVENTS.includes(finalName)) {
      finalName = this.getNextEventName(finalName);
    }

    if (this.eventForm.get('name')?.value !== this.patchEvent?.name
      && this.eventForm.get('name')?.value !== finalName) {
      finalName = this.eventForm.get('name')?.value;
    }

    if (!this.isEditWorkflow) {
      finalName = capitalizeFirstLetter(finalName);
    }

    const id = this.isEditWorkflow ? this.patchEvent?.id ?? "" : "";

    const isCash = flags?.isCash ?? this.isCashEvent;
    const isFinance = flags?.isFinance ?? !this.isCashEvent;

    return this.createBaseEvent(
      id,
      finalName,
      amount,
      year,
      'One-off',
      EventIncomeType.Expense,
      true,
      isCash,
      isFinance
    );
  }

  private buildMonthlyExpense(
    amount: number,
    startYear: number,
    endValue: number | string | null | undefined,
    flags?: { isCash: boolean; isFinance: boolean }
  ): ClientEvent {
    let finalName = this.patchEvent?.name ?? 'Asset';

    // auto rename
    if (!this.isEditWorkflow && this.AUTO_RENAME_EVENTS.includes(finalName)) {
      finalName = this.getNextEventName(finalName);
    }

    if (this.eventForm.get('name')?.value !== this.patchEvent?.name
      && this.eventForm.get('name')?.value !== finalName) {
      finalName = this.eventForm.get('name')?.value;
    }

    if (!this.isEditWorkflow) {
      finalName = capitalizeFirstLetter(finalName);
    }

    const monthly = this.financialRecords?.find(x => x.description?.includes("Monthly payment"));
    const id = this.isEditWorkflow ? monthly?.id ?? "" : "";

    const isCash = flags?.isCash ?? this.isCashEvent;
    const isFinance = flags?.isFinance ?? !this.isCashEvent;

    const endYear = resolveYear(endValue, this.eventsList);
    const endEventId = extractEventId(endValue);

    const event = this.createBaseEvent(
      id,
      `${finalName} – Monthly payment`,
      amount,
      startYear,
      'Every month',
      EventIncomeType.Expense,
      false,
      isCash,
      isFinance
    );

    event.end = {
      year: endYear,
      age: getPersistedAgeForCalendarYear(
        this.data.clientBirthDate,
        endYear,
        this.data.forecastStartDate,
        this.data.planDuration,
        this.dialogEndCalendarYear,
      ),
    };
    event.endEventId = endEventId ?? null;

    return event;
  }

  private buildOneOffIncome(amount: number, year: number): ClientEvent {
    let finalName = this.patchEvent?.name ?? 'Asset';

    // auto rename
    if (!this.isEditWorkflow && this.AUTO_RENAME_EVENTS.includes(finalName)) {
      finalName = this.getNextEventName(finalName);
    }

    if (this.eventForm.get('name')?.value !== this.patchEvent?.name
      && this.eventForm.get('name')?.value !== finalName) {
      finalName = this.eventForm.get('name')?.value;
    }

    if (!this.isEditWorkflow) {
      finalName = capitalizeFirstLetter(finalName);
    }

    const resale = this.financialRecords?.find(x => x.description?.includes("Resale"));
    const id = this.isEditWorkflow ? resale?.id ?? "" : "";

    return this.createBaseEvent(
      id,
      `${finalName} – Resale`,
      amount,
      year,
      'One-off',
      EventIncomeType.Income,
      false,
      true,
      false
    );
  }

  private setDefaultResaleValues(): void {
    const hasResale = this.eventForm.get('hasResale')?.value;
    if (!hasResale) {
      this.eventForm.patchValue({
        resaleDate: null,
        resalePrice: 0
      }, { emitEvent: false });
      return;
    }

    // Preserve user-entered resale data — only set defaults for empty fields
    const currentResaleDate = this.eventForm.get('resaleDate')?.value;
    const currentResalePrice = this.eventForm.get('resalePrice')?.value;

    const paymentType = this.eventForm.get('paymentType')?.value;
    const startYear = this.eventForm.get('start')?.value;
    const endYearMonthlyPayment = resolveYear(
      this.eventForm.get('monthlyEnd')?.value,
      this.eventsList,
    );
    const eventName = this.patchEvent?.name;

    let resaleYear: number | null = null;

    if (paymentType === 'Financing') {
      resaleYear =
        endYearMonthlyPayment > 0 ? endYearMonthlyPayment : null;
    } else {
      if (eventName === 'Car') {
        resaleYear = startYear + 5;
      } else if (eventName === 'Home' || eventName === 'Boat') {
        resaleYear = startYear + 10;
      }
    }

    this.eventForm.patchValue({
      resaleDate: currentResaleDate ?? resaleYear,
      resalePrice: (currentResalePrice != null && currentResalePrice > 0) ? currentResalePrice : 0
    }, { emitEvent: false });
  }

  private patchFinancingForm() {
    if (this.isEditWorkflow)
      this.financialRecords = this.data.financialRecords;

    this.isCashEvent = this.patchEvent?.isCash ?? true;
    const paymentType: 'Cash' | 'Financing' = this.isCashEvent ? 'Cash' : 'Financing';
    const monthly = this.financialRecords?.find(x => x.description?.includes("– Monthly payment"));
    const resale = this.financialRecords?.find(x => x.description?.includes("– Resale"));

    this.eventForm.patchValue({
      name: this.patchEvent?.name,
      paymentType: paymentType,
      amount: this.patchEvent?.netAmount?.amount ?? 0,
      start: this.patchEvent?.start?.year ?? null,

      monthlyPayment: monthly?.amount?.amount ?? 0,
      monthlyStart: monthly?.start?.year ?? null,
      monthlyEnd: monthly?.endEventId
        ? 'event:' + monthly.endEventId
        : monthly?.end?.year ?? null,

      hasResale: !!resale,
      resaleDate: resale?.start?.year ?? null,
      resalePrice: resale?.amount?.amount ?? 0,

      cycle: 'One-off',
    }, { emitEvent: true });

    this.applyFinancingValidators(paymentType);

    setTimeout(() => {
      // Net amount / Downpayment 
      const el = this.amountInput?.nativeElement;
      const amount = this.eventForm.get('amount')?.value;
      if (!el || amount === null || amount === undefined || amount === '') return;
      el.value = Number(amount).toLocaleString('en-US');
      el.dispatchEvent(new Event('blur'));
    });

    setTimeout(() => {
      // Monthly payment
      const elMonthlyPayment = this.monthlyPayment?.nativeElement;
      const monthlyPayment = this.eventForm.get('monthlyPayment')?.value;
      if (!elMonthlyPayment || monthlyPayment === null || monthlyPayment === undefined || monthlyPayment === '') return;
      elMonthlyPayment.value = Number(monthlyPayment).toLocaleString('en-US');
      elMonthlyPayment.dispatchEvent(new Event('blur'));
    });

    setTimeout(() => {
      // Resale price
      const elResalePrice = this.resalePrice?.nativeElement;
      const resalePrice = this.eventForm.get('resalePrice')?.value;
      if (!elResalePrice || resalePrice === null || resalePrice === undefined || resalePrice === '') return;
      elResalePrice.value = Number(resalePrice).toLocaleString('en-US');
      elResalePrice.dispatchEvent(new Event('blur'));
    });
  }

  private setupFinancingSubscriptions() {
    this.eventForm.get('paymentType')!.valueChanges.subscribe(type => {
      this.applyFinancingValidators(type);
      if (this.eventForm.get('hasResale')?.value) {
        this.setDefaultResaleValues();
      }
    });

    this.setupResaleValidation();
  }

  private setupResaleValidation() {
    this.eventForm.get('hasResale')!.valueChanges.subscribe(checked => {
      const resaleDate = this.eventForm.get('resaleDate');
      const resalePrice = this.eventForm.get('resalePrice');

      resaleDate?.clearValidators();
      resalePrice?.clearValidators();

      if (checked) {
        resaleDate?.setValidators(Validators.required);
        resalePrice?.setValidators([Validators.required, Validators.min(0)]);
        this.setDefaultResaleValues();
      } else {
        resaleDate?.setValue(null, { emitEvent: false });
        resalePrice?.setValue(0, { emitEvent: false });
      }

      resaleDate?.updateValueAndValidity({ emitEvent: false });
      resalePrice?.updateValueAndValidity({ emitEvent: false });
    });
  }

  getStartYear(): number {
    const val = this.eventForm.get('start')?.value;
    return typeof val === 'number' && Number.isFinite(val) ? val : this.data.forecastStartDateYear;
  }

  getEndEvents(): any[] {
    const startYear = this.getStartYear();
    return (this.eventsList ?? []).filter((e: any) => (e?.year ?? 0) >= startYear);
  }

  /**
   * Stable key for @for over timeline events in end dropdowns.
   * Do not use `event.id ?? event.name + event.year` inline in templates — it can produce
   * broken compiler output (ReferenceError in generated track function).
   */
  trackEndEventRow(event: {
    id?: string | null;
    name?: string | null;
    year?: number | null;
  }): string {
    const id = event?.id;
    if (id != null && String(id).length > 0) {
      return `id:${id}`;
    }
    return `f:${event?.name ?? ''}:${event?.year ?? ''}`;
  }

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }

  getFinancingStartYear(): number {
    const val = this.eventForm.get('monthlyStart')?.value;
    return typeof val === 'number' && Number.isFinite(val) ? val : this.data.forecastStartDateYear;
  }

  getFinancingEndEvents(): any[] {
    const startYear = this.getFinancingStartYear();
    return (this.eventsList ?? []).filter((e: any) => (e?.year ?? 0) >= startYear);
  }

  getFinancingEndYears(): number[] {
    const startYear = this.getFinancingStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
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

  getTimelineEventLabel(rawName: string): string {
    return translateTimelineEventDisplayName(this.translate, rawName);
  }
}

export class EventType {
  public static readonly CUSTOM = 'Custom'; // custom event with add button
  public static readonly SYSTEM = 'System'; // all events on top of timeline except financing
  public static readonly FINANCING = 'Financing'; // finanacing events on the top of the timeline
}
