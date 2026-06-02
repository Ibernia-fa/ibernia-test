/**
 * **Combined** Events load for **`https://dev.ibernia.it/cashflows/{cashflowId}/timeline`** — parallel scenarios
 * for **`GET /api/v1/Events/default`** and **`GET /api/v1/Events/custom`** only (no **`POST /api/v1/Events`** — custom goals are not created).
 * (row **0** token from **`lifecycle-users.json`**).
 *
 * **Report:** `k6/cashflows-timeline/reports/cashflows-timeline-load-report.json`
 *
 * **`VUS`** (default **6**) = VUs **per scenario** (two scenarios ⇒ up to **12** concurrent VUs).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-timeline/k6-cashflows-timeline-suite-load.js `
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
  abortTest,
  assertApiBase,
  assertDevIdentityHost,
  apiHeaders,
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  DURATION,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  loginAdvisorFromRow0,
  logHttpError,
  metricCount,
  metricValuesForTrend,
  readFirstLifecycleUserAtInit,
  recordOutcomeWithBuckets,
  THINK_SEC,
} from './common-cashflows-timeline-screen.js';

const SUITE_TAG = 'k6-cashflows-timeline-suite-load';

assertDevIdentityHost(IDENTITY_BASE, SUITE_TAG);
assertApiBase(API_BASE, SUITE_TAG);
const LIFECYCLE_ROW0 = readFirstLifecycleUserAtInit(SUITE_TAG);

const SUITE_VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10) || 6);
const SUITE_GRACEFUL_STOP = (__ENV.SUITE_GRACEFUL_STOP || '8s').trim() || '8s';
const SUITE_SCENARIO_STAGGER_MS = Math.max(
  0,
  parseInt((__ENV.SUITE_SCENARIO_STAGGER_MS || '80').trim(), 10) || 0,
);

function scenarioStart(scenarioIndex) {
  const ms = scenarioIndex * SUITE_SCENARIO_STAGGER_MS;
  if (ms <= 0) return '0s';
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${ms}ms`;
}

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxGoalsModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_GOALS_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxGoalsModule;

const dur_def = new Trend('cf_timeline_suite_events_default_ms');
const err_def = new Counter('cf_timeline_suite_events_default_errors');
const ok_def = new Counter('cf_timeline_suite_events_default_success');
const bDef = createHttpErrorBuckets('cf_timeline_suite_events_default_err');

const dur_cust = new Trend('cf_timeline_suite_events_custom_ms');
const err_cust = new Counter('cf_timeline_suite_events_custom_errors');
const ok_cust = new Counter('cf_timeline_suite_events_custom_success');
const bCust = createHttpErrorBuckets('cf_timeline_suite_events_custom_err');

export const options = {
  scenarios: {
    s_events_default: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suiteEventsDefault',
      startTime: scenarioStart(0),
    },
    s_events_custom: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suiteEventsCustom',
      startTime: scenarioStart(1),
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.78'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.12'] }),
  },
};

export function setup() {
  const runTag = `r${Date.now()}`;
  const ctx = loginAdvisorFromRow0(SUITE_TAG, LIFECYCLE_ROW0);
  if (!ctx) abortTest(SUITE_TAG, 'setup: login failed lifecycle row 0.');
  console.log(
    `[${SUITE_TAG}] runTag=${runTag} | VUs/scenario=${SUITE_VUS} | DURATION=${DURATION} | read-only Goals GETs`,
  );
  return {
    base: API_BASE,
    runTag,
    token: ctx.accessToken,
  };
}

export function suiteEventsDefault(data) {
  const hdrs = apiHeaders(data.token);
  const res = http.get(`${data.base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'cf_timeline_suite_events_default', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_def,
    err_def,
    ok_def,
    res,
    200,
    `${SUITE_TAG} GET /Events/default`,
    bDef.buckets,
    [200, 204],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function suiteEventsCustom(data) {
  const hdrs = apiHeaders(data.token);
  const res = http.get(`${data.base}/api/v1/Events/custom`, {
    headers: hdrs,
    tags: { name: 'cf_timeline_suite_events_custom', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_cust,
    err_cust,
    ok_cust,
    res,
    200,
    `${SUITE_TAG} GET /Events/custom`,
    bCust.buckets,
    [200, 204],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

function apiBlock(data, name, method, endpoint, expectedStatus, durName, errName, okName, bucketDefs) {
  const dur = metricValuesForTrend(data, durName);
  const errs = metricCount(data, errName);
  const oks = metricCount(data, okName);
  const total = oks + errs;
  const errorMessages =
    errs > 0
      ? (() => {
          const lines = [
            `${errs} failed request(s) or checks for [${name}] (${method} ${endpoint}).`,
            'Inspect k6 stderr for status and trimmed response body.',
          ];
          if (bucketDefs && bucketDefs.length) {
            const statusLines = collectErrorBucketBreakdown(data, bucketDefs);
            if (statusLines.length) lines.push(`Error breakdown: ${statusLines.join('; ')}`);
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
    minResponseTimeMs: dur.min,
    maxResponseTimeMs: dur.max,
    totalRequests: total,
    errorCount: errs,
    errorMessages,
  };
}

export function handleSummary(data) {
  const apis = [
    apiBlock(
      data,
      'GET /api/v1/Events/default',
      'GET',
      '/api/v1/Events/default',
      '200 or 204',
      'cf_timeline_suite_events_default_ms',
      'cf_timeline_suite_events_default_errors',
      'cf_timeline_suite_events_default_success',
      bDef.defs,
    ),
    apiBlock(
      data,
      'GET /api/v1/Events/custom',
      'GET',
      '/api/v1/Events/custom',
      '200 or 204',
      'cf_timeline_suite_events_custom_ms',
      'cf_timeline_suite_events_custom_errors',
      'cf_timeline_suite_events_custom_success',
      bCust.defs,
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
    screenName: 'cashflows-timeline',
    screenRoute: '/cashflows/{cashflowId}/timeline',
    portalUrlExample: 'https://dev.ibernia.it/cashflows/6a057edec102585d7848509c/timeline',
    generatedAt: new Date().toISOString(),
    testDurationMs: durationMs,
    totalVUs: vusMax,
    concurrentScenarios: 2,
    vusPerScenario: SUITE_VUS,
    overallSuccessRate: total > 0 ? okSum / total : null,
    apis,
  };

  const out = {
    'k6/cashflows-timeline/reports/cashflows-timeline-load-report.json': JSON.stringify(report, null, 2),
  };
  return attachSuitePerfSlice(out, data, 'timeline', 'k6-cashflows-timeline-suite-load', apis);
}
