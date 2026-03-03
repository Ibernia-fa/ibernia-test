import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

import { ScenarioLabComponent } from './scenario-lab.component';
import { FinancialWorkflowService } from '../../services/financial-workflow.service';
import { TimelineHttpService } from '../../timeline/services/timeline-http.service';
import { SavingsPotsHttpService } from '../../saving-pots/services/savings-pots-http.service';
import { ReportsHttpService } from '../services/reports-http.service';
import { CashflowHttpService } from 'src/app/clients/services/cashflow-http.service';
import { IncomeExpensesHttpService } from '../../income-expenses/services/income-expenses-http.service';
import { SettingsHttpService } from '../../settings/services/settings-http.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EventIncomeType } from '../../timeline/models/financial-timeline';
import { ChartSeries } from '../models/charts-series.model';

function makeClient(overrides: any = {}) {
  return {
    id: 'client-1',
    clientDetails: {
      birthDate: '1990-01-01',
      preferredCurrency: 'EUR',
      inflationRate: 3,
      country: 'IE',
      firstName: 'John',
      ...overrides.clientDetails,
    },
    partnerDetail: overrides.partnerDetail ?? null,
    ...overrides,
  };
}

function makeCashflow(overrides: any = {}) {
  return {
    id: 'cf-1',
    name: 'My Plan',
    inflationRate: 3,
    ...overrides,
  };
}

function makeEvent(overrides: any = {}) {
  return {
    id: 'e-default',
    name: 'Event',
    type: EventIncomeType.Income,
    iconUrl: 'custom-icon',
    start: { age: 30, year: 2020 },
    end: null,
    isPlaceHolder: false,
    isOneOff: false,
    isDefault: false,
    isCash: false,
    isFinance: false,
    isParent: false,
    isPartnerEvent: false,
    netAmount: { currencySymbol: '€', amount: 0, cycle: null },
    escalationRate: null,
    ...overrides,
  };
}

function makeTimeline(overrides: any = {}) {
  return {
    id: 'tl-1',
    forecastStartDate: new Date(2026, 0, 1),
    forecastEndtDate: new Date(2055, 11, 31),
    clientBirthDate: new Date(1990, 0, 1),
    clientEvents: [
      makeEvent({ id: 'e1', name: 'Home', type: EventIncomeType.Expense, iconUrl: 'home-icon', start: { age: 40, year: 2030 }, isOneOff: true, isFinance: true }),
      makeEvent({ id: 'e2', name: 'Retirement', iconUrl: 'custom-icon', start: { age: 65, year: 2055 }, isPlaceHolder: true }),
      makeEvent({ id: 'e3', name: 'Retirement age', start: { age: 65, year: 2055 } }),
    ],
    cashflow: { id: 'cf-1' },
    ...overrides,
  };
}

function makeIncomeExpense(overrides: any = {}) {
  return {
    id: 'ie-1',
    totalIncome: 5000,
    totalExpenses: 3000,
    total: 2000,
    savingRate: 0.4,
    incomes: [
      { id: 'inc-1', description: 'Salary', amount: { currencySymbol: '€', amount: 4000, cycle: null }, start: { age: 30, year: 2020 }, end: { age: 65, year: 2055 }, escalationRate: null, isDefault: true, isIncomeExpenseSource: true, icon: 'salary-icon' },
      { id: 'inc-2', description: 'Pension Fund', amount: { currencySymbol: '€', amount: 1000, cycle: null }, start: { age: 65, year: 2055 }, end: { age: 90, year: 2080 }, escalationRate: null, isDefault: false, isIncomeExpenseSource: false, icon: 'pension-fund' },
    ],
    expenses: [
      { id: 'exp-1', description: 'Living costs', amount: { currencySymbol: '€', amount: 3000, cycle: null }, start: { age: 30, year: 2020 }, end: { age: 90, year: 2080 }, escalationRate: null, isDefault: true, isIncomeExpenseSource: true, icon: 'living-icon' },
    ],
    client: {},
    cashflow: {},
    financialAdvisor: {},
    ...overrides,
  };
}

function makeSavingPots(overrides: any = {}) {
  return {
    id: 'sp-1',
    totalSavings: 10000,
    totalGwothRate: 0,
    clientSavings: [
      { id: 'pot-1', name: 'Investment', type: 1, iconUrl: 'investment-icon', startingPotValue: { currencySymbol: '€', amount: 10000, cycle: null }, nominalValue: 0, realValue: 0, realGrowthRate: 0, inflationRate: 0, isGrowing: true },
    ],
    client: {},
    cashflow: {},
    financialAdvisor: {},
    ...overrides,
  };
}

function makeReport(overrides: any = {}): ChartSeries {
  return {
    series: [
      { name: 'Savings', color: '#4caf50', data: [100, 200, 300], id: 's1', order: 0 },
    ],
    categories: ['2026', '2027', '2028'],
    timelineEvents: [],
    ...overrides,
  };
}

describe('ScenarioLabComponent', () => {
  let component: ScenarioLabComponent;
  let fixture: ComponentFixture<ScenarioLabComponent>;

  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastr: jasmine.SpyObj<ToastrService>;
  let mockFinancialWorkflowService: jasmine.SpyObj<FinancialWorkflowService>;
  let mockTimelineHttpService: jasmine.SpyObj<TimelineHttpService>;
  let mockSavingPotsHttpService: jasmine.SpyObj<SavingsPotsHttpService>;
  let mockReportsHttpService: jasmine.SpyObj<ReportsHttpService>;
  let mockCashflowHttpService: jasmine.SpyObj<CashflowHttpService>;
  let mockIncomeExpensesHttpService: jasmine.SpyObj<IncomeExpensesHttpService>;
  let mockSettingsHttpService: jasmine.SpyObj<SettingsHttpService>;
  let mockNavItemService: { currentRouteName: string };
  let userData$: BehaviorSubject<any>;

  const client = makeClient();
  const cashflow = makeCashflow();
  const timeline = makeTimeline();
  const incomeExpense = makeIncomeExpense();
  const savingPots = makeSavingPots();
  const report = makeReport();

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    mockFinancialWorkflowService = jasmine.createSpyObj('FinancialWorkflowService', ['loadClientCashflowMetadata']);
    mockTimelineHttpService = jasmine.createSpyObj('TimelineHttpService', ['getTimelinebyCashflowId']);
    mockSavingPotsHttpService = jasmine.createSpyObj('SavingsPotsHttpService', ['getAllSavingsPots']);
    mockReportsHttpService = jasmine.createSpyObj('ReportsHttpService', ['getReportScenario']);
    mockCashflowHttpService = jasmine.createSpyObj('CashflowHttpService', ['getByClientId', 'createFromScenario']);
    mockIncomeExpensesHttpService = jasmine.createSpyObj('IncomeExpensesHttpService', ['getAllIncomeExpenses']);
    mockSettingsHttpService = jasmine.createSpyObj('SettingsHttpService', ['getAmountCycles', 'getEscalationRates']);
    mockNavItemService = { currentRouteName: '' };
    userData$ = new BehaviorSubject<any>({ preferences: { investmentReturn: 5, inflationRate: 2.5 } });

    mockFinancialWorkflowService.loadClientCashflowMetadata.and.returnValue(of([client, cashflow]));
    mockTimelineHttpService.getTimelinebyCashflowId.and.returnValue(of(timeline));
    mockSavingPotsHttpService.getAllSavingsPots.and.returnValue(of(savingPots));
    mockIncomeExpensesHttpService.getAllIncomeExpenses.and.returnValue(of(incomeExpense));
    mockSettingsHttpService.getAmountCycles.and.returnValue(of([]));
    mockSettingsHttpService.getEscalationRates.and.returnValue(of({ escalationRates: [], id: '' }));
    mockReportsHttpService.getReportScenario.and.returnValue(of(report));

    await TestBed.configureTestingModule({
      imports: [
        ScenarioLabComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        TablerIconsModule.pick(TablerIcons),
      ],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'cf-1' } } } },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ToastrService, useValue: mockToastr },
        { provide: FinancialWorkflowService, useValue: mockFinancialWorkflowService },
        { provide: TimelineHttpService, useValue: mockTimelineHttpService },
        { provide: SavingsPotsHttpService, useValue: mockSavingPotsHttpService },
        { provide: ReportsHttpService, useValue: mockReportsHttpService },
        { provide: CashflowHttpService, useValue: mockCashflowHttpService },
        { provide: IncomeExpensesHttpService, useValue: mockIncomeExpensesHttpService },
        { provide: SettingsHttpService, useValue: mockSettingsHttpService },
        { provide: SettingsService, useValue: { userData$ } },
        { provide: NavItemService, useValue: mockNavItemService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioLabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set cashflowId from route params', () => {
    expect(component.cashflowId).toBe('cf-1');
  });

  it('should initialise scenarioForm with default values', () => {
    expect(component.scenarioForm.get('inflationRate')?.value).toBe(2.5);
    expect(component.scenarioForm.get('retirementAge')?.value).toBe(65);
  });

  // ── ngOnInit / data loading ─────────────────────────────────────────────

  describe('ngOnInit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set navItemService route name', () => {
      expect(mockNavItemService.currentRouteName).toBe('Scenario Lab');
    });

    it('should load user preferences from SettingsService', () => {
      expect(component.loggedInUserPreferences).toEqual({ investmentReturn: 5, inflationRate: 2.5 });
      expect(component.userReturnRate).toBe(5);
    });

    it('should load client and cashflow', () => {
      expect(component.client).toEqual(client as any);
      expect(component.cashflow).toEqual(cashflow as any);
    });

    it('should load timeline, saving pots, and income/expense data', () => {
      expect(component.financialTimeline).toBeTruthy();
      expect(component.savingPots).toBeTruthy();
      expect(component.incomeExpenseData).toBeTruthy();
    });

    it('should set baseline forecast dates', () => {
      expect(component.baselineForecastStartDate).toEqual(new Date(2026, 0, 1));
      expect(component.baselineForecastEndDate).toEqual(new Date(2055, 11, 31));
    });

    it('should store the initial report as baselineReport', () => {
      expect(component.baselineReport).toEqual(report);
      expect(component.displayedReport).toEqual(report);
    });

    it('should set activeTab to after', () => {
      expect(component.activeTab).toBe('after');
    });
  });

  // ── populateCategoryItems ───────────────────────────────────────────────

  describe('populateCategoryItems', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate goalItems excluding placeholder events', () => {
      expect(component.goalItems.length).toBe(2);
      expect(component.goalItems[0].name).toBe('Home');
    });

    it('should populate savingPotItems from savingPots', () => {
      expect(component.savingPotItems.length).toBe(1);
      expect(component.savingPotItems[0].name).toBe('Investment');
    });

    it('should filter out pension fund annuity from incomeItems', () => {
      expect(component.incomeItems.length).toBe(1);
      expect(component.incomeItems[0].description).toBe('Salary');
      expect(component.incomeItems.some(i => i.description === 'Pension Fund')).toBeFalse();
    });

    it('should populate expenseItems', () => {
      expect(component.expenseItems.length).toBe(1);
      expect(component.expenseItems[0].description).toBe('Living costs');
    });
  });

  // ── initFormFromPlan ────────────────────────────────────────────────────

  describe('initFormFromPlan', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set baselineInflationRate from cashflow', () => {
      expect(component.baselineInflationRate).toBe(3);
    });

    it('should derive baselineRetirementAge from retirement event on timeline', () => {
      expect(component.baselineRetirementAge).toBe(65);
    });

    it('should set hasRetirementAge to true when retirement age event exists', () => {
      expect(component.hasRetirementAge).toBeTrue();
    });

    it('should patch the form with baseline values', () => {
      expect(component.scenarioForm.get('inflationRate')?.value).toBe(3);
      expect(component.scenarioForm.get('retirementAge')?.value).toBe(65);
    });

    it('should compute minRetirementAge from current age', () => {
      const currentYear = new Date().getFullYear();
      const expectedMin = Math.max(18, currentYear - 1990);
      expect(component.minRetirementAge).toBe(expectedMin);
    });

    it('should set maxRetirementAge to 100', () => {
      expect(component.maxRetirementAge).toBe(100);
    });

    it('should set clientFirstName from client details', () => {
      expect(component.clientFirstName).toBe('John');
    });
  });

  // ── buildScenarioPayload (via onSimulate) ───────────────────────────────

  describe('buildScenarioPayload', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should build payload with current form values', () => {
      component.scenarioForm.patchValue({ inflationRate: 5, retirementAge: 70 });
      component.onSimulate();

      const args = mockReportsHttpService.getReportScenario.calls.mostRecent().args;
      expect(args[0]).toBe('cf-1');
      const payload = args[1];
      expect(payload.InflationRate).toBe(5);
      const endDate = new Date(payload.ForecastEndDate);
      expect(endDate.getFullYear()).toBe(1990 + 70);
    });

    it('should not include SavingPotId or ReturnRateOverride', () => {
      component.onSimulate();
      const payload = mockReportsHttpService.getReportScenario.calls.mostRecent().args[1];
      expect((payload as any).SavingPotId).toBeUndefined();
      expect((payload as any).ReturnRateOverride).toBeUndefined();
    });
  });

  // ── getShortfallStatus ──────────────────────────────────────────────────

  describe('getShortfallStatus', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set hasShortfall=false when no Shortfall series', () => {
      component.getShortfallStatus(makeReport());
      expect(component.hasShortfall).toBeFalse();
      expect(component.firstShortfallAge).toBeNull();
    });

    it('should set hasShortfall=false when no negative values', () => {
      const r = makeReport({
        series: [{ name: 'Shortfall', color: '#f00', data: [100, 200], id: 'sf', order: 0 }],
        categories: ['2030', '2031'],
      });
      component.getShortfallStatus(r);
      expect(component.hasShortfall).toBeFalse();
    });

    it('should detect shortfall and compute age', () => {
      const r = makeReport({
        series: [{ name: 'Shortfall', color: '#f00', data: [100, -50], id: 'sf', order: 0 }],
        categories: ['2060', '2065'],
      });
      component.getShortfallStatus(r);
      expect(component.hasShortfall).toBeTrue();
      // birthYear=1990, shortfall year=2065 → age 75
      expect(component.firstShortfallAge).toBe(75);
    });
  });

  // ── switchTab ───────────────────────────────────────────────────────────

  describe('switchTab', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should switch to before tab and show baseline report', () => {
      component.switchTab('before');
      expect(component.activeTab).toBe('before');
      expect(component.displayedReport).toBe(component.baselineReport);
    });

    it('should switch to after tab and show scenario report', () => {
      component.switchTab('before');
      component.switchTab('after');
      expect(component.activeTab).toBe('after');
      expect(component.displayedReport).toBe(component.report);
    });
  });

  // ── onNumericInputChange ────────────────────────────────────────────────

  describe('onNumericInputChange', () => {
    it('should update form control with valid numeric value', () => {
      const event = { target: { value: '7.5' } } as any;
      component.onNumericInputChange('inflationRate', event);
      expect(component.scenarioForm.get('inflationRate')?.value).toBe(7.5);
    });

    it('should not update form control with NaN', () => {
      component.scenarioForm.patchValue({ inflationRate: 3 });
      const event = { target: { value: 'abc' } } as any;
      component.onNumericInputChange('inflationRate', event);
      expect(component.scenarioForm.get('inflationRate')?.value).toBe(3);
    });
  });

  // ── getRetirementAge ────────────────────────────────────────────────────

  describe('getRetirementAge', () => {
    it('should return the form value', () => {
      component.scenarioForm.patchValue({ retirementAge: 70 });
      expect(component.getRetirementAge()).toBe(70);
    });

    it('should default to 65 when form value is falsy', () => {
      component.scenarioForm.patchValue({ retirementAge: 0 });
      expect(component.getRetirementAge()).toBe(65);
    });
  });

  // ── onBack ──────────────────────────────────────────────────────────────

  describe('onBack', () => {
    it('should navigate to reports page', () => {
      component.onBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cashflows', 'cf-1', 'reports']);
    });
  });

  // ── onSimulate ──────────────────────────────────────────────────────────

  describe('onSimulate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call the scenario report API', () => {
      mockReportsHttpService.getReportScenario.calls.reset();
      component.onSimulate();
      expect(mockReportsHttpService.getReportScenario).toHaveBeenCalled();
    });

    it('should not call API when financialTimeline is null', () => {
      component.financialTimeline = null;
      mockReportsHttpService.getReportScenario.calls.reset();
      component.onSimulate();
      expect(mockReportsHttpService.getReportScenario).not.toHaveBeenCalled();
    });
  });

  // ── Category editor methods ─────────────────────────────────────────────

  describe('onGoalSelected', () => {
    let dialogAfterClosed$: Subject<any>;

    beforeEach(() => {
      fixture.detectChanges();
      dialogAfterClosed$ = new Subject();
      mockDialog.open.and.returnValue({ afterClosed: () => dialogAfterClosed$.asObservable() } as MatDialogRef<any>);
    });

    it('should not open dialog if event is null', () => {
      component.onGoalSelected(null as any);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open AddEventDialogComponent with edit data', () => {
      const goal = component.goalItems[0];
      component.onGoalSelected(goal);
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.isEditWorkflow).toBeTrue();
      expect(dialogData.patchEvent).toBe(goal);
    });

    it('should detect FINANCING event type for Home', () => {
      const goal = component.goalItems[0]; // "Home"
      component.onGoalSelected(goal);
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.eventType).toBe('Financing');
    });

    it('should track edited goal after successful dialog close', () => {
      const goal = component.goalItems[0];
      component.onGoalSelected(goal);
      dialogAfterClosed$.next({ status: 'Success' });
      expect(component.editedGoals).toContain('Home');
    });

    it('should not track if dialog is cancelled', () => {
      const goal = component.goalItems[0];
      component.onGoalSelected(goal);
      dialogAfterClosed$.next(null);
      expect(component.editedGoals.length).toBe(0);
    });

    it('should not duplicate edited goal names', () => {
      const goal = component.goalItems[0];
      component.onGoalSelected(goal);
      dialogAfterClosed$.next({ status: 'Success' });
      component.onGoalSelected(goal);
      dialogAfterClosed$.next({ status: 'Success' });
      expect(component.editedGoals.filter(g => g === 'Home').length).toBe(1);
    });
  });

  describe('onIncomeSelected', () => {
    let dialogAfterClosed$: Subject<any>;

    beforeEach(() => {
      fixture.detectChanges();
      dialogAfterClosed$ = new Subject();
      mockDialog.open.and.returnValue({ afterClosed: () => dialogAfterClosed$.asObservable() } as MatDialogRef<any>);
    });

    it('should open AddIncomeComponent with edit data', () => {
      const income = component.incomeItems[0];
      component.onIncomeSelected(income);
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.isEditWorkflow).toBeTrue();
      expect(dialogData.selectedIncome).toBe(income);
    });

    it('should track edited income after successful dialog close', () => {
      const income = component.incomeItems[0];
      component.onIncomeSelected(income);
      dialogAfterClosed$.next({ incomeExpense: {} });
      expect(component.editedIncomes).toContain('Salary');
    });
  });

  describe('onExpenseSelected', () => {
    let dialogAfterClosed$: Subject<any>;

    beforeEach(() => {
      fixture.detectChanges();
      dialogAfterClosed$ = new Subject();
      mockDialog.open.and.returnValue({ afterClosed: () => dialogAfterClosed$.asObservable() } as MatDialogRef<any>);
    });

    it('should open AddExpenseComponent with edit data', () => {
      const expense = component.expenseItems[0];
      component.onExpenseSelected(expense);
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.isEditWorkflow).toBeTrue();
      expect(dialogData.selectedExpense).toBe(expense);
    });

    it('should track edited expense after successful dialog close', () => {
      const expense = component.expenseItems[0];
      component.onExpenseSelected(expense);
      dialogAfterClosed$.next({ incomeExpense: {} });
      expect(component.editedExpenses).toContain('Living costs');
    });
  });

  describe('onSavingPotSelected', () => {
    let dialogAfterClosed$: Subject<any>;

    beforeEach(() => {
      fixture.detectChanges();
      dialogAfterClosed$ = new Subject();
      mockDialog.open.and.returnValue({ afterClosed: () => dialogAfterClosed$.asObservable() } as MatDialogRef<any>);
    });

    it('should open AddNewPotComponent with edit data', () => {
      const pot = component.savingPotItems[0];
      component.onSavingPotSelected(pot);
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.isEditWorkflow).toBeTrue();
      expect(dialogData.event).toBe(pot);
    });

    it('should track edited pot after successful dialog close', () => {
      const pot = component.savingPotItems[0];
      component.onSavingPotSelected(pot);
      dialogAfterClosed$.next({ savingPot: {} });
      expect(component.editedSavingPots).toContain('Investment');
    });
  });

  // ── onCreatePlanFromScenario ────────────────────────────────────────────

  describe('onCreatePlanFromScenario', () => {
    let nameDialogAfterClosed$: Subject<any>;

    beforeEach(() => {
      fixture.detectChanges();
      nameDialogAfterClosed$ = new Subject();
      mockDialog.open.and.returnValue({ afterClosed: () => nameDialogAfterClosed$.asObservable() } as MatDialogRef<any>);
    });

    it('should not open dialog when cashflow is null', () => {
      component.cashflow = null;
      component.onCreatePlanFromScenario();
      expect(mockCashflowHttpService.getByClientId).not.toHaveBeenCalled();
    });

    it('should generate default name "Plan - Scenario" when none exists', () => {
      mockCashflowHttpService.getByClientId.and.returnValue(of([]));
      component.onCreatePlanFromScenario();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.defaultName).toBe('My Plan - Scenario');
    });

    it('should generate "Plan - Scenario 2" when first scenario exists', () => {
      mockCashflowHttpService.getByClientId.and.returnValue(of([
        { name: 'My Plan - Scenario', id: 'x' } as any,
      ]));
      component.onCreatePlanFromScenario();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.defaultName).toBe('My Plan - Scenario 2');
    });

    it('should increment to "Plan - Scenario 3" when 2 also exists', () => {
      mockCashflowHttpService.getByClientId.and.returnValue(of([
        { name: 'My Plan - Scenario', id: 'x' } as any,
        { name: 'My Plan - Scenario 2', id: 'y' } as any,
      ]));
      component.onCreatePlanFromScenario();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.defaultName).toBe('My Plan - Scenario 3');
    });

    it('should call createFromScenario with correct request', () => {
      mockCashflowHttpService.getByClientId.and.returnValue(of([]));
      mockCashflowHttpService.createFromScenario.and.returnValue(of({ id: 'new-cf', name: 'My Plan - Scenario' } as any));
      component.onCreatePlanFromScenario();
      nameDialogAfterClosed$.next('My Plan - Scenario');

      expect(mockCashflowHttpService.createFromScenario).toHaveBeenCalled();
      const request = mockCashflowHttpService.createFromScenario.calls.mostRecent().args[0];
      expect(request.SourceCashflowId).toBe('cf-1');
      expect(request.NewPlanName).toBe('My Plan - Scenario');
      expect((request as any).SavingPotId).toBeUndefined();
      expect((request as any).ReturnRateOverride).toBeUndefined();
    });

    it('should navigate to new plan on success', () => {
      mockCashflowHttpService.getByClientId.and.returnValue(of([]));
      mockCashflowHttpService.createFromScenario.and.returnValue(of({ id: 'new-cf' } as any));
      component.onCreatePlanFromScenario();
      nameDialogAfterClosed$.next('Test');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cashflows', 'new-cf', 'reports']);
      expect(mockToastr.success).toHaveBeenCalled();
    });

    it('should not call createFromScenario when dialog returns empty name', () => {
      mockCashflowHttpService.getByClientId.and.returnValue(of([]));
      component.onCreatePlanFromScenario();
      nameDialogAfterClosed$.next('');
      expect(mockCashflowHttpService.createFromScenario).not.toHaveBeenCalled();
    });
  });

  // ── getScenarioForecastEndDate ──────────────────────────────────────────

  describe('getScenarioForecastEndDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute end date from birth year + retirement age', () => {
      component.scenarioForm.patchValue({ retirementAge: 70 });
      const result = component.getScenarioForecastEndDate();
      // birthYear=1990 + 70 = 2060, December 31
      expect(result.getFullYear()).toBe(2060);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });
  });

  // ── hasRetirementAge = false when no retirement event ──────────────────

  describe('retirement age missing', () => {
    it('should set hasRetirementAge=false when no retirement event in timeline', () => {
      const noRetTimeline = makeTimeline({
        clientEvents: [
          makeEvent({ id: 'e1', name: 'Home', type: EventIncomeType.Expense, start: { age: 40, year: 2030 }, isFinance: true }),
        ],
      });
      mockTimelineHttpService.getTimelinebyCashflowId.and.returnValue(of(noRetTimeline));
      fixture.detectChanges();
      expect(component.hasRetirementAge).toBeFalse();
    });

    it('should not patch retirementAge form control when no retirement event', () => {
      const noRetTimeline = makeTimeline({
        clientEvents: [
          makeEvent({ id: 'e1', name: 'Home', type: EventIncomeType.Expense, start: { age: 40, year: 2030 }, isFinance: true }),
        ],
      });
      mockTimelineHttpService.getTimelinebyCashflowId.and.returnValue(of(noRetTimeline));
      fixture.detectChanges();
      expect(component.scenarioForm.get('retirementAge')?.value).toBe(65);
    });
  });

  // ── Partner retirement age support ────────────────────────────────────

  describe('partner retirement age', () => {
    const partnerClient = makeClient({
      partnerDetail: { firstName: 'Jane', birthDate: '1992-06-15', preferredCurrency: 'EUR', country: 'IE' },
    });
    const partnerTimeline = makeTimeline({
      clientEvents: [
        makeEvent({ id: 'e1', name: 'Home', type: EventIncomeType.Expense, start: { age: 40, year: 2030 }, isFinance: true }),
        makeEvent({ id: 'e3', name: 'Retirement age', start: { age: 65, year: 2055 } }),
        makeEvent({ id: 'e4', name: 'Retirement age', start: { age: 63, year: 2055 }, isPartnerEvent: true }),
      ],
    });

    beforeEach(() => {
      mockFinancialWorkflowService.loadClientCashflowMetadata.and.returnValue(of([partnerClient, cashflow]));
      mockTimelineHttpService.getTimelinebyCashflowId.and.returnValue(of(partnerTimeline));
      fixture.detectChanges();
    });

    it('should set hasPartnerRetirementAge=true', () => {
      expect(component.hasPartnerRetirementAge).toBeTrue();
    });

    it('should derive baselinePartnerRetirementAge from partner event', () => {
      expect(component.baselinePartnerRetirementAge).toBe(63);
    });

    it('should add partnerRetirementAge form control', () => {
      expect(component.scenarioForm.get('partnerRetirementAge')).toBeTruthy();
      expect(component.scenarioForm.get('partnerRetirementAge')?.value).toBe(63);
    });

    it('should set partnerFirstName', () => {
      expect(component.partnerFirstName).toBe('Jane');
    });

    it('should compute minPartnerRetirementAge from partner current age', () => {
      const currentYear = new Date().getFullYear();
      const expectedMin = Math.max(18, currentYear - 1992);
      expect(component.minPartnerRetirementAge).toBe(expectedMin);
    });
  });

  // ── "Before:" label edited flags ─────────────────────────────────────

  describe('edited flags for Before labels', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start with inflationEdited=false', () => {
      expect(component.inflationEdited).toBeFalse();
    });

    it('should return inflationEdited=true when inflation value differs from baseline', () => {
      component.scenarioForm.patchValue({ inflationRate: 5 });
      expect(component.inflationEdited).toBeTrue();
    });

    it('should return inflationEdited=false when value returns to baseline', () => {
      component.scenarioForm.patchValue({ inflationRate: 5 });
      expect(component.inflationEdited).toBeTrue();
      component.scenarioForm.patchValue({ inflationRate: component.baselineInflationRate });
      expect(component.inflationEdited).toBeFalse();
    });

    it('should start with retirementAgeEdited=false', () => {
      expect(component.retirementAgeEdited).toBeFalse();
    });

    it('should return retirementAgeEdited=true when retirement age value differs from baseline', () => {
      component.scenarioForm.patchValue({ retirementAge: 70 });
      expect(component.retirementAgeEdited).toBeTrue();
    });

    it('should return retirementAgeEdited=false when value returns to baseline', () => {
      component.scenarioForm.patchValue({ retirementAge: 70 });
      expect(component.retirementAgeEdited).toBeTrue();
      component.scenarioForm.patchValue({ retirementAge: component.baselineRetirementAge });
      expect(component.retirementAgeEdited).toBeFalse();
    });
  });

  describe('partner edited flag', () => {
    const partnerClient = makeClient({
      partnerDetail: { firstName: 'Jane', birthDate: '1992-06-15', preferredCurrency: 'EUR', country: 'IE' },
    });
    const partnerTimeline = makeTimeline({
      clientEvents: [
        makeEvent({ id: 'e3', name: 'Retirement age', start: { age: 65, year: 2055 } }),
        makeEvent({ id: 'e4', name: 'Retirement age', start: { age: 63, year: 2055 }, isPartnerEvent: true }),
      ],
    });

    beforeEach(() => {
      mockFinancialWorkflowService.loadClientCashflowMetadata.and.returnValue(of([partnerClient, cashflow]));
      mockTimelineHttpService.getTimelinebyCashflowId.and.returnValue(of(partnerTimeline));
      fixture.detectChanges();
    });

    it('should start with partnerRetirementAgeEdited=false', () => {
      expect(component.partnerRetirementAgeEdited).toBeFalse();
    });

    it('should return partnerRetirementAgeEdited=true when partner retirement age differs from baseline', () => {
      component.scenarioForm.patchValue({ partnerRetirementAge: 70 });
      expect(component.partnerRetirementAgeEdited).toBeTrue();
    });
  });

  // ── buildScenarioPayload with partner max ─────────────────────────────

  describe('buildScenarioPayload with partner retirement age', () => {
    const partnerClient = makeClient({
      partnerDetail: { firstName: 'Jane', birthDate: '1992-06-15', preferredCurrency: 'EUR', country: 'IE' },
    });
    const partnerTimeline = makeTimeline({
      clientEvents: [
        makeEvent({ id: 'e3', name: 'Retirement age', start: { age: 65, year: 2055 } }),
        makeEvent({ id: 'e4', name: 'Retirement age', start: { age: 63, year: 2055 }, isPartnerEvent: true }),
      ],
    });

    beforeEach(() => {
      mockFinancialWorkflowService.loadClientCashflowMetadata.and.returnValue(of([partnerClient, cashflow]));
      mockTimelineHttpService.getTimelinebyCashflowId.and.returnValue(of(partnerTimeline));
      fixture.detectChanges();
    });

    it('should use max of main and partner retirement ages for ForecastEndDate', () => {
      component.scenarioForm.patchValue({ retirementAge: 65, partnerRetirementAge: 70 });
      component.onSimulate();

      const args = mockReportsHttpService.getReportScenario.calls.mostRecent().args;
      const endDate = new Date(args[1].ForecastEndDate);
      // main: 1990 + 65 = 2055, partner: 1992 + 70 = 2062 → max = 2062
      expect(endDate.getFullYear()).toBe(2062);
    });

    it('should use main retirement age when it produces a later end year', () => {
      component.scenarioForm.patchValue({ retirementAge: 80, partnerRetirementAge: 63 });
      component.onSimulate();

      const args = mockReportsHttpService.getReportScenario.calls.mostRecent().args;
      const endDate = new Date(args[1].ForecastEndDate);
      // main: 1990 + 80 = 2070, partner: 1992 + 63 = 2055 → max = 2070
      expect(endDate.getFullYear()).toBe(2070);
    });
  });

  // ── ngOnDestroy ─────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  // ── alignSeriesStructure (via simulate) ─────────────────────────────────

  describe('alignSeriesStructure', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add missing series to both baseline and scenario for smooth morphing', () => {
      component.baselineReport = makeReport({
        series: [{ name: 'Savings', color: '#0f0', data: [1, 2], id: 's1', order: 0 }],
        categories: ['2026', '2027'],
      });
      const scenarioWithExtra = makeReport({
        series: [
          { name: 'Savings', color: '#0f0', data: [1, 2, 3], id: 's1', order: 0 },
          { name: 'Shortfall', color: '#f00', data: [-1, -2, -3], id: 's2', order: 1 },
        ],
        categories: ['2026', '2027', '2028'],
      });
      mockReportsHttpService.getReportScenario.and.returnValue(of(scenarioWithExtra));
      component.onSimulate();

      // Categories are unified to the superset ['2026','2027','2028']
      expect(component.baselineReport!.categories).toEqual(['2026', '2027', '2028']);

      // baseline Savings series is padded with 0 for the extra year
      const baselineSavings = component.baselineReport!.series.find(s => s.name === 'Savings');
      expect(baselineSavings!.data).toEqual([1, 2, 0]);

      // baseline should now have a Shortfall series filled with zeros (3 categories)
      const baselineShortfall = component.baselineReport!.series.find(s => s.name === 'Shortfall');
      expect(baselineShortfall).toBeTruthy();
      expect(baselineShortfall!.data).toEqual([0, 0, 0]);
    });
  });

  // ── buildIncomeTypes / buildExpenseTypes ─────────────────────────────────

  describe('buildIncomeTypes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should always include Custom', () => {
      const types = component['buildIncomeTypes']();
      expect(types).toContain('Custom');
    });

    it('should include Salary when no default Salary income exists', () => {
      component.incomeExpenseData = makeIncomeExpense({
        incomes: [
          { id: 'inc-1', description: 'Rental income', isDefault: false, icon: 'rental-income', amount: { currencySymbol: '€', amount: 0, cycle: null }, start: { age: 0, year: 0 }, end: { age: 0, year: 0 }, escalationRate: null, isIncomeExpenseSource: true },
        ],
      }) as any;
      const types = component['buildIncomeTypes']();
      expect(types).toContain('Salary');
      expect(types).toContain('State pension');
    });
  });

  describe('buildExpenseTypes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should always include Custom', () => {
      const types = component['buildExpenseTypes']();
      expect(types).toContain('Custom');
    });
  });

  // ── incomeType / expenseType passed to dialogs ──────────────────────────

  describe('dialog data for income/expense editors', () => {
    let dialogAfterClosed$: Subject<any>;

    beforeEach(() => {
      fixture.detectChanges();
      dialogAfterClosed$ = new Subject();
      mockDialog.open.and.returnValue({ afterClosed: () => dialogAfterClosed$.asObservable() } as MatDialogRef<any>);
    });

    it('should pass non-empty incomeType array to AddIncomeComponent', () => {
      const income = component.incomeItems[0];
      component.onIncomeSelected(income);
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.incomeType.length).toBeGreaterThan(0);
      expect(dialogData.incomeType).toContain('Custom');
    });

    it('should pass eventsList to AddIncomeComponent', () => {
      const income = component.incomeItems[0];
      component.onIncomeSelected(income);
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.eventsList).toBeDefined();
      expect(Array.isArray(dialogData.eventsList)).toBeTrue();
    });

    it('should pass non-empty expenseType array to AddExpenseComponent', () => {
      const expense = component.expenseItems[0];
      component.onExpenseSelected(expense);
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.expenseType.length).toBeGreaterThan(0);
      expect(dialogData.expenseType).toContain('Custom');
    });

    it('should pass eventsList to AddExpenseComponent', () => {
      const expense = component.expenseItems[0];
      component.onExpenseSelected(expense);
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.eventsList).toBeDefined();
      expect(Array.isArray(dialogData.eventsList)).toBeTrue();
    });
  });

  // ── injectTimelineEvents ────────────────────────────────────────────────

  describe('injectTimelineEvents', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should inject events from financialTimeline when report has none', () => {
      const emptyReport = makeReport({ timelineEvents: [] });
      component['injectTimelineEvents'](emptyReport);
      expect(emptyReport.timelineEvents.length).toBe(2);
      expect(emptyReport.timelineEvents[0].name).toBe('Home');
    });

    it('should not overwrite existing timelineEvents', () => {
      const existingEvents = [{ name: 'Existing', startYear: 2030, iconUrl: 'icon' }];
      const reportWithEvents = makeReport({ timelineEvents: existingEvents });
      component['injectTimelineEvents'](reportWithEvents);
      expect(reportWithEvents.timelineEvents).toBe(existingEvents);
    });

    it('should exclude placeholder events', () => {
      const emptyReport = makeReport({ timelineEvents: [] });
      component['injectTimelineEvents'](emptyReport);
      const names = emptyReport.timelineEvents.map((e: any) => e.name);
      expect(names).not.toContain('Retirement');
    });
  });
});
