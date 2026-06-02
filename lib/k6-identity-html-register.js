/**
 * Minimal **HTML** Identity registration (`/Account/RegisterWithoutUsername`) for orchestration and tooling.
 * **DEV / non-production** — same semantics as **`k6/identity/k6-identity-signup.js`** POST success rule.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

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
  'password must be at least',
  'passwords must be at least',
  'the password must be at least',
  'must have a length of at least',
  'minimum length of',
  'the field password must be a string with a minimum length',
  'the password does not meet',
  'password requires',
];

function registrationRejectionMatch(body) {
  const b = (body || '').toLowerCase();
  for (const n of REGISTRATION_REJECTION_SUBSTRINGS) {
    if (b.includes(n)) return `needle:${n}`;
  }
  return null;
}

function responseBodyIndicatesRegistrationRejected(body) {
  return registrationRejectionMatch(body) !== null;
}

function isSuccessfulRegistrationRedirectStatus(status) {
  return status >= 301 && status <= 308;
}

function registrationPostAccepted(res, relaxBodyCheck) {
  if (relaxBodyCheck) {
    return (
      (res.status >= 200 && res.status <= 299) || isSuccessfulRegistrationRedirectStatus(res.status)
    );
  }
  if (isSuccessfulRegistrationRedirectStatus(res.status)) return true;
  if (res.status < 200 || res.status >= 300) return false;
  const body = res.body || '';
  if (responseBodyIndicatesRegistrationRejected(body)) return false;
  return true;
}

function shouldRetryRegisterPostHttp(res) {
  const s = res.status;
  if (s === 0) return true;
  if (s === 408 || s === 429) return true;
  if (s >= 500 && s <= 599) return true;
  return false;
}

export function extractAntiforgeryToken(html) {
  const m = html.match(/name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/);
  if (!m) {
    throw new Error('Could not parse __RequestVerificationToken from GET /Account/Register');
  }
  return m[1];
}

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

function tryCompleteEmailConfirmationAfterRegister(postRes, identityBase, email, httpTimeout) {
  const skip = ['1', 'true', 'yes'].includes(
    (__ENV.SKIP_REGISTER_EMAIL_CONFIRM_FOLLOW || '').trim().toLowerCase(),
  );
  if (skip) return;
  if (!isSuccessfulRegistrationRedirectStatus(postRes.status)) return;
  const rawLoc = postRes.headers && (postRes.headers.Location || postRes.headers.location);
  if (!rawLoc || typeof rawLoc !== 'string') return;
  const abs = resolveIdentityRedirectUrl(rawLoc, identityBase);
  if (!abs) return;
  if (!/ConfirmEmail/i.test(abs)) return;
  const confirmRes = http.get(abs, {
    tags: { name: 'Identity_ConfirmEmail_GET_after_register' },
    timeout: httpTimeout,
    redirects: 10,
  });
  check(confirmRes, {
    'GET ConfirmEmail after register succeeded (2xx/3xx)': (r) => r.status >= 200 && r.status < 400,
  });
  if (confirmRes.status >= 400) {
    console.warn(
      `[k6-identity-html-register] ConfirmEmail follow-up failed for **${email}**: HTTP ${confirmRes.status} url=${abs.substring(0, 180)}`,
    );
  }
}

/**
 * @param {object} p
 * @param {string} p.identityBase
 * @param {string} p.email
 * @param {string} p.password
 * @param {string} p.firstName
 * @param {string} p.lastName
 * @param {string} [p.language]
 * @param {string} p.httpTimeout
 * @param {number} [p.postRetryMax]
 * @param {number} [p.postRetrySleepSec]
 * @returns {{ ok: boolean, postRes: import('k6/http').RefinedResponse<'text'>, email: string, password: string }}
 */
export function performHtmlSignup(p) {
  const identityBase = String(p.identityBase || '').replace(/\/$/, '');
  const email = String(p.email || '').trim();
  const password = String(p.password ?? '');
  const firstName = String(p.firstName || '').trim();
  const lastName = String(p.lastName || '').trim();
  const language = (p.language || (__ENV.SIGNUP_LANGUAGE || 'en')).trim();
  const httpTimeout = p.httpTimeout || '120s';
  const postRetryMax = Math.max(0, Math.min(3, p.postRetryMax != null ? Number(p.postRetryMax) : 0));
  const postRetrySleepSec = Math.max(0, p.postRetrySleepSec != null ? Number(p.postRetrySleepSec) : 1.5);
  const relaxBodyCheck = ['1', 'true', 'yes'].includes(
    (__ENV.RELAX_BODY_CHECK || '').trim().toLowerCase(),
  );

  const getUrl = `${identityBase}/Account/Register`;
  const getOpts = { tags: { name: 'Identity_Register_GET_fp' }, timeout: httpTimeout };
  let getRes = http.get(getUrl, getOpts);
  if (getRes.status !== 200) {
    return { ok: false, postRes: getRes, email, password };
  }

  const postUrl = `${identityBase}/Account/RegisterWithoutUsername`;
  const postOpts = (postTag) => ({
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    tags: { name: postTag },
    redirects: 0,
    timeout: httpTimeout,
  });

  const buildBody = (token) => ({
    FirstName: firstName,
    LastName: lastName,
    Email: email,
    Password: password,
    ConfirmPassword: password,
    Terms: 'true',
    Language: language,
    __RequestVerificationToken: token,
  });

  let token = extractAntiforgeryToken(getRes.body);
  let body = buildBody(token);
  let postRes = http.post(postUrl, body, postOpts('Identity_Register_POST_fp'));

  let postAttempts = 0;
  while (postAttempts < postRetryMax && shouldRetryRegisterPostHttp(postRes)) {
    postAttempts += 1;
    if (postRetrySleepSec > 0) sleep(postRetrySleepSec);
    getRes = http.get(getUrl, { ...getOpts, tags: { name: 'Identity_Register_GET_fp_retry' } });
    if (getRes.status !== 200) break;
    token = extractAntiforgeryToken(getRes.body);
    body = buildBody(token);
    postRes = http.post(postUrl, body, postOpts('Identity_Register_POST_fp_retry'));
  }

  const postAccepted = registrationPostAccepted(postRes, relaxBodyCheck);
  check(postRes, {
    'HTML signup POST accepted': () => postAccepted,
  });
  if (postAccepted) {
    tryCompleteEmailConfirmationAfterRegister(postRes, identityBase, email, httpTimeout);
  }
  return { ok: postAccepted, postRes, email, password };
}
