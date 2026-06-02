/**
 * Load test PUT /api/v1/wealth/{cashflowId}/liabilities (POST seed, PUT, DELETE cleanup).
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  API_BASE,
  apiHeaders,
  assertApiBase,
  assertDevIdentityHost,
  buildAddWealthLiabilityPayloadWithNeedle,
  buildUpdateWealthLiabilityPayload,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  readAllLifecycleUsersAtInit,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  resolveLiabilityIdAfterPost,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
  trimResBody,
  wealthLiabilitiesUrl,
  wealthLiabilityByIdUrl,
} from './common-cashflows-wealth-screen.js';

const SCRIPT_TAG = 'k6-cashflows-wealth-put-liability-load';
const GLOBAL_SEED = '__k6CfWealthSeed_putlia';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_wealth_put_liability_ms');
const errs = new Counter('cashflows_wealth_put_liability_errors');
const oks = new Counter('cashflows_wealth_put_liability_success');
const errBuckets = createHttpErrorBuckets('cashflows_wealth_put_liability_err', { lineResolve: true });

export const options = {
  scenarios: {
    cashflows_wealth_put_liability: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.82'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.12'] }),
  },
};

export function setup() {
  const runTag = `r${Date.now()}`;
  console.log(`[${SCRIPT_TAG}] runTag=${runTag} | VUs=${SCENARIO_VUS} | DURATION=${DURATION}`);
  return { base: API_BASE, runTag };
}

export function teardown(data) {
  if (!data) return;
  if (SHARED_CASHFLOW_ID) {
    deleteGlobalSeed(GLOBAL_SEED);
    return;
  }
  teardownByNeedle(SCRIPT_TAG, data.base, data.runTag, LIFECYCLE_USERS);
  deleteGlobalSeed(GLOBAL_SEED);
}

export default function (data) {
  const base = data.base;
  const runTag = data.runTag;
  const idx = SHARED_CASHFLOW_ID ? 0 : __VU - 1;
  const e = getVuEntry(base, runTag, __VU, idx, LIFECYCLE_USERS, SCRIPT_TAG, GLOBAL_SEED);
  const hdrs = apiHeaders(e.token);
  const cfId = e.seededCashflowId;
  const postUrl = wealthLiabilitiesUrl(base, cfId);
  const { needle, body } = buildAddWealthLiabilityPayloadWithNeedle(__VU, __ITER, runTag);
  const postRes = http.post(postUrl, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_put_lia_seed', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur,
      errs,
      oks,
      postRes,
      200,
      `${SCRIPT_TAG} PUT-liability POST seed`,
      errBuckets.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const id = resolveLiabilityIdAfterPost({
    postRes,
    base,
    token: e.token,
    cashflowId: cfId,
    needle,
    tagName: 'cashflows_wealth_put_lia_resolve',
    vuTag: String(__VU),
    timeout: HTTP_TIMEOUT,
  });
  if (!id) {
    errs.add(1);
    recordErrorInStatusBuckets(errBuckets.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const putBody = buildUpdateWealthLiabilityPayload(id, __VU, __ITER, runTag);
  const putRes = http.put(postUrl, JSON.stringify(putBody), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_put_liability', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const putOk = recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    putRes,
    200,
    `${SCRIPT_TAG} PUT wealth liability vu${__VU}`,
    errBuckets.buckets,
  );
  if (putOk) {
    const delRes = http.del(wealthLiabilityByIdUrl(base, cfId, id), null, {
      headers: hdrs,
      tags: { name: 'cashflows_wealth_put_lia_cleanup', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    if (delRes.status !== 204) {
      console.error(
        `[${SCRIPT_TAG}] cleanup DELETE liability HTTP ${delRes.status} ${trimResBody(delRes, 1500)}`,
      );
    }
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-wealth',
  screenRoute: '/cashflows/{cashflowId}/wealth',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/wealth',
  apiKey: 'put_wealth_liability',
  apiLabel: 'PUT /api/v1/wealth/{cashflowId}/liabilities',
  method: 'PUT',
  endpoint: '/api/v1/wealth/{cashflowId}/liabilities',
  expectedStatus: 200,
  durMetricName: 'cashflows_wealth_put_liability_ms',
  errMetricName: 'cashflows_wealth_put_liability_errors',
  okMetricName: 'cashflows_wealth_put_liability_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-wealth/reports/cashflows-wealth-put-liability-load-report.json',
});
