# Security: `GET /api/v1/Clients/{advisorId}/all`

## Verdict

| Question | Answer (before fix) | Answer (after backend deploy) |
|----------|---------------------|-------------------------------|
| Is the endpoint safe? | **No** — IDOR on dev (2026-06-01) | **Yes** — route must match JWT `sub` |
| Can advisor ID spoofing happen? | **Yes** | **No** — mismatch → **403** |

**Pre-fix proof:** User01 token → `GET /Clients/{User02 sub}/all` → **HTTP 200**, **49 clients**, marker `6a1d75fb067454c0c040e82b` visible.

**Backend fix:** `ClientsController.ForbidUnlessRouteAdvisorMatchesCaller` in **ibernia-backend** (deploy required for dev verification).

## Current implementation

### Controller — `GET {advisorId}/all`

```63:70:ibernia-backend/Services/IberniaManager/Ibernia.Api/Controllers/ClientsController.cs
public async Task<ActionResult<ClientModel>> GetClients([FromRoute] string advisorId)
{
    var clients = await _clientService.GetClientsAsync(advisorId);
    if (clients != null) return Ok(clients);
    return NoContent();
}
```

- **`advisorId` source:** `[FromRoute]` only — **not** taken from JWT in the original code.
- **`IIdentityService`** is injected but was **unused** for this action.
- Auth: controller has `[RequireModule(ClientProfile)]`; global policy requires a valid Bearer token.

### Service

```103:110:ibernia-backend/Services/IberniaManager/Ibernia.Api/Services/Clients/ClientService.cs
public async Task<IEnumerable<ClientModel>> GetClientsAsync(string advisorId)
{
    var moods = await _repository.Table
        .Where(x => x.FinancialAdvisor.AdvisorId == advisorId && x.DeletedAt == null)
        .ToListAsync();
    return moods.ToModelList();
}
```

- Filters Mongo by `FinancialAdvisor.AdvisorId == advisorId` and `DeletedAt == null`.
- **No** check that `advisorId` equals the logged-in user.

### Repository

- `IRepository<Client>.Table` — LINQ over Mongo; no additional authorization layer.

### Where authenticated advisor id lives

- JWT claim **`sub`** (and related claims) via `IIdentityService.UserIdentity` (same pattern as `GET client/{clientId}/cashflows`, which uses `_identityService.UserIdentity` instead of a route advisor id).

### Related IDOR surface

- `GET {advisorId}/search` — same route-only advisor id (no caller check observed).
- `GET {id}` (single client) — **no** advisor ownership check in controller/service (out of scope for this report but worth a follow-up).

## Security validation

| Check | Result |
|-------|--------|
| Can Advisor A call `/Clients/{advisorBId}/all` and get B’s clients? | **Yes (current API behavior)** |
| Does backend compare route `advisorId` to JWT `sub`? | **No** |
| Expected safe behavior | **403 Forbidden** when route ≠ caller `sub` |

## Backend fix (ibernia-backend)

| File | Change |
|------|--------|
| `Controllers/ClientsController.cs` | `ForbidUnlessRouteAdvisorMatchesCaller` on `GetClients` + `SearchClient` |
| `Tests/.../ClientsControllerAuthorizationTests.cs` | Unit tests |
| `docs/CLIENTS_API_AUTHORIZATION_FOLLOWUP.md` | Other endpoints still at risk |

**Deploy** to dev, then re-run verification below (expect **403** on cross-advisor calls).

## Automated verification (load-testing-k6)

| # | Requirement | Implemented in |
|---|-------------|----------------|
| 1 | Advisor gets own clients | `verify-advisor-clients-isolation` — Test1: A token + A route → 200/204 |
| 2 | A cannot read B’s list | Test2: cross `…/all` must be **403** (fails on unpatched dev) |
| 3 | A cannot search B’s clients | Test3: cross `…/search` must be **403** |
| 4 | No B clients on A’s route | Test4: every row’s `FinancialAdvisor.AdvisorId` = A `sub` |
| 5 | Deleted excluded | Test5: create → delete → not in A’s list |

| Runner | Path |
|--------|------|
| pool-cli | `tools/pool-cli/src/verify-advisor-clients-isolation.js` |
| k6 smoke | `k6/api-smoke/k6-clients-advisor-isolation-smoke.js` |

No matching tests found under `ibernia-backend/.../Tests` for this endpoint.

```powershell
cd load-testing-k6
$env:STS_SECRET = "…"
node tools/pool-cli/bin/pool-cli.js verify-advisor-clients-isolation --env dev `
  --email-a User01@… --email-b User02@…
```

**k6 smoke** (two explicit advisors):

```powershell
k6 run --vus 1 --iterations 1 k6/api-smoke/k6-clients-advisor-isolation-smoke.js `
  -e SIGNUP_ROPC_CLIENT_ID=… -e SIGNUP_ROPC_CLIENT_SECRET=… `
  -e ADVISOR_A_EMAIL=… -e ADVISOR_A_PASSWORD=… `
  -e ADVISOR_B_EMAIL=… -e ADVISOR_B_PASSWORD=…
```

No in-repo **xUnit** project was present under `ibernia-backend` in this workspace; integration checks live in **pool-cli** and **k6** above.

## Files changed (load-testing-k6 only)

| File | Change |
|------|--------|
| `docs/advisor-clients-isolation-security.md` | This report |
| `k6/api-smoke/k6-clients-advisor-isolation-smoke.js` | k6 cross-advisor smoke |
| `tools/pool-cli/src/verify-advisor-clients-isolation.js` | Four dev integration checks |
| `tools/pool-cli/bin/pool-cli.js` | New command wiring |
| `tools/pool-cli/src/config.js` | `--email-a` / `--email-b` for isolation verify |
