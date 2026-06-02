/**
 * Clients API full lifecycle load test — **per-user** no-partner then with-partner cycles.
 *
 * Reuses **`lib/k6-client-lifecycle.js`** for login (`lifecycleLoginAcquireToken`), advisor resolution
 * (`resolveAdvisorSub`), and payload construction (`buildClientModel`, `parseClientCreateResponse`).
 * Does **not** change `k6/identity/k6-identity-signup.js` or `runSignupClientLifecycle` behavior.
 *
 * ## Prerequisites
 *
 * - **`lifecycle-users.json`** (copy from `lifecycle-users.example.json`): `email` + `token` and/or `password`.
 *   Optional **`advisorId`** (or **`identityUserId`**) — Identity user id for **`FinancialAdvisor.AdvisorId`** when ROPC tokens omit **`sub`** (recommended for **Docker** if you do not mount **`identity-user-sub-map.json`**).
 * - Same ROPC / Identity env as lifecycle-only signup: **`IDENTITY_BASE`**, **`SIGNUP_ROPC_CLIENT_ID`**, optional secret,
 *   **`SIGNUP_ROPC_SCOPE`**, **`BASE_URL`** (API).
 *
 * **Subscription gating (optional):** If the API returns **402** with **`module_not_active`** / **`client_profile`**, set **`RELAX_CLIENT_PROFILE_MODULE=1`**
 * to treat create as **skipped** (checks pass, no update/delete), and to relax **`http_req_failed`** like **`RELAX_HTTP_REQ_FAILED=1`**. Use only when the tenant
 * lacks that module on purpose; fix the subscription for a real load test.
 *
 * **Logs:** **`LIFECYCLE_VERBOSE=1`** enables optional **`lib/k6-client-lifecycle.js`** warnings when ROPC tokens omit **`sub`** and the script uses the identity map or row **`advisorId`** (default: no spam).
 *
 * ## k6 HTTP tags (for metrics / performance analysis)
 *
 * - `client_create_no_partner`, `client_update_no_partner`, `client_delete_no_partner`
 * - `client_create_with_partner`, `client_update_with_partner`, `client_delete_with_partner`
 *
 * ## Run (PowerShell)
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * # Password-only rows need ROPC client (Duende client with password grant):
 * k6 run k6/clients/k6-client-full-lifecycle.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=YOUR_ROPC_CLIENT_ID `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" `
 *   -e TOTAL_REGISTRATIONS=20 `
 *   -e VUS=5
 * ```
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { observeHttp } from '../../lib/k6-http-observe.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';

const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const TOTAL_REGISTRATIONS = Math.max(1, parseInt((__ENV.TOTAL_REGISTRATIONS || __ENV.USER_COUNT || '100').trim(), 10));
const VUS_RAW = parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10);
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxClientProfileModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CLIENT_PROFILE_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxClientProfileModule;

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[k6-client-full-lifecycle] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[k6-client-full-lifecycle] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`);
}

assertDevIdentityHost(IDENTITY_BASE);
assertApiBase(API_BASE);

function loadLifecycleUsersFromDisk() {
  const arr = loadLifecycleUsers();
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(
      `[k6-client-full-lifecycle] user pool / lifecycle file must be a non-empty array (USE_USER_POOL=1 + POOL_SLICE_FILE).`,
    );
  }
  let anyRowNeedsRopc = false;
  for (let i = 0; i < arr.length; i++) {
    const r = arr[i];
    const em = r && String(r.email || '').trim();
    let tok = r && String(r.token || '').trim();
    if (tok && /^bearer\s+/i.test(tok)) {
      tok = tok.replace(/^bearer\s+/i, '').trim();
    }
    if (r) r.token = tok;
    const pw = r && String(r.password || '').trim();
    if (!em) {
      throw new Error(`[k6-client-full-lifecycle] Row ${i}: missing "email".`);
    }
    if (!tok && !pw) {
      throw new Error(`[k6-client-full-lifecycle] Row ${i}: need "token" and/or "password".`);
    }
    if (tok) {
      const parts = tok.split('.');
      if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
        throw new Error(`[k6-client-full-lifecycle] Row ${i}: "token" must be a JWT (three segments).`);
      }
    }
    if (!tok) anyRowNeedsRopc = true;
  }
  if (anyRowNeedsRopc && !(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim()) {
    throw new Error(
      `[k6-client-full-lifecycle] "${LIFECYCLE_USERS_FILE}" has rows with "password" but no "token". Those rows use ROPC (Resource Owner Password) at /connect/token.\n` +
        `Fix one of:\n` +
        `  A) Pass a real OAuth client allowed for grant_type=password, e.g.:\n` +
        `     k6 run -e SIGNUP_ROPC_CLIENT_ID=YOUR_STS_CLIENT_ID -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET_IF_CONFIDENTIAL" -e TOTAL_REGISTRATIONS=20 k6/clients/k6-client-full-lifecycle.js\n` +
        `  B) Add a fresh JWT to every row as "token" (from dev portal Network → Authorization) and you can omit SIGNUP_ROPC_CLIENT_ID.`,
    );
  }
  return arr;
}

const lifecycleUsers = new SharedArray('lifecycle_users_full', loadLifecycleUsersFromDisk);

const SCENARIO_ITERATIONS = Math.min(TOTAL_REGISTRATIONS, lifecycleUsers.length);
const SCENARIO_VUS = Math.max(1, Math.min(VUS_RAW, lifecycleUsers.length, SCENARIO_ITERATIONS));

const thresholds = {
  ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
  ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.5'] }),
};

export const options = {
  scenarios: {
    clients_full_lifecycle: {
      executor: 'shared-iterations',
      vus: SCENARIO_VUS,
      iterations: SCENARIO_ITERATIONS,
      maxDuration: __ENV.MAX_DURATION || '30m',
    },
  },
  thresholds,
};

function globalIterationIndex() {
  try {
    return exec.scenario.iterationInTest;
  } catch {
    return typeof __ITER !== 'undefined' ? __ITER : 0;
  }
}

function thinkSec() {
  const ltRaw = (__ENV.CLIENT_LIFECYCLE_THINK_SEC || '').trim();
  const lt = ltRaw === '' ? NaN : parseFloat(ltRaw);
  if (Number.isFinite(lt) && lt >= 0) return lt;
  const t = (__ENV.THINK_SEC || '').trim();
  return t ? parseFloat(t) : 0.2;
}

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

function pauseThink() {
  sleep(thinkSec());
}

function httpBodySnip(res, maxLen) {
  const n = maxLen != null ? maxLen : 400;
  const b = res && res.body != null ? String(res.body) : '';
  return b.replace(/\s+/g, ' ').substring(0, n);
}

/** True when API returns 402 for missing `client_profile` subscription module. */
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

/**
 * @returns {{ accessToken: string, advisorSub: string, advisorName: string }|null}
 */
function loginUserContext({ email, password, preloadedAccessToken, timeout, advisorIdFromRow }) {
  const clientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const clientSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
  const scope = (
    __ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api'
  ).trim();

  const auth = lifecycleLoginAcquireToken({
    email,
    password,
    preloadedAccessToken,
    identityBase: IDENTITY_BASE,
    clientId,
    clientSecret,
    scope,
    timeout,
    advisorIdFromRow,
  });
  if (!auth) return null;

  const { accessToken, tokenSub } = auth;
  const advisorSub = resolveAdvisorSub(email, tokenSub);
  if (!advisorSub) {
    console.error(
      `[k6-client-full-lifecycle] No advisor id for ${email} (JWT sub + identity map).`,
    );
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || email;
  return { accessToken, advisorSub, advisorName };
}

/**
 * Create → update (PUT body with Id, same contract as lib) → delete; delete in `finally` if create returned an id.
 */
function runClientCycleNoPartner({ base, hdrs, email, advisorSub, advisorName, uniqueTag, timeout }) {
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const clientEmail = `k6fp.${uniqueTag}.${Date.now()}@${domain}`;
  let clientId = null;
  try {
    pauseThink();
    const createBody = buildClientModel({
      advisorSub,
      advisorName,
      uniqueTag,
      withPartner: false,
      clientEmail,
    });
    const resCreate = http.post(`${base}/api/v1/Clients`, JSON.stringify(createBody), {
      headers: hdrs,
      tags: { name: 'client_create_no_partner' },
      timeout,
    });
    observeHttp(resCreate, {
      method: 'POST',
      endpoint: '/api/v1/Clients',
      tagName: 'client_create_no_partner',
    });
    const { id, model: modelRaw } = parseClientCreateResponse(resCreate);
    const moduleSkipped =
      relaxClientProfileModule && isClientProfileModuleNotActive402(resCreate);
    const okCreate = createHttpAccepted(resCreate.status, id) || moduleSkipped;
    check(resCreate, {
      'full: no-partner create accepted': () => okCreate,
    });
    if (moduleSkipped) {
      console.warn(
        `[k6-client-full-lifecycle] RELAX_CLIENT_PROFILE_MODULE=1: skipping no-partner CRUD (402 client_profile) user=${email}`,
      );
      return;
    }
    if (!id || !modelRaw) {
      console.error(
        `[k6-client-full-lifecycle] no-partner create failed user=${email} HTTP ${resCreate.status} snip=${httpBodySnip(resCreate)}`,
      );
      return;
    }
    clientId = id;
    pauseThink();

    const model = JSON.parse(JSON.stringify(modelRaw));
    model.Id = clientId;
    model.ClientDetails = model.ClientDetails || {};
    model.ClientDetails.FirstName = 'LoadUpdFp';
    model.Notes = `${model.Notes || ''} | fp_edited`.slice(0, 500);

    const resPut = http.put(`${base}/api/v1/Clients`, JSON.stringify(model), {
      headers: hdrs,
      tags: { name: 'client_update_no_partner' },
      timeout,
    });
    observeHttp(resPut, {
      method: 'PUT',
      endpoint: '/api/v1/Clients',
      tagName: 'client_update_no_partner',
    });
    check(resPut, {
      'full: no-partner update 200': (r) => r.status === 200,
    });
    pauseThink();

    const resDel = http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'client_delete_no_partner' },
      timeout,
    });
    observeHttp(resDel, {
      method: 'DELETE',
      endpoint: '/api/v1/Clients/{id}',
      tagName: 'client_delete_no_partner',
    });
    check(resDel, {
      'full: no-partner delete 200': (r) => r.status === 200,
    });
    if (resDel.status === 200) {
      clientId = null;
    }
  } finally {
    if (clientId) {
      http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
        headers: hdrs,
        tags: { name: 'client_delete_no_partner' },
        timeout,
      });
    }
  }
}

function runClientCycleWithPartner({ base, hdrs, email, advisorSub, advisorName, uniqueTag, timeout }) {
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const clientEmail = `k6fpp.${uniqueTag}.${Date.now()}@${domain}`;
  let clientId = null;
  try {
    pauseThink();
    const createBody = buildClientModel({
      advisorSub,
      advisorName,
      uniqueTag: `${uniqueTag}p`,
      withPartner: true,
      clientEmail,
    });
    const resCreate = http.post(`${base}/api/v1/Clients`, JSON.stringify(createBody), {
      headers: hdrs,
      tags: { name: 'client_create_with_partner' },
      timeout,
    });
    observeHttp(resCreate, {
      method: 'POST',
      endpoint: '/api/v1/Clients',
      tagName: 'client_create_with_partner',
    });
    const { id, model: modelRaw } = parseClientCreateResponse(resCreate);
    const moduleSkipped =
      relaxClientProfileModule && isClientProfileModuleNotActive402(resCreate);
    const okCreate = createHttpAccepted(resCreate.status, id) || moduleSkipped;
    check(resCreate, {
      'full: with-partner create accepted': () => okCreate,
    });
    if (moduleSkipped) {
      console.warn(
        `[k6-client-full-lifecycle] RELAX_CLIENT_PROFILE_MODULE=1: skipping with-partner CRUD (402 client_profile) user=${email}`,
      );
      return;
    }
    if (!id || !modelRaw) {
      console.error(
        `[k6-client-full-lifecycle] with-partner create failed user=${email} HTTP ${resCreate.status} snip=${httpBodySnip(resCreate)}`,
      );
      return;
    }
    clientId = id;
    pauseThink();

    const model = JSON.parse(JSON.stringify(modelRaw));
    model.Id = clientId;
    model.ClientDetails = model.ClientDetails || {};
    model.ClientDetails.FirstName = 'LoadUpdFp2';
    if (model.PartnerDetail) {
      model.PartnerDetail.FirstName = 'PartnerUpdFp';
    }
    model.Notes = `${model.Notes || ''} | fp_p_edited`.slice(0, 500);

    const resPut = http.put(`${base}/api/v1/Clients`, JSON.stringify(model), {
      headers: hdrs,
      tags: { name: 'client_update_with_partner' },
      timeout,
    });
    observeHttp(resPut, {
      method: 'PUT',
      endpoint: '/api/v1/Clients',
      tagName: 'client_update_with_partner',
    });
    check(resPut, {
      'full: with-partner update 200': (r) => r.status === 200,
    });
    pauseThink();

    const resDel = http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: 'client_delete_with_partner' },
      timeout,
    });
    observeHttp(resDel, {
      method: 'DELETE',
      endpoint: '/api/v1/Clients/{id}',
      tagName: 'client_delete_with_partner',
    });
    check(resDel, {
      'full: with-partner delete 200': (r) => r.status === 200,
    });
    if (resDel.status === 200) {
      clientId = null;
    }
  } finally {
    if (clientId) {
      http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
        headers: hdrs,
        tags: { name: 'client_delete_with_partner' },
        timeout,
      });
    }
  }
}

export function setup() {
  console.log(
    `[k6-client-full-lifecycle] users=${lifecycleUsers.length} iterations=${SCENARIO_ITERATIONS} vus=${SCENARIO_VUS} API=${API_BASE}`,
  );
  return {};
}

export default function () {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  const gi = globalIterationIndex();
  const it = typeof __ITER !== 'undefined' ? __ITER : 0;
  const row = lifecycleUsers[gi % lifecycleUsers.length];
  const email = String(row.email).trim();
  const pwd = String(row.password || '').trim();
  const rowToken = row.token != null ? String(row.token).trim() : '';
  const rowAdvisorRaw =
    row.advisorId != null && String(row.advisorId).trim() !== ''
      ? String(row.advisorId).trim()
      : row.identityUserId != null && String(row.identityUserId).trim() !== ''
        ? String(row.identityUserId).trim()
        : '';
  const uniqueTag = `full_vu${vu}_gi${gi}_i${it}_${Date.now()}`;

  const ctx = loginUserContext({
    email,
    password: pwd,
    preloadedAccessToken: rowToken || undefined,
    timeout: HTTP_TIMEOUT,
    advisorIdFromRow: rowAdvisorRaw || undefined,
  });
  if (!ctx) {
    return;
  }

  const hdrs = apiHeaders(ctx.accessToken);
  const base = API_BASE;

  runClientCycleNoPartner({
    base,
    hdrs,
    email,
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
    uniqueTag,
    timeout: HTTP_TIMEOUT,
  });

  runClientCycleWithPartner({
    base,
    hdrs,
    email,
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
    uniqueTag,
    timeout: HTTP_TIMEOUT,
  });

  sleep(__ENV.THINK_SEC ? parseFloat(__ENV.THINK_SEC) : 0.3);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  scriptTag: 'k6-client-full-lifecycle',
  moduleName: (__ENV.MODULE_NAME || 'clients').trim(),
  reportSubdir: 'k6/clients/reports',
});
