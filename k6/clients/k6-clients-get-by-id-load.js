/**
 * Load test **GET /api/v1/Clients/{id}** for **`https://dev.ibernia.it/clients`** (open row / detail prefetch).
 *
 * **Concurrency:** **`constant-vus`** — per-VU seed (**POST /Clients**) on first iteration, then repeated **GET** by id.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients/k6-clients-get-by-id-load.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
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
  createHttpAccepted,
  createHttpErrorBuckets,
  DURATION,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  isClientProfileModuleNotActive402,
  loginAdvisorFromRow0,
  readFirstLifecycleUserAtInit,
  recordOutcomeWithBuckets,
  singleApiHandleSummaryFactory,
  THINK_SEC,
} from './common-clients-screen.js';

const SCRIPT_TAG = 'k6-clients-get-by-id-load';

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

const dur = new Trend('clients_screen_get_by_id_ms');
const errs = new Counter('clients_screen_get_by_id_errors');
const oks = new Counter('clients_screen_get_by_id_success');
const errBuckets = createHttpErrorBuckets('clients_screen_get_by_id_err');

export const options = {
  scenarios: {
    clients_screen_get_by_id: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.88'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.08'] }),
  },
};

function getByIdBodyMatchesClientId(res, clientId) {
  if (res.status !== 200) return false;
  try {
    const j = res.json();
    const id = j && (j.Id != null ? j.Id : j.id);
    return id != null && String(id).trim() === String(clientId).trim();
  } catch {
    return false;
  }
}

function getSeedStore() {
  if (!globalThis.__k6ClientsScreenGetByIdSeed) {
    globalThis.__k6ClientsScreenGetByIdSeed = {};
  }
  return globalThis.__k6ClientsScreenGetByIdSeed;
}

function seedVuIfNeeded(base, vuKey, auth) {
  const store = getSeedStore();
  if (store[vuKey]) return store[vuKey];

  const { token, advisorSub, advisorName, runTag } = auth;
  const hdrs = apiHeaders(token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6cgetid${runTag}vu${vuKey}`;
  const clientEmail = `k6cgetid.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const res = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_screen_getid_seed_post', vu: String(vuKey) },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededClientId } = parseClientCreateResponse(res);
  if (relaxClientProfileModule && isClientProfileModuleNotActive402(res)) {
    abortTest(
      SCRIPT_TAG,
      'seed: 402 client_profile on create. Enable module (RELAX_CLIENT_PROFILE_MODULE does not create a client here).',
    );
  }
  if (!createHttpAccepted(res.status, seededClientId) || !seededClientId) {
    abortTest(SCRIPT_TAG, `seed: POST failed VU ${vuKey} HTTP ${res.status}`);
  }
  const getUrl = `${base}/api/v1/Clients/${encodeURIComponent(seededClientId)}`;
  const verify = http.get(getUrl, {
    headers: hdrs,
    tags: { name: 'clients_screen_getid_seed_verify', vu: String(vuKey) },
    timeout: HTTP_TIMEOUT,
  });
  if (!(verify.status === 200 && getByIdBodyMatchesClientId(verify, seededClientId))) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(seededClientId)}`, null, {
      headers: hdrs,
      tags: { name: 'clients_screen_getid_seed_cleanup', vu: String(vuKey) },
      timeout: HTTP_TIMEOUT,
    });
    abortTest(SCRIPT_TAG, `seed: GET verify failed VU ${vuKey} HTTP ${verify.status}`);
  }
  const entry = { token, advisorSub, seededClientId };
  store[vuKey] = entry;
  console.log(`[${SCRIPT_TAG}] seed VU ${vuKey} ok clientId=${seededClientId}`);
  return entry;
}

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
  deleteClientsAndPlansByLastNameNeedle(
    data.base || API_BASE,
    apiHeaders(data.token),
    data.advisorSub,
    `k6cgetid${data.runTag}`,
    HTTP_TIMEOUT,
    {
      list: 'clients_screen_getid_teardown_list',
      cfList: 'clients_screen_getid_teardown_cf_list',
      delCf: 'clients_screen_getid_teardown_del_cf',
      delClient: 'clients_screen_getid_teardown_del_client',
    },
  );
  try {
    delete globalThis.__k6ClientsScreenGetByIdSeed;
  } catch {
    /* ignore */
  }
}

export default function (data) {
  const base = data.base || API_BASE;
  const auth = {
    token: data.token,
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    runTag: data.runTag,
  };
  const seeded = seedVuIfNeeded(base, __VU, auth);
  if (!seeded || !seeded.seededClientId) {
    console.error(`[${SCRIPT_TAG}] VU ${__VU}: seed incomplete.`);
    return;
  }
  const hdrs = apiHeaders(seeded.token);
  const url = `${base}/api/v1/Clients/${encodeURIComponent(seeded.seededClientId)}`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'clients_screen_get_by_id', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    200,
    `${SCRIPT_TAG} GET /Clients/{id} vu${__VU}`,
    errBuckets.buckets,
  );
  check(res, {
    [`${SCRIPT_TAG} body id matches`]: (r) => getByIdBodyMatchesClientId(r, seeded.seededClientId),
  });
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'clients',
  screenRoute: '/clients',
  portalUrlExample: 'https://dev.ibernia.it/clients',
  apiKey: 'get_client_by_id',
  apiLabel: 'GET /api/v1/Clients/{id}',
  method: 'GET',
  endpoint: '/api/v1/Clients/{id}',
  expectedStatus: 200,
  durMetricName: 'clients_screen_get_by_id_ms',
  errMetricName: 'clients_screen_get_by_id_errors',
  okMetricName: 'clients_screen_get_by_id_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/clients/reports/k6-clients-get-by-id-load-report.json',
});
