# Volume sign-off — S4-write

Generated: 2026-06-04T07:55:06.893Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S4-write` |
| Phase A (write) | `S4-write` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 400 | 0 | FAIL |
| Plans (write) | 3200 | 0 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_20c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_client_duration` | 20/20 | 0/20 | — | 3640 | n/a |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 2517 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Quota breach summary

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 276 (p95) | no | 3724 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 358.5 (max) | no | 2641 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 295 (p95) | no | 3705 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 327.8 (max) | no | 2672 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 325 (p95) | no | 3675 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 335.1 (max) | no | 2665 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 306 (p95) | no | 3694 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 323.9 (max) | no | 2676 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 360 (p95) | no | 3640 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 483.4 (max) | no | 2517 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 273 (p95) | no | 3727 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 289 (max) | no | 2711 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 334 (p95) | no | 3666 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 334.5 (max) | no | 2665 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 306 (p95) | no | 3694 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 304.6 (max) | no | 2695 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 291 (p95) | no | 3709 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 340.6 (max) | no | 2659 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 291 (p95) | no | 3709 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 469.6 (max) | no | 2530 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 291 (p95) | no | 3709 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 327.5 (max) | no | 2672 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 283 (p95) | no | 3717 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 301.7 (max) | no | 2698 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 298 (p95) | no | 3702 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 334.5 (max) | no | 2666 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 303 (p95) | no | 3697 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 317.6 (max) | no | 2682 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 288 (p95) | no | 3712 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 298 (max) | no | 2702 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 300 (p95) | no | 3700 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 310.5 (max) | no | 2690 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 358 (p95) | no | 3642 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 356.8 (max) | no | 2643 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 294 (p95) | no | 3706 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 311.1 (max) | no | 2689 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 331 (p95) | no | 3669 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 375.1 (max) | no | 2625 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 297 (p95) | no | 3703 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 305 (max) | no | 2695 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |

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

Machine output: `reports/phase-volume/S4-write_signoff-fleet.json`
