# Volume sign-off — S4-smoke-1client

Generated: 2026-06-04T08:00:19.610Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S4-smoke-1client` |
| Phase A (write) | `S4-smoke-1client` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 1 | 0 | FAIL |
| Plans (write) | 1 | 0 | FAIL |
| Shards | 1 | 1 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_20c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_client_duration` | 1/1 | 0/1 | — | 3678 | n/a |
| `POST /api/v1/Clients` | 1/1 | 0/1 | — | 2682 | n/a |

**Shards all required metrics under budget:** 1/1 · **Any over:** 0/1

### Quota breach summary

**Advisors over latency budget:** 0/1 · **All required metrics under budget:** 1/1

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 322 (p95) | no | 3678 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 318.2 (max) | no | 2682 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |

## Phase B — read profile

_N/A — no sign-off shard data._

## Errors & runner

| Category | Value |
|----------|-------|
| Auth failure rate | not measured |
| Business failure rate | not measured |
| HTTP failure rate | not measured |
| Phase A k6 exit 0 | 0 |
| Phase A k6 exit 99 | 0 _(k6 thresholds, not functional fail)_ |

## Fleet custom SLO gate

- Phase A fleet gate: **PASS** (passed 0, failed 0)

## Recommendation

**NO-GO (or incomplete)** — Review budget tables and data gates before S2.

---

Machine output: `reports/phase-volume/S4-smoke-1client_signoff-fleet.json`
