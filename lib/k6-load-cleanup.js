/**
 * Teardown helpers: k6 **`teardown()`** does not see **`globalThis`** mutations from VU code, so cleanup
 * re-logins per lifecycle row and discovers resources via **GET …/Clients/{advisorId}/all** (last-name needle)
 * and **GET …/client/{clientId}/cashflows** before deletes.
 *
 * **Pre-run purge (write scripts):** call **`purgeK6ClientsAndPlansForAdvisor`** before creating clients when
 * **`FULL_PLATFORM_PRE_RUN_CLEANUP=1`** (default on for write profile / skip-teardown Phase A runs).
 */
import http from 'k6/http';
import {
  clientIdFromListRow,
  clientLastNameFromListRow,
  clientNotesFromListRow,
  isK6ManagedClientRow,
  parseCashflowIdsFromClientCashflowsResponse,
  resolvePreRunCleanupDeleteAllFromEnv,
  resolvePreRunCleanupEnabledFromEnv,
} from './k6-load-cleanup-core.js';

export {
  clientIdFromListRow,
  clientLastNameFromListRow,
  clientNotesFromListRow,
  isK6ManagedClientRow,
  parseCashflowIdsFromClientCashflowsResponse,
  resolvePreRunCleanupDeleteAllFromEnv,
  resolvePreRunCleanupEnabledFromEnv,
} from './k6-load-cleanup-core.js';

/**
 * Whether to purge existing k6 clients/plans before a write journey.
 * Default **on** when data is kept after the run (skip teardown) or **`VOLUME_SLO_PROFILE=write`**.
 */
export function isPreRunCleanupEnabled() {
  return resolvePreRunCleanupEnabledFromEnv(__ENV);
}

/** When true, delete every client for the advisor (dev fixed-advisor fleets). */
export function isPreRunCleanupDeleteAllClients() {
  return resolvePreRunCleanupDeleteAllFromEnv(__ENV);
}

export function listAdvisorClients(base, hdrs, advisorSub, httpTimeout, tagNames) {
  const tn = tagNames || {};
  const listUrl = `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`;
  const listRes = http.get(listUrl, {
    headers: hdrs,
    tags: { name: tn.list || 'cleanup_clients_all' },
    timeout: httpTimeout,
  });
  if (listRes.status !== 200) {
    return { ok: false, status: listRes.status, clients: [] };
  }
  try {
    const arr = listRes.json();
    return { ok: true, status: 200, clients: Array.isArray(arr) ? arr : [] };
  } catch {
    return { ok: false, status: listRes.status, clients: [] };
  }
}

/**
 * **DELETE** each cashflow for **`clientIds`**, then **DELETE** the client.
 * @returns {{ deletedClients: number, deletedPlans: number }}
 */
export function deleteClientsAndPlansForClientIds(base, hdrs, clientIds, httpTimeout, tagNames) {
  const tn = tagNames || {};
  let deletedClients = 0;
  let deletedPlans = 0;
  for (let j = 0; j < clientIds.length; j++) {
    const clientId = clientIds[j];
    const cfUrl = `${base}/api/v1/client/${encodeURIComponent(clientId)}/cashflows`;
    const cfRes = http.get(cfUrl, {
      headers: hdrs,
      tags: { name: tn.cfList || 'cleanup_client_cashflows' },
      timeout: httpTimeout,
    });
    const cfIds = parseCashflowIdsFromClientCashflowsResponse(cfRes);
    for (let k = 0; k < cfIds.length; k++) {
      http.del(`${base}/api/v1/cashflows/${encodeURIComponent(cfIds[k])}`, null, {
        headers: hdrs,
        tags: { name: tn.delCf || 'cleanup_del_cashflow' },
        timeout: httpTimeout,
      });
      deletedPlans += 1;
    }
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: tn.delClient || 'cleanup_del_client' },
      timeout: httpTimeout,
    });
    deletedClients += 1;
  }
  return { deletedClients, deletedPlans };
}

/**
 * Remove k6-managed clients (or all clients when **`deleteAllClients`**) for an advisor before a write run.
 * @returns {{ deletedClients: number, deletedPlans: number, listOk: boolean, mode: string }}
 */
export function purgeK6ClientsAndPlansForAdvisor(
  base,
  hdrs,
  advisorSub,
  httpTimeout,
  tagNames,
  options,
) {
  const opts = options || {};
  const deleteAll = opts.deleteAllClients === true;
  const tn = tagNames || {};
  const listed = listAdvisorClients(base, hdrs, advisorSub, httpTimeout, tn);
  if (!listed.ok) {
    return { deletedClients: 0, deletedPlans: 0, listOk: false, mode: deleteAll ? 'all' : 'k6-tagged' };
  }
  const clientIds = [];
  for (let i = 0; i < listed.clients.length; i++) {
    const row = listed.clients[i];
    if (!deleteAll && !isK6ManagedClientRow(row)) continue;
    const id = clientIdFromListRow(row);
    if (id) clientIds.push(id);
  }
  const counts = deleteClientsAndPlansForClientIds(base, hdrs, clientIds, httpTimeout, tn);
  return {
    ...counts,
    listOk: true,
    mode: deleteAll ? 'all' : 'k6-tagged',
    matchedClients: clientIds.length,
  };
}

/**
 * For each client in **GET …/Clients/{advisorSub}/all** whose last name includes **`needle`**:
 * **GET** **`/api/v1/client/{clientId}/cashflows`**, **DELETE** each cashflow, **DELETE** client.
 */
export function deleteClientsAndPlansByLastNameNeedle(base, hdrs, advisorSub, needle, httpTimeout, tagNames) {
  const tn = tagNames || {};
  const listed = listAdvisorClients(base, hdrs, advisorSub, httpTimeout, tn);
  if (!listed.ok) return;
  const clientIds = [];
  for (let i = 0; i < listed.clients.length; i++) {
    const row = listed.clients[i];
    const ln = clientLastNameFromListRow(row);
    if (!ln.includes(needle)) continue;
    const id = clientIdFromListRow(row);
    if (id) clientIds.push(id);
  }
  deleteClientsAndPlansForClientIds(base, hdrs, clientIds, httpTimeout, tn);
}

/**
 * **GET …/Events/custom**; **DELETE** each event whose **name** contains **`needle`** (substring match).
 */
export function deleteCustomEventsByNameNeedle(base, hdrs, needle, httpTimeout, tagNames) {
  const tn = tagNames || {};
  const url = `${base}/api/v1/Events/custom`;
  const res = http.get(url, {
    headers: hdrs,
    tags: { name: tn.list || 'cleanup_events_custom_list' },
    timeout: httpTimeout,
  });
  if (res.status !== 200) return;
  let arr;
  try {
    arr = res.json();
  } catch {
    return;
  }
  if (!Array.isArray(arr)) return;
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    if (!row || typeof row !== 'object') continue;
    const name = row.name != null ? row.name : row.Name;
    const nm = name != null ? String(name) : '';
    if (!nm.includes(needle)) continue;
    const id = row.id != null ? row.id : row.Id;
    if (id == null || String(id).trim() === '') continue;
    http.del(`${base}/api/v1/Events/${encodeURIComponent(String(id).trim())}`, null, {
      headers: hdrs,
      tags: { name: tn.delEvent || 'cleanup_del_event' },
      timeout: httpTimeout,
    });
  }
}
