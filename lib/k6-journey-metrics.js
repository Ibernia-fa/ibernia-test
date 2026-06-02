/**
 * Reusable journey-level metrics for Ibernia k6 load tests.
 * Trends record end-to-end step duration (ms). Rates aggregate lag / business / auth outcomes.
 *
 * When VOLUME_SLO=1, lag budgets align with read-profile step budgets from volume-api-slo.json
 * (and scenario overrides). Step durations also feed volume SLO step samples.
 */
import { Trend, Rate } from 'k6/metrics';
import { isVolumeSloEnabled, getEffectiveSloConfig, recordVolumeSloStep } from './volume-slo.js';
import { resolveStepBudget, normalizeProfileName } from './volume-slo-core.js';

/** @type {Record<string, Trend>} */
const trendRegistry = Object.create(null);

/** Standard journey Trend metrics (register at init so thresholds apply). */
export const journeyLoginDuration = new Trend('journey_login_duration', true);
export const journeyDashboardLoadDuration = new Trend('journey_dashboard_load_duration', true);
export const journeyOpenClientDuration = new Trend('journey_open_client_duration', true);
export const journeyCashflowLoadDuration = new Trend('journey_cashflow_load_duration', true);
export const journeySaveAssumptionDuration = new Trend('journey_save_assumption_duration', true);
export const journeyCashflowRecalculateDuration = new Trend('journey_cashflow_recalculate_duration', true);
export const journeySaveChangesDuration = new Trend('journey_save_changes_duration', true);
export const journeyShareClientViewDuration = new Trend('journey_share_client_view_duration', true);
export const journeyClientViewOpenDuration = new Trend('journey_client_view_open_duration', true);
export const journeyClientAuthDuration = new Trend('journey_client_auth_duration', true);
export const journeyClientPlanViewDuration = new Trend('journey_client_plan_view_duration', true);
export const journeyClientPlansLoadDuration = new Trend('journey_client_plans_load_duration', true);
export const journeyOpenPlanDuration = new Trend('journey_open_plan_duration', true);
export const journeyTimelineLoadDuration = new Trend('journey_timeline_load_duration', true);
export const journeyIncomeExpensesLoadDuration = new Trend('journey_income_expenses_load_duration', true);
export const journeySavingPotsLoadDuration = new Trend('journey_saving_pots_load_duration', true);
export const journeyContributionsWithdrawalsLoadDuration = new Trend(
  'journey_contributions_withdrawals_load_duration',
  true,
);
export const journeyProjectionLoadDuration = new Trend('journey_projection_load_duration', true);
export const fullJourneyDuration = new Trend('full_journey_duration', true);
export const dashboardResponseSize = new Trend('dashboard_response_size', true);
export const clientPlansResponseSize = new Trend('client_plans_response_size', true);
export const cashflowResponseSize = new Trend('cashflow_response_size', true);
export const projectionResponseSize = new Trend('projection_response_size', true);

trendRegistry.journey_login_duration = journeyLoginDuration;
trendRegistry.journey_dashboard_load_duration = journeyDashboardLoadDuration;
trendRegistry.journey_open_client_duration = journeyOpenClientDuration;
trendRegistry.journey_cashflow_load_duration = journeyCashflowLoadDuration;
trendRegistry.journey_save_assumption_duration = journeySaveAssumptionDuration;
trendRegistry.journey_cashflow_recalculate_duration = journeyCashflowRecalculateDuration;
trendRegistry.journey_save_changes_duration = journeySaveChangesDuration;
trendRegistry.journey_share_client_view_duration = journeyShareClientViewDuration;
trendRegistry.journey_client_view_open_duration = journeyClientViewOpenDuration;
trendRegistry.journey_client_auth_duration = journeyClientAuthDuration;
trendRegistry.journey_client_plan_view_duration = journeyClientPlanViewDuration;
trendRegistry.journey_client_plans_load_duration = journeyClientPlansLoadDuration;
trendRegistry.journey_open_plan_duration = journeyOpenPlanDuration;
trendRegistry.journey_timeline_load_duration = journeyTimelineLoadDuration;
trendRegistry.journey_income_expenses_load_duration = journeyIncomeExpensesLoadDuration;
trendRegistry.journey_saving_pots_load_duration = journeySavingPotsLoadDuration;
trendRegistry.journey_contributions_withdrawals_load_duration = journeyContributionsWithdrawalsLoadDuration;
trendRegistry.journey_projection_load_duration = journeyProjectionLoadDuration;
trendRegistry.full_journey_duration = fullJourneyDuration;
trendRegistry.dashboard_response_size = dashboardResponseSize;
trendRegistry.client_plans_response_size = clientPlansResponseSize;
trendRegistry.cashflow_response_size = cashflowResponseSize;
trendRegistry.projection_response_size = projectionResponseSize;

export const userLagRate = new Rate('user_lag_rate');
export const businessFailureRate = new Rate('business_failure_rate');
export const authFailureRate = new Rate('auth_failure_rate');

/** Default lag budgets (ms) — overridable per journey via env. */
export const JOURNEY_LAG_BUDGET_DEFAULTS = Object.freeze({
  journey_login_duration: 1500,
  journey_dashboard_load_duration: 2500,
  journey_open_client_duration: 2000,
  journey_cashflow_load_duration: 3000,
  journey_save_assumption_duration: 2000,
  journey_cashflow_recalculate_duration: 5000,
  journey_save_changes_duration: 2500,
  journey_share_client_view_duration: 3000,
  journey_client_view_open_duration: 3000,
  journey_client_auth_duration: 3000,
  journey_client_plan_view_duration: 4000,
  journey_client_plans_load_duration: 2000,
  journey_open_plan_duration: 2000,
  journey_timeline_load_duration: 2500,
  journey_income_expenses_load_duration: 2500,
  journey_saving_pots_load_duration: 3000,
  journey_contributions_withdrawals_load_duration: 3000,
  journey_projection_load_duration: 6000,
  full_journey_duration: 15000,
});

function envBudgetKey(metricName) {
  const base = String(metricName || '')
    .replace(/^journey_/, '')
    .replace(/_duration$/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_');
  return `JOURNEY_BUDGET_${base}_MS`;
}

/**
 * Resolve lag budget for a journey Trend name.
 * @param {string} metricName e.g. journey_login_duration
 * @param {number} [overrideMs]
 */
function journeySloProfile() {
  const raw = (__ENV.VOLUME_SLO_PROFILE || '').trim();
  if (raw) return normalizeProfileName(raw);
  try {
    return getEffectiveSloConfig().defaultProfile || 'read';
  } catch {
    return 'read';
  }
}

function shortStepKeyFromMetric(metricName) {
  return String(metricName || '')
    .replace(/^journey_/, '')
    .replace(/_duration$/, '');
}

export function lagBudgetMs(metricName, overrideMs) {
  if (overrideMs != null && Number.isFinite(Number(overrideMs))) {
    return Math.max(1, Number(overrideMs));
  }
  if (isVolumeSloEnabled()) {
    try {
      const config = getEffectiveSloConfig();
      const profile = journeySloProfile();
      const full = resolveStepBudget(config, profile, metricName);
      if (full.budgetMs != null) return full.budgetMs;
      const short = resolveStepBudget(config, profile, shortStepKeyFromMetric(metricName));
      if (short.budgetMs != null) return short.budgetMs;
    } catch {
      /* fall through to env/defaults */
    }
  }
  const envKey = envBudgetKey(metricName);
  const raw = (__ENV[envKey] || '').trim();
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const d = JOURNEY_LAG_BUDGET_DEFAULTS[metricName];
  return d != null ? d : 3000;
}

/**
 * Get or create a Trend for a journey metric name.
 * @param {string} metricName
 * @returns {Trend}
 */
export function getJourneyTrend(metricName) {
  const name = String(metricName || '').trim();
  if (!name) throw new Error('[k6-journey-metrics] metricName is required');
  if (trendRegistry[name]) return trendRegistry[name];
  const t = new Trend(name, true);
  trendRegistry[name] = t;
  return t;
}

/** @returns {number} epoch ms */
export function startJourneyTimer() {
  return Date.now();
}

/**
 * @param {number} startMs from startJourneyTimer()
 * @returns {number} duration ms
 */
export function stopJourneyTimer(startMs) {
  return Math.max(0, Date.now() - startMs);
}

/**
 * @param {object} p
 * @param {string} p.journey journey key for tag (e.g. login)
 * @param {string} [p.screen] UI screen route label
 * @param {boolean} [p.critical=true]
 * @param {string} p.name HTTP tag name (k6 `name`)
 */
export function standardRequestTags({ journey, screen, critical, name }) {
  const tags = {
    journey: journey != null ? String(journey) : '',
    screen: screen != null ? String(screen) : '',
    critical: critical === false ? 'false' : 'true',
    name: name != null ? String(name) : 'http',
  };
  return tags;
}

/**
 * Record one journey step duration and lag sample.
 * @param {string|Trend} metricNameOrTrend
 * @param {number} durationMs
 * @param {{ budgetMs?: number, recordLag?: boolean }} [opts]
 */
export function recordJourneyDuration(metricNameOrTrend, durationMs, opts = {}) {
  const trend =
    typeof metricNameOrTrend === 'string'
      ? getJourneyTrend(metricNameOrTrend)
      : metricNameOrTrend;
  const ms = Math.max(0, Number(durationMs) || 0);
  trend.add(ms);
  const metricName =
    typeof metricNameOrTrend === 'string' ? metricNameOrTrend : trend.name || '';
  const budget = lagBudgetMs(metricName, opts.budgetMs);
  if (opts.recordLag !== false) {
    recordJourneyLag(ms, budget);
  }
  if (isVolumeSloEnabled() && typeof metricName === 'string') {
    recordVolumeSloStep(metricName, ms, { sloProfile: journeySloProfile() });
  }
  return { durationMs: ms, budgetMs: budget, lag: ms > budget };
}

/**
 * @param {number} durationMs
 * @param {number} budgetMs
 */
export function recordJourneyLag(durationMs, budgetMs) {
  userLagRate.add(durationMs > budgetMs ? 1 : 0);
}

/** @param {boolean} failed */
export function recordBusinessFailure(failed) {
  businessFailureRate.add(failed ? 1 : 0);
}

/** @param {boolean} failed */
export function recordAuthFailure(failed) {
  authFailureRate.add(failed ? 1 : 0);
}

/**
 * Complete a journey step: duration + optional business failure flag.
 * @param {string|Trend} metricNameOrTrend
 * @param {number} startMs
 * @param {{ ok?: boolean, budgetMs?: number, recordLag?: boolean }} [opts]
 */
export function completeJourneyStep(metricNameOrTrend, startMs, opts = {}) {
  const durationMs = stopJourneyTimer(startMs);
  const result = recordJourneyDuration(metricNameOrTrend, durationMs, {
    budgetMs: opts.budgetMs,
    recordLag: opts.recordLag,
  });
  if (opts.ok === false) {
    recordBusinessFailure(true);
  } else if (opts.ok === true) {
    recordBusinessFailure(false);
  }
  return Object.assign({ ok: opts.ok !== false }, result);
}

/**
 * Mark step failed (business) and still record duration/lag.
 */
export function failJourneyStep(metricNameOrTrend, startMs, opts = {}) {
  return completeJourneyStep(metricNameOrTrend, startMs, Object.assign({}, opts, { ok: false }));
}

function metricValues(data, name) {
  const m = data.metrics && data.metrics[name];
  if (!m || !m.values) return null;
  const v = m.values;
  return {
    avg: v.avg != null ? v.avg : null,
    min: v.min != null ? v.min : null,
    max: v.max != null ? v.max : null,
    med: v.med != null ? v.med : null,
    p90: v['p(90)'] != null ? v['p(90)'] : null,
    p95: v['p(95)'] != null ? v['p(95)'] : null,
    p99: v['p(99)'] != null ? v['p(99)'] : null,
    count: v.count != null ? v.count : null,
  };
}

/** @param {object} data @param {string} name @param {number} budgetMs */
export function journeyPassFailFromValues(vals, budgetMs) {
  if (!vals) return null;
  if (vals.p95 != null && budgetMs) return vals.p95 <= budgetMs ? 'pass' : 'fail';
  return null;
}

function rateValue(data, name) {
  const m = data.metrics && data.metrics[name];
  if (!m || !m.values) return null;
  return m.values.rate != null ? m.values.rate : null;
}

/**
 * Build JSON-friendly journey report from k6 handleSummary `data`.
 * @param {object} data k6 summary data
 * @param {string[]} [journeyMetricNames]
 */
function thresholdPassed(thresholdResult) {
  if (!thresholdResult || typeof thresholdResult !== 'object') return null;
  return thresholdResult.ok === true ? 'pass' : thresholdResult.ok === false ? 'fail' : null;
}

/**
 * Journey rows with budget + k6 threshold pass/fail when present.
 * @param {object} data k6 summary data
 * @param {string[]} journeyMetricNames
 */
export function buildJourneyThresholdRows(data, journeyMetricNames) {
  const rootTh = data.root_group && data.root_group.thresholds ? data.root_group.thresholds : {};
  const rows = [];
  for (let i = 0; i < journeyMetricNames.length; i++) {
    const n = journeyMetricNames[i];
    const vals = metricValues(data, n);
    const budget = lagBudgetMs(n);
    const th = rootTh[n];
    let passFail = thresholdPassed(th);
    if (passFail == null && vals && vals.p95 != null && budget) {
      passFail = vals.p95 <= budget ? 'pass' : 'fail';
    }
    rows.push({
      metric: n,
      avg: vals && vals.avg != null ? vals.avg : null,
      p90: vals && vals.p90 != null ? vals.p90 : null,
      p95: vals && vals.p95 != null ? vals.p95 : null,
      p99: vals && vals.p99 != null ? vals.p99 : null,
      max: vals && vals.max != null ? vals.max : null,
      budgetMs: budget,
      passFail,
    });
  }
  const lagTh = rootTh.user_lag_rate;
  const lagRate = rateValue(data, 'user_lag_rate');
  let lagPassFail = thresholdPassed(lagTh);
  if (lagPassFail == null && lagRate != null) {
    lagPassFail = lagRate < 0.05 ? 'pass' : 'fail';
  }
  rows.push({
    metric: 'user_lag_rate',
    avg: lagRate,
    p90: null,
    p95: null,
    p99: null,
    max: null,
    budgetMs: null,
    budgetRate: 0.05,
    passFail: lagPassFail,
  });
  return rows;
}

export function formatJourneyThresholdMarkdown(rows) {
  const header =
    '| Journey metric | Avg | p90 | p95 | p99 | Max | Budget | Pass/Fail |\n' +
    '|----------------|----:|----:|----:|----:|----:|-------:|:---------:|';
  const lines = [header];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const budget =
      r.budgetMs != null
        ? `${Math.round(r.budgetMs)}ms`
        : r.budgetRate != null
          ? `<${(r.budgetRate * 100).toFixed(0)}%`
          : 'n/a';
    const fmt = (v, isRate) =>
      v == null
        ? 'n/a'
        : isRate
          ? `${(v * 100).toFixed(2)}%`
          : `${Math.round(v)}ms`;
    const isRate = r.metric === 'user_lag_rate';
    lines.push(
      `| ${r.metric} | ${fmt(r.avg, isRate)} | ${fmt(r.p90, false)} | ${fmt(r.p95, false)} | ${fmt(r.p99, false)} | ${fmt(r.max, false)} | ${budget} | ${r.passFail || 'n/a'} |`,
    );
  }
  return lines.join('\n');
}

export function buildJourneySummaryReport(data, journeyMetricNames, extra) {
  const names =
    journeyMetricNames && journeyMetricNames.length
      ? journeyMetricNames
      : Object.keys(JOURNEY_LAG_BUDGET_DEFAULTS);
  const journeys = {};
  for (let i = 0; i < names.length; i++) {
    const n = names[i];
    const vals = metricValues(data, n);
    if (vals) {
      const budget = lagBudgetMs(n);
      journeys[n] = Object.assign({}, vals, {
        lagBudgetMs: budget,
        passFail: journeyPassFailFromValues(vals, budget),
      });
    }
  }
  const journeyThresholdRows = buildJourneyThresholdRows(data, names);
  return Object.assign(
    {
      reportType: 'k6-journey-summary',
      generatedAt: new Date().toISOString(),
      testRunDurationMs:
        data.state && data.state.testRunDurationMs != null ? data.state.testRunDurationMs : null,
      vusMax:
        data.metrics &&
        data.metrics.vus_max &&
        data.metrics.vus_max.values &&
        data.metrics.vus_max.values.max != null
          ? data.metrics.vus_max.values.max
          : null,
      rates: {
        user_lag_rate: rateValue(data, 'user_lag_rate'),
        business_failure_rate: rateValue(data, 'business_failure_rate'),
        auth_failure_rate: rateValue(data, 'auth_failure_rate'),
      },
      http_req_failed: rateValue(data, 'http_req_failed'),
      journeys,
      journeyThresholdRows,
      thresholds: data.root_group && data.root_group.thresholds ? data.root_group.thresholds : undefined,
      correlationHeaders: ['X-Correlation-Id', 'X-Journey', 'X-VU', 'X-Iteration'],
    },
    extra || {},
  );
}
