/**
 * Post-signup client API lifecycle (Ibernia.Api `ClientsController`).
 *
 * **Two phases per user**
 * 1. **Login** — obtain a Bearer **access_token**: either **`preloadedAccessToken`** (JWT from portal) or **ROPC** `POST …/connect/token` with email/password (**SIGNUP_ROPC_CLIENT_ID** + optional secret).
 * 2. **API clients** — with that token, sequential **create → update → delete** (no partner), then again **with partner**.
 *
 * When using ROPC only (e.g. after HTML signup): **SIGNUP_ROPC_CLIENT_ID** — OAuth client allowed for `grant_type=password` on your STS.
 *
 * Optional:
 * - **SIGNUP_ROPC_CLIENT_SECRET** — confidential clients
 * - **SIGNUP_ROPC_TOKEN_AUTH** — **`post`** (default): `client_id` + `client_secret` in form body. **`basic`**: HTTP Basic `Authorization: Base64(client_id:client_secret)` and **no** `client_secret` in body — use when Duende client is **`client_secret_basic`** and you get **`invalid_client`** with post.
 * - **SIGNUP_ROPC_SCOPE** (default `openid profile email roles ibernia_api`)
 * - **CLIENT_API_EMAIL_DOMAIN** (default `example.com`) — synthetic client/partner emails
 * - **CLIENT_LIFECYCLE_THINK_SEC** — pause between steps (default reuses caller `thinkSec` or **0.2**)
 * - **IDENTITY_SUB_MAP_FILE** (default `identity-user-sub-map.json`) — optional JSON map **`{ "user01@gmail.com": "<Identity UserId>" }`**
 *   (lowercase keys). When ROPC returns a JWT subject (`sub` / `oid` / common .NET nameidentifier claim), it is **checked** against the map; **`FinancialAdvisor.AdvisorId` prefers the token subject**
 *   (API auth). If map and token disagree, a warning is logged. If tokens are opaque or omit subject claims but the map has the email, the map value is used (also inside ROPC login when needed). If **`open()` fails** (wrong cwd / Docker), a **warning** is logged; use an absolute **`IDENTITY_SUB_MAP_FILE`**, mount the file, or pass **`advisorId`** / **`identityUserId`** on each lifecycle user row (see **`k6/clients/k6-client-full-lifecycle.js`**).
 * - **LIFECYCLE_VERBOSE** — set to **`1`** / **`true`** / **`yes`** to log **optional** messages when the advisor id comes from the **identity map** or **`advisorId`** row instead of the JWT (default: quiet for those success fallbacks).
 *
 * **Exports for other scripts:** **`lifecycleLoginAcquireToken`**, **`resolveAdvisorSub`** (same behavior as used by **`runSignupClientLifecycle`**).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { useUserPool, loadPoolSlice } from './user-pool/load-pool-slice.js';
import { parseJwtPayload, subjectFromJwtClaims } from './auth/jwt.js';
import { validateLoadTesterClaim, refreshTokenIfNeeded } from './auth/load-tester.js';
import { fetchPasswordGrantToken, acquireLoadTesterToken } from './auth/ropc.js';

export { parseJwtPayload, subjectFromJwtClaims } from './auth/jwt.js';
export {
  isLoadTesterClaimPresent,
  validateLoadTesterClaim,
  refreshTokenIfNeeded,
} from './auth/load-tester.js';
export { fetchPasswordGrantToken, acquireLoadTesterToken } from './auth/ropc.js';

/** Log non-critical advisor-id fallback details (map / row vs JWT). */
function lifecycleVerbose() {
  return ['1', 'true', 'yes'].includes((__ENV.LIFECYCLE_VERBOSE || '').trim().toLowerCase());
}

const DEFAULT_SUB_MAP_FILENAME = 'identity-user-sub-map.json';
const IDENTITY_SUB_MAP_PATH = (__ENV.IDENTITY_SUB_MAP_FILE || DEFAULT_SUB_MAP_FILENAME).trim();

function isAbsoluteFilesystemPath(p) {
  if (!p) return false;
  if (p.startsWith('\\\\')) return true;
  if (/^[A-Za-z]:[\\/]/.test(p)) return true;
  if (p.startsWith('/')) return true;
  return false;
}

/**
 * k6 `open()` resolves a bare filename relative to the **importing** file (`lib/`), not the entry script folder.
 * So default `identity-user-sub-map.json` is tried as `../identity-user-sub-map.json` first (repo root).
 */
function identitySubMapOpenCandidates() {
  const p = IDENTITY_SUB_MAP_PATH;
  if (isAbsoluteFilesystemPath(p)) return [p];
  if (p.includes('/') || p.includes('\\')) return [p];
  const base = p.split(/[/\\]/).pop() || p;
  return [`../${base}`, base];
}

function loadIdentitySubByEmail() {
  const errors = [];
  for (const tryPath of identitySubMapOpenCandidates()) {
    try {
      const raw = open(tryPath);
      const o = JSON.parse(raw);
      const out = Object.create(null);
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        for (const k of Object.keys(o)) {
          const v = o[k];
          if (v != null && String(v).trim() !== '') {
            out[String(k).trim().toLowerCase()] = String(v).trim();
          }
        }
      }
      return out;
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : String(e);
      errors.push(`${tryPath}: ${msg}`);
    }
  }
  const mapPathExplicit =
    (__ENV.IDENTITY_SUB_MAP_FILE || '').trim() !== '' &&
    (__ENV.IDENTITY_SUB_MAP_FILE || '').trim() !== DEFAULT_SUB_MAP_FILENAME;
  if (mapPathExplicit || lifecycleVerbose()) {
    console.warn(
      `[k6-client-lifecycle] Cannot read identity sub map. Tried:\n  - ${errors.join(
        '\n  - ',
      )}\nFix: IDENTITY_SUB_MAP_FILE=absolute path, keep the file in load-testing-k6/ (next to k6 scripts), or set advisorId on each lifecycle user row.`,
    );
  }
  return Object.create(null);
}

const identitySubByEmail = loadIdentitySubByEmail();

/**
 * @returns {string|null} AdvisorId for API — normally JWT `sub`; map validates / fallback only.
 */
export function resolveAdvisorSub(email, tokenSub) {
  const key = String(email || '').trim().toLowerCase();
  const mapped = identitySubByEmail[key];
  const sub = tokenSub && String(tokenSub).trim() ? String(tokenSub).trim() : null;

  if (mapped && sub) {
    const same = mapped.toLowerCase() === sub.toLowerCase();
    check({ mapped, sub, email: key }, {
      'Identity UserId map matches JWT sub': () => same,
    });
    if (!same) {
      console.warn(
        `[k6-client-lifecycle] Map in ${IDENTITY_SUB_MAP_PATH} for "${key}" is ${mapped} but token sub is ${sub}. Using token sub for FinancialAdvisor.AdvisorId.`,
      );
    }
    return sub;
  }
  if (mapped && !sub) {
    if (lifecycleVerbose()) {
      console.warn(
        `[k6-client-lifecycle] JWT has no sub; using mapped UserId from ${IDENTITY_SUB_MAP_PATH} for "${key}".`,
      );
    }
    return mapped;
  }
  return sub;
}

function createHttpAccepted(status, id) {
  if (status === 201) return true;
  if (status === 200) return !!id;
  return false;
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (
    lower.includes('dev-api.ibernia.it') ||
    lower.includes('localhost') ||
    lower.includes('127.0.0.1')
  ) {
    return;
  }
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[k6-client-lifecycle] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`,
  );
}

export function parseClientIdFromResponse(res) {
  const { id } = parseClientCreateResponse(res);
  return id;
}

/** Single `res.json()` — k6 response body can only be parsed once reliably. */
export function parseClientCreateResponse(res) {
  if (res.status !== 201 && res.status !== 200) return { id: null, model: null };
  try {
    const j = res.json();
    const id = j && (j.Id || j.id);
    return {
      id: typeof id === 'string' && id.length > 0 ? id : null,
      model: j,
    };
  } catch {
    return { id: null, model: null };
  }
}

function defaultBirthDate() {
  return '1985-06-15T00:00:00.000Z';
}

export function buildClientModel({
  advisorSub,
  advisorName,
  uniqueTag,
  withPartner,
  clientEmail,
  /** Optional; default **Load** */
  clientFirstName,
  /** Optional base last name; when set, last name is **`{base}-{uniqueTag}`** (keeps teardown needle in `uniqueTag`) */
  clientLastNameBase,
} = {}) {
  const num = String(uniqueTag).replace(/\s+/g, '');
  const fn =
    clientFirstName != null && String(clientFirstName).trim() !== ''
      ? String(clientFirstName).trim()
      : 'Load';
  const ln =
    clientLastNameBase != null && String(clientLastNameBase).trim() !== ''
      ? `${String(clientLastNameBase).trim()}-${num}`
      : `Cli${num}`;
  const body = {
    ClientDetails: {
      FirstName: fn,
      LastName: ln,
      BirthDate: defaultBirthDate(),
      PreferredCurrency: 'EUR',
      Country: 'IT',
      InflationRate: 2.5,
      Email: clientEmail,
      Phone: '+39000000000',
    },
    PartnerDetail: null,
    FinancialAdvisor: {
      AdvisorId: advisorSub,
      AdvisorName: advisorName || 'k6 advisor',
    },
    LastUpdated: new Date().toISOString(),
    Notes: `k6 lifecycle ${num} no-partner=${withPartner ? '0' : '1'}`,
  };
  if (withPartner) {
    body.PartnerDetail = {
      FirstName: 'Partner',
      LastName: `P${num}`,
      BirthDate: defaultBirthDate(),
      PreferredCurrency: 'EUR',
      Country: 'IT',
      InflationRate: 2.0,
      Email: `partner.${num}.${Date.now()}@${__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com'}`.trim(),
      Phone: '+39000000001',
    };
  }
  return body;
}

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

function logLifecycle(step, email, detail) {
  console.error(`[k6-client-lifecycle] ${step} (user=${email}): ${detail}`);
}

/** Parse OAuth token error JSON for clearer logs (invalid_client vs invalid_grant, etc.). */
function parseConnectTokenError(res) {
  const body = res.body || '';
  try {
    const j = JSON.parse(body);
    return {
      error: (j.error || '').toString(),
      description: (j.error_description || j.error_uri || '').toString(),
    };
  } catch {
    const m = body.match(/"error"\s*:\s*"([^"]+)"/);
    return { error: m ? m[1] : '', description: '' };
  }
}

function ropcFailureHint(res, hasClientSecret) {
  const { error, description } = parseConnectTokenError(res);
  const desc = description ? ` ${description}`.replace(/\s+/g, ' ').trim() : '';
  const parts = [
    `HTTP ${res.status}`,
    res.error ? `transport=${res.error}` : '',
    `oauth=${error || 'unknown'}${desc ? `: ${desc}` : ''}`,
  ];

  if (error === 'invalid_client') {
    if (!hasClientSecret) {
      parts.push(
        'HINT(invalid_client, missing secret): Confidential OAuth clients require **client_secret** on /connect/token. You did not set SIGNUP_ROPC_CLIENT_SECRET — Duende often responds invalid_client (not invalid_grant). Add -e SIGNUP_ROPC_CLIENT_SECRET=... using the current secret from Identity Admin → Clients → Secrets.',
      );
    } else {
      parts.push(
        'HINT(invalid_client): Wrong client_id or client_secret, client disabled, or wrong STS. Verify Identity Admin. For ROPC, the client must allow grant_type=password. If the client uses **client_secret_basic**, try **-e SIGNUP_ROPC_TOKEN_AUTH=basic** (see lib header).',
      );
    }
  } else if (error === 'unauthorized_client') {
    parts.push(
      'HINT(unauthorized_client): This OAuth client is not allowed to use grant_type=password. Enable Resource Owner Password for a dedicated test client on STS.',
    );
  } else if (error === 'invalid_grant') {
    parts.push(
      'HINT(invalid_grant): Wrong password, user requires email confirmation, account locked, or password grant disabled for this client/user.',
    );
  } else {
    parts.push(
      'HINT: Confirm IDENTITY_BASE /connect/token, SIGNUP_ROPC_CLIENT_ID, SIGNUP_ROPC_SCOPE, and (for confidential clients) SIGNUP_ROPC_CLIENT_SECRET.',
    );
  }
  return parts.filter(Boolean).join('. ');
}

function warnIfJwtExpired(accessToken, email) {
  const c = parseJwtPayload(accessToken);
  const exp = c && (c.exp != null ? c.exp : c.Exp);
  if (typeof exp === 'number' && exp * 1000 < Date.now()) {
    console.warn(
      `[k6-client-lifecycle] JWT for ${email} looks expired (exp=${exp}). Expect 401 from API until you paste a fresh token.`,
    );
  }
}

/**
 * Phase 1 — Login: JWT from row or ROPC password grant. Returns token + claims or null.
 * @param {string} [p.advisorIdFromRow] — Identity user id (FinancialAdvisor.AdvisorId) when JWTs omit `sub` (e.g. Docker without `identity-user-sub-map.json`).
 * @returns {{ accessToken: string, tokenSub: string|null }|null}
 */
export function lifecycleLoginAcquireToken({
  email,
  password,
  preloadedAccessToken,
  identityBase,
  clientId,
  clientSecret,
  scope,
  timeout,
  advisorIdFromRow,
}) {
  const pre = preloadedAccessToken && String(preloadedAccessToken).trim();
  let accessToken = null;
  let tokenSub = null;

  if (pre) {
    const jwtParts = pre.split('.');
    if (jwtParts.length !== 3 || jwtParts.some((p) => !String(p).trim())) {
      logLifecycle('Login (Bearer)', email, 'preloadedAccessToken does not look like a JWT (expected three dot-separated segments).');
      return null;
    }
    warnIfJwtExpired(pre, email);
    accessToken = pre;
    tokenSub = subjectFromJwtClaims(parseJwtPayload(accessToken));
    const rowSubPre =
      advisorIdFromRow != null && String(advisorIdFromRow).trim() !== ''
        ? String(advisorIdFromRow).trim()
        : null;
    if (!tokenSub && rowSubPre) {
      tokenSub = rowSubPre;
      if (lifecycleVerbose()) {
        console.warn(
          `[k6-client-lifecycle] Preloaded JWT has no parseable subject; using advisorIdFromRow for ${email}.`,
        );
      }
    }
    check({ hasSub: !!tokenSub }, {
      'Login: preloaded JWT contains sub': (o) => o.hasSub,
    });
    if (!tokenSub) {
      logLifecycle('Login (Bearer)', email, 'Could not read `sub` from preloaded JWT payload.');
      return null;
    }
    return { accessToken, tokenSub };
  }

  if (!clientId) {
    logLifecycle(
      'Login (ROPC)',
      email,
      'No token on row: set SIGNUP_ROPC_CLIENT_ID (and secret if needed) or add a real JWT in lifecycle-users.json "token".',
    );
    return null;
  }

  const tokenRes = fetchPasswordGrantToken({
    identityBase,
    clientId,
    clientSecret,
    scope,
    username: email,
    password,
    timeout,
  });

  let ropcJson = null;
  const tokenOk =
    check(tokenRes, {
      'Login: ROPC HTTP 200': (r) => r.status === 200,
    }) &&
    check(tokenRes, {
      'Login: ROPC body has access_token': (r) => {
        try {
          ropcJson = r.json();
          return !!(ropcJson && (ropcJson.access_token || ropcJson.accessToken));
        } catch {
          return false;
        }
      },
    });

  if (!tokenOk) {
    const hint = ropcFailureHint(tokenRes, !!clientSecret);
    const snip = (tokenRes.body || '').substring(0, 500).replace(/\s+/g, ' ');
    logLifecycle('Login (ROPC) /connect/token', email, `${hint} Raw: ${snip}`);
    return null;
  }

  accessToken = ropcJson ? ropcJson.access_token || ropcJson.accessToken : null;
  if (!accessToken) {
    logLifecycle('Login (ROPC)', email, 'No access_token in JSON body.');
    return null;
  }

  tokenSub = subjectFromJwtClaims(parseJwtPayload(accessToken));
  if (!tokenSub) {
    const idTok = ropcJson && (ropcJson.id_token || ropcJson.idToken);
    tokenSub = subjectFromJwtClaims(idTok ? parseJwtPayload(idTok) : null);
  }
  if (!tokenSub) {
    const mapKey = String(email || '').trim().toLowerCase();
    const mapped = identitySubByEmail[mapKey];
    if (mapped) {
      tokenSub = mapped;
      if (lifecycleVerbose()) {
        console.warn(
          `[k6-client-lifecycle] ROPC tokens have no parseable subject; using ${IDENTITY_SUB_MAP_PATH} for "${mapKey}".`,
        );
      }
    }
  }
  const rowSub =
    advisorIdFromRow != null && String(advisorIdFromRow).trim() !== ''
      ? String(advisorIdFromRow).trim()
      : null;
  if (!tokenSub && rowSub) {
    tokenSub = rowSub;
    if (lifecycleVerbose()) {
      console.warn(
        `[k6-client-lifecycle] ROPC tokens have no parseable subject and no map entry; using advisorIdFromRow from lifecycle user row for ${email}.`,
      );
    }
  }
  check({ hasSub: !!tokenSub }, {
    'Login: ROPC user id resolved (JWT or identity map)': (o) => o.hasSub,
  });
  if (!tokenSub) {
    logLifecycle(
      'Login (ROPC)',
      email,
      `No user id: JWT access/id tokens lack subject claims (or are opaque), no entry in ${IDENTITY_SUB_MAP_PATH}, and no row "advisorId"/"identityUserId". Mount the map file, set IDENTITY_SUB_MAP_FILE to an absolute path, or add advisorId per user in ${__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json'}.`,
    );
    return null;
  }

  return { accessToken, tokenSub };
}

/**
 * After HTML signup (ROPC) or lifecycle-only (token or ROPC): API client CRUD ×2. All steps sequential.
 * @param {object} p
 * @param {string} p.apiBase — e.g. https://dev-api.ibernia.it
 * @param {string} p.identityBase — used for ROPC `/connect/token` URL when password path is used
 * @param {string} p.email — user email (for logs / identity-user-sub-map)
 * @param {string} p.password — password for ROPC when **preloadedAccessToken** is omitted
 * @param {string} [p.preloadedAccessToken] — optional JWT (`access_token`); skips ROPC when non-empty
 * @param {string} p.uniqueTag — vu/iter/timestamp fragment for collision-free client emails
 * @param {string} p.timeout
 * @param {number} p.thinkSec
 */
export function runSignupClientLifecycle(p) {
  const {
    apiBase,
    identityBase,
    email,
    password,
    preloadedAccessToken,
    uniqueTag,
    timeout,
    thinkSec,
  } = p;

  assertApiBase(apiBase);
  const base = apiBase.replace(/\/$/, '');
  const clientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const clientSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
  const scope = (
    __ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api'
  ).trim();

  const auth = lifecycleLoginAcquireToken({
    email,
    password,
    preloadedAccessToken,
    identityBase,
    clientId,
    clientSecret,
    scope,
    timeout,
  });
  if (!auth) return;

  const { accessToken, tokenSub } = auth;
  console.log(`[k6-client-lifecycle] Login OK → API /Clients (user=${email})`);

  const claims = parseJwtPayload(accessToken);
  const advisorSub = resolveAdvisorSub(email, tokenSub);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || email;

  if (!advisorSub) {
    logLifecycle(
      'API clients',
      email,
      'No advisor id: JWT has no `sub` and identity-user-sub-map has no lowercase email entry.',
    );
    return;
  }

  const pause = () => sleep(Math.max(0, thinkSec));
  pause();

  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const clientEmail = `k6c.${uniqueTag}.${Date.now()}@${domain}`;
  const hdrs = apiHeaders(accessToken);

  // --- Phase 2: API clients (create / update / delete ×2) ---

  // --- 1) Create without partner ---
  const create1Body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });
  const resCreate1 = http.post(`${base}/api/v1/Clients`, JSON.stringify(create1Body), {
    headers: hdrs,
    tags: { name: 'Clients_create_no_partner' },
    timeout,
  });
  const { id: id1, model: model1Raw } = parseClientCreateResponse(resCreate1);
  const create1Accepted = createHttpAccepted(resCreate1.status, id1);
  check(resCreate1, {
    'Client (no partner) create 201 or 200+id': () => create1Accepted,
  });
  if (!id1 || !model1Raw) {
    logLifecycle(
      'POST /Clients (no partner)',
      email,
      `No client id in response. HTTP ${resCreate1.status} snip=${(resCreate1.body || '').substring(0, 300)}`,
    );
    return;
  }
  pause();

  // --- 2) Edit ---
  const model1 = JSON.parse(JSON.stringify(model1Raw));
  model1.Id = id1;
  model1.ClientDetails = model1.ClientDetails || {};
  model1.ClientDetails.FirstName = 'LoadUpd';
  model1.Notes = `${model1.Notes || ''} | edited`.slice(0, 500);

  const resPut1 = http.put(`${base}/api/v1/Clients`, JSON.stringify(model1), {
    headers: hdrs,
    tags: { name: 'Clients_update_no_partner' },
    timeout,
  });
  check(resPut1, {
    'Client (no partner) update 200': (r) => r.status === 200,
  });
  if (resPut1.status !== 200) {
    logLifecycle('PUT /Clients', email, `HTTP ${resPut1.status} ${(resPut1.body || '').substring(0, 250)}`);
  }
  pause();

  // --- 3) Delete ---
  const resDel1 = http.del(`${base}/api/v1/Clients/${encodeURIComponent(id1)}`, null, {
    headers: hdrs,
    tags: { name: 'Clients_delete_no_partner' },
    timeout,
  });
  check(resDel1, {
    'Client (no partner) delete 200': (r) => r.status === 200,
  });
  if (resDel1.status !== 200) {
    logLifecycle('DELETE /Clients/{id}', email, `id=${id1} HTTP ${resDel1.status}`);
  }
  pause();

  // --- 4) Create with partner ---
  const clientEmail2 = `k6cp.${uniqueTag}.${Date.now()}@${domain}`;
  const create2Body = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag: `${uniqueTag}b`,
    withPartner: true,
    clientEmail: clientEmail2,
  });
  const resCreate2 = http.post(`${base}/api/v1/Clients`, JSON.stringify(create2Body), {
    headers: hdrs,
    tags: { name: 'Clients_create_with_partner' },
    timeout,
  });
  const { id: id2, model: model2Raw } = parseClientCreateResponse(resCreate2);
  const create2Accepted = createHttpAccepted(resCreate2.status, id2);
  check(resCreate2, {
    'Client (with partner) create 201 or 200+id': () => create2Accepted,
  });
  if (!id2 || !model2Raw) {
    logLifecycle(
      'POST /Clients (with partner)',
      email,
      `No client id. HTTP ${resCreate2.status} snip=${(resCreate2.body || '').substring(0, 300)}`,
    );
    return;
  }
  pause();

  // --- 5) Edit ---
  const model2 = JSON.parse(JSON.stringify(model2Raw));
  model2.Id = id2;
  model2.ClientDetails = model2.ClientDetails || {};
  model2.ClientDetails.FirstName = 'LoadUpd2';
  model2.Notes = `${model2.Notes || ''} | edited2`.slice(0, 500);

  const resPut2 = http.put(`${base}/api/v1/Clients`, JSON.stringify(model2), {
    headers: hdrs,
    tags: { name: 'Clients_update_with_partner' },
    timeout,
  });
  check(resPut2, {
    'Client (with partner) update 200': (r) => r.status === 200,
  });
  if (resPut2.status !== 200) {
    logLifecycle('PUT /Clients (partner)', email, `HTTP ${resPut2.status} ${(resPut2.body || '').substring(0, 250)}`);
  }
  pause();

  // --- 6) Delete ---
  const resDel2 = http.del(`${base}/api/v1/Clients/${encodeURIComponent(id2)}`, null, {
    headers: hdrs,
    tags: { name: 'Clients_delete_with_partner' },
    timeout,
  });
  check(resDel2, {
    'Client (with partner) delete 200': (r) => r.status === 200,
  });
  if (resDel2.status !== 200) {
    logLifecycle('DELETE /Clients/{id} (partner)', email, `id=${id2} HTTP ${resDel2.status}`);
  }
}

// --- Lifecycle persistence helpers (DEV / non-prod tooling; no auth bypass) ---

/** Alias for **`lifecycleLoginAcquireToken`** (orchestrator / docs naming). */
export function loginUser(params) {
  return lifecycleLoginAcquireToken(params);
}

/**
 * Merge **`additions`** into **`baseline`** by **email** (case-insensitive). Later rows overwrite same keys on match.
 * Keeps existing **`token`** when an incoming row omits **`token`** (spread order: prev then patch with incoming defined keys only).
 * @param {object[]} baseline
 * @param {object[]} additions
 */
export function mergeLifecycleUserRowsByEmail(baseline, additions) {
  const out = Array.isArray(baseline) ? baseline.map((r) => ({ ...r })) : [];
  const indexByLower = new Map();
  for (let i = 0; i < out.length; i++) {
    const lo = String(out[i].email || '').trim().toLowerCase();
    if (lo) indexByLower.set(lo, i);
  }
  const addList = Array.isArray(additions) ? additions : [];
  for (let a = 0; a < addList.length; a++) {
    const row = addList[a];
    if (!row || typeof row !== 'object') continue;
    const lo = String(row.email || '').trim().toLowerCase();
    if (!lo) continue;
    const idx = indexByLower.get(lo);
    const patch = { ...row };
    if (idx !== undefined) {
      const prev = { ...out[idx] };
      for (const k of Object.keys(patch)) {
        if (patch[k] === undefined) continue;
        prev[k] = patch[k];
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'password') && !Object.prototype.hasOwnProperty.call(patch, 'token')) {
        delete prev.token;
      }
      out[idx] = { ...prev, email: String(row.email).trim() };
    } else {
      out.push({ ...patch, email: String(row.email).trim() });
      indexByLower.set(lo, out.length - 1);
    }
  }
  return out;
}

/**
 * Append a lifecycle row for **`handleSummary`** merge (per-VU buffer; no disk I/O here).
 * @param {object} row — must include **`email`**; **`token`** is optional (never log it).
 */
export function persistLifecycleUser(row) {
  if (!row || typeof row !== 'object') return;
  const em = String(row.email || '').trim();
  if (!em) return;
  if (!globalThis.__k6LifecyclePersistBuckets) globalThis.__k6LifecyclePersistBuckets = {};
  const vu = typeof __VU !== 'undefined' ? __VU : 0;
  if (!globalThis.__k6LifecyclePersistBuckets[vu]) globalThis.__k6LifecyclePersistBuckets[vu] = [];
  globalThis.__k6LifecyclePersistBuckets[vu].push({ ...row, email: em });
}

/** Flatten per-VU **`persistLifecycleUser`** buckets (sorted by VU key) for merge at end of test. */
export function flattenLifecyclePersistBuckets() {
  const buckets = globalThis.__k6LifecyclePersistBuckets;
  if (!buckets || typeof buckets !== 'object') return [];
  const out = [];
  for (const vuKey of Object.keys(buckets).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))) {
    const arr = buckets[vuKey];
    if (!Array.isArray(arr)) continue;
    for (const row of arr) {
      if (row && String(row.email || '').trim()) out.push(row);
    }
  }
  return out;
}

/**
 * Read **`lifecycle-users.json`** (or **`path`**) with the same candidate resolution as other k6 scripts.
 * @param {string} [path] — defaults to **`LIFECYCLE_USERS_FILE`** env or **`lifecycle-users.json`**
 */
export function loadLifecycleUsers(path) {
  if (useUserPool()) {
    return loadPoolSlice();
  }
  const rawEnv = (path || (__ENV.LIFECYCLE_USERS_FILE || '').trim() || 'lifecycle-users.json').trim();
  let resolvedDefault = '';
  try {
    resolvedDefault = String(import.meta.resolve('../lifecycle-users.json'));
  } catch {
    resolvedDefault = '';
  }
  const candidates = [];
  if (rawEnv) {
    candidates.push(rawEnv);
    const looksAbs =
      /^[a-zA-Z]:[\\/]/.test(rawEnv) || rawEnv.startsWith('\\\\') || rawEnv.startsWith('/');
    if (!looksAbs) {
      try {
        candidates.push(String(import.meta.resolve('../../' + rawEnv.replace(/^\.\//, ''))));
      } catch {
        /* ignore */
      }
      candidates.push('../../' + rawEnv.replace(/^\.\//, ''));
    }
  }
  if (resolvedDefault && rawEnv === 'lifecycle-users.json') candidates.push(resolvedDefault);
  candidates.push('../lifecycle-users.json', 'lifecycle-users.json');
  const uniq = [];
  const seen = new Set();
  for (const p of candidates) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    uniq.push(p);
  }
  let raw;
  const errors = [];
  for (const p of uniq) {
    try {
      raw = open(p);
      break;
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : String(e);
      errors.push(`${p}: ${msg}`);
    }
  }
  if (raw == null) {
    throw new Error(`[loadLifecycleUsers] Cannot read lifecycle file. Tried:\n  - ${errors.join('\n  - ')}`);
  }
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error('[loadLifecycleUsers] JSON root must be an array.');
  return arr;
}

export { performHtmlSignup as signupUser } from './k6-identity-html-register.js';
