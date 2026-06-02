/**
 * Load test POST /api/v1/wealth/{cashflowId}/assets; DELETE cleanup (not counted in main metric).
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
  recordOutcomeWithBuckets,
  resolveAssetIdAfterPost,
  SHARED_CASHFLOW_ID,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
  trimResBody,
  wealthAssetByIdUrl,
  wealthAssetsUrl,
} from './common-cashflows-wealth-screen.js';

const SCRIPT_TAG = 'k6-cashflows-wealth-post-asset-load';
const GLOBAL_SEED = '__k6CfWealthSeed_postast';

assertDevIdentityHost(IDENTITY_BASE, SCRIPT_TAG);
assertApiBase(API_BASE, SCRIPT_TAG);
const LIFECYCLE_USERS = readAllLifecycleUsersAtInit(SCRIPT_TAG);
const VUS_SHARED = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const SCENARIO_VUS = SHARED_CASHFLOW_ID ? VUS_SHARED : LIFECYCLE_USERS.length;

const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);

const dur = new Trend('cashflows_wealth_post_asset_ms');
const errs = new Counter('cashflows_wealth_post_asset_errors');
const oks = new Counter('cashflows_wealth_post_asset_success');
const errBuckets = createHttpErrorBuckets('cashflows_wealth_post_asset_err');

export const options = {
  scenarios: {
    cashflows_wealth_post_asset: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.85'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.1'] }),
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
  const { needle, body } = buildAddWealthAssetPayloadWithNeedle(__VU, __ITER, runTag);
  const postUrl = wealthAssetsUrl(base, cfId);
  const postRes = http.post(postUrl, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_post_asset', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  const ok = recordOutcomeWithBuckets(
    dur,
    errs,
    oks,
    postRes,
    200,
    `${SCRIPT_TAG} POST wealth asset vu${__VU}`,
    errBuckets.buckets,
  );
  if (ok) {
    const id = resolveAssetIdAfterPost({
      postRes,
      base,
      token: e.token,
      cashflowId: cfId,
      needle,
      tagName: 'cashflows_wealth_post_ast_resolve',
      vuTag: String(__VU),
      timeout: HTTP_TIMEOUT,
    });
    if (id) {
      const delRes = http.del(wealthAssetByIdUrl(base, cfId, id), null, {
        headers: hdrs,
        tags: { name: 'cashflows_wealth_post_ast_cleanup', vu: String(__VU) },
        timeout: HTTP_TIMEOUT,
      });
      if (delRes.status !== 204) {
        console.error(
          `[${SCRIPT_TAG}] cleanup DELETE asset HTTP ${delRes.status} ${trimResBody(delRes, 1500)}`,
        );
      }
    } else {
      console.error(`[${SCRIPT_TAG}] cleanup skipped: could not resolve asset id for needle vu${__VU}`);
    }
  }
  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = singleApiHandleSummaryFactory({
  screenName: 'cashflows-wealth',
  screenRoute: '/cashflows/{cashflowId}/wealth',
  portalUrlExample: 'https://dev.ibernia.it/cashflows/{cashflowId}/wealth',
  apiKey: 'post_wealth_asset',
  apiLabel: 'POST /api/v1/wealth/{cashflowId}/assets',
  method: 'POST',
  endpoint: '/api/v1/wealth/{cashflowId}/assets',
  expectedStatus: 200,
  durMetricName: 'cashflows_wealth_post_asset_ms',
  errMetricName: 'cashflows_wealth_post_asset_errors',
  okMetricName: 'cashflows_wealth_post_asset_success',
  errBucketDefs: errBuckets.defs,
  reportFilename: 'k6/cashflows-wealth/reports/cashflows-wealth-post-asset-load-report.json',
});
