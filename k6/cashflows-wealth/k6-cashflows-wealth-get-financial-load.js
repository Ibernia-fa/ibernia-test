/**
 * Load test GET /api/v1/cashflows/{cashflowId}/financial for /cashflows/{id}/wealth.
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
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
} from './common-cashflows-wealth-screen.js';

const SCRIPT_TAG = 'k6-cashflows-wealth-get-financial-load';
const GLOBAL_SEED = '__k6CfWealthSeed_getfin';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_wealth_get_financial_ms');
const errs = new Counter('cashflows_wealth_get_financial_errors');
const oks = new Counter('cashflows_wealth_get_financial_success');
const errBuckets = createHttpErrorBuckets('cashflows_wealth_get_financial_err');

export const options = {
  scenarios: {
    cashflows_wealth_get_financial: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.05'] }),
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
  const url = `${base}/api/v1/cashflows/${encodeURIComponent(e.seededCashflowId)}/financial`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_get_financial', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(dur, errs, oks, res, 200, `${SCRIPT_TAG} GET financial vu${__VU}`, errBuckets.buckets);
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-wealth',
  screenRoute: '/cashflows/{cashflowId}/wealth',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/wealth',
  apiKey: 'get_financial',
  apiLabel: 'GET /api/v1/cashflows/{cashflowId}/financial',
  method: 'GET',
  endpoint: '/api/v1/cashflows/{cashflowId}/financial',
  expectedStatus: 200,
  durMetricName: 'cashflows_wealth_get_financial_ms',
  errMetricName: 'cashflows_wealth_get_financial_errors',
  okMetricName: 'cashflows_wealth_get_financial_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-wealth/reports/cashflows-wealth-get-financial-load-report.json',
});
