/**
 * Shared helpers for **cashflows → income** screen load tests (`/cashflows/{id}/income`).
 * Imports existing repo **`lib/`** only; does not modify them.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { recordAdaptiveHttp, adaptiveConfigFromEnv, initAdaptiveMonitor } from '../../lib/adaptive-throttle-monitor.js';
import {
  recordApiPerformance,
  perfConfigFromEnv,
  registerPerfVuSession,
} from '../../lib/api-performance-collector.js';
import { attachPerfSliceToSummary } from '../../lib/k6-perf-integration.js';
import {
  buildAdaptiveLatencyReport,
  attachAdaptiveReportsToSummary,
  defaultAdaptiveReportPaths,
} from '../../lib/api-latency-reporter.js';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';

export const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
export const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
export const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
export const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
export const LIFECYCLE_MAX_USERS_RAW = (__ENV.LIFECYCLE_MAX_USERS || '').trim();
export const DURATION = (__ENV.DURATION || '20s').trim();
export const THINK_SEC = parseFloat((__ENV.THINK_SEC || '0').trim() || '0');

/** Optional: use an existing cashflow (e.g. from UI URL); skips per-VU seed. All VUs use lifecycle row 0 token. */
export const SHARED_CASHFLOW_ID = (__ENV.SHARED_CASHFLOW_ID || '').trim();

export function assertDevIdentityHost(base, scriptTag) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[${scriptTag}] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

export function assertApiBase(base, scriptTag) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[${scriptTag}] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`);
}

export function normalizeLifecycleRow(r, idx, scriptTag) {
  const em = r && String(r.email || '').trim();
  let tok = r && String(r.token || '').trim();
  if (tok && /^bearer\s+/i.test(tok)) {
    tok = tok.replace(/^bearer\s+/i, '').trim();
  }
  const pw = r && String(r.password || '').trim();
  if (!em) {
    throw new Error(`[${scriptTag}] Row ${idx}: missing "email".`);
  }
  if (!tok && !pw) {
    throw new Error(`[${scriptTag}] Row ${idx}: need "token" and/or "password".`);
  }
  if (tok) {
    const parts = tok.split('.');
    if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
      throw new Error(`[${scriptTag}] Row ${idx}: "token" must be a JWT (three segments).`);
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

function openLifecycleUsersRaw(scriptTag) {
  const rawEnv = (__ENV.LIFECYCLE_USERS_FILE || '').trim();
  const resolvedDefault = resolvedRepoLifecycleUsersPath();
  const candidates = [];
  if (rawEnv) {
    candidates.push(rawEnv);
  }
  if (resolvedDefault) {
    candidates.push(resolvedDefault);
  }
  if (!rawEnv) {
    candidates.push('lifecycle-users.json', '../../lifecycle-users.json');
  }
  const errors = [];
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    if (!p) continue;
    try {
      return { raw: open(p), path: p };
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : String(e);
      errors.push(`${p}: ${msg}`);
    }
  }
  throw new Error(
    `[${scriptTag}] Cannot read lifecycle users. Tried:\n  - ${errors.join(
      '\n  - ',
    )}\nSet LIFECYCLE_USERS_FILE or run from load-testing-k6/ with lifecycle-users.json present.`,
  );
}

export function readAllLifecycleUsersAtInit(scriptTag) {
  const arr = loadLifecycleUsers();
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(
      `[${scriptTag}] lifecycle-users / pool slice must be a non-empty array (USE_USER_POOL=1 + POOL_SLICE_FILE for leased pool).`,
    );
  }
  const ropcClientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const rows = [];
  for (let i = 0; i < arr.length; i++) {
    rows.push(normalizeLifecycleRow(arr[i], i, scriptTag));
  }
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].token && !ropcClientId) {
      throw new Error(
        `[${scriptTag}] Row ${i} has password but no token — set SIGNUP_ROPC_CLIENT_ID (and secret if confidential) for ROPC.`,
      );
    }
  }
  let use = rows;
  if (LIFECYCLE_MAX_USERS_RAW) {
    const cap = Math.max(1, parseInt(LIFECYCLE_MAX_USERS_RAW, 10));
    if (!Number.isFinite(cap)) {
      throw new Error(`[${scriptTag}] LIFECYCLE_MAX_USERS must be a positive integer.`);
    }
    use = rows.slice(0, cap);
    if (use.length === 0) {
      throw new Error(`[${scriptTag}] LIFECYCLE_MAX_USERS=${cap} left no users.`);
    }
  }
  return use;
}

export function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

export function trimResBody(res, maxLen) {
  const lim = maxLen != null ? maxLen : 4000;
  if (!res || res.body == null) return '';
  const s = String(res.body);
  return s.length > lim ? `${s.slice(0, lim)}…[trimmed ${s.length - lim}]` : s;
}

export function logHttpError(apiName, res) {
  const st = res && res.status != null ? res.status : '?';
  if (res && res.status === 0) {
    // k6 often reports **0** when the iteration stops during **gracefulStop**; logging each one floods the console.
    if (['1', 'true', 'yes'].includes((__ENV.LOG_HTTP0_ERRORS || '').trim().toLowerCase())) {
      console.error(
        `[${apiName}] HTTP 0 (no response; often k6 graceful stop or an aborted iteration)`,
      );
    }
    return;
  }
  const b = trimResBody(res);
  console.error(`[${apiName}] HTTP ${st}\n${b}`);
}

export function createHttpAccepted(status, id) {
  if (status === 201) return true;
  if (status === 200) return !!id;
  return false;
}

export function isClientProfileModuleNotActive402(res) {
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

export function isCashflowModuleNotActive402(res) {
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

export function parseCashflowCreateResponse(res) {
  if (res.status !== 201 && res.status !== 200) return { id: null };
  try {
    const j = res.json();
    const id = j && (j.Id != null ? j.Id : j.id);
    return { id: typeof id === 'string' && id.length > 0 ? id : null };
  } catch {
    return { id: null };
  }
}

export function clientDisplayNameFromModel(modelRaw) {
  const d = modelRaw && (modelRaw.clientDetails || modelRaw.ClientDetails);
  if (!d) return 'k6 client';
  const fn = d.firstName != null ? String(d.firstName) : d.FirstName != null ? String(d.FirstName) : '';
  const ln = d.lastName != null ? String(d.lastName) : d.LastName != null ? String(d.LastName) : '';
  const s = `${fn} ${ln}`.trim();
  return s || 'Load test client';
}

export function clientBirthDateIsoFromModel(modelRaw) {
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

export function buildCashflowBody({ clientId, clientName, advisorSub, advisorName, planName, clientBirthDateIso }) {
  return {
    name: planName,
    planDuration: 40,
    inflationRate: 2.5,
    description: `Cashflow plan for automated income screen load testing: ${planName}`,
    clientBirthDate: clientBirthDateIso,
    client: {
      id: clientId,
      name: clientName,
    },
    financialAdvisor: {
      advisorId: advisorSub,
      advisorName: advisorName || 'Advisor (load test account)',
    },
  };
}

/**
 * Human-readable income/expense line description for POST bodies; `stablePrefix` is a substring of `descFull`
 * so resolve/cleanup matchers keep working.
 * @param {string} label Short phrase, e.g. `"Income load test"`
 * @param {string} runTag
 * @param {number} vu
 * @param {number} iter
 */
export function buildLoadTestLineNeedles(label, runTag, vu, iter) {
  const rt = runTag != null && String(runTag).trim() !== '' ? String(runTag).trim() : 'run';
  const stablePrefix = `${label} ${rt} user ${vu} line ${iter}`;
  const descFull = `${stablePrefix} ${Date.now()}`;
  return { stablePrefix, descFull };
}

export function loginUserContext(row, scriptTag) {
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
    console.error(`[${scriptTag}] No advisor id for ${row.email}.`);
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email;
  return { accessToken, advisorSub, advisorName };
}

function cleanupClientAndMaybeCashflow(base, hdrs, clientId, cashflowId) {
  if (cashflowId) {
    http.del(`${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}`, null, {
      headers: hdrs,
      tags: { name: 'cf_income_seed_cleanup_cf' },
      timeout: HTTP_TIMEOUT,
    });
  }
  if (clientId) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'cf_income_seed_cleanup_client' },
      timeout: HTTP_TIMEOUT,
    });
  }
}

function getSeedStore(globalKey) {
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = {};
  }
  return globalThis[globalKey];
}

/**
 * Minimal **FinancialRecordLineItem** (see `FinancialRecordLineItem` / `NetAmount` / `AgeYear` in API Swagger).
 */
export function buildMinimalIncomeLineItem(p) {
  const desc = p.description;
  const amountVal = p.amount != null ? p.amount : 1200;
  const startAge = p.startAge != null ? p.startAge : 30;
  const startYear = p.startYear != null ? p.startYear : new Date().getFullYear();
  const endAge = p.endAge != null ? p.endAge : 65;
  const endYear = p.endYear != null ? p.endYear : startYear + 35;
  const line = {
    description: desc,
    amount: { amount: amountVal, currencySymbol: '€' },
    start: { age: startAge, year: startYear },
    end: { age: endAge, year: endYear },
    isCash: false,
    isFinance: false,
    isDefault: false,
    isIncomeExpenseSource: false,
    isDisplayOnly: false,
  };
  if (p.id != null && String(p.id).trim() !== '') {
    line.id = String(p.id).trim();
  }
  return line;
}

/**
 * Full **income** line object as returned by **GET …/income-expense/financial** (for PUT round-trip).
 * Matchers: tried in order; scans **newest-first** in **`incomes`**.
 * @returns {object|null}
 */
export function findLastIncomeRowById(res, incomeId) {
  if (res.status !== 200 || incomeId == null || String(incomeId).trim() === '') return null;
  const want = String(incomeId).trim();
  try {
    const j = res.json();
    const incomes = j && (j.incomes != null ? j.incomes : j.Incomes);
    if (!Array.isArray(incomes)) return null;
    for (let i = incomes.length - 1; i >= 0; i--) {
      const row = incomes[i];
      const rid = row && (row.id != null ? row.id : row.Id);
      if (rid != null && String(rid).trim() === want) {
        try {
          return JSON.parse(JSON.stringify(row));
        } catch {
          return Object.assign({}, row);
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function findLastIncomeRowMatchingAnySubstring(res, matchers) {
  if (res.status !== 200) return null;
  const ms = (matchers || []).filter((x) => x != null && String(x).trim() !== '');
  if (ms.length === 0) return null;
  try {
    const j = res.json();
    const incomes = j && (j.incomes != null ? j.incomes : j.Incomes);
    if (!Array.isArray(incomes)) return null;
    for (let mi = 0; mi < ms.length; mi++) {
      const sub = String(ms[mi]);
      for (let i = incomes.length - 1; i >= 0; i--) {
        const row = incomes[i];
        const d = row && (row.description != null ? row.description : row.Description);
        const id = row && (row.id != null ? row.id : row.Id);
        if (id == null || !String(id).trim()) continue;
        if (d == null) continue;
        const ds = String(d);
        if (ds.includes(sub)) {
          try {
            return JSON.parse(JSON.stringify(row));
          } catch {
            return Object.assign({}, row);
          }
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function parseLastIncomeMatchingAnySubstring(res, matchers) {
  const full = findLastIncomeRowMatchingAnySubstring(res, matchers);
  if (!full) return null;
  const d = full.description != null ? full.description : full.Description;
  const id = full.id != null ? full.id : full.Id;
  if (id == null || d == null) return null;
  return { id: String(id).trim(), description: String(d) };
}

/**
 * Clone server income row and set **amount** (camel or Pascal **amount** payload).
 */
export function incomeRowWithUpdatedAmount(row, newAmount) {
  let body;
  try {
    body = JSON.parse(JSON.stringify(row));
  } catch {
    body = Object.assign({}, row);
  }
  const amt = body.amount != null ? body.amount : body.Amount;
  if (amt && typeof amt === 'object') {
    if ('amount' in amt) amt.amount = newAmount;
    if ('Amount' in amt) amt.Amount = newAmount;
  } else {
    body.amount = { amount: newAmount, currencySymbol: '€' };
  }
  return body;
}

/**
 * API entity **`IsParent`** / **`ParentId`** are **strings**; some JSON responses use booleans.
 * Mutates **`body`** in place (a clone from **`incomeRowWithUpdatedAmount`**).
 */
export function normalizeIncomeLineCloneForPutApi(body) {
  if (!body || typeof body !== 'object') return body;
  const boolToStr = (v) => (v ? 'true' : 'false');
  if (typeof body.isParent === 'boolean') body.isParent = boolToStr(body.isParent);
  if (typeof body.IsParent === 'boolean') body.IsParent = boolToStr(body.IsParent);
  if (body.parentId != null && typeof body.parentId !== 'string') body.parentId = String(body.parentId);
  if (body.ParentId != null && typeof body.ParentId !== 'string') body.ParentId = String(body.ParentId);
  return body;
}

/**
 * **PUT** fallback: minimal **`FinancialRecordLineItem`** built from an **income-expense** row (camel or Pascal fields).
 */
export function buildMinimalIncomeLineItemFromIeRow(row, newAmount) {
  if (!row || typeof row !== 'object') return null;
  const id = row.id != null ? String(row.id).trim() : row.Id != null ? String(row.Id).trim() : '';
  if (!id) return null;
  const desc = row.description != null ? row.description : row.Description;
  const st = row.start != null ? row.start : row.Start;
  const en = row.end != null ? row.end : row.End;
  const startAge =
    st != null && (st.age != null || st.Age != null) ? (st.age != null ? st.age : st.Age) : 30;
  const startYear =
    st != null && (st.year != null || st.Year != null)
      ? st.year != null
        ? st.year
        : st.Year
      : new Date().getFullYear();
  const endAge = en != null && (en.age != null || en.Age != null) ? (en.age != null ? en.age : en.Age) : 65;
  const endYear =
    en != null && (en.year != null || en.Year != null)
      ? en.year != null
        ? en.year
        : en.Year
      : startYear + 35;
  return buildMinimalIncomeLineItem({
    id,
    description: desc != null ? String(desc) : '',
    amount: newAmount,
    startAge,
    startYear,
    endAge,
    endYear,
  });
}

export function parseFirstIncomeIdMatchingDescription(res, needle) {
  const row = parseLastIncomeMatchingAnySubstring(res, [needle]);
  return row ? row.id : null;
}

const DEFAULT_INCOME_RESOLVE_ATTEMPTS = Math.max(
  1,
  parseInt((__ENV.INCOME_LINE_RESOLVE_MAX_ATTEMPTS || '10').trim(), 10) || 10,
);

/**
 * After **POST** income, resolve **`id`**, **`description`**, and optional **`fullRow`** for PUT/DELETE.
 * Tries **POST body** first, then **GET …/income-expense/financial** with small sleeps (read-after-write).
 *
 * **`fullRow`**: clone of the matched list item when available (GET list may omit **`description`**; callers can still PUT using **`id`** lookup via **`findLastIncomeRowById`**).
 */
export function resolveIncomeLineAfterPost(p) {
  const {
    postRes,
    base,
    hdrs,
    cashflowId,
    needle,
    stablePrefix,
    maxAttempts = DEFAULT_INCOME_RESOLVE_ATTEMPTS,
    tagName = 'cf_income_resolve_line_get',
    vuTag = '',
  } = p;
  const matchers = [];
  if (needle && String(needle).trim()) matchers.push(String(needle).trim());
  if (stablePrefix && String(stablePrefix).trim() && String(stablePrefix).trim() !== String(needle).trim()) {
    matchers.push(String(stablePrefix).trim());
  }

  function packFromRes(res) {
    if (res.status !== 200) return null;
    let fullRow = findLastIncomeRowMatchingAnySubstring(res, matchers);
    const summary = parseLastIncomeMatchingAnySubstring(res, matchers);
    if (summary && !fullRow) {
      fullRow = findLastIncomeRowById(res, summary.id);
    }
    if (summary) {
      return { id: summary.id, description: summary.description, fullRow: fullRow || null };
    }
    try {
      const j = res.json();
      const rid = j && (j.id != null ? j.id : j.incomeId != null ? j.incomeId : j.Id);
      const sid = rid != null ? String(rid).trim() : '';
      if (sid) {
        const byId = findLastIncomeRowById(res, sid);
        const d0 = byId ? (byId.description != null ? byId.description : byId.Description) : null;
        const needle = matchers[0] || matchers[1] || '';
        return {
          id: sid,
          description: d0 != null ? String(d0) : String(needle || ''),
          fullRow: byId || null,
        };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  const fromPost = packFromRes(postRes);
  if (fromPost) return fromPost;

  const getUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/income-expense/financial`;
  for (let a = 0; a < maxAttempts; a++) {
    sleep(0.04 + a * 0.035);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: tagName, vu: vuTag },
      timeout: HTTP_TIMEOUT,
    });
    const packed = packFromRes(g);
    if (packed) return packed;
  }
  return null;
}

/** GET-only retries (e.g. cleanup after PUT when POST body is not available). */
export function resolveIncomeLineByGetOnly(p) {
  const {
    base,
    hdrs,
    cashflowId,
    matchers,
    maxAttempts = DEFAULT_INCOME_RESOLVE_ATTEMPTS,
    tagName = 'cf_income_cleanup_get',
    vuTag = '',
  } = p;
  const ms = (matchers || []).filter((x) => x != null && String(x).trim() !== '');
  if (ms.length === 0) return null;
  const getUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/income-expense/financial`;
  for (let a = 0; a < maxAttempts; a++) {
    sleep(0.04 + a * 0.035);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: tagName, vu: vuTag },
      timeout: HTTP_TIMEOUT,
    });
    const found = parseLastIncomeMatchingAnySubstring(g, ms);
    if (found) return found;
  }
  return null;
}

export function abortTest(scriptTag, msg) {
  exec.test.abort(`[${scriptTag}] ${msg}`);
}

/**
 * Per-VU seed: client + cashflow (same pattern as **`k6/cashflows-timeline/k6-cashflows-timelines-load.js`**).
 * @param {object} p
 * @param {string} p.base API base
 * @param {number} p.vuKey __VU
 * @param {number} p.idx __VU - 1
 * @param {string} p.runTag
 * @param {object[]} p.lifecycleUsers
 * @param {string} p.scriptTag
 * @param {string} p.globalKey globalThis key for cache
 */
export function seedCashflowForVu(p) {
  const { base, vuKey, idx, runTag, lifecycleUsers, scriptTag, globalKey } = p;
  const store = getSeedStore(globalKey);
  if (store[vuKey]) {
    return store[vuKey];
  }

  const row = lifecycleUsers[idx];
  if (!row) {
    abortTest(scriptTag, `seed: no lifecycle row for VU ${vuKey} index ${idx}.`);
  }

  const ctx = loginUserContext(row, scriptTag);
  if (!ctx) {
    abortTest(scriptTag, `seed: login failed VU ${vuKey} (${row.email}).`);
  }

  const { accessToken, advisorSub, advisorName } = ctx;
  const hdrs = apiHeaders(accessToken);
  const uniqueTag = `k6ci-${runTag}-vu${vuKey}`;
  /** VU 1 uses the requested mailbox; further VUs use Gmail `+` aliases to the same inbox. */
  const clientEmail =
    vuKey === 1 ? 'testing@gmail.com' : `testing+vu${vuKey}@gmail.com`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
    clientFirstName: 'load',
    clientLastNameBase: 'testing',
  });
  const resClient = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'cf_income_seed_create_client' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededClientId, model: clientModel } = parseClientCreateResponse(resClient);
  if (isClientProfileModuleNotActive402(resClient)) {
    abortTest(
      scriptTag,
      `seed: 402 client_profile VU ${vuKey} (${row.email}). Enable module or set RELAX_CLIENT_PROFILE_MODULE=1 after adjusting seed (not applied here).`,
    );
  }
  if (!createHttpAccepted(resClient.status, seededClientId) || !seededClientId || !clientModel) {
    abortTest(scriptTag, `seed: client create failed VU ${vuKey} (${row.email}) HTTP ${resClient.status}`);
  }

  const cname = clientDisplayNameFromModel(clientModel);
  const birthIso = clientBirthDateIsoFromModel(clientModel);
  const planName = `Income load test plan ${uniqueTag}`.slice(0, 120);
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
    tags: { name: 'cf_income_seed_create_cashflow' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededCashflowId } = parseCashflowCreateResponse(resCf);
  if (isCashflowModuleNotActive402(resCf)) {
    cleanupClientAndMaybeCashflow(base, hdrs, seededClientId, null);
    abortTest(
      scriptTag,
      `seed: 402 cashflow VU ${vuKey} (${row.email}). Enable cashflow module.`,
    );
  }
  if (!createHttpAccepted(resCf.status, seededCashflowId) || !seededCashflowId) {
    cleanupClientAndMaybeCashflow(base, hdrs, seededClientId, null);
    abortTest(scriptTag, `seed: cashflow create failed VU ${vuKey} (${row.email}) HTTP ${resCf.status}`);
  }

  const entry = {
    email: row.email,
    token: accessToken,
    advisorSub,
    seededClientId,
    seededCashflowId,
  };
  store[vuKey] = entry;
  registerPerfVuSession(vuKey, {
    userEmail: row.email,
    email: row.email,
    advisorId: advisorSub,
    clientId: seededClientId,
    cashflowId: seededCashflowId,
  });
  console.log(`[${scriptTag}] seed VU ${vuKey} ok: ${row.email} cashflowId=${seededCashflowId}`);
  return entry;
}

export function sharedCashflowContext(lifecycleUsers, scriptTag) {
  const row = lifecycleUsers[0];
  if (!row) abortTest(scriptTag, 'SHARED_CASHFLOW_ID: no lifecycle users.');
  const ctx = loginUserContext(row, scriptTag);
  if (!ctx) abortTest(scriptTag, 'SHARED_CASHFLOW_ID: login failed row 0.');
  return {
    email: row.email,
    token: ctx.accessToken,
    advisorSub: ctx.advisorSub,
    seededClientId: '',
    seededCashflowId: SHARED_CASHFLOW_ID,
  };
}

export function getVuEntry(base, runTag, vuKey, idx, lifecycleUsers, scriptTag, globalKey) {
  if (SHARED_CASHFLOW_ID) {
    return sharedCashflowContext(lifecycleUsers, scriptTag);
  }
  return seedCashflowForVu({
    base,
    vuKey,
    idx,
    runTag,
    lifecycleUsers,
    scriptTag,
    globalKey,
  });
}

export function teardownByNeedle(scriptTag, base, runTag, lifecycleUsers) {
  if (!runTag || SHARED_CASHFLOW_ID) return;
  const needle = `k6ci-${runTag}`;
  for (let idx = 0; idx < lifecycleUsers.length; idx++) {
    const row = lifecycleUsers[idx];
    const ctx = loginUserContext(row, scriptTag);
    if (!ctx) continue;
    const hdrs = apiHeaders(ctx.accessToken);
    deleteClientsAndPlansByLastNameNeedle(base, hdrs, ctx.advisorSub, needle, HTTP_TIMEOUT, {
      list: 'cf_income_teardown_list',
      cfList: 'cf_income_teardown_cf_list',
      delCf: 'cf_income_teardown_delete_cashflow',
      delClient: 'cf_income_teardown_delete_client',
    });
  }
}

export function deleteGlobalSeed(globalKey) {
  try {
    delete globalThis[globalKey];
  } catch {
    /* ignore */
  }
}

/**
 * @param {import('k6/metrics').Trend} durTrend
 * @param {import('k6/metrics').Counter} errCounter
 * @param {import('k6/metrics').Counter} okCounter
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {number} expectedStatus
 * @param {string} apiName
 * @param {import('k6/metrics').Counter} [errByStatusCounter] optional tagged **`{ code: status }`** for JSON reports
 */
export function recordOutcome(durTrend, errCounter, okCounter, res, expectedStatus, apiName, errByStatusCounter) {
  const ms = res && res.timings && res.timings.duration != null ? res.timings.duration : 0;
  durTrend.add(ms);
  const ok = res && res.status === expectedStatus;
  check(res, {
    [`${apiName}: status ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
  if (ok) {
    okCounter.add(1);
  } else {
    errCounter.add(1);
    if (errByStatusCounter && res != null && res.status != null) {
      errByStatusCounter.add(1, { code: String(res.status) });
    }
    logHttpError(apiName, res);
  }
  if (adaptiveConfigFromEnv().enabled) {
    recordAdaptiveHttp(res, {
      endpoint: apiName,
      method: (__ENV.ADAPTIVE_HTTP_METHOD || 'GET').trim(),
      tagName: apiName,
    });
  }
  if (perfConfigFromEnv().enabled) {
    recordApiPerformance(res, {
      endpoint: apiName,
      method: (__ENV.ADAPTIVE_HTTP_METHOD || 'GET').trim(),
      tagName: apiName,
      scenario: apiName,
    });
  }
  return ok;
}

export { initAdaptiveMonitor, adaptiveConfigFromEnv };

export function metricValuesForTrend(data, name) {
  const m = data.metrics[name];
  if (!m || !m.values) {
    return { avg: null, min: null, max: null, p95: null, med: null };
  }
  const v = m.values;
  return {
    avg: v.avg != null ? v.avg : null,
    min: v.min != null ? v.min : null,
    max: v.max != null ? v.max : null,
    p95: v['p(95)'] != null ? v['p(95)'] : null,
    med: v.med != null ? v.med : null,
  };
}

export function metricCount(data, name) {
  const m = data.metrics[name];
  if (!m || m.values == null) return 0;
  const c = m.values.count;
  return c != null ? c : 0;
}

/**
 * k6 **v2+** no longer exposes tagged Counter series as separate keys in **`handleSummary`** (only the aggregate count).
 * Use **distinct counters** from **`createHttpErrorBuckets`** so reports can still list HTTP classes.
 *
 * @param {{ metricName: string, label: string }[]} defs
 * @returns {string[]} e.g. **`HTTP 5xx: 12 failure(s)`**
 */
export function collectErrorBucketBreakdown(data, defs) {
  const rows = [];
  if (!data || !data.metrics || !defs) return rows;
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    if (!d || !d.metricName) continue;
    const c = metricCount(data, d.metricName);
    if (c > 0) rows.push({ label: d.label || d.metricName, c });
  }
  rows.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  return rows.map((r) => `${r.label}: ${r.c} failure(s)`);
}

/**
 * Fixed bucket counters for **`handleSummary`** JSON (k6 v2-safe). **`prefix`** must stay stable per API.
 * @param {object} [opts]
 * @param {boolean} [opts.lineResolve] increment for **resolveIncomeLineAfterPost** failure (no HTTP)
 * @param {boolean} [opts.prefetch] increment for list prefetch miss before PUT
 */
export function createHttpErrorBuckets(prefix, opts = {}) {
  const lineResolve = opts.lineResolve === true;
  const prefetch = opts.prefetch === true;
  const http5xx = new Counter(`${prefix}_http_5xx`);
  const http4xx = new Counter(`${prefix}_http_4xx`);
  const http3xx = new Counter(`${prefix}_http_3xx`);
  const http0 = new Counter(`${prefix}_http_0`);
  const other = new Counter(`${prefix}_other`);
  const buckets = { http5xx, http4xx, http3xx, http0, other };
  const defs = [
    { metricName: `${prefix}_http_5xx`, label: 'HTTP 5xx' },
    { metricName: `${prefix}_http_4xx`, label: 'HTTP 4xx' },
    { metricName: `${prefix}_http_3xx`, label: 'HTTP 3xx' },
    { metricName: `${prefix}_http_0`, label: 'HTTP 0' },
    { metricName: `${prefix}_other`, label: 'HTTP 1xx–2xx or unknown' },
  ];
  if (lineResolve) {
    buckets.line_resolve = new Counter(`${prefix}_line_resolve`);
    defs.push({ metricName: `${prefix}_line_resolve`, label: 'line_resolve' });
  }
  if (prefetch) {
    buckets.prefetch = new Counter(`${prefix}_prefetch`);
    defs.push({ metricName: `${prefix}_prefetch`, label: 'prefetch' });
  }
  return { buckets, defs };
}

/**
 * @param {object} buckets **`createHttpErrorBuckets(...).buckets`**
 * @param {number|string} codeOrClass HTTP status, **`'line_resolve'`**, **`'prefetch'`**, or **`'other'`**
 */
export function recordErrorInStatusBuckets(buckets, codeOrClass) {
  if (!buckets) return;
  if (codeOrClass === 'line_resolve' && buckets.line_resolve) {
    buckets.line_resolve.add(1);
    return;
  }
  if (codeOrClass === 'prefetch' && buckets.prefetch) {
    buckets.prefetch.add(1);
    return;
  }
  if (codeOrClass === 'other' || codeOrClass == null) {
    buckets.other.add(1);
    return;
  }
  const n = typeof codeOrClass === 'number' ? codeOrClass : parseInt(String(codeOrClass), 10);
  if (!Number.isFinite(n)) {
    buckets.other.add(1);
    return;
  }
  if (n === 0) buckets.http0.add(1);
  else if (n >= 500 && n < 600) buckets.http5xx.add(1);
  else if (n >= 400 && n < 500) buckets.http4xx.add(1);
  else if (n >= 300 && n < 400) buckets.http3xx.add(1);
  else buckets.other.add(1);
}

/**
 * Same as **`recordOutcome`**, but records failure class into **`createHttpErrorBuckets`** counters (k6 v2 **`handleSummary`**).
 * @param {number[]} [acceptableStatuses] if set (non-empty), **`res.status`** must be one of these (e.g. **`[200, 204]`** for Reports); otherwise **`expectedStatus`** alone is used.
 */
export function recordOutcomeWithBuckets(
  durTrend,
  errCounter,
  okCounter,
  res,
  expectedStatus,
  apiName,
  buckets,
  acceptableStatuses,
) {
  const ms = res && res.timings && res.timings.duration != null ? res.timings.duration : 0;
  durTrend.add(ms);
  const acceptable =
    Array.isArray(acceptableStatuses) && acceptableStatuses.length > 0
      ? acceptableStatuses
      : [expectedStatus];
  const ok = res && acceptable.indexOf(res.status) >= 0;
  const label = acceptable.length > 1 ? acceptable.join('|') : String(expectedStatus);
  check(res, {
    [`${apiName}: status ${label}`]: (r) => acceptable.indexOf(r.status) >= 0,
  });
  if (ok) {
    okCounter.add(1);
  } else {
    errCounter.add(1);
    if (buckets) {
      const st = res != null && res.status != null ? res.status : 'other';
      recordErrorInStatusBuckets(buckets, st);
    }
    logHttpError(apiName, res);
  }
  if (adaptiveConfigFromEnv().enabled) {
    recordAdaptiveHttp(res, {
      endpoint: apiName,
      method: (__ENV.ADAPTIVE_HTTP_METHOD || 'GET').trim(),
      tagName: apiName,
    });
  }
  if (perfConfigFromEnv().enabled) {
    recordApiPerformance(res, {
      endpoint: apiName,
      method: (__ENV.ADAPTIVE_HTTP_METHOD || 'GET').trim(),
      tagName: apiName,
      scenario: apiName,
    });
  }
  return ok;
}

/**
 * Reads k6 **tagged Counter** sub-metrics like **`prefix{code:500}`** from **`handleSummary`** data.
 * **Note:** k6 **v2+** may omit per-tag keys; prefer **`createHttpErrorBuckets`** + **`collectErrorBucketBreakdown`**.
 * @param {string} tagName tag key used in **`counter.add(1, { [tagName]: '404' })`** (default **`code`**)
 * @returns {string[]} lines such as **`HTTP 500: 3 failure(s)`** (numeric **`code`**) or **`prefetch: 2 failure(s)`** (non-HTTP classes)
 */
export function collectTaggedCounterBreakdown(data, prefix, tagName) {
  const tn = tagName != null && String(tagName).trim() !== '' ? String(tagName).trim() : 'code';
  const out = [];
  if (!data || !data.metrics || !prefix) return out;
  const tagOpen = `{${tn}:`;
  for (const k of Object.keys(data.metrics)) {
    if (!k.startsWith(prefix + tagOpen)) continue;
    const close = k.indexOf('}', prefix.length + tagOpen.length);
    if (close < 0) continue;
    const tagVal = k.slice(prefix.length + tagOpen.length, close);
    const cnt = metricCount(data, k);
    if (cnt > 0) {
      const code = String(tagVal).trim();
      const isNumericStatus = /^\d+$/.test(code);
      out.push(
        isNumericStatus ? `HTTP ${code}: ${cnt} failure(s)` : `${code}: ${cnt} failure(s)`,
      );
    }
  }
  out.sort();
  return out;
}

/**
 * k6 **`handleSummary`** writer for a single-API script (JSON under **`k6/cashflows-income/reports/`**).
 * @param {object} cfg
 * @param {string} cfg.screenName
 * @param {string} cfg.apiKey slug for metrics / report
 * @param {string} cfg.apiLabel human-readable API name (logs)
 * @param {string} cfg.method
 * @param {string} cfg.endpoint example `/api/v1/cashflows/{cashflowId}`
 * @param {number} cfg.expectedStatus primary status for metrics docs (use first of **`acceptedStatuses`** when multiple)
 * @param {string} [cfg.expectedStatusDisplay] human-readable expectation in JSON (e.g. **`"200 or 204"`**)
 * @param {string} cfg.durMetricName Trend name
 * @param {string} cfg.errMetricName Counter name
 * @param {string} cfg.okMetricName Counter name
 * @param {string} cfg.reportFilename e.g. `reports/cashflows-income-get-cashflow-load-report.json`
 * @param {string} [cfg.errStatusMetricPrefix] tagged Counter prefix (legacy k6 summary keys only)
 * @param {{ metricName: string, label: string }[]} [cfg.errBucketDefs] k6 **v2+** fixed counters from **`createHttpErrorBuckets(...).defs`**
 * @param {string} [cfg.screenRoute] UI route for the report (default **income** screen)
 * @param {string} [cfg.portalUrlExample] example portal URL (default **income** screen)
 */
export function singleApiHandleSummaryFactory(cfg) {
  const screenRoute =
    cfg.screenRoute != null && String(cfg.screenRoute).trim() !== ''
      ? String(cfg.screenRoute).trim()
      : '/cashflows/{cashflowId}/income';
  const portalUrlExample =
    cfg.portalUrlExample != null && String(cfg.portalUrlExample).trim() !== ''
      ? String(cfg.portalUrlExample).trim()
      : 'https://dev.ibernia.it/cashflows/{cashflowId}/income';

  return function handleSummary(data) {
    const dur = metricValuesForTrend(data, cfg.durMetricName);
    const errs = metricCount(data, cfg.errMetricName);
    const oks = metricCount(data, cfg.okMetricName);
    const total = oks + errs;
    const successRate = total > 0 ? oks / total : null;
    const durationMs =
      data.state && data.state.testRunDurationMs != null ? data.state.testRunDurationMs : null;
    const vusMax =
      data.metrics.vus_max && data.metrics.vus_max.values && data.metrics.vus_max.values.max != null
        ? data.metrics.vus_max.values.max
        : null;

    const bucketDefs = cfg.errBucketDefs && cfg.errBucketDefs.length ? cfg.errBucketDefs : null;
    const statusLines =
      errs > 0 && bucketDefs
        ? collectErrorBucketBreakdown(data, bucketDefs)
        : errs > 0 && cfg.errStatusMetricPrefix
          ? collectTaggedCounterBreakdown(data, cfg.errStatusMetricPrefix, 'code')
          : [];
    const errorMessages =
      errs > 0
        ? (() => {
            const lines = [
              `${errs} failed request(s) or checks for [${cfg.apiLabel}] (${cfg.method} ${cfg.endpoint}).`,
              'Inspect k6 stderr: failed HTTP calls are logged there with status code and a trimmed response body.',
            ];
            if (statusLines.length > 0) {
              lines.push(`Error breakdown by counter: ${statusLines.join('; ')}`);
            } else if (bucketDefs) {
              lines.push(
                'Error breakdown: failure counters were incremented but no HTTP-class bucket counts appeared in the exported summary (unexpected).',
              );
            } else {
              lines.push(
                'Error breakdown: pass errBucketDefs from createHttpErrorBuckets(...) so this report can list HTTP 4xx/5xx counts.',
              );
            }
            return lines;
          })()
        : [];

    const expectedDisplay =
      cfg.expectedStatusDisplay != null && String(cfg.expectedStatusDisplay).trim() !== ''
        ? String(cfg.expectedStatusDisplay).trim()
        : cfg.expectedStatus;

    const apiBlock = {
      apiName: cfg.apiLabel,
      endpoint: cfg.endpoint,
      method: cfg.method,
      expectedStatus: expectedDisplay,
      success: total > 0 && errs === 0,
      averageResponseTimeMs: dur.avg,
      p95ResponseTimeMs: dur.p95,
      medianResponseTimeMs: dur.med,
      minResponseTimeMs: dur.min,
      maxResponseTimeMs: dur.max,
      totalRequests: total,
      errorCount: errs,
      errorMessages,
    };

    const report = {
      screenName: cfg.screenName,
      screenRoute,
      portalUrlExample,
      generatedAt: new Date().toISOString(),
      testDurationMs: durationMs,
      totalVUs: vusMax,
      overallSuccessRate: successRate,
      apis: [apiBlock],
    };

    const out = {
      [cfg.reportFilename]: JSON.stringify(report, null, 2),
    };

    if (adaptiveConfigFromEnv().enabled) {
      const scriptTag = cfg.scriptTag || cfg.screenName || 'k6';
      const subdir = cfg.reportFilename && cfg.reportFilename.includes('/')
        ? cfg.reportFilename.replace(/\/[^/]+$/, '')
        : 'reports';
      const paths = defaultAdaptiveReportPaths(scriptTag, subdir);
      const adaptiveReport = buildAdaptiveLatencyReport({
        scriptTag,
        data,
        setupData: cfg.setupData,
      });
      if (adaptiveReport.apis.length === 0 && apiBlock.totalRequests > 0) {
        adaptiveReport.apis.push({
          endpoint: cfg.endpoint,
          method: cfg.method,
          totalRequests: total,
          successCount: oks,
          failureCount: errs,
          avgMs: dur.avg,
          p95Ms: dur.p95,
          maxMs: dur.max,
          overThresholdCount: null,
          overThresholdPercent: null,
          thresholdMs: adaptiveConfigFromEnv().maxAcceptableMs,
        });
      }
      const merged = attachAdaptiveReportsToSummary(out, adaptiveReport, paths.json, paths.md);
      return attachPerfSliceToSummary(merged, data, perfConfigFromEnv().moduleName, [
        {
          module: perfConfigFromEnv().moduleName || cfg.screenName,
          method: cfg.method,
          endpoint: cfg.endpoint,
          totalCalls: total,
          failures: errs,
          slowCount:
            dur.max != null && dur.max > perfConfigFromEnv().thresholdMs
              ? Math.max(1, total)
              : 0,
          avgMs: dur.avg,
          minMs: dur.min,
          maxMs: dur.max,
          p90Ms: null,
          p95Ms: dur.p95,
        },
      ]);
    }

    return attachPerfSliceToSummary(out, data, perfConfigFromEnv().moduleName, [
      {
        module: perfConfigFromEnv().moduleName || cfg.screenName,
        method: cfg.method,
        endpoint: cfg.endpoint,
        totalCalls: total,
        failures: errs,
        slowCount:
          dur.max != null && dur.max > perfConfigFromEnv().thresholdMs ? Math.max(1, total) : 0,
        avgMs: dur.avg,
        minMs: dur.min,
        maxMs: dur.max,
        p90Ms: null,
        p95Ms: dur.p95,
      },
    ]);
  };
}
