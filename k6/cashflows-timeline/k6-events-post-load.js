/**
 * **UI route:** `https://dev.ibernia.it/cashflows/{cashflowId}/timeline` — Events API (timeline screen).
 *
 * Load test **read-only Goals APIs** — **`GET /api/v1/Events/default`** and **`GET /api/v1/Events/custom`** only (no **`POST /api/v1/Events`**, so custom goal badges are not created).
 *
 * **`setup()`** logs only (no HTTP). **First iteration per VU**: login + verify Goals GETs (concurrent); token on **`globalThis.__k6EventsPostSeedByVu`**. **`constant-vus`**, **`vus` = row count**.
 * **Default function**: repeat **GET** default + custom. Needs **Goals** module. Optional **`LIFECYCLE_MAX_USERS`**, **`RELAX_GOALS_MODULE`**, **`RELAX_*`**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" k6/cashflows-timeline/k6-events-post-load.js
 * ```
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { observeHttp } from '../../lib/k6-http-observe.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';
import exec from 'k6/execution';
import {
  lifecycleLoginAcquireToken,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { scenarioVusForPool } from '../../lib/k6-default-vus.js';

const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const LIFECYCLE_MAX_USERS_RAW = (__ENV.LIFECYCLE_MAX_USERS || '').trim();
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxGoalsModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_GOALS_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxGoalsModule;

const DURATION = (__ENV.DURATION || '20s').trim();
const DURATION_FROM_ENV = !!(__ENV.DURATION && String(__ENV.DURATION).trim());

const SCRIPT_TAG = 'k6-events-post-load';

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[${SCRIPT_TAG}] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[${SCRIPT_TAG}] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`);
}

assertDevIdentityHost(IDENTITY_BASE);
assertApiBase(API_BASE);

function normalizeLifecycleRow(r, idx) {
  const em = r && String(r.email || '').trim();
  let tok = r && String(r.token || '').trim();
  if (tok && /^bearer\s+/i.test(tok)) {
    tok = tok.replace(/^bearer\s+/i, '').trim();
  }
  const pw = r && String(r.password || '').trim();
  if (!em) {
    throw new Error(`[${SCRIPT_TAG}] Row ${idx}: missing "email".`);
  }
  if (!tok && !pw) {
    throw new Error(`[${SCRIPT_TAG}] Row ${idx}: need "token" and/or "password".`);
  }
  if (tok) {
    const parts = tok.split('.');
    if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
      throw new Error(`[${SCRIPT_TAG}] Row ${idx}: "token" must be a JWT (three segments).`);
    }
  }
  return {
    email: em,
    password: pw,
    token: tok,
    advisorIdFromRow:
      r && (r.advisorId != null && String(r.advisorId).trim() !== ''
        ? String(r.advisorId).trim()
        : r.identityUserId != null && String(r.identityUserId).trim() !== ''
          ? String(r.identityUserId).trim()
          : ''),
  };
}

function readAllLifecycleUsersAtInit() {
  const arr = loadLifecycleUsers();
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`[${SCRIPT_TAG}] lifecycle users / pool slice must be a non-empty array.`);
  }
  const ropcClientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const rows = [];
  for (let i = 0; i < arr.length; i++) {
    rows.push(normalizeLifecycleRow(arr[i], i));
  }
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].token && !ropcClientId) {
      throw new Error(
        `[${SCRIPT_TAG}] Row ${i} has password but no token — set SIGNUP_ROPC_CLIENT_ID (and secret if confidential) for ROPC.`,
      );
    }
  }
  let use = rows;
  if (LIFECYCLE_MAX_USERS_RAW) {
    const cap = Math.max(1, parseInt(LIFECYCLE_MAX_USERS_RAW, 10));
    if (!Number.isFinite(cap)) {
      throw new Error(`[${SCRIPT_TAG}] LIFECYCLE_MAX_USERS must be a positive integer.`);
    }
    use = rows.slice(0, cap);
    if (use.length === 0) {
      throw new Error(`[${SCRIPT_TAG}] LIFECYCLE_MAX_USERS=${cap} left no users.`);
    }
  }
  return use;
}

const LIFECYCLE_USERS = readAllLifecycleUsersAtInit();
const SCENARIO_VUS = scenarioVusForPool(LIFECYCLE_USERS.length, 'k6-events-post-load');

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

function isGoalsModuleNotActive402(res) {
  if (!res || res.status !== 402) return false;
  try {
    const j = res.json();
    if (!j || typeof j !== 'object') return false;
    const code = j.code != null ? String(j.code) : '';
    const mod = j.module != null ? String(j.module) : '';
    return code === 'module_not_active' && (mod === 'goals' || mod === 'Goals');
  } catch {
    return false;
  }
}

function loginUserContext(row) {
  const clientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const clientSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
  const scope = (
    __ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api'
  ).trim();

  const auth = lifecycleLoginAcquireToken({
    email: row.email,
    password: row.password,
    preloadedAccessToken: row.token,
    identityBase: IDENTITY_BASE,
    clientId,
    clientSecret,
    scope,
    timeout: HTTP_TIMEOUT,
    advisorIdFromRow: row.advisorIdFromRow || undefined,
  });
  if (!auth) return null;

  const { accessToken, tokenSub } = auth;
  const advisorSub = resolveAdvisorSub(row.email, tokenSub);
  if (!advisorSub) {
    console.error(`[${SCRIPT_TAG}] No advisor id for ${row.email}.`);
    return null;
  }
  return { accessToken, advisorSub };
}

function abortTest(msg) {
  exec.test.abort(`[${SCRIPT_TAG}] ${msg}`);
}

function getSeedStore() {
  if (!globalThis.__k6EventsPostSeedByVu) {
    globalThis.__k6EventsPostSeedByVu = {};
  }
  return globalThis.__k6EventsPostSeedByVu;
}

function seedVuIfNeeded(base, vuKey, idx) {
  const store = getSeedStore();
  if (store[vuKey]) {
    return store[vuKey];
  }

  const row = LIFECYCLE_USERS[idx];
  if (!row) {
    abortTest(`seed: no lifecycle row for VU ${vuKey} index ${idx}.`);
  }

  const ctx = loginUserContext(row);
  if (!ctx) {
    abortTest(`seed: login failed VU ${vuKey} (${row.email}).`);
  }

  const { accessToken } = ctx;
  const hdrs = apiHeaders(accessToken);
  const resDef = http.get(`${base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'events_post_seed_default' },
    timeout: HTTP_TIMEOUT,
  });
  if (relaxGoalsModule && isGoalsModuleNotActive402(resDef)) {
    abortTest(
      `seed: 402 goals GET Events/default VU ${vuKey} (${row.email}). Enable Goals module or fix subscription.`,
    );
  }
  if (!((resDef.status === 200 && Array.isArray(resDef.json())) || resDef.status === 204)) {
    abortTest(`seed: GET Events/default failed VU ${vuKey} (${row.email}) HTTP ${resDef.status}`);
  }

  const resCust = http.get(`${base}/api/v1/Events/custom`, {
    headers: hdrs,
    tags: { name: 'events_post_seed_custom' },
    timeout: HTTP_TIMEOUT,
  });
  if (relaxGoalsModule && isGoalsModuleNotActive402(resCust)) {
    abortTest(
      `seed: 402 goals GET Events/custom VU ${vuKey} (${row.email}). Enable Goals module or fix subscription.`,
    );
  }
  if (resCust.status !== 200) {
    abortTest(`seed: GET Events/custom failed VU ${vuKey} (${row.email}) HTTP ${resCust.status}`);
  }

  const entry = { email: row.email, token: accessToken };
  store[vuKey] = entry;
  console.log(`[${SCRIPT_TAG}] seed VU ${vuKey} ok: ${row.email}`);
  return entry;
}

export function setup() {
  const n = LIFECYCLE_USERS.length;
  console.log(
    `[${SCRIPT_TAG}] ${n} user(s) → ${n} VUs (read-only Goals GETs; no POST /Events) | DURATION=${DURATION}${DURATION_FROM_ENV ? ' (-e DURATION)' : ' (default)'} | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );
  return { base: API_BASE };
}

export const options = {
  scenarios: {
    events_goals_get: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
    ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.05'] }),
  },
};

const THINK_SEC = parseFloat((__ENV.THINK_SEC || '0').trim() || '0');

export default function (data) {
  const base = data && data.base ? data.base : API_BASE;
  const idx = __VU - 1;
  const vuKey = __VU;
  const e = seedVuIfNeeded(base, vuKey, idx);
  if (!e || !e.token) {
    console.error(`[${SCRIPT_TAG}] VU ${vuKey} (index ${idx}): seed incomplete.`);
    return;
  }

  const hdrs = apiHeaders(e.token);

  const resDef = http.get(`${base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'events_post_default_get' },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(resDef, {
    method: 'GET',
    endpoint: '/api/v1/Events/default',
    tagName: 'events_post_default_get',
  });
  check(resDef, {
    [`GET Events/default vu${__VU} (${e.email})`]: (r) =>
      (r.status === 200 && Array.isArray(r.json())) || r.status === 204,
  });

  const resCust = http.get(`${base}/api/v1/Events/custom`, {
    headers: hdrs,
    tags: { name: 'events_post_custom_get' },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(resCust, {
    method: 'GET',
    endpoint: '/api/v1/Events/custom',
    tagName: 'events_post_custom_get',
  });
  check(resCust, {
    [`GET Events/custom vu${__VU} (${e.email}): 200`]: (r) => r.status === 200,
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  scriptTag: SCRIPT_TAG,
  moduleName: (__ENV.MODULE_NAME || 'events-goals-read').trim(),
  reportSubdir: 'k6/cashflows-timeline/reports',
});
