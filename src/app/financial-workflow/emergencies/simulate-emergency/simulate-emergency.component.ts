import { Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
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
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import moment from 'moment';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { allCountries } from 'src/app/clients/models/country';
import { Client, ClientViewModel } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { Emergency } from '../models/emergencies.model';
import { FinancialViewModel } from '../../income-expenses/model/income-expense';
import { Cycle, EscalationRate, FinancialTimeline } from '../../timeline/models/financial-timeline';
import { SimulateEmergencyModel } from '../models/simulate-emergency.model';
import { EmergenciesHttpService } from '../services/emergencies-http.service';
import { SavingsBarStackedChartComponent } from '../../reports/savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { getAmountCycleLabel } from 'src/app/shared/utils/amount-cycle-label';
import { TranslateIncomeExpenseLabelPipe } from 'src/app/core/pipes/translate-income-expense-label.pipe';
import { IncomeDisplayLabelContext } from 'src/app/shared/utils/income-display-label';
import { TranslateEscalationDescriptionPipe } from 'src/app/core/pipes/translate-escalation-description.pipe';
import {
  getCashflowDialogEndCalendarYear,
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';

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
    ThousandSeparatorInputDirective,
    SavingsBarStackedChartComponent,
    TranslateModule,
    TranslateIncomeExpenseLabelPipe,
    TranslateEscalationDescriptionPipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './simulate-emergency.component.html',
  styleUrl: './simulate-emergency.component.scss',
})
export class SimulateEmergencyComponent implements OnDestroy {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
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
  client: Client;
  clientViewModel: ClientViewModel;
  cashflow: Cashflow;
  emergency: Emergency;
  emergencyExpense: SimulateEmergencyModel | null;
  clientBirthDate: Date;
  forecastEndDate: Date;
  forecastStartDate: Date;
  forecastEndDateYear: number;
  forecastStartDateYear: number;
  dialogEndCalendarYear = 0;

  isSimulating = false;
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
  existingEmergencyId: string | null = null;
  isUpdateParentItem = false;
  currentYear: number = new Date().getFullYear();
  displayedReport: {
    series: any[];
    categories: string[];
    timelineEvents: any[];
  } | null = null;
  simulationChartHeight: number = 420;

  get incomeDisplayLabelContext(): IncomeDisplayLabelContext {
    const c = this.client;
    return {
      hasPartner: !!c?.partnerDetail,
      clientFirstName: c?.clientDetails?.firstName ?? '',
      partnerFirstName: c?.partnerDetail?.firstName ?? '',
    };
  }

  constructor(
    private dialogRef: MatDialogRef<SimulateEmergencyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private emergenciesHttpService: EmergenciesHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
    this.client = data.client;
    this.cashflow = data.cashflow;
    this.clientViewModel = data.cashflow.client;
    this.amountCycles = data.amountCycles;
    this.escalationRates = data.escalationRates;
    this.timeline = data.timeline;
    this.eventsList = data.eventsList;
    this.incomes = data.incomes;
    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.clientBirthDate = data.clientBirthDate;
    this.forecastEndDate = data.forecastEndDate;
    this.forecastStartDate = data.forecastStartDate;
    this.forecastEndDateYear = data.forecastEndDateYear;
    this.forecastStartDateYear = data.forecastStartDateYear;
    this.emergency = data.emergency;
    this.emergencyExpense = data.emergencyExpense;

    this.clientBirthYear = moment(this.clientBirthDate).year();
    const birthDate = new Date(this.clientBirthDate);
    const forecastStart = this.forecastStartDate
      ? new Date(this.forecastStartDate)
      : new Date(this.forecastStartDateYear, 0, 1);
    this.clientAge = getCompletedYearsAgeAtDate(birthDate, forecastStart);

    const resolvedEndYear = getCashflowDialogEndCalendarYear(
      data.clientBirthDate,
      data.cashflow?.planDuration,
      data.forecastEndDateYear,
    );
    let endYear = Number.isFinite(resolvedEndYear)
      ? resolvedEndYear
      : Number(data.forecastEndDateYear);
    if (!Number.isFinite(endYear)) {
      endYear = this.forecastStartDateYear;
    }
    this.dialogEndCalendarYear = endYear;
    const iterations = endYear - this.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = this.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.showStartEnd = false;

    this.simulateEmergencyForm = this.fb.group({
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: ['', [Validators.required]],
      cycle: [this.amountCycles[0].id, Validators.required],
      start: ['', Validators.required],
      end: [''],
      escalationRate: [this.escalationRates[0]?.value, Validators.required],
      customEscalationRate: [''],
      stopIncome: [false],
      stoppedIncomeId: [null]
    });

    this.simulateEmergencyForm.get('currencySymbol')?.disable();
    const amountControl = this.simulateEmergencyForm.get('amount');
    const incomeControl = this.simulateEmergencyForm.get('stoppedIncomeId');
    const stopIncomeInitial = this.simulateEmergencyForm.get('stopIncome')?.value;

    if (stopIncomeInitial) { // allow 0 or more
      amountControl?.setValidators([Validators.required, Validators.min(0)]);
      incomeControl?.setValidators([Validators.required]);
    } else { // must be > 0
      amountControl?.setValidators([Validators.required, Validators.min(1)]);
      incomeControl?.clearValidators();
      incomeControl?.setValue(null);
    }

    amountControl?.updateValueAndValidity();
    incomeControl?.updateValueAndValidity();

    this.simulateEmergencyForm.get('stopIncome')?.valueChanges
      .subscribe((checked: boolean) => {
        if (checked) {
          amountControl?.setValidators([Validators.required, Validators.min(0)]);
          incomeControl?.setValidators([Validators.required]);

          if (!amountControl?.value) {
            amountControl?.setValue(0, { emitEvent: false });
          }
        } else {
          amountControl?.setValidators([Validators.required, Validators.min(1)]);
          incomeControl?.clearValidators();
          incomeControl?.setValue(null);

          if (!amountControl?.value) {
            amountControl?.setValue(null, { emitEvent: false });
          }
        }

        amountControl?.updateValueAndValidity();
        incomeControl?.updateValueAndValidity();
      });

    this.simulateEmergencyForm.setValidators(this.endOnOrAfterStartValidator());
    this.simulateEmergencyForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.amountCycles[0].id);

    if (this.emergencyExpense) {
      this.populateForm(this.emergencyExpense);
    } else if (this.isLifeInsurance(this.emergency)) {
      this.applyLifeInsuranceDefaults();
    }
  }

  private isLifeInsurance(emergency: Emergency): boolean {
    if (!emergency || emergency.type !== 1) return false; // type 1 = insurance
    const name = (emergency.name ?? '').toString().trim().toLowerCase();
    return name.includes('life') || name.includes('vita'); // English + Italian
  }

  private applyLifeInsuranceDefaults(): void {
    const mainClientSalary = this.getMainClientSalary();
    const stopIncomeCtrl = this.simulateEmergencyForm.get('stopIncome');
    const stoppedIncomeCtrl = this.simulateEmergencyForm.get('stoppedIncomeId');
    stopIncomeCtrl?.setValue(true, { emitEvent: true });
    if (mainClientSalary?.id) {
      stoppedIncomeCtrl?.setValue(mainClientSalary.id, { emitEvent: false });
    }

    const amountControl = this.simulateEmergencyForm.get('amount');
    const incomeControl = this.simulateEmergencyForm.get('stoppedIncomeId');
    amountControl?.setValidators([Validators.required, Validators.min(0)]);
    incomeControl?.setValidators([Validators.required]);
    if (!amountControl?.value) {
      amountControl?.setValue(0, { emitEvent: false });
    }
    amountControl?.updateValueAndValidity();
    incomeControl?.updateValueAndValidity();
  }

  private getMainClientSalary(): FinancialViewModel | null {
    const salaries = (this.incomes ?? []).filter(
      (i) => (i?.description ?? '').toString().trim().toLowerCase() === 'salary' && i?.id
    );
    return salaries.length > 0 ? salaries[0] : null;
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

  getCycleLabel(cycle: { description?: string } | null | undefined): string {
    return getAmountCycleLabel(cycle, this.translate);
  }

  getEmergencyLabel(emergency: { name?: string } | null | undefined): string {
    const raw = (emergency?.name ?? '').toString().trim();
    if (!raw) return '';

    const normalized = raw.toLowerCase();
    const key =
      normalized === 'home'
        ? 'EMERGENCIES.TYPE_HOME'
        : normalized === 'life'
          ? 'EMERGENCIES.TYPE_LIFE'
          : normalized === 'disability'
            ? 'EMERGENCIES.TYPE_DISABILITY'
            : normalized === 'health'
              ? 'EMERGENCIES.TYPE_HEALTH'
              : normalized === 'natural hazards'
                ? 'EMERGENCIES.TYPE_NATURAL_HAZARDS'
                : normalized === 'will'
                  ? 'EMERGENCIES.TYPE_WILL'
                  : null;

    return key ? this.translate.instant(key) : raw;
  }

  getTimelineEventLabel(rawName: string): string {
    return translateTimelineEventDisplayName(this.translate, rawName);
  }

  onEscalationRateChange(event: MatSelectChange): void {
    const val = event.value;
    const rate = this.escalationRates.find((e) => e.value === val);
    const description = rate?.description ?? null;

    this.selectedEscalationDescription = description ?? '';
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
      const selectedEscalationRateValue = this.simulateEmergencyForm.get('escalationRate')?.value;
      const matchedRate = this.escalationRates.find((x) => x.value === selectedEscalationRateValue);
      const escalationRateModel = isCustomEscalation
        ? {
          description: 'Increases at custom rate',
          value: escalationRateValue
        }
        : (matchedRate ?? {
          description: this.selectedEscalationDescription ?? '',
          value: selectedEscalationRateValue
        });
      const stopIncome = this.simulateEmergencyForm.get('stopIncome')?.value;
      const stoppedIncomeId = this.simulateEmergencyForm.get('stoppedIncomeId')?.value;

      // convert amount back to number if it's still a formatted string
      const rawAmountControl = this.simulateEmergencyForm.get('amount');
      if (rawAmountControl) {
        const currentValue = rawAmountControl.value;
        rawAmountControl.setValue(
          parseFormattedNumber(currentValue, this.translate.currentLang),
          { emitEvent: false },
        );
      }
      const rawAmount = this.simulateEmergencyForm.get('amount')?.value;


      var simulateEmergency: SimulateEmergencyModel = {
        id: this.existingEmergencyId,
        description: "",
        amount: {
          amount: rawAmount,
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
              ? getPersistedAgeForCalendarYear(
                  this.clientBirthDate,
                  this.simulateEmergencyForm.get('start')?.value,
                  this.forecastStartDate,
                  this.data.cashflow?.planDuration,
                  this.dialogEndCalendarYear,
                )
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
              ? getPersistedAgeForCalendarYear(
                  this.clientBirthDate,
                  this.simulateEmergencyForm.get('end')?.value,
                  this.forecastStartDate,
                  this.data.cashflow?.planDuration,
                  this.dialogEndCalendarYear,
                )
              : 0,
          year:
            this.simulateEmergencyForm.get('end')?.value !== null &&
              this.simulateEmergencyForm.get('end')?.value !== ''
              ? this.simulateEmergencyForm.get('end')?.value
              : 0,
        },
        escalationRate: escalationRateValue !== null && escalationRateValue !== ''
          ? escalationRateModel
          : {
            description: '',
            value: 0
          },
        stopIncome: stopIncome,
        stoppedIncomeId: stopIncome ? stoppedIncomeId : null,
        emergencyId: this.emergency.id,
        client: this.clientViewModel,
        cashflow: this.cashflow
      };

      this.isSimulating = true;
      this.emergenciesHttpService.simulateEmergency(simulateEmergency)
        .subscribe({
          next: (res: any) => {
            this.isSimulating = false;
            if (!res || !res.baseline || !res.simulated ||
              !res.baseline?.series || !res.baseline?.categories ||
              !res.simulated?.series || !res.simulated?.categories) {
              return;
            }

            this.baselineResult = res.baseline;
            const simulated = res.simulated;
            simulated.timelineEvents = [];

            const emergencyAmount = this.simulateEmergencyForm.get('amount')?.value;
            const selectedYear = this.simulateEmergencyForm.get('start')?.value;
            const emergencySeries = this.buildEmergencySeries(
              simulated,
              selectedYear?.toString() ?? '',
              emergencyAmount);

            if (!this.baselineResult || !this.baselineResult.series) return;
            this.simulationResult = simulated;

            simulated.series = [
              ...simulated.series,
              emergencySeries
            ];

            this.alignSeriesStructure();

            this.activeTab = 'baseline';
            this.displayedReport = this.baselineResult;
            this.dialogRef.updateSize('92vw', '88vh');
            this.simulationChartHeight = Math.max(Math.round(window.innerHeight * 0.88 - 150), 300);
            this.emergencyExpense = simulateEmergency;
            this.emergencyExpense.id = res.emergencyExpenseId;
            this.isSimulationCompleted = true;
            this.isUpdateParentItem = true;

            this.activeTab = 'simulated';
            this.displayedReport = this.simulationResult;
          },
          error: (err: any) => {
            this.isSimulating = false;
            console.error(err);
            this.toastr.error(this.translate.instant('ERROR.FAILED_SIMULATE_COVER'), this.translate.instant('LABEL.ERROR'));
          }
        });
    }
  }

  closeDialog(): void {
    if (this.isUpdateParentItem) {
      this.dialogRef.close(this.emergencyExpense);
    }
    else {
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
  }

  switchToTab(tab: 'baseline' | 'simulated'): void {
    this.activeTab = tab;
    this.displayedReport = tab === 'baseline' ? this.baselineResult : this.simulationResult;
  }

  private alignSeriesStructure(): void {
    if (!this.baselineResult || !this.simulationResult) return;
    const baseline = this.baselineResult;
    const simulated = this.simulationResult;

    const allNames: string[] = [];
    [...simulated.series, ...baseline.series].forEach((s: any) => {
      if (!allNames.includes(s.name)) allNames.push(s.name);
    });

    const categoryCount = baseline.categories.length;
    allNames.forEach(name => {
      if (!baseline.series.find((s: any) => s.name === name)) {
        const ref = simulated.series.find((s: any) => s.name === name);
        if (ref) {
          baseline.series.push({ ...ref, data: new Array(categoryCount).fill(0) });
        }
      }
    });

    const sortFn = (a: any, b: any) => allNames.indexOf(a.name) - allNames.indexOf(b.name);
    baseline.series.sort(sortFn);
    simulated.series.sort(sortFn);
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

  private populateForm(expense: any): void {
    this.existingEmergencyId = expense.id ?? null;
    const cycleId = expense.amount?.cycle?.id ?? this.amountCycles[0].id;
    const amount = expense.amount?.amount ?? 0;

    const matchedEscalation = this.escalationRates.find(x => x.value === expense.escalationRate?.value);

    if (
      expense.escalationRate &&
      expense.escalationRate.description === 'Increases at custom rate'
    ) {
      this.escalationRates = this.escalationRates.filter(
        x => x.description !== 'Increases at custom rate'
      );
      this.escalationRates.push({
        description: 'Increases at custom rate',
        value: expense.escalationRate.value
      });

      this.simulateEmergencyForm.patchValue({
        cycle: cycleId,
        amount,
        start: expense.start?.year ?? null,
        end: expense.end?.year ?? null,
        escalationRate: expense.escalationRate.value,
        customEscalationRate: expense.escalationRate.value,
        stopIncome: expense.stopIncome ?? false
      }, { emitEvent: false });

      this.selectedEscalationDescription = 'Increases at custom rate';

      const customControl = this.simulateEmergencyForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.updateValueAndValidity();
    } else {
      this.simulateEmergencyForm.patchValue({
        cycle: cycleId,
        amount,
        start: expense.start?.year ?? null,
        end: expense.end?.year ?? null,
        escalationRate: matchedEscalation?.value ?? this.escalationRates[0]?.value,
        stopIncome: expense.stopIncome ?? false
      }, { emitEvent: false });

      this.selectedEscalationDescription = matchedEscalation?.description ?? '';
    }

    this.onCycleValueChange(cycleId);

    if (expense.stopIncome) {
      this.simulateEmergencyForm.patchValue({
        stoppedIncomeId: expense.stoppedIncomeId ?? null
      }, { emitEvent: false });
    }

    this.simulateEmergencyForm.updateValueAndValidity();

    // Ensure patched amount displays with thousand separators immediately
    setTimeout(() => {
      const el = this.amountInput?.nativeElement;
      const value = this.simulateEmergencyForm.get('amount')?.value;
      if (!el || value === null || value === undefined || value === '') return;
      el.value = Number(value).toLocaleString('en-US');
      el.dispatchEvent(new Event('blur'));
    });
  }

  getStartYear(): number {
    const val = this.simulateEmergencyForm.get('start')?.value;
    return typeof val === 'number' && Number.isFinite(val) ? val : this.forecastStartDateYear;
  }

  getEndEvents(): any[] {
    const startYear = this.getStartYear();
    return (this.eventsList ?? []).filter((e: any) => (e?.start?.year ?? 0) >= startYear);
  }

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }

  getAgeForYear(year: number): number {
    const a = getProjectionColumnAgeLabel(
      this.clientBirthDate,
      Number(year),
      this.forecastStartDate,
      this.data.cashflow?.planDuration,
      this.dialogEndCalendarYear,
    );
    return Number.isNaN(a) ? 0 : a;
  }

  private buildEmergencySeries(report: any, year: string, amount: number): any {
    const emergencyData: number[] = report.categories.map((category: string) =>
      category === year ? amount : 0
    );

    return {
      id: 'emergency-expense',
      name: 'Emergency Expense',
      data: emergencyData,
      color: '#fac2beff',
      className: 'emergency-expense-series',
      order: report.series?.length ?? 0,
      stack: 'stack1',
      fill: { opacity: 1 },
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.03
          }
        }
      }
    };
  }
}
