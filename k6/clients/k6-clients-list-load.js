/**
 * Load test **GET /api/v1/Clients/{advisorId}/all** after seeding **two clients per VU** (concurrent on first iteration).
 *
 * Flow:
 * 1. **`setup()`** — row **0** login + **`runTag`** only.
 * 2. **First iteration per VU** — **POST** two clients (tags **`listseed{runTag}-vu{VU}-0|1`**), verify **GET …/all** contains both ids (**`clients_list_seed_*`**).
 * 3. **VU code** — **GET** `…/all` (**`clients_list_all`**). **`teardown()`** — **`lib/k6-load-cleanup.js`** by last-name needle **`listseed{runTag}`**.
 *
 * ## Env (same family as `k6/clients/k6-client-full-lifecycle.js`)
 *
 * - **`lifecycle-users.json`** — first array element is used for setup login.
 * - **`SIGNUP_ROPC_CLIENT_ID`** / **`SIGNUP_ROPC_CLIENT_SECRET`**, optional **`SIGNUP_ROPC_TOKEN_AUTH=basic`** (Duende **client_secret_basic**), **`SIGNUP_ROPC_SCOPE`**, **`IDENTITY_BASE`**, **`BASE_URL`**, **`HTTP_TIMEOUT`**, **`LIFECYCLE_USERS_FILE`**
 * - **402 `client_profile`** — setup **aborts** (this script cannot seed clients without the module). Fix subscription / tenant; **`RELAX_CLIENT_PROFILE_MODULE`** does not bypass creates here.
 * - **`RELAX_HTTP_REQ_FAILED`**, **`RELAX_CHECKS`** — same spirit as full lifecycle.
 * - Load knobs: **`VUS`** (default **20**), **`DURATION`** (default **`20s`**). **Whatever you pass with `-e DURATION=` wins** — e.g. **`-e DURATION=3m`** runs **three minutes** of load; omit **`DURATION`** for a short smoke. Scenario **`gracefulStop`** is **`5s`**. If **`setup()`** fails, the test **aborts immediately**.
 * - **`THINK_SEC`** — optional sleep after each GET (default **0**).
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=YOUR_ID -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" `
 *   -e VUS=10 k6/clients/k6-clients-list-load.js
 *   # longer sample only when you want it:
 *   # k6 run … -e DURATION=2m k6/clients/k6-clients-list-load.js
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
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';
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
    `[k6-clients-list-load] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[k6-clients-list-load] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`);
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

/**
 * Must run at **init** time only — `open()` is not allowed in `setup()`.
 * @returns {{ email: string, password: string, token: string, advisorIdFromRow: string }}
 */
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
      `[k6-clients-list-load] Cannot read lifecycle users. Tried:\n  - ${errors.join(
        '\n  - ',
      )}\nSet LIFECYCLE_USERS_FILE or keep lifecycle-users.json in load-testing-k6/.`,
    );
  }
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`[k6-clients-list-load] lifecycle users file must be a non-empty JSON array.`);
  }
  const r = arr[0];
  const em = r && String(r.email || '').trim();
  let tok = r && String(r.token || '').trim();
  if (tok && /^bearer\s+/i.test(tok)) {
    tok = tok.replace(/^bearer\s+/i, '').trim();
  }
  const pw = r && String(r.password || '').trim();
  if (!em) throw new Error(`[k6-clients-list-load] Row 0: missing "email".`);
  if (!tok && !pw) {
    throw new Error(`[k6-clients-list-load] Row 0: need "token" and/or "password".`);
  }
  if (tok) {
    const parts = tok.split('.');
    if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
      throw new Error(`[k6-clients-list-load] Row 0: "token" must be a JWT (three segments).`);
    }
  }
  if (!tok && !(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim()) {
    throw new Error(
      `[k6-clients-list-load] Row 0 has password but no token — set SIGNUP_ROPC_CLIENT_ID (and secret if confidential) for ROPC.`,
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

/** First lifecycle row, read once at init (see k6 test lifecycle). */
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
    console.error(`[k6-clients-list-load] No advisor id for ${row.email}.`);
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email;
  return { accessToken, advisorSub, advisorName };
}

function listResponseContainsBothIds(res, idA, idB) {
  if (res.status !== 200) return false;
  try {
    const arr = res.json();
    if (!Array.isArray(arr)) return false;
    const ids = new Set();
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      const id = x && (x.Id != null ? x.Id : x.id);
      if (id != null && String(id).trim() !== '') ids.add(String(id).trim());
    }
    return ids.has(String(idA)) && ids.has(String(idB));
  } catch {
    return false;
  }
}

function abortTest(msg) {
  exec.test.abort(`[k6-clients-list-load] ${msg}`);
}

function getSeedStore() {
  if (!globalThis.__k6ClientsListSeedByVu) {
    globalThis.__k6ClientsListSeedByVu = {};
  }
  return globalThis.__k6ClientsListSeedByVu;
}

/**
 * @param {{ token: string, advisorSub: string, advisorName: string, runTag: string }} auth
 */
function seedVuIfNeeded(base, vuKey, auth) {
  const store = getSeedStore();
  if (store[vuKey]) {
    return store[vuKey];
  }

  const { token, advisorSub, advisorName, runTag } = auth;
  const hdrs = apiHeaders(token);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const ids = [];

  for (let i = 0; i < 2; i++) {
    const tag = `listseed${runTag}-vu${vuKey}-${i}`;
    const clientEmail = `k6list.${tag}.${i}@${domain}`;
    const body = buildClientModel({
      advisorSub,
      advisorName,
      uniqueTag: tag,
      withPartner: false,
      clientEmail,
    });
    const res = http.post(`${base}/api/v1/Clients`, JSON.stringify(body), {
      headers: hdrs,
      tags: { name: 'clients_list_seed_create' },
      timeout: HTTP_TIMEOUT,
    });
    const { id } = parseClientCreateResponse(res);
    const moduleSkipped = relaxClientProfileModule && isClientProfileModuleNotActive402(res);
    const accepted = createHttpAccepted(res.status, id) || moduleSkipped;

    if (moduleSkipped) {
      for (let j = 0; j < ids.length; j++) {
        http.del(`${base}/api/v1/Clients/${encodeURIComponent(ids[j])}`, null, {
          headers: hdrs,
          tags: { name: 'clients_list_seed_cleanup' },
          timeout: HTTP_TIMEOUT,
        });
      }
      abortTest(
        'seed: 402 client_profile on create. Enable **client_profile** for the tenant. **RELAX_CLIENT_PROFILE_MODULE** does not skip creates here.',
      );
    }

    if (!accepted || !id) {
      for (let j = 0; j < ids.length; j++) {
        http.del(`${base}/api/v1/Clients/${encodeURIComponent(ids[j])}`, null, {
          headers: hdrs,
          tags: { name: 'clients_list_seed_cleanup' },
          timeout: HTTP_TIMEOUT,
        });
      }
      abortTest(`seed: create ${i + 1}/2 failed VU ${vuKey} HTTP ${res.status}`);
    }
    ids.push(id);
  }

  const verify = http.get(`${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`, {
    headers: hdrs,
    tags: { name: 'clients_list_seed_verify' },
    timeout: HTTP_TIMEOUT,
  });
  const verifyOk = verify.status === 200 && listResponseContainsBothIds(verify, ids[0], ids[1]);
  if (!verifyOk) {
    for (let j = 0; j < ids.length; j++) {
      http.del(`${base}/api/v1/Clients/${encodeURIComponent(ids[j])}`, null, {
        headers: hdrs,
        tags: { name: 'clients_list_seed_cleanup' },
        timeout: HTTP_TIMEOUT,
      });
    }
    abortTest(`seed: verify GET failed VU ${vuKey} HTTP ${verify.status}`);
  }

  const entry = { token, advisorSub, ids };
  store[vuKey] = entry;
  console.log(`[k6-clients-list-load] seed VU ${vuKey} ok: ids=${ids.join(',')}`);
  return entry;
}

export function setup() {
  const runTag = `r${Date.now()}`;
  console.log(
    `[k6-clients-list-load] VUS=${VUS} DURATION=${DURATION}${DURATION_FROM_ENV ? ' (-e DURATION)' : ' (default)'} | runTag=${runTag} (concurrent per-VU seed) | IDENTITY_BASE=${IDENTITY_BASE} | BASE_URL=${API_BASE}`,
  );

  const ctx = loginUserContext(FIRST_LIFECYCLE_USER);
  if (!ctx) {
    abortTest(
      'setup: login failed (ROPC or JWT).\n' +
        '  • **invalid_client** on /connect/token: **SIGNUP_ROPC_CLIENT_ID** / **SIGNUP_ROPC_CLIENT_SECRET** must match **this** STS (**IDENTITY_BASE**). Copy the current secret from Identity Admin → Clients → Secrets.\n' +
        '  • If the OAuth client uses **client_secret_basic**, add **-e SIGNUP_ROPC_TOKEN_AUTH=basic** (default is form **post**).\n' +
        '  • Or avoid ROPC: put a **fresh** portal **JWT** in **lifecycle-users.json** row 0 **"token"** (DevTools → Network → Authorization).',
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
  const base = data.base || API_BASE;
  deleteClientsAndPlansByLastNameNeedle(base, hdrs, data.advisorSub, `listseed${data.runTag}`, HTTP_TIMEOUT, {
    list: 'clients_list_teardown_list',
    cfList: 'clients_list_teardown_cf_list',
    delCf: 'clients_list_teardown_delete_cashflow',
    delClient: 'clients_list_teardown_delete_client',
  });
  delete globalThis.__k6ClientsListSeedByVu;
}

export const options = {
  scenarios: {
    clients_list_all: {
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
  if (!data || !data.token || !data.runTag || !data.advisorSub || !data.advisorName) {
    abortTest('internal: setup returned invalid data.');
  }
  const base = data.base || API_BASE;
  const auth = {
    token: data.token,
    advisorSub: data.advisorSub,
    advisorName: data.advisorName,
    runTag: data.runTag,
  };
  const seeded = seedVuIfNeeded(base, __VU, auth);
  if (!seeded || !seeded.ids || seeded.ids.length < 2) {
    console.error(`[k6-clients-list-load] VU ${__VU}: seed incomplete.`);
    return;
  }

  const hdrs = apiHeaders(seeded.token);
  const url = `${base}/api/v1/Clients/${encodeURIComponent(seeded.advisorSub)}/all`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: 'clients_list_all' },
    timeout: HTTP_TIMEOUT,
  });

  check(res, {
    'list: GET 200': (r) => r.status === 200,
  });
  check(res, {
    'list: body includes both seeded client Ids': (r) =>
      listResponseContainsBothIds(r, seeded.ids[0], seeded.ids[1]),
  });

  if (THINK_SEC > 0) sleep(THINK_SEC);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  moduleName: 'clients',
  sliceId: 'k6-clients-list-load',
});
