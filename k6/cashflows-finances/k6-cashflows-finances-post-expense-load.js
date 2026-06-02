/**
 * Load test **POST /api/v1/cashflows/{cashflowId}/financial/expense** for **`/cashflows/{id}/finances`** (then DELETE cleanup).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-finances/k6-cashflows-finances-post-expense-load.js -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  API_BASE,
  apiHeaders,
  assertApiBase,
  assertDevIdentityHost,
  buildLoadTestLineNeedles,
  buildMinimalExpenseLineItem,
  deleteExpenseLineQuiet,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  readAllLifecycleUsersAtInit,
  resolveExpenseLineAfterPost,
  createHttpErrorBuckets,
  recordOutcomeWithBuckets,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
} from './common-finances-screen.js';

const SCRIPT_TAG = 'k6-cashflows-finances-post-expense-load';
const GLOBAL_SEED = '__k6CfFinancesSeed_postexp';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_finances_post_expense_ms');
const errs = new Counter('cashflows_finances_post_expense_errors');
const oks = new Counter('cashflows_finances_post_expense_success');
const errBuckets = createHttpErrorBuckets('cashflows_finances_post_expense_err');

export const options = {
  scenarios: {
    cashflows_finances_post_expense: {
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
  const hdrs = apiHeaders(e.token);
  const cfId = e.seededCashflowId;
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances expense load test post', runTag, __VU, __ITER);
  const body = buildMinimalExpenseLineItem({
    description: descFull,
    amount: 450 + (__VU % 35) * 5,
  });
  const url = `${base}/api/v1/cashflows/${encodeURIComponent(cfId)}/financial/expense`;
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_post_expense', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const postOk = recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    200,
    `${SCRIPT_TAG} POST financial/expense vu${__VU}`,
    errBuckets.buckets,
  );
  if (postOk) {
    const resolved = resolveExpenseLineAfterPost({
      postRes: res,
      base,
      hdrs,
      cashflowId: cfId,
      needle: descFull,
      stablePrefix,
      vuTag: String(__VU),
      tagName: 'cashflows_finances_post_exp_cleanup_resolve',
    });
    if (resolved) {
      deleteExpenseLineQuiet(base, hdrs, cfId, [descFull, stablePrefix].filter((x) => x && String(x).trim()));
    }
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-finances',
  screenRoute: '/cashflows/{cashflowId}/finances',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/finances',
  apiKey: 'post_financial_expense',
  apiLabel: 'POST /api/v1/cashflows/{cashflowId}/financial/expense',
  method: 'POST',
  endpoint: '/api/v1/cashflows/{cashflowId}/financial/expense',
  expectedStatus: 200,
  durMetricName: 'cashflows_finances_post_expense_ms',
  errMetricName: 'cashflows_finances_post_expense_errors',
  okMetricName: 'cashflows_finances_post_expense_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-finances/reports/cashflows-finances-post-expense-load-report.json',
});
