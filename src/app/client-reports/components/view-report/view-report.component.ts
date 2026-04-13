import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { ViewSavingsBarStackedChartComponent } from '../savings-bar-stacked-chart/view-savings-bar-stacked-chart.component';
import { ViewTimelineChartComponent } from '../timeline-chart/view-timeline-chart.component';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateIncomeExpenseLabelPipe } from 'src/app/core/pipes/translate-income-expense-label.pipe';
import { IncomeDisplayLabelContext } from 'src/app/shared/utils/income-display-label';
import { ClientEmergency, EmergenciesLookupData } from '../../models/financial-series.model';
import { ChartSeries } from 'src/app/financial-workflow/reports/models/charts-series.model';
import {
  getPlanEndCalendarYear,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import {
  getReportYearBounds,
  parseReportCategoryYears,
} from 'src/app/shared/utils/chart-series-year-range';

@Component({
  selector: 'app-view-report',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenav,
    MatSidenavModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    ViewSavingsBarStackedChartComponent,
    ViewTimelineChartComponent,
    CurrencySymbolPipe,
    ThousandSeparatorPipe,
    MatRippleModule,
    TablerIconsModule,
    MaterialModule,
    TranslateModule,
    TranslateIncomeExpenseLabelPipe,
  ],
   animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.scss',
})

export class ViewReportComponent implements OnChanges {
  @Input() financialSeries: any;
  /** Cached effective end date. Set when financialSeries changes to avoid change-detection loops. */
  effectiveReportEndDate: Date | null = null;
  chartViewStartYear: number | null = null;
  chartViewEndYear: number | null = null;
  chartYearOptions: number[] = [];

  get clientBirthDate() {
    return this.financialSeries?.client.clientDetails.birthDate;
  }
  get client() {
    return this.financialSeries?.client;
  }
  get cashflow() {
    return this.financialSeries?.cashflow;
  }
  get financialTimeline() {
    return this.financialSeries?.timeline;
  }
  get savingPots() {
    return this.financialSeries?.savingPots;
  }
  get incomeExpense() {
    return this.financialSeries?.financialRecords;
  }
  get contributionWithdrawal() {
    return this.financialSeries?.fundTransactions;
  }
  get report() {
    return this.financialSeries?.financialProjection;
  }
  get clientName () {
    return `${this.financialSeries?.client.clientDetails?.firstName} ${this.financialSeries?.client.clientDetails?.lastName}`;
  }

  get incomeDisplayLabelContext(): IncomeDisplayLabelContext {
    const c = this.financialSeries?.client;
    return {
      hasPartner: !!c?.partnerDetail,
      clientFirstName: c?.clientDetails?.firstName ?? '',
      partnerFirstName: c?.partnerDetail?.firstName ?? '',
    };
  }

  get advisorName () {
    return this.financialSeries?.client?.financialAdvisor?.advisorName;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['financialSeries']) {
      this.effectiveReportEndDate = this.computeEffectiveReportEndDate();
      this.syncChartYearRangeFromReport();
    }
  }

  private computeEffectiveReportEndDate(): Date | null {
    const timeline = this.financialTimeline;
    const birthDate = this.clientBirthDate ? new Date(this.clientBirthDate) : null;
    const cf = this.cashflow;
    if (!timeline?.forecastStartDate || !birthDate || !cf?.planDuration) {
      return timeline?.forecastEndtDate ? new Date(timeline.forecastEndtDate) : null;
    }
    const planDuration = Number(cf.planDuration);
    if (!Number.isFinite(planDuration) || planDuration <= 0) {
      return timeline.forecastEndtDate ? new Date(timeline.forecastEndtDate) : null;
    }
    const planEndYear = getPlanEndCalendarYear(this.clientBirthDate, cf.planDuration);
    if (planEndYear == null) {
      return timeline.forecastEndtDate ? new Date(timeline.forecastEndtDate) : null;
    }
    const forecastStartYear = new Date(timeline.forecastStartDate).getFullYear();
    const effectiveYear = Math.max(forecastStartYear, planEndYear);
    return new Date(Date.UTC(effectiveYear, 11, 31, 12, 0, 0));
  }

  private syncChartYearRangeFromReport(): void {
    const bounds = getReportYearBounds(this.report?.categories);
    if (!bounds) {
      this.chartYearOptions = [];
      this.chartViewStartYear = null;
      this.chartViewEndYear = null;
      return;
    }
    this.chartYearOptions = parseReportCategoryYears(this.report.categories);
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

  get emergencies(): ClientEmergency[] {
    return this.financialSeries?.emergencies ?? [];
  }

  get filteredEmergencies(): ClientEmergency[] {
    return this.emergencies.filter(e => !e.isHidden);
  }

  get emergenciesLookupData(): EmergenciesLookupData | null {
    return this.financialSeries?.emergenciesLookupData ?? null;
  }

  get emergencyStats() {
    return this.emergenciesLookupData?.emergenciesStats;
  }

  get hasShortfall(): boolean {
    return this.computeShortfallStatus().hasShortfall;
  }

  get firstShortfallAge(): number | null {
    return this.computeShortfallStatus().firstShortfallAge;
  }

  private computeShortfallStatus(): { hasShortfall: boolean; firstShortfallAge: number | null } {
    const r = this.report as ChartSeries | undefined;
    if (!r?.series) return { hasShortfall: false, firstShortfallAge: null };

    const shortfallSeries = r.series.find((s: { name: string }) => s.name === 'Shortfall');
    if (!shortfallSeries) return { hasShortfall: false, firstShortfallAge: null };

    const index = shortfallSeries.data?.findIndex((v: number) => v < 0);
    if (index == null || index < 0) return { hasShortfall: false, firstShortfallAge: null };

    const year = Number(r.categories?.[index]);
    const birthDate = this.client?.clientDetails?.birthDate;
    if (!birthDate || !Number.isFinite(year)) return { hasShortfall: true, firstShortfallAge: null };

    const age = getProjectionColumnAgeLabel(
      birthDate,
      year,
      this.financialTimeline?.forecastStartDate,
      this.cashflow?.planDuration,
    );
    return {
      hasShortfall: true,
      firstShortfallAge: Number.isNaN(age) ? null : age,
    };
  }

  private readonly defaultIcon = 'shield.svg';
  private readonly iconMap: Record<string, string> = {
    home: 'home.svg',
    disability: 'disability.svg',
    health: 'health.svg',
    will: 'will.svg',
    life: 'user.png',
    naturalHazards: 'naturalHazards.png',
  };

  incomeExpenseDisplayedColumns: string[] = [
    'position',
    'start_age',
    'end_age',
    'name',
    'inflation_rate',
  ];

  incomeDataSource!: MatTableDataSource<any>;
  expenseDataSource!: MatTableDataSource<any>;
  contributionDataSource!: MatTableDataSource<any>;
  withdrawalDataSource!: MatTableDataSource<any>;
  section: string = 'lifetimePlan';
  displayedColumns: string[] = ['position', 'name'];
  
  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
    if (this.financialSeries) {
      this.incomeDataSource = new MatTableDataSource(this.incomeExpense?.incomes || []);
      this.expenseDataSource = new MatTableDataSource(this.incomeExpense?.expenses || []);
      this.contributionDataSource = new MatTableDataSource(this.contributionWithdrawal?.contributions || []);
      this.withdrawalDataSource = new MatTableDataSource(this.contributionWithdrawal?.withdrawals || []);
    }
  }

  setSection(section: string) {
    this.section = section;
  }

  getEmergencyIcon(e: ClientEmergency): string {
    const key = (e.name || '').toLowerCase();
    if (key === 'natural hazards') {
      return `assets/images/svgs/${this.iconMap['naturalHazards']}`;
    }
    return `assets/images/svgs/${this.iconMap[key] ?? this.defaultIcon}`;
  }

  getEmergencyTypeName(typeId: number): string {
    return this.emergenciesLookupData?.emergencyTypes?.find(t => t.id === typeId)?.name ?? 'Unknown';
  }

  getCardCssClass(e: ClientEmergency): string {
    if (e.type === 1) {
      if (e.policyStatus === 2) return 'danger-card';
      return e.coverageAdequacy === 1 ? 'basic-card' : e.coverageAdequacy === 2 ? 'good-card' : 'excellent-card';
    }
    if (e.type === 2) {
      return e.willStatus === 2 ? 'danger-card' : 'excellent-card';
    }
    return 'danger-card';
  }

  getDotClass(e: ClientEmergency): string {
    if (e.type === 1) return e.policyStatus === 2 ? 'dot-red' : 'dot';
    if (e.type === 2) return e.willStatus === 2 ? 'dot-red' : 'dot';
    return 'dot-red';
  }

  getProtectionScoreCssClass(score: number | null | undefined): string {
    if (score == null || score < 50) return 'ibernia-red';
    if (score < 75) return 'ibernia-orange';
    if (score < 89) return 'ibernia-light-green';
    return 'ibernia-dark-green';
  }

  getCoverageAdequacyLabel(id: number | null): string {
    if (id == null) return '-';
    const raw =
      this.emergenciesLookupData?.coverageAdequacies?.find((c) => c.id === id)
        ?.description ?? 'Unknown';
    const t = this.translate.instant(raw);
    return t && t !== raw ? t : raw;
  }

  calculateAnnualCost(e: ClientEmergency): number {
    if (!e.insuranceCost) return 0;
    const cycleDesc = e.insuranceCost.cycle?.description?.toLowerCase() ?? '';
    if (e.insuranceCost.amount > 0 && cycleDesc.includes('month')) {
      return e.insuranceCost.amount * 12;
    }
    return e.insuranceCost.amount ?? 0;
  }
}
