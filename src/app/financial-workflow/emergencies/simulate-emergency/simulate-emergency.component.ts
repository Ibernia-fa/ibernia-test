
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import moment from 'moment';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import { Client } from 'src/app/clients/models/client';
import { Emergency } from '../models/emergencies.model';
import { FinancialViewModel } from '../../income-expenses/model/income-expense';
import { Cycle, EscalationRate, FinancialTimeline } from '../../timeline/models/financial-timeline';
import { SimulateEmergencyModel } from '../models/simulate-emergency.model';
import { EmergenciesHttpService } from '../services/emergencies-http.service';
import { SavingsBarStackedChartComponent } from '../../reports/savings-bar-stacked-chart/savings-bar-stacked-chart.component';

@Component({
  selector: 'simulate-emergency',
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
    MatCheckboxModule,
    MatSliderModule,
    ReactiveFormsModule,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    SavingsBarStackedChartComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './simulate-emergency.component.html',
  styleUrl: './simulate-emergency.component.scss',
})
export class SimulateEmergencyComponent {
  onAmountInput(rawValue: string) {
    const { parseFormattedNumber } = require('src/app/shared/utils/number-utils');
    const value = parseFormattedNumber(rawValue);
    this.simulateEmergencyForm.get('amount')?.setValue(value);
  }

  simulateEmergencyForm: FormGroup;
  countries = allCountries;
  clientBirthYear: number;
  clientAge: number;
  years: number[] = [];
  showStartEnd = false;
  amountCycles: Cycle[];
  escalationRates: EscalationRate[];
  selectedEscalationDescription: string;
  timeline: FinancialTimeline;
  clientPreferredCurrency: string;
  eventsList: any;
  incomes: FinancialViewModel[];
  cashflowId!: string;
  client: Client;
  emergency: Emergency;
  clientBirthDate: Date;
  forecastEndDate: Date;
  forecastStartDate: Date;
  forecastEndDateYear: number;
  forecastStartDateYear: number;
  
  isSimulationCompleted = false;
  activeTab: 'baseline' | 'simulated' = 'simulated';
  baselineResult: {
    series: any[];
    categories: string[];
    timelineEvents: any[];
  } | null = null;
  simulationResult: {
    series: any[];
    categories: string[];
    timelineEvents: any[];
  } | null = null;

  constructor(
    private dialogRef: MatDialogRef<SimulateEmergencyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private emergenciesHttpService: EmergenciesHttpService
  ) {
    this.client = data.client;
    this.amountCycles = data.amountCycles;
    this.escalationRates = data.escalationRates;
    this.timeline = data.timeline;
    this.eventsList = data.eventsList;
    this.incomes = data.incomes;
    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.clientBirthDate = data.clientBirthDate;
    this.forecastEndDate = data.forecastEndDate;
    this.forecastStartDate = data.forecastStartDate;
    this.forecastEndDateYear = data.forecastEndDateYear;
    this.forecastStartDateYear = data.forecastStartDateYear;
    this.emergency = data.emergency;

    this.clientBirthYear = moment(this.clientBirthDate).year();
    const birthDate = new Date(this.clientBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // adjust age if birth month/day is in the future
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    this.clientAge = age;

    if (this.forecastStartDateYear - this.clientBirthYear > this.clientAge)
      this.clientBirthYear = this.clientBirthYear + 1

    var iterations = this.forecastEndDateYear - this.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = this.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.showStartEnd = false;

    this.simulateEmergencyForm = this.fb.group({
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(1)]],
      cycle: [this.amountCycles[0].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      escalationRate: [this.escalationRates[0]?.value, Validators.required],
      customEscalationRate: [0],
      stopIncome: [false],
      stoppedIncomeId: [null]
    });

    this.simulateEmergencyForm.get('currencySymbol')?.disable();
    this.simulateEmergencyForm.setValidators(this.endOnOrAfterStartValidator());
    this.simulateEmergencyForm.updateValueAndValidity({ emitEvent: false });

    this.onCycleValueChange(this.amountCycles[0].id);

    this.simulateEmergencyForm.get('stopIncome')?.valueChanges
      .subscribe((checked: boolean) => {
        const incomeControl = this.simulateEmergencyForm.get('stoppedIncomeId');

        if (checked) {
          incomeControl?.setValidators([Validators.required]);
        } else {
          incomeControl?.clearValidators();
          incomeControl?.setValue(null);
        }

        incomeControl?.updateValueAndValidity();
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCycleValueChange(event: any) {
    const selectedCycle = this.amountCycles.find(cycle => cycle.id === event);
    const isOneOff = selectedCycle?.description === 'One-off';

    this.showStartEnd = !isOneOff;

    const startControl = this.simulateEmergencyForm.get('start');
    const endControl = this.simulateEmergencyForm.get('end');
    const escalationControl = this.simulateEmergencyForm.get('escalationRate');

    if (isOneOff) {
      const defaultYear = new Date().getFullYear() + 5;

      startControl?.setValue(defaultYear);
      endControl?.setValue(null);

      endControl?.clearValidators();
      escalationControl?.clearValidators();
    } else {
      endControl?.setValidators(Validators.required);
      escalationControl?.setValidators(Validators.required);
    }

    endControl?.updateValueAndValidity();
    escalationControl?.updateValueAndValidity();
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
    const customControl = this.simulateEmergencyForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }

    customControl?.updateValueAndValidity();
  }

  simulateEmergency(): void {
    this.simulateEmergencyForm.markAllAsTouched();
    this.simulateEmergencyForm.markAsDirty();

    if (this.simulateEmergencyForm.valid) {
      const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.simulateEmergencyForm.get('customEscalationRate')?.value
        : this.simulateEmergencyForm.get('escalationRate')?.value;
      const matchedRate = this.escalationRates.find((x) => x.value === escalationRateValue);
      const stopIncome = this.simulateEmergencyForm.get('stopIncome')?.value;
      const stoppedIncomeId = this.simulateEmergencyForm.get('stoppedIncomeId')?.value;

      var simulateEmergency: SimulateEmergencyModel = {
        id: null,
        description: "",
        amount: {
          amount: this.simulateEmergencyForm.get('amount')?.value,
          currencySymbol: this.simulateEmergencyForm.get('currencySymbol')?.value,
          cycle: {
            id: this.simulateEmergencyForm.get('cycle')?.value ?? '',
            description:
              this.amountCycles.find(
                (x) => x.id === this.simulateEmergencyForm.get('cycle')?.value
              )?.description ?? '',
          },
        },
        start: {
          age:
            this.simulateEmergencyForm.get('start')?.value !== null &&
              this.simulateEmergencyForm.get('start')?.value !== ''
              ? this.simulateEmergencyForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            this.simulateEmergencyForm.get('start')?.value !== null &&
              this.simulateEmergencyForm.get('start')?.value !== ''
              ? this.simulateEmergencyForm.get('start')?.value
              : 0,
        },
        end: {
          age:
            this.simulateEmergencyForm.get('end')?.value !== null &&
              this.simulateEmergencyForm.get('end')?.value !== ''
              ? this.simulateEmergencyForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
            this.simulateEmergencyForm.get('end')?.value !== null &&
              this.simulateEmergencyForm.get('end')?.value !== ''
              ? this.simulateEmergencyForm.get('end')?.value
              : 0,
        },
        escalationRate: escalationRateValue !== null && escalationRateValue !== ''
          ? matchedRate ?? {
            description: this.selectedEscalationDescription ?? '', // Use actual description
            value: escalationRateValue
          }
          : {
            description: '',
            value: 0
          },
        stopIncome: stopIncome,
        stoppedIncomeId: stopIncome ? stoppedIncomeId : null,
        cashflowId: this.cashflowId
      };

      this.emergenciesHttpService.simulateEmergency(simulateEmergency)
        .subscribe({
          next: (res: any) => {
            if (!res || !res.baseline || !res.simulated || 
              !res.baseline?.series || !res.baseline?.categories ||
              !res.simulated?.series || !res.simulated?.categories) {
              return;
            }

            this.baselineResult = res.baseline;
            const simulated = res.simulated;
            // simulated.timelineEvents = null;
            this.simulationResult = simulated;

            // console.log(this.baselineResult);
            // console.log(this.simulationResult);
                
            this.activeTab = 'simulated';
            this.dialogRef.updateSize('92vw', '88vh');
            this.isSimulationCompleted = true;
          },
          error: (err: any) => {
            console.error(err);
            // this.toastr.error('Failed to update cover', 'Error');
          }
        });
    }
  }

  get isCustomEscalationSelected(): boolean {
    const selectedValue = this.simulateEmergencyForm.get('escalationRate')?.value;

    // find exact match by both value and description
    return this.escalationRates.some(e =>
      e.value === selectedValue && e.description === 'Increases at custom rate'
    );
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('start')?.value;
      const end = group.get('end')?.value;
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
}
