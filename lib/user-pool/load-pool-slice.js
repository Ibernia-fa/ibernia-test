/**
 * Read-only pool slice loader for k6 (leased JSON from pool-cli).
 * Set USE_USER_POOL=1 and POOL_SLICE_FILE to the slice path.
 */

export function useUserPool() {
  const flag = String(__ENV.USE_USER_POOL || '').trim().toLowerCase();
  if (['1', 'true', 'yes'].includes(flag)) return true;
  return String(__ENV.POOL_SLICE_FILE || '').trim() !== '';
}

export function poolSliceFilePath() {
  const p = String(__ENV.POOL_SLICE_FILE || '').trim();
  if (!p) {
    throw new Error('[user-pool] POOL_SLICE_FILE is required when USE_USER_POOL=1');
  }
  return p;
}

function openSliceCandidates(target) {
  const candidates = [target];
  const looksAbs =
    /^[a-zA-Z]:[\\/]/.test(target) || target.startsWith('\\\\') || target.startsWith('/');
  if (!looksAbs) {
    try {
      candidates.push(String(import.meta.resolve('../../' + target.replace(/^\.\//, ''))));
    } catch {
      /* ignore */
    }
    candidates.push('../../' + target.replace(/^\.\//, ''));
  }
  return candidates;
}

/**
 * Load and validate pool slice JSON (for SharedArray factory).
 * @returns {object[]}
 */
export function loadPoolSlice() {
  const target = poolSliceFilePath();
  const errors = [];
  let raw;
  for (const p of openSliceCandidates(target)) {
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
    throw new Error(`[user-pool] Cannot read POOL_SLICE_FILE. Tried:\n  - ${errors.join('\n  - ')}`);
  }
  // PowerShell Set-Content -Encoding utf8 may write UTF-8 BOM; strip before parse.
  let text = raw;
  if (text.length > 0 && text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  let parsed = JSON.parse(text);
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? [parsed]
      : [];
  if (arr.length === 0) {
    throw new Error('[user-pool] Pool slice must be a non-empty JSON array.');
  }
  for (let i = 0; i < arr.length; i++) {
    const r = arr[i];
    const em = r && String(r.email || '').trim();
    const pw = r && String(r.password ?? '');
    if (!em || pw === '') {
      throw new Error(`[user-pool] Row ${i} must include non-empty "email" and "password".`);
    }
  }
  return arr;
}

/** Sticky mapping: one user per VU when vu <= pool length. */
export function userForVu(users, vu) {
  if (!users || users.length === 0) return null;
  const v = Math.max(1, vu != null ? vu : 1);
  return users[(v - 1) % users.length];
}

/** Shared-iterations: one user per global iteration index. */
export function userForIteration(users, globalIterationIndex) {
  if (!users || users.length === 0) return null;
  const gi = globalIterationIndex != null ? globalIterationIndex : 0;
  return users[gi % users.length];
}
