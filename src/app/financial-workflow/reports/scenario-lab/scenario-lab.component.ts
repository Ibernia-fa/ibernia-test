import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subject,
  combineLatest,
  of,
  filter,
  takeUntil,
  switchMap,
  tap,
  catchError,
} from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import moment from 'moment';

import { FinancialWorkflowService } from '../../services/financial-workflow.service';
import { TimelineHttpService } from '../../timeline/services/timeline-http.service';
import { SavingsPotsHttpService } from '../../saving-pots/services/savings-pots-http.service';
import {
  ReportsHttpService,
  ReportScenarioPayload,
} from '../services/reports-http.service';
import { CashflowHttpService } from 'src/app/clients/services/cashflow-http.service';
import { IncomeExpensesHttpService } from '../../income-expenses/services/income-expenses-http.service';
import { SettingsHttpService } from '../../settings/services/settings-http.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import {
  ClientEvent,
  Cycle,
  EscalationRate,
  EventIncomeType,
  FinancialRecordLineItem,
  FinancialTimeline,
  TimelineResponse,
} from '../../timeline/models/financial-timeline';
import {
  SavingPotsModel,
  ClientSaving,
} from '../../saving-pots/models/saving-pots.model';
import {
  FinancialViewModel,
  IncomeExpense,
} from '../../income-expenses/model/income-expense';
import { ChartSeries, TimelineEvent } from '../models/charts-series.model';
import { SavingsBarStackedChartComponent } from '../savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { ToastrService } from 'ngx-toastr';
import { ScenarioNameDialogComponent } from './scenario-name-dialog/scenario-name-dialog.component';
import { AddIncomeComponent } from '../../income-expenses/add-income/add-income.component';
import { AddExpenseComponent } from '../../income-expenses/add-expense/add-expense.component';
import {
  AddEventDialogComponent,
  EventType,
} from '../../timeline/add-event-dialog/add-event-dialog.component';
import { AddNewPotComponent } from '../../saving-pots/add-new-pot/add-new-pot.component';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';
import { formatClientPersonDisplayName } from 'src/app/shared/utils/person-display-name';
import { TranslateIncomeExpenseLabelPipe } from 'src/app/core/pipes/translate-income-expense-label.pipe';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';
import {
  IncomeDisplayLabelContext,
  isClientInheritanceApiDescription,
  isPartnerInheritanceApiDescription,
  isPartnerSalaryApiDescription,
  isPartnerStatePensionApiDescription,
} from 'src/app/shared/utils/income-display-label';
import { formatSavingPotSelectLabel } from 'src/app/shared/utils/saving-pot-select-label';
import {
  getCashflowDialogEndCalendarYear,
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getPlanEndCalendarYear,
  getProjectionAgeForClientEvent,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import {
  getReportYearBounds,
  parseReportCategoryYears,
} from 'src/app/shared/utils/chart-series-year-range';
import {
  resolveClientEventEndCalendarYear,
  resolveIncomeMarkerCalendarYear,
} from 'src/app/shared/utils/event-date-utils';

@Component({
  selector: 'app-scenario-lab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatIconModule,
    SavingsBarStackedChartComponent,
    TranslateModule,
    TablerIconsModule,
    TranslateIncomeExpenseLabelPipe,
  ],
  templateUrl: './scenario-lab.component.html',
  styleUrl: './scenario-lab.component.scss',
})
export class ScenarioLabComponent implements OnInit, OnDestroy {
  cashflowId: string;
  cashflow: Cashflow | null = null;
  client: Client | null = null;
  financialTimeline: FinancialTimeline | null = null;
  savingPots: SavingPotsModel | null = null;
  report: ChartSeries | null = null;
  scenarioForecastEndDate: Date | null = null;
  baselineForecastStartDate: Date | null = null;
  baselineForecastEndDate: Date | null = null;
  isLoaderVisible = false;
  scenarioForm: FormGroup;
  /** Dropdowns use standalone controls so we can clear selection after picking (chips show edits). */
  goalDropdownControl = new FormControl<ClientEvent | null>(null);
  potDropdownControl = new FormControl<ClientSaving | null>(null);
  incomeDropdownControl = new FormControl<FinancialViewModel | null>(null);
  expenseDropdownControl = new FormControl<FinancialViewModel | null>(null);
  hasShortfall = false;
  firstShortfallAge: number | null = null;

  baselineReport: ChartSeries | null = null;
  displayedReport: ChartSeries | null = null;
  chartViewStartYear: number | null = null;
  chartViewEndYear: number | null = null;
  chartYearOptions: number[] = [];
  activeTab: 'before' | 'after' = 'after';
  hasSimulated = false;

  baselineInflationRate = 2.5;
  baselineRetirementAge = 65;
  minRetirementAge = 18;
  maxRetirementAge = 100;

  hasRetirementAge = false;
  hasPartnerRetirementAge = false;
  clientFirstName = '';
  partnerFirstName = '';
  baselinePartnerRetirementAge = 65;
  minPartnerRetirementAge = 18;
  maxPartnerRetirementAge = 100;

  get inflationEdited(): boolean {
    return (
      this.scenarioForm.get('inflationRate')?.value !==
      this.baselineInflationRate
    );
  }

  get retirementAgeEdited(): boolean {
    return (
      this.scenarioForm.get('retirementAge')?.value !==
      this.baselineRetirementAge
    );
  }

  get partnerRetirementAgeEdited(): boolean {
    return (
      this.scenarioForm.get('partnerRetirementAge')?.value !==
      this.baselinePartnerRetirementAge
    );
  }

  get hasPartner(): boolean {
    return !!this.client?.partnerDetail;
  }

  get incomeDisplayLabelContext(): IncomeDisplayLabelContext {
    return {
      hasPartner: this.hasPartner,
      clientFirstName: this.clientFirstName,
      partnerFirstName: this.partnerFirstName,
    };
  }

  compareGoalOptions = (a: ClientEvent | null, b: ClientEvent | null): boolean =>
    !!a && !!b && String(a.id) === String(b.id);

  comparePotOptions = (a: ClientSaving | null, b: ClientSaving | null): boolean =>
    !!a && !!b && String(a.id) === String(b.id);

  compareIncomeOptions = (
    a: FinancialViewModel | null,
    b: FinancialViewModel | null,
  ): boolean =>
    !!a &&
    !!b &&
    (a.id && b.id ? a.id === b.id : a.description === b.description);

  compareExpenseOptions = (
    a: FinancialViewModel | null,
    b: FinancialViewModel | null,
  ): boolean =>
    !!a &&
    !!b &&
    (a.id && b.id ? a.id === b.id : a.description === b.description);

  private clearCategoryDropdown(
    control: FormControl<
      ClientEvent | ClientSaving | FinancialViewModel | null
    >,
  ): void {
    queueMicrotask(() => control.setValue(null, { emitEvent: false }));
  }

  getSavingPotSelectLabel(pot: ClientSaving): string {
    return formatSavingPotSelectLabel(
      { name: pot.name, ownership: pot.ownership },
      this.client,
      this.translate,
    );
  }

  goalItems: ClientEvent[] = [];
  savingPotItems: ClientSaving[] = [];
  incomeItems: FinancialViewModel[] = [];
  expenseItems: FinancialViewModel[] = [];

  /** Dropdown options excluding items already in the edited list (same keys as chip `name`). */
  get availableGoalItems(): ClientEvent[] {
    const edited = new Set(this.editedGoals.map((e) => e.name));
    return this.goalItems.filter((g) => !edited.has(g.name));
  }

  get availableSavingPotItems(): ClientSaving[] {
    const edited = new Set(this.editedSavingPots.map((e) => e.name));
    return this.savingPotItems.filter((p) => !edited.has(p.name));
  }

  get availableIncomeItems(): FinancialViewModel[] {
    const edited = new Set(this.editedIncomes.map((e) => e.name));
    return this.incomeItems.filter(
      (i) => i.description != null && !edited.has(i.description),
    );
  }

  get availableExpenseItems(): FinancialViewModel[] {
    const edited = new Set(this.editedExpenses.map((e) => e.name));
    return this.expenseItems.filter(
      (e) => e.description != null && !edited.has(e.description),
    );
  }

  editedGoals: Array<{ name: string; item: ClientEvent | ClientEvent[] }> = [];
  editedSavingPots: Array<{ name: string; item: ClientSaving }> = [];
  editedIncomes: Array<{ name: string; item: FinancialViewModel }> = [];
  editedExpenses: Array<{ name: string; item: FinancialViewModel }> = [];

  incomeExpenseData: IncomeExpense | null = null;
  /** Linked financing child records (monthly payment, resale) from the financing timeline endpoint. */
  financingRecords: FinancialRecordLineItem[] = [];
  amountCycles: Cycle[] = [];
  escalationRates: EscalationRate[] = [];
  loggedInUserPreferences: any = null;
  userReturnRate: any = null;
  pensionFundReturnRate: any = null;

  private readonly DIALOG_SYSTEM_EVENTS = [
    'Wedding',
    'Travel',
    'Education',
    'New business',
  ];
  private readonly DIALOG_FINANCING_EVENTS = ['Home', 'Car', 'Boat'];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financialWorkflowService: FinancialWorkflowService,
    private timelineHttpService: TimelineHttpService,
    private savingPotsHttpService: SavingsPotsHttpService,
    private reportsHttpService: ReportsHttpService,
    private cashflowHttpService: CashflowHttpService,
    private incomeExpensesHttpService: IncomeExpensesHttpService,
    private settingsHttpService: SettingsHttpService,
    private settingsService: SettingsService,
    private navItemService: NavItemService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {
    this.cashflowId =
      this.route.parent?.snapshot.params['id'] ||
      this.route.snapshot.params['id'] ||
      '';
    this.scenarioForm = this.fb.group({
      inflationRate: [2.5],
      retirementAge: [65],
    });
  }

  ngOnInit(): void {
    this.navItemService.currentRouteName = 'Scenario Lab';
    this.setupScenarioFormAutoRefresh();

    this.settingsService.userData$
      .pipe(
        filter((v): v is NonNullable<typeof v> => v != null),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        const p = data.preferences;
        this.loggedInUserPreferences = p;
        this.userReturnRate = p.investmentReturn;
        this.pensionFundReturnRate = p.pensionFundReturn;
      });

    this.financialWorkflowService
      .loadClientCashflowMetadata(
        this.route.parent?.snapshot.params || this.route.snapshot.params,
      )
      .pipe(
        takeUntil(this.destroy$),
        tap(([client, cashflow]) => {
          this.client = client as Client;
          this.cashflow = cashflow as Cashflow;
        }),
        switchMap(() =>
          combineLatest([
            this.timelineHttpService.getTimelineWithLinkedFinancialRecordsByCashflowId(this.cashflowId),
            this.savingPotsHttpService.getAllSavingsPots(this.cashflowId),
            this.incomeExpensesHttpService.getAllIncomeExpenses(
              this.cashflowId,
            ),
            this.settingsHttpService.getAmountCycles(),
            this.settingsHttpService.getEscalationRates(this.client!.id),
          ]),
        ),
        tap(
          ([
            timelineResponse,
            savingPots,
            incomeExpense,
            amountCycles,
            escalationRatesResponse,
          ]) => {
            this.financialTimeline = timelineResponse.timeline;
            this.financingRecords = timelineResponse.financialRecords ?? [];
            this.savingPots = savingPots;
            this.incomeExpenseData = incomeExpense;
            this.amountCycles = amountCycles;
            this.escalationRates = patchInflationRateDescription(
              escalationRatesResponse?.escalationRates ?? [],
              this.cashflow?.inflationRate ?? 0,
            );
            this.baselineForecastStartDate = this.financialTimeline?.forecastStartDate
              ? new Date(this.financialTimeline.forecastStartDate)
              : null;
            this.initFormFromPlan();
            this.populateCategoryItems();
            this.baselineForecastEndDate = this.getMaxForecastEndDate();
          },
        ),
        switchMap(() => this.loadScenarioReport()),
        catchError((err) => {
          console.error('Scenario Lab load error', err);
          this.toastr.error(
            this.translate.instant('ERROR.FAILED_LOAD_SCENARIO_LAB'),
          );
          return of(null);
        }),
      )
      .subscribe((report) => {
        if (report) {
          this.injectTimelineEvents(report);
          this.report = report;
          if (!this.baselineReport) {
            this.baselineReport = this.deepCloneReport(report);
          }
          this.displayedReport = report;
          this.syncChartYearRangeFromDisplayedReport();
          this.activeTab = 'after';
          this.updateScenarioForecastEndDateIfNeeded();
          this.getShortfallStatus(report);
        }
      });
  }

  private populateCategoryItems(): void {
    this.goalItems = (this.financialTimeline?.clientEvents ?? [])
      .filter((e) => !e.isPlaceHolder)
      .sort((a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0));

    this.savingPotItems = this.savingPots?.clientSavings ?? [];

    const allIncomes = this.incomeExpenseData?.incomes ?? [];
    this.incomeItems = allIncomes.filter(
      (i) => i.description?.toLowerCase() !== 'pension fund',
    );

    this.expenseItems = (this.incomeExpenseData?.expenses ?? []).filter(
      (e) => e.description?.toLowerCase() !== 'insurance',
    );
  }

  private buildIncomeTypes(): string[] {
    const defaultIncomes = (this.incomeExpenseData?.incomes ?? []).filter(
      (i) => i.isDefault,
    );
    const allIncomes = this.incomeExpenseData?.incomes ?? [];
    const hasPartner = this.hasPartner;
    const cName = this.clientFirstName || 'Client';
    const pName = this.partnerFirstName || 'Partner';
    const types: string[] = [];
    if (!defaultIncomes.find((x) => x.description === 'Salary')) {
      types.push(hasPartner ? `Salary ${cName}` : 'Salary');
    }
    if (
      hasPartner &&
      !defaultIncomes.find((x) => isPartnerSalaryApiDescription(x.description))
    ) {
      types.push(`Salary ${pName}`);
    }
    if (!defaultIncomes.find((x) => x.description === 'State pension')) {
      types.push(hasPartner ? `State pension ${cName}` : 'State pension');
    }
    if (
      hasPartner &&
      !defaultIncomes.find((x) =>
        isPartnerStatePensionApiDescription(x.description),
      )
    ) {
      types.push(`State pension ${pName}`);
    }
    if (!allIncomes.find((x) => x.description === 'Rental income'))
      types.push('Rental income');
    types.push('Custom');
    return types;
  }

  private buildExpenseTypes(): string[] {
    const defaultExpenses = (this.incomeExpenseData?.expenses ?? []).filter(
      (e) => e.isDefault,
    );
    const allExpenses = this.incomeExpenseData?.expenses ?? [];
    const types: string[] = [];
    if (!defaultExpenses.find((x) => x.description === 'Living costs'))
      types.push('Living costs');
    if (!defaultExpenses.find((x) => x.description === 'Housing'))
      types.push('Housing');
    if (!allExpenses.find((x) => x.description === 'Debt repayment'))
      types.push('Debt repayment');
    types.push('Custom');
    return types;
  }

  private initFormFromPlan(): void {
    if (!this.client || !this.financialTimeline || !this.cashflow) return;
    const inflation =
      this.cashflow.inflationRate ??
      this.client.clientDetails?.inflationRate ??
      2.5;

    const inflationNum = Number(inflation);
    this.baselineInflationRate = Number.isFinite(inflationNum) ? inflationNum : 2.5;
    this.clientFirstName = this.client.clientDetails?.firstName ?? '';
    this.partnerFirstName = this.client.partnerDetail?.firstName ?? '';

    const events = this.financialTimeline.clientEvents ?? [];
    const mainRetirementEvent = events.find(
      (e) =>
        e.name.trim().toLowerCase().startsWith('retirement age') &&
        !e.isPartnerEvent,
    );

    let projectionEndYear = getCashflowDialogEndCalendarYear(
      this.client.clientDetails.birthDate,
      this.cashflow.planDuration,
      moment(this.financialTimeline.forecastEndtDate).year(),
    );
    if (!Number.isFinite(projectionEndYear)) {
      projectionEndYear = moment(this.financialTimeline.forecastEndtDate).year();
    }

    this.hasRetirementAge = !!mainRetirementEvent;
    if (mainRetirementEvent) {
      this.baselineRetirementAge = getProjectionAgeForClientEvent(
        mainRetirementEvent,
        {
          clientBirthDate: this.client.clientDetails.birthDate,
          partnerBirthDate: this.client.partnerDetail?.birthDate,
          forecastStartDate: this.financialTimeline.forecastStartDate,
          planDuration: this.cashflow.planDuration,
          projectionInclusiveEndYear: projectionEndYear,
        },
      );
      this.minRetirementAge = Math.max(
        18,
        getCompletedYearsAgeAtDate(
          this.client.clientDetails.birthDate,
          new Date(),
        ),
      );
      this.maxRetirementAge = 100;
    }

    const partnerRetirementEvent = events.find(
      (e) =>
        e.name.trim().toLowerCase().startsWith('retirement age') &&
        !!e.isPartnerEvent,
    );

    this.hasPartnerRetirementAge =
      !!partnerRetirementEvent && !!this.client.partnerDetail;
    if (this.hasPartnerRetirementAge && this.client.partnerDetail) {
      this.baselinePartnerRetirementAge = getProjectionAgeForClientEvent(
        partnerRetirementEvent,
        {
          clientBirthDate: this.client.clientDetails.birthDate,
          partnerBirthDate: this.client.partnerDetail.birthDate,
          forecastStartDate: this.financialTimeline.forecastStartDate,
          planDuration: this.cashflow.planDuration,
          projectionInclusiveEndYear: projectionEndYear,
        },
      );
      this.minPartnerRetirementAge = Math.max(
        18,
        getCompletedYearsAgeAtDate(
          this.client.partnerDetail.birthDate,
          new Date(),
        ),
      );
      this.maxPartnerRetirementAge = 100;
      this.scenarioForm.addControl(
        'partnerRetirementAge',
        this.fb.control(this.baselinePartnerRetirementAge),
      );
    }

    this.scenarioForm.patchValue(
      {
        inflationRate: this.baselineInflationRate,
        ...(this.hasRetirementAge
          ? { retirementAge: this.baselineRetirementAge }
          : {}),
      },
      { emitEvent: false },
    );
  }

  private getMaxForecastEndDate(): Date {
    if (!this.client) return new Date();
    const birthDate = new Date(this.client.clientDetails.birthDate);
    const birthYear = birthDate.getFullYear();
    const mainAge = this.hasRetirementAge
      ? Number(this.scenarioForm.get('retirementAge')?.value) ||
        this.baselineRetirementAge
      : this.baselineRetirementAge;
    let endYear = birthYear + mainAge;

    if (this.hasPartnerRetirementAge && this.client.partnerDetail) {
      const partnerBirthYear = new Date(
        this.client.partnerDetail.birthDate,
      ).getFullYear();
      const partnerAge =
        Number(this.scenarioForm.get('partnerRetirementAge')?.value) ||
        this.baselinePartnerRetirementAge;
      endYear = Math.max(endYear, partnerBirthYear + partnerAge);
    }

    if (this.cashflow) {
      const planDuration = Number(this.cashflow.planDuration);
      if (Number.isFinite(planDuration) && planDuration > 0) {
        const planEnd = getPlanEndCalendarYear(birthDate, planDuration);
        if (planEnd != null) {
          endYear = Math.max(endYear, planEnd);
        }
      }
    }

    if (this.financialTimeline?.forecastEndtDate) {
      const timelineEndYear = new Date(
        this.financialTimeline.forecastEndtDate,
      ).getFullYear();
      endYear = Math.max(endYear, timelineEndYear);
    }

    return new Date(endYear, 11, 31);
  }

  private syncChartYearRangeFromDisplayedReport(): void {
    const bounds = getReportYearBounds(this.displayedReport?.categories);
    if (!bounds) {
      this.chartYearOptions = [];
      this.chartViewStartYear = null;
      this.chartViewEndYear = null;
      return;
    }
    this.chartYearOptions = parseReportCategoryYears(
      this.displayedReport!.categories,
    );
    if (
      this.chartViewStartYear == null ||
      this.chartViewStartYear < bounds.min ||
      this.chartViewStartYear > bounds.max
    ) {
      this.chartViewStartYear = bounds.min;
    }
    if (
      this.chartViewEndYear == null ||
      this.chartViewEndYear < bounds.min ||
      this.chartViewEndYear > bounds.max
    ) {
      this.chartViewEndYear = bounds.max;
    }
    if (
      this.chartViewStartYear != null &&
      this.chartViewEndYear != null &&
      this.chartViewStartYear > this.chartViewEndYear
    ) {
      this.chartViewStartYear = bounds.min;
      this.chartViewEndYear = bounds.max;
    }
  }

  onChartStartYearChange(year: number): void {
    this.chartViewStartYear = year;
    if (this.chartViewEndYear != null && year > this.chartViewEndYear) {
      this.chartViewEndYear = year;
    }
  }

  onChartEndYearChange(year: number): void {
    this.chartViewEndYear = year;
    if (this.chartViewStartYear != null && year < this.chartViewStartYear) {
      this.chartViewStartYear = year;
    }
  }

  private getPlanEndYearForScenarioLab(): number {
    return this.getMaxForecastEndDate().getFullYear();
  }

  private buildScenarioPayload(): ReportScenarioPayload | null {
    if (!this.financialTimeline || !this.client) return null;
    const forecastEndDate = this.getMaxForecastEndDate();
    const forecastStart = this.financialTimeline.forecastStartDate
      ? new Date(this.financialTimeline.forecastStartDate)
      : new Date();
    const inflationRate =
      Number(this.scenarioForm.get('inflationRate')?.value) ?? 2.5;
    const payload: ReportScenarioPayload = {
      ForecastStartDate: forecastStart.toISOString(),
      ForecastEndDate: forecastEndDate.toISOString(),
      InflationRate: inflationRate,
    };

    if (this.hasRetirementAge) {
      const ra = Number(this.scenarioForm.get('retirementAge')?.value);
      if (Number.isFinite(ra)) payload.ClientRetirementAge = ra;
    }
    if (this.hasPartnerRetirementAge && this.scenarioForm.get('partnerRetirementAge')) {
      const pra = Number(this.scenarioForm.get('partnerRetirementAge')?.value);
      if (Number.isFinite(pra)) payload.PartnerRetirementAge = pra;
    }

    if (this.editedIncomes.length) {
      payload.IncomeOverrides = this.editedIncomes.map((e) =>
        this.toFinancialRecordLineItem(e.item),
      );
    }
    if (this.editedExpenses.length) {
      payload.ExpenseOverrides = this.editedExpenses.map((e) =>
        this.toFinancialRecordLineItem(e.item),
      );
    }

    const clientEventOverrides = this.collectClientEventOverrides();
    if (clientEventOverrides.length) {
      payload.ClientEventOverrides = clientEventOverrides;
    }

    if (this.editedSavingPots.length) {
      const potOverrides = this.editedSavingPots
        .map(e => e.item)
        .filter((p): p is ClientSaving => !!p?.id)
        .map(p => ({
          SavingPotId: p.id as string,
          ReturnRate: p.returnRate,
          StartingPotAmount: p.startingPotValue?.amount,
        }));
      if (potOverrides.length) {
        payload.SavingPotReturnOverrides = potOverrides;
      }
    }

    return payload;
  }

  /** Flattens goal edits (single event or financing arrays) for the scenario API */
  private collectClientEventOverrides(): ClientEvent[] {
    const out: ClientEvent[] = [];
    for (const g of this.editedGoals) {
      const item = g.item;
      if (Array.isArray(item)) {
        out.push(...item.map((e) => this.applyResolvedEndToClientEvent(e)));
      } else if (item) {
        out.push(this.applyResolvedEndToClientEvent(item));
      }
    }
    return out;
  }

  /**
   * Scenario edits snapshot goal `end` at save time; when the end is tied to another
   * timeline event, re-resolve year/age from the live timeline before calling the API.
   */
  private applyResolvedEndToClientEvent(ev: ClientEvent): ClientEvent {
    if (!this.financialTimeline || !this.client) return ev;
    const y = resolveClientEventEndCalendarYear(
      ev,
      this.financialTimeline.clientEvents,
    );
    if (y == null) return ev;

    const forecastEndY = moment(
      this.financialTimeline.forecastEndtDate,
    ).year();
    const dialogEnd = getCashflowDialogEndCalendarYear(
      this.client.clientDetails.birthDate,
      this.cashflow?.planDuration,
      forecastEndY,
    );
    const birth =
      ev.isPartnerEvent && this.client.partnerDetail?.birthDate
        ? this.client.partnerDetail.birthDate
        : this.client.clientDetails.birthDate;
    const age = getPersistedAgeForCalendarYear(
      birth,
      y,
      this.financialTimeline.forecastStartDate,
      this.cashflow?.planDuration,
      Number.isFinite(dialogEnd) ? dialogEnd : forecastEndY,
    );
    const nextAge = Number.isNaN(age) ? ev.end?.age ?? 0 : age;
    if (!ev.end) {
      return { ...ev, end: { year: y, age: nextAge } };
    }
    return { ...ev, end: { ...ev.end, year: y, age: nextAge } };
  }

  /** Income + expense lines for timeline dialogs (ids for Home / financing monthly + resale rows). */
  private getFinancialRecordsForEventDialogs(): FinancialRecordLineItem[] {
    const incomes = this.incomeExpenseData?.incomes ?? [];
    const expenses = this.incomeExpenseData?.expenses ?? [];
    return [...incomes, ...expenses] as unknown as FinancialRecordLineItem[];
  }

  /**
   * Recomputes the scenario chart from current form + edits.
   * @param showSuccessToast reserved for optional success feedback (auto-refresh passes false)
   */
  private runScenarioUpdate(showSuccessToast: boolean): void {
    if (!this.financialTimeline || !this.client || !this.baselineReport) return;

    this.loadScenarioReport()
      .pipe(takeUntil(this.destroy$))
      .subscribe((report) => {
        if (report) {
          this.injectTimelineEvents(report);
          this.report = report;
          this.alignSeriesStructure();
          this.hasSimulated = true;
          this.activeTab = 'after';
          this.updateScenarioForecastEndDateIfNeeded();
          this.displayedReport = {
            ...report,
            series: report.series.map(s => ({ ...s, data: [...s.data] })),
          };
          this.getShortfallStatus(report);
          this.syncChartYearRangeFromDisplayedReport();
          if (showSuccessToast) {
            this.toastr.success(this.translate.instant('TOAST.SCENARIO_SIMULATED'));
          }
        } else if (showSuccessToast) {
          this.toastr.warning(this.translate.instant('ERROR.NO_SCENARIO_DATA'));
        }
      });
  }

  private setupScenarioFormAutoRefresh(): void {
    this.scenarioForm.valueChanges
      .pipe(
        debounceTime(450),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a) === JSON.stringify(b),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.runScenarioUpdate(false);
      });
  }

  private toFinancialRecordLineItem(vm: FinancialViewModel): any {
    return {
      Id: vm.id ?? '',
      Description: vm.description,
      Amount: vm.amount,
      Start: vm.start,
      End: vm.end,
      EscalationRate: vm.escalationRate,
      IsDefault: vm.isDefault ?? false,
      IsIncomeExpenseSource: vm.isIncomeExpenseSource ?? false,
      Icon: vm.icon,
      Bonus: vm.bonus ?? null,
      StartEventId: vm.startEventId ?? null,
      EndEventId: vm.endEventId ?? null,
    };
  }

  private loadScenarioReport() {
    const payload = this.buildScenarioPayload();
    if (!payload || !this.cashflowId) return of(null);
    return this.reportsHttpService
      .getReportScenario(this.cashflowId, payload)
      .pipe(
        catchError((err) => {
          console.error('Scenario report error', err);
          return of(null);
        }),
      );
  }

  switchTab(tab: 'before' | 'after'): void {
    this.activeTab = tab;
    const source = tab === 'before' ? this.baselineReport : this.report;
    this.displayedReport = source ? this.deepCloneReport(source) : source;
    this.syncChartYearRangeFromDisplayedReport();
    if (tab === 'after' && this.report) this.getShortfallStatus(this.report);
    if (tab === 'before' && this.baselineReport)
      this.getShortfallStatus(this.baselineReport);
  }

  private alignSeriesStructure(): void {
    if (!this.baselineReport || !this.report) return;
    const baseline = this.baselineReport;
    const scenario = this.report;

    // Unify categories so both reports share the same x-axis.
    // This prevents ng-apexcharts from destroying/recreating the chart
    // (it can use updateSeries for smooth bar morphing instead).
    const allCategoriesSet = new Set<string>([
      ...baseline.categories.map(String),
      ...scenario.categories.map(String),
    ]);
    const unifiedCategories = Array.from(allCategoriesSet).sort(
      (a, b) => Number(a) - Number(b),
    );

    const padSeries = (report: ChartSeries, oldCategories: string[]) => {
      const oldCatSet = new Set(oldCategories.map(String));
      const insertionMap: number[] = unifiedCategories.map((c) =>
        oldCategories.indexOf(c),
      );
      report.series.forEach((s: any) => {
        const newData = insertionMap.map((idx) => (idx >= 0 ? s.data[idx] : 0));
        s.data = newData;
      });
      report.categories = [...unifiedCategories];
    };

    const baselineOldCats = baseline.categories.map(String);
    const scenarioOldCats = scenario.categories.map(String);
    if (baselineOldCats.join(',') !== unifiedCategories.join(',')) {
      padSeries(baseline, baselineOldCats);
    }
    if (scenarioOldCats.join(',') !== unifiedCategories.join(',')) {
      padSeries(scenario, scenarioOldCats);
    }

    // Use the max end date from the unified categories to prevent
    // forecastEndDate input changes from triggering an xaxis rebuild.
    const maxYear = Number(unifiedCategories[unifiedCategories.length - 1]);
    if (Number.isFinite(maxYear)) {
      const alignedEndDate = new Date(maxYear, 11, 31);
      this.scenarioForecastEndDate = alignedEndDate;
      if (
        !this.baselineForecastEndDate ||
        this.baselineForecastEndDate.getFullYear() < maxYear
      ) {
        this.baselineForecastEndDate = alignedEndDate;
      }
    }

    // Unify series names so both reports have the same stacked structure.
    const allNames: string[] = [];
    [...scenario.series, ...baseline.series].forEach((s: any) => {
      if (!allNames.includes(s.name)) allNames.push(s.name);
    });

    const categoryCount = unifiedCategories.length;
    allNames.forEach((name) => {
      if (!baseline.series.find((s: any) => s.name === name)) {
        const ref = scenario.series.find((s: any) => s.name === name);
        if (ref)
          baseline.series.push({
            ...ref,
            data: new Array(categoryCount).fill(0),
          });
      }
      if (!scenario.series.find((s: any) => s.name === name)) {
        const ref = baseline.series.find((s: any) => s.name === name);
        if (ref)
          scenario.series.push({
            ...ref,
            data: new Array(categoryCount).fill(0),
          });
      }
    });
  }

  getShortfallStatus(report: ChartSeries): void {
    this.hasShortfall = false;
    this.firstShortfallAge = null;
    const shortfallSeries = report?.series?.find((s) => s.name === 'Shortfall');
    if (!shortfallSeries || !this.client) return;
    const index = shortfallSeries.data.findIndex((v) => v < 0);
    if (index < 0) return;
    this.hasShortfall = true;
    const year = Number(report.categories[index]);
    const age = getProjectionColumnAgeLabel(
      this.client.clientDetails.birthDate,
      year,
      this.financialTimeline?.forecastStartDate,
      this.cashflow?.planDuration,
    );
    this.firstShortfallAge = Number.isNaN(age) ? null : age;
  }

  getScenarioForecastEndDate(): Date {
    return this.getMaxForecastEndDate();
  }

  private updateScenarioForecastEndDateIfNeeded(): void {
    const next = this.getScenarioForecastEndDate();
    if (
      !this.scenarioForecastEndDate ||
      this.scenarioForecastEndDate.getTime() !== next.getTime()
    ) {
      this.scenarioForecastEndDate = next;
    }
  }

  private deepCloneReport(report: ChartSeries): ChartSeries {
    return {
      categories: [...report.categories],
      series: report.series.map((s) => ({ ...s, data: [...s.data] })),
      timelineEvents: report.timelineEvents?.map((e) => ({ ...e })) ?? [],
    };
  }

  private injectTimelineEvents(report: ChartSeries): void {
    const inheritanceFromIncome = this.buildInheritanceTimelineEventsFromIncomes();

    if (!report.timelineEvents?.length) {
      const events = (this.financialTimeline?.clientEvents ?? [])
        .filter((e) => !e.isPlaceHolder && !this.isSupersededInheritanceGoalEvent(e))
        .map((e) => ({
          name: e.name,
          startYear: e.start.year,
          iconUrl: e.iconUrl,
        }));
      report.timelineEvents = [...events, ...inheritanceFromIncome];
      return;
    }

    report.timelineEvents = this.mergeInheritanceChartMarkers(
      report.timelineEvents,
      inheritanceFromIncome,
    );
  }

  /**
   * Goals-styled inheritance events are not chart markers once Income inheritance exists;
   * aligns with API timeline marker rules.
   */
  private isSupersededInheritanceGoalEvent(e: ClientEvent): boolean {
    const name = (e.name ?? '').trim();
    return (
      isClientInheritanceApiDescription(name) ||
      isPartnerInheritanceApiDescription(name)
    );
  }

  private isInheritanceIncomeForChartMarker(i: FinancialViewModel): boolean {
    const amt = i.amount?.amount;
    if (
      amt == null ||
      !Number.isFinite(Number(amt)) ||
      Number(amt) <= 0
    ) {
      return false;
    }
    const icon = (i.icon ?? '').trim().toLowerCase();
    if (icon === 'inheritance') return true;
    const d = i.description ?? '';
    return (
      isClientInheritanceApiDescription(d) ||
      isPartnerInheritanceApiDescription(d)
    );
  }

  private buildInheritanceTimelineEventsFromIncomes(): TimelineEvent[] {
    const incomes = this.incomeExpenseData?.incomes ?? [];
    const clientEvents = this.financialTimeline?.clientEvents ?? [];
    const out: TimelineEvent[] = [];
    for (const i of incomes) {
      if (!this.isInheritanceIncomeForChartMarker(i)) continue;
      const y = resolveIncomeMarkerCalendarYear(i, clientEvents);
      if (y == null) continue;
      out.push({
        name: i.description ?? 'Inheritance',
        startYear: y,
        iconUrl: 'inheritance-green',
      });
    }
    return out;
  }

  private mergeInheritanceChartMarkers(
    existing: TimelineEvent[],
    inheritance: TimelineEvent[],
  ): TimelineEvent[] {
    if (!inheritance.length) return existing;
    const keys = new Set(
      existing
        .filter((e) => e.iconUrl === 'inheritance-green')
        .map((e) => `${e.startYear}|${e.name}`),
    );
    const extra = inheritance.filter(
      (e) => !keys.has(`${e.startYear}|${e.name}`),
    );
    return extra.length ? [...existing, ...extra] : existing;
  }

  onBack(): void {
    this.router.navigate(['/cashflows', this.cashflowId, 'reports']);
  }

  getRetirementAge(): number {
    return Number(this.scenarioForm.get('retirementAge')?.value) || 65;
  }

  onNumericInputChange(field: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.scenarioForm.patchValue({ [field]: val });
    }
  }

  /** Localized label for edited-goal chips (e.g. composite retirement names from the API). */
  editedGoalChipLabel(name: string, event?: ClientEvent): string {
    if (name?.toLowerCase().startsWith('retirement age') && this.hasPartner) {
      const personName = event?.isPartnerEvent
        ? this.client?.partnerDetail?.firstName?.trim()
        : this.client?.clientDetails?.firstName?.trim();
      const composite = personName ? `Retirement age ${personName}` : 'Retirement age';
      return translateTimelineEventDisplayName(this.translate, composite);
    }
    return translateTimelineEventDisplayName(this.translate, name);
  }

  firstEvent(item: ClientEvent | ClientEvent[]): ClientEvent | undefined {
    return Array.isArray(item) ? item[0] : item;
  }

  // ── Category editor methods ─────────────────────────────────────────────

  onGoalSelected(event: ClientEvent): void {
    if (!event || !this.financialTimeline || !this.client) return;
    this.clearCategoryDropdown(this.goalDropdownControl);

    const eventType = this.DIALOG_SYSTEM_EVENTS.some((name) =>
      event.name.startsWith(name),
    )
      ? EventType.SYSTEM
      : this.DIALOG_FINANCING_EVENTS.some((name) => event.name.startsWith(name))
        ? EventType.FINANCING
        : EventType.CUSTOM;

    const forecastEndY = moment(
      this.financialTimeline.forecastEndtDate,
    ).year();
    const resolvedGoalsDialogEnd = getCashflowDialogEndCalendarYear(
      this.client.clientDetails.birthDate,
      this.cashflow?.planDuration,
      forecastEndY,
    );
    const goalsDialogEndCalendarYear = Number.isFinite(resolvedGoalsDialogEnd)
      ? resolvedGoalsDialogEnd
      : forecastEndY;

    const financialRecords =
      eventType === EventType.FINANCING || event.isFinance
        ? this.financingRecords.filter((r) => r.parentId === event.id)
        : this.getFinancialRecordsForEventDialogs();

    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        eventType,
        escalataionRates: this.escalationRates,
        customEvents: [],
        timelineId: this.financialTimeline.id,
        isIncomeEvent: event.type === EventIncomeType.Income,
        cashflowId: this.cashflowId,
        clientBirthDate: this.client.clientDetails.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        clientCountryCode: this.client.clientDetails.country,
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastStartDate: this.financialTimeline.forecastStartDate,
        planDuration: this.cashflow?.planDuration,
        forecastEndDateYear: forecastEndY,
        eventsList: this.financialTimeline.clientEvents.map((e) => {
          const birth =
            e.isPartnerEvent && this.client?.partnerDetail?.birthDate
              ? this.client.partnerDetail.birthDate
              : this.client!.clientDetails.birthDate;
          return {
            id: e.id,
            isPartnerEvent: e.isPartnerEvent,
            name: e.name,
            year: e.start.year,
            age: getPersistedAgeForCalendarYear(
              birth,
              e.start.year,
              this.financialTimeline!.forecastStartDate,
              this.cashflow?.planDuration,
              goalsDialogEndCalendarYear,
            ),
          };
        }),
        isEditWorkflow: true,
        patchEvent: event,
        financialRecords,
        scenarioMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.status === 'Success' && result.scenarioItem) {
        const existing = this.editedGoals.findIndex(
          (e) => e.name === event.name,
        );
        if (existing >= 0) {
          this.editedGoals[existing] = {
            name: event.name,
            item: result.scenarioItem,
          };
        } else {
          this.editedGoals.push({
            name: event.name,
            item: result.scenarioItem,
          });
        }
        this.runScenarioUpdate(false);
      }
    });
  }

  onSavingPotSelected(pot: ClientSaving): void {
    if (!pot || !this.financialTimeline || !this.client || !this.cashflow)
      return;
    this.clearCategoryDropdown(this.potDropdownControl);

    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '612px',
      disableClose: true,
      data: {
        returnRate: this.userReturnRate,
        pensionFundReturnRate: this.pensionFundReturnRate,
        inflationRate:
          this.cashflow.inflationRate ??
          this.client.clientDetails?.inflationRate ??
          0,
        loggedInUserPreferences: this.loggedInUserPreferences,
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: [...this.financialTimeline.clientEvents].sort(
          (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
        ),
        clientBirthDate: this.client.clientDetails.birthDate,
        partnerBirthDate: this.client.partnerDetail?.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate,
        ).year(),
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastStartDate: this.financialTimeline.forecastStartDate,
        planDuration: this.cashflow.planDuration,
        cashflowId: this.cashflowId,
        isEditWorkflow: true,
        event: pot,
        existingSavingPots: this.savingPots?.clientSavings || [],
        hasPartner: !!this.client.partnerDetail,
        clientFirstName: this.client.clientDetails?.firstName ?? '',
        partnerFirstName: this.client.partnerDetail?.firstName ?? '',
        clientDisplayName: formatClientPersonDisplayName(
          this.client.clientDetails,
        ),
        partnerDisplayName: formatClientPersonDisplayName(
          this.client.partnerDetail,
        ),
        scenarioMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.status === 'Success' && result.scenarioItem) {
        const existing = this.editedSavingPots.findIndex(
          (e) => e.name === pot.name,
        );
        if (existing >= 0) {
          this.editedSavingPots[existing] = {
            name: pot.name,
            item: result.scenarioItem,
          };
        } else {
          this.editedSavingPots.push({
            name: pot.name,
            item: result.scenarioItem,
          });
        }
        this.runScenarioUpdate(false);
      }
    });
  }

  onIncomeSelected(income: FinancialViewModel): void {
    if (!income || !this.financialTimeline || !this.client || !this.cashflow)
      return;
    this.clearCategoryDropdown(this.incomeDropdownControl);

    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: [...this.financialTimeline.clientEvents].sort(
          (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
        ),
        clientBirthDate: this.client.clientDetails.birthDate,
        partnerBirthDate: this.client.partnerDetail?.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        clientCountryCode: this.client.clientDetails?.country,
        cashflowId: this.cashflowId,
        selectedIncome: income,
        isEditWorkflow: true,
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate,
        ).year(),
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastStartDate: this.financialTimeline.forecastStartDate,
        planDuration: this.cashflow?.planDuration,
        planEndYear: this.getPlanEndYearForScenarioLab(),
        incomeType: this.buildIncomeTypes(),
        incomes: this.incomeExpenseData?.incomes ?? [],
        clientSavings: this.savingPots?.clientSavings ?? [],
        existingContributions: [],
        clientFirstName: this.clientFirstName,
        partnerFirstName: this.partnerFirstName,
        hasPartner: this.hasPartner,
        selectedClient: this.client,
        scenarioMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.status === 'Success' && result.scenarioItem) {
        const existing = this.editedIncomes.findIndex(
          (e) => e.name === income.description,
        );
        if (existing >= 0) {
          this.editedIncomes[existing] = {
            name: income.description,
            item: result.scenarioItem,
          };
        } else {
          this.editedIncomes.push({
            name: income.description,
            item: result.scenarioItem,
          });
        }
        this.runScenarioUpdate(false);
      }
    });
  }

  onExpenseSelected(expense: FinancialViewModel): void {
    if (!expense || !this.financialTimeline || !this.client || !this.cashflow)
      return;
    this.clearCategoryDropdown(this.expenseDropdownControl);

    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '612px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: [...this.financialTimeline.clientEvents].sort(
          (a, b) => (a.start?.year ?? 0) - (b.start?.year ?? 0),
        ),
        clientBirthDate: this.client.clientDetails.birthDate,
        partnerBirthDate: this.client.partnerDetail?.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        cashflowId: this.cashflowId,
        selectedExpense: expense,
        isEditWorkflow: true,
        forecastEndDateYear: moment(
          this.financialTimeline.forecastEndtDate,
        ).year(),
        forecastStartDateYear: moment(
          this.financialTimeline.forecastStartDate,
        ).year(),
        forecastStartDate: this.financialTimeline.forecastStartDate,
        planDuration: this.cashflow?.planDuration,
        expenseType: this.buildExpenseTypes(),
        scenarioMode: true,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.status === 'Success' && result.scenarioItem) {
        const existing = this.editedExpenses.findIndex(
          (e) => e.name === expense.description,
        );
        if (existing >= 0) {
          this.editedExpenses[existing] = {
            name: expense.description,
            item: result.scenarioItem,
          };
        } else {
          this.editedExpenses.push({
            name: expense.description,
            item: result.scenarioItem,
          });
        }
        this.runScenarioUpdate(false);
      }
    });
  }

  removeEditedItem(
    category: 'goals' | 'savingPots' | 'incomes' | 'expenses',
    name: string,
  ): void {
    const listMap: Record<string, Array<{ name: string }>> = {
      goals: this.editedGoals,
      savingPots: this.editedSavingPots,
      incomes: this.editedIncomes,
      expenses: this.editedExpenses,
    };
    const list = listMap[category];
    const idx = list.findIndex((e) => e.name === name);
    if (idx >= 0) {
      list.splice(idx, 1);
      if (category === 'goals') {
        this.goalDropdownControl.setValue(null, { emitEvent: false });
      } else if (category === 'savingPots') {
        this.potDropdownControl.setValue(null, { emitEvent: false });
      } else if (category === 'incomes') {
        this.incomeDropdownControl.setValue(null, { emitEvent: false });
      } else if (category === 'expenses') {
        this.expenseDropdownControl.setValue(null, { emitEvent: false });
      }
      if (this.baselineReport) {
        this.runScenarioUpdate(false);
      }
    }
  }

  private refreshData(): void {
    combineLatest([
      this.timelineHttpService.getTimelineWithLinkedFinancialRecordsByCashflowId(this.cashflowId),
      this.savingPotsHttpService.getAllSavingsPots(this.cashflowId),
      this.incomeExpensesHttpService.getAllIncomeExpenses(this.cashflowId),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([timelineResponse, savingPots, incomeExpense]) => {
        this.financialTimeline = timelineResponse.timeline;
        this.financingRecords = timelineResponse.financialRecords ?? [];
        this.savingPots = savingPots;
        this.incomeExpenseData = incomeExpense;
        this.populateCategoryItems();
      });
  }

  // ── Create plan from scenario ───────────────────────────────────────────

  onCreatePlanFromScenario(): void {
    if (!this.cashflow || !this.client) return;
    const cashflows$ = this.cashflowHttpService.getByClientId(this.client.id);
    cashflows$.pipe(takeUntil(this.destroy$)).subscribe((cashflows) => {
      const baseName = this.cashflow!.name;
      let defaultName = `${baseName} - Scenario`;
      if (cashflows.some((c) => c.name === defaultName)) {
        let n = 2;
        defaultName = `${baseName} - Scenario ${n}`;
        while (cashflows.some((c) => c.name === defaultName)) {
          n++;
          defaultName = `${baseName} - Scenario ${n}`;
        }
      }
      const dialogRef = this.dialog.open(ScenarioNameDialogComponent, {
        width: '612px',
        data: { defaultName, planName: baseName },
      });
      dialogRef.afterClosed().subscribe((newName: string | undefined) => {
        if (!newName?.trim()) return;
        const birthYear = new Date(
          this.client!.clientDetails.birthDate,
        ).getFullYear();
        const retirementAge =
          Number(this.scenarioForm.get('retirementAge')?.value) || 65;
        const planUntilDate = new Date(
          birthYear + retirementAge,
          11,
          31,
        ).toISOString();
        const request = {
          SourceCashflowId: this.cashflowId,
          NewPlanName: newName.trim(),
          InflationRate:
            Number(this.scenarioForm.get('inflationRate')?.value) ?? undefined,
          PlanUntilDate: planUntilDate,
        };
        this.isLoaderVisible = true;
        this.cashflowHttpService
          .createFromScenario(request)
          .pipe(
            takeUntil(this.destroy$),
            catchError((err) => {
              this.isLoaderVisible = false;
              this.toastr.error(
                err?.error?.message ||
                  this.translate.instant('ERROR.FAILED_CREATE_PLAN_SCENARIO'),
                this.translate.instant('LABEL.ERROR'),
              );
              return of(null);
            }),
          )
          .subscribe((newPlan) => {
            this.isLoaderVisible = false;
            if (newPlan) {
              this.toastr.success(
                this.translate.instant('TOAST.PLAN_CREATED_FROM_SCENARIO'),
                this.translate.instant('LABEL.SUCCESS'),
              );
              this.router.navigate(['/cashflows', newPlan.id, 'reports']);
            }
          });
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
