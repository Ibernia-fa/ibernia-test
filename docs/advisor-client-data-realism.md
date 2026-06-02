# Advisor client data realism (investigation)

## Summary

**Root cause:** Dev MongoDB **accumulates clients per pool advisor** across many k6 runs. Teardown only deletes clients whose **last name contains that run’s needle** — not all k6-created clients. Reusing the same `UserNN@gmail.com` advisors for months of baseline + journey tests produces **500–1500+ clients per advisor**, which is **not realistic** and **inflates** `GET /api/v1/Clients/{advisorId}/all` latency and p95.

This is **intentional test-setup behavior** (per-script cleanup), not a production bug — but it is **uncontrolled** for cross-run totals.

---

## 1. Where clients are created

| Source | What it adds | Cleanup |
|--------|----------------|---------|
| **~57 baseline `*-load.js` scripts** | Often **2 clients per VU** on first iteration (`listseed`, `get-advisor-all`, suites, etc.) | Teardown deletes only rows matching **that script’s needle** (e.g. `listseed{runTag}`) |
| **`k6-journey-advisor-critical.js`** | **1 client + 1 cashflow per VU** per run (`k6jadv{runTag}vu{VU}` in last name) | Teardown deletes `k6jadv{runTag}` only |
| **`k6-client-full-lifecycle.js`** | Full client/plan lifecycle | Partial / needle-based |
| **Manual / old QA** | Unknown | None |
| **Provision signup** | Identity user only — not clients | N/A |

**Pool reuse:** `User01`–`User120` are **sticky** across runs (`docs/user-pool.md`). The **database is never reset** between routine k6 jobs.

---

## 2. Why variance is huge (500 vs 1500)

- Advisors used in **high-VU** suites (100 VUs × 2 seeds × many scripts) accumulate more than advisors used only in **10 VU journey** runs.
- **Failed teardown** (ROPC fail, timeout, `--ContinueOnError`, interrupted run) leaves needles behind.
- **Different needles** do not match older runs (`listseed` vs `k6cl` vs `k6jadv` vs `Clik6…`) — each run adds, only removes its own tag.
- **Non-k6** clients may exist (manual QA) — counted in total, not in k6-like heuristic.

---

## 3. Investigation tooling (added)

### pool-cli: `audit-advisor-clients`

Read-only audit of live dev data per pool user:

```powershell
cd load-testing-k6
$env:STS_SECRET = '...'

# All active verified users (or limit band)
node tools/pool-cli/bin/pool-cli.js audit-advisor-clients --env dev --verified-only `
  --user-num-min 1 --user-num-max 120 `
  --warn-above 200 `
  --out reports/journeys/advisor-client-audit-dev.json
```

Output per advisor: **email**, **FinancialAdvisorId**, **clientCount**, **k6-like estimate**, **responseBytes**, **elapsedMs**.

### k6 journey warning

If dashboard list returns more than **`JOURNEY_ADVISOR_CLIENT_WARN_ABOVE`** (default **200**), the journey logs:

`DATA_REALISM: FinancialAdvisorId=… clientCount=…`

### API structured logging (deploy required)

`GET /api/v1/Clients/{advisorId}/all` now logs (Serilog / ILogger):

- `FinancialAdvisorId`
- `ClientCount`
- `ElapsedMs`
- `CorrelationId` (from `X-Correlation-Id`)
- `AdvisorEmail` (from JWT)
- `Journey`, `Vu`, `Iteration` (from k6 headers when present)

Event name: **`AdvisorClientsList`** with named properties for Elasticsearch.

---

## 4. Recommended controls (decision pending)

**Do not mass-delete yet** until audit JSON is reviewed.

| Option | Description |
|--------|-------------|
| **A. Audit + selective cleanup** | Run `audit-advisor-clients`; delete k6-tagged clients per advisor with a new `pool-cli purge-k6-clients` (future) |
| **B. Per-run reset band** | Lease users `User101–110` only for journeys; `purge` + reprovision small band |
| **C. Deterministic seed cap** | New script seeds exactly N clients per advisor before test; teardown removes **all** `k6*` needles |
| **D. Summary API** | `GET /clients/summary` (product change) — see below |

### Journey / load test guardrails (implemented, soft)

- Warn when client count &gt; 200 (configurable).
- Documented needles and accumulation here.

**Not implemented yet:** hard fail on count, automatic DB reset, or global k6 client purge (needs your sign-off).

---

## 5. Optional product improvement (not implemented)

For dashboard first paint:

- `GET /api/v1/clients/summary` → `id`, `name`, `status`, `lastUpdated`
- Keep `GET /Clients/{advisorId}/all` for full profile / legacy

Requires product/API design sign-off — listed here only as recommendation.

---

## 6. Impact on performance results

| Effect | Explanation |
|--------|-------------|
| Inflated p95/p99 | Serializing **1 MB+** JSON for 1000+ clients dominates dashboard step |
| Advisor-to-advisor variance | Explains **500 vs 1500** and different p95 per pool user |
| Not CPU-only | Large **http_req_receiving** times correlate with payload size (see smoke metrics) |

After data is brought into **50–200 clients** range, re-run **10 VU / 5m journey** to remeasure dashboard SLO.

---

## Related files

- `tools/pool-cli/src/audit-advisor-clients.js`
- `lib/k6-load-cleanup.js` (needle-only delete)
- `k6/journeys/k6-journey-advisor-critical.js` (seed + teardown)
- `ibernia-backend/.../ClientsController.cs` (logging)
