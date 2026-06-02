/**
 * Teardown helpers: k6 **`teardown()`** does not see **`globalThis`** mutations from VU code, so cleanup
 * re-logins per lifecycle row and discovers resources via **GET …/Clients/{advisorId}/all** (last-name needle)
 * and **GET …/client/{clientId}/cashflows** before deletes.
 */
import http from 'k6/http';

export function clientLastNameFromListRow(x) {
  const d = x && (x.clientDetails || x.ClientDetails);
  if (!d) return '';
  const ln = d.lastName != null ? d.lastName : d.LastName;
  return ln != null ? String(ln) : '';
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

/**
 * For each client in **GET …/Clients/{advisorSub}/all** whose last name includes **`needle`**:
 * **GET** **`/api/v1/client/{clientId}/cashflows`**, **DELETE** each cashflow, **DELETE** client.
 */
export function deleteClientsAndPlansByLastNameNeedle(base, hdrs, advisorSub, needle, httpTimeout, tagNames) {
  const tn = tagNames || {};
  const listUrl = `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`;
  const listRes = http.get(listUrl, {
    headers: hdrs,
    tags: { name: tn.list || 'cleanup_clients_all' },
    timeout: httpTimeout,
  });
  if (listRes.status !== 200) return;
  let arr;
  try {
    arr = listRes.json();
  } catch {
    return;
  }
  if (!Array.isArray(arr)) return;
  const clientIds = [];
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    const ln = clientLastNameFromListRow(row);
    if (!ln.includes(needle)) continue;
    const id = row && (row.Id != null ? row.Id : row.id);
    if (id != null && String(id).trim() !== '') clientIds.push(String(id).trim());
  }
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
    }
    http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
      headers: hdrs,
      tags: { name: tn.delClient || 'cleanup_del_client' },
      timeout: httpTimeout,
    });
  }
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
