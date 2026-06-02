/**
 * Automates the manual "jwt.io" check for **ROPC** tokens (same grant as `k6/clients/k6-client-full-lifecycle.js`).
 *
 * Prints a **short summary** only: whether `access_token` / `id_token` look like JWTs and whether
 * **`sub`** (or `oid` / .NET nameidentifier) is present. **Does not** print secrets or full tokens.
 *
 * ## Required env
 *
 * - **`INSPECT_EMAIL`** — user name for `grant_type=password`
 * - **`INSPECT_PASSWORD`** — user password
 *
 * ## Optional (same defaults as other lifecycle scripts)
 *
 * - **`IDENTITY_BASE`** (default `https://dev-identity.ibernia.it`)
 * - **`SIGNUP_ROPC_CLIENT_ID`** (required non-empty)
 * - **`SIGNUP_ROPC_CLIENT_SECRET`** — if the client is confidential
 * - **`SIGNUP_ROPC_SCOPE`** (default `openid profile email roles ibernia_api`)
 * - **`HTTP_TIMEOUT`** (default `60s`)
 *
 * ## Run (PowerShell)
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * $env:SIGNUP_ROPC_CLIENT_SECRET = 'your-secret-one-line'
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e INSPECT_EMAIL=User01@gmail.com -e INSPECT_PASSWORD='User@01!' `
 *   k6/identity/k6-ropc-token-inspect.js
 * ```
 */
import { parseJwtPayload, fetchPasswordGrantToken } from '../../lib/k6-client-lifecycle.js';

const NAME_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

function pickSubject(claims) {
  if (!claims || typeof claims !== 'object') return null;
  const s =
    claims.sub ||
    claims.Sub ||
    claims.oid ||
    claims.Oid ||
    claims[NAME_ID];
  return s != null && String(s).trim() !== '' ? String(s).trim() : null;
}

/** Uses `parseJwtPayload` from lib (`k6/encoding` — k6 may not define `atob`). */
function describeToken(label, token) {
  if (!token || typeof token !== 'string') {
    return `${label}: missing`;
  }
  const t = token.trim();
  const parts = t.split('.');
  if (parts.length < 2) {
    return `${label}: opaque or non-JWT (${t.length} chars)`;
  }
  if (parts.length === 5) {
    return `${label}: JWE-style (5 segments) — use introspection or decrypt`;
  }
  if (parts.length !== 3) {
    return `${label}: unusual segment_count=${parts.length} (expected 3 for JWS)`;
  }
  const claims = parseJwtPayload(t);
  if (!claims) {
    return `${label}: JWS (3 segments) but payload did not parse`;
  }
  const sub = pickSubject(claims);
  const keys = Object.keys(claims).filter((k) => k.length < 40).slice(0, 14);
  return `${label}: JWS; has_subject_claim=${!!sub}; claim_keys_sample=${keys.join(',')}`;
}

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {},
};

export default function () {
  const identityBase = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
  const clientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const clientSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
  const scope = (__ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api').trim();
  const email = (__ENV.INSPECT_EMAIL || '').trim();
  const password = (__ENV.INSPECT_PASSWORD || '').trim();
  const timeout = (__ENV.HTTP_TIMEOUT || '60s').trim();

  if (!clientId) {
    console.error('[k6-ropc-token-inspect] Set SIGNUP_ROPC_CLIENT_ID (and secret if confidential).');
    return;
  }
  if (!email || !password) {
    console.error('[k6-ropc-token-inspect] Set INSPECT_EMAIL and INSPECT_PASSWORD.');
    return;
  }

  const res = fetchPasswordGrantToken({
    identityBase,
    clientId,
    clientSecret,
    scope,
    username: email,
    password,
    timeout,
  });

  if (res.status !== 200) {
    const snip = (res.body || '').substring(0, 400).replace(/\s+/g, ' ');
    console.error(`[k6-ropc-token-inspect] /connect/token HTTP ${res.status} snip=${snip}`);
    return;
  }

  let body;
  try {
    body = res.json();
  } catch {
    console.error('[k6-ropc-token-inspect] Response body is not JSON.');
    return;
  }

  const access = body && (body.access_token || body.accessToken);
  const idTok = body && (body.id_token || body.idToken);

  console.log('[k6-ropc-token-inspect] --- ROPC token shape (no secrets) ---');
  console.log(`[k6-ropc-token-inspect] user=${email} client_id=${clientId}`);
  console.log(`[k6-ropc-token-inspect] ${describeToken('access_token', access)}`);
  console.log(`[k6-ropc-token-inspect] ${describeToken('id_token', idTok)}`);
  console.log(
    '[k6-ropc-token-inspect] Hint: if access_token has no subject but id_token does, k6 lib already tries id_token. If both lack subject, use identity map / advisorId or fix STS/API resource JWT settings.',
  );
}
