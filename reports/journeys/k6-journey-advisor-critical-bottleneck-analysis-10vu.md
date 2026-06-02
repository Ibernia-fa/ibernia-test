# 10 VU advisor critical journey — bottleneck analysis

**Primary run (your report):** `journey-adv` · 10 VU · 5m · 2026-06-01  
**Confirmatory run:** `journey-adv-diag` · same config · correlation headers + diagnostics  
**Artifacts:** [summary](k6-journey-advisor-critical-summary.json) · [run log](k6-journey-advisor-critical-run-2026-06-01.md) · [diag summary](k6-journey-advisor-critical-summary-diag.json)

**Phase 3 ramp:** not started.

**Data realism:** See [`docs/advisor-client-data-realism.md`](../../docs/advisor-client-data-realism.md) and live audit [`advisor-client-audit-dev.json`](advisor-client-audit-dev.json) — **k6 client accumulation** explains 500–1500 client lists (e.g. User100: **1462** clients, **~1.19 MB**, **2.3 s**).

---

## Verdict (short)

| Cause | Applies |
|-------|---------|
| **Real application bottleneck** (dashboard list) | **Yes — primary** |
| **Missing pagination / large payload** | **Yes** |
| **Parallel batch wall-clock SLO** (cashflow step) | **Yes — secondary** |
| **Dev contention / underpowered** | **Contributing** (120s timeouts on `journey-adv`) |
| **Mongo index / scan risk** | **Likely** |
| Unrealistic k6 pool (heavy client history) | **Yes — confirmed** (audit: most clients are k6-like) |
| Test-only / wrong journey | **Partial** — tune critical vs optional APIs in SLO |

**Recommendation before Phase 3:** **A — Fix `GET /Clients/{advisorId}/all` first**, then **B** (timeouts + split cashflow critical bundle). Not **D** (ramp).

---

## Journey summary (`journey-adv` — 10 VU / 5m)

| Journey metric | Avg | p90 | p95 | p99 | Max | Budget | Pass/Fail |
|----------------|----:|----:|----:|----:|----:|-------:|:---------:|
| `journey_login_duration` | 512 ms | 591 ms | 651 ms | n/a¹ | 1,089 ms | 1,500 ms | **Pass** |
| `journey_dashboard_load_duration` | 2,421 ms | 4,299 ms | **6,288 ms** | n/a¹ | 20,045 ms | 2,500 ms | **Fail** |
| `journey_open_client_duration` | 296 ms | 308 ms | 319 ms | n/a¹ | 1,856 ms | 2,000 ms | **Pass** |
| `journey_cashflow_load_duration` | 1,894 ms | 881 ms | 1,276 ms | n/a¹ | **120,006 ms** | 3,000 ms | **Fail** |
| `user_lag_rate` | **5.00%** | — | — | — | — | &lt;5% | **Fail** |

¹ k6 JSON export did not include `p(99)` for custom Trends; thresholds also use `p(99)` which may fail cashflow despite acceptable p95.

**Diag run (`journey-adv-diag`):** same thresholds failed; **0 HTTP timeouts**; dashboard p95 **7,983 ms**; `user_lag_rate` **6.15%**.

---

## 1. Dashboard API — `GET /api/v1/Clients/{advisorId}/all`

### Latency (this endpoint only)

`journey_dashboard_load_duration` wraps **only** this HTTP call.

| Stat | `journey-adv` | `journey-adv-diag` |
|------|--------------:|-------------------:|
| **Avg** | 2,421 ms | 2,296 ms |
| **p90** | 4,299 ms | 4,772 ms |
| **p95** | **6,288 ms** | **7,983 ms** |
| **p99** | n/a | n/a |
| **Max** | 20,045 ms | 39,612 ms |

### Response size & clients per advisor

Not in the original JSON. A **90s / 3 VU smoke** with payload Trends (same pool users) measured:

| Stat | Clients returned | Response body (bytes) |
|------|-----------------:|----------------------:|
| **Avg** | **514** | **~420 KB** |
| **Min** | 160 | ~127 KB |
| **Med** | 352 | ~296 KB |
| **Max** | **1,463** | **~1.19 MB** |

Pool advisors (User100–User77) carry **large historical client lists** from prior k6 seeding — this amplifies dashboard cost.

### Pagination, payload, frontend

| Question | Answer |
|----------|--------|
| Pagination? | **No** — full list in one response |
| Too much data? | **Yes** under load — unbounded list + full `ClientModel` per row |
| Frontend needs full payload on first load? | SPA not in repo; k6 maps call to `/clients` roster — a **summary DTO** (id, names, last updated) is likely enough for first paint |
| DB query | Mongo: `FinancialAdvisor.AdvisorId == advisorId && DeletedAt == null` → `ToListAsync()` |
| Indexes | **No in-repo index** on `FinancialAdvisor.AdvisorId` — scan risk as data grows |
| N+1 | **No** — single query |
| Eager loading | **N/A** — full documents returned |
| Optimize / split? | **Yes** — compound index, pagination, list projection DTO |

```103:110:ibernia-backend/Services/IberniaManager/Ibernia.Api/Services/Clients/ClientService.cs
        public async Task<IEnumerable<ClientModel>> GetClientsAsync(string advisorId)
        {
            var moods = await _repository.Table
                .Where(x => x.FinancialAdvisor.AdvisorId == advisorId && x.DeletedAt == null)
                .ToListAsync();
            return moods.ToModelList();
        }
```

---

## 2. Per-endpoint table (`journey-adv` — 10 VU)

Original run did **not** record per-URL Trends (fixed now via `journey_ep_*` metrics). Values below: **measured** where the journey timer equals one GET; **estimated** for batch members from failure counts only.

| Endpoint | Count | Avg | p90 | p95 | p99 | Max | Failures | Timeout | Response size |
|----------|------:|----:|----:|----:|----:|----:|---------:|--------:|---------------|
| `GET /api/v1/Clients/{advisorId}/all` | ~229 | 2,421 ms | 4,299 ms | **6,288 ms** | n/a | 20,045 ms | 0 | 0 | ~420 KB avg (smoke) |
| `GET /api/v1/Clients/{id}` | ~229 | 296 ms | 308 ms | 319 ms | n/a | 1,856 ms | 0 | 0 | n/a |
| `GET /api/v1/cashflows/{id}` | ~229 | — | — | — | n/a | — | 0 | 0 | n/a |
| `GET /api/v1/cashflows/{id}/timelines` | ~229 | — | — | — | n/a | — | 0 | 0 | n/a |
| `GET /api/v1/cashflows/{id}/financial` | ~229 | — | — | — | n/a | **120 s** | **1** | **1** | n/a |
| `GET /api/v1/cashflows/{id}/income-expense/financial` | ~229 | — | — | — | n/a | — | 0 | 0 | n/a |
| `GET /api/v1/Reports/{id}` | ~229 | — | — | — | n/a | — | 0 | 0 | n/a |
| `GET /api/v1/Events/default` | ~229 | — | — | — | n/a | **120 s** | **1** | **1** | small catalog |
| `GET /api/v1/Events/custom` | ~229 | — | — | — | n/a | — | 0 | 0 | n/a |

**Next 10 VU rerun** will fill all rows via `reports/journeys/k6-journey-advisor-critical-endpoints-*.md` (`journey_ep_*` Trends + payload Trends).

---

## 3. Timeout analysis (`journey-adv`)

| Endpoint | Client timing | Server logs | HTTP | Notes |
|----------|---------------|-------------|------|-------|
| `GET /api/v1/Events/default` | **~120 s** (k6 `HTTP_TIMEOUT`) | Not available in this workspace | `status 0` / timeout | 1 failed check / 229 iters; WARN ~147s wall |
| `GET /api/v1/cashflows/{id}/financial` | **~120 s** | Not available | `status 0` / timeout | 1 failed check; WARN ~259s wall |

| Question | Answer |
|----------|--------|
| API completed after client abort? | **Unknown** — no Railway/log access |
| DB / app / network timeout? | **Likely app/DB contention** on dev (not 502/504 in k6); same endpoints hit **21–33 s** with HTTP 200 in consolidated dev runs |
| 500 / 502 / 504 / Railway restarts? | **Not seen** in k6 output |
| Slow in browser? | **Plausible on dev** under load when opening a plan |

**Events/default** — small `IsDefault == true` query; timeout points to **starvation**, not payload size.

**Financial** — loads full `FinancialRecord` by `Cashflow.Id` (nested incomes/expenses); can be large.

**Cashflow journey fail:** p95 **~1.3 s** healthy; **max 120 s** = parallel batch wall-clock when one of seven GETs times out. Events are `critical: false` but still count toward the step timer.

`journey-adv-diag`: **no timeouts** (0% `http_req_failed`); cashflow max **15.1 s** — intermittent under contention.

---

## 4. Server-side metrics (10 VU window)

**Not available** from this environment. Capture for the next investigation: API/Identity CPU & memory, Mongo CPU/memory/connections, slow queries, pool saturation, Railway deploy/restart overlap with test window.

---

## 5. Correlation IDs and logs

### k6 (implemented)

Every journey request sends: `X-Correlation-Id`, `X-Journey`, `X-VU`, `X-Iteration`, `X-k6-Script`.

Format: `k6-jadv-vu{VU}-iter{ITER}-{step}-{timestamp}`

### Backend (gap)

No middleware found that logs these headers into Serilog/Elasticsearch. **`AuditMiddleware`** records path/duration, not k6 headers. **They will not appear in logs until API adds correlation scope.**

---

## 6. Rerun (10 VU / 5m) with full per-endpoint table

Diagnostics are fixed (`journey_ep_*` Trends + dashboard payload Trends). Run:

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
$env:STS_SECRET = '...'

node tools/pool-cli/bin/pool-cli.js lease --count 10 --run-id journey-adv-rerun --env dev --verified-only `
  --out data/user-pool/dev/pool-slice-journey-adv-rerun.json

k6 run k6/journeys/k6-journey-advisor-critical.js `
  -e USE_USER_POOL=1 `
  -e POOL_SLICE_FILE=data/user-pool/dev/pool-slice-journey-adv-rerun.json `
  -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
  -e SIGNUP_ROPC_CLIENT_SECRET=$env:STS_SECRET `
  -e VUS=10 -e DURATION=5m `
  -e JOURNEY_SUMMARY_JSON_PATH=reports/journeys/k6-journey-advisor-critical-summary-rerun.json `
  -e JOURNEY_ENDPOINT_STATS_MD_PATH=reports/journeys/k6-journey-advisor-critical-endpoints-rerun.md

node tools/pool-cli/bin/pool-cli.js release --run-id journey-adv-rerun --env dev
```

---

## 7. Recommendation

| Option | Choice |
|--------|--------|
| **A** | **Fix dashboard endpoint first** — index + pagination/summary DTO |
| **B** | Fix timeout endpoints + split **critical** cashflow bundle from Events |
| **C** | Threshold-only adjustment | **No** — hides real tail latency |
| **D** | Phase 3 ramp | **No** — fails at 10 VU |
| **E** | Change journey entirely | **No** — adjust SLO scope, not remove fan-out |
