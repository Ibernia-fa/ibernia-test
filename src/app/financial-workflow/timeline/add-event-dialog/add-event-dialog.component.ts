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
import { MatSelectModule } from '@angular/material/select';
import { Client } from 'src/app/clients/models/client';
import { ClientEvent, EventIncomeType } from '../models/financial-timeline';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Timeline } from 'vis-timeline';
import { TimelineHttpService } from '../services/timeline-http.service';
import { catchError, filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import moment from 'moment';
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
    ReactiveFormsModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-event-dialog.component.html',
  styleUrl: './add-event-dialog.component.scss',
})
export class AddEventDialogComponent {
  isIncomeEvent = true;

  selectedEventType: string = EventType.CUSTOM;
  eventType = EventType;
  customEventsLibrary: ClientEvent[];
  eventForm: FormGroup;
  timelineId: string;
  systemEvent: ClientEvent | undefined | null;
  dropTime: Date;
  clientBirthDate: Date;
  clientBirthYear: number;
  years: number[] = []
  eventsList: any;
  selectedEventName: string;
  selectedEventIconUrl: string;


  constructor(
    private dialogRef: MatDialogRef<AddEventDialogComponent>,
    private fb: FormBuilder,
    private timelineHttpService: TimelineHttpService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log(data);
    this.selectedEventType = data.eventType;
    this.isIncomeEvent = data.isIncomeEvent;
    this.customEventsLibrary = data.customEvents;
    this.timelineId = data.timelineId;
    this.systemEvent = data.systemEvent
    this.dropTime = data.dropTime;
    this.clientBirthDate = data.clientBirthDate;
    this.clientBirthYear = moment(this.clientBirthDate).year();
    this.eventsList = data.eventsList
    
    for (let index = 0; index < 100; index++) {
      const element = data.forecastStartDateYear +index;
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
          currency: ['', Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: [{value: this.systemEvent?.isOneOff ? 'One-Off' : '', disabled: true}, [Validators.required]],
          ageDate: [moment(this.dropTime).year(), Validators.required],
        });
        break;

      case EventType.STATE_PENSION:
        this.eventForm = this.fb.group({
          isIncomeEvent: [true, Validators.required],
          currency: ['', Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: [this.systemEvent?.isOneOff ? 'One-Off' : '', [Validators.required]],
          start: [moment(this.dropTime).year(), Validators.required],
          end: [0, Validators.required],
          escalationRate: ['', Validators.required],
        });
        break;

      case EventType.CUSTOM:
        this.eventForm = this.fb.group({
          eventName: ['', Validators.required],
          isIncomeEvent: [true, Validators.required],
          currency: ['', Validators.required],
          amount: ['', [Validators.required, Validators.min(0)]],
          cycle: ['', [Validators.required]],
          start: [0, Validators.required],
          end: [0, Validators.required],
          escalationRate: ['', Validators.required],
        });
        break;
    }
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
      const clientEvent: ClientEvent = {
        id: this.systemEvent.id,
        name: this.systemEvent.name,
        netAmount: {
          cycle: {
            id: '',
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
        escalationRate: {
          id: '',
          description: this.eventForm.get('escalationRate')?.value
        },
        type: this.isIncomeEvent
          ? EventIncomeType.Income
          : EventIncomeType.Expense,
        iconUrl: this.systemEvent.iconUrl,
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-Off',
        isPlaceHolder: this.systemEvent.isPlaceHolder,
      };
      this.timelineHttpService.addEvent(clientEvent, this.timelineId)
      .pipe(
        filter(res => !!res),
        catchError(err => {
          console.error(err);
          throw err;
        })
      ).subscribe(res => {
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
      const clientEvent: ClientEvent = {
        id: this.systemEvent.id,
        name: this.systemEvent.name,
        netAmount: {
          cycle: {
            id: '',
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
        isOneOff: this.eventForm.get('cycle')?.value === 'One-Off',
        isPlaceHolder: this.systemEvent.isPlaceHolder,
      };
      this.timelineHttpService.addEvent(clientEvent, this.timelineId)
      .pipe(
        filter(res => !!res),
        catchError(err => {
          console.error(err);
          throw err;
        })
      ).subscribe(res => {
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
      const clientEvent: ClientEvent = {
        id: "",
        name:
          this.eventForm.get('eventName')?.value !== 'Custom'
            ? this.eventForm.get('eventName')?.value
            : this.eventForm.get('name')?.value,
        netAmount: {
          cycle: {
            id: '',
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
        escalationRate: {
          id: '',
          description: this.eventForm.get('escalationRate')?.value
        },
        type: this.isIncomeEvent
          ? EventIncomeType.Income
          : EventIncomeType.Expense,
        iconUrl:
          (this.eventForm.get('eventName')?.value !== 'Custom'
            ? this.customEventsLibrary.find(
                (customEvent) =>
                  customEvent.name === this.eventForm.get('eventName')?.value
              )?.iconUrl
            : '') ?? 'custom-icon',
        isDefault: false,
        isOneOff: this.eventForm.get('cycle')?.value === 'One-Off',
        isPlaceHolder: false,
      };
      this.timelineHttpService.addEvent(clientEvent, this.timelineId)
      .pipe(
        filter(res => !!res),
        catchError(err => {
          console.error(err);
          throw err;
        })
      ).subscribe(res => {
        this.dialogRef.close({
          status: 'Success'
        });
      })
      // this.dialogRef.close();
    }
  }

  foods: Food[] = [
    { value: '0', viewValue: '1' },
    { value: '1', viewValue: '2' },
    { value: '2', viewValue: '3' },
  ];

  cycles: string[] = ['One-Off', 'Every Month', 'Every Year'];
  currencySymbols: string[] = ['$', '£', '€'];

  events: string[] = ['$', '£', '€'];
}

export class EventType {
  public static readonly CUSTOM = 'Custom';
  public static readonly STATE_PENSION = 'StatePension';
  public static readonly INHERITANCE = 'Inheritance';
}
