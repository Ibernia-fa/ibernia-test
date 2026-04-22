import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import { AutoFitTitleDirective } from 'src/app/directives/auto-fit-title.directive';
import { formatAppDisplayNumber } from 'src/app/shared/utils/number-utils';

const ACCENT = '#4043af';
const ACCENT_SOFT = '#516ce8';
const TROUGH_RED = '#c62828';

/* ------------------------------------------------------------------
 * Composite long-term index series (DJIA → S&P 500).
 * Pre-March 1957 values are DJIA closes scaled by 0.0928 so the line
 * is continuous with the S&P 500 at the transition point. The figure
 * is a normalized "S&P 500 equivalent" used for visual continuity.
 * ------------------------------------------------------------------ */
interface IndexPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

const COMPOSITE_INDEX_SERIES: IndexPoint[] = [
  { date: '1928-12-31', value: 27.84 },
  { date: '1929-09-03', value: 35.37 },
  { date: '1929-12-31', value: 23.06 },
  { date: '1930-12-31', value: 15.27 },
  { date: '1931-12-31', value: 7.23 },
  { date: '1932-07-08', value: 3.83 },
  { date: '1932-12-31', value: 5.56 },
  { date: '1933-12-31', value: 9.27 },
  { date: '1934-12-31', value: 9.66 },
  { date: '1935-12-31', value: 13.38 },
  { date: '1936-12-31', value: 16.69 },
  { date: '1937-03-10', value: 18.04 },
  { date: '1937-12-31', value: 11.21 },
  { date: '1938-03-31', value: 9.18 },
  { date: '1938-11-12', value: 14.7 },
  { date: '1938-12-31', value: 14.36 },
  { date: '1939-12-31', value: 13.94 },
  { date: '1940-12-31', value: 12.17 },
  { date: '1941-12-31', value: 10.3 },
  { date: '1942-04-28', value: 8.62 },
  { date: '1942-12-31', value: 11.08 },
  { date: '1943-12-31', value: 12.61 },
  { date: '1944-12-31', value: 14.13 },
  { date: '1945-12-31', value: 17.9 },
  { date: '1946-12-31', value: 16.44 },
  { date: '1947-12-31', value: 16.81 },
  { date: '1948-12-31', value: 16.45 },
  { date: '1949-12-31', value: 18.57 },
  { date: '1950-12-31', value: 21.85 },
  { date: '1951-12-31', value: 24.99 },
  { date: '1952-12-31', value: 27.09 },
  { date: '1953-12-31', value: 26.07 },
  { date: '1954-12-31', value: 37.53 },
  { date: '1955-12-31', value: 45.32 },
  { date: '1956-12-31', value: 46.35 },
  { date: '1957-12-31', value: 39.99 },
  { date: '1958-12-31', value: 55.21 },
  { date: '1959-12-31', value: 59.89 },
  { date: '1960-12-31', value: 58.11 },
  { date: '1961-12-12', value: 72.64 },
  { date: '1961-12-31', value: 71.55 },
  { date: '1962-06-26', value: 52.32 },
  { date: '1962-12-31', value: 63.1 },
  { date: '1963-12-31', value: 75.02 },
  { date: '1964-12-31', value: 84.75 },
  { date: '1965-12-31', value: 92.43 },
  { date: '1966-12-31', value: 80.33 },
  { date: '1967-12-31', value: 96.47 },
  { date: '1968-12-31', value: 103.86 },
  { date: '1969-12-31', value: 92.06 },
  { date: '1970-12-31', value: 92.15 },
  { date: '1971-12-31', value: 102.09 },
  { date: '1972-12-31', value: 118.05 },
  { date: '1973-01-11', value: 120.24 },
  { date: '1973-12-31', value: 97.55 },
  { date: '1974-10-03', value: 62.28 },
  { date: '1974-12-31', value: 68.56 },
  { date: '1975-12-31', value: 90.19 },
  { date: '1976-12-31', value: 107.46 },
  { date: '1977-12-31', value: 95.1 },
  { date: '1978-12-31', value: 96.11 },
  { date: '1979-12-31', value: 107.94 },
  { date: '1980-11-28', value: 140.52 },
  { date: '1980-12-31', value: 135.76 },
  { date: '1981-12-31', value: 122.55 },
  { date: '1982-08-12', value: 102.42 },
  { date: '1982-12-31', value: 140.64 },
  { date: '1983-12-31', value: 164.93 },
  { date: '1984-12-31', value: 167.24 },
  { date: '1985-12-31', value: 211.28 },
  { date: '1986-12-31', value: 242.17 },
  { date: '1987-08-25', value: 336.77 },
  { date: '1987-12-04', value: 223.92 },
  { date: '1987-12-31', value: 247.08 },
  { date: '1988-12-31', value: 277.72 },
  { date: '1989-12-31', value: 353.4 },
  { date: '1990-07-16', value: 368.95 },
  { date: '1990-10-11', value: 295.46 },
  { date: '1990-12-31', value: 330.22 },
  { date: '1991-12-31', value: 417.09 },
  { date: '1992-12-31', value: 435.71 },
  { date: '1993-12-31', value: 466.45 },
  { date: '1994-12-31', value: 459.27 },
  { date: '1995-12-31', value: 615.93 },
  { date: '1996-12-31', value: 740.74 },
  { date: '1997-12-31', value: 970.43 },
  { date: '1998-07-17', value: 1186.75 },
  { date: '1998-10-08', value: 959.44 },
  { date: '1998-12-31', value: 1229.23 },
  { date: '1999-12-31', value: 1469.25 },
  { date: '2000-03-24', value: 1527.46 },
  { date: '2000-12-31', value: 1320.28 },
  { date: '2001-09-10', value: 1092.54 },
  { date: '2001-09-21', value: 965.8 },
  { date: '2001-12-31', value: 1148.08 },
  { date: '2002-10-09', value: 776.76 },
  { date: '2002-12-31', value: 879.82 },
  { date: '2003-12-31', value: 1111.92 },
  { date: '2004-12-31', value: 1211.92 },
  { date: '2005-12-31', value: 1248.29 },
  { date: '2006-12-31', value: 1418.3 },
  { date: '2007-10-09', value: 1565.15 },
  { date: '2007-12-31', value: 1468.36 },
  { date: '2008-12-31', value: 903.25 },
  { date: '2009-03-09', value: 676.53 },
  { date: '2009-12-31', value: 1115.1 },
  { date: '2010-12-31', value: 1257.64 },
  { date: '2011-04-29', value: 1363.61 },
  { date: '2011-10-03', value: 1099.23 },
  { date: '2011-12-31', value: 1257.6 },
  { date: '2012-12-31', value: 1426.19 },
  { date: '2013-12-31', value: 1848.36 },
  { date: '2014-12-31', value: 2058.9 },
  { date: '2015-12-31', value: 2043.94 },
  { date: '2016-12-31', value: 2238.83 },
  { date: '2017-12-31', value: 2673.61 },
  { date: '2018-12-31', value: 2506.85 },
  { date: '2019-12-31', value: 3230.78 },
  { date: '2020-02-19', value: 3386.15 },
  { date: '2020-03-23', value: 2237.4 },
  { date: '2020-12-31', value: 3756.07 },
  { date: '2021-12-31', value: 4766.18 },
  { date: '2022-01-03', value: 4796.56 },
  { date: '2022-10-12', value: 3577.03 },
  { date: '2022-12-31', value: 3839.5 },
  { date: '2023-12-31', value: 4769.83 },
  { date: '2024-12-31', value: 5881.63 },
  { date: '2025-09-30', value: 6300.0 },
];

interface CrisisEvent {
  id: string;
  rangeLabel: string;
  nameKey: string;
  peakDate: string;
  troughDate: string;
  troughValue: number;
  drawdownPct: number;
  recoveryLabelKey: string;
  year1ReturnPct: number;
  year3ReturnPct: number;
  narrativeKey: string;
  /** True for the Sept 11 event nested inside the dot-com drawdown. */
  isNested?: boolean;
}

const CRISIS_EVENTS: CrisisEvent[] = [
  {
    id: 'great-depression',
    rangeLabel: '1929–32',
    nameKey: 'LEARN_TIM.EVT_GREAT_DEPRESSION_NAME',
    peakDate: '1929-09-03',
    troughDate: '1932-07-08',
    troughValue: 3.83,
    drawdownPct: -89,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_25_YEARS',
    year1ReturnPct: 142,
    year3ReturnPct: 205,
    narrativeKey: 'LEARN_TIM.EVT_GREAT_DEPRESSION_NARRATIVE',
  },
  {
    id: 'roosevelt-recession',
    rangeLabel: '1937–38',
    nameKey: 'LEARN_TIM.EVT_ROOSEVELT_NAME',
    peakDate: '1937-03-10',
    troughDate: '1938-03-31',
    troughValue: 9.18,
    drawdownPct: -49,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_8_YEARS',
    year1ReturnPct: 32,
    year3ReturnPct: 23,
    narrativeKey: 'LEARN_TIM.EVT_ROOSEVELT_NARRATIVE',
  },
  {
    id: 'wwii-low',
    rangeLabel: '1938–42',
    nameKey: 'LEARN_TIM.EVT_WWII_NAME',
    peakDate: '1938-11-12',
    troughDate: '1942-04-28',
    troughValue: 8.62,
    drawdownPct: -41,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_3_YEARS',
    year1ReturnPct: 46,
    year3ReturnPct: 76,
    narrativeKey: 'LEARN_TIM.EVT_WWII_NARRATIVE',
  },
  {
    id: 'kennedy-slide',
    rangeLabel: '1961–62',
    nameKey: 'LEARN_TIM.EVT_KENNEDY_NAME',
    peakDate: '1961-12-12',
    troughDate: '1962-06-26',
    troughValue: 52.32,
    drawdownPct: -22,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_15_MONTHS',
    year1ReturnPct: 34,
    year3ReturnPct: 62,
    narrativeKey: 'LEARN_TIM.EVT_KENNEDY_NARRATIVE',
  },
  {
    id: 'oil-crisis',
    rangeLabel: '1973–74',
    nameKey: 'LEARN_TIM.EVT_OIL_NAME',
    peakDate: '1973-01-11',
    troughDate: '1974-10-03',
    troughValue: 62.28,
    drawdownPct: -48,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_7_YEARS',
    year1ReturnPct: 44,
    year3ReturnPct: 48,
    narrativeKey: 'LEARN_TIM.EVT_OIL_NARRATIVE',
  },
  {
    id: 'volcker-recession',
    rangeLabel: '1980–82',
    nameKey: 'LEARN_TIM.EVT_VOLCKER_NAME',
    peakDate: '1980-11-28',
    troughDate: '1982-08-12',
    troughValue: 102.42,
    drawdownPct: -27,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_3_MONTHS',
    year1ReturnPct: 60,
    year3ReturnPct: 84,
    narrativeKey: 'LEARN_TIM.EVT_VOLCKER_NARRATIVE',
  },
  {
    id: 'black-monday',
    rangeLabel: '1987',
    nameKey: 'LEARN_TIM.EVT_BLACK_MONDAY_NAME',
    peakDate: '1987-08-25',
    troughDate: '1987-12-04',
    troughValue: 223.92,
    drawdownPct: -34,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_2_YEARS',
    year1ReturnPct: 24,
    year3ReturnPct: 47,
    narrativeKey: 'LEARN_TIM.EVT_BLACK_MONDAY_NARRATIVE',
  },
  {
    id: 'gulf-war',
    rangeLabel: '1990',
    nameKey: 'LEARN_TIM.EVT_GULF_WAR_NAME',
    peakDate: '1990-07-16',
    troughDate: '1990-10-11',
    troughValue: 295.46,
    drawdownPct: -20,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_4_MONTHS',
    year1ReturnPct: 32,
    year3ReturnPct: 57,
    narrativeKey: 'LEARN_TIM.EVT_GULF_WAR_NARRATIVE',
  },
  {
    id: 'ltcm',
    rangeLabel: '1998',
    nameKey: 'LEARN_TIM.EVT_LTCM_NAME',
    peakDate: '1998-07-17',
    troughDate: '1998-10-08',
    troughValue: 959.44,
    drawdownPct: -19,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_6_WEEKS',
    year1ReturnPct: 34,
    year3ReturnPct: 10,
    narrativeKey: 'LEARN_TIM.EVT_LTCM_NARRATIVE',
  },
  {
    id: 'dot-com',
    rangeLabel: '2000–02',
    nameKey: 'LEARN_TIM.EVT_DOTCOM_NAME',
    peakDate: '2000-03-24',
    troughDate: '2002-10-09',
    troughValue: 776.76,
    drawdownPct: -49,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_7_YEARS',
    year1ReturnPct: 34,
    year3ReturnPct: 56,
    narrativeKey: 'LEARN_TIM.EVT_DOTCOM_NARRATIVE',
  },
  {
    id: 'september-11',
    rangeLabel: '2001',
    nameKey: 'LEARN_TIM.EVT_SEPT11_NAME',
    peakDate: '2001-09-10',
    troughDate: '2001-09-21',
    troughValue: 965.8,
    drawdownPct: -12,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_6_WEEKS',
    year1ReturnPct: -14,
    year3ReturnPct: 16,
    narrativeKey: 'LEARN_TIM.EVT_SEPT11_NARRATIVE',
    isNested: true,
  },
  {
    id: 'global-financial-crisis',
    rangeLabel: '2007–09',
    nameKey: 'LEARN_TIM.EVT_GFC_NAME',
    peakDate: '2007-10-09',
    troughDate: '2009-03-09',
    troughValue: 676.53,
    drawdownPct: -57,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_55_YEARS',
    year1ReturnPct: 68,
    year3ReturnPct: 103,
    narrativeKey: 'LEARN_TIM.EVT_GFC_NARRATIVE',
  },
  {
    id: 'eurozone-crisis',
    rangeLabel: '2011',
    nameKey: 'LEARN_TIM.EVT_EUROZONE_NAME',
    peakDate: '2011-04-29',
    troughDate: '2011-10-03',
    troughValue: 1099.23,
    drawdownPct: -19,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_4_MONTHS',
    year1ReturnPct: 30,
    year3ReturnPct: 77,
    narrativeKey: 'LEARN_TIM.EVT_EUROZONE_NARRATIVE',
  },
  {
    id: 'covid-19',
    rangeLabel: '2020',
    nameKey: 'LEARN_TIM.EVT_COVID_NAME',
    peakDate: '2020-02-19',
    troughDate: '2020-03-23',
    troughValue: 2237.4,
    drawdownPct: -34,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_5_MONTHS',
    year1ReturnPct: 78,
    year3ReturnPct: 79,
    narrativeKey: 'LEARN_TIM.EVT_COVID_NARRATIVE',
  },
  {
    id: 'inflation-fed',
    rangeLabel: '2022',
    nameKey: 'LEARN_TIM.EVT_INFLATION_FED_NAME',
    peakDate: '2022-01-03',
    troughDate: '2022-10-12',
    troughValue: 3577.03,
    drawdownPct: -25,
    recoveryLabelKey: 'LEARN_TIM.RECOVERY_15_MONTHS',
    year1ReturnPct: 20,
    year3ReturnPct: 85,
    narrativeKey: 'LEARN_TIM.EVT_INFLATION_FED_NARRATIVE',
  },
];

@Component({
  selector: 'app-learn-time-in-market',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    NgApexchartsModule,
    TranslateModule,
    AutoFitTitleDirective,
  ],
  templateUrl: './learn-time-in-market.component.html',
  styleUrl: './learn-time-in-market.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnTimeInMarketComponent {
  readonly events = CRISIS_EVENTS;

  /* Single active event id — the left list behaves as a hover-driven
     navigator on desktop (hover === click), with click/tap and focus
     providing the touch and keyboard equivalents. There is no
     separate "hovered vs selected" state. */
  readonly activeEventId = signal<string>(CRISIS_EVENTS[0].id);

  readonly activeEvent = computed<CrisisEvent>(() => {
    const id = this.activeEventId();
    return CRISIS_EVENTS.find((e) => e.id === id) ?? CRISIS_EVENTS[0];
  });

  /** Bumped when language changes so translated bindings recompute. */
  private readonly langTick = signal(0);

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /* ------------------------------------------------------------------
   * Chart bindings — split into stable parts (recomputed only on
   * language change) and a single annotations binding (recomputed on
   * hover / select). This keeps ApexCharts from rebuilding the line
   * series, axes, or viewport while the user browses events; only the
   * subtle highlight overlay updates.
   * ------------------------------------------------------------------ */

  readonly chartSeries = computed(() => {
    this.langTick();
    return [
      {
        name: this.translate.instant('LEARN_TIM.SERIES_NAME'),
        data: COMPOSITE_INDEX_SERIES.map((p) => ({
          x: new Date(p.date).getTime(),
          y: p.value,
        })),
      },
    ];
  });

  readonly chartTooltip = computed(() => {
    this.langTick();
    const seriesName = this.translate.instant('LEARN_TIM.SERIES_NAME');
    const lang = this.translate.currentLang;
    return {
      theme: 'light',
      cssClass: 'ibr-school-tooltip',
      style: { fontSize: '13px', fontFamily: 'Ubuntu, sans-serif' },
      x: { format: 'yyyy' },
      y: {
        formatter: (value: number) =>
          formatAppDisplayNumber(lang, Math.round(value)),
        title: { formatter: () => seriesName },
      },
      marker: { show: false },
    };
  });

  readonly chartConfig = {
    type: 'area',
    height: '100%',
    fontFamily: 'Ubuntu, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
    /* Disable animations: hovering through the tile list updates only
       the annotations layer, and we want the line / axes to stay
       perfectly still — no fade-in, no transition jumps. */
    animations: { enabled: false },
    parentHeightOffset: 0,
    cssClass: 'ibr-school-chart',
  };

  readonly chartColors = [ACCENT];

  readonly chartStroke = { width: 2.25, curve: 'smooth', lineCap: 'round' };

  readonly chartFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.22,
      opacityTo: 0.02,
      stops: [0, 90, 100],
      colorStops: [
        { offset: 0, color: ACCENT, opacity: 0.22 },
        { offset: 100, color: ACCENT_SOFT, opacity: 0.02 },
      ],
    },
  };

  readonly chartMarkers = {
    size: 0,
    strokeWidth: 0,
    hover: { size: 4 },
  };

  readonly chartDataLabels = { enabled: false };

  readonly chartGrid = {
    borderColor: '#eef0f6',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { left: 8, right: 24, top: 8, bottom: 0 },
  };

  readonly chartXaxis = {
    type: 'datetime',
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: '#5a596e',
        fontSize: '12px',
        fontFamily: 'Ubuntu, sans-serif',
      },
      datetimeUTC: false,
      format: 'yyyy',
    },
    tickAmount: 10,
    /* The floating axis label that appears under the chart on hover
       must also show year-only — never months — to keep the chart
       communicating time at year granularity. */
    tooltip: {
      enabled: true,
      formatter: (val: number) => {
        const ms = typeof val === 'number' ? val : Number(val);
        if (!Number.isFinite(ms)) return '';
        return new Date(ms).getFullYear().toString();
      },
    },
  };

  readonly chartYaxis = computed(() => {
    this.langTick();
    const lang = this.translate.currentLang;
    return {
      logarithmic: true,
      logBase: 10,
      tickAmount: 4,
      labels: {
        style: {
          colors: '#5a596e',
          fontSize: '12px',
          fontFamily: 'Ubuntu, sans-serif',
        },
        formatter: (value: number) => {
          if (!Number.isFinite(value)) return '';
          return formatAppDisplayNumber(lang, Math.round(value));
        },
      },
    };
  });

  /* The legend / source identification is now rendered as a custom
     header ABOVE the chart frame (see template). It clearly shows
     "DJIA · S&P 500" together with the logarithmic-scale source note
     so users immediately understand what the line represents. The
     built-in Apex legend is therefore disabled to avoid duplication. */
  readonly chartLegend = { show: false };

  /** Annotations — the only chart input that updates on hover/select. */
  readonly chartAnnotations = computed(() => {
    const event = this.activeEvent();
    const peakMs = new Date(event.peakDate).getTime();
    const troughMs = new Date(event.troughDate).getTime();

    return {
      xaxis: [
        {
          x: peakMs,
          x2: troughMs,
          fillColor: ACCENT,
          opacity: 0.12,
          borderColor: 'transparent',
          strokeDashArray: 0,
        },
      ],
      points: [
        {
          x: troughMs,
          y: event.troughValue,
          marker: {
            size: 6,
            fillColor: '#ffffff',
            strokeColor: TROUGH_RED,
            strokeWidth: 2.5,
            radius: 12,
            cssClass: 'tim-trough-marker',
          },
        },
      ],
    };
  });

  constructor(public dialogRef: MatDialogRef<LearnTimeInMarketComponent>) {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.langTick.update((n) => n + 1));
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  /** Hover, focus, click and tap all funnel into the same setter so
      desktop hover and click behave identically. Mouse leave is a
      no-op: the last activated tile stays highlighted. */
  setActiveEvent(id: string): void {
    if (this.activeEventId() !== id) {
      this.activeEventId.set(id);
    }
  }

  trackById(_index: number, event: CrisisEvent): string {
    return event.id;
  }

  formatPercent(value: number): string {
    if (!Number.isFinite(value)) return '';
    const sign = value > 0 ? '+' : '';
    return `${sign}${Math.round(value)}%`;
  }

  /** Picks the right colour class for return cells (positive / negative / neutral). */
  returnTone(value: number): 'pos' | 'neg' | 'neu' {
    if (!Number.isFinite(value)) return 'neu';
    if (value > 0) return 'pos';
    if (value < 0) return 'neg';
    return 'neu';
  }
}
