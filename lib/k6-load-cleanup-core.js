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

export function clientEmailFromListRow(x) {
  const d = x && (x.clientDetails || x.ClientDetails);
  if (!d) return '';
  const e = d.email != null ? d.email : d.Email;
  return e != null ? String(e).trim().toLowerCase() : '';
}

/** Match volume-seed email `{name}.{name}.{clientTag}@domain` from Phase A writes. */
export function findClientIdByVolumeClientTag(clients, clientTag) {
  if (!clientTag || !Array.isArray(clients)) return null;
  const tag = String(clientTag);
  const needle = `.${tag.toLowerCase()}@`;
  for (let i = 0; i < clients.length; i++) {
    const row = clients[i];
    const email = clientEmailFromListRow(row);
    if (email && email.includes(needle)) return clientIdFromListRow(row);
    if (clientRowMatchesUniqueTag(row, tag)) return clientIdFromListRow(row);
  }
  return null;
}

export function clientIdFromListRow(row) {
  const id = row && (row.Id != null ? row.Id : row.id);
  return id != null && String(id).trim() !== '' ? String(id).trim() : '';
}

/**
 * Exact unique-tag match on last name (avoids `c1` matching `c10` via substring).
 * Matches **`Cli{tag}`** or **`{base}-{tag}`** from **`buildClientModel`**.
 */
export function lastNameMatchesUniqueTag(lastName, needle) {
  if (!needle || lastName == null) return false;
  const ln = String(lastName);
  const n = String(needle);
  if (ln === `Cli${n}`) return true;
  if (ln.endsWith(`-${n}`)) return true;
  return false;
}

/** Notes from **`buildClientModel`**: `k6 lifecycle {uniqueTag} …` */
export function notesMatchUniqueTag(notes, needle) {
  if (!needle || notes == null) return false;
  const re = new RegExp(`k6 lifecycle\\s+${escapeRegExp(String(needle))}(\\s|$)`, 'i');
  return re.test(String(notes));
}

export function clientRowMatchesUniqueTag(row, needle) {
  if (!row || !needle) return false;
  return (
    lastNameMatchesUniqueTag(clientLastNameFromListRow(row), needle) ||
    notesMatchUniqueTag(clientNotesFromListRow(row), needle)
  );
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeExcludeClientIds(excludeClientIds) {
  if (!excludeClientIds) return new Set();
  if (excludeClientIds instanceof Set) return excludeClientIds;
  const out = new Set();
  const list = Array.isArray(excludeClientIds) ? excludeClientIds : [excludeClientIds];
  for (let i = 0; i < list.length; i++) {
    const id = list[i] != null ? String(list[i]).trim() : '';
    if (id) out.add(id);
  }
  return out;
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

/**
 * Artificial fleet stagger/pauses (advisor index, client slot) for volume writes.
 * Disabled only when VOLUME_DISABLE_FLEET_STAGGER=1 (opt-in).
 * @param {Record<string, string|undefined>} env
 * @param {number} [_clientsPerAdvisor]
 */
export function volumeFleetStaggerEnabledFromEnv(env, _clientsPerAdvisor) {
  if (truthyEnvFlag(env.VOLUME_DISABLE_FLEET_STAGGER)) return false;
  if (falsyEnvFlag(env.VOLUME_DISABLE_FLEET_STAGGER)) return true;
  return true;
}

/**
 * Phase A write pre-run cleanup — explicit env flags win; otherwise same defaults as resolvePreRunCleanupEnabledFromEnv.
 * @param {Record<string, string|undefined>} env
 * @param {number} [_clientsPerAdvisor]
 */
export function volumePreRunCleanupEnabledFromEnv(env, _clientsPerAdvisor) {
  if (falsyEnvFlag(env.FULL_PLATFORM_PRE_RUN_CLEANUP) || falsyEnvFlag(env.K6_PRE_RUN_CLEANUP)) return false;
  if (truthyEnvFlag(env.FULL_PLATFORM_PRE_RUN_CLEANUP) || truthyEnvFlag(env.K6_PRE_RUN_CLEANUP)) return true;
  return resolvePreRunCleanupEnabledFromEnv(env);
}
