/**
 * **Combined** load test for **`/cashflows/{cashflowId}/reports`** — **five parallel scenarios** (constant VUs each),
 * one shared cashflow from **`setup()`**, merged JSON report.
 *
 * APIs: GET cashflow, GET financial, GET Reports, POST Reports forecast, POST Reports scenario.
 * OpenAPI Reports: GET/POST /api/v1/Reports/{cashflowId} may return 200 or 204 (see dev-api swagger).
 *
 * **Report:** **`k6/cashflows-reports/reports/cashflows-reports-load-report.json`**
 *
 * **`VUS`** (default **20**) = VUs **per scenario** ⇒ up to **5 × VUS** concurrent VUs.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-reports/k6-cashflows-reports-suite-load.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { attachSuitePerfSlice } from '../../lib/k6-suite-perf-summary.js';
import {
  API_BASE,
  apiHeaders,
  assertApiBase,
  assertDevIdentityHost,
  buildReportForecastPayload,
  buildReportScenarioPayload,
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeed,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  readAllLifecycleUsersAtInit,
  recordOutcomeWithBuckets,
  REPORTS_HTTP_SUCCESS,
  seedCashflowForVu,
  SHARED_CASHFLOW_ID,
  sharedCashflowContext,
  teardownByNeedle,
  THINK_SEC,
  metricValuesForTrend,
  metricCount,
} from './common-cashflows-reports-screen.js';

const SUITE_TAG = 'k6-cashflows-reports-suite-load';
const SUITE_SEED_KEY = '__k6CfReportsSuiteSeed';

assertDevIdentityHost(IDENTITY_BASE, SUITE_TAG);
assertApiBase(API_BASE, SUITE_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SUITE_TAG);

const SUITE_VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SUITE_WRITE_JITTER_MS = Math.max(0, parseInt((__ENV.SUITE_WRITE_JITTER_MS || '120').trim(), 10) || 0);
const SUITE_SCENARIO_STAGGER_MS = Math.max(
  0,
  parseInt((__ENV.SUITE_SCENARIO_STAGGER_MS || '100').trim(), 10) || 0,
);
const SUITE_GRACEFUL_STOP = (__ENV.SUITE_GRACEFUL_STOP || '12s').trim() || '12s';
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

function scenarioStart(scenarioIndex) {
  const ms = scenarioIndex * SUITE_SCENARIO_STAGGER_MS;
  if (ms <= 0) return '0s';
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${ms}ms`;
}

function finUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial`;
}

const dur_get_cf = new Trend('cashflows_reports_suite_get_cf_ms');
const err_get_cf = new Counter('cashflows_reports_suite_get_cf_errors');
const ok_get_cf = new Counter('cashflows_reports_suite_get_cf_success');

const dur_get_fin = new Trend('cashflows_reports_suite_get_fin_ms');
const err_get_fin = new Counter('cashflows_reports_suite_get_fin_errors');
const ok_get_fin = new Counter('cashflows_reports_suite_get_fin_success');

const dur_get_rep = new Trend('cashflows_reports_suite_get_rep_ms');
const err_get_rep = new Counter('cashflows_reports_suite_get_rep_errors');
const ok_get_rep = new Counter('cashflows_reports_suite_get_rep_success');

const dur_post_fc = new Trend('cashflows_reports_suite_post_fc_ms');
const err_post_fc = new Counter('cashflows_reports_suite_post_fc_errors');
const ok_post_fc = new Counter('cashflows_reports_suite_post_fc_success');

const dur_post_sc = new Trend('cashflows_reports_suite_post_sc_ms');
const err_post_sc = new Counter('cashflows_reports_suite_post_sc_errors');
const ok_post_sc = new Counter('cashflows_reports_suite_post_sc_success');

const bcf = createHttpErrorBuckets('cashflows_reports_suite_get_cf_err');
const bfin = createHttpErrorBuckets('cashflows_reports_suite_get_fin_err');
const brep = createHttpErrorBuckets('cashflows_reports_suite_get_rep_err');
const bpostFc = createHttpErrorBuckets('cashflows_reports_suite_post_fc_err');
const bpostSc = createHttpErrorBuckets('cashflows_reports_suite_post_sc_err');

export const options = {
  scenarios: {
    s_get_cashflow: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'getCashflow',
      startTime: scenarioStart(0),
    },
    s_get_financial: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'getFinancial',
      startTime: scenarioStart(0),
    },
    s_get_reports: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'getReports',
      startTime: scenarioStart(1),
    },
    s_post_forecast: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'postForecast',
      startTime: scenarioStart(2),
    },
    s_post_scenario: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'postScenario',
      startTime: scenarioStart(3),
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.82'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.15'] }),
  },
};

export function setup() {
  const runTag = `suiteRep${Date.now()}`;
  let token;
  let cashflowId;
  let shared = false;
  if (SHARED_CASHFLOW_ID) {
    const ctx = sharedCashflowContext(LIFECYCLE_USERS, SUITE_TAG);
    token = ctx.token;
    cashflowId = SHARED_CASHFLOW_ID;
    shared = true;
    console.log(
      `[${SUITE_TAG}] SHARED_CASHFLOW_ID=${cashflowId} | VUs per scenario=${SUITE_VUS} | DURATION=${DURATION}`,
    );
  } else {
    const e = seedCashflowForVu({
      base: API_BASE,
      vuKey: 1,
      idx: 0,
      runTag,
      lifecycleUsers: LIFECYCLE_USERS,
      scriptTag: SUITE_TAG,
      globalKey: SUITE_SEED_KEY,
    });
    token = e.token;
    cashflowId = e.seededCashflowId;
    console.log(
      `[${SUITE_TAG}] seeded cashflowId=${cashflowId} | runTag=${runTag} | VUs per scenario=${SUITE_VUS} | DURATION=${DURATION}`,
    );
  }
  return { base: API_BASE, runTag, token, cashflowId, shared };
}

export function teardown(data) {
  if (!data) return;
  if (data.shared) {
    deleteGlobalSeed(SUITE_SEED_KEY);
    return;
  }
  if (SHARED_CASHFLOW_ID) {
    deleteGlobalSeed(SUITE_SEED_KEY);
    return;
  }
  teardownByNeedle(SUITE_TAG, data.base, data.runTag, LIFECYCLE_USERS);
  deleteGlobalSeed(SUITE_SEED_KEY);
}

function hdrAuth(data) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${data.token}`,
  };
}

export function getCashflow(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'cashflows_reports_suite_get_cf', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_cf,
    err_get_cf,
    ok_get_cf,
    res,
    200,
    `${SUITE_TAG} GET cashflow`,
    bcf.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function getFinancial(data) {
  const h = hdrAuth(data);
  const url = finUrl(data.base, data.cashflowId);
  const res = http.get(url, {
    headers: h,
    tags: { name: 'cashflows_reports_suite_get_fin', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_fin,
    err_get_fin,
    ok_get_fin,
    res,
    200,
    `${SUITE_TAG} GET financial`,
    bfin.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function getReports(data) {
  const h = hdrAuth(data);
  const inflationRate = 2.0 + ((__VU + __ITER) % 15) / 10;
  const url = `${data.base}/api/v1/Reports/${encodeURIComponent(data.cashflowId)}?inflationRate=${inflationRate}`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'cashflows_reports_suite_get_rep', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_rep,
    err_get_rep,
    ok_get_rep,
    res,
    200,
    `${SUITE_TAG} GET Reports`,
    brep.buckets,
    REPORTS_HTTP_SUCCESS,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function postForecast(data) {
  const hdrs = apiHeaders(data.token);
  if (SUITE_WRITE_JITTER_MS > 0) sleep((Math.random() * SUITE_WRITE_JITTER_MS) / 1000);
  const inflationRate = 2.15 + ((__VU * 2 + __ITER) % 14) / 10;
  const url = `${data.base}/api/v1/Reports/${encodeURIComponent(data.cashflowId)}?inflationRate=${inflationRate}`;
  const body = buildReportForecastPayload(__VU, __ITER, data.runTag || '');
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_reports_suite_post_fc', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_post_fc,
    err_post_fc,
    ok_post_fc,
    res,
    200,
    `${SUITE_TAG} POST Reports forecast`,
    bpostFc.buckets,
    REPORTS_HTTP_SUCCESS,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function postScenario(data) {
  const hdrs = apiHeaders(data.token);
  if (SUITE_WRITE_JITTER_MS > 0) sleep((Math.random() * SUITE_WRITE_JITTER_MS) / 1000);
  const url = `${data.base}/api/v1/Reports/${encodeURIComponent(data.cashflowId)}/scenario`;
  const body = buildReportScenarioPayload(__VU, __ITER, data.runTag || '');
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_reports_suite_post_sc', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_post_sc,
    err_post_sc,
    ok_post_sc,
    res,
    200,
    `${SUITE_TAG} POST Reports scenario`,
    bpostSc.buckets,
    REPORTS_HTTP_SUCCESS,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

function block(data, name, method, endpoint, expectedStatus, durN, errN, okN, bucketDefs) {
  const dur = metricValuesForTrend(data, durN);
  const errs = metricCount(data, errN);
  const oks = metricCount(data, okN);
  const total = oks + errs;
  const statusLines =
    errs > 0 && bucketDefs && bucketDefs.length ? collectErrorBucketBreakdown(data, bucketDefs) : [];
  const errorMessages =
    errs > 0
      ? (() => {
          const lines = [
            `${errs} failed request(s) for [${name}]; see k6 stderr for trimmed bodies.`,
          ];
          if (statusLines.length > 0) {
            lines.push(`Error breakdown: ${statusLines.join('; ')}`);
          } else {
            lines.push('Error breakdown: (no bucket counters recorded for this API).');
          }
          return lines;
        })()
      : [];
  return {
    apiName: name,
    endpoint,
    method,
    expectedStatus,
    success: total > 0 && errs === 0,
    averageResponseTimeMs: dur.avg,
    p95ResponseTimeMs: dur.p95,
    medianResponseTimeMs: dur.med,
    totalRequests: total,
    errorCount: errs,
    errorMessages,
  };
}

export function handleSummary(data) {
  const apis = [
    block(
      data,
      'GET cashflow',
      'GET',
      '/api/v1/cashflows/{cashflowId}',
      200,
      'cashflows_reports_suite_get_cf_ms',
      'cashflows_reports_suite_get_cf_errors',
      'cashflows_reports_suite_get_cf_success',
      bcf.defs,
    ),
    block(
      data,
      'GET financial',
      'GET',
      '/api/v1/cashflows/{cashflowId}/financial',
      200,
      'cashflows_reports_suite_get_fin_ms',
      'cashflows_reports_suite_get_fin_errors',
      'cashflows_reports_suite_get_fin_success',
      bfin.defs,
    ),
    block(
      data,
      'GET Reports',
      'GET',
      '/api/v1/Reports/{cashflowId}',
      '200 or 204',
      'cashflows_reports_suite_get_rep_ms',
      'cashflows_reports_suite_get_rep_errors',
      'cashflows_reports_suite_get_rep_success',
      brep.defs,
    ),
    block(
      data,
      'POST Reports (forecast)',
      'POST',
      '/api/v1/Reports/{cashflowId}',
      '200 or 204',
      'cashflows_reports_suite_post_fc_ms',
      'cashflows_reports_suite_post_fc_errors',
      'cashflows_reports_suite_post_fc_success',
      bpostFc.defs,
    ),
    block(
      data,
      'POST Reports scenario',
      'POST',
      '/api/v1/Reports/{cashflowId}/scenario',
      '200 or 204',
      'cashflows_reports_suite_post_sc_ms',
      'cashflows_reports_suite_post_sc_errors',
      'cashflows_reports_suite_post_sc_success',
      bpostSc.defs,
    ),
  ];

  let okSum = 0;
  let errSum = 0;
  for (let i = 0; i < apis.length; i++) {
    okSum += apis[i].totalRequests - apis[i].errorCount;
    errSum += apis[i].errorCount;
  }
  const total = okSum + errSum;
  const durationMs =
    data.state && data.state.testRunDurationMs != null ? data.state.testRunDurationMs : null;
  const vusMax =
    data.metrics.vus_max && data.metrics.vus_max.values && data.metrics.vus_max.values.max != null
      ? data.metrics.vus_max.values.max
      : null;

  const report = {
    screenName: 'cashflows-reports',
    screenRoute: '/cashflows/{cashflowId}/reports',
    portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/reports',
    generatedAt: new Date().toISOString(),
    testDurationMs: durationMs,
    totalVUs: vusMax,
    concurrentScenarios: 5,
    vusPerScenario: SUITE_VUS,
    overallSuccessRate: total > 0 ? okSum / total : null,
    apis,
  };

  const out = {
    'k6/cashflows-reports/reports/cashflows-reports-load-report.json': JSON.stringify(report, null, 2),
  };
  return attachSuitePerfSlice(out, data, 'reports', 'k6-cashflows-reports-suite-load', apis);
}
