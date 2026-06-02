/**
 * Load test **GET /api/v1/client/{clientId}/cashflows** — plans list used from **client profile** navigation.
 *
 * **Concurrency:** **`constant-vus`** — per-VU **POST /Clients** seed then repeated **GET**. Treats **200** (JSON list) and **204** (no plans) as success.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients-profile/k6-clients-profile-get-client-cashflows-load.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  API_BASE,
  abortTest,
  assertApiBase,
  assertDevIdentityHost,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeedKey,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  loginAdvisorFromRow0,
  readFirstLifecycleUserAtInit,
  recordOutcomeWithBuckets,
  seedProfileClientForVu,
  singleApiHandleSummaryFactory,
  teardownProfileClients,
  THINK_SEC,
  apiHeaders,
} from './common-clients-profile-screen.js';

const SCRIPT_TAG = 'k6-clients-profile-get-client-cashflows-load';
const NEEDLE_PREFIX = 'k6profcf';
const GLOBAL_SEED = '__k6ClientsProfileCfSeed';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_ROW0 = readFirstLifecycleUserAtInit(SCRIPT_TAG);

const VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10) || 100);
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxClientProfileModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CLIENT_PROFILE_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxClientProfileModule;

const dur = new Trend('clients_profile_get_client_cashflows_ms');
const errs = new Counter('clients_profile_get_client_cashflows_errors');
const oks = new Counter('clients_profile_get_client_cashflows_success');
const errBuckets = createHttpErrorBuckets('clients_profile_get_cf_err');

export const options = {
  scenarios: {
    clients_profile_get_cashflows: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.05'] }),
  },
};

export function setup() {
  const runTag = `r${Date.now()}`;
  const ctx = loginAdvisorFromRow0(SCRIPT_TAG, LIFECYCLE_ROW0);
  if (!ctx) abortTest(SCRIPT_TAG, 'setup: login failed row 0.');
  console.log(`[${SCRIPT_TAG}] runTag=${runTag} | VUS=${VUS} | DURATION=${DURATION}`);
  return {
    base: API_BASE,
    runTag,
    token: ctx.accessToken,
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
  };
}

export function teardown(data) {
  if (!data || !data.token || !data.runTag || !data.advisorSub) return;
  teardownProfileClients(
    SCRIPT_TAG,
    data.base || API_BASE,
    data.runTag,
    data.advisorSub,
    data.token,
    NEEDLE_PREFIX,
    'clients_prof_cf',
  );
  deleteGlobalSeedKey(GLOBAL_SEED);
}

export default function (data) {
  const base = data.base || API_BASE;
  const seeded = seedProfileClientForVu(base, __VU, {
    token: data.token,
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    runTag: data.runTag,
    needlePrefix: NEEDLE_PREFIX,
    globalKey: GLOBAL_SEED,
    scriptTag: SCRIPT_TAG,
  });
  if (!seeded || !seeded.seededClientId) {
    console.error(`[${SCRIPT_TAG}] VU ${__VU}: seed incomplete.`);
    return;
  }
  const hdrs = apiHeaders(seeded.token);
  const url = `${base}/api/v1/client/${encodeURIComponent(seeded.seededClientId)}/cashflows`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'clients_profile_get_client_cashflows', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    200,
    `${SCRIPT_TAG} GET /client/{clientId}/cashflows vu${__VU}`,
    errBuckets.buckets,
    [200, 204],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'clients-profile',
  screenRoute: '/clients/{clientId}/profile',
  portalUrlExample: 'https://dev.ibernia.it/clients/69fd8f3c5d6294d8666f6ac2/profile',
  apiKey: 'get_client_cashflows',
  apiLabel: 'GET /api/v1/client/{clientId}/cashflows',
  method: 'GET',
  endpoint: '/api/v1/client/{clientId}/cashflows',
  expectedStatus: 200,
  expectedStatusDisplay: '200 or 204',
  durMetricName: 'clients_profile_get_client_cashflows_ms',
  errMetricName: 'clients_profile_get_client_cashflows_errors',
  okMetricName: 'clients_profile_get_client_cashflows_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/clients-profile/reports/k6-clients-profile-get-client-cashflows-load-report.json',
});
