/**
 * **Combined** load test for **`/cashflows/{cashflowId}/finances`** — **eight parallel scenarios** (constant VUs each),
 * one shared plan (seed in **`setup()`**), merged JSON report.
 *
 * **Screen URL example:** `https://dev.ibernia.it/cashflows/{cashflowId}/finances`
 *
 * **APIs:** GET cashflow, GET financial (full record), POST/PUT/DELETE financial/income, POST/PUT/DELETE financial/expense.
 *
 * **Report:** **`k6/cashflows-finances/reports/cashflows-finances-load-report.json`**
 *
 * **`VUS`** (default **20**) = VUs **per scenario**; eight scenarios ⇒ up to **8 × VUS** concurrent VUs.
 * One seeded **cashflow** is shared across scenarios → heavy **write** contention (HTTP **500**) is possible.
 * Ease with **`-e VUS=5`**, **`-e SUITE_WRITE_JITTER_MS=400`**, **`-e SUITE_SCENARIO_STAGGER_MS=250`**, **`SHARED_CASHFLOW_ID`**, or **`RELAX_*`**.
 * **`SUITE_GRACEFUL_STOP`** (default **15s**) reduces **HTTP 0** from aborted requests at shutdown. Set **`LOG_HTTP0_ERRORS=1`** to log those again.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-finances/k6-cashflows-finances-suite-load.js `
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
  buildLoadTestLineNeedles,
  buildMinimalExpenseLineItem,
  buildMinimalIncomeLineItem,
  buildMinimalIncomeLineItemFromIeRow,
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  deleteExpenseLineQuiet,
  DURATION,
  findLastExpenseRowById,
  findLastExpenseRowMatchingAnySubstring,
  findLastIncomeRowById,
  findLastIncomeRowMatchingAnySubstring,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  incomeRowWithUpdatedAmount,
  normalizeIncomeLineCloneForPutApi,
  readAllLifecycleUsersAtInit,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  resolveExpenseLineAfterPost,
  resolveIncomeLineAfterPost,
  seedCashflowForVu,
  SHARED_CASHFLOW_ID,
  sharedCashflowContext,
  teardownByNeedle,
  THINK_SEC,
  metricValuesForTrend,
  metricCount,
  deleteGlobalSeed,
} from './common-finances-screen.js';

const SUITE_TAG = 'k6-cashflows-finances-suite-load';
const SUITE_SEED_KEY = '__k6CfFinancesSuiteSeed';

assertDevIdentityHost(IDENTITY_BASE, SUITE_TAG);
assertApiBase(API_BASE, SUITE_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SUITE_TAG);

const SUITE_VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SUITE_PUT_5XX_RETRIES = Math.max(0, parseInt((__ENV.SUITE_PUT_5XX_RETRIES || '8').trim(), 10) || 8);
const SUITE_WRITE_JITTER_MS = Math.max(0, parseInt((__ENV.SUITE_WRITE_JITTER_MS || '280').trim(), 10) || 0);
const SUITE_SCENARIO_STAGGER_MS = Math.max(
  0,
  parseInt((__ENV.SUITE_SCENARIO_STAGGER_MS || '180').trim(), 10) || 0,
);
const SUITE_GRACEFUL_STOP = (__ENV.SUITE_GRACEFUL_STOP || '15s').trim() || '15s';

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

function finUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial`;
}

const dur_get_cf = new Trend('cashflows_finances_suite_get_cf_ms');
const err_get_cf = new Counter('cashflows_finances_suite_get_cf_errors');
const ok_get_cf = new Counter('cashflows_finances_suite_get_cf_success');

const dur_get_fin = new Trend('cashflows_finances_suite_get_fin_ms');
const err_get_fin = new Counter('cashflows_finances_suite_get_fin_errors');
const ok_get_fin = new Counter('cashflows_finances_suite_get_fin_success');

const dur_post_inc = new Trend('cashflows_finances_suite_post_inc_ms');
const err_post_inc = new Counter('cashflows_finances_suite_post_inc_errors');
const ok_post_inc = new Counter('cashflows_finances_suite_post_inc_success');

const dur_put_inc = new Trend('cashflows_finances_suite_put_inc_ms');
const err_put_inc = new Counter('cashflows_finances_suite_put_inc_errors');
const ok_put_inc = new Counter('cashflows_finances_suite_put_inc_success');

const dur_del_inc = new Trend('cashflows_finances_suite_del_inc_ms');
const err_del_inc = new Counter('cashflows_finances_suite_del_inc_errors');
const ok_del_inc = new Counter('cashflows_finances_suite_del_inc_success');

const dur_post_exp = new Trend('cashflows_finances_suite_post_exp_ms');
const err_post_exp = new Counter('cashflows_finances_suite_post_exp_errors');
const ok_post_exp = new Counter('cashflows_finances_suite_post_exp_success');

const dur_put_exp = new Trend('cashflows_finances_suite_put_exp_ms');
const err_put_exp = new Counter('cashflows_finances_suite_put_exp_errors');
const ok_put_exp = new Counter('cashflows_finances_suite_put_exp_success');

const dur_del_exp = new Trend('cashflows_finances_suite_del_exp_ms');
const err_del_exp = new Counter('cashflows_finances_suite_del_exp_errors');
const ok_del_exp = new Counter('cashflows_finances_suite_del_exp_success');

const bcf = createHttpErrorBuckets('cashflows_finances_suite_get_cf_err');
const bfin = createHttpErrorBuckets('cashflows_finances_suite_get_fin_err');
const bpostInc = createHttpErrorBuckets('cashflows_finances_suite_post_inc_err');
const bputInc = createHttpErrorBuckets('cashflows_finances_suite_put_inc_err', { lineResolve: true, prefetch: true });
const bdelInc = createHttpErrorBuckets('cashflows_finances_suite_del_inc_err', { lineResolve: true });
const bpostExp = createHttpErrorBuckets('cashflows_finances_suite_post_exp_err');
const bputExp = createHttpErrorBuckets('cashflows_finances_suite_put_exp_err', { lineResolve: true, prefetch: true });
const bdelExp = createHttpErrorBuckets('cashflows_finances_suite_del_exp_err', { lineResolve: true });

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
    s_post_income: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'postIncome',
      startTime: scenarioStart(1),
    },
    s_put_income: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'putIncome',
      startTime: scenarioStart(2),
    },
    s_delete_income: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'deleteIncome',
      startTime: scenarioStart(3),
    },
    s_post_expense: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'postExpense',
      startTime: scenarioStart(4),
    },
    s_put_expense: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'putExpense',
      startTime: scenarioStart(5),
    },
    s_delete_expense: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'deleteExpense',
      startTime: scenarioStart(6),
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.82'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.12'] }),
  },
};

export function setup() {
  const runTag = `suiteFin${Date.now()}`;
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

function cleanupIncomeLine(data, hdrs, needle, stablePrefix) {
  const matchers = [needle, stablePrefix].filter((x) => x && String(x).trim());
  const getUrl = finUrl(data.base, data.cashflowId);
  for (let a = 0; a < 6; a++) {
    sleep(0.03 + a * 0.025);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_cleanup_inc_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const full = findLastIncomeRowMatchingAnySubstring(g, matchers);
    if (full) {
      http.del(
        `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`,
        JSON.stringify(full),
        {
          headers: hdrs,
          tags: { name: 'cashflows_finances_suite_cleanup_inc_del', vu: String(__VU) },
          timeout: HTTP_TIMEOUT,
        },
      );
      return;
    }
  }
}

export function getCashflow(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'cashflows_finances_suite_get_cf', vu: String(__VU) },
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
    tags: { name: 'cashflows_finances_suite_get_fin', vu: String(__VU) },
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

export function postIncome(data) {
  const hdrs = apiHeaders(data.token);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances suite income post', data.runTag, __VU, __ITER);
  const body = buildMinimalIncomeLineItem({ description: descFull, amount: 500 + (__VU % 20) });
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`;
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_suite_post_inc', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const ok = recordOutcomeWithBuckets(
    dur_post_inc,
    err_post_inc,
    ok_post_inc,
    res,
    200,
    `${SUITE_TAG} POST income`,
    bpostInc.buckets,
  );
  if (ok) cleanupIncomeLine(data, hdrs, descFull, stablePrefix);
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function putIncome(data) {
  const hdrs = apiHeaders(data.token);
  if (SUITE_WRITE_JITTER_MS > 0) sleep((Math.random() * SUITE_WRITE_JITTER_MS) / 1000);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances suite income update', data.runTag, __VU, __ITER);
  const postUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`;
  const postRes = http.post(
    postUrl,
    JSON.stringify(buildMinimalIncomeLineItem({ description: descFull, amount: 400 })),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_put_inc_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur_put_inc,
      err_put_inc,
      ok_put_inc,
      postRes,
      200,
      `${SUITE_TAG} PUT-inc POST seed`,
      bputInc.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const resolved = resolveIncomeLineAfterPost({
    postRes,
    base: data.base,
    hdrs,
    cashflowId: data.cashflowId,
    needle: descFull,
    stablePrefix,
    vuTag: String(__VU),
    tagName: 'cashflows_finances_suite_put_inc_getid',
  });
  if (!resolved) {
    err_put_inc.add(1);
    recordErrorInStatusBuckets(bputInc.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const getUrl = finUrl(data.base, data.cashflowId);
  const matchers = [descFull, stablePrefix].filter((x) => x && String(x).trim());
  let serverRow =
    resolved.fullRow ||
    findLastIncomeRowById(postRes, resolved.id) ||
    findLastIncomeRowMatchingAnySubstring(postRes, matchers);
  sleep(0.02 + (__VU % 12) * 0.012);
  for (let attempt = 0; attempt < 12 && !serverRow; attempt++) {
    sleep(0.04 + attempt * 0.028);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_put_inc_prefetch', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    serverRow =
      findLastIncomeRowById(g, resolved.id) || findLastIncomeRowMatchingAnySubstring(g, matchers);
  }
  if (!serverRow) {
    err_put_inc.add(1);
    recordErrorInStatusBuckets(bputInc.buckets, 'prefetch');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const newAmt = 880 + (__VU % 7);
  let putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(serverRow, newAmt));
  let putRes = http.put(postUrl, JSON.stringify(putBody), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_suite_put_inc', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  for (let r = 0; r < SUITE_PUT_5XX_RETRIES && putRes.status >= 500; r++) {
    sleep(0.07 * (r + 1));
    const g3 = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_put_inc_retry_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const row3 =
      findLastIncomeRowById(g3, resolved.id) || findLastIncomeRowMatchingAnySubstring(g3, matchers);
    if (!row3) break;
    putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(row3, newAmt));
    putRes = http.put(postUrl, JSON.stringify(putBody), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_put_inc_retry', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
  }
  if (putRes.status >= 500) {
    sleep(0.08);
    const gMin = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_put_inc_fb_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const rMin =
      findLastIncomeRowById(gMin, resolved.id) ||
      findLastIncomeRowMatchingAnySubstring(gMin, matchers) ||
      serverRow;
    const minimal = buildMinimalIncomeLineItemFromIeRow(rMin, newAmt);
    if (minimal) {
      putRes = http.put(postUrl, JSON.stringify(minimal), {
        headers: hdrs,
        tags: { name: 'cashflows_finances_suite_put_inc_fb', vu: String(__VU) },
        timeout: HTTP_TIMEOUT,
      });
    }
  }
  const ok = recordOutcomeWithBuckets(
    dur_put_inc,
    err_put_inc,
    ok_put_inc,
    putRes,
    200,
    `${SUITE_TAG} PUT income`,
    bputInc.buckets,
  );
  if (ok) cleanupIncomeLine(data, hdrs, descFull, stablePrefix);
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function deleteIncome(data) {
  const hdrs = apiHeaders(data.token);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances suite income delete', data.runTag, __VU, __ITER);
  const postUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`;
  const postRes = http.post(
    postUrl,
    JSON.stringify(buildMinimalIncomeLineItem({ description: descFull, amount: 350 })),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_del_inc_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur_del_inc,
      err_del_inc,
      ok_del_inc,
      postRes,
      200,
      `${SUITE_TAG} DELETE-inc POST seed`,
      bdelInc.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const resolved = resolveIncomeLineAfterPost({
    postRes,
    base: data.base,
    hdrs,
    cashflowId: data.cashflowId,
    needle: descFull,
    stablePrefix,
    vuTag: String(__VU),
    tagName: 'cashflows_finances_suite_del_inc_getid',
  });
  if (!resolved) {
    err_del_inc.add(1);
    recordErrorInStatusBuckets(bdelInc.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const getUrl = finUrl(data.base, data.cashflowId);
  const delMatchers = [descFull, stablePrefix].filter((x) => x && String(x).trim());
  let delRow =
    resolved.fullRow ||
    findLastIncomeRowById(postRes, resolved.id) ||
    findLastIncomeRowMatchingAnySubstring(postRes, delMatchers);
  sleep(0.015 + (__VU % 10) * 0.01);
  for (let attempt = 0; attempt < 10 && !delRow; attempt++) {
    sleep(0.035 + attempt * 0.025);
    const gDel = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_del_inc_prefetch', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    delRow =
      findLastIncomeRowById(gDel, resolved.id) ||
      findLastIncomeRowMatchingAnySubstring(gDel, delMatchers);
  }
  if (!delRow) {
    delRow = buildMinimalIncomeLineItem({ id: resolved.id, description: resolved.description });
  }
  const delRes = http.del(
    `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`,
    JSON.stringify(delRow),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_del_inc', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  recordOutcomeWithBuckets(
    dur_del_inc,
    err_del_inc,
    ok_del_inc,
    delRes,
    200,
    `${SUITE_TAG} DELETE income`,
    bdelInc.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function postExpense(data) {
  const hdrs = apiHeaders(data.token);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances suite expense post', data.runTag, __VU, __ITER);
  const body = buildMinimalExpenseLineItem({ description: descFull, amount: 410 + (__VU % 18) });
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/expense`;
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_suite_post_exp', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const ok = recordOutcomeWithBuckets(
    dur_post_exp,
    err_post_exp,
    ok_post_exp,
    res,
    200,
    `${SUITE_TAG} POST expense`,
    bpostExp.buckets,
  );
  if (ok) {
    deleteExpenseLineQuiet(data.base, hdrs, data.cashflowId, [descFull, stablePrefix].filter((x) => x && String(x)));
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function putExpense(data) {
  const hdrs = apiHeaders(data.token);
  if (SUITE_WRITE_JITTER_MS > 0) sleep((Math.random() * SUITE_WRITE_JITTER_MS) / 1000);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances suite expense update', data.runTag, __VU, __ITER);
  const postUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/expense`;
  const postRes = http.post(
    postUrl,
    JSON.stringify(buildMinimalExpenseLineItem({ description: descFull, amount: 300 })),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_put_exp_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur_put_exp,
      err_put_exp,
      ok_put_exp,
      postRes,
      200,
      `${SUITE_TAG} PUT-exp POST seed`,
      bputExp.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const resolved = resolveExpenseLineAfterPost({
    postRes,
    base: data.base,
    hdrs,
    cashflowId: data.cashflowId,
    needle: descFull,
    stablePrefix,
    vuTag: String(__VU),
    tagName: 'cashflows_finances_suite_put_exp_getid',
  });
  if (!resolved) {
    err_put_exp.add(1);
    recordErrorInStatusBuckets(bputExp.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const getUrl = finUrl(data.base, data.cashflowId);
  const matchers = [descFull, stablePrefix].filter((x) => x && String(x).trim());
  let serverRow =
    resolved.fullRow ||
    findLastExpenseRowById(postRes, resolved.id) ||
    findLastExpenseRowMatchingAnySubstring(postRes, matchers);
  sleep(0.02 + (__VU % 10) * 0.012);
  for (let attempt = 0; attempt < 12 && !serverRow; attempt++) {
    sleep(0.04 + attempt * 0.028);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_put_exp_prefetch', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    serverRow =
      findLastExpenseRowById(g, resolved.id) ||
      findLastExpenseRowMatchingAnySubstring(g, matchers);
  }
  if (!serverRow) {
    err_put_exp.add(1);
    recordErrorInStatusBuckets(bputExp.buckets, 'prefetch');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const newAmt = 660 + (__VU % 9);
  let putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(serverRow, newAmt));
  let putRes = http.put(postUrl, JSON.stringify(putBody), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_suite_put_exp', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  for (let r = 0; r < SUITE_PUT_5XX_RETRIES && putRes.status >= 500; r++) {
    sleep(0.07 * (r + 1));
    const g3 = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_put_exp_retry_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const row3 =
      findLastExpenseRowById(g3, resolved.id) ||
      findLastExpenseRowMatchingAnySubstring(g3, matchers);
    if (!row3) break;
    putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(row3, newAmt));
    putRes = http.put(postUrl, JSON.stringify(putBody), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_put_exp_retry', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
  }
  if (putRes.status >= 500) {
    sleep(0.08 + (__VU % 7) * 0.012);
    const gMin = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_put_exp_fb_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const rMin =
      findLastExpenseRowById(gMin, resolved.id) ||
      findLastExpenseRowMatchingAnySubstring(gMin, matchers) ||
      serverRow;
    const minimal = buildMinimalIncomeLineItemFromIeRow(rMin, newAmt);
    if (minimal) {
      putRes = http.put(postUrl, JSON.stringify(minimal), {
        headers: hdrs,
        tags: { name: 'cashflows_finances_suite_put_exp_fb', vu: String(__VU) },
        timeout: HTTP_TIMEOUT,
      });
    }
  }
  const ok = recordOutcomeWithBuckets(
    dur_put_exp,
    err_put_exp,
    ok_put_exp,
    putRes,
    200,
    `${SUITE_TAG} PUT expense`,
    bputExp.buckets,
  );
  if (ok) {
    deleteExpenseLineQuiet(data.base, hdrs, data.cashflowId, matchers);
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function deleteExpense(data) {
  const hdrs = apiHeaders(data.token);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Finances suite expense delete', data.runTag, __VU, __ITER);
  const postUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/expense`;
  const postRes = http.post(
    postUrl,
    JSON.stringify(buildMinimalExpenseLineItem({ description: descFull, amount: 275 })),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_del_exp_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur_del_exp,
      err_del_exp,
      ok_del_exp,
      postRes,
      200,
      `${SUITE_TAG} DELETE-exp POST seed`,
      bdelExp.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const resolved = resolveExpenseLineAfterPost({
    postRes,
    base: data.base,
    hdrs,
    cashflowId: data.cashflowId,
    needle: descFull,
    stablePrefix,
    vuTag: String(__VU),
    tagName: 'cashflows_finances_suite_del_exp_getid',
  });
  if (!resolved) {
    err_del_exp.add(1);
    recordErrorInStatusBuckets(bdelExp.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const getUrl = finUrl(data.base, data.cashflowId);
  const delMatchers = [descFull, stablePrefix].filter((x) => x && String(x).trim());
  let delRow =
    resolved.fullRow ||
    findLastExpenseRowById(postRes, resolved.id) ||
    findLastExpenseRowMatchingAnySubstring(postRes, delMatchers);
  sleep(0.012 + (__VU % 8) * 0.01);
  for (let attempt = 0; attempt < 10 && !delRow; attempt++) {
    sleep(0.03 + attempt * 0.022);
    const gDel = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_finances_suite_del_exp_prefetch', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    delRow =
      findLastExpenseRowById(gDel, resolved.id) ||
      findLastExpenseRowMatchingAnySubstring(gDel, delMatchers);
  }
  if (!delRow) {
    delRow = buildMinimalExpenseLineItem({ id: resolved.id, description: resolved.description });
  }
  const delRes = http.del(
    `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/expense`,
    JSON.stringify(delRow),
    {
      headers: hdrs,
      tags: { name: 'cashflows_finances_suite_del_exp', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  recordOutcomeWithBuckets(
    dur_del_exp,
    err_del_exp,
    ok_del_exp,
    delRes,
    200,
    `${SUITE_TAG} DELETE expense`,
    bdelExp.buckets,
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
      'cashflows_finances_suite_get_cf_ms',
      'cashflows_finances_suite_get_cf_errors',
      'cashflows_finances_suite_get_cf_success',
      bcf.defs,
    ),
    block(
      data,
      'GET financial',
      'GET',
      '/api/v1/cashflows/{cashflowId}/financial',
      200,
      'cashflows_finances_suite_get_fin_ms',
      'cashflows_finances_suite_get_fin_errors',
      'cashflows_finances_suite_get_fin_success',
      bfin.defs,
    ),
    block(
      data,
      'POST financial income',
      'POST',
      '/api/v1/cashflows/{cashflowId}/financial/income',
      200,
      'cashflows_finances_suite_post_inc_ms',
      'cashflows_finances_suite_post_inc_errors',
      'cashflows_finances_suite_post_inc_success',
      bpostInc.defs,
    ),
    block(
      data,
      'PUT financial income',
      'PUT',
      '/api/v1/cashflows/{cashflowId}/financial/income',
      200,
      'cashflows_finances_suite_put_inc_ms',
      'cashflows_finances_suite_put_inc_errors',
      'cashflows_finances_suite_put_inc_success',
      bputInc.defs,
    ),
    block(
      data,
      'DELETE financial income',
      'DELETE',
      '/api/v1/cashflows/{cashflowId}/financial/income',
      200,
      'cashflows_finances_suite_del_inc_ms',
      'cashflows_finances_suite_del_inc_errors',
      'cashflows_finances_suite_del_inc_success',
      bdelInc.defs,
    ),
    block(
      data,
      'POST financial expense',
      'POST',
      '/api/v1/cashflows/{cashflowId}/financial/expense',
      200,
      'cashflows_finances_suite_post_exp_ms',
      'cashflows_finances_suite_post_exp_errors',
      'cashflows_finances_suite_post_exp_success',
      bpostExp.defs,
    ),
    block(
      data,
      'PUT financial expense',
      'PUT',
      '/api/v1/cashflows/{cashflowId}/financial/expense',
      200,
      'cashflows_finances_suite_put_exp_ms',
      'cashflows_finances_suite_put_exp_errors',
      'cashflows_finances_suite_put_exp_success',
      bputExp.defs,
    ),
    block(
      data,
      'DELETE financial expense',
      'DELETE',
      '/api/v1/cashflows/{cashflowId}/financial/expense',
      200,
      'cashflows_finances_suite_del_exp_ms',
      'cashflows_finances_suite_del_exp_errors',
      'cashflows_finances_suite_del_exp_success',
      bdelExp.defs,
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
    screenName: 'cashflows-finances',
    screenRoute: '/cashflows/{cashflowId}/finances',
    portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/finances',
    generatedAt: new Date().toISOString(),
    testDurationMs: durationMs,
    totalVUs: vusMax,
    concurrentScenarios: 8,
    vusPerScenario: SUITE_VUS,
    overallSuccessRate: total > 0 ? okSum / total : null,
    apis,
  };

  const out = {
    'k6/cashflows-finances/reports/cashflows-finances-load-report.json': JSON.stringify(report, null, 2),
  };
  return attachSuitePerfSlice(out, data, 'finances', 'k6-cashflows-finances-suite-load', apis);
}
