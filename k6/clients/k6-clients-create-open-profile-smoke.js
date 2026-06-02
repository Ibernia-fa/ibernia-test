/**
 * Smoke: for **each** row in **`lifecycle-users.json`**, that user runs: **create a client** → **open profile**
 * (**`GET /api/v1/Clients/{id}`**) → **delete**.
 *
 * **One VU per user** (`vus` = array length), so **20 users ⇒ 20 VUs** each doing the full journey in parallel.
 * **`ITERATIONS`** (default **1**) repeats the journey per VU.
 *
 * Same auth as **`k6/clients/k6-clients-get-by-id-load.js`**: **`SIGNUP_ROPC_*`**, **`IDENTITY_BASE`**, **`BASE_URL`**, **`SIGNUP_ROPC_TOKEN_AUTH=basic`** if needed. Any row with **password** but no **token** requires **`SIGNUP_ROPC_CLIENT_ID`** (and secret if confidential).
 *
 * Optional **`-e LIFECYCLE_MAX_USERS=20`** caps how many **leading** rows are used (file can list more).
 * Optional **`-e SCENARIO_MAX_DURATION=…`** caps scenario wall time (executor **`per-vu-iterations`**); default **10m** if unset.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run k6/clients/k6-clients-create-open-profile-smoke.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=<real_client_id> `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="<secret>"
 * ```
 */
import http from 'k6/http';
import { check } from 'k6';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { scenarioVusForPool } from '../../lib/k6-default-vus.js';
import { observeHttp } from '../../lib/k6-http-observe.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';

const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const ITERATIONS = Math.max(1, parseInt((__ENV.ITERATIONS || '1').trim() || '1', 10));
const LIFECYCLE_MAX_USERS_RAW = (__ENV.LIFECYCLE_MAX_USERS || '').trim();

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[k6-clients-create-open-profile-smoke] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[k6-clients-create-open-profile-smoke] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`,
  );
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
    throw new Error(`[k6-clients-create-open-profile-smoke] Row ${idx}: missing "email".`);
  }
  if (!tok && !pw) {
    throw new Error(`[k6-clients-create-open-profile-smoke] Row ${idx}: need "token" and/or "password".`);
  }
  if (tok) {
    const parts = tok.split('.');
    if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
      throw new Error(`[k6-clients-create-open-profile-smoke] Row ${idx}: "token" must be a JWT (three segments).`);
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
    throw new Error(
      `[k6-clients-create-open-profile-smoke] lifecycle users / pool slice must be a non-empty array.`,
    );
  }
  const ropcClientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const rows = [];
  for (let i = 0; i < arr.length; i++) {
    rows.push(normalizeLifecycleRow(arr[i], i));
  }
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].token && !ropcClientId) {
      throw new Error(
        `[k6-clients-create-open-profile-smoke] Row ${i} has password but no token — set SIGNUP_ROPC_CLIENT_ID (and secret if confidential) for ROPC.`,
      );
    }
  }
  let use = rows;
  if (LIFECYCLE_MAX_USERS_RAW) {
    const cap = Math.max(1, parseInt(LIFECYCLE_MAX_USERS_RAW, 10));
    if (!Number.isFinite(cap)) {
      throw new Error(`[k6-clients-create-open-profile-smoke] LIFECYCLE_MAX_USERS must be a positive integer.`);
    }
    use = rows.slice(0, cap);
    if (use.length === 0) {
      throw new Error(`[k6-clients-create-open-profile-smoke] LIFECYCLE_MAX_USERS=${cap} left no users.`);
    }
  }
  return use;
}

const LIFECYCLE_USERS = readAllLifecycleUsersAtInit();
const SCENARIO_VUS = scenarioVusForPool(LIFECYCLE_USERS.length, 'k6');

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
    console.error(`[k6-clients-create-open-profile-smoke] No advisor id for ${row.email}.`);
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email;
  return { accessToken, advisorSub, advisorName };
}

function getByIdBodyMatchesClientId(res, clientId) {
  if (res.status !== 200) return false;
  try {
    const j = res.json();
    const id = j && (j.Id != null ? j.Id : j.id);
    return id != null && String(id).trim() === String(clientId).trim();
  } catch {
    return false;
  }
}

function deleteClient(base, token, clientId) {
  if (!clientId) return null;
  return http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
    headers: apiHeaders(token),
    tags: { name: 'clients_create_open_profile_smoke_delete' },
    timeout: HTTP_TIMEOUT,
  });
}

/** `per-vu-iterations`: each VU runs **`ITERATIONS`** times (one lifecycle user per VU). Root `vus`+`iterations` would treat iterations as a global cap and fail when `iterations < vus`. */
const SCENARIO_MAX_DURATION = (__ENV.SCENARIO_MAX_DURATION || '10m').trim();

export const options = {
  scenarios: {
    create_open_profile_per_user: {
      executor: 'per-vu-iterations',
      vus: SCENARIO_VUS,
      iterations: ITERATIONS,
      maxDuration: SCENARIO_MAX_DURATION,
      gracefulStop: '30s',
    },
  },
};

/** Runs once; avoids repeating the same line on init (k6 runs init once per VU). */
export function setup() {
  console.log(
    `[k6-clients-create-open-profile-smoke] ${LIFECYCLE_USERS.length} VU(s) from "${LIFECYCLE_USERS_FILE}" | ITERATIONS=${ITERATIONS} | maxDuration=${SCENARIO_MAX_DURATION}`,
  );
  return {};
}

export default function () {
  const userIndex = __VU - 1;
  const row = LIFECYCLE_USERS[userIndex];
  if (!row) {
    console.error(
      `[k6-clients-create-open-profile-smoke] No row for VU ${__VU} (index ${userIndex}), len=${LIFECYCLE_USERS.length}`,
    );
    return;
  }

  let seededClientId = null;

  const ctx = loginUserContext(row);
  check(ctx, { [`smoke vu${__VU} (${row.email}): login ok`]: (c) => !!c });
  if (!ctx) return;

  const { accessToken, advisorSub, advisorName } = ctx;
  const hdrs = apiHeaders(accessToken);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6prof${userIndex}_${Date.now()}_i${__ITER}`;
  const clientEmail = `k6prof.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });

  const createRes = http.post(`${API_BASE}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_create_open_profile_smoke_create', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(createRes, {
    method: 'POST',
    endpoint: '/api/v1/Clients',
    tagName: 'clients_create_open_profile_smoke_create',
  });
  const { id } = parseClientCreateResponse(createRes);
  seededClientId = id || null;

  check(createRes, {
    [`smoke vu${__VU}: create accepted`]: () => createHttpAccepted(createRes.status, seededClientId),
  });

  if (!createHttpAccepted(createRes.status, seededClientId) || !seededClientId) {
    console.error(
      `[k6-clients-create-open-profile-smoke] vu${__VU} ${row.email}: create failed HTTP ${createRes.status} body=${String(createRes.body).slice(0, 400)}`,
    );
    return;
  }

  const profileUrl = `${API_BASE}/api/v1/Clients/${encodeURIComponent(seededClientId)}`;
  const getRes = http.get(profileUrl, {
    headers: hdrs,
    tags: { name: 'clients_create_open_profile_smoke_get_profile', vu: String(__VU) },
    timeout: HTTP_TIMEOUT,
  });
  observeHttp(getRes, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{id}',
    tagName: 'clients_create_open_profile_smoke_get_profile',
  });

  check(getRes, { [`smoke vu${__VU}: open profile GET 200`]: (r) => r.status === 200 });
  check(getRes, {
    [`smoke vu${__VU}: profile id matches`]: (r) => getByIdBodyMatchesClientId(r, seededClientId),
  });

  const delRes = deleteClient(API_BASE, accessToken, seededClientId);
  if (delRes) {
    observeHttp(delRes, {
      method: 'DELETE',
      endpoint: '/api/v1/Clients/{id}',
      tagName: 'clients_create_open_profile_smoke_delete',
    });
    check(delRes, {
      [`smoke vu${__VU}: delete 200 or 204`]: (r) => r.status === 200 || r.status === 204,
    });
  }
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  scriptTag: 'k6-clients-create-open-profile-smoke',
  moduleName: (__ENV.MODULE_NAME || 'clients-profile').trim(),
  reportSubdir: 'k6/clients/reports',
});
