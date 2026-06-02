/**
 * Load test **GET /api/v1/cashflows/{cashflowId}/timelines/financing** — timeline **plus** linked financial lines (`TimelineResponseModel`).
 *
 * Same pattern as **`k6/cashflows-timeline/k6-cashflows-timelines-load.js`**: **`setup()`** logs + **`runTag`**; **first iteration per VU** seeds (concurrent); **`teardown()`** uses **`lib/k6-load-cleanup.js`** (needle **`k6tlf-${runTag}`**).
 * **`constant-vus`**, **`vus` = row count**. **`DURATION`** (default **20s**).
 *
 * Optional **`-e LIFECYCLE_MAX_USERS=N`**. Needs **`client_profile`**, **`cashflow`**, **`goals`**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" k6/cashflows-timeline/k6-cashflows-timelines-financing-load.js
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
import { teardownTimeoutOption } from '../../lib/k6-teardown-timeout.js';
import { observeHttp } from '../../lib/k6-http-observe.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';

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

const SCRIPT_TAG = 'k6-cashflows-timelines-financing-load';

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

function resolvedRepoLifecycleUsersPath() {
  try {
    return String(import.meta.resolve('../../lifecycle-users.json'));
  } catch {
    return '';
  }
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
const SCENARIO_VUS = scenarioVusForPool(LIFECYCLE_USERS.length, 'k6-cashflows-timelines-financing-load');

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
    description: `k6 timelines financing load ${planName}`,
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

/** `TimelineResponseModel`: nested `timeline` + optional `financialRecords` array. */
function financingTimelineResponseMatchesSeed(res, cashflowId, clientId) {
  if (res.status !== 200) return false;
  try {
    const j = res.json();
    const tl = j && (j.timeline || j.Timeline);
    if (!tl || typeof tl !== 'object') return false;
    const cf = tl.cashflow || tl.Cashflow;
    const cfId = cf && (cf.id != null ? cf.id : cf.Id);
    const cl = tl.client || tl.Client;
    const clId = cl && (cl.id != null ? cl.id : cl.Id);
    if (
      cfId == null ||
      clId == null ||
      String(cfId).trim() !== String(cashflowId).trim() ||
      String(clId).trim() !== String(clientId).trim()
    ) {
      return false;
    }
    const fr = j.financialRecords != null ? j.financialRecords : j.FinancialRecords;
    if (fr == null) return true;
    return Array.isArray(fr);
  } catch {
    return false;
  }
}

function abortTest(msg) {
  exec.test.abort(`[${SCRIPT_TAG}] ${msg}`);
}

function cleanupClientAndMaybeCashflow(base, hdrs, clientId, cashflowId) {
  if (cashflowId) {
    http.del(`${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}`, null, {
      headers: hdrs,
      tags: { name: 'cashflows_timelines_fin_seed_cleanup_cf' },
      timeout: HTTP_TIMEOUT,
    });
  }
  if (clientId) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'cashflows_timelines_fin_seed_cleanup_client' },
      timeout: HTTP_TIMEOUT,
    });
  }
}

function getSeedStore() {
  if (!globalThis.__k6CashflowsTimelinesFinSeedByVu) {
    globalThis.__k6CashflowsTimelinesFinSeedByVu = {};
  }
  return globalThis.__k6CashflowsTimelinesFinSeedByVu;
}

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
  const uniqueTag = `k6tlf-${runTag}-vu${vuKey}`;
  const clientEmail = `k6tlf.${uniqueTag}.${idx}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const resClient = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cashflows_timelines_fin_seed_create_client' },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(resClient, {
    endpoint: '/api/v1/Clients',
    method: 'POST',
    tagName: 'cashflows_timelines_fin_seed_create_client',
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
  const planName = `k6-tlf-${uniqueTag}`.slice(0, 120);
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
    tags: { name: 'cashflows_timelines_fin_seed_create_cashflow' },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(resCf, {
    endpoint: '/api/v1/cashflows',
    method: 'POST',
    tagName: 'cashflows_timelines_fin_seed_create_cashflow',
  });
  const { id: seededCashflowId } = parseCashflowCreateResponse(resCf);
  if (relaxCashflowModule && isCashflowModuleNotActive402(resCf)) {
    cleanupClientAndMaybeCashflow(base, hdrs, seededClientId, null);
    abortTest(
      `seed: 402 cashflow VU ${vuKey} (${row.email}). Enable cashflow module or fix subscription (RELAX_CASHFLOW_MODULE does not seed a plan here).`,
    );
  }
  if (!createHttpAccepted(resCf.status, seededCashflowId) || !seededCashflowId) {
    cleanupClientAndMaybeCashflow(base, hdrs, seededClientId, null);
    abortTest(`seed: cashflow create failed VU ${vuKey} (${row.email}) HTTP ${resCf.status}`);
  }

  const financingUrl = `${base}/api/v1/cashflows/${encodeURIComponent(seededCashflowId)}/timelines/financing`;
  const verify = http.get(financingUrl, {
    headers: hdrs,
    tags: { name: 'cashflows_timelines_fin_seed_verify' },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(verify, {
    endpoint: '/api/v1/cashflows/{cashflowId}/timelines/financing',
    method: 'GET',
    tagName: 'cashflows_timelines_fin_seed_verify',
  });
  if (relaxGoalsModule && isGoalsModuleNotActive402(verify)) {
    cleanupClientAndMaybeCashflow(base, hdrs, seededClientId, seededCashflowId);
    abortTest(
      `seed: 402 goals GET timelines/financing VU ${vuKey} (${row.email}). Enable Goals module or fix subscription (RELAX_GOALS_MODULE does not run this load test).`,
    );
  }
  if (!(verify.status === 200 && financingTimelineResponseMatchesSeed(verify, seededCashflowId, seededClientId))) {
    cleanupClientAndMaybeCashflow(base, hdrs, seededClientId, seededCashflowId);
    abortTest(
      `seed: GET timelines/financing verify failed VU ${vuKey} (${row.email}) HTTP ${verify.status} cashflowId=${seededCashflowId}`,
    );
  }

  const entry = {
    email: row.email,
    token: accessToken,
    seededClientId,
    seededCashflowId,
  };
  store[vuKey] = entry;
  console.log(`[${SCRIPT_TAG}] seed VU ${vuKey} ok: ${row.email} cashflowId=${seededCashflowId}`);
  return entry;
}

export function setup() {
  const n = LIFECYCLE_USERS.length;
  const runTag = `r${Date.now()}`;
  console.log(
    `[${SCRIPT_TAG}] ${n} user(s) → ${n} VUs (concurrent per-VU seed) | runTag=${runTag} | DURATION=${DURATION}${DURATION_FROM_ENV ? ' (-e DURATION)' : ' (default)'} | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );
  return { base: API_BASE, runTag };
}

export function teardown(data) {
  const base = data && data.base ? data.base : API_BASE;
  const runTag = data && data.runTag ? data.runTag : '';
  if (!runTag) return;
  const needle = `k6tlf-${runTag}`;
  for (let idx = 0; idx < LIFECYCLE_USERS.length; idx++) {
    const row = LIFECYCLE_USERS[idx];
    const ctx = loginUserContext(row);
    if (!ctx) continue;
    const hdrs = apiHeaders(ctx.accessToken);
    deleteClientsAndPlansByLastNameNeedle(base, hdrs, ctx.advisorSub, needle, HTTP_TIMEOUT, {
      list: 'cashflows_timelines_fin_teardown_list',
      cfList: 'cashflows_timelines_fin_teardown_cf_list',
      delCf: 'cashflows_timelines_fin_teardown_delete_cashflow',
      delClient: 'cashflows_timelines_fin_teardown_delete_client',
    });
  }
  delete globalThis.__k6CashflowsTimelinesFinSeedByVu;
}

export const options = {
  ...teardownTimeoutOption(LIFECYCLE_USERS.length),
  scenarios: {
    cashflows_timelines_financing_get: {
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
  const url = `${base}/api/v1/cashflows/${encodeURIComponent(e.seededCashflowId)}/timelines/financing`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'cashflows_timelines_financing_get', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(res, {
    endpoint: '/api/v1/cashflows/{cashflowId}/timelines/financing',
    method: 'GET',
    tagName: 'cashflows_timelines_financing_get',
  });

  check(res, {
    [`timelines/financing vu${__VU} (${e.email}): GET 200`]: (r) => r.status === 200,
  });
  check(res, {
    [`timelines/financing vu${__VU}: body matches seed`]: (r) =>
      financingTimelineResponseMatchesSeed(r, e.seededCashflowId, e.seededClientId),
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  scriptTag: SCRIPT_TAG,
  moduleName: (__ENV.MODULE_NAME || 'timeline-financing').trim(),
  reportSubdir: 'k6/cashflows-timeline/reports',
});
