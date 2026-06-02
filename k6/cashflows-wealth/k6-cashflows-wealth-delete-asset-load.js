/**
 * Load test DELETE /api/v1/wealth/{cashflowId}/assets/{assetId} (POST seed first; expects 204).
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
  API_BASE,
  apiHeaders,
  assertApiBase,
  assertDevIdentityHost,
  buildAddWealthAssetPayloadWithNeedle,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  readAllLifecycleUsersAtInit,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  resolveAssetIdAfterPost,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
  wealthAssetByIdUrl,
  wealthAssetsUrl,
} from './common-cashflows-wealth-screen.js';

const SCRIPT_TAG = 'k6-cashflows-wealth-delete-asset-load';
const GLOBAL_SEED = '__k6CfWealthSeed_delast';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_wealth_delete_asset_ms');
const errs = new Counter('cashflows_wealth_delete_asset_errors');
const oks = new Counter('cashflows_wealth_delete_asset_success');
const errBuckets = createHttpErrorBuckets('cashflows_wealth_delete_asset_err', { lineResolve: true });

export const options = {
  scenarios: {
    cashflows_wealth_delete_asset: {
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
  const postUrl = wealthAssetsUrl(base, cfId);
  const { needle, body } = buildAddWealthAssetPayloadWithNeedle(__VU, __ITER, runTag);
  const postRes = http.post(postUrl, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_del_ast_seed', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  if (postRes.status !== 200) {
    recordOutcomeWithBuckets(
      dur,
      errs,
      oks,
      postRes,
      200,
      `${SCRIPT_TAG} DELETE-asset POST seed vu${__VU}`,
      errBuckets.buckets,
    );
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const id = resolveAssetIdAfterPost({
    postRes,
    base,
    token: e.token,
    cashflowId: cfId,
    needle,
    tagName: 'cashflows_wealth_del_ast_resolve',
    vuTag: String(__VU),
    timeout: HTTP_TIMEOUT,
  });
  if (!id) {
    errs.add(1);
    recordErrorInStatusBuckets(errBuckets.buckets, 'line_resolve');
    if (THINK_SEC > 0) sleep(THINK_SEC);
    return;
  }
  const delRes = http.del(wealthAssetByIdUrl(base, cfId, id), null, {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_delete_asset', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    delRes,
    204,
    `${SCRIPT_TAG} DELETE wealth asset vu${__VU}`,
    errBuckets.buckets,
  );
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-wealth',
  screenRoute: '/cashflows/{cashflowId}/wealth',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/wealth',
  apiKey: 'delete_wealth_asset',
  apiLabel: 'DELETE /api/v1/wealth/{cashflowId}/assets/{assetId}',
  method: 'DELETE',
  endpoint: '/api/v1/wealth/{cashflowId}/assets/{assetId}',
  expectedStatus: 204,
  expectedStatusDisplay: '204',
  durMetricName: 'cashflows_wealth_delete_asset_ms',
  errMetricName: 'cashflows_wealth_delete_asset_errors',
  okMetricName: 'cashflows_wealth_delete_asset_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-wealth/reports/cashflows-wealth-delete-asset-load-report.json',
});
