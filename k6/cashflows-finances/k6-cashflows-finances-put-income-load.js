/**
 * Load test **PUT /api/v1/cashflows/{cashflowId}/financial/income** for **`/cashflows/{id}/finances`** (POST seed → PUT → DELETE cleanup).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-finances/k6-cashflows-finances-put-income-load.js -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
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
  buildMinimalIncomeLineItem,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  parseLastIncomeMatchingAnySubstring,
  readAllLifecycleUsersAtInit,
  resolveIncomeLineAfterPost,
  createHttpErrorBuckets,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
  trimResBody,
} from './common-finances-screen.js';

const SCRIPT_TAG = 'k6-cashflows-finances-put-income-load';
const GLOBAL_SEED = '__k6CfFinancesSeed_putinc';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_finances_put_income_ms');
const errs = new Counter('cashflows_finances_put_income_errors');
const oks = new Counter('cashflows_finances_put_income_success');
const errBuckets = createHttpErrorBuckets('cashflows_finances_put_income_err', { lineResolve: true });

export const options = {
  scenarios: {
    cashflows_finances_put_income: {
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

function deleteIncomeLine(base, hdrs, cashflowId, needle, stablePrefix) {
  const getUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/income-expense/financial`;
  const g = http.get(getUrl, {
    headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
    tags: { name: 'cashflows_finances_put_inc_cleanup_get', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const matchers = [needle, stablePrefix].filter((x) => x && String(x).trim());
  const row = parseLastIncomeMatchingAnySubstring(g, matchers);
  if (!row) return;
  const line = buildMinimalIncomeLineItem({
    id: row.id,
    description: row.description,
    amount: 999,
  });
  const delRes = http.del(
    `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial/income`,
    JSON.stringify(line),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_put_inc_cleanup_del', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (delRes.status !== 200) {
    console.error(
      `[${SCRIPT_TAG}] cleanup DELETE failed HTTP ${delRes.status} body=${trimResBody(delRes, 2000)}`,
    );
  }
}

export default function (data) {
  const base = data.base;
  const runTag = data.runTag;
  const idx = SHARED_CASHFLOW_ID ? 0 : __VU - 1;
  const e = getVuEntry(base, runTag, __VU, idx, LIFECYCLE_USERS, SCRIPT_TAG, GLOBAL_SEED);
  const hdrs = apiHeaders(e.token);
  const cfId = e.seededCashflowId;
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances income load test update', runTag, __VU, __ITER);
  const postUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cfId)}/financial/income`;
  const createBody = buildMinimalIncomeLineItem({
    description: descFull,
    amount: 700 + (__VU % 40),
  });
  const postRes = http.post(postUrl, JSON.stringify(createBody), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_put_inc_seed', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur,
      errs,
      oks,
      postRes,
      200,
      `${SCRIPT_TAG} POST seed vu${__VU}`,
      errBuckets.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const resolved = resolveIncomeLineAfterPost({
    postRes,
    base,
    hdrs,
    cashflowId: cfId,
    needle: descFull,
    stablePrefix,
    vuTag: String(__VU),
    tagName: 'cashflows_finances_put_inc_getid',
  });
  if (!resolved) {
    errs.add(1);
    recordErrorInStatusBuckets(errBuckets.buckets, 'line_resolve');
    console.error(`[${SCRIPT_TAG}] could not resolve income line vu${__VU}`);
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const putBody = buildMinimalIncomeLineItem({
    id: resolved.id,
    description: resolved.description,
    amount: 950 + (__ITER % 20),
  });
  const putRes = http.put(postUrl, JSON.stringify(putBody), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_put_income', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const putOk = recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    putRes,
    200,
    `${SCRIPT_TAG} PUT financial/income vu${__VU}`,
    errBuckets.buckets,
  );
  if (putOk) {
    deleteIncomeLine(base, hdrs, cfId, descFull, stablePrefix);
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-finances',
  screenRoute: '/cashflows/{cashflowId}/finances',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/finances',
  apiKey: 'put_financial_income',
  apiLabel: 'PUT /api/v1/cashflows/{cashflowId}/financial/income',
  method: 'PUT',
  endpoint: '/api/v1/cashflows/{cashflowId}/financial/income',
  expectedStatus: 200,
  durMetricName: 'cashflows_finances_put_income_ms',
  errMetricName: 'cashflows_finances_put_income_errors',
  okMetricName: 'cashflows_finances_put_income_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-finances/reports/cashflows-finances-put-income-load-report.json',
});
