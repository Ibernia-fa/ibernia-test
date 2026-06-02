/**
 * Load test **POST /api/v1/cashflows/{cashflowId}/financial/income** — add income line (then **DELETE** same line each iteration to avoid polluting plans).
 *
 * **Concurrency:** **`constant-vus`**. Payload matches **`FinancialRecordLineItem`** / **`NetAmount`** (see API Swagger).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-income/k6-cashflows-income-post-income-load.js -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
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
  readAllLifecycleUsersAtInit,
  resolveIncomeLineAfterPost,
  createHttpErrorBuckets,
  recordOutcomeWithBuckets,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
  trimResBody,
  deleteGlobalSeed,
} from './common-income-screen.js';

const SCRIPT_TAG = 'k6-cashflows-income-post-income-load';
const GLOBAL_SEED = '__k6CfIncomeSeed_postinc';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_income_post_income_ms');
const errs = new Counter('cashflows_income_post_income_errors');
const oks = new Counter('cashflows_income_post_income_success');
const errBuckets = createHttpErrorBuckets('cashflows_income_post_income_err');

export const options = {
  scenarios: {
    cashflows_income_post_income: {
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

function deleteIncomeLine(base, hdrs, cashflowId, postRes, needle, stablePrefix) {
  const resolved = resolveIncomeLineAfterPost({
    postRes,
    base,
    hdrs,
    cashflowId,
    needle,
    stablePrefix,
    vuTag: String(__VU),
    tagName: 'cashflows_income_post_cleanup_get',
  });
  if (!resolved) {
    console.error(
      `[${SCRIPT_TAG}] cleanup: could not resolve line vu${__VU} prefix=${stablePrefix || needle}`,
    );
    return;
  }
  const line = buildMinimalIncomeLineItem({
    id: resolved.id,
    description: resolved.description,
  });
  const delRes = http.del(
    `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial/income`,
    JSON.stringify(line),
    {
      headers: hdrs,
      tags: { name: 'cashflows_income_post_cleanup_del', vu: String(__VU) },
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
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Income load test post', runTag, __VU, __ITER);
  const body = buildMinimalIncomeLineItem({
    description: descFull,
    amount: 800 + (__VU % 50) * 10,
  });
  const url = `${base}/api/v1/cashflows/${encodeURIComponent(cfId)}/financial/income`;
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_income_post_income', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const postOk = recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    200,
    `${SCRIPT_TAG} POST financial/income vu${__VU}`,
    errBuckets.buckets,
  );
  if (postOk) {
    deleteIncomeLine(base, hdrs, cfId, res, descFull, stablePrefix);
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-income',
  apiKey: 'post_financial_income',
  apiLabel: 'POST /api/v1/cashflows/{cashflowId}/financial/income',
  method: 'POST',
  endpoint: '/api/v1/cashflows/{cashflowId}/financial/income',
  expectedStatus: 200,
  durMetricName: 'cashflows_income_post_income_ms',
  errMetricName: 'cashflows_income_post_income_errors',
  okMetricName: 'cashflows_income_post_income_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-income/reports/cashflows-income-post-income-load-report.json',
});
