/**
 * Load test **GET /api/v1/Reports/{cashflowId}** for **`/cashflows/{id}/reports`** (projection / series; **200** or **204**).
 *
 * Optional query **`inflationRate`** (realistic ~2–3.5%) is rotated per **VU**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-reports/k6-cashflows-reports-get-reports-load.js -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  API_BASE,
  assertApiBase,
  assertDevIdentityHost,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  readAllLifecycleUsersAtInit,
  recordOutcomeWithBuckets,
  REPORTS_HTTP_SUCCESS,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
} from './common-cashflows-reports-screen.js';
import { teardownTimeoutOption } from '../../lib/k6-teardown-timeout.js';

const SCRIPT_TAG = 'k6-cashflows-reports-get-reports-load';
const GLOBAL_SEED = '__k6CfReportsSeed_getrep';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_reports_get_reports_ms');
const errs = new Counter('cashflows_reports_get_reports_errors');
const oks = new Counter('cashflows_reports_get_reports_success');
const errBuckets = createHttpErrorBuckets('cashflows_reports_get_reports_err');

export const options = {
  ...teardownTimeoutOption(LIFECYCLE_USERS.length),
  scenarios: {
    cashflows_reports_get_reports: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.88'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.08'] }),
  },
};

export function setup() {
  const runTag = `r${Date.now()}`;
  console.log(`[${SCRIPT_TAG}] runTag=${runTag} | VUs=${SCENARIO_VUS} | DURATION=${DURATION}`);
  return { base: API_BASE, runTag };
}

export function teardown(data) {
  if (!data) return;
  if (SHARED_CASHFLOW_ID) {
    deleteGlobalSeed(GLOBAL_SEED);
    return;
  }
  teardownByNeedle(SCRIPT_TAG, data.base, data.runTag, LIFECYCLE_USERS);
  deleteGlobalSeed(GLOBAL_SEED);
}

export default function (data) {
  const base = data.base;
  const runTag = data.runTag;
  const idx = SHARED_CASHFLOW_ID ? 0 : __VU - 1;
  const e = getVuEntry(base, runTag, __VU, idx, LIFECYCLE_USERS, SCRIPT_TAG, GLOBAL_SEED);
  const hdrs = {
    Accept: 'application/json',
    Authorization: `Bearer ${e.token}`,
  };
  const inflationRate = 2.0 + ((__VU + __ITER) % 16) / 10;
  const url = `${base}/api/v1/Reports/${encodeURIComponent(e.seededCashflowId)}?inflationRate=${inflationRate}`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'cashflows_reports_get_reports', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    200,
    `${SCRIPT_TAG} GET Reports vu${__VU}`,
    errBuckets.buckets,
    REPORTS_HTTP_SUCCESS,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-reports',
  screenRoute: '/cashflows/{cashflowId}/reports',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/reports',
  apiKey: 'get_reports',
  apiLabel: 'GET /api/v1/Reports/{cashflowId}',
  method: 'GET',
  endpoint: '/api/v1/Reports/{cashflowId}',
  expectedStatus: 200,
  expectedStatusDisplay: '200 or 204',
  durMetricName: 'cashflows_reports_get_reports_ms',
  errMetricName: 'cashflows_reports_get_reports_errors',
  okMetricName: 'cashflows_reports_get_reports_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-reports/reports/cashflows-reports-get-reports-load-report.json',
});
