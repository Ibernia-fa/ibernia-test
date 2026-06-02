/**
 * Identity sign-up load test — **registration accepted**, no mailbox checks.
 *
 * POST success rule (default): **301–308** redirect, **or** **200** whose body does **not** look like a failed
 * registration (duplicate email, validation summary, etc.). Re-using the same **User01@gmail.com** (same band) after a
 * prior run returns **200** with **“Email is already registered”** — the POST check **fails** (expected). Use a fresh
 * band: **`SIGNUP_INDEX_OFFSET=20`** → first `User21@…`, **SIGNUP_BAND_STATE=persistent**, or change **EMAIL_LOCAL_PREFIX**.
 * Set **RELAX_BODY_CHECK=1** for status-only matching (not recommended). **DEBUG_POST=1** logs status, URL, rejection match.
 *
 * Dev form (live HTML): first name, last name, email, password, terms.
 * - GET  /Account/Register
 * - POST /Account/RegisterWithoutUsername
 *
 * ## Mode `count` (default): create exactly N users with auto data
 *
 * - **USER_COUNT** — alias for **`TOTAL_REGISTRATIONS`** (if set, overrides default count).
 * - **SIGNUP_BATCH_SIZE** — optional cap on parallel **`VUS`** (throttles concurrent HTML signups).
 * - **EMAIL_GENERATION_MODE** — **`prefix_index`** (default: **`User` + pad + `@` + domain**) or **`k6user`** → **`k6user-{SIGNUP_RUN_TAG}-{index}@{EMAIL_DOMAIN}`** (default domain **`example.test`** when unset in k6 mode — set **`EMAIL_DOMAIN`** explicitly).
 * - **SIGNUP_RUN_TAG** — band for k6user emails (default **`r{unixMs}`** at script load). Use a CI/build id for reproducible addressing within a pool.
 * - **POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN=1** — after successful HTML signup + ConfirmEmail follow-up: **ROPC** with **`LOAD_TESTER_ROPC_CLIENT_ID`** or **`SIGNUP_ROPC_CLIENT_ID`** and matching secret env, then **`check`** JWT contains **`load_tester`**. When combined with **`SIGNUP_EXPORT_LIFECYCLE_USERS=1`**, persisted rows include **`token`**, **`advisorId`**, **`identityUserId`**, **`createdAt`** when token acquisition succeeds.
 * - **VUS** — parallel workers (`shared-iterations`). In **count** mode, default is **TOTAL_REGISTRATIONS** (e.g. 20
 *   users ⇒ **20 concurrent** signups). In **duration** mode, default **20**. Override with **-e VUS=5** to throttle.
 * - **EMAIL_LOCAL_PREFIX** (default `User`) + padded index + `@` + **EMAIL_DOMAIN** → e.g. **`User01@gmail.com`**, **`User02@gmail.com`**
 * - **SIGNUP_INDEX_OFFSET** — shifts the padded id: `User${pad(iter + OFFSET + 1)}@…` (e.g. **20** → first `User21@…` when iteration 0).
 *   Parsed as **decimal** (`010` ⇒ **10** ⇒ first **User11** … **User30** for 20 iters). **Omit** this env when **SIGNUP_BAND_STATE=persistent** (count mode) to continue after the last run’s band (see below).
 * - **SIGNUP_BAND_STATE** (default **off**) — **`persistent`** (count mode only): read **`SIGNUP_BAND_STATE_FILE`** (default `k6-signup-band-state.json`) for the previous run’s **lastMaxIndex**; if **SIGNUP_INDEX_OFFSET** is omitted, the next band starts at **lastMaxIndex + 1** (same as `SIGNUP_INDEX_OFFSET = lastMaxIndex`). **handleSummary** updates the file so numeric bands **do not overlap** across successive runs in the same working directory. Use **off** for fixed **User01**… bands or CI where you set **SIGNUP_INDEX_OFFSET** yourself.
 * - **SIGNUP_PREVIOUS_MAX_INDEX** (optional) — fail fast if **first numeric index** ≤ this value (set to the prior run’s **last** index, same number **setup** logs as **lastNum**), so you never accidentally reuse an overlapping band when using explicit offsets.
 * - **AUTO_PASSWORD=1** (default) — strong random password per signup (you won’t know it later; load-only)
 *   OR **AUTO_PASSWORD=indexed** — base **`{EMAIL_LOCAL_PREFIX}@{padded index}`** (e.g. **`User@01`** for **`User01@…`**). STS **Password:RequiredLength** is often **8**; **`User@01`** is only **7** characters, so the script **appends** **`SIGNUP_INDEXED_PASSWORD_PAD_CHAR`** (default **`!`**) until **`SIGNUP_INDEXED_PASSWORD_MIN_LEN`** (default **8**) — e.g. **`User@01!`**. Match the same value in **`lifecycle-users.json`** for ROPC.
 *   OR **SIGNUP_PASSWORD** — one password for every user (still dev-only; don’t commit)
 * - **AUTO_NAMES=1** (default) — per user: **FirstName** `LoadFirst01`…, **LastName** `LoadLast01`… (same numeric suffix as email index; distinct local-part vs email).
 *   Override with **FIRST_NAME_PREFIX**, **LAST_NAME_PREFIX** (or **FIRST_NAME** / **LAST_NAME** when **AUTO_NAMES=0**)
 *
 * ## Mode `duration`: steady load for a time window
 *
 * - Set **MODE=duration**
 * - **VUS**, **DURATION** as before
 *
 * Other env: **IDENTITY_BASE** (default https://dev-identity.ibernia.it), **THINK_SEC**, **ALLOW_NON_DEV=1**,
 * **RELAX_BODY_CHECK=1** (status-only POST check; not recommended), **DEBUG_POST=1** (log POST outcome),
 * **HTTP_TIMEOUT** (default **120s**) — GET/POST timeout (burst **VUS=20** on dev can 429/502/timeout; raise timeout or use **-e VUS=5**).
 * **VU_STAGGER_SEC** (default **0.04**) — `sleep((__VU - 1) * value)` at iteration start to spread bursts (set **0** to disable).
 * **POST_RETRY_MAX** (default **0**) — if **1+**, on transient POST (**0**, **408**, **429**, **5xx**), wait **POST_RETRY_SLEEP_SEC** (default **1.5**), fresh GET + token, retry POST. **Caution:** if the server **503s but still creates the user**, the retry can look like **duplicate email** and doubles traffic (use only when needed).
 * **RELAX_HTTP_REQ_FAILED=1** — relax `http_req_failed` threshold to allow up to 100% failed HTTP (dev flakiness only; not for CI gates).
 * **RELAX_CHECKS=1** — do not fail the run on the **`checks`** threshold (default requires **>90%** check pass rate). Use while debugging; for real gates keep default **off**.
 * **LOG_FAILED_HTTP=1** — log POST `status` / `error` when the success check fails; for **4xx/5xx** with no duplicate needle, logs a short **body_snip** (server error page / stack hint).
 * **SKIP_REGISTER_EMAIL_CONFIRM_FOLLOW=1** — after a successful **POST** register, the script normally **GET**s **`Location`** when it points to **`ConfirmEmail`** (dev STS may redirect there while **`redirects:0`** on POST would skip it). That completes **`EmailConfirmed`** so **ROPC** works. Set to skip that follow-up GET (debug only).
 *
 * ## Optional: signup + API client lifecycle (**SIGNUP_CLIENT_LIFECYCLE=1**)
 *
 * After each **successful** HTML registration, runs **sequential** API steps on **dev-api** using the **same** email/password:
 * **ROPC** `POST …/connect/token` → **create client (no partner)** → **PUT update** → **DELETE** → **create client (with partner)** → **PUT** → **DELETE**.
 *
 * Requires **`SIGNUP_ROPC_CLIENT_ID`** (OAuth client on STS that allows **`grant_type=password`** for these users). Optional **`SIGNUP_ROPC_CLIENT_SECRET`**, **`SIGNUP_ROPC_SCOPE`**
 * (default `openid profile email roles iberia_api`). **`BASE_URL`** targets the API (default `https://dev-api.ibernia.it`). Client/partner synthetic emails use **`CLIENT_API_EMAIL_DOMAIN`** (default `example.com`).
 *
 * ## Client lifecycle only — **no HTML signup** (**CLIENT_LIFECYCLE_ONLY=1**)
 *
 * Skips **`GET/POST /Account/Register`**. Reads **`LIFECYCLE_USERS_FILE`** (default **`lifecycle-users.json`**) — JSON array of **`{ "email", "token"? , "password"? }`** for **existing** users. Each row needs **`email`** plus at least one of **`token`** (Bearer JWT from dev portal) or **`password`** (ROPC). **Best:** set **`token`** on every row — then **no** **`SIGNUP_ROPC_CLIENT_ID`** is required. If any row lacks **`token`**, **`SIGNUP_ROPC_CLIENT_ID`** is required for ROPC on those rows.
 * Each iteration: **login** (JWT or ROPC to **`/connect/token`**), then **API client** CRUD on **`BASE_URL`**. **`MODE`** must be **`count`**. Copy **`lifecycle-users.example.json`** → **`lifecycle-users.json`** (gitignored).
 *
 * **Why runs differ:** `VUS=20` without a new **SIGNUP_INDEX_OFFSET** can collide with existing **User01–User20** display names / server-side rules → POST checks fail.
 * Re-using the **same** offset (e.g. 40 twice) reuses the same **User41–User60** index band **and** can stress dev → **http_req_failed** above zero.
 * **POST 500** on fresh emails (`rejectionMatch=none`) = **Identity/server fault**. Common on dev: **SMTP throttling**
 * (e.g. **Zoho `5.4.6 Unusual sending activity`**) — each signup sends a confirmation email; **20 parallel** signups can trip
 * the provider. Mitigate: lower **VUS**, space runs apart, use a dev mail sink / **no-op email**, or make STS **not 500**
 * when `SendEmailAsync` fails (product change). Read **body_snip** with **LOG_FAILED_HTTP=1** for the exact exception.
 *
 * ## Export **`lifecycle-users.json`** after successful signup (**`SIGNUP_EXPORT_LIFECYCLE_USERS=1`**)
 *
 * Opt-in: at **script init** the file **`LIFECYCLE_EXPORT_FILE`** (default: same as **`LIFECYCLE_USERS_FILE`**, i.e. **`lifecycle-users.json`**) is read as a JSON array baseline (missing or invalid → empty). Each successful signup logs **`K6_LIFECYCLE_EXPORT_ROW:{…}`** to stdout; **`runners/provision-users.ps1`** merges those lines from the k6 log (required on k6 v2+ because VU state is isolated from **`handleSummary`**). **`handleSummary`** may also write the file when the runtime shares export buffers. Rows include at least **`{ "email", "password" }`**, and with **`POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN=1`** may include **`token`**, **`advisorId`**, **`identityUserId`**, **`createdAt`**. **Security:** plaintext passwords in logs and on disk — keep artifacts gitignored. Ignored when **`CLIENT_LIFECYCLE_ONLY=1`** (no HTML signup).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import {
  runSignupClientLifecycle,
  mergeLifecycleUserRowsByEmail,
  acquireLoadTesterToken,
  subjectFromJwtClaims,
} from '../../lib/k6-client-lifecycle.js';

const clientLifecycleOnly = ['1', 'true', 'yes'].includes(
  (__ENV.CLIENT_LIFECYCLE_ONLY || '').trim().toLowerCase(),
);

const debugPost = ['1', 'true', 'yes'].includes((__ENV.DEBUG_POST || '').trim().toLowerCase());
const logFailedHttp = ['1', 'true', 'yes'].includes((__ENV.LOG_FAILED_HTTP || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const signupClientLifecycle =
  clientLifecycleOnly ||
  ['1', 'true', 'yes'].includes((__ENV.SIGNUP_CLIENT_LIFECYCLE || '').trim().toLowerCase());
const API_BASE_URL = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const VU_STAGGER_SEC =
  __ENV.VU_STAGGER_SEC === undefined || String(__ENV.VU_STAGGER_SEC).trim() === ''
    ? 0.04
    : Math.max(0, parseFloat(__ENV.VU_STAGGER_SEC));
const POST_RETRY_MAX = Math.max(0, Math.min(3, parseInt(__ENV.POST_RETRY_MAX || '0', 10)));
const POST_RETRY_SLEEP_SEC = Math.max(0, parseFloat(__ENV.POST_RETRY_SLEEP_SEC || '1.5'));

const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `Refusing IDENTITY_BASE="${base}". Use https://dev-identity.ibernia.it or set ALLOW_NON_DEV=1 intentionally.`,
  );
}
assertDevIdentityHost(IDENTITY_BASE);

const MODE = (__ENV.MODE || 'count').toLowerCase();
if (clientLifecycleOnly && MODE !== 'count') {
  throw new Error('[k6-identity-signup] CLIENT_LIFECYCLE_ONLY=1 requires MODE=count.');
}

const BAND_STATE_FILE = (__ENV.SIGNUP_BAND_STATE_FILE || 'k6-signup-band-state.json').trim();
const bandStateRaw = (__ENV.SIGNUP_BAND_STATE || 'off').trim().toLowerCase();
const bandStatePersistent =
  MODE === 'count' && ['persistent', '1', 'true', 'yes'].includes(bandStateRaw);

let bandFileLastMax = 0;
if (bandStatePersistent) {
  const rawBand = (__ENV.SIGNUP_BAND_STATE_FILE || 'k6-signup-band-state.json').trim();
  const bandLooksAbs =
    /^[a-zA-Z]:[\\/]/.test(rawBand) || rawBand.startsWith('\\\\') || rawBand.startsWith('/');
  const bandCandidates = [];
  if (bandLooksAbs) {
    bandCandidates.push(rawBand);
  } else {
    bandCandidates.push(rawBand);
    try {
      bandCandidates.push(String(import.meta.resolve('../../' + rawBand.replace(/^\.\//, ''))));
    } catch {
      /* ignore */
    }
    bandCandidates.push('../../' + rawBand.replace(/^\.\//, ''));
  }
  let parsed = false;
  for (let i = 0; i < bandCandidates.length; i++) {
    const p = bandCandidates[i];
    if (!p) continue;
    try {
      const txt = open(p);
      const o = JSON.parse(txt);
      bandFileLastMax = Math.max(0, Math.floor(Number(o.lastMaxIndex) || 0));
      parsed = true;
      break;
    } catch {
      /* try next */
    }
  }
  if (!parsed) {
    bandFileLastMax = 0;
  }
}

const EMAIL_DOMAIN = (__ENV.EMAIL_DOMAIN || 'gmail.com').trim();
const EMAIL_LOCAL_PREFIX = (__ENV.EMAIL_LOCAL_PREFIX || 'User').trim();
/** Default **2** → `User01`…`User09`…`User99` (wider ids stay unpadded, e.g. `User100`). Override with **EMAIL_PAD**. */
const EMAIL_PAD = Math.max(1, parseInt(__ENV.EMAIL_PAD || '2', 10));

const autoPasswordRaw = (__ENV.AUTO_PASSWORD || '1').trim().toLowerCase();
const useRandomPassword = ['1', 'true', 'yes'].includes(autoPasswordRaw);
const useIndexedPassword = autoPasswordRaw === 'indexed';
const useAutoPassword = useRandomPassword || useIndexedPassword;
const envPwd = (__ENV.SIGNUP_PASSWORD || '').trim();
if (!clientLifecycleOnly && !useAutoPassword && !envPwd) {
  throw new Error(
    'Either set AUTO_PASSWORD=1 (default, random), AUTO_PASSWORD=indexed (User@01 per User01@…), or set SIGNUP_PASSWORD for all signups.',
  );
}

const useAutoNames = !['0', 'false', 'no'].includes((__ENV.AUTO_NAMES || '1').trim().toLowerCase());
const fixedFirst = (__ENV.FIRST_NAME || '').trim();
const fixedLast = (__ENV.LAST_NAME || '').trim();
const FIRST_NAME_PREFIX = (__ENV.FIRST_NAME_PREFIX || 'LoadFirst').trim();
const LAST_NAME_PREFIX = (__ENV.LAST_NAME_PREFIX || 'LoadLast').trim();

const TOTAL_REGISTRATIONS = Math.max(
  1,
  parseInt((__ENV.USER_COUNT || __ENV.TOTAL_REGISTRATIONS || '100').trim(), 10),
);
const SIGNUP_BATCH_SIZE_RAW = (__ENV.SIGNUP_BATCH_SIZE || '').trim();
const SIGNUP_BATCH_SIZE_CAP =
  SIGNUP_BATCH_SIZE_RAW === '' ? null : Math.max(1, parseInt(SIGNUP_BATCH_SIZE_RAW, 10));
const EMAIL_GENERATION_MODE = (__ENV.EMAIL_GENERATION_MODE || 'prefix_index').trim().toLowerCase();
/** Stable within the k6 process unless overridden — use for **`k6user-{tag}-{n}@…`** bands. */
const SIGNUP_RUN_TAG = (__ENV.SIGNUP_RUN_TAG || `r${Date.now()}`).trim();
const postSignupAcquireLoadTester = ['1', 'true', 'yes'].includes(
  (__ENV.POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN || '').trim().toLowerCase(),
);
const LIFECYCLE_USERS_FILE = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
const exportSignupToLifecycle = ['1', 'true', 'yes'].includes(
  (__ENV.SIGNUP_EXPORT_LIFECYCLE_USERS || '').trim().toLowerCase(),
);
/** Target file for merged `{ email, password, … }` rows after signup; defaults to the same path as `LIFECYCLE_USERS_FILE`. */
const LIFECYCLE_EXPORT_FILE = (__ENV.LIFECYCLE_EXPORT_FILE || LIFECYCLE_USERS_FILE).trim();

function resolvedRepoLifecycleUsersPath() {
  try {
    return String(import.meta.resolve('../../lifecycle-users.json'));
  } catch {
    return '';
  }
}

function loadLifecycleUsersFromDisk() {
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
      `[k6-identity-signup] CLIENT_LIFECYCLE_ONLY=1: cannot read lifecycle users. Tried:\n  - ${errors.join(
        '\n  - ',
      )}\nCopy lifecycle-users.example.json → lifecycle-users.json and add per user: "email" + "token" (JWT from portal) and/or "password" (for ROPC).`,
    );
  }
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(
      `[k6-identity-signup] lifecycle users file must be a non-empty JSON array of { "email", "password"? | "token"? }.`,
    );
  }
  let anyRowNeedsRopc = false;
  for (let i = 0; i < arr.length; i++) {
    const r = arr[i];
    const em = r && String(r.email || '').trim();
    const pw = r && String(r.password || '').trim();
    let tok = r && String(r.token || '').trim();
    if (tok && /^bearer\s+/i.test(tok)) {
      tok = tok.replace(/^bearer\s+/i, '').trim();
    }
    if (r) {
      r.token = tok;
    }
    if (!em) {
      throw new Error(`[k6-identity-signup] "${LIFECYCLE_USERS_FILE}" row ${i} must include non-empty "email".`);
    }
    if (!tok && !pw) {
      throw new Error(
        `[k6-identity-signup] "${LIFECYCLE_USERS_FILE}" row ${i} must include "token" (Bearer JWT from portal) and/or "password" (for ROPC). At least one is required.`,
      );
    }
    if (tok) {
      const parts = tok.split('.');
      if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
        throw new Error(
          `[k6-identity-signup] "${LIFECYCLE_USERS_FILE}" row ${i} (${em}): "token" must be a real JWT (three segments: header.payload.sig from portal Network → Authorization, without the "Bearer " prefix). Placeholder text fails here. Remove "token" and use "password" + SIGNUP_ROPC_CLIENT_ID if you do not have a JWT yet.`,
        );
      }
    }
    if (!tok) {
      anyRowNeedsRopc = true;
    }
  }
  if (anyRowNeedsRopc && !(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim()) {
    throw new Error(
      `[k6-identity-signup] "${LIFECYCLE_USERS_FILE}" has rows without "token". Those rows use ROPC — set SIGNUP_ROPC_CLIENT_ID (and secret if needed), or add a "token" field to every row.`,
    );
  }
  if (anyRowNeedsRopc) {
    const raw = String(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
    const low = raw.toLowerCase();
    const docPlaceholders = [
      'your-real-client-id',
      'your-sts-client-id',
      '<your-sts-client-id>',
      '<sts-client-id>',
      'sts-client-id',
    ];
    if (docPlaceholders.includes(low) || (raw.startsWith('<') && raw.endsWith('>'))) {
      throw new Error(
        `[k6-identity-signup] SIGNUP_ROPC_CLIENT_ID="${raw}" is a README placeholder, not a real OAuth client id. ` +
          `Identity will return invalid_client. Copy the **ClientId** from Duende IdentityServer Admin (a client allowed for **password** grant / ROPC), e.g. \`-e SIGNUP_ROPC_CLIENT_ID=abc123...\`. ` +
          `If the client is **confidential**, add \`-e SIGNUP_ROPC_CLIENT_SECRET=...\`. Or put a real JWT in every row's "token" and omit ROPC.`,
      );
    }
    const secRaw = String(__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
    if (secRaw) {
      const secLow = secRaw.toLowerCase().replace(/\s+/g, '_');
      const badSecretHints = [
        'paste_secret_from_admin',
        'your-client-secret',
        'your_client_secret',
        'changeme',
        'replace_me',
      ];
      if (badSecretHints.includes(secLow) || (secRaw.startsWith('<') && secRaw.endsWith('>'))) {
        throw new Error(
          `[k6-identity-signup] SIGNUP_ROPC_CLIENT_SECRET="${secRaw}" looks like documentation text, not the real secret. ` +
            `In Identity Admin → Clients → your client → **Secrets**, copy the **actual secret value** shown once when created (or create a new secret and use that). ` +
            `Do not use strings like PASTE_SECRET_FROM_ADMIN — Identity will return invalid_client.`,
        );
      }
    }
  }
  return arr;
}

/**
 * Lenient read for merge baseline (export). Missing file → `[]`; invalid JSON → `[]` + warn.
 */
function loadLifecycleExportBaselineAtInit() {
  const rawEnv = (__ENV.LIFECYCLE_EXPORT_FILE || '').trim();
  const fallback = (__ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
  const target = rawEnv || fallback;
  const resolvedDefault = (() => {
    try {
      return String(import.meta.resolve('../../lifecycle-users.json'));
    } catch {
      return '';
    }
  })();
  const exportLooksAbs =
    /^[a-zA-Z]:[\\/]/.test(target) || target.startsWith('\\\\') || target.startsWith('/');
  const candidates = [];
  if (exportLooksAbs) {
    candidates.push(target);
  } else {
    candidates.push(target);
    if (resolvedDefault && target === 'lifecycle-users.json') {
      candidates.push(resolvedDefault);
    }
    candidates.push('../../' + target.replace(/^\.\//, ''));
  }
  let raw;
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    if (!p) continue;
    try {
      raw = open(p);
      break;
    } catch {
      /* try next */
    }
  }
  if (raw == null) {
    return [];
  }
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((r) => r && typeof r === 'object' && String(r.email || '').trim())
      .map((r) => ({ ...r }));
  } catch (e) {
    const msg = e && e.message != null ? String(e.message) : String(e);
    console.warn(
      `[k6-identity-signup] SIGNUP_EXPORT_LIFECYCLE_USERS: could not parse "${LIFECYCLE_EXPORT_FILE}" (${msg}) — using empty baseline.`,
    );
    return [];
  }
}

const LIFECYCLE_EXPORT_BASELINE =
  !clientLifecycleOnly && exportSignupToLifecycle ? loadLifecycleExportBaselineAtInit() : [];

function flattenSignupExportBuckets(buckets) {
  if (!buckets || typeof buckets !== 'object') return [];
  const out = [];
  for (const vuKey of Object.keys(buckets).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))) {
    const arr = buckets[vuKey];
    if (!Array.isArray(arr)) continue;
    for (const row of arr) {
      if (row && String(row.email || '').trim() && String(row.password || '').length > 0) {
        out.push(row);
      }
    }
  }
  return out;
}

function mergeLifecycleSignupExport(baseline, buckets) {
  return mergeLifecycleUserRowsByEmail(baseline, flattenSignupExportBuckets(buckets));
}

/** Per-VU buffer (best-effort) + stdout marker for provision script log merge (k6 v2+). */
const LIFECYCLE_EXPORT_STDOUT_MARKER = 'K6_LIFECYCLE_EXPORT_ROW:';
const lifecycleSignupExportByVu = {};

function recordLifecycleExportRow(rowOrEmail, passwordMaybe) {
  if (!exportSignupToLifecycle || clientLifecycleOnly) return;
  const row =
    rowOrEmail && typeof rowOrEmail === 'object' && !Array.isArray(rowOrEmail)
      ? { ...rowOrEmail }
      : { email: rowOrEmail, password: passwordMaybe };
  const em = String(row.email || '').trim();
  const pw = String(row.password ?? '');
  if (!em || !pw) return;
  console.log(`${LIFECYCLE_EXPORT_STDOUT_MARKER}${JSON.stringify(row)}`);
  const vu = typeof __VU !== 'undefined' ? __VU : 0;
  if (!lifecycleSignupExportByVu[vu]) lifecycleSignupExportByVu[vu] = [];
  lifecycleSignupExportByVu[vu].push(row);
}

const lifecycleUsers = clientLifecycleOnly
  ? new SharedArray('lifecycle_users', loadLifecycleUsersFromDisk)
  : null;

const VUS = Math.max(
  1,
  Math.min(
    parseInt(__ENV.VUS || (MODE === 'count' ? String(TOTAL_REGISTRATIONS) : '20'), 10),
    SIGNUP_BATCH_SIZE_CAP != null ? SIGNUP_BATCH_SIZE_CAP : Number.MAX_SAFE_INTEGER,
  ),
);

/** Shared-iterations count / VUs for count mode (lifecycle-only caps VUs by user pool size). */
const SCENARIO_ITERATIONS = TOTAL_REGISTRATIONS;
const SCENARIO_VUS = clientLifecycleOnly
  ? Math.max(1, Math.min(VUS, lifecycleUsers.length, SCENARIO_ITERATIONS))
  : VUS;
/** Shift email / name numeric suffix (see file header). Decimal only (`010` → 10). */
const hasExplicitSignupOffset =
  __ENV.SIGNUP_INDEX_OFFSET !== undefined && String(__ENV.SIGNUP_INDEX_OFFSET).trim() !== '';
const SIGNUP_INDEX_OFFSET_RAW = hasExplicitSignupOffset ? String(__ENV.SIGNUP_INDEX_OFFSET).trim() : '';
const _parsedOffset = hasExplicitSignupOffset ? parseInt(SIGNUP_INDEX_OFFSET_RAW || '0', 10) : NaN;
const explicitSignupOffset = hasExplicitSignupOffset && Number.isFinite(_parsedOffset) ? Math.max(0, _parsedOffset) : 0;
const SIGNUP_INDEX_OFFSET = hasExplicitSignupOffset
  ? explicitSignupOffset
  : bandStatePersistent
    ? bandFileLastMax
    : 0;

const SIGNUP_PREVIOUS_MAX_INDEX_RAW = (__ENV.SIGNUP_PREVIOUS_MAX_INDEX || '').trim();
const _prevMax = SIGNUP_PREVIOUS_MAX_INDEX_RAW === '' ? NaN : parseInt(SIGNUP_PREVIOUS_MAX_INDEX_RAW, 10);
const SIGNUP_PREVIOUS_MAX_INDEX = Number.isFinite(_prevMax) ? Math.max(0, _prevMax) : null;

if (MODE === 'count' && !clientLifecycleOnly && SIGNUP_PREVIOUS_MAX_INDEX !== null) {
  const firstNum = SIGNUP_INDEX_OFFSET + 1;
  if (firstNum <= SIGNUP_PREVIOUS_MAX_INDEX) {
    throw new Error(
      `[k6-identity-signup] Numeric band would overlap a prior band: first index is ${firstNum} but SIGNUP_PREVIOUS_MAX_INDEX=${SIGNUP_PREVIOUS_MAX_INDEX}. ` +
        `Use SIGNUP_INDEX_OFFSET >= ${SIGNUP_PREVIOUS_MAX_INDEX} (next band starts at index ${SIGNUP_PREVIOUS_MAX_INDEX + 1}), or enable SIGNUP_BAND_STATE=persistent.`,
    );
  }
}

/** Meets typical ASP.NET Identity complexity (length + upper + lower + digit + special). */
function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  const all = upper + lower + digits + special;
  for (let i = 0; i < 16; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd;
}

function globalIterationIndex() {
  try {
    return exec.scenario.iterationInTest;
  } catch {
    return typeof __ITER !== 'undefined' ? __ITER : 0;
  }
}

/** Padded user index for email and auto names (scenario iteration + offset + 1). */
function paddedIndexForCountMode() {
  const id = globalIterationIndex() + SIGNUP_INDEX_OFFSET + 1;
  return String(id).padStart(EMAIL_PAD, '0');
}

/**
 * Indexed password: base `{EMAIL_LOCAL_PREFIX}@{idx}` then pad to min length (Identity RequiredLength is often 8).
 * @param {string} idx — already zero-padded index, e.g. `01`
 */
function indexedPasswordFromPaddedIndex(idx) {
  let s = `${EMAIL_LOCAL_PREFIX}@${idx}`;
  const minLen = Math.max(1, parseInt(__ENV.SIGNUP_INDEXED_PASSWORD_MIN_LEN || '8', 10));
  let padChar = (__ENV.SIGNUP_INDEXED_PASSWORD_PAD_CHAR ?? '!').toString();
  padChar = padChar.length > 0 ? padChar[0] : '!';
  while (s.length < minLen) {
    s += padChar;
  }
  return s;
}

function uniqueEmail() {
  const num = paddedIndexForCountMode();
  if (EMAIL_GENERATION_MODE === 'k6user' || EMAIL_GENERATION_MODE === 'k6tag') {
    const dom = (__ENV.EMAIL_DOMAIN || 'example.test').trim();
    return `k6user-${SIGNUP_RUN_TAG}-${num}@${dom}`;
  }
  return `${EMAIL_LOCAL_PREFIX}${num}@${EMAIL_DOMAIN}`;
}

function firstNameForSignup() {
  if (!useAutoNames && fixedFirst) return fixedFirst;
  if (useAutoNames) {
    const idx = paddedIndexForCountMode();
    if (fixedFirst) return `${fixedFirst}${idx}`;
    return `${FIRST_NAME_PREFIX}${idx}`;
  }
  return fixedFirst || FIRST_NAME_PREFIX;
}

function lastNameForSignup() {
  if (!useAutoNames && fixedLast) return fixedLast;
  if (useAutoNames) {
    const idx = paddedIndexForCountMode();
    if (fixedLast) return `${fixedLast}${idx}`;
    return `${LAST_NAME_PREFIX}${idx}`;
  }
  return fixedLast || LAST_NAME_PREFIX;
}

function passwordForSignup() {
  if (useIndexedPassword) {
    return indexedPasswordFromPaddedIndex(paddedIndexForCountMode());
  }
  if (useRandomPassword) return generatePassword();
  return envPwd;
}

function extractAntiforgeryToken(html) {
  const m = html.match(/name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/);
  if (!m) {
    throw new Error('Could not parse __RequestVerificationToken from GET /Account/Register');
  }
  return m[1];
}

const relaxBodyCheck = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_BODY_CHECK || '').trim().toLowerCase(),
);

/**
 * Only copy that indicates a failed registration — avoid `field-validation-error` / `input-validation-error`
 * (often appear inside shared JS/CSS on **success** pages) and broad Italian heuristics (confirmation email copy).
 */
const REGISTRATION_REJECTION_SUBSTRINGS = [
  'email is already registered',
  'is already taken',
  'already been taken',
  'username is already taken',
  'user name is already taken',
  'email address is already',
  'already has an account',
  'already associated with an account',
  'is already associated',
  'duplicate email',
  'duplicateuser',
  'user already exists',
  'invalid login attempt',
  'the current password is incorrect',
  // ASP.NET Identity / MVC validation on failed register (HTTP 200 re-display form)
  'password must be at least',
  'passwords must be at least',
  'the password must be at least',
  'must have a length of at least',
  'minimum length of',
  'the field password must be a string with a minimum length',
  'the password does not meet',
  'password requires',
];

/** Non-null when HTML looks like a failed registration (used for checks and DEBUG_POST). */
function registrationRejectionMatch(body) {
  const b = (body || '').toLowerCase();
  for (const n of REGISTRATION_REJECTION_SUBSTRINGS) {
    if (b.includes(n)) return `needle:${n}`;
  }
  return null;
}

/** Needles that usually mean email/username already exists (clearer user-facing log). */
const DUPLICATE_IDENTITY_NEEDLES = new Set([
  'email is already registered',
  'is already taken',
  'already been taken',
  'username is already taken',
  'user name is already taken',
  'email address is already',
  'already has an account',
  'already associated with an account',
  'is already associated',
  'duplicate email',
  'duplicateuser',
  'user already exists',
]);

function needleFromMatch(match) {
  if (!match || !match.startsWith('needle:')) return null;
  return match.slice('needle:'.length);
}

function isDuplicateIdentityRejection(match) {
  const n = needleFromMatch(match);
  return n !== null && DUPLICATE_IDENTITY_NEEDLES.has(n);
}

/**
 * Always log a clear line when POST registration did not succeed (duplicate email, validation, HTTP error).
 * Use LOG_FAILED_HTTP=1 for an extra body snippet when the reason is not a known duplicate needle.
 */
function logSignupPostFailure(email, postRes) {
  const body = postRes.body || '';
  const match = registrationRejectionMatch(body);
  const status = postRes.status;
  const err = postRes.error || '';
  const lastIndex = SIGNUP_INDEX_OFFSET + TOTAL_REGISTRATIONS;
  const nextOffsetHint = lastIndex;
  const nextUserExample = `${EMAIL_LOCAL_PREFIX}${String(lastIndex + 1).padStart(EMAIL_PAD, '0')}@${EMAIL_DOMAIN}`;

  if (isDuplicateIdentityRejection(match)) {
    console.error(
      `[k6-identity-signup] EMAIL OR USERNAME ALREADY EXISTS — Identity rejected signup for **${email}** (HTTP ${status}). ` +
        `Matched response text: "${needleFromMatch(match)}". ` +
        `That address (or a conflicting account rule) is already in use. Use a new band, e.g. \`k6 run -e SIGNUP_INDEX_OFFSET=${nextOffsetHint}\` (next example: ${nextUserExample}), or \`-e SIGNUP_BAND_STATE=persistent\`, or change EMAIL_LOCAL_PREFIX / EMAIL_DOMAIN.`,
    );
    return;
  }

  if (match) {
    console.error(
      `[k6-identity-signup] REGISTRATION REJECTED — **${email}** (HTTP ${status}). ` +
        `Response matched: "${needleFromMatch(match)}". Check validation rules or server logs.`,
    );
    return;
  }

  console.error(
    `[k6-identity-signup] REGISTRATION FAILED — **${email}** (HTTP ${status}${err ? `, ${err}` : ''}). ` +
      `No known duplicate-email needle in the body (success rule: redirect 301–308, or 200 without rejection copy). ` +
      `Try LOG_FAILED_HTTP=1 for a body snippet.`,
  );
}

function responseBodyIndicatesRegistrationRejected(body) {
  return registrationRejectionMatch(body) !== null;
}

/** Classify common 500 bodies for logs (not used for pass/fail). */
function postHttpFailureHint(body) {
  const b = (body || '').toLowerCase();
  if (b.includes('smtpexception') || b.includes('unusual sending activity') || b.includes('5.4.6')) {
    return 'smtp_throttle_or_block';
  }
  return '';
}

/** POST / register: treat common redirect statuses as success (not only 301/302). */
function isSuccessfulRegistrationRedirectStatus(status) {
  return status >= 301 && status <= 308;
}

function registrationPostAccepted(res) {
  if (relaxBodyCheck) {
    return (
      (res.status >= 200 && res.status <= 299) || isSuccessfulRegistrationRedirectStatus(res.status)
    );
  }
  if (isSuccessfulRegistrationRedirectStatus(res.status)) return true;
  if (res.status < 200 || res.status >= 300) return false;
  const body = res.body || '';
  if (responseBodyIndicatesRegistrationRejected(body)) return false;
  // Dev may return 200 on RegisterWithoutUsername for success; fail only when rejection copy matches.
  return true;
}

/** True when a POST should be retried after a fresh antiforgery GET (transient / overload). */
function shouldRetryRegisterPostHttp(res) {
  const s = res.status;
  if (s === 0) return true;
  if (s === 408 || s === 429) return true;
  if (s >= 500 && s <= 599) return true;
  return false;
}

const skipRegisterEmailConfirmFollow = ['1', 'true', 'yes'].includes(
  (__ENV.SKIP_REGISTER_EMAIL_CONFIRM_FOLLOW || '').trim().toLowerCase(),
);

/** Resolve `Location` header to an absolute URL against Identity base. */
function resolveIdentityRedirectUrl(location, identityBase) {
  if (!location || typeof location !== 'string') return null;
  const loc = location.trim();
  if (!loc) return null;
  if (/^https?:\/\//i.test(loc)) return loc;
  if (loc.startsWith('//')) return `https:${loc}`;
  const base = identityBase.replace(/\/$/, '');
  if (loc.startsWith('/')) return `${base}${loc}`;
  return `${base}/${loc}`;
}

/**
 * STS dev may `Redirect` straight to `Account/ConfirmEmail?...` after register while POST uses `redirects:0`.
 * Without this GET, `EmailConfirmed` stays false and ROPC returns `invalid_grant` / `invalid_username_or_password`.
 */
function tryCompleteEmailConfirmationAfterRegister(postRes, identityBase, email) {
  if (skipRegisterEmailConfirmFollow) return;
  if (!isSuccessfulRegistrationRedirectStatus(postRes.status)) return;
  const rawLoc = postRes.headers && (postRes.headers.Location || postRes.headers.location);
  if (!rawLoc || typeof rawLoc !== 'string') return;
  const abs = resolveIdentityRedirectUrl(rawLoc, identityBase);
  if (!abs) return;
  if (!/ConfirmEmail/i.test(abs)) return;
  const confirmRes = http.get(abs, {
    tags: { name: 'Identity_ConfirmEmail_GET_after_register' },
    timeout: HTTP_TIMEOUT,
    redirects: 10,
  });
  check(confirmRes, {
    'GET ConfirmEmail after register succeeded (2xx/3xx)': (r) => r.status >= 200 && r.status < 400,
  });
  if (confirmRes.status >= 400) {
    console.warn(
      `[k6-identity-signup] ConfirmEmail follow-up failed for **${email}**: HTTP ${confirmRes.status} url=${abs.substring(0, 180)}`,
    );
  }
}

const thresholds = {
  ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
  ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.5'] }),
};

export const options =
  MODE === 'duration'
    ? {
        vus: VUS,
        duration: __ENV.DURATION || '2m',
        thresholds,
      }
    : {
        scenarios: {
          /** Exactly TOTAL_REGISTRATIONS signups split across VUS workers. */
          register_fixed_count: {
            executor: 'shared-iterations',
            vus: SCENARIO_VUS,
            iterations: SCENARIO_ITERATIONS,
            maxDuration: __ENV.MAX_DURATION || '20m',
          },
        },
        thresholds,
      };

/** Log resolved offset and email id range once (helps catch `010` → 10 → User11… band overlap). */
export function setup() {
  if (MODE !== 'count') return {};
  if (clientLifecycleOnly) {
    console.log(
      `[k6-identity-signup] CLIENT_LIFECYCLE_ONLY=1 — skipping HTML signup. Users file="${LIFECYCLE_USERS_FILE}" (${lifecycleUsers.length} rows). Iterations=${SCENARIO_ITERATIONS} VUS=${SCENARIO_VUS}. API=${(__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '')}. Per iteration: login (JWT "token" row or ROPC with password + SIGNUP_ROPC_CLIENT_ID), then /api/v1/Clients CRUD.`,
    );
    return {};
  }
  const pad = (n) => String(n).padStart(EMAIL_PAD, '0');
  const firstNum = SIGNUP_INDEX_OFFSET + 1;
  const lastNum = SIGNUP_INDEX_OFFSET + TOTAL_REGISTRATIONS;
  const offsetSource = hasExplicitSignupOffset
    ? `explicit raw="${SIGNUP_INDEX_OFFSET_RAW}"`
    : bandStatePersistent
      ? `persistent: file lastMaxIndex=${bandFileLastMax}, therefore SIGNUP_INDEX_OFFSET=${SIGNUP_INDEX_OFFSET}`
      : 'default (SIGNUP_INDEX_OFFSET=0; set SIGNUP_BAND_STATE=persistent for auto-advancing bands)';
  console.log(
    `[k6-identity-signup] count: TOTAL_REGISTRATIONS=${TOTAL_REGISTRATIONS} VUS=${VUS} SIGNUP_INDEX_OFFSET=${SIGNUP_INDEX_OFFSET} (${offsetSource})`,
  );
  if (SIGNUP_BATCH_SIZE_CAP != null) {
    console.log(
      `[k6-identity-signup] SIGNUP_BATCH_SIZE=${SIGNUP_BATCH_SIZE_CAP} caps concurrent HTML signups (raw VUS env may be higher).`,
    );
  }
  if (EMAIL_GENERATION_MODE === 'k6user' || EMAIL_GENERATION_MODE === 'k6tag') {
    console.log(
      `[k6-identity-signup] EMAIL_GENERATION_MODE=${EMAIL_GENERATION_MODE} SIGNUP_RUN_TAG=${SIGNUP_RUN_TAG} (override with -e SIGNUP_RUN_TAG=... for stable pools)`,
    );
  }
  if (bandStatePersistent) {
    const prior =
      bandFileLastMax > 0
        ? `continues after prior lastMaxIndex=${bandFileLastMax} (this band ${firstNum}–${lastNum} does not reuse 1–${bandFileLastMax})`
        : `first run with this file (no prior lastMaxIndex)`;
    console.log(`[k6-identity-signup] band state: SIGNUP_BAND_STATE=persistent file=${BAND_STATE_FILE} — ${prior}`);
    console.log(
      `[k6-identity-signup] band state: after this run, handleSummary writes lastMaxIndex=${lastNum} to ${BAND_STATE_FILE} (next run with no explicit offset uses SIGNUP_INDEX_OFFSET=${lastNum}, indices ${lastNum + 1}–${lastNum + TOTAL_REGISTRATIONS})`,
    );
  }
  if (EMAIL_GENERATION_MODE === 'k6user' || EMAIL_GENERATION_MODE === 'k6tag') {
    const dom = (__ENV.EMAIL_DOMAIN || 'example.test').trim();
    console.log(
      `[k6-identity-signup] email pattern: k6user-${SIGNUP_RUN_TAG}-${pad(firstNum)}@${dom} .. k6user-${SIGNUP_RUN_TAG}-${pad(lastNum)}@${dom}`,
    );
  } else {
    console.log(
      `[k6-identity-signup] email pattern: ${EMAIL_LOCAL_PREFIX}${pad(firstNum)}@${EMAIL_DOMAIN} .. ${EMAIL_LOCAL_PREFIX}${pad(lastNum)}@${EMAIL_DOMAIN}`,
    );
  }
  console.log(
    `[k6-identity-signup] next disjoint band: -e SIGNUP_INDEX_OFFSET=${lastNum} (or omit offset with SIGNUP_BAND_STATE=persistent). Optional guard: -e SIGNUP_PREVIOUS_MAX_INDEX=${lastNum}`,
  );
  console.log(
    `[k6-identity-signup] hint: if POST checks fail with "email is already registered", raise the band (see above) or change EMAIL_LOCAL_PREFIX.`,
  );
  if (useIndexedPassword) {
    const pwFirst = indexedPasswordFromPaddedIndex(pad(firstNum));
    const pwLast = indexedPasswordFromPaddedIndex(pad(lastNum));
    const minLen = Math.max(1, parseInt(__ENV.SIGNUP_INDEXED_PASSWORD_MIN_LEN || '8', 10));
    console.log(
      `[k6-identity-signup] AUTO_PASSWORD=indexed → passwords: ${pwFirst} .. ${pwLast} (MIN_LEN=${minLen}; base ${EMAIL_LOCAL_PREFIX}@NN + pad char if shorter)`,
    );
  }
  if (signupClientLifecycle) {
    console.log(
      `[k6-identity-signup] SIGNUP_CLIENT_LIFECYCLE=1 → after each successful signup: login (ROPC) then API client create/update/delete (no partner) + create/update/delete (with partner). API=${API_BASE_URL} (requires SIGNUP_ROPC_CLIENT_ID).`,
    );
  }
  if (exportSignupToLifecycle) {
    console.log(
      `[k6-identity-signup] SIGNUP_EXPORT_LIFECYCLE_USERS → end-of-run merge into "${LIFECYCLE_EXPORT_FILE}" (baseline rows at init: ${LIFECYCLE_EXPORT_BASELINE.length}).`,
    );
  }
  return {};
}

/** Persist band state and/or merged **`lifecycle-users.json`** (see **`SIGNUP_EXPORT_LIFECYCLE_USERS`**). */
export function handleSummary() {
  const out = {};

  if (!clientLifecycleOnly && bandStatePersistent && MODE === 'count') {
    const runLast = SIGNUP_INDEX_OFFSET + TOTAL_REGISTRATIONS;
    const nextStored = Math.max(bandFileLastMax, runLast);
    out[BAND_STATE_FILE] = JSON.stringify(
      { lastMaxIndex: nextStored, updatedAt: Date.now() },
      null,
      0,
    );
  }

  if (!clientLifecycleOnly && exportSignupToLifecycle) {
    const nUp = flattenSignupExportBuckets(lifecycleSignupExportByVu).length;
    if (nUp === 0) {
      console.log(
        `[k6-identity-signup] SIGNUP_EXPORT_LIFECYCLE_USERS: handleSummary saw 0 export row(s) — left "${LIFECYCLE_EXPORT_FILE}" unchanged (${LIFECYCLE_EXPORT_BASELINE.length} baseline row(s) at init). Rows may still be in the k6 log via ${LIFECYCLE_EXPORT_STDOUT_MARKER} (provision-users.ps1 merges those). If POST failed with "email is already registered", use a new band: \`-e SIGNUP_INDEX_OFFSET=20\` (or your next free index) or \`-e SIGNUP_BAND_STATE=persistent\`.`,
      );
    } else {
      const merged = mergeLifecycleSignupExport(
        LIFECYCLE_EXPORT_BASELINE,
        lifecycleSignupExportByVu,
      );
      out[LIFECYCLE_EXPORT_FILE] = JSON.stringify(merged, null, 2);
      console.log(
        `[k6-identity-signup] SIGNUP_EXPORT_LIFECYCLE_USERS wrote ${merged.length} row(s) to "${LIFECYCLE_EXPORT_FILE}" (${nUp} successful signup(s) from this run).`,
      );
    }
  }

  return out;
}

export default function () {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  if (VU_STAGGER_SEC > 0) {
    sleep(Math.max(0, (vu - 1) * VU_STAGGER_SEC));
  }

  if (clientLifecycleOnly) {
    const gi = globalIterationIndex();
    const it = typeof __ITER !== 'undefined' ? __ITER : 0;
    const row = lifecycleUsers[gi % lifecycleUsers.length];
    const email = String(row.email).trim();
    const pwd = String(row.password || '').trim();
    const rowToken = row.token != null ? String(row.token).trim() : '';
    const uniqueTag = `vu${vu}_gi${gi}_i${it}_${Date.now()}`;
    const ltRaw = (__ENV.CLIENT_LIFECYCLE_THINK_SEC || '').trim();
    const lt = ltRaw === '' ? NaN : parseFloat(ltRaw);
    const thinkLifecycle = Number.isFinite(lt) && lt >= 0 ? lt : __ENV.THINK_SEC ? parseFloat(__ENV.THINK_SEC) : 0.2;
    runSignupClientLifecycle({
      apiBase: API_BASE_URL,
      identityBase: IDENTITY_BASE,
      email,
      password: pwd,
      preloadedAccessToken: rowToken || undefined,
      uniqueTag,
      timeout: HTTP_TIMEOUT,
      thinkSec: thinkLifecycle,
    });
    sleep(__ENV.THINK_SEC ? parseFloat(__ENV.THINK_SEC) : 0.5);
    return;
  }

  const getUrl = `${IDENTITY_BASE}/Account/Register`;
  const getOpts = { tags: { name: 'Identity_Register_GET' }, timeout: HTTP_TIMEOUT };

  let getRes = http.get(getUrl, getOpts);

  check(getRes, {
    'GET register 200': (r) => r.status === 200,
  });

  if (getRes.status !== 200) {
    console.warn(
      `[k6-identity-signup] GET /Account/Register failed: HTTP ${getRes.status}${getRes.error ? ` (${getRes.error})` : ''} — cannot load the register form or anti-forgery token; signup skipped for this iteration.`,
    );
    sleep(1);
    return;
  }

  const email = uniqueEmail();
  const pwd = passwordForSignup();
  const postUrl = `${IDENTITY_BASE}/Account/RegisterWithoutUsername`;
  const postOpts = (postTag) => ({
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    tags: { name: postTag },
    redirects: 0,
    timeout: HTTP_TIMEOUT,
  });

  const buildBody = (token) => ({
    FirstName: firstNameForSignup(),
    LastName: lastNameForSignup(),
    Email: email,
    Password: pwd,
    ConfirmPassword: pwd,
    Terms: 'true',
    Language: (__ENV.SIGNUP_LANGUAGE || 'en').trim(),
    __RequestVerificationToken: token,
  });

  let token = extractAntiforgeryToken(getRes.body);
  let body = buildBody(token);
  let postRes = http.post(postUrl, body, postOpts('Identity_Register_POST'));

  let postAttempts = 0;
  while (postAttempts < POST_RETRY_MAX && shouldRetryRegisterPostHttp(postRes)) {
    postAttempts += 1;
    if (POST_RETRY_SLEEP_SEC > 0) sleep(POST_RETRY_SLEEP_SEC);
    getRes = http.get(getUrl, { ...getOpts, tags: { name: 'Identity_Register_GET_retry' } });
    if (getRes.status !== 200) break;
    token = extractAntiforgeryToken(getRes.body);
    body = buildBody(token);
    postRes = http.post(postUrl, body, postOpts('Identity_Register_POST_retry'));
  }

  if (debugPost) {
    const b = (postRes.body || '').substring(0, 1200);
    const loc = postRes.headers && postRes.headers.Location ? postRes.headers.Location : '';
    const match = registrationRejectionMatch(postRes.body);
    console.log(
      `DEBUG_POST status=${postRes.status} url=${postRes.url} Location=${loc} rejected=${responseBodyIndicatesRegistrationRejected(postRes.body)} match=${match}`,
    );
    console.log(`DEBUG_POST body_snip=${b.replace(/\s+/g, ' ')}`);
  }

  const postAccepted = registrationPostAccepted(postRes);
  check(postRes, {
    'POST register succeeded (redirect or 200 without duplicate/errors)': () => postAccepted,
  });

  if (postAccepted) {
    tryCompleteEmailConfirmationAfterRegister(postRes, IDENTITY_BASE, email);
  }

  let lifecycleExportRow = null;
  if (postAccepted && exportSignupToLifecycle) {
    lifecycleExportRow = {
      email,
      password: pwd,
      createdAt: new Date().toISOString(),
    };
  }

  if (postAccepted && postSignupAcquireLoadTester) {
    const cid = (__ENV.LOAD_TESTER_ROPC_CLIENT_ID || __ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
    const csec = (__ENV.LOAD_TESTER_ROPC_CLIENT_SECRET || __ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
    const scope = (__ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api').trim();
    if (!cid) {
      console.error(
        '[k6-identity-signup] POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN=1 requires LOAD_TESTER_ROPC_CLIENT_ID or SIGNUP_ROPC_CLIENT_ID',
      );
    } else {
      const lt = acquireLoadTesterToken({
        identityBase: IDENTITY_BASE,
        email,
        password: pwd,
        clientId: cid,
        clientSecret: csec,
        scope,
        timeout: HTTP_TIMEOUT,
        validateOptions: { strict: true },
      });
      check({ ltOk: lt.ok }, {
        'POST signup: load_tester JWT from ROPC': (o) => o.ltOk === true,
      });
      if (lifecycleExportRow && lt.ok && lt.accessToken) {
        lifecycleExportRow.token = lt.accessToken;
        const subj = subjectFromJwtClaims(lt.validation && lt.validation.claims);
        if (subj) {
          lifecycleExportRow.advisorId = subj;
          lifecycleExportRow.identityUserId = subj;
        }
      } else if (!lt.ok && lt.validation) {
        const hs = lt.httpStatus != null ? String(lt.httpStatus) : '';
        console.error(
          `[k6-identity-signup] load_tester ROPC/claim check failed reason=${lt.validation.reason} http=${hs}`,
        );
      }
    }
  }

  if (lifecycleExportRow) {
    recordLifecycleExportRow(lifecycleExportRow);
  }

  if (!postAccepted) {
    logSignupPostFailure(email, postRes);
  }

  if (logFailedHttp && !postAccepted) {
    const match = registrationRejectionMatch(postRes.body || '');
    const hint = postHttpFailureHint(postRes.body || '');
    const hintPart = hint ? ` hint=${hint}` : '';
    const snip =
      !match && postRes.status >= 400
        ? ` body_snip=${(postRes.body || '').substring(0, 500).replace(/\s+/g, ' ')}`
        : '';
    console.warn(
      `LOG_FAILED_HTTP email=${email} POST status=${postRes.status} error=${postRes.error || ''} url=${postRes.url} rejectionMatch=${match || 'none'}${hintPart}${snip}`,
    );
  }

  if (postAccepted && signupClientLifecycle) {
    const it = typeof __ITER !== 'undefined' ? __ITER : 0;
    const gi = globalIterationIndex();
    const uniqueTag = `vu${vu}_gi${gi}_i${it}_${Date.now()}`;
    const ltRaw = (__ENV.CLIENT_LIFECYCLE_THINK_SEC || '').trim();
    const lt = ltRaw === '' ? NaN : parseFloat(ltRaw);
    const thinkLifecycle = Number.isFinite(lt) && lt >= 0 ? lt : __ENV.THINK_SEC ? parseFloat(__ENV.THINK_SEC) : 0.2;
    runSignupClientLifecycle({
      apiBase: API_BASE_URL,
      identityBase: IDENTITY_BASE,
      email,
      password: pwd,
      uniqueTag,
      timeout: HTTP_TIMEOUT,
      thinkSec: thinkLifecycle,
    });
  }

  sleep(__ENV.THINK_SEC ? parseFloat(__ENV.THINK_SEC) : 0.5);
}
