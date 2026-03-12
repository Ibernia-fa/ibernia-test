import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of, filter, takeUntil, switchMap, tap, catchError } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import moment from 'moment';

import { FinancialWorkflowService } from '../../services/financial-workflow.service';
import { TimelineHttpService } from '../../timeline/services/timeline-http.service';
import { SavingsPotsHttpService } from '../../saving-pots/services/savings-pots-http.service';
import { ReportsHttpService, ReportScenarioPayload } from '../services/reports-http.service';
import { CashflowHttpService } from 'src/app/clients/services/cashflow-http.service';
import { IncomeExpensesHttpService } from '../../income-expenses/services/income-expenses-http.service';
import { SettingsHttpService } from '../../settings/services/settings-http.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { ClientEvent, Cycle, EscalationRate, EventIncomeType, FinancialTimeline } from '../../timeline/models/financial-timeline';
import { SavingPotsModel, ClientSaving } from '../../saving-pots/models/saving-pots.model';
import { FinancialViewModel, IncomeExpense } from '../../income-expenses/model/income-expense';
import { ChartSeries } from '../models/charts-series.model';
import { SavingsBarStackedChartComponent } from '../savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { ToastrService } from 'ngx-toastr';
import { ScenarioNameDialogComponent } from './scenario-name-dialog/scenario-name-dialog.component';
import { AddIncomeComponent } from '../../income-expenses/add-income/add-income.component';
import { AddExpenseComponent } from '../../income-expenses/add-expense/add-expense.component';
import { AddEventDialogComponent, EventType } from '../../timeline/add-event-dialog/add-event-dialog.component';
import { AddNewPotComponent } from '../../saving-pots/add-new-pot/add-new-pot.component';
import { patchInflationRateDescription } from 'src/app/shared/utils/escalation-rate-utils';

@Component({
  selector: 'app-scenario-lab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatIconModule,
    SavingsBarStackedChartComponent,
    TranslateModule,
    TablerIconsModule,
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
  hasShortfall = false;
  firstShortfallAge: number | null = null;

  baselineReport: ChartSeries | null = null;
  displayedReport: ChartSeries | null = null;
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
    return this.scenarioForm.get('inflationRate')?.value !== this.baselineInflationRate;
  }

  get retirementAgeEdited(): boolean {
    return this.scenarioForm.get('retirementAge')?.value !== this.baselineRetirementAge;
  }

  get partnerRetirementAgeEdited(): boolean {
    return this.scenarioForm.get('partnerRetirementAge')?.value !== this.baselinePartnerRetirementAge;
  }

  goalItems: ClientEvent[] = [];
  savingPotItems: ClientSaving[] = [];
  incomeItems: FinancialViewModel[] = [];
  expenseItems: FinancialViewModel[] = [];

  editedGoals: string[] = [];
  editedSavingPots: string[] = [];
  editedIncomes: string[] = [];
  editedExpenses: string[] = [];

  incomeExpenseData: IncomeExpense | null = null;
  amountCycles: Cycle[] = [];
  escalationRates: EscalationRate[] = [];
  loggedInUserPreferences: any = null;
  userReturnRate: any = null;

  private readonly DIALOG_SYSTEM_EVENTS = ['Wedding', 'Travel', 'Education', 'New business'];
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
  ) {
    this.cashflowId = this.route.snapshot.params['id'] || '';
    this.scenarioForm = this.fb.group({
      inflationRate: [2.5],
      retirementAge: [65],
    });
  }

  ngOnInit(): void {
    this.navItemService.currentRouteName = 'Scenario Lab';

    this.settingsService.userData$
      .pipe(
        filter((v): v is NonNullable<typeof v> => v != null),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        const p = data.preferences;
        this.loggedInUserPreferences = p;
        this.userReturnRate = p.investmentReturn;
      });

    this.financialWorkflowService
      .loadClientCashflowMetadata(this.route.snapshot.params)
      .pipe(
        takeUntil(this.destroy$),
        tap(([client, cashflow]) => {
          this.client = client as Client;
          this.cashflow = cashflow as Cashflow;
        }),
        switchMap(() =>
          combineLatest([
            this.timelineHttpService.getTimelinebyCashflowId(this.cashflowId),
            this.savingPotsHttpService.getAllSavingsPots(this.cashflowId),
            this.incomeExpensesHttpService.getAllIncomeExpenses(this.cashflowId),
            this.settingsHttpService.getAmountCycles(),
            this.settingsHttpService.getEscalationRates(this.client!.id),
          ])
        ),
        tap(([timeline, savingPots, incomeExpense, amountCycles, escalationRatesResponse]) => {
          this.financialTimeline = timeline;
          this.savingPots = savingPots;
          this.incomeExpenseData = incomeExpense;
          this.amountCycles = amountCycles;
          this.escalationRates = patchInflationRateDescription(
            escalationRatesResponse?.escalationRates ?? [],
            this.cashflow?.inflationRate ?? 0
          );
          this.baselineForecastStartDate = timeline?.forecastStartDate
            ? new Date(timeline.forecastStartDate)
            : null;
          this.populateCategoryItems();
          this.initFormFromPlan();
          this.baselineForecastEndDate = this.getMaxForecastEndDate();
        }),
        switchMap(() => this.loadScenarioReport()),
        catchError((err) => {
          console.error('Scenario Lab load error', err);
          this.toastr.error('Failed to load Scenario Lab');
          return of(null);
        }),
      )
      .subscribe((report) => {
        if (report) {
          this.injectTimelineEvents(report);
          this.report = report;
          if (!this.baselineReport) {
            this.baselineReport = report;
          }
          this.displayedReport = report;
          this.activeTab = 'after';
          this.updateScenarioForecastEndDateIfNeeded();
          this.getShortfallStatus(report);
        }
      });
  }

  private populateCategoryItems(): void {
    this.goalItems = (this.financialTimeline?.clientEvents ?? [])
      .filter(e => !e.isPlaceHolder)
      .sort((a, b) => a.start.age - b.start.age);

    this.savingPotItems = this.savingPots?.clientSavings ?? [];

    const allIncomes = this.incomeExpenseData?.incomes ?? [];
    this.incomeItems = allIncomes.filter(
      i => i.description?.toLowerCase() !== 'pension fund'
    );

    this.expenseItems = this.incomeExpenseData?.expenses ?? [];
  }

  private buildIncomeTypes(): string[] {
    const defaultIncomes = (this.incomeExpenseData?.incomes ?? []).filter(i => i.isDefault);
    const allIncomes = this.incomeExpenseData?.incomes ?? [];
    const types: string[] = [];
    if (!defaultIncomes.find(x => x.description === 'Salary')) types.push('Salary');
    if (!defaultIncomes.find(x => x.description === 'State pension')) types.push('State pension');
    if (!allIncomes.find(x => x.description === 'Rental income')) types.push('Rental income');
    types.push('Custom');
    return types;
  }

  private buildExpenseTypes(): string[] {
    const defaultExpenses = (this.incomeExpenseData?.expenses ?? []).filter(e => e.isDefault);
    const allExpenses = this.incomeExpenseData?.expenses ?? [];
    const types: string[] = [];
    if (!defaultExpenses.find(x => x.description === 'Living costs')) types.push('Living costs');
    if (!defaultExpenses.find(x => x.description === 'Housing')) types.push('Housing');
    if (!allExpenses.find(x => x.description === 'Debt repayment')) types.push('Debt repayment');
    types.push('Custom');
    return types;
  }

  private initFormFromPlan(): void {
    if (!this.client || !this.financialTimeline || !this.cashflow) return;
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(this.client.clientDetails.birthDate).getFullYear();
    const inflation = this.cashflow.inflationRate ?? this.client.clientDetails?.inflationRate ?? 2.5;

    this.baselineInflationRate = Number(inflation) || 2.5;
    this.clientFirstName = this.client.clientDetails?.firstName ?? '';
    this.partnerFirstName = this.client.partnerDetail?.firstName ?? '';

    const events = this.financialTimeline.clientEvents ?? [];
    const mainRetirementEvent = events.find(
      e => e.name.trim().toLowerCase().startsWith('retirement age') && !e.isPartnerEvent
    );

    this.hasRetirementAge = !!mainRetirementEvent;
    if (mainRetirementEvent) {
      this.baselineRetirementAge = mainRetirementEvent.start.age;
      this.minRetirementAge = Math.max(18, this.calculateAgeAtDate(new Date(), new Date(this.client.clientDetails.birthDate)));
      this.maxRetirementAge = 100;
    }

    const partnerRetirementEvent = events.find(
      e => e.name.trim().toLowerCase().startsWith('retirement age') && !!e.isPartnerEvent
    );

    this.hasPartnerRetirementAge = !!partnerRetirementEvent && !!this.client.partnerDetail;
    if (this.hasPartnerRetirementAge && this.client.partnerDetail) {
      this.baselinePartnerRetirementAge = partnerRetirementEvent!.start.age;
      this.minPartnerRetirementAge = Math.max(18, this.calculateAgeAtDate(new Date(), new Date(this.client.partnerDetail.birthDate)));
      this.maxPartnerRetirementAge = 100;
      this.scenarioForm.addControl(
        'partnerRetirementAge',
        this.fb.control(this.baselinePartnerRetirementAge)
      );
    }

    this.scenarioForm.patchValue(
      {
        inflationRate: this.baselineInflationRate,
        ...(this.hasRetirementAge ? { retirementAge: this.baselineRetirementAge } : {}),
      },
      { emitEvent: false }
    );

  }

  private getMaxForecastEndDate(): Date {
    if (!this.client) return new Date();
    const birthDate = new Date(this.client.clientDetails.birthDate);
    const birthYear = birthDate.getFullYear();
    const mainAge = this.hasRetirementAge
      ? (Number(this.scenarioForm.get('retirementAge')?.value) || this.baselineRetirementAge)
      : this.baselineRetirementAge;
    let endYear = birthYear + mainAge;

    if (this.hasPartnerRetirementAge && this.client.partnerDetail) {
      const partnerBirthYear = new Date(this.client.partnerDetail.birthDate).getFullYear();
      const partnerAge = Number(this.scenarioForm.get('partnerRetirementAge')?.value) || this.baselinePartnerRetirementAge;
      endYear = Math.max(endYear, partnerBirthYear + partnerAge);
    }

    if (this.cashflow) {
      const planDuration = Number(this.cashflow.planDuration);
      if (Number.isFinite(planDuration) && planDuration > 0) {
        endYear = Math.max(endYear, birthYear + planDuration);
      }
    }

    if (this.financialTimeline?.forecastEndtDate) {
      const timelineEndYear = new Date(this.financialTimeline.forecastEndtDate).getFullYear();
      endYear = Math.max(endYear, timelineEndYear);
    }

    return new Date(endYear, 11, 31);
  }

  private buildScenarioPayload(): ReportScenarioPayload | null {
    if (!this.financialTimeline || !this.client) return null;
    const forecastEndDate = this.getMaxForecastEndDate();
    const forecastStart = this.financialTimeline.forecastStartDate
      ? new Date(this.financialTimeline.forecastStartDate)
      : new Date();
    const inflationRate = Number(this.scenarioForm.get('inflationRate')?.value) ?? 2.5;
    const payload: ReportScenarioPayload = {
      ForecastStartDate: forecastStart.toISOString(),
      ForecastEndDate: forecastEndDate.toISOString(),
      InflationRate: inflationRate,
    };
    return payload;
  }

  private loadScenarioReport() {
    const payload = this.buildScenarioPayload();
    if (!payload || !this.cashflowId) return of(null);
    return this.reportsHttpService.getReportScenario(this.cashflowId, payload).pipe(
      catchError((err) => {
        console.error('Scenario report error', err);
        return of(null);
      })
    );
  }

  private applyScenario(): void {
    this.loadScenarioReport().pipe(takeUntil(this.destroy$)).subscribe((report) => {
      if (report) {
        this.injectTimelineEvents(report);
        this.report = report;
        this.alignSeriesStructure();
        this.hasSimulated = true;
        this.activeTab = 'after';
        this.displayedReport = report;
        this.updateScenarioForecastEndDateIfNeeded();
        this.getShortfallStatus(report);
      }
    });
  }

  switchTab(tab: 'before' | 'after'): void {
    this.activeTab = tab;
    this.displayedReport = tab === 'before' ? this.baselineReport : this.report;
    if (tab === 'after' && this.report) this.getShortfallStatus(this.report);
    if (tab === 'before' && this.baselineReport) this.getShortfallStatus(this.baselineReport);
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
    const unifiedCategories = Array.from(allCategoriesSet)
      .sort((a, b) => Number(a) - Number(b));

    const padSeries = (report: ChartSeries, oldCategories: string[]) => {
      const oldCatSet = new Set(oldCategories.map(String));
      const insertionMap: number[] = unifiedCategories.map(c =>
        oldCategories.indexOf(c)
      );
      report.series.forEach((s: any) => {
        const newData = insertionMap.map(idx => idx >= 0 ? s.data[idx] : 0);
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
      if (!this.baselineForecastEndDate ||
          this.baselineForecastEndDate.getFullYear() < maxYear) {
        this.baselineForecastEndDate = alignedEndDate;
      }
    }

    // Unify series names so both reports have the same stacked structure.
    const allNames: string[] = [];
    [...scenario.series, ...baseline.series].forEach((s: any) => {
      if (!allNames.includes(s.name)) allNames.push(s.name);
    });

    const categoryCount = unifiedCategories.length;
    allNames.forEach(name => {
      if (!baseline.series.find((s: any) => s.name === name)) {
        const ref = scenario.series.find((s: any) => s.name === name);
        if (ref) baseline.series.push({ ...ref, data: new Array(categoryCount).fill(0) });
      }
      if (!scenario.series.find((s: any) => s.name === name)) {
        const ref = baseline.series.find((s: any) => s.name === name);
        if (ref) scenario.series.push({ ...ref, data: new Array(categoryCount).fill(0) });
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
    const birthYear = new Date(this.client.clientDetails.birthDate).getFullYear();
    this.firstShortfallAge = year - birthYear;
  }

  getScenarioForecastEndDate(): Date {
    return this.getMaxForecastEndDate();
  }

  private calculateAgeAtDate(date: Date, dateOfBirth: Date): number {
    let age = date.getFullYear() - dateOfBirth.getFullYear();
    const hasBirthdayPassed =
      date.getMonth() > dateOfBirth.getMonth() ||
      (date.getMonth() === dateOfBirth.getMonth() && date.getDate() >= dateOfBirth.getDate());
    if (!hasBirthdayPassed) age--;
    return age;
  }

  private updateScenarioForecastEndDateIfNeeded(): void {
    const next = this.getScenarioForecastEndDate();
    if (!this.scenarioForecastEndDate || this.scenarioForecastEndDate.getTime() !== next.getTime()) {
      this.scenarioForecastEndDate = next;
    }
  }

  private injectTimelineEvents(report: ChartSeries): void {
    if (report.timelineEvents?.length) return;
    const events = this.financialTimeline?.clientEvents ?? [];
    report.timelineEvents = events
      .filter(e => !e.isPlaceHolder)
      .map(e => ({ name: e.name, startYear: e.start.year, iconUrl: e.iconUrl }));
  }

  onBack(): void {
    this.router.navigate(['/cashflows', this.cashflowId, 'reports']);
  }

  onSimulate(): void {
    if (this.financialTimeline && this.client) this.applyScenario();
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

  // ── Category editor methods ─────────────────────────────────────────────

  onGoalSelected(event: ClientEvent): void {
    if (!event || !this.financialTimeline || !this.client) return;

    const eventType = this.DIALOG_SYSTEM_EVENTS.some(name => event.name.startsWith(name))
      ? EventType.SYSTEM
      : this.DIALOG_FINANCING_EVENTS.some(name => event.name.startsWith(name))
        ? EventType.FINANCING
        : EventType.CUSTOM;

    const dialogRef = this.dialog.open(AddEventDialogComponent, {
      width: '700px',
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
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
        eventsList: this.financialTimeline.clientEvents.map((e) => ({
          name: e.name,
          year: e.start.year,
          age: e.start.year - moment(new Date(this.client!.clientDetails.birthDate)).year(),
        })),
        isEditWorkflow: true,
        patchEvent: event,
        financialRecords: [],
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.status === 'Success') {
        if (!this.editedGoals.includes(event.name)) {
          this.editedGoals.push(event.name);
        }
        this.refreshData();
      }
    });
  }

  onSavingPotSelected(pot: ClientSaving): void {
    if (!pot || !this.financialTimeline || !this.client || !this.cashflow) return;

    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {
        returnRate: this.userReturnRate,
        inflationRate: this.cashflow.inflationRate ?? this.client.clientDetails?.inflationRate ?? 0,
        loggedInUserPreferences: this.loggedInUserPreferences,
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: [...this.financialTimeline.clientEvents].sort((a, b) => a.start.age - b.start.age),
        clientBirthDate: this.client.clientDetails.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        cashflowId: this.cashflowId,
        isEditWorkflow: true,
        event: pot,
        existingSavingPots: this.savingPots?.clientSavings || [],
        hasPartner: !!this.client.partnerDetail,
        clientFirstName: this.client.clientDetails?.firstName ?? '',
        partnerFirstName: this.client.partnerDetail?.firstName ?? '',
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.savingPot) {
        if (!this.editedSavingPots.includes(pot.name)) {
          this.editedSavingPots.push(pot.name);
        }
        this.refreshData();
      }
    });
  }

  onIncomeSelected(income: FinancialViewModel): void {
    if (!income || !this.financialTimeline || !this.client || !this.cashflow) return;

    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: [...this.financialTimeline.clientEvents].sort((a, b) => a.start.age - b.start.age),
        clientBirthDate: this.client.clientDetails.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        cashflowId: this.cashflowId,
        selectedIncome: income,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        incomeType: this.buildIncomeTypes(),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.incomeExpense) {
        if (!this.editedIncomes.includes(income.description)) {
          this.editedIncomes.push(income.description);
        }
        this.refreshData();
      }
    });
  }

  onExpenseSelected(expense: FinancialViewModel): void {
    if (!expense || !this.financialTimeline || !this.client || !this.cashflow) return;

    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: [...this.financialTimeline.clientEvents].sort((a, b) => a.start.age - b.start.age),
        clientBirthDate: this.client.clientDetails.birthDate,
        clientPreferredCurrency: this.client.clientDetails.preferredCurrency,
        cashflowId: this.cashflowId,
        selectedExpense: expense,
        isEditWorkflow: true,
        forecastEndDateYear: moment(this.financialTimeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.financialTimeline.forecastStartDate).year(),
        expenseType: this.buildExpenseTypes(),
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.incomeExpense) {
        if (!this.editedExpenses.includes(expense.description)) {
          this.editedExpenses.push(expense.description);
        }
        this.refreshData();
      }
    });
  }

  removeEditedItem(category: 'goals' | 'savingPots' | 'incomes' | 'expenses', name: string): void {
    const listMap: Record<string, string[]> = {
      goals: this.editedGoals,
      savingPots: this.editedSavingPots,
      incomes: this.editedIncomes,
      expenses: this.editedExpenses,
    };
    const list = listMap[category];
    const idx = list.indexOf(name);
    if (idx >= 0) list.splice(idx, 1);
  }

  private refreshData(): void {
    combineLatest([
      this.timelineHttpService.getTimelinebyCashflowId(this.cashflowId),
      this.savingPotsHttpService.getAllSavingsPots(this.cashflowId),
      this.incomeExpensesHttpService.getAllIncomeExpenses(this.cashflowId),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([timeline, savingPots, incomeExpense]) => {
        this.financialTimeline = timeline;
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
        width: '460px',
        data: { defaultName, planName: baseName },
      });
      dialogRef.afterClosed().subscribe((newName: string | undefined) => {
        if (!newName?.trim()) return;
        const birthYear = new Date(this.client!.clientDetails.birthDate).getFullYear();
        const retirementAge = Number(this.scenarioForm.get('retirementAge')?.value) || 65;
        const planUntilDate = new Date(birthYear + retirementAge, 11, 31).toISOString();
        const request = {
          SourceCashflowId: this.cashflowId,
          NewPlanName: newName.trim(),
          InflationRate: Number(this.scenarioForm.get('inflationRate')?.value) ?? undefined,
          PlanUntilDate: planUntilDate,
        };
        this.isLoaderVisible = true;
        this.cashflowHttpService
          .createFromScenario(request)
          .pipe(
            takeUntil(this.destroy$),
            catchError((err) => {
              this.isLoaderVisible = false;
              this.toastr.error(err?.error?.message || 'Failed to create plan from scenario');
              return of(null);
            }),
          )
          .subscribe((newPlan) => {
            this.isLoaderVisible = false;
            if (newPlan) {
              this.toastr.success('Plan created from scenario');
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
