/**
 * **UI route:** `https://dev.ibernia.it/cashflows/{cashflowId}/timeline` — Events API (timeline screen).
 *
 * **Per user:** **POST client** → **POST cashflow (plan)** → read-only **`GET /api/v1/Events/default`** + **`GET /api/v1/Events/custom`** (no custom goal **POST**).
 *
 * **Concurrent seeding:** **`setup()`** logs + **`runTag`** (no HTTP). The **first** iteration of **each VU** runs **login → POST client → POST cashflow → Goals GET verify** in parallel (per‑VU cache **`globalThis.__k6EpdSeedByVu`**). Then every iteration repeats **GET** default + custom.
 * **`constant-vus`**, **`vus` = row count**.
 * **`teardown()`** — re-logins each lifecycle row; **`lib/k6-load-cleanup.js`** deletes clients/plans by last-name needle **`k6epd-${runTag}`** (k6 teardown cannot read per-VU **`globalThis`**). Needs **`client_profile`**, **`cashflow`**, **`goals`**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" k6/cashflows-timeline/k6-events-post-delete-after-plan-load.js
 * ```
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { scenarioVusForPool } from '../../lib/k6-default-vus.js';
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';

const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const LIFECYCLE_MAX_USERS_RAW = (__ENV.LIFECYCLE_MAX_USERS || '').trim();
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxClientProfileModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CLIENT_PROFILE_MODULE || '').trim().toLowerCase(),
);
const relaxCashflowModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CASHFLOW_MODULE || '').trim().toLowerCase(),
);
const relaxGoalsModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_GOALS_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed =
  relaxHttpReqFailed || relaxClientProfileModule || relaxCashflowModule || relaxGoalsModule;

const DURATION = (__ENV.DURATION || '20s').trim();
const DURATION_FROM_ENV = !!(__ENV.DURATION && String(__ENV.DURATION).trim());

const SCRIPT_TAG = 'k6-events-post-delete-after-plan-load';

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
const SCENARIO_VUS = scenarioVusForPool(LIFECYCLE_USERS.length, 'k6-events-post-delete-after-plan-load');

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

function createHttpAccepted(status, id) {
  if (status === 201) return true;
  if (status === 200) return !!id;
  return false;
}

function isClientProfileModuleNotActive402(res) {
  if (!res || res.status !== 402) return false;
  try {
    const j = res.json();
    if (!j || typeof j !== 'object') return false;
    const code = j.code != null ? String(j.code) : '';
    const mod = j.module != null ? String(j.module) : '';
    return code === 'module_not_active' && mod === 'client_profile';
  } catch {
    return false;
  }
}

function isCashflowModuleNotActive402(res) {
  if (!res || res.status !== 402) return false;
  try {
    const j = res.json();
    if (!j || typeof j !== 'object') return false;
    const code = j.code != null ? String(j.code) : '';
    const mod = j.module != null ? String(j.module) : '';
    return code === 'module_not_active' && mod === 'cashflow';
  } catch {
    return false;
  }
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

function parseCashflowCreateResponse(res) {
  if (res.status !== 201 && res.status !== 200) return { id: null };
  try {
    const j = res.json();
    const id = j && (j.Id != null ? j.Id : j.id);
    return { id: typeof id === 'string' && id.length > 0 ? id : null };
  } catch {
    return { id: null };
  }
}

function clientDisplayNameFromModel(modelRaw) {
  const d = modelRaw && (modelRaw.clientDetails || modelRaw.ClientDetails);
  if (!d) return 'k6 client';
  const fn = d.firstName != null ? String(d.firstName) : d.FirstName != null ? String(d.FirstName) : '';
  const ln = d.lastName != null ? String(d.lastName) : d.LastName != null ? String(d.LastName) : '';
  const s = `${fn} ${ln}`.trim();
  return s || 'k6 client';
}

function clientBirthDateIsoFromModel(modelRaw) {
  const d = modelRaw && (modelRaw.clientDetails || modelRaw.ClientDetails);
  if (!d) return '1985-06-15T00:00:00.000Z';
  const bd = d.birthDate != null ? d.birthDate : d.BirthDate;
  if (bd == null) return '1985-06-15T00:00:00.000Z';
  if (typeof bd === 'string') return bd;
  try {
    return new Date(bd).toISOString();
  } catch {
    return '1985-06-15T00:00:00.000Z';
  }
}

function buildCashflowBody({ clientId, clientName, advisorSub, advisorName, planName, clientBirthDateIso }) {
  return {
    name: planName,
    planDuration: 40,
    inflationRate: 2.5,
    description: `k6 events post-delete after plan ${planName}`,
    clientBirthDate: clientBirthDateIso,
    client: {
      id: clientId,
      name: clientName,
    },
    financialAdvisor: {
      advisorId: advisorSub,
      advisorName: advisorName || 'k6 advisor',
    },
  };
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
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email;
  return { accessToken, advisorSub, advisorName };
}

function abortTest(msg) {
  exec.test.abort(`[${SCRIPT_TAG}] ${msg}`);
}

function cleanupPlanAndClient(base, hdrs, cashflowId, clientId) {
  if (cashflowId) {
    http.del(`${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}`, null, {
      headers: hdrs,
      tags: { name: 'events_epd_teardown_cleanup_cf' },
      timeout: HTTP_TIMEOUT,
    });
  }
  if (clientId) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'events_epd_teardown_cleanup_client' },
      timeout: HTTP_TIMEOUT,
    });
  }
}

/** Per-VU seed state (filled on first iteration, read by later iterations). */
function getSeedStore() {
  if (!globalThis.__k6EpdSeedByVu) {
    globalThis.__k6EpdSeedByVu = {};
  }
  return globalThis.__k6EpdSeedByVu;
}

/**
 * First-time per VU: login → client → cashflow → POST+DELETE probe. All VUs run this concurrently on iteration 0.
 * @returns {{ token: string, email: string, seededClientId: string, seededCashflowId: string }}
 */
function seedVuIfNeeded(base, vuKey, idx, runTag) {
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

  const { accessToken, advisorSub, advisorName } = ctx;
  const hdrs = apiHeaders(accessToken);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6epd-${runTag}-vu${vuKey}`;
  const clientEmail = `k6epd.${uniqueTag}.${idx}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const resClient = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'events_epd_seed_create_client' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededClientId, model: clientModel } = parseClientCreateResponse(resClient);
  if (relaxClientProfileModule && isClientProfileModuleNotActive402(resClient)) {
    abortTest(
      `seed: 402 client_profile VU ${vuKey} (${row.email}). Enable module or fix subscription (RELAX_CLIENT_PROFILE_MODULE does not create a client here).`,
    );
  }
  if (!createHttpAccepted(resClient.status, seededClientId) || !seededClientId || !clientModel) {
    abortTest(`seed: client create failed VU ${vuKey} (${row.email}) HTTP ${resClient.status}`);
  }

  const cname = clientDisplayNameFromModel(clientModel);
  const birthIso = clientBirthDateIsoFromModel(clientModel);
  const planName = `k6-epd-plan-${uniqueTag}`.slice(0, 120);
  const cfBody = buildCashflowBody({
    clientId: seededClientId,
    clientName: cname,
    advisorSub,
    advisorName,
    planName,
    clientBirthDateIso: birthIso,
  });
  const resCf = http.post(`${base}/api/v1/cashflows`, JSON.stringify(cfBody), {
    headers: hdrs,
    tags: { name: 'events_epd_seed_create_cashflow' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededCashflowId } = parseCashflowCreateResponse(resCf);
  if (relaxCashflowModule && isCashflowModuleNotActive402(resCf)) {
    cleanupPlanAndClient(base, hdrs, null, seededClientId);
    abortTest(
      `seed: 402 cashflow VU ${vuKey} (${row.email}). Enable cashflow module or fix subscription (RELAX_CASHFLOW_MODULE does not seed a plan here).`,
    );
  }
  if (!createHttpAccepted(resCf.status, seededCashflowId) || !seededCashflowId) {
    cleanupPlanAndClient(base, hdrs, null, seededClientId);
    abortTest(`seed: cashflow create failed VU ${vuKey} (${row.email}) HTTP ${resCf.status}`);
  }

  const resEvDef = http.get(`${base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'events_epd_seed_default' },
    timeout: HTTP_TIMEOUT,
  });
  if (relaxGoalsModule && isGoalsModuleNotActive402(resEvDef)) {
    cleanupPlanAndClient(base, hdrs, seededCashflowId, seededClientId);
    abortTest(`seed: 402 goals GET Events/default VU ${vuKey} (${row.email}).`);
  }
  if (!((resEvDef.status === 200 && Array.isArray(resEvDef.json())) || resEvDef.status === 204)) {
    cleanupPlanAndClient(base, hdrs, seededCashflowId, seededClientId);
    abortTest(`seed: GET Events/default failed VU ${vuKey} (${row.email}) HTTP ${resEvDef.status}`);
  }

  const resEvCust = http.get(`${base}/api/v1/Events/custom`, {
    headers: hdrs,
    tags: { name: 'events_epd_seed_custom' },
    timeout: HTTP_TIMEOUT,
  });
  if (relaxGoalsModule && isGoalsModuleNotActive402(resEvCust)) {
    cleanupPlanAndClient(base, hdrs, seededCashflowId, seededClientId);
    abortTest(`seed: 402 goals GET Events/custom VU ${vuKey} (${row.email}).`);
  }
  if (resEvCust.status !== 200) {
    cleanupPlanAndClient(base, hdrs, seededCashflowId, seededClientId);
    abortTest(`seed: GET Events/custom failed VU ${vuKey} (${row.email}) HTTP ${resEvCust.status}`);
  }

  const entry = {
    email: row.email,
    token: accessToken,
    seededClientId,
    seededCashflowId,
  };
  store[vuKey] = entry;
  console.log(
    `[${SCRIPT_TAG}] seed VU ${vuKey} ok: ${row.email} cashflowId=${seededCashflowId} clientId=${seededClientId}`,
  );
  return entry;
}

export function setup() {
  const n = LIFECYCLE_USERS.length;
  const runTag = `r${Date.now()}`;
  console.log(
    `[${SCRIPT_TAG}] ${n} user(s) → ${n} VUs (no POST /Events) | runTag=${runTag} | DURATION=${DURATION}${DURATION_FROM_ENV ? ' (-e DURATION)' : ' (default)'} | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );
  return { base: API_BASE, runTag };
}

export function teardown(data) {
  const base = data && data.base ? data.base : API_BASE;
  const runTag = data && data.runTag ? data.runTag : '';
  if (!runTag) return;
  const needle = `k6epd-${runTag}`;
  for (let idx = 0; idx < LIFECYCLE_USERS.length; idx++) {
    const row = LIFECYCLE_USERS[idx];
    const ctx = loginUserContext(row);
    if (!ctx) continue;
    const hdrs = apiHeaders(ctx.accessToken);
    deleteClientsAndPlansByLastNameNeedle(base, hdrs, ctx.advisorSub, needle, HTTP_TIMEOUT, {
      list: 'events_epd_teardown_list',
      cfList: 'events_epd_teardown_cf_list',
      delCf: 'events_epd_teardown_delete_cashflow',
      delClient: 'events_epd_teardown_delete_client',
    });
  }
  delete globalThis.__k6EpdSeedByVu;
}

export const options = {
  scenarios: {
    events_after_plan_goals_get: {
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
  const runTag = data && data.runTag ? data.runTag : '';
  if (!runTag) {
    abortTest('internal: setup missing runTag.');
  }
  const idx = __VU - 1;
  const vuKey = __VU;
  const e = seedVuIfNeeded(base, vuKey, idx, runTag);
  if (!e || !e.token || !e.seededClientId || !e.seededCashflowId) {
    console.error(`[${SCRIPT_TAG}] VU ${vuKey} (index ${idx}): seed incomplete.`);
    return;
  }

  const hdrs = apiHeaders(e.token);

  const resDef = http.get(`${base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'events_epd_default_get' },
    timeout: HTTP_TIMEOUT,
  });
  check(resDef, {
    [`GET Events/default (after plan) vu${__VU} (${e.email})`]: (r) =>
      (r.status === 200 && Array.isArray(r.json())) || r.status === 204,
  });

  const resCust = http.get(`${base}/api/v1/Events/custom`, {
    headers: hdrs,
    tags: { name: 'events_epd_custom_get' },
    timeout: HTTP_TIMEOUT,
  });
  check(resCust, {
    [`GET Events/custom (after plan) vu${__VU} (${e.email}): 200`]: (r) => r.status === 200,
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  moduleName: 'events-post-delete-after-plan',
  sliceId: 'k6-events-post-delete-after-plan-load',
});
