/**
 * Load test **POST /api/v1/Clients** (create **with** partner) for **`https://dev.ibernia.it/clients`**.
 *
 * **Concurrency:** **`constant-vus`** — each VU/iteration **POST**s a unique client (+ partner), then **DELETE**s the client.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients/k6-clients-post-with-partner-load.js `
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
  createHttpErrorBuckets,
  DURATION,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  loginAdvisorFromRow0,
  readFirstLifecycleUserAtInit,
  recordOutcomeWithBuckets,
  singleApiHandleSummaryFactory,
  THINK_SEC,
} from './common-clients-screen.js';

const SCRIPT_TAG = 'k6-clients-post-with-partner-load';

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

const dur = new Trend('clients_post_wp_ms');
const errs = new Counter('clients_post_wp_errors');
const oks = new Counter('clients_post_wp_success');
const errBuckets = createHttpErrorBuckets('clients_post_wp_err');

export const options = {
  scenarios: {
    clients_post_with_partner: {
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

export function setup() {
  const runTag = `r${Date.now()}`;
  const ctx = loginAdvisorFromRow0(SCRIPT_TAG, LIFECYCLE_ROW0);
  if (!ctx) abortTest(SCRIPT_TAG, 'setup: login failed row 0.');
  console.log(
    `[${SCRIPT_TAG}] runTag=${runTag} | VUS=${VUS} | DURATION=${DURATION} | POST /api/v1/Clients (with partner)`,
  );
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
    `k6cpostwp${data.runTag}`,
    HTTP_TIMEOUT,
    {
      list: 'clients_post_wp_teardown_list',
      cfList: 'clients_post_wp_teardown_cf_list',
      delCf: 'clients_post_wp_teardown_del_cf',
      delClient: 'clients_post_wp_teardown_del_client',
    },
  );
}

export default function (data) {
  const base = data.base || API_BASE;
  const hdrs = apiHeaders(data.token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6cpostwp${data.runTag}vu${__VU}it${__ITER}`;
  const clientEmail = `k6cpostwp.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    uniqueTag,
    withPartner: true,
    clientEmail,
  });
  const res = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_post_wp', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    res,
    201,
    `${SCRIPT_TAG} POST /Clients (with partner) vu${__VU}`,
    errBuckets.buckets,
    [200, 201],
  );
  const { id } = parseClientCreateResponse(res);
  if (id) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(id)}`, null, {
      headers: hdrs,
      tags: { name: 'clients_post_wp_iter_cleanup', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'clients',
  screenRoute: '/clients',
  portalUrlExample: 'https://dev.ibernia.it/clients',
  apiKey: 'post_clients_with_partner',
  apiLabel: 'POST /api/v1/Clients (with partner)',
  method: 'POST',
  endpoint: '/api/v1/Clients',
  expectedStatus: 201,
  expectedStatusDisplay: '200 or 201',
  durMetricName: 'clients_post_wp_ms',
  errMetricName: 'clients_post_wp_errors',
  okMetricName: 'clients_post_wp_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/clients/reports/k6-clients-post-with-partner-load-report.json',
});
