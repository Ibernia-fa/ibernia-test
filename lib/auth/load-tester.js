import { parseJwtPayload } from './jwt.js';

export function isLoadTesterClaimPresent(claims) {
  if (!claims || typeof claims !== 'object') return false;
  const v = claims.load_tester;
  if (v === true || v === 1) return true;
  if (typeof v === 'string' && ['true', '1', 'yes'].includes(v.trim().toLowerCase())) return true;
  return false;
}

export function validateLoadTesterClaim(accessToken, opts) {
  const strict = !opts || opts.strict !== false;
  const claims = parseJwtPayload(accessToken);
  if (!claims) {
    return { ok: false, reason: 'not_jwt_or_unreadable', claims: null };
  }
  const ok = isLoadTesterClaimPresent(claims);
  if (!ok && strict) {
    return { ok: false, reason: 'missing_load_tester', claims: null };
  }
  return { ok, reason: ok ? 'ok' : 'missing_load_tester', claims };
}

export function refreshTokenIfNeeded(accessToken, skewSec) {
  const skew = Math.max(0, skewSec != null ? Number(skewSec) : 120);
  const c = parseJwtPayload(accessToken);
  if (!c) return false;
  const exp = c.exp != null ? c.exp : c.Exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 - Date.now() < skew * 1000;
}
