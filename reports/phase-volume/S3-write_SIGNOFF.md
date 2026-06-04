# Volume sign-off — S3-write

Generated: 2026-06-04T11:58:25.388Z

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
| Clients (write) | 200 | 106 | FAIL |
| Plans (write) | 800 | 424 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_10c_4p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 11/20 | 0/20 | — | 3209 | n/a |
| `journey_create_client_duration` | 6/20 | 5/20 | advisor-01, advisor-03, advisor-13, advisor-14, advisor-17 | 205 | 116670 |
| `POST /api/v1/cashflows` | 6/20 | 5/20 | advisor-03, advisor-09, advisor-11, advisor-13, advisor-17 | 1063 | 92720 |
| `POST /api/v1/Clients` | 4/20 | 7/20 | advisor-01, advisor-02, advisor-11, advisor-12, advisor-13, advisor-17, advisor-18 | 207 | 38430 |

**Shards all required metrics under budget:** 1/20 · **Any over:** 10/20 · **Failed:** advisor-01, advisor-02, advisor-03, advisor-09, advisor-11, advisor-12, advisor-13, advisor-14, advisor-17, advisor-18

### Quota breach summary

**Advisors over latency budget:** 10/20 · **All required metrics under budget:** 1/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create client API | 7 | 20 | advisor-01, advisor-02, advisor-11, advisor-12, advisor-13, advisor-17, advisor-18 | 38430 |
| Create cashflow/plan API | 5 | 20 | advisor-03, advisor-09, advisor-11, advisor-13, advisor-17 | 92720 |
| Create client (write step) | 5 | 20 | advisor-01, advisor-03, advisor-13, advisor-14, advisor-17 | 116670 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-01 | User02@gmail.com | 2 | Create client (write step); Create client API |
| advisor-02 | User03@gmail.com | 1 | Create client API |
| advisor-03 | User04@gmail.com | 2 | Create client (write step); Create cashflow/plan API |
| advisor-09 | User10@gmail.com | 1 | Create cashflow/plan API |
| advisor-11 | User12@gmail.com | 2 | Create client API; Create cashflow/plan API |
| advisor-12 | User13@gmail.com | 1 | Create client API |
| advisor-13 | User14@gmail.com | 3 | Create client (write step); Create client API; Create cashflow/plan API |
| advisor-14 | User15@gmail.com | 1 | Create client (write step) |
| advisor-17 | User18@gmail.com | 3 | Create client (write step); Create client API; Create cashflow/plan API |
| advisor-18 | User19@gmail.com | 1 | Create client API |

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 5030 (p95) | **yes** | -1030 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 706 (p95) | no | 4294 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 7940.4 (max) | **yes** | -4940 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2936.7 (max) | no | 1063 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 26303 (p95) | **yes** | -21303 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 1300 (p95) | no | 2700 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1791 (p95) | no | 3209 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 3333.9 (max) | **yes** | -334 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2911.2 (max) | no | 1089 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 31966 (p95) | **yes** | -26966 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 4527 (p95) | **yes** | -527 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 775 (p95) | no | 4225 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 2793.3 (max) | no | 207 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 13888 (max) | **yes** | -9888 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33868 (p95) | **yes** | -28868 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3271 (p95) | no | 729 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 695 (p95) | no | 4305 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 2468.4 (max) | no | 532 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 8021.7 (max) | **yes** | -4022 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 16724 (p95) | **yes** | -11724 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2763 (p95) | no | 1237 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 767 (p95) | no | 4233 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 4669.4 (max) | **yes** | -1669 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 35442.6 (max) | **yes** | -31443 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23552 (p95) | **yes** | -18552 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3795 (p95) | no | 205 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 873 (p95) | no | 4127 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 10369.2 (max) | **yes** | -7369 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2926.7 (max) | no | 1073 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 31018 (p95) | **yes** | -26018 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 5853 (p95) | **yes** | -1853 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1375 (p95) | no | 3625 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 16047.6 (max) | **yes** | -13048 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 17367.5 (max) | **yes** | -13367 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 120272 (p95) | **yes** | -115272 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 4279 (p95) | **yes** | -279 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 930 (p95) | no | 4070 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1718.9 (max) | no | 1281 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2732.5 (max) | no | 1268 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 106247 (p95) | **yes** | -101247 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 120670 (p95) | **yes** | -116670 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 691 (p95) | no | 4309 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 39688.7 (max) | **yes** | -36689 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 96719.5 (max) | **yes** | -92720 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 18315 (p95) | **yes** | -13315 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 2405 (p95) | no | 1595 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 986 (p95) | no | 4014 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 41429.8 (max) | **yes** | -38430 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2231.8 (max) | no | 1768 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 20533 (p95) | **yes** | -15533 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 2506 (p95) | no | 1494 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 685 (p95) | no | 4315 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 2655 (max) | no | 345 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2129.4 (max) | no | 1871 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 53045 (p95) | **yes** | -48045 |

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
