# Volume sign-off — S4-write

Generated: 2026-06-04T06:39:33.131Z

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
| Clients (write) | 400 | 93 | FAIL |
| Plans (write) | 3200 | 744 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_20c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 19/20 | 0/20 | — | 4711 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 2914 | n/a |
| `POST /api/v1/cashflows` | 19/20 | 0/20 | — | 3706 | n/a |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1335 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Quota breach summary

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 441 (p95) | no | 3559 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 253 (p95) | no | 4747 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 437.8 (max) | no | 2562 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 258.7 (max) | no | 3741 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 431 (p95) | no | 3569 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 267 (p95) | no | 4733 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 442.6 (max) | no | 2557 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 274.2 (max) | no | 3726 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 443 (p95) | no | 3557 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 264 (p95) | no | 4736 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 441.4 (max) | no | 2559 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 265.7 (max) | no | 3734 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 437 (p95) | no | 3563 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 258 (p95) | no | 4742 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 437.2 (max) | no | 2563 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 266 (max) | no | 3734 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 429 (p95) | no | 3571 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 277 (p95) | no | 4723 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 486.7 (max) | no | 2513 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 282.8 (max) | no | 3717 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 461 (p95) | no | 3539 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 261 (p95) | no | 4739 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 454.9 (max) | no | 2545 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 268.8 (max) | no | 3731 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 442 (p95) | no | 3558 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 264 (p95) | no | 4736 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 447.8 (max) | no | 2552 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 268.3 (max) | no | 3732 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 453 (p95) | no | 3547 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 272 (p95) | no | 4728 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 461.8 (max) | no | 2538 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 286.5 (max) | no | 3713 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 483 (p95) | no | 3517 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 286 (p95) | no | 4714 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1664.6 (max) | no | 1335 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 294.5 (max) | no | 3706 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 440 (p95) | no | 3560 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 258 (p95) | no | 4742 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 437.5 (max) | no | 2562 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 254.4 (max) | no | 3746 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1086 (p95) | no | 2914 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 265 (p95) | no | 4735 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 516.4 (max) | no | 2484 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 265.4 (max) | no | 3735 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 439 (p95) | no | 3561 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 268 (p95) | no | 4732 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 435.8 (max) | no | 2564 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 265.9 (max) | no | 3734 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 428 (p95) | no | 3572 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 260 (p95) | no | 4740 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 442.8 (max) | no | 2557 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 258.4 (max) | no | 3742 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 438 (p95) | no | 3562 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 286 (p95) | no | 4714 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 467.3 (max) | no | 2533 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 282.8 (max) | no | 3717 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 447 (p95) | no | 3553 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 289 (p95) | no | 4711 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 479.2 (max) | no | 2521 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 286.3 (max) | no | 3714 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 263 (p95) | no | 3737 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 271 (p95) | no | 4729 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 432.9 (max) | no | 2567 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 268.1 (max) | no | 3732 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 452 (p95) | no | 3548 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 469.8 (max) | no | 2530 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 284 (p95) | no | 3716 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 275 (p95) | no | 4725 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 450.3 (max) | no | 2550 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 271.8 (max) | no | 3728 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 455 (p95) | no | 3545 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 269 (p95) | no | 4731 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 580.3 (max) | no | 2420 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 291.7 (max) | no | 3708 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 446 (p95) | no | 3554 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 262 (p95) | no | 4738 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 443.7 (max) | no | 2556 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 258.6 (max) | no | 3741 |

## Phase B — read profile

_N/A — no sign-off shard data._

## Quota breach at a glance

### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Quota breach — Phase B read

_No sign-off shard data — quota breach summary unavailable._

## Errors & runner

| Category | Value |
|----------|-------|
| Auth failure rate | not measured |
| Business failure rate | not measured |
| HTTP failure rate | not measured |
| Phase A k6 exit 0 | 20 |
| Phase A k6 exit 99 | 0 _(k6 thresholds, not functional fail)_ |

## Fleet custom SLO gate

- Phase A fleet gate: **PASS** (passed 0, failed 0)

## Recommendation

**NO-GO (or incomplete)** — Review budget tables and data gates before S2.

---

Machine output: `reports/phase-volume/S4-write_signoff-fleet.json`
