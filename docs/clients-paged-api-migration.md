# k6 / pool-cli migration plan: `…/all` → `…/paged`

**Status:** Not implemented in k6 yet. Backend adds `GET /api/v1/Clients/{advisorId}/paged` while `…/all` remains a full array.

## Target request

```http
GET /api/v1/Clients/{advisorSub}/paged?pageNumber=1&pageSize=50
Authorization: Bearer {token}
```

## Response shape

```json
{
  "items": [ /* ClientModel[] */ ],
  "totalCount": 1234,
  "pageNumber": 1,
  "pageSize": 50,
  "totalPages": 25,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Scripts to migrate (later PR)

| Priority | Script / module |
|----------|------------------|
| P0 | `k6/journeys/k6-journey-advisor-critical.js` (dashboard step) |
| P0 | `k6/clients/k6-clients-list-load.js`, `k6-clients-get-advisor-all-load.js` |
| P1 | `lib/k6-load-cleanup.js` — may need to page through all clients for needle delete, or keep using `…/all` until cleanup strategy changes |
| P1 | `tools/pool-cli/src/audit-advisor-clients.js` — report `totalCount` + page payload size |
| P2 | Suite, profile, full-platform, search teardown, api-smoke |

## Suggested k6 helper (future)

```javascript
export function fetchAllClientsPaged(base, advisorSub, token, pageSize = 50) {
  const items = [];
  let pageNumber = 1;
  let totalPages = 1;
  while (pageNumber <= totalPages) {
    const url = `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/paged?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    const res = http.get(url, { headers: apiHeaders(token) });
    // check 200, parse body.items, body.totalPages, body.hasNextPage
    pageNumber += 1;
  }
  return items;
}
```

## Thresholds / metrics

- Replace `dashboardPayloadBytes` from full-array size with **per-page** size or `totalCount` trend.
- SLOs on dashboard step should use **first page** latency (`pageNumber=1`, `pageSize=50`), not full roster download.

## Security

Cross-advisor calls to `…/paged` must return **403** (same as `…/all`). Reuse `verify-advisor-clients-isolation` pattern with paged URL when migrated.

## When to retire `…/all`

After portal uses `…/paged` exclusively and k6 baselines are rebased. Optional deprecation header on `…/all` before removal.
