# Volume sign-off — S4-write

Generated: 2026-06-03T18:56:34.727Z

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
| Clients (write) | 400 | 279 | FAIL |
| Plans (write) | 3200 | 2147 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_20c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 3178 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 3698 | n/a |
| `POST /api/v1/cashflows` | 16/20 | 4/20 | advisor-07, advisor-10, advisor-12, advisor-14 | 35 | 889 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1910 | n/a |

**Shards all required metrics under budget:** 16/20 · **Any over:** 4/20 · **Failed:** advisor-07, advisor-10, advisor-12, advisor-14

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 263 (p95) | no | 3737 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 240 (p95) | no | 4760 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 792.4 (max) | no | 2208 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3901.7 (max) | no | 98 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 47537 (p95) | **yes** | -42537 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 270 (p95) | no | 3730 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 268 (p95) | no | 4732 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 850.1 (max) | no | 2150 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3867.3 (max) | no | 133 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 35230 (p95) | **yes** | -30230 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 295 (p95) | no | 3705 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 293 (p95) | no | 4707 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 816.9 (max) | no | 2183 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3848.6 (max) | no | 151 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 35610 (p95) | **yes** | -30610 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 273 (p95) | no | 3727 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 274 (p95) | no | 4726 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 930 (max) | no | 2070 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3918.4 (max) | no | 82 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 47114 (p95) | **yes** | -42114 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 280 (p95) | no | 3720 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 273 (p95) | no | 4727 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1006.9 (max) | no | 1993 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3869.6 (max) | no | 130 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33393 (p95) | **yes** | -28393 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 291 (p95) | no | 3709 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 305 (p95) | no | 4695 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 844.2 (max) | no | 2156 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3925.9 (max) | no | 74 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43915 (p95) | **yes** | -38915 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 278 (p95) | no | 3722 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 286 (p95) | no | 4714 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 981.4 (max) | no | 2019 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3944.5 (max) | no | 55 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 45696 (p95) | **yes** | -40696 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 278 (p95) | no | 3722 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 262 (p95) | no | 4738 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 882.2 (max) | no | 2118 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4056.6 (max) | **yes** | -57 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 46784 (p95) | **yes** | -41784 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 287 (p95) | no | 3713 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 287 (p95) | no | 4713 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 984.2 (max) | no | 2016 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3942.8 (max) | no | 57 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 37803 (p95) | **yes** | -32803 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 284 (p95) | no | 3716 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 276 (p95) | no | 4724 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 820.9 (max) | no | 2179 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3965.1 (max) | no | 35 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33849 (p95) | **yes** | -28849 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 286 (p95) | no | 3714 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 272 (p95) | no | 4728 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 860.4 (max) | no | 2140 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4758.3 (max) | **yes** | -758 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43179 (p95) | **yes** | -38179 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 279 (p95) | no | 3721 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 273 (p95) | no | 4727 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 850.9 (max) | no | 2149 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3907.2 (max) | no | 93 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43861 (p95) | **yes** | -38861 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 277 (p95) | no | 3723 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 270 (p95) | no | 4730 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 891.8 (max) | no | 2108 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4888.8 (max) | **yes** | -889 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 44789 (p95) | **yes** | -39789 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 273 (p95) | no | 3727 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 256 (p95) | no | 4744 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 837 (max) | no | 2163 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3861.2 (max) | no | 139 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 34315 (p95) | **yes** | -29315 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 271 (p95) | no | 3729 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 281 (p95) | no | 4719 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 881.6 (max) | no | 2118 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4743.1 (max) | **yes** | -743 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33005 (p95) | **yes** | -28005 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 273 (p95) | no | 3727 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 272 (p95) | no | 4728 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1026.2 (max) | no | 1974 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3925.3 (max) | no | 75 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 42156 (p95) | **yes** | -37156 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 302 (p95) | no | 3698 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1822 (p95) | no | 3178 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1038.4 (max) | no | 1962 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3883.5 (max) | no | 116 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 48045 (p95) | **yes** | -43045 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 300 (p95) | no | 3700 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 278 (p95) | no | 4722 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 866.8 (max) | no | 2133 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3956.9 (max) | no | 43 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 45340 (p95) | **yes** | -40340 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 265 (p95) | no | 3735 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 269 (p95) | no | 4731 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1090 (max) | no | 1910 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3925.9 (max) | no | 74 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 38098 (p95) | **yes** | -33098 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 274 (p95) | no | 3726 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 262 (p95) | no | 4738 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 836.3 (max) | no | 2164 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3912 (max) | no | 88 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 44015 (p95) | **yes** | -39015 |

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
