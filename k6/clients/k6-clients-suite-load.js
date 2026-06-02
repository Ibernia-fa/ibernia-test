/**
 * **Combined** load for **`https://dev.ibernia.it/clients`** — parallel **`constant-vus`** scenarios covering
 * list/search/create/delete APIs. **Merged** JSON report: **`k6/clients/reports/clients-load-report.json`**.
 *
 * **`VUS`** (default **8**) = VUs **per scenario** (six scenarios ⇒ up to **48** concurrent VUs).
 *
 * **APIs (Ibernia.Api `ClientsController`):** GET `/Clients/{advisorId}/all`, GET `/Clients/{id}`, GET `/Clients/{advisorId}/search`,
 * POST `/Clients` (no partner), POST `/Clients` (with partner), DELETE `/Clients/{id}`.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients/k6-clients-suite-load.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { attachSuitePerfSlice } from '../../lib/k6-suite-perf-summary.js';
import {
  buildClientModel,
  parseClientCreateResponse,
} from '../../lib/k6-client-lifecycle.js';
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';
import {
  API_BASE,
  abortTest,
  assertApiBase,
  assertDevIdentityHost,
  apiHeaders,
  collectErrorBucketBreakdown,
  createHttpAccepted,
  createHttpErrorBuckets,
  DURATION,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  isClientProfileModuleNotActive402,
  loginAdvisorFromRow0,
  logHttpError,
  metricCount,
  metricValuesForTrend,
  readFirstLifecycleUserAtInit,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  THINK_SEC,
} from './common-clients-screen.js';

const SUITE_TAG = 'k6-clients-suite-load';
const SUITE_PREFIX = 'k6clscr';

assertDevIdentityHost(IDENTITY_BASE, SUITE_TAG);
assertApiBase(API_BASE, SUITE_TAG);
const LIFECYCLE_ROW0 = readFirstLifecycleUserAtInit(SUITE_TAG);

const SUITE_VUS = Math.max(1, parseInt((__ENV.VUS || '8').trim(), 10) || 8);
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
const relaxClientProfileModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CLIENT_PROFILE_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxClientProfileModule;

const dur_get_all = new Trend('clients_suite_get_all_ms');
const err_get_all = new Counter('clients_suite_get_all_errors');
const ok_get_all = new Counter('clients_suite_get_all_success');
const bGetAll = createHttpErrorBuckets('clients_suite_get_all_err');

const dur_get_id = new Trend('clients_suite_get_id_ms');
const err_get_id = new Counter('clients_suite_get_id_errors');
const ok_get_id = new Counter('clients_suite_get_id_success');
const bGetId = createHttpErrorBuckets('clients_suite_get_id_err');

const dur_post_np = new Trend('clients_suite_post_np_ms');
const err_post_np = new Counter('clients_suite_post_np_errors');
const ok_post_np = new Counter('clients_suite_post_np_success');
const bPostNp = createHttpErrorBuckets('clients_suite_post_np_err');

const dur_post_wp = new Trend('clients_suite_post_wp_ms');
const err_post_wp = new Counter('clients_suite_post_wp_errors');
const ok_post_wp = new Counter('clients_suite_post_wp_success');
const bPostWp = createHttpErrorBuckets('clients_suite_post_wp_err');

const dur_search = new Trend('clients_suite_search_ms');
const err_search = new Counter('clients_suite_search_errors');
const ok_search = new Counter('clients_suite_search_success');
const bSearch = createHttpErrorBuckets('clients_suite_search_err');

const dur_delete = new Trend('clients_suite_delete_ms');
const err_delete = new Counter('clients_suite_delete_errors');
const ok_delete = new Counter('clients_suite_delete_success');
const bDelete = createHttpErrorBuckets('clients_suite_delete_err');

export const options = {
  scenarios: {
    s_get_all: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suiteGetAll',
      startTime: scenarioStart(0),
    },
    s_get_by_id: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suiteGetById',
      startTime: scenarioStart(1),
    },
    s_post_np: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suitePostNoPartner',
      startTime: scenarioStart(2),
    },
    s_post_wp: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suitePostWithPartner',
      startTime: scenarioStart(3),
    },
    s_search: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suiteSearch',
      startTime: scenarioStart(4),
    },
    s_delete: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: DURATION,
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'suiteDelete',
      startTime: scenarioStart(5),
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.8'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.15'] }),
  },
};

function hdrJson(data) {
  return apiHeaders(data.token);
}

export function setup() {
  const runTag = `r${Date.now()}`;
  const ctx = loginAdvisorFromRow0(SUITE_TAG, LIFECYCLE_ROW0);
  if (!ctx) abortTest(SUITE_TAG, 'setup: login failed row 0.');
  const hdrs = apiHeaders(ctx.accessToken);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${SUITE_PREFIX}${runTag}seed`;
  const clientEmail = `suite.clients.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const res = http.post(`${API_BASE}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_suite_setup_post' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: clientId } = parseClientCreateResponse(res);
  if (isClientProfileModuleNotActive402(res)) {
    abortTest(SUITE_TAG, 'setup: 402 client_profile. Enable module.');
  }
  if (!createHttpAccepted(res.status, clientId) || !clientId) {
    abortTest(SUITE_TAG, `setup: POST seed failed HTTP ${res.status}`);
  }
  const verify = http.get(`${API_BASE}/api/v1/Clients/${encodeURIComponent(clientId)}`, {
    headers: hdrs,
    tags: { name: 'clients_suite_setup_verify' },
    timeout: HTTP_TIMEOUT,
  });
  if (verify.status !== 200) {
    http.del(`${API_BASE}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'clients_suite_setup_cleanup' },
      timeout: HTTP_TIMEOUT,
    });
    abortTest(SUITE_TAG, `setup: GET verify failed HTTP ${verify.status}`);
  }
  console.log(
    `[${SUITE_TAG}] runTag=${runTag} | VUs/scenario=${SUITE_VUS} | shared clientId=${clientId} | DURATION=${DURATION}`,
  );
  return {
    base: API_BASE,
    runTag,
    token: ctx.accessToken,
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
    clientId,
  };
}

export function teardown(data) {
  if (!data || !data.token || !data.runTag || !data.advisorSub) return;
  deleteClientsAndPlansByLastNameNeedle(
    data.base || API_BASE,
    apiHeaders(data.token),
    data.advisorSub,
    `${SUITE_PREFIX}${data.runTag}`,
    HTTP_TIMEOUT,
    {
      list: 'clients_suite_teardown_list',
      cfList: 'clients_suite_teardown_cf_list',
      delCf: 'clients_suite_teardown_del_cf',
      delClient: 'clients_suite_teardown_del_client',
    },
  );
  try {
    delete globalThis.__k6ClientsSuiteSearchSeed;
  } catch {
    /* ignore */
  }
}

export function suiteGetAll(data) {
  const url = `${data.base}/api/v1/Clients/${encodeURIComponent(data.advisorSub)}/all`;
  const res = http.get(url, {
    headers: hdrJson(data),
    tags: { name: 'clients_suite_get_all', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_all,
    err_get_all,
    ok_get_all,
    res,
    200,
    `${SUITE_TAG} GET /Clients/{advisorId}/all`,
    bGetAll.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function suiteGetById(data) {
  const url = `${data.base}/api/v1/Clients/${encodeURIComponent(data.clientId)}`;
  const res = http.get(url, {
    headers: hdrJson(data),
    tags: { name: 'clients_suite_get_by_id', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_id,
    err_get_id,
    ok_get_id,
    res,
    200,
    `${SUITE_TAG} GET /Clients/{id}`,
    bGetId.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function suitePostNoPartner(data) {
  const hdrs = hdrJson(data);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${SUITE_PREFIX}${data.runTag}npvu${__VU}i${__ITER}`;
  const body = buildClientModel({
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail: `suite.np.${uniqueTag}.${Date.now()}@${domain}`,
  });
  const res = http.post(`${data.base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_suite_post_np', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_post_np,
    err_post_np,
    ok_post_np,
    res,
    201,
    `${SUITE_TAG} POST /Clients (no partner)`,
    bPostNp.buckets,
    [200, 201],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function suitePostWithPartner(data) {
  const hdrs = hdrJson(data);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${SUITE_PREFIX}${data.runTag}wpvu${__VU}i${__ITER}`;
  const body = buildClientModel({
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    uniqueTag,
    withPartner: true,
    clientEmail: `suite.wp.${uniqueTag}.${Date.now()}@${domain}`,
  });
  const res = http.post(`${data.base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_suite_post_wp', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_post_wp,
    err_post_wp,
    ok_post_wp,
    res,
    201,
    `${SUITE_TAG} POST /Clients (with partner)`,
    bPostWp.buckets,
    [200, 201],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

function searchStore() {
  if (!globalThis.__k6ClientsSuiteSearchSeed) {
    globalThis.__k6ClientsSuiteSearchSeed = {};
  }
  return globalThis.__k6ClientsSuiteSearchSeed;
}

function searchContains(res, clientId) {
  if (res.status !== 200) return false;
  try {
    const arr = res.json();
    if (!Array.isArray(arr)) return false;
    const want = String(clientId).trim();
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      const id = x && (x.Id != null ? x.Id : x.id);
      if (id != null && String(id).trim() === want) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function searchUrl(base, advisorSub, term) {
  const q = encodeURIComponent(term);
  return `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/search?searchTerm=${q}`;
}

export function suiteSearch(data) {
  const base = data.base;
  const hdrs = hdrJson(data);
  const store = searchStore();
  let st = store[__VU];
  if (!st) {
    const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
    const term = `${SUITE_PREFIX}${data.runTag}srchvu${__VU}`;
    const body = buildClientModel({
      advisorSub: data.advisorSub,
      advisorName: data.advisorName,
      uniqueTag: term,
      withPartner: false,
      clientEmail: `suite.srch.${term}.${Date.now()}@${domain}`,
    });
    const resP = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
      headers: hdrs,
      tags: { name: 'clients_suite_search_seed', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const { id } = parseClientCreateResponse(resP);
    if (!createHttpAccepted(resP.status, id) || !id) {
      err_search.add(1);
      recordErrorInStatusBuckets(bSearch.buckets, resP.status != null ? resP.status : 'other');
      logHttpError(`${SUITE_TAG} search seed POST`, resP);
      return;
    }
    const v = http.get(searchUrl(base, data.advisorSub, term), {
      headers: hdrs,
      tags: { name: 'clients_suite_search_seed_verify', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    if (!(v.status === 200 && searchContains(v, id))) {
      err_search.add(1);
      recordErrorInStatusBuckets(bSearch.buckets, v.status != null ? v.status : 'other');
      logHttpError(`${SUITE_TAG} search seed verify`, v);
      http.del(`${base}/api/v1/Clients/${encodeURIComponent(id)}`, null, {
        headers: hdrs,
        tags: { name: 'clients_suite_search_seed_cleanup', vu: String(__VU) },
        timeout: HTTP_TIMEOUT,
      });
      return;
    }
    st = { term, id };
    store[__VU] = st;
  }
  const res = http.get(searchUrl(base, data.advisorSub, st.term), {
    headers: hdrs,
    tags: { name: 'clients_suite_search', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_search,
    err_search,
    ok_search,
    res,
    200,
    `${SUITE_TAG} GET /Clients/{advisorId}/search`,
    bSearch.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function suiteDelete(data) {
  const hdrs = hdrJson(data);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${SUITE_PREFIX}${data.runTag}delvu${__VU}i${__ITER}`;
  const body = buildClientModel({
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail: `suite.del.${uniqueTag}.${Date.now()}@${domain}`,
  });
  const resP = http.post(`${data.base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_suite_delete_prefetch', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const { id } = parseClientCreateResponse(resP);
  if (!createHttpAccepted(resP.status, id) || !id) {
    err_delete.add(1);
    recordErrorInStatusBuckets(bDelete.buckets, resP.status != null ? resP.status : 'other');
    logHttpError(`${SUITE_TAG} delete prefetch POST`, resP);
    return;
  }
  const resD = http.del(`${data.base}/api/v1/Clients/${encodeURIComponent(id)}`, null, {
    headers: hdrs,
    tags: { name: 'clients_suite_delete', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_delete,
    err_delete,
    ok_delete,
    resD,
    200,
    `${SUITE_TAG} DELETE /Clients/{id}`,
    bDelete.buckets,
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
      'GET /api/v1/Clients/{advisorId}/all',
      'GET',
      '/api/v1/Clients/{advisorId}/all',
      200,
      'clients_suite_get_all_ms',
      'clients_suite_get_all_errors',
      'clients_suite_get_all_success',
      bGetAll.defs,
    ),
    apiBlock(
      data,
      'GET /api/v1/Clients/{id}',
      'GET',
      '/api/v1/Clients/{id}',
      200,
      'clients_suite_get_id_ms',
      'clients_suite_get_id_errors',
      'clients_suite_get_id_success',
      bGetId.defs,
    ),
    apiBlock(
      data,
      'POST /api/v1/Clients (no partner)',
      'POST',
      '/api/v1/Clients',
      '200 or 201',
      'clients_suite_post_np_ms',
      'clients_suite_post_np_errors',
      'clients_suite_post_np_success',
      bPostNp.defs,
    ),
    apiBlock(
      data,
      'POST /api/v1/Clients (with partner)',
      'POST',
      '/api/v1/Clients',
      '200 or 201',
      'clients_suite_post_wp_ms',
      'clients_suite_post_wp_errors',
      'clients_suite_post_wp_success',
      bPostWp.defs,
    ),
    apiBlock(
      data,
      'GET /api/v1/Clients/{advisorId}/search',
      'GET',
      '/api/v1/Clients/{advisorId}/search',
      200,
      'clients_suite_search_ms',
      'clients_suite_search_errors',
      'clients_suite_search_success',
      bSearch.defs,
    ),
    apiBlock(
      data,
      'DELETE /api/v1/Clients/{id}',
      'DELETE',
      '/api/v1/Clients/{id}',
      '200 or 204',
      'clients_suite_delete_ms',
      'clients_suite_delete_errors',
      'clients_suite_delete_success',
      bDelete.defs,
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
    screenName: 'clients',
    screenRoute: '/clients',
    portalUrlExample: 'https://dev.ibernia.it/clients',
    generatedAt: new Date().toISOString(),
    testDurationMs: durationMs,
    totalVUs: vusMax,
    concurrentScenarios: 6,
    vusPerScenario: SUITE_VUS,
    overallSuccessRate: total > 0 ? okSum / total : null,
    apis,
  };

  const out = {
    'k6/clients/reports/clients-load-report.json': JSON.stringify(report, null, 2),
  };
  return attachSuitePerfSlice(out, data, 'clients', 'k6-clients-suite-load', apis);
}
