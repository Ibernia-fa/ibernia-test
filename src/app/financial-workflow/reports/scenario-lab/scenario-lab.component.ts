import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { switchMap, tap, takeUntil, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';

import { FinancialWorkflowService } from '../../services/financial-workflow.service';
import { TimelineHttpService } from '../../timeline/services/timeline-http.service';
import { SavingsPotsHttpService } from '../../saving-pots/services/savings-pots-http.service';
import { ReportsHttpService, ReportScenarioPayload } from '../services/reports-http.service';
import { CashflowHttpService } from 'src/app/clients/services/cashflow-http.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { FinancialTimeline, EventIncomeType } from '../../timeline/models/financial-timeline';
import { SavingPotsModel, ClientSaving, SavingPotType } from '../../saving-pots/models/saving-pots.model';
import { ChartSeries } from '../models/charts-series.model';
import { SavingsBarStackedChartComponent } from '../savings-bar-stacked-chart/savings-bar-stacked-chart.component';
import { ToastrService } from 'ngx-toastr';
import { ScenarioNameDialogComponent } from './scenario-name-dialog/scenario-name-dialog.component';

export interface ScenarioChangeItem {
  id: string;
  label: string;
  type: 'income' | 'expense' | 'goal' | 'contribution' | 'withdrawal' | string;
}

@Component({
  selector: 'app-scenario-lab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatMenuModule,
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
  /** Stable forecast end date for the chart; updated only when report is set to avoid redraw loops. */
  scenarioForecastEndDate: Date | null = null;
  isLoaderVisible = false;
  scenarioForm: FormGroup;
  nonCashPots: ClientSaving[] = [];
  hasShortfall = false;
  firstShortfallAge: number | null = null;

  /** Items available to add as "Other changes" chips */
  availableChangeItems: ScenarioChangeItem[] = [];
  /** Currently selected other-change chips */
  otherChanges: ScenarioChangeItem[] = [];

  /** The unmodified baseline plan report (stored once on first load) */
  baselineReport: ChartSeries | null = null;
  /** The report currently shown in the chart — either baseline or scenario */
  displayedReport: ChartSeries | null = null;
  /** Controls which tab is active in the chart card */
  activeTab: 'before' | 'after' = 'after';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private financialWorkflowService: FinancialWorkflowService,
    private timelineHttpService: TimelineHttpService,
    private savingPotsHttpService: SavingsPotsHttpService,
    private reportsHttpService: ReportsHttpService,
    private cashflowHttpService: CashflowHttpService,
    private navItemService: NavItemService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: ToastrService,
  ) {
    this.cashflowId = this.route.snapshot.params['id'] || '';
    this.scenarioForm = this.fb.group({
      inflationRate: [2.5],
      retirementAge: [65],
      selectedPotId: [null as string | null],
      returnRateOverride: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.navItemService.currentRouteName = 'Scenario Lab';

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
          ])
        ),
        tap(([timeline, savingPots]) => {
          this.financialTimeline = timeline;
          this.savingPots = savingPots;
          this.buildNonCashPots();
          this.initFormFromPlan();
          this.populateAvailableChanges();
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
          this.report = report;
          // Store as baseline (only on initial load)
          if (!this.baselineReport) {
            this.baselineReport = report;
          }
          this.displayedReport = report;
          this.activeTab = 'after';
          this.scenarioForecastEndDate = this.getScenarioForecastEndDate();
          this.getShortfallStatus(report);
        }
      });

    this.scenarioForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      )
      .subscribe(() => {
        if (this.financialTimeline && this.client) this.applyScenario();
      });
  }

  private buildNonCashPots(): void {
    if (!this.savingPots?.clientSavings) {
      this.nonCashPots = [];
      return;
    }
    const nonCash = this.savingPots.clientSavings.filter((p) => p.type !== SavingPotType.Cash);
    this.nonCashPots = nonCash.sort((a, b) => {
      const aVal = a.startingPotValue?.amount ?? 0;
      const bVal = b.startingPotValue?.amount ?? 0;
      return bVal - aVal;
    });
    if (this.nonCashPots.length && !this.scenarioForm.get('selectedPotId')?.value) {
      this.scenarioForm.patchValue(
        {
          selectedPotId: this.nonCashPots[0].id,
          returnRateOverride: this.nonCashPots[0].returnRate ?? null,
        },
        { emitEvent: false }
      );
    }
  }

  private initFormFromPlan(): void {
    if (!this.client || !this.financialTimeline || !this.cashflow) return;
    const birthYear = new Date(this.client.clientDetails.birthDate).getFullYear();
    const endYear = this.financialTimeline.forecastEndtDate
      ? new Date(this.financialTimeline.forecastEndtDate).getFullYear()
      : birthYear + 65;
    const retirementAge = endYear - birthYear;
    const inflation = this.cashflow.inflationRate ?? this.client.clientDetails?.inflationRate ?? 2.5;
    this.scenarioForm.patchValue(
      {
        inflationRate: Number(inflation) || 2.5,
        retirementAge: retirementAge || 65,
      },
      { emitEvent: false }
    );
    this.buildNonCashPots();
  }

  private buildScenarioPayload(): ReportScenarioPayload | null {
    if (!this.financialTimeline || !this.client) return null;
    const birthYear = new Date(this.client.clientDetails.birthDate).getFullYear();
    const retirementAge = Number(this.scenarioForm.get('retirementAge')?.value) || 65;
    const forecastEndDate = new Date(birthYear + retirementAge, 11, 31);
    const forecastStart = this.financialTimeline.forecastStartDate
      ? new Date(this.financialTimeline.forecastStartDate)
      : new Date();
    const inflationRate = Number(this.scenarioForm.get('inflationRate')?.value) ?? 2.5;
    const selectedPotId = this.scenarioForm.get('selectedPotId')?.value;
    const returnRateOverride = this.scenarioForm.get('returnRateOverride')?.value;
    const payload: ReportScenarioPayload = {
      ForecastStartDate: forecastStart.toISOString(),
      ForecastEndDate: forecastEndDate.toISOString(),
      InflationRate: inflationRate,
    };
    if (selectedPotId && returnRateOverride != null && Number.isFinite(returnRateOverride)) {
      payload.SavingPotId = selectedPotId;
      payload.ReturnRateOverride = returnRateOverride;
    }
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
        this.report = report;
        this.alignSeriesStructure();
        this.activeTab = 'after';
        this.displayedReport = report;
        this.scenarioForecastEndDate = this.getScenarioForecastEndDate();
        this.getShortfallStatus(report);
      }
    });
  }

  /** Switch between the original plan (Before) and the current scenario (After). */
  switchTab(tab: 'before' | 'after'): void {
    this.activeTab = tab;
    this.displayedReport = tab === 'before' ? this.baselineReport : this.report;
    if (tab === 'after' && this.report) this.getShortfallStatus(this.report);
    if (tab === 'before' && this.baselineReport) this.getShortfallStatus(this.baselineReport);
  }

  /**
   * Aligns the series structure between baselineReport and the current scenario report
   * so ApexCharts can morph smoothly (same number of series in both).
   */
  private alignSeriesStructure(): void {
    if (!this.baselineReport || !this.report) return;
    const baseline = this.baselineReport;
    const scenario = this.report;

    const allNames: string[] = [];
    [...scenario.series, ...baseline.series].forEach((s: any) => {
      if (!allNames.includes(s.name)) allNames.push(s.name);
    });

    const baselineCategoryCount = baseline.categories.length;
    const scenarioCategoryCount = scenario.categories.length;

    allNames.forEach(name => {
      if (!baseline.series.find((s: any) => s.name === name)) {
        const ref = scenario.series.find((s: any) => s.name === name);
        if (ref) baseline.series.push({ ...ref, data: new Array(baselineCategoryCount).fill(0) });
      }
      if (!scenario.series.find((s: any) => s.name === name)) {
        const ref = baseline.series.find((s: any) => s.name === name);
        if (ref) scenario.series.push({ ...ref, data: new Array(scenarioCategoryCount).fill(0) });
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
    if (!this.client) return new Date();
    const birthYear = new Date(this.client.clientDetails.birthDate).getFullYear();
    const retirementAge = Number(this.scenarioForm.get('retirementAge')?.value) || 65;
    return new Date(birthYear + retirementAge, 11, 31);
  }

  onBack(): void {
    this.router.navigate(['/cashflows', this.cashflowId, 'reports']);
  }

  /** Explicitly simulate the scenario (also auto-runs on form change via debounce) */
  onSimulate(): void {
    if (this.financialTimeline && this.client) this.applyScenario();
  }

  // ── Retirement age stepper ───────────────────────────────────────────────

  getRetirementAge(): number {
    return Number(this.scenarioForm.get('retirementAge')?.value) || 65;
  }

  decrementAge(): void {
    const current = this.getRetirementAge();
    if (current > 18) {
      this.scenarioForm.patchValue({ retirementAge: current - 1 });
    }
  }

  incrementAge(): void {
    const current = this.getRetirementAge();
    if (current < 100) {
      this.scenarioForm.patchValue({ retirementAge: current + 1 });
    }
  }

  // ── Other changes ────────────────────────────────────────────────────────

  private populateAvailableChanges(): void {
    if (!this.financialTimeline?.clientEvents) {
      this.availableChangeItems = [];
      return;
    }
    const seen = new Set<string>();
    this.availableChangeItems = this.financialTimeline.clientEvents
      .filter((e) => !e.isPlaceHolder && e.name)
      .filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .map((e) => ({
        id: e.id,
        label: e.name,
        type: e.type === EventIncomeType.Income ? 'income' : 'expense',
      }));
  }

  addOtherChange(item: ScenarioChangeItem): void {
    if (this.otherChanges.some((c) => c.id === item.id)) return;
    this.otherChanges = [...this.otherChanges, item];
  }

  removeOtherChange(item: ScenarioChangeItem): void {
    this.otherChanges = this.otherChanges.filter((c) => c.id !== item.id);
  }

  /** Sync the standalone number input (not using formControlName) back to the form control */
  onNumericInputChange(field: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.scenarioForm.patchValue({ [field]: val });
    }
  }

  /** Returns a tabler icon name for a saving pot type */
  getPotIcon(type: SavingPotType): string {
    switch (type) {
      case SavingPotType.Investment:  return 'chart-line';
      case SavingPotType.PensionFund: return 'building-bank';
      default:                        return 'wallet';
    }
  }

  // ────────────────────────────────────────────────────────────────────────

  onCreatePlanFromScenario(): void {
    if (!this.cashflow || !this.client) return;
    const cashflows$ = this.cashflowHttpService.getByClientId(this.client.id);
    cashflows$.pipe(takeUntil(this.destroy$)).subscribe((cashflows) => {
      const baseName = this.cashflow!.name;
      let defaultName = `${baseName} - Scenario #1`;
      let n = 1;
      while (cashflows.some((c) => c.name === defaultName)) {
        n++;
        defaultName = `${baseName} - Scenario #${n}`;
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
          SavingPotId: this.scenarioForm.get('selectedPotId')?.value || undefined,
          ReturnRateOverride: this.scenarioForm.get('returnRateOverride')?.value ?? undefined,
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
