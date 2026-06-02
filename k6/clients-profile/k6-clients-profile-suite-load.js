/**
 * **Combined** load for **`/clients/{clientId}/profile`** — **four** parallel `constant-vus` scenarios,
 * **one** seeded client in **`setup()`**, merged JSON report.
 *
 * **APIs:** GET `/api/v1/Clients/{id}`, GET `/api/v1/client/{clientId}/cashflows`, GET `/api/v1/Clients/{advisorId}/all`, PUT `/api/v1/Clients`.
 *
 * **Report:** `k6/clients-profile/reports/clients-profile-load-report.json`
 *
 * **`VUS`** (default **20**) = VUs **per scenario** → up to **4 × VUS** concurrent VUs.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients-profile/k6-clients-profile-suite-load.js `
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
  createHttpErrorBuckets,
  createHttpAccepted,
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
} from './common-clients-profile-screen.js';

const SUITE_TAG = 'k6-clients-profile-suite-load';
const SUITE_NEEDLE_PREFIX = 'k6profsuite';

assertDevIdentityHost(IDENTITY_BASE, SUITE_TAG);
assertApiBase(API_BASE, SUITE_TAG);
const LIFECYCLE_ROW0 = readFirstLifecycleUserAtInit(SUITE_TAG);

const SUITE_VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10) || 100);
const SUITE_PUT_JITTER_MS = Math.max(0, parseInt((__ENV.SUITE_PUT_JITTER_MS || '120').trim(), 10) || 0);
const SUITE_SCENARIO_STAGGER_MS = Math.max(
  0,
  parseInt((__ENV.SUITE_SCENARIO_STAGGER_MS || '80').trim(), 10) || 0,
);
const SUITE_GRACEFUL_STOP = (__ENV.SUITE_GRACEFUL_STOP || '8s').trim() || '8s';

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

const dur_get_client = new Trend('clients_profile_suite_get_client_ms');
const err_get_client = new Counter('clients_profile_suite_get_client_errors');
const ok_get_client = new Counter('clients_profile_suite_get_client_success');
const bGetClient = createHttpErrorBuckets('clients_profile_suite_get_client_err');

const dur_get_cf = new Trend('clients_profile_suite_get_cf_ms');
const err_get_cf = new Counter('clients_profile_suite_get_cf_errors');
const ok_get_cf = new Counter('clients_profile_suite_get_cf_success');
const bGetCf = createHttpErrorBuckets('clients_profile_suite_get_cf_err');

const dur_get_all = new Trend('clients_profile_suite_get_all_ms');
const err_get_all = new Counter('clients_profile_suite_get_all_errors');
const ok_get_all = new Counter('clients_profile_suite_get_all_success');
const bGetAll = createHttpErrorBuckets('clients_profile_suite_get_all_err');

const dur_put = new Trend('clients_profile_suite_put_ms');
const err_put = new Counter('clients_profile_suite_put_errors');
const ok_put = new Counter('clients_profile_suite_put_success');
const bPut = createHttpErrorBuckets('clients_profile_suite_put_err');

export const options = {
  scenarios: {
    s_get_client: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: (__ENV.DURATION || '20s').trim(),
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'getClient',
      startTime: scenarioStart(0),
    },
    s_get_cashflows: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: (__ENV.DURATION || '20s').trim(),
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'getCashflows',
      startTime: scenarioStart(1),
    },
    s_get_all: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: (__ENV.DURATION || '20s').trim(),
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'getAdvisorClientsAll',
      startTime: scenarioStart(2),
    },
    s_put_client: {
      executor: 'constant-vus',
      vus: SUITE_VUS,
      duration: (__ENV.DURATION || '20s').trim(),
      gracefulStop: SUITE_GRACEFUL_STOP,
      exec: 'putClient',
      startTime: scenarioStart(3),
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.82'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.12'] }),
  },
};

function hdrAuth(data) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${data.token}`,
  };
}

export function setup() {
  const runTag = `r${Date.now()}`;
  const ctx = loginAdvisorFromRow0(SUITE_TAG, LIFECYCLE_ROW0);
  if (!ctx) abortTest(SUITE_TAG, 'setup: login failed row 0.');
  const hdrs = apiHeaders(ctx.accessToken);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${SUITE_NEEDLE_PREFIX}${runTag}`;
  const clientEmail = `loadtest.profile.suite.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const res = http.post(`${API_BASE}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_profile_suite_seed_post' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: clientId } = parseClientCreateResponse(res);
  if (isClientProfileModuleNotActive402(res)) {
    abortTest(SUITE_TAG, 'setup: 402 client_profile. Enable module.');
  }
  if (!createHttpAccepted(res.status, clientId) || !clientId) {
    abortTest(SUITE_TAG, `setup: POST /Clients failed HTTP ${res.status}`);
  }
  const verify = http.get(`${API_BASE}/api/v1/Clients/${encodeURIComponent(clientId)}`, {
    headers: hdrs,
    tags: { name: 'clients_profile_suite_seed_verify' },
    timeout: HTTP_TIMEOUT,
  });
  if (verify.status !== 200) {
    http.del(`${API_BASE}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'clients_profile_suite_seed_cleanup' },
      timeout: HTTP_TIMEOUT,
    });
    abortTest(SUITE_TAG, `setup: GET verify failed HTTP ${verify.status}`);
  }
  console.log(
    `[${SUITE_TAG}] seeded clientId=${clientId} | runTag=${runTag} | VUs per scenario=${SUITE_VUS} | DURATION=${(__ENV.DURATION || '20s').trim()}`,
  );
  return {
    base: API_BASE,
    runTag,
    token: ctx.accessToken,
    advisorSub: ctx.advisorSub,
    clientId,
  };
}

export function teardown(data) {
  if (!data || !data.token || !data.runTag || !data.advisorSub) return;
  const hdrs = apiHeaders(data.token);
  deleteClientsAndPlansByLastNameNeedle(
    data.base || API_BASE,
    hdrs,
    data.advisorSub,
    `${SUITE_NEEDLE_PREFIX}${data.runTag}`,
    HTTP_TIMEOUT,
    {
      list: 'clients_profile_suite_teardown_list',
      cfList: 'clients_profile_suite_teardown_cf_list',
      delCf: 'clients_profile_suite_teardown_del_cf',
      delClient: 'clients_profile_suite_teardown_del_client',
    },
  );
}

export function getClient(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/Clients/${encodeURIComponent(data.clientId)}`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'clients_profile_suite_get_client', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_client,
    err_get_client,
    ok_get_client,
    res,
    200,
    `${SUITE_TAG} GET /Clients/{id}`,
    bGetClient.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function getCashflows(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/client/${encodeURIComponent(data.clientId)}/cashflows`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'clients_profile_suite_get_cf', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_get_cf,
    err_get_cf,
    ok_get_cf,
    res,
    200,
    `${SUITE_TAG} GET /client/{id}/cashflows`,
    bGetCf.buckets,
    [200, 204],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export function getAdvisorClientsAll(data) {
  const h = hdrAuth(data);
  const url = `${data.base}/api/v1/Clients/${encodeURIComponent(data.advisorSub)}/all`;
  const res = http.get(url, {
    headers: h,
    tags: { name: 'clients_profile_suite_get_all', vu: String(__VU) },
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

export function putClient(data) {
  if (SUITE_PUT_JITTER_MS > 0) {
    sleep((Math.random() * SUITE_PUT_JITTER_MS) / 1000);
  }
  const hdrs = apiHeaders(data.token);
  const getUrl = `${data.base}/api/v1/Clients/${encodeURIComponent(data.clientId)}`;
  const getRes = http.get(getUrl, {
    headers: hdrs,
    tags: { name: 'clients_profile_suite_put_prefetch', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  if (getRes.status !== 200) {
    err_put.add(1);
    recordErrorInStatusBuckets(bPut.buckets, getRes.status != null ? getRes.status : 'other');
    logHttpError(`${SUITE_TAG} PUT prefetch`, getRes);
    return;
  }
  let model;
  try {
    model = JSON.parse(String(getRes.body));
  } catch {
    err_put.add(1);
    recordErrorInStatusBuckets(bPut.buckets, 'other');
    logHttpError(`${SUITE_TAG} PUT parse body`, getRes);
    return;
  }
  const id = model.Id != null ? model.Id : model.id;
  if (id != null) model.Id = id;
  const stamp = `Suite ${data.runTag} vu${__VU} it${__ITER} ${Date.now()}`;
  const prev = model.Notes != null ? String(model.Notes) : '';
  model.Notes = `${prev ? `${prev} | ` : ''}${stamp}`.slice(0, 500);

  const putRes = http.put(`${data.base}/api/v1/Clients`, JSON.stringify(model), {
    headers: hdrs,
    tags: { name: 'clients_profile_suite_put', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur_put,
    err_put,
    ok_put,
    putRes,
    200,
    `${SUITE_TAG} PUT /Clients`,
    bPut.buckets,
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
      'GET /api/v1/Clients/{id}',
      'GET',
      '/api/v1/Clients/{id}',
      200,
      'clients_profile_suite_get_client_ms',
      'clients_profile_suite_get_client_errors',
      'clients_profile_suite_get_client_success',
      bGetClient.defs,
    ),
    apiBlock(
      data,
      'GET /api/v1/client/{clientId}/cashflows',
      'GET',
      '/api/v1/client/{clientId}/cashflows',
      '200 or 204',
      'clients_profile_suite_get_cf_ms',
      'clients_profile_suite_get_cf_errors',
      'clients_profile_suite_get_cf_success',
      bGetCf.defs,
    ),
    apiBlock(
      data,
      'GET /api/v1/Clients/{advisorId}/all',
      'GET',
      '/api/v1/Clients/{advisorId}/all',
      200,
      'clients_profile_suite_get_all_ms',
      'clients_profile_suite_get_all_errors',
      'clients_profile_suite_get_all_success',
      bGetAll.defs,
    ),
    apiBlock(
      data,
      'PUT /api/v1/Clients',
      'PUT',
      '/api/v1/Clients',
      200,
      'clients_profile_suite_put_ms',
      'clients_profile_suite_put_errors',
      'clients_profile_suite_put_success',
      bPut.defs,
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
    screenName: 'clients-profile',
    screenRoute: '/clients/{clientId}/profile',
    portalUrlExample: 'https://dev.ibernia.it/clients/69fd8f3c5d6294d8666f6ac2/profile',
    generatedAt: new Date().toISOString(),
    testDurationMs: durationMs,
    totalVUs: vusMax,
    concurrentScenarios: 4,
    vusPerScenario: SUITE_VUS,
    overallSuccessRate: total > 0 ? okSum / total : null,
    apis,
  };

  const out = {
    'k6/clients-profile/reports/clients-profile-load-report.json': JSON.stringify(report, null, 2),
  };
  return attachSuitePerfSlice(out, data, 'clients-profile', 'k6-clients-profile-suite-load', apis);
}
