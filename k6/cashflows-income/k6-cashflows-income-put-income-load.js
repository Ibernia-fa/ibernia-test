/**
 * Load test **PUT /api/v1/cashflows/{cashflowId}/financial/income** — **POST** temp line → **PUT** → **DELETE** each iteration (unique description per VU/iter).
 *
 * **Concurrency:** **`constant-vus`**.
 *
 * After **POST**, line **`id`** is resolved from the POST body and/or **GET …/income-expense/financial** with short backoff (read-after-write). Descriptions use a **stable prefix** plus suffix so matching still works if the API truncates text. Override retries with **`-e INCOME_LINE_RESOLVE_MAX_ATTEMPTS=15`**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-income/k6-cashflows-income-put-income-load.js -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
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
  deleteGlobalSeed,
} from './common-income-screen.js';

const SCRIPT_TAG = 'k6-cashflows-income-put-income-load';
const GLOBAL_SEED = '__k6CfIncomeSeed_putinc';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_income_put_income_ms');
const errs = new Counter('cashflows_income_put_income_errors');
const oks = new Counter('cashflows_income_put_income_success');
const errBuckets = createHttpErrorBuckets('cashflows_income_put_income_err', { lineResolve: true });

export const options = {
  scenarios: {
    cashflows_income_put_income: {
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
    tags: { name: 'cashflows_income_put_cleanup_get', vu: String(__VU) },
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
      tags: { name: 'cashflows_income_put_cleanup_del', vu: String(__VU) },
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
  const vuKey = __VU;
  const e = getVuEntry(base, runTag, vuKey, idx, LIFECYCLE_USERS, SCRIPT_TAG, GLOBAL_SEED);
  const hdrs = apiHeaders(e.token);
  const cfId = e.seededCashflowId;
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Income load test update', runTag, __VU, __ITER);
  const postUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cfId)}/financial/income`;
  const createBody = buildMinimalIncomeLineItem({
    description: descFull,
    amount: 700 + (__VU % 40),
  });
  const postRes = http.post(postUrl, JSON.stringify(createBody), {
    headers: hdrs,
    tags: { name: 'cashflows_income_put_seed_post', vu: String(__VU) },
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
    tagName: 'cashflows_income_put_get_id',
  });
  if (!resolved) {
    errs.add(1);
    recordErrorInStatusBuckets(errBuckets.buckets, 'line_resolve');
    console.error(
      `[${SCRIPT_TAG}] could not resolve income line id for vu${__VU} prefix=${stablePrefix} full=${descFull}`,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const putBody = buildMinimalIncomeLineItem({
    id: resolved.id,
    description: resolved.description,
    amount: 950 + (__ITER % 20),
  });
  const putUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cfId)}/financial/income`;
  const putRes = http.put(putUrl, JSON.stringify(putBody), {
    headers: hdrs,
    tags: { name: 'cashflows_income_put_income', vu: String(__VU) },
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
  screenName: 'cashflows-income',
  apiKey: 'put_financial_income',
  apiLabel: 'PUT /api/v1/cashflows/{cashflowId}/financial/income',
  method: 'PUT',
  endpoint: '/api/v1/cashflows/{cashflowId}/financial/income',
  expectedStatus: 200,
  durMetricName: 'cashflows_income_put_income_ms',
  errMetricName: 'cashflows_income_put_income_errors',
  okMetricName: 'cashflows_income_put_income_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-income/reports/cashflows-income-put-income-load-report.json',
});
