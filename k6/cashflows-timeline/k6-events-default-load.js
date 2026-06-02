/**
 * **UI route:** `https://dev.ibernia.it/cashflows/{cashflowId}/timeline` — Events API (timeline screen).
 *
 * Load test **GET /api/v1/Events/default** — **one VU per lifecycle user**, each using **that user’s** Bearer token.
 *
 * **Concurrent verify:** **`setup()`** logs only (no HTTP). **First iteration per VU**: login → **GET** `…/Events/default` once (must **200** + JSON **array**, or **204**); state in **`globalThis.__k6EventsDefaultSeedByVu`**. Later iterations repeat **GET** only. **402** Goals aborts unless **`RELAX_GOALS_MODULE=1`**.
 * **`constant-vus`** with **`vus` = row count** (**`VUS`** env **ignored**). **`DURATION`** (default **20s**). Read-only — **no `teardown()`**.
 *
 * Optional **`-e LIFECYCLE_MAX_USERS=N`**. Needs **Goals** module (same gate as **`EventsController`**).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" k6/cashflows-timeline/k6-events-default-load.js
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

const SCRIPT_TAG = 'k6-events-default-load';

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
const SCENARIO_VUS = scenarioVusForPool(LIFECYCLE_USERS.length, 'k6-events-default-load');

function apiHeaders(bearer) {
  return {
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

/** 204 OK; 200 OK iff body parses as JSON array (empty allowed). */
function eventsDefaultGetResponseOk(res) {
  if (res.status === 204) return true;
  if (res.status !== 200) return false;
  try {
    const j = res.json();
    return Array.isArray(j);
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
  if (!globalThis.__k6EventsDefaultSeedByVu) {
    globalThis.__k6EventsDefaultSeedByVu = {};
  }
  return globalThis.__k6EventsDefaultSeedByVu;
}

/** First iteration per VU: login + GET …/Events/default verify (runs concurrently across VUs). */
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
  const url = `${base}/api/v1/Events/default`;
  const verify = http.get(url, {
    headers: hdrs,
    tags: { name: 'events_default_seed_verify' },
    timeout: HTTP_TIMEOUT,
  });

  if (relaxGoalsModule && isGoalsModuleNotActive402(verify)) {
    abortTest(
      `seed: 402 goals GET Events/default VU ${vuKey} (${row.email}). Enable Goals module or fix subscription (RELAX_GOALS_MODULE does not run this load test).`,
    );
  }

  if (!eventsDefaultGetResponseOk(verify)) {
    abortTest(
      `seed: GET Events/default verify failed VU ${vuKey} (${row.email}) HTTP ${verify.status} (expect 200+array or 204).`,
    );
  }

  const entry = { email: row.email, token: accessToken };
  store[vuKey] = entry;
  console.log(`[${SCRIPT_TAG}] seed VU ${vuKey} ok: ${row.email} HTTP ${verify.status}`);
  return entry;
}

export function setup() {
  const n = LIFECYCLE_USERS.length;
  console.log(
    `[${SCRIPT_TAG}] ${n} user(s) → ${n} VUs (concurrent per-VU seed on first iteration) | DURATION=${DURATION}${DURATION_FROM_ENV ? ' (-e DURATION)' : ' (default)'} | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );
  return { base: API_BASE };
}

export const options = {
  scenarios: {
    events_default_get: {
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
  const url = `${base}/api/v1/Events/default`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'events_default_get', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(res, {
    method: 'GET',
    endpoint: '/api/v1/Events/default',
    tagName: 'events_default_get',
  });

  check(res, {
    [`Events/default vu${__VU} (${e.email}): 200 or 204`]: (r) => r.status === 200 || r.status === 204,
  });
  check(res, {
    [`Events/default vu${__VU}: body ok (204 or JSON array)`]: (r) => eventsDefaultGetResponseOk(r),
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  scriptTag: SCRIPT_TAG,
  moduleName: (__ENV.MODULE_NAME || 'events-default').trim(),
  reportSubdir: 'k6/cashflows-timeline/reports',
});
