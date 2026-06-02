/**
 * Load test **GET /api/v1/Clients/{advisorId}/search** for **`https://dev.ibernia.it/clients`**.
 *
 * **Concurrency:** **`constant-vus`** — first iteration per VU **POST**s a client with a unique **searchTerm**, verifies search, then load phase repeats **GET …/search**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients/k6-clients-search-get-load.js `
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
import { clientLastNameFromListRow } from '../../lib/k6-load-cleanup.js';
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

const SCRIPT_TAG = 'k6-clients-search-get-load';

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

const dur = new Trend('clients_screen_search_ms');
const errs = new Counter('clients_screen_search_errors');
const oks = new Counter('clients_screen_search_success');
const errBuckets = createHttpErrorBuckets('clients_screen_search_err');

export const options = {
  scenarios: {
    clients_screen_search: {
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

function searchResponseContainsClientId(res, clientId) {
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

function buildSearchUrl(base, advisorSub, searchTerm) {
  const q = encodeURIComponent(searchTerm);
  return `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/search?searchTerm=${q}`;
}

function getSeedStore() {
  if (!globalThis.__k6ClientsScreenSearchSeed) {
    globalThis.__k6ClientsScreenSearchSeed = {};
  }
  return globalThis.__k6ClientsScreenSearchSeed;
}

function seedVuIfNeeded(base, vuKey, setupData) {
  const store = getSeedStore();
  if (store[vuKey]) return store[vuKey];

  const { token, advisorSub, advisorName, runTag } = setupData;
  const hdrs = apiHeaders(token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6csrch${runTag}vu${vuKey}`;
  const searchTerm = uniqueTag;
  const clientEmail = `k6csrch.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const res = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_screen_search_seed_post', vu: String(vuKey) },
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
  const verifyUrl = buildSearchUrl(base, advisorSub, searchTerm);
  const verify = http.get(verifyUrl, {
    headers: hdrs,
    tags: { name: 'clients_screen_search_seed_verify', vu: String(vuKey) },
    timeout: HTTP_TIMEOUT,
  });
  if (!(verify.status === 200 && searchResponseContainsClientId(verify, seededClientId))) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(seededClientId)}`, null, {
      headers: hdrs,
      tags: { name: 'clients_screen_search_seed_cleanup', vu: String(vuKey) },
      timeout: HTTP_TIMEOUT,
    });
    abortTest(SCRIPT_TAG, `seed: search verify failed VU ${vuKey} HTTP ${verify.status}`);
  }
  const entry = { token, advisorSub, searchTerm, seededClientId };
  store[vuKey] = entry;
  console.log(`[${SCRIPT_TAG}] seed VU ${vuKey} ok searchTerm=${searchTerm}`);
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
  const hdrs = apiHeaders(data.token);
  const base = data.base || API_BASE;
  const needle = `k6csrch${data.runTag}`;
  const listUrl = `${base}/api/v1/Clients/${encodeURIComponent(data.advisorSub)}/all`;
  const res = http.get(listUrl, {
    headers: hdrs,
    tags: { name: 'clients_screen_search_teardown_list' },
    timeout: HTTP_TIMEOUT,
  });
  if (res.status !== 200) return;
  let arr;
  try {
    arr = res.json();
  } catch {
    return;
  }
  if (!Array.isArray(arr)) return;
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    const ln = clientLastNameFromListRow(row);
    if (!ln.includes(needle)) continue;
    const id = row && (row.Id != null ? row.Id : row.id);
    if (id == null || String(id).trim() === '') continue;
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(String(id).trim())}`, null, {
      headers: hdrs,
      tags: { name: 'clients_screen_search_teardown_delete' },
      timeout: HTTP_TIMEOUT,
    });
  }
  try {
    delete globalThis.__k6ClientsScreenSearchSeed;
  } catch {
    /* ignore */
  }
}

export default function (data) {
  const base = data.base || API_BASE;
  const seeded = seedVuIfNeeded(base, __VU, {
    token: data.token,
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    runTag: data.runTag,
  });
  const hdrs = apiHeaders(seeded.token);
  const url = buildSearchUrl(base, seeded.advisorSub, seeded.searchTerm);
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'clients_screen_search', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    200,
    `${SCRIPT_TAG} GET /Clients/{advisorId}/search vu${__VU}`,
    errBuckets.buckets,
  );
  check(res, {
    [`${SCRIPT_TAG} body includes id`]: (r) =>
      searchResponseContainsClientId(r, seeded.seededClientId),
  });
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'clients',
  screenRoute: '/clients',
  portalUrlExample: 'https://dev.ibernia.it/clients',
  apiKey: 'get_clients_search',
  apiLabel: 'GET /api/v1/Clients/{advisorId}/search',
  method: 'GET',
  endpoint: '/api/v1/Clients/{advisorId}/search',
  expectedStatus: 200,
  durMetricName: 'clients_screen_search_ms',
  errMetricName: 'clients_screen_search_errors',
  okMetricName: 'clients_screen_search_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/clients/reports/k6-clients-search-get-load-report.json',
});
