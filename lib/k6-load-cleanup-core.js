/** Pure helpers for k6 client/plan cleanup (no k6/http imports — testable in Node). */

export function clientLastNameFromListRow(x) {
  const d = x && (x.clientDetails || x.ClientDetails);
  if (!d) return '';
  const ln = d.lastName != null ? d.lastName : d.LastName;
  return ln != null ? String(ln) : '';
}

export function clientNotesFromListRow(x) {
  const n = x && (x.notes != null ? x.notes : x.Notes);
  return n != null ? String(n) : '';
}

export function clientIdFromListRow(row) {
  const id = row && (row.Id != null ? row.Id : row.id);
  return id != null && String(id).trim() !== '' ? String(id).trim() : '';
}

/** True when row looks like k6 **`buildClientModel`** / load-test seed data. */
export function isK6ManagedClientRow(row) {
  if (!row || typeof row !== 'object') return false;
  const notes = clientNotesFromListRow(row);
  if (/k6 lifecycle/i.test(notes)) return true;
  const ln = clientLastNameFromListRow(row);
  if (!ln) return false;
  if (/^Cli/i.test(ln) && /fp\d+_g\d+_/i.test(ln)) return true;
  if (/-fp\d+_g\d+_/i.test(ln)) return true;
  if (/listseed|k6getid|k6tl-|k6tlf-|k6epd-|k6prof|k6post|k6c\.|k6cp\./i.test(ln)) return true;
  return false;
}

export function parseCashflowIdsFromClientCashflowsResponse(res) {
  if (res.status !== 200) return [];
  try {
    const arr = res.json();
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      const id = c && (c.Id != null ? c.Id : c.id);
      if (id != null && String(id).trim() !== '') out.push(String(id).trim());
    }
    return out;
  } catch {
    return [];
  }
}

export function truthyEnvFlag(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

export function falsyEnvFlag(value) {
  return ['0', 'false', 'no', 'off'].includes(String(value || '').trim().toLowerCase());
}

/**
 * @param {Record<string, string|undefined>} env
 */
export function resolvePreRunCleanupEnabledFromEnv(env) {
  if (falsyEnvFlag(env.FULL_PLATFORM_PRE_RUN_CLEANUP) || falsyEnvFlag(env.K6_PRE_RUN_CLEANUP)) return false;
  if (truthyEnvFlag(env.FULL_PLATFORM_PRE_RUN_CLEANUP) || truthyEnvFlag(env.K6_PRE_RUN_CLEANUP)) return true;
  const skipTeardown =
    truthyEnvFlag(env.FULL_PLATFORM_SKIP_TEARDOWN) || truthyEnvFlag(env.FULL_PLATFORM_SKIP_CLEANUP);
  const writeProfile = String(env.VOLUME_SLO_PROFILE || '').trim().toLowerCase() === 'write';
  return skipTeardown || writeProfile;
}

/**
 * @param {Record<string, string|undefined>} env
 */
export function resolvePreRunCleanupDeleteAllFromEnv(env) {
  return (
    truthyEnvFlag(env.FULL_PLATFORM_PRE_RUN_CLEANUP_ALL) ||
    truthyEnvFlag(env.K6_PRE_RUN_CLEANUP_ALL)
  );
}
