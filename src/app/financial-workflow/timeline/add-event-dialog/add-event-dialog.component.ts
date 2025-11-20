import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Client } from 'src/app/clients/models/client';
import { ClientEvent, Cycle, EscalationRate, EventIncomeType } from '../models/financial-timeline';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Timeline } from 'vis-timeline';
import { TimelineHttpService } from '../services/timeline-http.service';
import { catchError, filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import moment from 'moment';
import { allCountries } from 'src/app/clients/models/country';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
interface Food {
  value: string;
  viewValue: string;
}

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
    // AgeCalculatorPipe,
    ReactiveFormsModule,
    MatTooltipModule,
    CommonModule,
    ThousandSeparatorInputDirective,
  ],
  providers: [provideNativeDateAdapter(), 
    AgeCalculatorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-event-dialog.component.html',
  styleUrl: './add-event-dialog.component.scss',
})
export class AddEventDialogComponent {
  isIncomeEvent = true;
  escalationRates: EscalationRate[];
  selectedEventType: string = EventType.CUSTOM;
  eventType = EventType;
  customEventsLibrary: ClientEvent[];
  eventForm: FormGroup;
  timelineId: string;
  cashflowId: string;
  systemEvent: ClientEvent | undefined | null;
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


  constructor(
    private dialogRef: MatDialogRef<AddEventDialogComponent>,
    private fb: FormBuilder,
    private timelineHttpService: TimelineHttpService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log(data);
    this.amountCycles = data.amountCycles;
    this.selectedEventType = data.eventType;
    this.isIncomeEvent = data.isIncomeEvent;
    this.escalationRates = data.escalataionRates;
    this.customEventsLibrary = data.customEvents;
    this.timelineId = data.timelineId;
    this.cashflowId = data.cashflowId;
    this.systemEvent = data.systemEvent
    this.dropTime = data.dropTime;
    this.clientBirthDate = data.clientBirthDate;
    this.clientBirthYear = moment(this.clientBirthDate).year();
    const birthDate = new Date(this.clientBirthDate);
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

    this.eventsList = data.eventsList
    this.isEditWorkflow = data.isEditWorkflow;
    this.patchEvent= data.patchEvent
    this.clientPreferredCurrency= data.clientPreferredCurrency

    var iterations = data.forecastEndDateYear - data.forecastStartDateYear + 1
    // console.log('Forecast end year => ', data.forecastEndDateYear)
    // console.log('Forecast start year => ', data.forecastStartDateYear)
    
    // console.log('Iterations => ', iterations)
    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.initForm();
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
    switch (this.selectedEventType) {
      case EventType.INHERITANCE:
        this.eventForm = this.fb.group({
          isIncomeEvent: [false, Validators.required],
          currency: [this.clientPreferredCurrency, Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: [{value: this.systemEvent?.isOneOff ? 'One-off' : '', disabled: true}, [Validators.required]],
          ageDate: [moment(this.dropTime).year(), Validators.required],
          customEscalationRate: [0]

        });
        break;

      case EventType.STATE_PENSION:
        this.eventForm = this.fb.group({
          isIncomeEvent: [true, Validators.required],
          currency: [this.clientPreferredCurrency, Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: ['Every month', [Validators.required]],
          start: [moment(this.dropTime).year(), Validators.required],
          end: [0, Validators.required],
          escalationRate: [this.escalationRates[1].value, Validators.required],
          customEscalationRate: [0]

        });
        this.onCycleValueChange(this.systemEvent?.isOneOff ? 'One-off' : '');
        break;

      case EventType.CUSTOM:
        this.eventForm = this.fb.group({
          eventName: ['', Validators.required],
          isIncomeEvent: [true, Validators.required],
          currency: [this.clientPreferredCurrency, Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: ['One-off', [Validators.required]],
          start: [null, Validators.required],
          end: [0, Validators.required],
          escalationRate: [this.escalationRates[0].value, Validators.required],
          customEscalationRate: [0]

        });
        this.onCycleValueChange('One-off');
        break;
    }
    this.eventForm.get('currency')?.disable();
this.eventForm.setValidators(this.endOnOrAfterStartValidator());
this.eventForm.updateValueAndValidity({ emitEvent: false });
    if(this.isEditWorkflow) {
      this.patchForm();
    }
  }

  patchForm() {
    switch (this.selectedEventType) {
      case EventType.INHERITANCE:
          this.eventForm.controls['isIncomeEvent'].patchValue(this.patchEvent?.type === EventIncomeType.Income);
          this.eventForm.controls['currency'].patchValue(this.patchEvent?.netAmount.currencySymbol);
          this.eventForm.controls['amount'].patchValue(this.patchEvent?.netAmount.amount);
          this.eventForm.controls['cycle'].patchValue(this.patchEvent?.netAmount.cycle?.description);
          this.eventForm.controls['ageDate'].patchValue(this.patchEvent?.start.year);
        break;
        
        case EventType.STATE_PENSION:
          this.eventForm.controls['isIncomeEvent'].patchValue(this.patchEvent?.type === EventIncomeType.Income);
          this.eventForm.controls['currency'].patchValue(this.patchEvent?.netAmount.currencySymbol);
          this.eventForm.controls['amount'].patchValue(this.patchEvent?.netAmount.amount);
          this.eventForm.controls['cycle'].patchValue(this.patchEvent?.netAmount.cycle?.description);
          this.eventForm.controls['start'].patchValue(this.patchEvent?.start.year);
          this.eventForm.controls['end'].patchValue(this.patchEvent?.end?.year);
          this.eventForm.controls['escalationRate'].patchValue(this.patchEvent?.escalationRate?.description);
        this.handleEscalationRatePatch(this.patchEvent?.escalationRate?.description, this.patchEvent?.escalationRate?.value);

          break;
        
        case EventType.CUSTOM:
          if(this.customEventsLibrary.every(event => event.name !== this.patchEvent?.name))
          {
            console.log('in if')
              this.eventForm.controls['eventName'].patchValue('Custom');
              this.eventForm.addControl(
                'name',
                new FormControl(this.patchEvent?.name, [Validators.required])
              );
              this.eventForm.updateValueAndValidity();
            this.selectedEventIconUrl = this.patchEvent?.iconUrl ?? "";
            this.selectedEventName = 'Custom';
          }
          else {
            this.eventForm.controls['eventName'].patchValue(this.patchEvent?.name);
            this.selectedEventIconUrl = this.patchEvent?.iconUrl ?? "";
            this.selectedEventName = this.patchEvent?.name ?? "";
          }
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
  }

  private handleEscalationRatePatch(description: string| any, value: number| any) {
  // this.eventForm.controls['escalationRate'].patchValue(description);

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
  }else {
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
    if(event === 'One-off') {
      this.eventForm.controls['end'].clearValidators();
      this.eventForm.controls['end'].updateValueAndValidity();
      this.eventForm.controls['escalationRate'].clearValidators();
      this.eventForm.controls['escalationRate'].updateValueAndValidity();
    }
    else {
      this.eventForm.controls['end'].addValidators(Validators.required);
      this.eventForm.controls['end'].updateValueAndValidity();
      this.eventForm.controls['escalationRate'].addValidators(Validators.required);
      this.eventForm.controls['escalationRate'].updateValueAndValidity();

          const currentValue = this.eventForm.get('escalationRate')?.value;
    if (currentValue === null || currentValue === '' || currentValue === undefined) {
      this.eventForm.get('escalationRate')?.setValue('2.5%');
    }
    }
     this.eventForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  onEventNameValueChange(event: any) {
    this.selectedEventName = event;
    if (event === 'Custom') {
      this.eventForm.addControl(
        'name',
        new FormControl('', [Validators.required])
      );
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

  onPensionEventSubmit() {
    this.eventForm.markAllAsTouched();
    if (this.eventForm.valid && this.systemEvent) {
      this.saveClicked = true;
      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
const selectedEscalationRateValue = isCustomEscalation
  ? this.eventForm.get('customEscalationRate')?.value
  : this.eventForm.get('escalationRate')?.value;
      const clientEvent: ClientEvent = {
         id: this.isEditWorkflow ? this.patchEvent?.id ?? "" : "",
        name: this.systemEvent.name,
        netAmount: {
          cycle: {
            id:  this.amountCycles.find(
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
          age: this.eventForm.get('end')?.value - this.clientBirthYear,
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
        iconUrl: this.systemEvent.iconUrl,
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-off',
        isPlaceHolder: this.systemEvent.isPlaceHolder,
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
      // this.dialogRef.close();
    }
  }
  onInsuranceEventSubmit() {
    this.eventForm.markAllAsTouched();
    if (this.eventForm.valid && this.systemEvent) {
      this.saveClicked = true;
      const clientEvent: ClientEvent = {
        id: this.isEditWorkflow ? this.patchEvent?.id ?? "" : "",
        name: this.systemEvent.name,
        netAmount: {
          cycle: {
          id:  this.amountCycles.find(
                (x) => x.description === this.eventForm.get('cycle')?.value
              )?.id ?? '',
            description: this.eventForm.get('cycle')?.value,
          },
          amount: this.eventForm.get('amount')?.value,
          currencySymbol: this.eventForm.get('currency')?.value,
        },
        start: {
          year: this.eventForm.get('ageDate')?.value,
          age: this.eventForm.get('ageDate')?.value - this.clientBirthYear,
        },
        end: null,
        escalationRate: null,
        type: this.isIncomeEvent
          ? EventIncomeType.Income
          : EventIncomeType.Expense,
        iconUrl: this.systemEvent.iconUrl,
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-off',
        isPlaceHolder: this.systemEvent.isPlaceHolder,
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
      // this.dialogRef.close();
    }
  }
  onCustomEventSubmit() {
    console.log(this.eventForm.value);
    this.eventForm.markAllAsTouched();
    if (this.eventForm.valid) {
      this.saveClicked = true;
      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
const selectedEscalationRateValue = isCustomEscalation
  ? this.eventForm.get('customEscalationRate')?.value
  : this.eventForm.get('escalationRate')?.value;
      const clientEvent: ClientEvent = {
        id: this.isEditWorkflow ? this.patchEvent?.id ?? "" : "",
        name:
          this.eventForm.get('eventName')?.value !== 'Custom'
            ? this.eventForm.get('eventName')?.value
            : this.eventForm.get('name')?.value,
        netAmount: {
          cycle: {
            id:  this.amountCycles.find(
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
        iconUrl:
          this.eventForm.get('eventName')?.value !== 'Custom'
            ? this.customEventsLibrary.find(
                (customEvent) =>
                  customEvent.name === this.eventForm.get('eventName')?.value
              )?.iconUrl ?? ''
            : 'custom-icon',
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-off',
        isPlaceHolder: false,
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
      // this.dialogRef.close();
    }

    else {
      console.log(this.eventForm);
    }
  }

  foods: Food[] = [
    { value: '0', viewValue: '1' },
    { value: '1', viewValue: '2' },
    { value: '2', viewValue: '3' },
  ];

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
        customControl?.setValue(null); // Optionally reset field
      }
    
      customControl?.updateValueAndValidity();
    }


private endOnOrAfterStartValidator(): ValidatorFn {
  return (group: AbstractControl) => {
    const cycle = group.get('cycle')?.value as string | null;
    const start = group.get('start')?.value as number | null;
    const end   = group.get('end')?.value as number | null;
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


  
}

export class EventType {
  public static readonly CUSTOM = 'Custom';
  public static readonly STATE_PENSION = 'StatePension';
  public static readonly INHERITANCE = 'Inheritance';
}
