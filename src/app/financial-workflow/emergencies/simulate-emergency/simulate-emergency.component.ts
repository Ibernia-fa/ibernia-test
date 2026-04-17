import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { AutoFocusDirective } from 'src/app/directives/auto-focus.directive';
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
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';
import {
  getCashflowDialogEndCalendarYear,
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionAgeForClientEvent,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import { resolveEscalationMatch } from 'src/app/shared/utils/escalation-rate-utils';
import { getStartEndDurationLabel } from 'src/app/shared/utils/start-end-duration-label';
import { extractEventId, resolveYear } from 'src/app/shared/utils/event-date-utils';
import { TimelineHttpService } from '../../timeline/services/timeline-http.service';

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
    AutoFocusDirective,
    SavingsBarStackedChartComponent,
    TranslateModule,
    TranslateIncomeExpenseLabelPipe,
    TranslateEscalationDescriptionPipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './simulate-emergency.component.html',
  styleUrl: './simulate-emergency.component.scss',
})
export class SimulateEmergencyComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('stoppedIncomeSelect') stoppedIncomeSelect?: MatSelect;
  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.simulateEmergencyForm.get('amount')?.setValue(value);
  }

  /** Fires only on user interaction, not on programmatic `setValue` (load / life-insurance defaults). */
  onStopIncomeUserToggled(event: MatCheckboxChange): void {
    if (!event.checked) {
      return;
    }
    afterNextRender(
      () => {
        this.stoppedIncomeSelect?.open();
      },
      { injector: this.injector },
    );
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
  timeline: FinancialTimeline | undefined;
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
  /** Start year of the last completed simulation; drives chart column highlight when emergency cost is 0. */
  completedEmergencyHighlightYear: number | null = null;

  get incomeDisplayLabelContext(): IncomeDisplayLabelContext {
    const c = this.client;
    return {
      hasPartner: !!c?.partnerDetail,
      clientFirstName: c?.clientDetails?.firstName ?? '',
      partnerFirstName: c?.partnerDetail?.firstName ?? '',
    };
  }

  /** Incomes that can be stopped: positive amount only. */
  get stoppableIncomes(): FinancialViewModel[] {
    return (this.incomes ?? []).filter(
      (i) => Number(i?.amount?.amount ?? 0) > 0,
    );
  }

  constructor(
    private dialogRef: MatDialogRef<SimulateEmergencyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private emergenciesHttpService: EmergenciesHttpService,
    private timelineHttpService: TimelineHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private injector: Injector,
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
      escalationRate: [this.escalationRates[0]?.description ?? '', Validators.required],
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
    } else {
      // Allow 0: user can simulate “no expense” but still see the emergency year on the chart.
      amountControl?.setValidators([Validators.required, Validators.min(0)]);
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
          amountControl?.setValidators([Validators.required, Validators.min(0)]);
          incomeControl?.clearValidators();
          incomeControl?.setValue(null);

          const v = amountControl?.value;
          if (v === null || v === undefined || v === '') {
            amountControl?.setValue(null, { emitEvent: false });
          }
        }

        amountControl?.updateValueAndValidity();
        incomeControl?.updateValueAndValidity();
      });

    this.simulateEmergencyForm.setValidators(this.endOnOrAfterStartValidator());
    this.simulateEmergencyForm.updateValueAndValidity({ emitEvent: false });
    this.selectedEscalationDescription = this.escalationRates[0]?.description ?? '';
    this.onCycleValueChange(this.amountCycles[0].id);

    if (this.emergencyExpense) {
      this.populateForm(this.emergencyExpense);
    } else if (this.isLifeInsurance(this.emergency)) {
      this.applyLifeInsuranceDefaults();
    } else if (this.isDisability(this.emergency)) {
      this.applyDisabilityDefaults();
    }
  }

  ngOnInit(): void {
    const cfId = this.cashflow?.id;
    if (!cfId) return;

    this.timelineHttpService
      .getTimelineWithLinkedFinancialRecordsByCashflowId(cfId)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
      )
      .subscribe((response) => {
        if (!response?.timeline) return;
        this.timeline = response.timeline;
        this.eventsList = (this.timeline?.clientEvents ?? []).sort(
          (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
        );
      });
  }

  private isLifeInsurance(emergency: Emergency): boolean {
    if (!emergency || emergency.type !== 1) return false; // type 1 = insurance
    const name = (emergency.name ?? '').toString().trim().toLowerCase();
    return name.includes('life') || name.includes('vita'); // English + Italian
  }

  private isDisability(emergency: Emergency): boolean {
    if (!emergency || emergency.type !== 1) return false;
    const name = (emergency.name ?? '').toString().trim().toLowerCase();
    return name.includes('disability') || name.includes('disabilità') || name.includes('invalidità');
  }

  private applyLifeInsuranceDefaults(): void {
    if (this.stoppableIncomes.length === 0) {
      return;
    }
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

  private applyDisabilityDefaults(): void {
    const amountControl = this.simulateEmergencyForm.get('amount');
    const incomeControl = this.simulateEmergencyForm.get('stoppedIncomeId');

    if (!amountControl?.value) {
      amountControl?.setValue(0, { emitEvent: false });
    }

    const monthlyCycle = this.amountCycles.find(
      (c) => (c.description ?? '').toLowerCase() === 'every month',
    );
    if (monthlyCycle) {
      this.simulateEmergencyForm.get('cycle')?.setValue(monthlyCycle.id, { emitEvent: false });
      this.onCycleValueChange(monthlyCycle.id);
    }

    this.simulateEmergencyForm.get('end')?.setValue(this.dialogEndCalendarYear, { emitEvent: false });

    const inflationRate = this.escalationRates.find(
      (r) => (r.description ?? '').toLowerCase().includes('same rate as inflation'),
    );
    if (inflationRate) {
      this.simulateEmergencyForm.get('escalationRate')?.setValue(inflationRate.description, { emitEvent: false });
      this.selectedEscalationDescription = inflationRate.description;
    }

    if (this.stoppableIncomes.length > 0) {
      const stopIncomeCtrl = this.simulateEmergencyForm.get('stopIncome');
      stopIncomeCtrl?.setValue(true, { emitEvent: true });

      const mainClientSalary = this.getMainClientSalary();
      if (mainClientSalary?.id) {
        incomeControl?.setValue(mainClientSalary.id, { emitEvent: false });
      }

      amountControl?.setValidators([Validators.required, Validators.min(0)]);
      incomeControl?.setValidators([Validators.required]);
      amountControl?.updateValueAndValidity();
      incomeControl?.updateValueAndValidity();
    }
  }

  private getMainClientSalary(): FinancialViewModel | null {
    const salaries = this.stoppableIncomes.filter(
      (i) => (i?.description ?? '').toString().trim().toLowerCase() === 'salary' && i?.id
    );
    return salaries.length > 0 ? salaries[0] : null;
  }

  get startEndDurationHint(): string | null {
    if (!this.showStartEnd) return null;
    return getStartEndDurationLabel(
      this.simulateEmergencyForm.get('start')?.value,
      this.simulateEmergencyForm.get('end')?.value,
      this.eventsList,
      this.translate,
    );
  }

  displayAgeForTimelineEvent(event: any): number {
    return getProjectionAgeForClientEvent(event, {
      clientBirthDate: this.clientBirthDate,
      partnerBirthDate: this.client?.partnerDetail?.birthDate,
      forecastStartDate: this.forecastStartDate,
      planDuration: this.cashflow?.planDuration,
      projectionInclusiveEndYear: this.dialogEndCalendarYear,
    });
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
    const description = (event.value as string) ?? '';

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
      const selectedEscDesc = this.simulateEmergencyForm.get('escalationRate')?.value as string;
      const isCustomEscalation = selectedEscDesc === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.simulateEmergencyForm.get('customEscalationRate')?.value
        : this.escalationRates.find((x) => x.description === selectedEscDesc)?.value;
      const matchedRate = !isCustomEscalation
        ? this.escalationRates.find((x) => x.description === selectedEscDesc)
        : undefined;
      const escalationRateModel = isCustomEscalation
        ? {
          description: 'Increases at custom rate',
          value: escalationRateValue
        }
        : (matchedRate ?? {
          description: selectedEscDesc ?? '',
          value: escalationRateValue
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

      const endRaw = this.simulateEmergencyForm.get('end')?.value;
      const endYearResolved =
        endRaw !== null && endRaw !== ''
          ? resolveYear(endRaw, this.eventsList)
          : 0;
      const endEventId = extractEventId(endRaw);

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
            endRaw !== null && endRaw !== ''
              ? getPersistedAgeForCalendarYear(
                  this.clientBirthDate,
                  endYearResolved,
                  this.forecastStartDate,
                  this.data.cashflow?.planDuration,
                  this.dialogEndCalendarYear,
                )
              : 0,
          year:
            endRaw !== null && endRaw !== ''
              ? endYearResolved
              : 0,
        },
        endEventId: endEventId ?? null,
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
            const startVal = this.simulateEmergencyForm.get('start')?.value;
            const y =
              startVal === null || startVal === undefined || startVal === ''
                ? NaN
                : Number(startVal);
            this.completedEmergencyHighlightYear = Number.isFinite(y) ? y : null;
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

    // Unify categories so both reports share the same x-axis
    // (prevents full chart rebuild when switching tabs).
    const allCategoriesSet = new Set<string>([
      ...baseline.categories.map(String),
      ...simulated.categories.map(String),
    ]);
    const unifiedCategories = Array.from(allCategoriesSet).sort(
      (a, b) => Number(a) - Number(b),
    );

    const padReport = (report: typeof baseline, oldCategories: string[]) => {
      const insertionMap = unifiedCategories.map((c) => oldCategories.indexOf(c));
      report.series.forEach((s: any) => {
        s.data = insertionMap.map((idx) => (idx >= 0 ? s.data[idx] : 0));
      });
      report.categories = [...unifiedCategories];
    };

    if (baseline.categories.join(',') !== unifiedCategories.join(',')) {
      padReport(baseline, baseline.categories.map(String));
    }
    if (simulated.categories.join(',') !== unifiedCategories.join(',')) {
      padReport(simulated, simulated.categories.map(String));
    }

    // Unify series names so both reports have the same stacked structure.
    const allNames: string[] = [];
    [...simulated.series, ...baseline.series].forEach((s: any) => {
      if (!allNames.includes(s.name)) allNames.push(s.name);
    });

    const categoryCount = unifiedCategories.length;
    allNames.forEach(name => {
      if (!baseline.series.find((s: any) => s.name === name)) {
        const ref = simulated.series.find((s: any) => s.name === name);
        if (ref) {
          baseline.series.push({ ...ref, data: new Array(categoryCount).fill(0) });
        }
      }
      if (!simulated.series.find((s: any) => s.name === name)) {
        const ref = baseline.series.find((s: any) => s.name === name);
        if (ref) {
          simulated.series.push({ ...ref, data: new Array(categoryCount).fill(0) });
        }
      }
    });

    const sortFn = (a: any, b: any) => allNames.indexOf(a.name) - allNames.indexOf(b.name);
    baseline.series.sort(sortFn);
    simulated.series.sort(sortFn);
  }

  get isCustomEscalationSelected(): boolean {
    return this.simulateEmergencyForm.get('escalationRate')?.value === 'Increases at custom rate';
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('start')?.value;
      const endRaw = group.get('end')?.value;
      const end = resolveYear(endRaw, this.eventsList);
      const endCtrl = group.get('end');

      // Only validate when both are present (or when end is present)
      if (endCtrl) {
        const existing = endCtrl.errors ?? null;

        if (
          start != null &&
          start !== '' &&
          endRaw != null &&
          endRaw !== '' &&
          end < Number(start)
        ) {
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

    const matchedEscalation = resolveEscalationMatch(
      this.escalationRates,
      expense.escalationRate,
    );

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
        end:
          expense.endEventId
            ? 'event:' + expense.endEventId
            : expense.end?.year ?? null,
        escalationRate: 'Increases at custom rate',
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
        end:
          expense.endEventId
            ? 'event:' + expense.endEventId
            : expense.end?.year ?? null,
        escalationRate: matchedEscalation?.description ?? this.escalationRates[0]?.description ?? '',
        stopIncome: expense.stopIncome ?? false
      }, { emitEvent: false });

      this.selectedEscalationDescription = matchedEscalation?.description ?? this.escalationRates[0]?.description ?? '';
    }

    this.onCycleValueChange(cycleId);

    if (expense.stopIncome) {
      this.simulateEmergencyForm.patchValue({
        stoppedIncomeId: expense.stoppedIncomeId ?? null
      }, { emitEvent: false });
    }

    const amountCtrl = this.simulateEmergencyForm.get('amount');
    const incomeCtrl = this.simulateEmergencyForm.get('stoppedIncomeId');
    if (expense.stopIncome) {
      amountCtrl?.setValidators([Validators.required, Validators.min(0)]);
      incomeCtrl?.setValidators([Validators.required]);
    } else {
      amountCtrl?.setValidators([Validators.required, Validators.min(0)]);
      incomeCtrl?.clearValidators();
    }
    amountCtrl?.updateValueAndValidity({ emitEvent: false });
    incomeCtrl?.updateValueAndValidity({ emitEvent: false });

    const stopOn = this.simulateEmergencyForm.get('stopIncome')?.value;
    const sid = this.simulateEmergencyForm.get('stoppedIncomeId')?.value;
    if (stopOn && this.stoppableIncomes.length === 0) {
      this.simulateEmergencyForm.patchValue(
        { stopIncome: false, stoppedIncomeId: null },
        { emitEvent: false },
      );
      amountCtrl?.setValidators([Validators.required, Validators.min(0)]);
      incomeCtrl?.clearValidators();
      amountCtrl?.updateValueAndValidity({ emitEvent: false });
      incomeCtrl?.updateValueAndValidity({ emitEvent: false });
    } else if (
      stopOn &&
      sid &&
      !this.stoppableIncomes.some((i) => i.id === sid)
    ) {
      this.simulateEmergencyForm.patchValue(
        { stoppedIncomeId: null },
        { emitEvent: false },
      );
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

  /** Stable @for track key for timeline event options in end dropdown. */
  trackEndEventRow(event: {
    id?: string | null;
    name?: string | null;
    start?: { year?: number | null };
  }): string {
    const id = event?.id;
    if (id != null && String(id).length > 0) {
      return `id:${id}`;
    }
    const y = event?.start?.year ?? '';
    return `f:${event?.name ?? ''}:${y}`;
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
    const y = String(year);
    const emergencyData: number[] = report.categories.map(
      (category: string | number) =>
        String(category) === y ? amount : 0,
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
