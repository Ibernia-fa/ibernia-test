# Volume sign-off — S3-write

Generated: 2026-06-03T04:16:05.590Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S3-write` |
| Phase A (write) | `S3-write` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 200 | 20 | FAIL |
| Plans (write) | 800 | 80 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_10c_4p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 2/20 | 0/20 | — | 1006 | n/a |
| `journey_create_client_duration` | 2/20 | 0/20 | — | 103 | n/a |
| `POST /api/v1/cashflows` | 0/20 | 2/20 | advisor-00, advisor-01 | n/a | 1946 |
| `POST /api/v1/Clients` | 2/20 | 0/20 | — | 1989 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 2/20 · **Failed:** advisor-00, advisor-01

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 3100 (p95) | no | 900 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3994 (p95) | no | 1006 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1011.4 (max) | no | 1989 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5945.9 (max) | **yes** | -1946 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 45026 (p95) | **yes** | -40026 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 3897 (p95) | no | 103 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3973 (p95) | no | 1027 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1008.5 (max) | no | 1992 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5009.6 (max) | **yes** | -1010 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 41148 (p95) | **yes** | -36148 |

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

Machine output: `reports/phase-volume/S3-write_signoff-fleet.json`
