/**
 * Load test **PUT /api/v1/Clients** (save profile) for **`/clients/{clientId}/profile`**.
 *
 * **Concurrency:** **`constant-vus`** — per-VU seed; each iteration **GET** fresh model → append **`Notes`** → **PUT** full body (**200**).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients-profile/k6-clients-profile-put-client-load.js `
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
  logHttpError,
  recordErrorInStatusBuckets,
} from './common-clients-profile-screen.js';

const SCRIPT_TAG = 'k6-clients-profile-put-client-load';
const NEEDLE_PREFIX = 'k6profput';
const GLOBAL_SEED = '__k6ClientsProfilePutSeed';

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

const dur = new Trend('clients_profile_put_client_ms');
const errs = new Counter('clients_profile_put_client_errors');
const oks = new Counter('clients_profile_put_client_success');
const errBuckets = createHttpErrorBuckets('clients_profile_put_client_err');

export const options = {
  scenarios: {
    clients_profile_put_client: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.85'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.08'] }),
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
    'clients_prof_put',
  );
  deleteGlobalSeedKey(GLOBAL_SEED);
}

function cloneForPut(res) {
  if (res.status !== 200 || !res.body) return null;
  try {
    return JSON.parse(String(res.body));
  } catch {
    return null;
  }
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
  const getUrl = `${base}/api/v1/Clients/${encodeURIComponent(seeded.seededClientId)}`;
  const getRes = http.get(getUrl, {
    headers: hdrs,
    tags: { name: 'clients_profile_put_prefetch', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  if (getRes.status !== 200) {
    errs.add(1);
    recordErrorInStatusBuckets(errBuckets.buckets, getRes.status != null ? getRes.status : 'other');
    logHttpError(`${SCRIPT_TAG} GET prefetch vu${__VU}`, getRes);
    return;
  }
  const model = cloneForPut(getRes);
  if (!model) {
    errs.add(1);
    recordErrorInStatusBuckets(errBuckets.buckets, 'other');
    logHttpError(`${SCRIPT_TAG} PUT parse body vu${__VU}`, getRes);
    return;
  }
  const id = model.Id != null ? model.Id : model.id;
  if (id != null) {
    model.Id = id;
  }
  const stamp = `Profile load test ${data.runTag} vu${__VU} it${__ITER} ${Date.now()}`;
  const prev = model.Notes != null ? String(model.Notes) : '';
  model.Notes = `${prev ? `${prev} | ` : ''}${stamp}`.slice(0, 500);

  const putRes = http.put(`${base}/api/v1/Clients`, JSON.stringify(model), {
    headers: hdrs,
    tags: { name: 'clients_profile_put_client', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    putRes,
    200,
    `${SCRIPT_TAG} PUT /Clients vu${__VU}`,
    errBuckets.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'clients-profile',
  screenRoute: '/clients/{clientId}/profile',
  portalUrlExample: 'https://dev.ibernia.it/clients/69fd8f3c5d6294d8666f6ac2/profile',
  apiKey: 'put_client',
  apiLabel: 'PUT /api/v1/Clients',
  method: 'PUT',
  endpoint: '/api/v1/Clients',
  expectedStatus: 200,
  durMetricName: 'clients_profile_put_client_ms',
  errMetricName: 'clients_profile_put_client_errors',
  okMetricName: 'clients_profile_put_client_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/clients-profile/reports/k6-clients-profile-put-client-load-report.json',
});
