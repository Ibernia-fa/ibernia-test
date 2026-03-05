import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { catchError, filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import moment from 'moment';
import { allCountries } from 'src/app/clients/models/country';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MortgageCalculatorComponent, MortgageCalculatorState } from '../mortgage-calculator/mortgage-calculator.component';
import { MortgageOutput } from '../mortgage-calculator/mortgage-calculator.component';

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
    TranslateModule,
    MatCheckboxModule,
    MortgageCalculatorComponent
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
  isAllowRename: boolean = false;
  hideEventType = false;
  isInheritanceOneOff = false;
  isCashEvent = false;
  financialRecords: FinancialRecordLineItem[] = [];
  clientCountryCode: string = '';
  showMortgageCalculator = false;
  lastCalculatorState: MortgageCalculatorState | null = null;

  get isHomeEvent(): boolean {
    return this.patchEvent?.name?.startsWith('Home') ?? false;
  }

  constructor(
    private dialogRef: MatDialogRef<AddEventDialogComponent>,
    private fb: FormBuilder,
    private timelineHttpService: TimelineHttpService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.amountCycles = data.amountCycles;
    this.selectedEventType = data.eventType;
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
    let age = forecastStart.getFullYear() - birthDate.getFullYear();
    const monthDiff = forecastStart.getMonth() - birthDate.getMonth();
    const dayDiff = forecastStart.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    this.clientAge = age;
    if (data.forecastStartDateYear - this.clientBirthYear > this.clientAge) this.clientBirthYear = this.clientBirthYear + 1

    this.eventsList = data.eventsList;
    this.eventsList?.sort((a: any, b: any) => a.age - b.age);
    this.isEditWorkflow = data.isEditWorkflow;
    this.patchEvent = data.patchEvent
    this.clientPreferredCurrency = data.clientPreferredCurrency


    const endYear = data.forecastEndDateYear + 1;
    var iterations = endYear - data.forecastStartDateYear + 1

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

    if (this.selectedEventType === EventType.FINANCING) {
      this.isIncomeEvent = false; // financing is always expense
      this.isCashEvent = this.isEditWorkflow ? this.patchEvent?.isCash ?? true : this.data.isCashEvent;
      this.eventForm.get('escalationRate')?.disable();
      this.eventForm.get('end')?.clearValidators();
      this.eventForm.get('end')?.updateValueAndValidity({ emitEvent: false });
      this.eventForm.get('cycle')?.setValue('One-off', { emitEvent: false });
      this.eventForm.get('cycle')?.disable();
    }

    if (!this.isEditWorkflow) {
      const updatedName = this.getNextEventName(this.eventForm.get('name')?.value);
      this.eventForm.get('name')?.setValue(updatedName, { emitEvent: false });
    }
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
    if (this.selectedEventType == EventType.SYSTEM
      && (this.patchEvent?.name.startsWith("Travel") ||
        this.patchEvent?.iconUrl == "travel-icon")) {
      defaultCycle = 'Every year';
    }

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
          end: [0, Validators.required],
          escalationRate: [this.escalationRates[0].value, Validators.required],
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
          isIncomeEvent: [true, Validators.required],
          currency: [this.clientPreferredCurrency, Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: ['One-off', [Validators.required]],
          start: [null, Validators.required],
          end: [0],
          escalationRate: [this.escalationRates[0].value],
          customEscalationRate: ['']

        });
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
        this.eventForm.get('end')?.setValidators(Validators.required);
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
      }
      else {
        this.patchForm();
        // Re-apply validators based on the patched cycle value
        const patchedCycle = this.eventForm.get('cycle')?.value;
        if (patchedCycle) {
          this.onCycleValueChange(patchedCycle);
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
        this.eventForm.controls['end'].patchValue(this.patchEvent?.end?.year);
        this.eventForm.controls['escalationRate'].patchValue(this.patchEvent?.escalationRate?.description);
        this.handleEscalationRatePatch(this.patchEvent?.escalationRate?.description, this.patchEvent?.escalationRate?.value);
        break;

      case EventType.CUSTOM:
        this.selectedEventIconUrl = this.patchEvent?.iconUrl ?? "";
        this.eventForm.controls['name'].patchValue(this.patchEvent?.name);
        this.eventForm.controls['isIncomeEvent'].patchValue(this.patchEvent?.type === EventIncomeType.Income);
        this.eventForm.controls['currency'].patchValue(this.patchEvent?.netAmount.currencySymbol);
        this.eventForm.controls['amount'].patchValue(this.patchEvent?.netAmount.amount);
        this.eventForm.controls['cycle'].patchValue(this.patchEvent?.netAmount.cycle?.description);
        this.eventForm.controls['start'].patchValue(this.patchEvent?.start.year);
        this.eventForm.controls['end'].patchValue(this.patchEvent?.end?.year);
        this.eventForm.controls['escalationRate'].patchValue(this.patchEvent?.escalationRate?.description);
        this.handleEscalationRatePatch(this.patchEvent?.escalationRate?.description, this.patchEvent?.escalationRate?.value);

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
      this.eventForm.controls['escalationRate'].patchValue(value);
      this.selectedEscalationDescription = 'Increases at custom rate';

      // Configure the custom field
      const customControl = this.eventForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.setValue(value);
      customControl?.updateValueAndValidity();
    } else {
      // For standard rates, set by value and reset custom control
      this.eventForm.controls['escalationRate'].patchValue(value);
      this.selectedEscalationDescription = description;

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
      this.eventForm.controls['end'].setValidators(Validators.required);
      this.eventForm.controls['end'].updateValueAndValidity();
      this.eventForm.controls['escalationRate'].setValidators(Validators.required);
      this.eventForm.controls['escalationRate'].updateValueAndValidity();

      const currentValue = this.eventForm.get('escalationRate')?.value;
      if (currentValue === null || currentValue === '' || currentValue === undefined) {
        this.eventForm.get('escalationRate')?.setValue(this.escalationRates[0]?.value);
      }
    }
    this.eventForm.updateValueAndValidity();
  }

  onEventNameValueChange(event: any) {
    this.selectedEventName = event;

    if (event === EventType.CUSTOM) {
      this.eventForm.addControl('name', new FormControl('', [Validators.required]));
      this.eventForm.updateValueAndValidity();
      this.selectedEventIconUrl = 'custom-icon'
    } else {
      this.eventForm.removeControl('name');
      this.eventForm.updateValueAndValidity();

      const cusEvent = this.customEventsLibrary.find(
        (customEvent) => customEvent.name === event
      );
      this.selectedEventIconUrl = cusEvent?.iconUrl ?? '';
      this.isIncomeEvent = cusEvent?.type === EventIncomeType.Income;
    }
  }

  onSystemEventSubmit() {
    this.eventForm.markAllAsTouched();

    if (
      this.eventForm.valid &&
      this.selectedEventType === EventType.SYSTEM &&
      this.patchEvent
    ) {
      this.saveClicked = true;

      // inheritance
      let escalataionRatesToSubmit = null;

      // non inheritance 
      if (!this.isInheritanceOneOff) {
        const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
        const selectedEscalationRateValue = isCustomEscalation
          ? this.eventForm.get('customEscalationRate')?.value
          : this.eventForm.get('escalationRate')?.value;

        escalataionRatesToSubmit =
          selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
            ? this.escalationRates.find(x => x.value === selectedEscalationRateValue) ?? {
              value: selectedEscalationRateValue,
              description: isCustomEscalation ? 'Increases at custom rate' : selectedEscalationRateValue
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
          age: this.isInheritanceOneOff ? this.eventForm.get('ageDate')?.value - this.clientBirthYear // for inheritance one-off event
            : this.eventForm.get('start')?.value - this.clientBirthYear,
        },
        end: this.isInheritanceOneOff ? null // for inheritance one-off event
          : {
            year: this.eventForm.get('end')?.value,
            age: (this.eventForm.get('end')?.value > this.clientBirthYear) ? this.eventForm.get('end')?.value - this.clientBirthYear : 0,
          },
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

      this.timelineHttpService.addEvent(clientEvent, this.cashflowId)
        .pipe(
          filter(res => !!res),
          catchError(err => {
            this.saveClicked = false;
            console.error(err);
            throw err;
          })
        ).subscribe(res => {
          this.saveClicked = false;
          this.dialogRef.close({
            status: 'Success'
          });
        })
    }
  }

  onCustomEventSubmit() {
    this.eventForm.markAllAsTouched();

    if (this.eventForm.valid) {
      this.saveClicked = true;

      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
      const selectedEscalationRateValue = isCustomEscalation
        ? this.eventForm.get('customEscalationRate')?.value
        : this.eventForm.get('escalationRate')?.value;

      const clientEvent: ClientEvent = {
        id: this.isEditWorkflow ? this.patchEvent?.id ?? "" : "",
        name: this.eventForm.get('name')?.value,
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
          year: this.eventForm.get('start')?.value,
          age: this.eventForm.get('start')?.value - this.clientBirthYear,
        },
        end: {
          year: this.eventForm.get('end')?.value,
          age: (this.eventForm.get('end')?.value > this.clientBirthYear) ? this.eventForm.get('end')?.value - this.clientBirthYear : 0,
        },
        escalationRate: selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
          ? this.escalationRates.find(x => x.value === selectedEscalationRateValue) ?? {
            value: selectedEscalationRateValue,
            description: isCustomEscalation ? 'Increases at custom rate' : selectedEscalationRateValue
          }
          : {
            value: 0,
            description: ''
          },
        type: this.isIncomeEvent
          ? EventIncomeType.Income
          : EventIncomeType.Expense,
        iconUrl: 'custom-icon',
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-off',
        isPlaceHolder: false,
        isCash: false,
        isFinance: false,
        isParent: false
      };

      this.timelineHttpService.addEvent(clientEvent, this.cashflowId)
        .pipe(
          filter(res => !!res),
          catchError(err => {
            this.saveClicked = false;

            console.error(err);
            throw err;
          })
        ).subscribe(res => {
          this.saveClicked = false;
          this.dialogRef.close({
            status: 'Success'
          });
        })
    }
    else {
      console.log(this.eventForm);
    }
  }

  cycles: string[] = ['One-off', 'Every month', 'Every year'];
  currencySymbols: string[] = ['$', '£', '€'];

  events: string[] = ['$', '£', '€'];

  get isCustomEscalationSelected(): boolean {
    const selectedValue = this.eventForm.get('escalationRate')?.value;

    // Find exact match by both value and description
    return this.escalationRates.some(e =>
      e.value === selectedValue && e.description === 'Increases at custom rate'
    );
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

    const customControl = this.eventForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }

    customControl?.updateValueAndValidity();
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const cycle = group.get('cycle')?.value as string | null;
      const start = group.get('start')?.value as number | null;
      const end = group.get('end')?.value as number | null;
      const endCtrl = group.get('end');

      if (!endCtrl) return null;

      const existing = endCtrl.errors ?? null;

      // validate only when cycle is not One-off and both numbers are present
      const shouldValidate =
        !!cycle && cycle !== 'One-off' &&
        start != null && end != null;

      if (shouldValidate && end < start) {
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
      const end = group.get('monthlyEnd')?.value as number | null;
      const endCtrl = group.get('monthlyEnd');

      if (!endCtrl) return null;

      const existing = endCtrl.errors ?? null;

      // validate only when cycle is not One-off and both numbers are present
      const shouldValidate = start != null && end != null;

      if (shouldValidate && end < start) {
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

    this.saveClicked = true;
    const paymentType = this.eventForm.get('paymentType')?.value;
    const events: ClientEvent[] = [];

    // cash purchase or down payment for the financing purchase
    events.push(this.buildOneOffExpense(
      this.eventForm.get('amount')?.value,
      this.eventForm.get('start')?.value
    ));

    // financing
    if (paymentType === 'Financing') {
      events.push(this.buildMonthlyExpense(
        this.eventForm.get('monthlyPayment')?.value,
        this.eventForm.get('monthlyStart')?.value,
        this.eventForm.get('monthlyEnd')?.value
      ));
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


    this.timelineHttpService.addFinancingEvents(events, this.cashflowId)
      .pipe(
        filter(res => !!res),
        catchError(err => {
          this.saveClicked = false;

          console.error(err);
          throw err;
        })
      ).subscribe(res => {
        this.saveClicked = false;
        this.dialogRef.close({
          status: 'Success'
        });
      });
  }

  onCashControlClicked(value: boolean) {
    this.isCashEvent = value;
    const paymentType: 'Cash' | 'Financing' = value ? 'Cash' : 'Financing';
    this.eventForm.get('paymentType')?.setValue(paymentType);
    this.applyFinancingValidators(paymentType);
  }

  hasResaleChanged(event: any) {
    this.setupResaleValidation();
  }

  toggleMortgageCalculator(): void {
    this.showMortgageCalculator = !this.showMortgageCalculator;
  }

  onCalculatorStateChanged(state: MortgageCalculatorState): void {
    this.lastCalculatorState = state;
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
        el.value = Number(output.downPaymentAmount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));
      }

      const elMonthly = this.monthlyPayment?.nativeElement;
      if (elMonthly) {
        elMonthly.value = Number(output.monthlyEMI).toLocaleString('en-US');
        elMonthly.dispatchEvent(new Event('blur'));
      }
    });

    this.showMortgageCalculator = false;
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
      monthlyEnd?.setValidators(Validators.required);

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
  ): ClientEvent {
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
        age: year - this.clientBirthYear
      },
      end: cycle === 'One-off'
        ? null
        : {
          year,
          age: year - this.clientBirthYear
        },
      escalationRate: {
        value: "0",
        description: ''
      },
      type,
      iconUrl: this.patchEvent?.iconUrl ?? '',
      isDefault: false,
      isOneOff: cycle === 'One-off',
      isPlaceHolder: false,
      isCash: this.isCashEvent,
      isFinance: !this.isCashEvent,
      isParent
    };
  }

  // parent or main event
  private buildOneOffExpense(amount: number, year: number): ClientEvent {
    let finalName = this.patchEvent?.name ?? 'Asset purchase';

    // auto rename
    if (!this.isEditWorkflow && this.AUTO_RENAME_EVENTS.includes(finalName)) {
      finalName = this.getNextEventName(finalName);
    }

    if (this.eventForm.get('name')?.value !== this.patchEvent?.name
      && this.eventForm.get('name')?.value !== finalName) {
      finalName = this.eventForm.get('name')?.value;
    }

    const id = this.isEditWorkflow ? this.patchEvent?.id ?? "" : "";

    return this.createBaseEvent(
      id,
      finalName,
      amount,
      year,
      'One-off',
      EventIncomeType.Expense,
      true,
    );
  }

  private buildMonthlyExpense(
    amount: number,
    startYear: number,
    endYear: number
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

    const monthly = this.financialRecords?.find(x => x.description?.includes("Monthly payment"));
    const id = this.isEditWorkflow ? monthly?.id ?? "" : "";

    const event = this.createBaseEvent(
      id,
      `${finalName} – Monthly payment`,
      amount,
      startYear,
      'Every month',
      EventIncomeType.Expense,
      false
    );

    event.end = {
      year: endYear,
      age: endYear - this.clientBirthYear
    };

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

    const resale = this.financialRecords?.find(x => x.description?.includes("Resale"));
    const id = this.isEditWorkflow ? resale?.id ?? "" : "";

    return this.createBaseEvent(
      id,
      `${finalName} – Resale`,
      amount,
      year,
      'One-off',
      EventIncomeType.Income,
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
    const endYearMonthlyPayment = this.eventForm.get('monthlyEnd')?.value;
    const eventName = this.patchEvent?.name;

    let resaleYear: number | null = null;

    if (paymentType === 'Financing') {
      resaleYear = endYearMonthlyPayment ?? null;
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
      monthlyEnd: monthly?.end?.year ?? null,

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

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }
}

export class EventType {
  public static readonly CUSTOM = 'Custom'; // custom event with add button
  public static readonly SYSTEM = 'System'; // all events on top of timeline except financing
  public static readonly FINANCING = 'Financing'; // finanacing events on the top of the timeline
}
