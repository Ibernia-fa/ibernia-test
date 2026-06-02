/**
 * Load test **GET /api/v1/Clients/{advisorId}/search?searchTerm=…** after seeding **one client per VU** whose **last name** contains a unique token (matches backend `SearchClientAsync` on first/last name).
 *
 * Flow:
 * 1. **`setup()`** — row **0** of **`lifecycle-users.json`**, login only; generates **`runTag`** for this run (passed to VUs; **no HTTP** besides identity).
 * 2. **First iteration per VU** (concurrent) — **POST** one client per **`__VU`** (`uniqueTag` = `k6srch{runTag}vu{VU}` → **`Cli…`** searchable), then **GET search** must return **200** and include that client **id** (tags **`clients_search_seed_*`**). State cached on **`globalThis.__k6ClientsSearchByVu`** for later iterations **within that VU** only.
 * 3. **VU code** — **`constant-vus`** on **`GET …/search?searchTerm=`** (tag **`clients_search`**); checks **200** and body includes that VU’s seeded **id**.
 * 4. **`teardown()`** — **GET …/Clients/{advisorId}/all**, **DELETE** every client whose last name contains **`k6srch{runTag}`** (k6 teardown cannot see per-VU `globalThis`; list-based cleanup).
 *
 * ## Env
 *
 * Same family as **`k6/clients/k6-clients-list-load.js`**: **`lifecycle-users.json`** row 0, **`SIGNUP_ROPC_*`**, **`IDENTITY_BASE`**, **`BASE_URL`**, **`HTTP_TIMEOUT`**, **`RELAX_*`**, **`VUS`**, **`DURATION`** (default **20s**), **`gracefulStop` 5s**, **`THINK_SEC`**, **`CLIENT_API_EMAIL_DOMAIN`**, **`SIGNUP_ROPC_TOKEN_AUTH=basic`**.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=YOUR_ID -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" -e VUS=10 k6/clients/k6-clients-search-load.js
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
} from '../../lib/k6-client-lifecycle.js';
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';

const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxClientProfileModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CLIENT_PROFILE_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed = relaxHttpReqFailed || relaxClientProfileModule;

const VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const DURATION = (__ENV.DURATION || '20s').trim();
const DURATION_FROM_ENV = !!(__ENV.DURATION && String(__ENV.DURATION).trim());

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[k6-clients-search-load] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[k6-clients-search-load] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`);
}

assertDevIdentityHost(IDENTITY_BASE);
assertApiBase(API_BASE);

function resolvedRepoLifecycleUsersPath() {
  try {
    return String(import.meta.resolve('../../lifecycle-users.json'));
  } catch {
    return '';
  }
}

function readFirstLifecycleUserAtInit() {
  const rawEnv = (__ENV.LIFECYCLE_USERS_FILE || '').trim();
  const resolvedDefault = resolvedRepoLifecycleUsersPath();
  const candidates = [];
  if (rawEnv) candidates.push(rawEnv);
  if (resolvedDefault) candidates.push(resolvedDefault);
  if (!rawEnv) {
    candidates.push('../../lifecycle-users.json', 'lifecycle-users.json');
  }
  const errors = [];
  let raw;
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    if (!p) continue;
    try {
      raw = open(p);
      break;
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : String(e);
      errors.push(`${p}: ${msg}`);
    }
  }
  if (raw == null) {
    throw new Error(
      `[k6-clients-search-load] Cannot read lifecycle users. Tried:\n  - ${errors.join(
        '\n  - ',
      )}\nSet LIFECYCLE_USERS_FILE or keep lifecycle-users.json in load-testing-k6/.`,
    );
  }
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`[k6-clients-search-load] lifecycle users file must be a non-empty JSON array.`);
  }
  const r = arr[0];
  const em = r && String(r.email || '').trim();
  let tok = r && String(r.token || '').trim();
  if (tok && /^bearer\s+/i.test(tok)) {
    tok = tok.replace(/^bearer\s+/i, '').trim();
  }
  const pw = r && String(r.password || '').trim();
  if (!em) throw new Error(`[k6-clients-search-load] Row 0: missing "email".`);
  if (!tok && !pw) {
    throw new Error(`[k6-clients-search-load] Row 0: need "token" and/or "password".`);
  }
  if (tok) {
    const parts = tok.split('.');
    if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
      throw new Error(`[k6-clients-search-load] Row 0: "token" must be a JWT (three segments).`);
    }
  }
  if (!tok && !(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim()) {
    throw new Error(
      `[k6-clients-search-load] Row 0 has password but no token — set SIGNUP_ROPC_CLIENT_ID (and secret if confidential) for ROPC.`,
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

const FIRST_LIFECYCLE_USER = readFirstLifecycleUserAtInit();

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
    console.error(`[k6-clients-search-load] No advisor id for ${row.email}.`);
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email;
  return { accessToken, advisorSub, advisorName };
}

function searchResponseContainsClientId(res, clientId) {
  if (res.status !== 200) return false;
  try {
    const arr = res.json();
    if (!Array.isArray(arr)) return false;
    const want = String(clientId).trim();
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      const id = x && (x.Id != null ? x.Id : x.id);
      if (id != null && String(id).trim() === want) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function abortTest(msg) {
  exec.test.abort(`[k6-clients-search-load] ${msg}`);
}

function buildSearchUrl(base, advisorSub, searchTerm) {
  const q = encodeURIComponent(searchTerm);
  return `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/search?searchTerm=${q}`;
}

function getSeedStore() {
  if (!globalThis.__k6ClientsSearchByVu) {
    globalThis.__k6ClientsSearchByVu = {};
  }
  return globalThis.__k6ClientsSearchByVu;
}

function clientLastNameFromListRow(x) {
  const d = x && (x.clientDetails || x.ClientDetails);
  if (!d) return '';
  const ln = d.lastName != null ? d.lastName : d.LastName;
  return ln != null ? String(ln) : '';
}

/** Teardown cannot read per-VU `globalThis`; delete by run marker in last name. */
function deleteClientsMatchingRunTag(base, hdrs, advisorSub, runTag) {
  const needle = `k6srch${runTag}`;
  const listUrl = `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`;
  const res = http.get(listUrl, {
    headers: hdrs,
    tags: { name: 'clients_search_teardown_list' },
    timeout: HTTP_TIMEOUT,
  });
  if (res.status !== 200) return;
  let arr;
  try {
    arr = res.json();
  } catch {
    return;
  }
  if (!Array.isArray(arr)) return;
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    const ln = clientLastNameFromListRow(row);
    if (!ln.includes(needle)) continue;
    const id = row && (row.Id != null ? row.Id : row.id);
    if (id == null || String(id).trim() === '') continue;
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(String(id).trim())}`, null, {
      headers: hdrs,
      tags: { name: 'clients_search_teardown_delete' },
      timeout: HTTP_TIMEOUT,
    });
  }
}

/**
 * First iteration per VU: POST client + search verify (concurrent across VUs).
 * @param {{ base: string, token: string, advisorSub: string, advisorName: string, runTag: string }} setupData
 */
function seedVuIfNeeded(base, vuKey, setupData) {
  const store = getSeedStore();
  if (store[vuKey]) {
    return store[vuKey];
  }

  const { token, advisorSub, advisorName, runTag } = setupData;
  const hdrs = apiHeaders(token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `k6srch${runTag}vu${vuKey}`;
  const searchTerm = uniqueTag;

  const clientEmail = `k6search.${uniqueTag}.${Date.now()}@${domain}`;
  const body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const res = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
    headers: hdrs,
    tags: { name: 'clients_search_seed_create' },
    timeout: HTTP_TIMEOUT,
  });
  const { id: seededClientId } = parseClientCreateResponse(res);
  const moduleSkipped = relaxClientProfileModule && isClientProfileModuleNotActive402(res);
  if (moduleSkipped) {
    abortTest(
      'seed: 402 client_profile on create. Enable module or fix subscription (RELAX_CLIENT_PROFILE_MODULE does not create a client here).',
    );
  }
  if (!createHttpAccepted(res.status, seededClientId) || !seededClientId) {
    abortTest(`seed: client create failed VU ${vuKey} HTTP ${res.status}`);
  }

  const verifyUrl = buildSearchUrl(base, advisorSub, searchTerm);
  const verify = http.get(verifyUrl, {
    headers: hdrs,
    tags: { name: 'clients_search_seed_verify' },
    timeout: HTTP_TIMEOUT,
  });
  if (!(verify.status === 200 && searchResponseContainsClientId(verify, seededClientId))) {
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(seededClientId)}`, null, {
      headers: hdrs,
      tags: { name: 'clients_search_seed_cleanup' },
      timeout: HTTP_TIMEOUT,
    });
    abortTest(
      `seed: search verify failed VU ${vuKey} HTTP ${verify.status} searchTerm="${searchTerm}"`,
    );
  }

  const entry = {
    token,
    advisorSub,
    searchTerm,
    seededClientId,
  };
  store[vuKey] = entry;
  console.log(
    `[k6-clients-search-load] seed VU ${vuKey} ok: searchTerm="${searchTerm}" seededClientId=${seededClientId}`,
  );
  return entry;
}

export function setup() {
  const runTag = `r${Date.now()}`;
  console.log(
    `[k6-clients-search-load] VUS=${VUS} DURATION=${DURATION}${DURATION_FROM_ENV ? ' (-e DURATION)' : ' (default)'} | runTag=${runTag} (concurrent per-VU POST+verify on first iteration) | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );

  const ctx = loginUserContext(FIRST_LIFECYCLE_USER);
  if (!ctx) {
    abortTest(
      'setup: login failed (ROPC or JWT). See k6/clients/k6-clients-list-load.js / Identity Admin for **invalid_client** or paste JWT on row 0.',
    );
  }

  const { accessToken, advisorSub, advisorName } = ctx;

  return {
    base: API_BASE,
    token: accessToken,
    advisorSub,
    advisorName,
    runTag,
  };
}

export function teardown(data) {
  if (!data || !data.token || !data.runTag || !data.advisorSub) return;
  const hdrs = apiHeaders(data.token);
  deleteClientsMatchingRunTag(data.base || API_BASE, hdrs, data.advisorSub, data.runTag);
}

export const options = {
  scenarios: {
    clients_search: {
      executor: 'constant-vus',
      vus: VUS,
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
  if (!data || !data.token || !data.runTag || data.advisorSub == null || data.advisorSub === '') {
    abortTest('internal: setup returned invalid data.');
  }

  const base = data.base || API_BASE;
  const setupData = {
    base,
    token: data.token,
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    runTag: data.runTag,
  };
  const seeded = seedVuIfNeeded(base, __VU, setupData);

  const hdrs = apiHeaders(seeded.token);
  const url = buildSearchUrl(base, seeded.advisorSub, seeded.searchTerm);
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'clients_search' },
    timeout: HTTP_TIMEOUT,
  });

  check(res, {
    'search: GET 200': (r) => r.status === 200,
  });
  check(res, {
    'search: body includes seeded client id': (r) =>
      searchResponseContainsClientId(r, seeded.seededClientId),
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  moduleName: 'clients',
  sliceId: 'k6-clients-search-load',
});
