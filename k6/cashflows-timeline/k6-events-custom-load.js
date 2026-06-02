/**
 * **UI route:** `https://dev.ibernia.it/cashflows/{cashflowId}/timeline` — Events API (timeline screen).
 *
 * Load test **GET /api/v1/Events/custom** — **per-user tokens**, optional **fixed RPS** (throughput), **SLA thresholds**, **payload checks**, **correlation IDs**, **`handleSummary`** JSON.
 *
 * ## Load shape (`LOAD_MODE`)
 *
 * - **`vus`** (default): **`constant-vus`**, **`vus` = lifecycle row count** — each VU maps to **one user** (`__VU - 1`).
 * - **`arrival`**: **`constant-arrival-rate`** — target **`ARRIVAL_RATE`** iterations per **`timeUnit`** (default **1s**). Each iteration picks a user **round-robin** via **`scenario.iterationInTest % N`**. Set **`PRE_ALLOCATED_VUS`** / **`MAX_VUS`** as needed.
 *
 * ## SLA & thresholds
 *
 * - **`SLA_P95_MS`** (default **1200**) — **`http_req_duration{name:events_custom_get}`** `p(95)`.
 * - **`SLA_P99_MS`** — optional second bound on the same sub-metric (omit or **0** to skip).
 * - **`RELAX_SLA=1`** — omit duration SLA thresholds (still can keep checks / failure rate).
 * - **`http_req_failed{name:events_custom_get}`** — **`rate<0.01`** when not relaxed.
 *
 * ## Data correctness
 *
 * - **`STRICT_PAYLOAD=1`** (default): for **200** responses, body must be a **JSON array** of objects; each item has non-empty **`id`/`Id`** and **`name`/`Name`**; if **`isDefault`/`IsDefault`** is present it must not be **`true`**; **`type`/`Type`** if present must look like **Income/Expense** or **1/2**.
 * - **`STRICT_PAYLOAD=0`** — only **array** (or **204**) like the original script.
 *
 * ## Auth / verify
 *
 * - **`LOAD_MODE=vus`** (default): **`setup()`** logs only (no HTTP). **First iteration per VU** — login + **`GET …/Events/custom`** verify; token cached on **`globalThis.__k6EventsCustomGetSeedByVu`** keyed by **`__VU`** (concurrent across VUs).
 * - **`LOAD_MODE=arrival`**: **`setup()`** still logs in and verifies **each** user **once** (sequential), returns **`entries`** so every VU shares the same token pool (round-robin by iteration).
 *
 * ## Observability
 *
 * - Every load GET sends **`X-Correlation-Id`** (`k6-ec-<vu>-<iter>-<ts>`) and **`X-k6-Script`**: **`events_custom_get`** for log/trace correlation.
 * - HTTP tag **`name: events_custom_get`** (stable; no per-email tags) for Grafana-friendly SLA filters.
 * - **`handleSummary`** writes **`SUMMARY_JSON_PATH`** (default **`k6/cashflows-timeline/reports/k6-events-custom-summary.json`**) with condensed metrics; stdout uses **`textSummary`**. Set **`SUMMARY_JSON_PATH=`** empty to skip the file.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" k6/cashflows-timeline/k6-events-custom-load.js
 * # Throughput + SLA (one script path only — do not use `k6 run . -e ...`):
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" -e LOAD_MODE=arrival -e ARRIVAL_RATE=40 -e SLA_P95_MS=900 k6/cashflows-timeline/k6-events-custom-load.js
 * ```
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { scenario } from 'k6/execution';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { observeHttp } from '../../lib/k6-http-observe.js';
import { adaptiveSetupData } from '../../lib/k6-adaptive-integration.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';
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
const relaxSla = ['1', 'true', 'yes'].includes((__ENV.RELAX_SLA || '').trim().toLowerCase());
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxGoalsModule;

const LOAD_MODE = (__ENV.LOAD_MODE || 'vus').trim().toLowerCase();
const ARRIVAL_RATE = Math.max(1, parseInt((__ENV.ARRIVAL_RATE || '30').trim(), 10) || 30);

const DURATION = (__ENV.DURATION || '20s').trim();
const DURATION_FROM_ENV = !!(__ENV.DURATION && String(__ENV.DURATION).trim());

const SLA_P95_MS = Math.max(1, parseInt((__ENV.SLA_P95_MS || '1200').trim(), 10) || 1200);
const SLA_P99_MS_RAW = (__ENV.SLA_P99_MS || '').trim();
const SLA_P99_MS = SLA_P99_MS_RAW ? Math.max(1, parseInt(SLA_P99_MS_RAW, 10) || 0) : 0;

const STRICT_PAYLOAD = !['0', 'false', 'no'].includes(
  (__ENV.STRICT_PAYLOAD === undefined || __ENV.STRICT_PAYLOAD === '' ? '1' : __ENV.STRICT_PAYLOAD).trim().toLowerCase(),
);

const SUMMARY_JSON_PATH = (__ENV.SUMMARY_JSON_PATH !== undefined
  ? String(__ENV.SUMMARY_JSON_PATH).trim()
  : 'k6/cashflows-timeline/reports/k6-events-custom-summary.json');

const SCRIPT_TAG = 'k6-events-custom-load';

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
const SCENARIO_VUS = scenarioVusForPool(LIFECYCLE_USERS.length, 'k6-events-custom-load');

/** PRE_ALLOCATED_VUS default tied to pool size after users are known */
const PRE_ALLOCATED_VUS_EFFECTIVE = Math.max(
  1,
  parseInt(
    (__ENV.PRE_ALLOCATED_VUS || String(Math.max(LIFECYCLE_USERS.length, 20))).trim(),
    10,
  ) || LIFECYCLE_USERS.length,
);

const MAX_VUS_EFFECTIVE = Math.max(
  PRE_ALLOCATED_VUS_EFFECTIVE,
  parseInt((__ENV.MAX_VUS || '100').trim(), 10) || 100,
);

const HTTP_TAG_LOAD = 'events_custom_get';

function apiHeaders(bearer, extra) {
  const h = {
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
    'X-k6-Script': extra && extra.scriptTag ? String(extra.scriptTag) : HTTP_TAG_LOAD,
  };
  if (extra && extra.correlationId) {
    h['X-Correlation-Id'] = String(extra.correlationId);
  }
  return h;
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

function typeLooksLikeEventType(typ) {
  if (typ === undefined || typ === null) return true;
  if (typeof typ === 'number' && (typ === 1 || typ === 2)) return true;
  const s = String(typ).toLowerCase();
  return s === 'income' || s === 'expense' || s === '1' || s === '2';
}

/**
 * Single parse path for GET /Events/custom.
 * @returns {{ ok: boolean, reason: string, count?: number }}
 */
function validateCustomEventsGetResponse(res, strict) {
  if (res.status === 204) return { ok: true, reason: '204', count: 0 };
  if (res.status !== 200) return { ok: false, reason: `bad_status_${res.status}` };
  let arr;
  try {
    arr = res.json();
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
  if (!Array.isArray(arr)) return { ok: false, reason: 'not_array' };

  if (!strict) return { ok: true, reason: 'array_ok', count: arr.length };

  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { ok: false, reason: `row_${i}_not_object` };
    }
    const id = row.id != null ? row.id : row.Id;
    const name = row.name != null ? row.name : row.Name;
    if (id == null || String(id).trim() === '') {
      return { ok: false, reason: `row_${i}_missing_id` };
    }
    if (name == null || String(name).trim() === '') {
      return { ok: false, reason: `row_${i}_missing_name` };
    }
    const def = row.isDefault !== undefined ? row.isDefault : row.IsDefault;
    if (def === true || def === 'true' || def === 'True') {
      return { ok: false, reason: `row_${i}_unexpected_default` };
    }
    const typ = row.type !== undefined ? row.type : row.Type;
    if (!typeLooksLikeEventType(typ)) {
      return { ok: false, reason: `row_${i}_bad_type` };
    }
  }
  return { ok: true, reason: 'strict_ok', count: arr.length };
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

function pickUserIndexForIteration(entriesLen) {
  if (LOAD_MODE === 'arrival') {
    const it = scenario.iterationInTest;
    return Math.floor(it) % entriesLen;
  }
  return __VU - 1;
}

/** Login + GET …/Events/custom verify for lifecycle row `userIdx` (used by arrival setup and by per-VU seed). */
function seedUserOnce(base, userIdx, logLabel) {
  const row = LIFECYCLE_USERS[userIdx];
  if (!row) {
    abortTest(`${logLabel}: no lifecycle row index ${userIdx}.`);
  }
  const ctx = loginUserContext(row);
  if (!ctx) {
    abortTest(`${logLabel}: login failed (${row.email}).`);
  }
  const { accessToken } = ctx;
  const url = `${base}/api/v1/Events/custom`;
  const cid = `k6-ec-seed-${userIdx}-${Date.now()}`;
  const hdrs = apiHeaders(accessToken, { correlationId: cid, scriptTag: 'events_custom_seed_verify' });
  const verify = http.get(url, {
    headers: hdrs,
    tags: { name: 'events_custom_seed_verify' },
    timeout: HTTP_TIMEOUT,
  });

  if (relaxGoalsModule && isGoalsModuleNotActive402(verify)) {
    abortTest(
      `${logLabel}: 402 goals GET Events/custom (${row.email}). Enable Goals module or fix subscription (RELAX_GOALS_MODULE does not run this load test).`,
    );
  }

  const v = validateCustomEventsGetResponse(verify, STRICT_PAYLOAD);
  if (!v.ok) {
    abortTest(
      `${logLabel}: GET Events/custom verify failed (${row.email}) HTTP ${verify.status} (${v.reason}).`,
    );
  }

  return {
    email: row.email,
    token: accessToken,
    _verifyStatus: verify.status,
    _count: v.count,
  };
}

function getSeedStore() {
  if (!globalThis.__k6EventsCustomGetSeedByVu) {
    globalThis.__k6EventsCustomGetSeedByVu = {};
  }
  return globalThis.__k6EventsCustomGetSeedByVu;
}

/** `LOAD_MODE=vus` only: first iteration per VU seeds login + verify (runs concurrently across VUs). */
function seedVuIfNeeded(base, vuKey, userIdx) {
  const store = getSeedStore();
  if (store[vuKey]) {
    return store[vuKey];
  }
  const row = LIFECYCLE_USERS[userIdx];
  if (!row) {
    abortTest(`seed: no lifecycle row for VU ${vuKey} index ${userIdx}.`);
  }
  const full = seedUserOnce(base, userIdx, `seed VU ${vuKey}`);
  const entry = { email: full.email, token: full.token };
  store[vuKey] = entry;
  console.log(
    `[${SCRIPT_TAG}] seed VU ${vuKey} ok: ${full.email} HTTP ${full._verifyStatus}${full._count != null ? ` count=${full._count}` : ''}`,
  );
  return entry;
}

function buildEntriesSequentialForArrival() {
  const n = LIFECYCLE_USERS.length;
  const entries = [];
  for (let i = 0; i < n; i++) {
    const full = seedUserOnce(API_BASE, i, `arrival setup row ${i}`);
    entries.push({ email: full.email, token: full.token });
    console.log(
      `[${SCRIPT_TAG}] arrival setup row ${i} ok: ${full.email} HTTP ${full._verifyStatus}${full._count != null ? ` count=${full._count}` : ''}`,
    );
  }
  return entries;
}

export function setup() {
  const n = LIFECYCLE_USERS.length;
  const vusNote =
    LOAD_MODE === 'arrival'
      ? `sequential login+verify in setup (shared token pool)`
      : `${n} VUs (concurrent per-VU seed on first iteration)`;
  console.log(
    `[${SCRIPT_TAG}] ${n} user(s) | LOAD_MODE=${LOAD_MODE}${LOAD_MODE === 'arrival' ? ` ARRIVAL_RATE=${ARRIVAL_RATE}/s PRE_ALLOCATED_VUS=${PRE_ALLOCATED_VUS_EFFECTIVE} MAX_VUS=${MAX_VUS_EFFECTIVE}` : ` → ${vusNote}`} | DURATION=${DURATION}${DURATION_FROM_ENV ? '' : ' (default)'} | STRICT_PAYLOAD=${STRICT_PAYLOAD} | SLA_P95_MS=${SLA_P95_MS}${SLA_P99_MS > 0 ? ` SLA_P99_MS=${SLA_P99_MS}` : ''} RELAX_SLA=${relaxSla} | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );

  if (LOAD_MODE === 'arrival') {
    return adaptiveSetupData(
      {
        base: API_BASE,
        entries: buildEntriesSequentialForArrival(),
        meta: {
          loadMode: LOAD_MODE,
          strictPayload: STRICT_PAYLOAD,
          slaP95Ms: SLA_P95_MS,
          arrivalRate: ARRIVAL_RATE,
        },
      },
      SCRIPT_TAG,
    );
  }

  return adaptiveSetupData(
    {
      base: API_BASE,
      entries: null,
      meta: {
        loadMode: LOAD_MODE,
        strictPayload: STRICT_PAYLOAD,
        slaP95Ms: SLA_P95_MS,
        arrivalRate: null,
      },
    },
    SCRIPT_TAG,
  );
}

function buildScenarios() {
  if (LOAD_MODE === 'arrival') {
    return {
      events_custom_get: {
        executor: 'constant-arrival-rate',
        rate: ARRIVAL_RATE,
        timeUnit: '1s',
        duration: DURATION,
        preAllocatedVUs: PRE_ALLOCATED_VUS_EFFECTIVE,
        maxVUs: MAX_VUS_EFFECTIVE,
        gracefulStop: '5s',
      },
    };
  }
  return {
    events_custom_get: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '5s',
    },
  };
}

function buildThresholds() {
  const t = {};
  if (!relaxChecks) {
    t.checks = ['rate>0.9'];
  }
  if (effectiveRelaxHttpReqFailed) {
    t.http_req_failed = ['rate<1'];
  } else {
    t.http_req_failed = ['rate<0.05'];
    t[`http_req_failed{name:${HTTP_TAG_LOAD}}`] = ['rate<0.01'];
  }
  if (!relaxSla) {
    const dur = [`p(95)<${SLA_P95_MS}`];
    if (SLA_P99_MS > 0) {
      dur.push(`p(99)<${SLA_P99_MS}`);
    }
    t['http_req_duration{name:events_custom_get}'] = dur;
  }
  return t;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: buildThresholds(),
};

const THINK_SEC = parseFloat((__ENV.THINK_SEC || '0').trim() || '0');

export default function (data) {
  const len = LIFECYCLE_USERS.length;
  if (!len) {
    console.error(`[${SCRIPT_TAG}] no lifecycle users.`);
    return;
  }

  const base = data && data.base ? data.base : API_BASE;
  const idx = pickUserIndexForIteration(len);

  let e;
  if (LOAD_MODE === 'arrival') {
    const entries = data && data.entries;
    if (!entries || !entries[idx]) {
      console.error(`[${SCRIPT_TAG}] VU ${__VU} idx ${idx}: missing arrival setup entry.`);
      return;
    }
    e = entries[idx];
  } else {
    e = seedVuIfNeeded(base, __VU, __VU - 1);
  }

  if (!e || !e.token) {
    console.error(`[${SCRIPT_TAG}] VU ${__VU} idx ${idx}: missing token.`);
    return;
  }

  const cid = `k6-ec-vu${__VU}-it${__ITER}-${Date.now()}`;
  const hdrs = apiHeaders(e.token, { correlationId: cid });
  const url = `${base}/api/v1/Events/custom`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: HTTP_TAG_LOAD },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(res, {
    endpoint: '/api/v1/Events/custom',
    method: 'GET',
    tagName: HTTP_TAG_LOAD,
    scriptTag: SCRIPT_TAG,
  });

  const v = validateCustomEventsGetResponse(res, STRICT_PAYLOAD);

  check(res, {
    'Events/custom: status 200 or 204': (r) => r.status === 200 || r.status === 204,
  });
  check(res, {
    [`Events/custom: payload ${STRICT_PAYLOAD ? 'strict' : 'array'}`]: () => v.ok,
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

function pickMetric(m) {
  if (!m || !m.values) return null;
  return {
    avg: m.values.avg,
    min: m.values.min,
    med: m.values.med,
    max: m.values.max,
    'p(90)': m.values['p(90)'],
    'p(95)': m.values['p(95)'],
    'p(99)': m.values['p(99)'],
    rate: m.values.rate,
  };
}

function handleSummaryCore(data) {
  const condensed = {
    script: SCRIPT_TAG,
    finishedAt: new Date().toISOString(),
    loadMode: LOAD_MODE,
    strictPayload: STRICT_PAYLOAD,
    thresholds: data.thresholds || {},
    metrics: {
      http_req_duration: pickMetric(data.metrics.http_req_duration),
      http_req_duration_events_custom: pickMetric(
        data.metrics[`http_req_duration{name:${HTTP_TAG_LOAD}}`],
      ),
      http_req_failed: pickMetric(data.metrics.http_req_failed),
      http_req_failed_events_custom: pickMetric(
        data.metrics[`http_req_failed{name:${HTTP_TAG_LOAD}}`],
      ),
      checks: pickMetric(data.metrics.checks),
      iterations: pickMetric(data.metrics.iterations),
      http_reqs: pickMetric(data.metrics.http_reqs),
    },
  };

  const out = {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
  if (SUMMARY_JSON_PATH) {
    out[SUMMARY_JSON_PATH] = JSON.stringify(condensed, null, 2);
  }
  return out;
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(handleSummaryCore, {
  scriptTag: SCRIPT_TAG,
  moduleName: (__ENV.MODULE_NAME || 'events-custom').trim(),
  reportSubdir: 'k6/cashflows-timeline/reports',
});
