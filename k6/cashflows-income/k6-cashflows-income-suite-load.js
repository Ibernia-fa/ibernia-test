/**
 * **Combined** load test for **`/cashflows/{id}/income`** screen APIs — **six parallel scenarios** (constant VUs each), one shared plan (seed in **`setup()`**), merged JSON report.
 *
 * **APIs:** GET cashflow, GET financial, GET income-expense/financial, POST/PUT/DELETE financial/income (write scenarios create unique lines and clean up).
 *
 * **Report:** **`k6/cashflows-income/reports/cashflows-income-load-report.json`** (all endpoints + overall stats).
 *
 * **`VUS`** (default **20**) = VUs **per scenario**; six scenarios ⇒ up to **6 × VUS** total VUs concurrently.
 * One **shared** seeded cashflow ⇒ many parallel **writes**; the API may return **HTTP 500** (generic body) under **Mongo / document contention**. Ease with **`-e VUS=5`**, **`-e SUITE_WRITE_JITTER_MS=300`**, or **`SHARED_CASHFLOW_ID`** per isolated plan.
 *
 * Optional **`-e SHARED_CASHFLOW_ID=...`** skips seed (uses lifecycle row **0** token + **`VUS`** per scenario).
 *
 * **Windows PowerShell:** do **not** use bash-style `\` line breaks — PowerShell then runs `-e ...` as separate commands
 * (**`-e` is not recognized**) and **`SIGNUP_ROPC_CLIENT_SECRET` is missing**, which shows as **`invalid_client` / missing secret**.
 * Use **one line**, or continue lines with a **backtick** `` ` `` as the **last** character on each continued line (no spaces after it).
 * Keep the **whole secret on one physical line**; a wrapped secret is truncated and login fails.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/cashflows-income/k6-cashflows-income-suite-load.js -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * # Multiline example (backtick at end of each line except the last):
 * # k6 run k6/cashflows-income/k6-cashflows-income-suite-load.js `
 * #   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 * #   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" `
 * #   -e VUS=20
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
  buildMinimalIncomeLineItem,
  buildMinimalIncomeLineItemFromIeRow,
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  DURATION,
  findLastIncomeRowById,
  findLastIncomeRowMatchingAnySubstring,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  incomeRowWithUpdatedAmount,
  normalizeIncomeLineCloneForPutApi,
  readAllLifecycleUsersAtInit,
  resolveIncomeLineAfterPost,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  seedCashflowForVu,
  SHARED_CASHFLOW_ID,
  sharedCashflowContext,
  teardownByNeedle,
  THINK_SEC,
  metricValuesForTrend,
  metricCount,
  deleteGlobalSeed,
} from './common-income-screen.js';

const SUITE_TAG = 'k6-cashflows-income-suite-load';
const SUITE_SEED_KEY = '__k6CfIncomeSuiteSeed';

assertDevIdentityHost(IDENTITY_BASE, SUITE_TAG);
assertApiBase(API_BASE, SUITE_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SUITE_TAG);

const SUITE_VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SUITE_PUT_5XX_RETRIES = Math.max(0, parseInt((__ENV.SUITE_PUT_5XX_RETRIES || '6').trim(), 10) || 6);
/** Random 0…N ms sleep at start of **`putIncome`** to reduce Mongo / document write collisions on one shared cashflow. */
const SUITE_WRITE_JITTER_MS = Math.max(0, parseInt((__ENV.SUITE_WRITE_JITTER_MS || '150').trim(), 10) || 0);
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur_get_cf = new Trend('cashflows_income_suite_get_cf_ms');
const err_get_cf = new Counter('cashflows_income_suite_get_cf_errors');
const ok_get_cf = new Counter('cashflows_income_suite_get_cf_success');

const dur_get_fin = new Trend('cashflows_income_suite_get_fin_ms');
const err_get_fin = new Counter('cashflows_income_suite_get_fin_errors');
const ok_get_fin = new Counter('cashflows_income_suite_get_fin_success');

const dur_get_ief = new Trend('cashflows_income_suite_get_ief_ms');
const err_get_ief = new Counter('cashflows_income_suite_get_ief_errors');
const ok_get_ief = new Counter('cashflows_income_suite_get_ief_success');

const dur_post = new Trend('cashflows_income_suite_post_ms');
const err_post = new Counter('cashflows_income_suite_post_errors');
const ok_post = new Counter('cashflows_income_suite_post_success');

const dur_put = new Trend('cashflows_income_suite_put_ms');
const err_put = new Counter('cashflows_income_suite_put_errors');
const ok_put = new Counter('cashflows_income_suite_put_success');

const dur_del = new Trend('cashflows_income_suite_del_ms');
const err_del = new Counter('cashflows_income_suite_del_errors');
const ok_del = new Counter('cashflows_income_suite_del_success');

const suiteBucketsCf = createHttpErrorBuckets('cashflows_income_suite_get_cf_err');
const suiteBucketsFin = createHttpErrorBuckets('cashflows_income_suite_get_fin_err');
const suiteBucketsIef = createHttpErrorBuckets('cashflows_income_suite_get_ief_err');
const suiteBucketsPost = createHttpErrorBuckets('cashflows_income_suite_post_err');
const suiteBucketsPut = createHttpErrorBuckets('cashflows_income_suite_put_err', {
  lineResolve: true,
  prefetch: true,
});
const suiteBucketsDel = createHttpErrorBuckets('cashflows_income_suite_del_err', { lineResolve: true });

export const options = {
  scenarios: {
    s_get_cashflow: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: '5s',
      exec: 'getCashflow',
      startTime: '0s',
    },
    s_get_financial: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: '5s',
      exec: 'getFinancial',
      startTime: '0s',
    },
    s_get_ie_financial: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: '5s',
      exec: 'getIeFinancial',
      startTime: '0s',
    },
    s_post_income: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: '5s',
      exec: 'postIncome',
      startTime: '0s',
    },
    s_put_income: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: '5s',
      exec: 'putIncome',
      startTime: '0s',
    },
    s_delete_income: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: '5s',
      exec: 'deleteIncome',
      startTime: '0s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.85'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.1'] }),
  },
};

export function setup() {
  const runTag = `suite${Date.now()}`;
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
    tags: { name: 'cashflows_income_suite_get_cf', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_cf,
    err_get_cf,
    ok_get_cf,
    res,
    200,
    `${SUITE_TAG} GET cashflow`,
    suiteBucketsCf.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function getFinancial(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'cashflows_income_suite_get_fin', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_fin,
    err_get_fin,
    ok_get_fin,
    res,
    200,
    `${SUITE_TAG} GET financial`,
    suiteBucketsFin.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function getIeFinancial(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(
    data.cashflowId,
  )}/income-expense/financial`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'cashflows_income_suite_get_ief', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_ief,
    err_get_ief,
    ok_get_ief,
    res,
    200,
    `${SUITE_TAG} GET income-expense/financial`,
    suiteBucketsIef.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

function cleanupLine(data, hdrs, needle, stablePrefix) {
  const matchers = [needle, stablePrefix].filter((x) => x && String(x).trim());
  const getUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(
    data.cashflowId,
  )}/income-expense/financial`;
  for (let a = 0; a < 6; a++) {
    sleep(0.03 + a * 0.025);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_income_suite_cleanup_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const full = findLastIncomeRowMatchingAnySubstring(g, matchers);
    if (full) {
      http.del(
        `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`,
        JSON.stringify(full),
        {
          headers: hdrs,
          tags: { name: 'cashflows_income_suite_cleanup_del', vu: String(__VU) },
          timeout: HTTP_TIMEOUT,
        },
      );
      return;
    }
  }
}

export function postIncome(data) {
  const hdrs = apiHeaders(data.token);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Income suite post', data.runTag, __VU, __ITER);
  const body = buildMinimalIncomeLineItem({ description: descFull, amount: 500 + (__VU % 20) });
  const url = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`;
  const res = http.post(url, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_income_suite_post', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const ok = recordOutcomeWithBuckets(
    dur_post,
    err_post,
    ok_post,
    res,
    200,
    `${SUITE_TAG} POST income`,
    suiteBucketsPost.buckets,
  );
  if (ok) cleanupLine(data, hdrs, descFull, stablePrefix);
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function putIncome(data) {
  const hdrs = apiHeaders(data.token);
  if (SUITE_WRITE_JITTER_MS > 0) {
    sleep((Math.random() * SUITE_WRITE_JITTER_MS) / 1000);
  }
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Income suite update', data.runTag, __VU, __ITER);
  const postUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`;
  const postRes = http.post(
    postUrl,
    JSON.stringify(buildMinimalIncomeLineItem({ description: descFull, amount: 400 })),
    {
      headers: hdrs,
      tags: { name: 'cashflows_income_suite_put_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur_put,
      err_put,
      ok_put,
      postRes,
      200,
      `${SUITE_TAG} PUT-scenario POST seed`,
      suiteBucketsPut.buckets,
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
    tagName: 'cashflows_income_suite_put_getid',
  });
  if (!resolved) {
    err_put.add(1);
    recordErrorInStatusBuckets(suiteBucketsPut.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }

  const getIeUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(
    data.cashflowId,
  )}/income-expense/financial`;
  const matchers = [descFull, stablePrefix].filter((x) => x && String(x).trim());

  let serverRow =
    resolved.fullRow ||
    findLastIncomeRowById(postRes, resolved.id) ||
    findLastIncomeRowMatchingAnySubstring(postRes, matchers);

  sleep(0.02 + (__VU % 12) * 0.012);
  for (let attempt = 0; attempt < 14 && !serverRow; attempt++) {
    sleep(0.04 + attempt * 0.028);
    const g = http.get(getIeUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_income_suite_put_prefetch', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    serverRow =
      findLastIncomeRowById(g, resolved.id) ||
      findLastIncomeRowMatchingAnySubstring(g, matchers);
  }

  if (!serverRow) {
    err_put.add(1);
    recordErrorInStatusBuckets(suiteBucketsPut.buckets, 'prefetch');
    console.error(
      `[${SUITE_TAG}] PUT prefetch: no income row vu${__VU} id=${resolved.id} prefix=${stablePrefix}`,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }

  sleep(0.018 + (__VU % 8) * 0.004);
  const gPrePut = http.get(getIeUrl, {
    headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
    tags: { name: 'cashflows_income_suite_put_preput_refresh', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const refreshed =
    findLastIncomeRowById(gPrePut, resolved.id) ||
    findLastIncomeRowMatchingAnySubstring(gPrePut, matchers);
  if (refreshed) {
    serverRow = refreshed;
  }

  const newAmt = 880 + (__VU % 7);
  let putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(serverRow, newAmt));
  let putRes = http.put(postUrl, JSON.stringify(putBody), {
    headers: hdrs,
    tags: { name: 'cashflows_income_suite_put', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });

  for (let r = 0; r < SUITE_PUT_5XX_RETRIES && putRes.status >= 500; r++) {
    sleep(0.07 * (r + 1));
    const g3 = http.get(getIeUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_income_suite_put_retry_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const row3 =
      findLastIncomeRowById(g3, resolved.id) || findLastIncomeRowMatchingAnySubstring(g3, matchers);
    if (!row3) break;
    putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(row3, newAmt));
    putRes = http.put(postUrl, JSON.stringify(putBody), {
      headers: hdrs,
      tags: { name: 'cashflows_income_suite_put_retry', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
  }

  if (putRes.status >= 500) {
    sleep(0.08);
    const gMin = http.get(getIeUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_income_suite_put_fallback_get', vu: String(__VU) },
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
        tags: { name: 'cashflows_income_suite_put_minimal_fallback', vu: String(__VU) },
        timeout: HTTP_TIMEOUT,
      });
    }
  }

  const ok = recordOutcomeWithBuckets(
    dur_put,
    err_put,
    ok_put,
    putRes,
    200,
    `${SUITE_TAG} PUT income`,
    suiteBucketsPut.buckets,
  );
  if (ok) cleanupLine(data, hdrs, descFull, stablePrefix);
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function deleteIncome(data) {
  const hdrs = apiHeaders(data.token);
  const { stablePrefix, descFull } = buildLoadTestLineNeedles('Income suite delete', data.runTag, __VU, __ITER);
  const postUrl = `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`;
  const postRes = http.post(
    postUrl,
    JSON.stringify(buildMinimalIncomeLineItem({ description: descFull, amount: 350 })),
    {
      headers: hdrs,
      tags: { name: 'cashflows_income_suite_del_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur_del,
      err_del,
      ok_del,
      postRes,
      200,
      `${SUITE_TAG} DELETE-scenario POST seed`,
      suiteBucketsDel.buckets,
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
    tagName: 'cashflows_income_suite_del_getid',
  });
  if (!resolved) {
    err_del.add(1);
    recordErrorInStatusBuckets(suiteBucketsDel.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }

  const getIeUrlDel = `${data.base}/api/v1/cashflows/${encodeURIComponent(
    data.cashflowId,
  )}/income-expense/financial`;
  const delMatchers = [descFull, stablePrefix].filter((x) => x && String(x).trim());

  let delRow =
    resolved.fullRow ||
    findLastIncomeRowById(postRes, resolved.id) ||
    findLastIncomeRowMatchingAnySubstring(postRes, delMatchers);

  sleep(0.015 + (__VU % 10) * 0.01);
  for (let attempt = 0; attempt < 12 && !delRow; attempt++) {
    sleep(0.035 + attempt * 0.025);
    const gDel = http.get(getIeUrlDel, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cashflows_income_suite_del_prefetch', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    delRow =
      findLastIncomeRowById(gDel, resolved.id) ||
      findLastIncomeRowMatchingAnySubstring(gDel, delMatchers);
  }

  if (!delRow) {
    delRow = buildMinimalIncomeLineItem({
      id: resolved.id,
      description: resolved.description,
    });
  }

  const delRes = http.del(
    `${data.base}/api/v1/cashflows/${encodeURIComponent(data.cashflowId)}/financial/income`,
    JSON.stringify(delRow),
    {
      headers: hdrs,
      tags: { name: 'cashflows_income_suite_del', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    },
  );
  recordOutcomeWithBuckets(
    dur_del,
    err_del,
    ok_del,
    delRes,
    200,
    `${SUITE_TAG} DELETE income`,
    suiteBucketsDel.buckets,
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
            lines.push(
              'Error breakdown: (no bucket counters — failures did not increment **createHttpErrorBuckets** metrics).',
            );
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
      'cashflows_income_suite_get_cf_ms',
      'cashflows_income_suite_get_cf_errors',
      'cashflows_income_suite_get_cf_success',
      suiteBucketsCf.defs,
    ),
    block(
      data,
      'GET financial',
      'GET',
      '/api/v1/cashflows/{cashflowId}/financial',
      200,
      'cashflows_income_suite_get_fin_ms',
      'cashflows_income_suite_get_fin_errors',
      'cashflows_income_suite_get_fin_success',
      suiteBucketsFin.defs,
    ),
    block(
      data,
      'GET income-expense financial',
      'GET',
      '/api/v1/cashflows/{cashflowId}/income-expense/financial',
      200,
      'cashflows_income_suite_get_ief_ms',
      'cashflows_income_suite_get_ief_errors',
      'cashflows_income_suite_get_ief_success',
      suiteBucketsIef.defs,
    ),
    block(
      data,
      'POST financial income',
      'POST',
      '/api/v1/cashflows/{cashflowId}/financial/income',
      200,
      'cashflows_income_suite_post_ms',
      'cashflows_income_suite_post_errors',
      'cashflows_income_suite_post_success',
      suiteBucketsPost.defs,
    ),
    block(
      data,
      'PUT financial income',
      'PUT',
      '/api/v1/cashflows/{cashflowId}/financial/income',
      200,
      'cashflows_income_suite_put_ms',
      'cashflows_income_suite_put_errors',
      'cashflows_income_suite_put_success',
      suiteBucketsPut.defs,
    ),
    block(
      data,
      'DELETE financial income',
      'DELETE',
      '/api/v1/cashflows/{cashflowId}/financial/income',
      200,
      'cashflows_income_suite_del_ms',
      'cashflows_income_suite_del_errors',
      'cashflows_income_suite_del_success',
      suiteBucketsDel.defs,
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
    screenName: 'cashflows-income',
    screenRoute: '/cashflows/{cashflowId}/income',
    portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/income',
    generatedAt: new Date().toISOString(),
    testDurationMs: durationMs,
    totalVUs: vusMax,
    concurrentScenarios: 6,
    vusPerScenario: SUITE_VUS,
    overallSuccessRate: total > 0 ? okSum / total : null,
    apis,
  };

  const out = {
    'k6/cashflows-income/reports/cashflows-income-load-report.json': JSON.stringify(report, null, 2),
  };
  return attachSuitePerfSlice(out, data, 'income', 'k6-cashflows-income-suite-load', apis);
}
