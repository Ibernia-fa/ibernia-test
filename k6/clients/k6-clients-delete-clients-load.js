/**
 * Load test **DELETE /api/v1/Clients/{id}** for **`https://dev.ibernia.it/clients`** (remove client).
 *
 * **Concurrency:** **`constant-vus`** — each iteration **POST**s a disposable client, then **DELETE**s it (DELETE is what is measured).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients/k6-clients-delete-clients-load.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET"
 * ```
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { buildClientModel, parseClientCreateResponse } from '../../lib/k6-client-lifecycle.js';
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

const SCRIPT_TAG = 'k6-clients-delete-clients-load';

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

const dur = new Trend('clients_delete_ms');
const errs = new Counter('clients_delete_errors');
const oks = new Counter('clients_delete_success');
const errBuckets = createHttpErrorBuckets('clients_delete_err');

export const options = {
  scenarios: {
    clients_delete: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.85'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.1'] }),
  },
};

export function setup() {
  const runTag = `r${Date.now()}`;
  const ctx = loginAdvisorFromRow0(SCRIPT_TAG, LIFECYCLE_ROW0);
  if (!ctx) abortTest(SCRIPT_TAG, 'setup: login failed row 0.');
  console.log(`[${SCRIPT_TAG}] runTag=${runTag} | VUS=${VUS} | DURATION=${DURATION} | DELETE /Clients/{id}`);
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
    `k6cdel${data.runTag}`,
    HTTP_TIMEOUT,
    {
      list: 'clients_delete_teardown_list',
      cfList: 'clients_delete_teardown_cf_list',
      delCf: 'clients_delete_teardown_del_cf',
      delClient: 'clients_delete_teardown_del_client',
    },
  );
}

export default function (data) {
  const base = data.base || API_BASE;
  const hdrs = apiHeaders(data.token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6cdel${data.runTag}vu${__VU}it${__ITER}`;
  const clientEmail = `k6cdel.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const resPost = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_delete_prefetch_post', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const { id } = parseClientCreateResponse(resPost);
  if (relaxClientProfileModule && isClientProfileModuleNotActive402(resPost)) {
    console.warn(`[${SCRIPT_TAG}] RELAX_CLIENT_PROFILE_MODULE: skip iteration vu${__VU}`);
    return;
  }
  if (!createHttpAccepted(resPost.status, id) || !id) {
    console.error(
      `[${SCRIPT_TAG}] prefetch POST failed vu${__VU} HTTP ${resPost.status} body=${String(resPost.body).slice(0, 300)}`,
    );
    return;
  }
  const resDel = http.del(`${base}/api/v1/Clients/${encodeURIComponent(id)}`, null, {
    headers: hdrs,
    tags: { name: 'clients_delete', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    resDel,
    200,
    `${SCRIPT_TAG} DELETE /Clients/{id} vu${__VU}`,
    errBuckets.buckets,
    [200, 204],
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'clients',
  screenRoute: '/clients',
  portalUrlExample: 'https://dev.ibernia.it/clients',
  apiKey: 'delete_client',
  apiLabel: 'DELETE /api/v1/Clients/{id}',
  method: 'DELETE',
  endpoint: '/api/v1/Clients/{id}',
  expectedStatus: 200,
  expectedStatusDisplay: '200 or 204',
  durMetricName: 'clients_delete_ms',
  errMetricName: 'clients_delete_errors',
  okMetricName: 'clients_delete_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/clients/reports/k6-clients-delete-clients-load-report.json',
});
