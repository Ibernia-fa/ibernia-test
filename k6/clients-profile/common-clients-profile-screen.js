/**
 * Shared helpers for **`/clients/{clientId}/profile`** screen load tests.
 * Reuses **`../../lib/`** and metrics/report helpers from **`../cashflows-income/common-income-screen.js`** (no changes to lib).
 */
import http from 'k6/http';
import exec from 'k6/execution';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';
import {
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  logHttpError,
  metricCount,
  metricValuesForTrend,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  singleApiHandleSummaryFactory,
} from '../cashflows-income/common-income-screen.js';

export const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
export const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
export const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
export const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
export const DURATION = (__ENV.DURATION || '20s').trim();
export const THINK_SEC = parseFloat((__ENV.THINK_SEC || '0').trim() || '0');

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

function resolvedDefaultLifecycleUsersPath() {
  try {
    return String(import.meta.resolve('../../lifecycle-users.json'));
  } catch {
    return '';
  }
}

export function readFirstLifecycleUserAtInit(scriptTag) {
  const arr = loadLifecycleUsers();
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(
      `[${scriptTag}] lifecycle-users / pool slice must be a non-empty array (USE_USER_POOL=1 + POOL_SLICE_FILE for leased pool).`,
    );
  }
  const r = arr[0];
  const em = r && String(r.email || '').trim();
  let tok = r && String(r.token || '').trim();
  if (tok && /^bearer\s+/i.test(tok)) {
    tok = tok.replace(/^bearer\s+/i, '').trim();
  }
  const pw = r && String(r.password || '').trim();
  if (!em) throw new Error(`[${scriptTag}] Row 0: missing "email".`);
  if (!tok && !pw) {
    throw new Error(`[${scriptTag}] Row 0: need "token" and/or "password".`);
  }
  if (tok) {
    const parts = tok.split('.');
    if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
      throw new Error(`[${scriptTag}] Row 0: "token" must be a JWT (three segments).`);
    }
  }
  if (!tok && !(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim()) {
    throw new Error(
      `[${scriptTag}] Row 0 has password but no token — set SIGNUP_ROPC_CLIENT_ID (and secret if confidential) for ROPC.`,
    );
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

export function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
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

/**
 * @param {object} row First lifecycle row from **`readFirstLifecycleUserAtInit`** (must run at **init** only).
 */
export function loginAdvisorFromRow0(scriptTag, row) {
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
  return { accessToken, advisorSub, advisorName, row };
}

export function abortTest(scriptTag, msg) {
  exec.test.abort(`[${scriptTag}] ${msg}`);
}

/**
 * @param {string} needlePrefix e.g. **`k6profgc`** — uniqueTag becomes **`${needlePrefix}${runTag}vu${vuKey}`** so teardown needle **`${needlePrefix}${runTag}`** matches **`Cli…`** last names.
 */
export function seedProfileClientForVu(base, vuKey, p) {
  const { token, advisorSub, advisorName, runTag, needlePrefix } = p;
  const storeKey = p.globalKey;
  if (!globalThis[storeKey]) {
    globalThis[storeKey] = {};
  }
  const store = globalThis[storeKey];
  if (store[vuKey]) {
    return store[vuKey];
  }

  const hdrs = apiHeaders(token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${needlePrefix}${runTag}vu${vuKey}`;
  const clientEmail = `loadtest.profile.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const res = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: `${needlePrefix}_seed_post`, vu: String(vuKey) },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededClientId } = parseClientCreateResponse(res);
  if (isClientProfileModuleNotActive402(res)) {
    abortTest(p.scriptTag, `seed: 402 client_profile VU ${vuKey}. Enable client_profile module.`);
  }
  if (!createHttpAccepted(res.status, seededClientId) || !seededClientId) {
    abortTest(p.scriptTag, `seed: POST /Clients failed VU ${vuKey} HTTP ${res.status}`);
  }

  const getUrl = `${base}/api/v1/Clients/${encodeURIComponent(seededClientId)}`;
  const verify = http.get(getUrl, {
    headers: hdrs,
    tags: { name: `${needlePrefix}_seed_verify`, vu: String(vuKey) },
    timeout: HTTP_TIMEOUT,
  });
  if (verify.status !== 200) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(seededClientId)}`, null, {
      headers: hdrs,
      tags: { name: `${needlePrefix}_seed_cleanup`, vu: String(vuKey) },
      timeout: HTTP_TIMEOUT,
    });
    abortTest(p.scriptTag, `seed: GET /Clients/{id} verify failed VU ${vuKey} HTTP ${verify.status}`);
  }

  const entry = { token, advisorSub, seededClientId };
  store[vuKey] = entry;
  console.log(`[${p.scriptTag}] seed VU ${vuKey} ok: clientId=${seededClientId}`);
  return entry;
}

export function teardownProfileClients(scriptTag, base, runTag, advisorSub, token, needlePrefix, tagPrefix) {
  if (!runTag || !token || !advisorSub) return;
  const hdrs = apiHeaders(token);
  const needle = `${needlePrefix}${runTag}`;
  deleteClientsAndPlansByLastNameNeedle(base, hdrs, advisorSub, needle, HTTP_TIMEOUT, {
    list: `${tagPrefix}_teardown_list`,
    cfList: `${tagPrefix}_teardown_cf_list`,
    delCf: `${tagPrefix}_teardown_del_cf`,
    delClient: `${tagPrefix}_teardown_del_client`,
  });
}

export function deleteGlobalSeedKey(key) {
  try {
    delete globalThis[key];
  } catch {
    /* ignore */
  }
}

export {
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  logHttpError,
  metricCount,
  metricValuesForTrend,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  singleApiHandleSummaryFactory,
};
