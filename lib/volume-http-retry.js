/**
 * Shared transient HTTP retry helpers (k6 + Node tests).
 */

/** Retry 408/429/5xx and status 0 only — not 401/400. */
export function isTransientHttpStatus(status) {
  const code = Number(status);
  if (!Number.isFinite(code) || code === 0) return true;
  return code === 408 || code === 429 || code === 500 || code === 502 || code === 503 || code === 504;
}

export function transientRetryBackoffSec(attempt) {
  return Math.min(45, Math.pow(2, attempt) + (attempt % 3));
}

export function parseVolumeMaxAttemptsEnv(raw, defaultVal, maxCap = 12) {
  const n = parseInt(String(raw || '').trim(), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, maxCap) : defaultVal;
}

/** Normalize absolute filesystem paths to repo-relative `config/...` for k6 open(). */
export function normalizeVolumeConfigOpenPath(preferred) {
  const p = String(preferred || '').trim().replace(/\\/g, '/');
  if (!p) return p;
  const configIdx = p.toLowerCase().lastIndexOf('/config/');
  if (configIdx >= 0) return p.slice(configIdx + 1);
  return p;
}
