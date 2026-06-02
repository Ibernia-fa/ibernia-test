# Dependency report: `GET /api/v1/Clients/{advisorId}/all`

Investigation before server-side pagination (Phase 1).

## Backend

| Location | Usage |
|----------|--------|
| `ibernia-backend/.../ClientsController.cs` | `GetClients` — returns `IEnumerable<ClientModel>` as JSON **array** |
| `ClientService.GetClientsAsync` | Full list query |

## ibernia-portal (primary consumer)

| Location | Usage |
|----------|--------|
| `src/app/clients/services/client-http.service.ts` | `getClients(advisorId)` → `get<Array<Client>>(…/all)` |
| `src/app/clients/client-list/client-list.component.ts` | `getClients(this.user.sub)` → `MatTableDataSource(clients)` (client-side paginator) |
| Search fallback | `searchClients` then `getClients` when filter cleared |

**Contract:** raw **array**, not paged object.

## ibernia-portal-tests (E2E)

| Location | Usage |
|----------|--------|
| `e2e/tests/clients/add-client.spec.ts` | Waits for `GET …/Clients/…/all`, parses rows as array |
| `e2e/helpers/financial-series-model-chart-tooltip-test.ts` | Route mock on `**/api/v1/Clients/*/all` |

## load-testing-k6 (do not migrate in pagination PR)

| Area | Files (representative) |
|------|-------------------------|
| Journey | `k6/journeys/k6-journey-advisor-critical.js` |
| Clients load | `k6/clients/k6-clients-list-load.js`, `k6-clients-get-advisor-all-load.js`, `k6-clients-suite-load.js`, `k6-clients-search-load.js` (teardown list) |
| Profile | `k6/clients-profile/k6-clients-profile-get-advisor-clients-all-load.js` |
| Lib | `lib/k6-load-cleanup.js`, `lib/k6-full-platform-phases.js`, `lib/platform-api-catalog.js`, `lib/k6-journey-endpoint-stats.js` |
| pool-cli | `tools/pool-cli/src/audit-advisor-clients.js`, `verify-advisor-clients-isolation.js` |
| Smoke | `k6/api-smoke/k6-dev-api-bearer-smoke.js`, `k6-clients-advisor-isolation-smoke.js` |

All assume **200 + JSON array** (or 403 after IDOR fix).

## Existing paging infrastructure (backend)

| Asset | Notes |
|-------|--------|
| `Ibernia.SharedKernel.Helpers.Paging.PagedList<T>` | List + metadata; 0-based `PageIndex` in helper |
| `QueryableExtensions.PageBy` | 1-based page index, `Skip`/`Take` on `IQueryable` |
| `DataSourceResult` | `{ Data, Total }` — not used for Clients |

New API uses **`ClientPagedResultModel`** (1-based `pageNumber`, explicit `items` / `hasNextPage`).

## New endpoint (this change)

`GET /api/v1/Clients/{advisorId}/paged` — see `ibernia-backend/.../docs/CLIENTS_PAGED_API.md`.

`GET …/all` **unchanged** until portal migration.
