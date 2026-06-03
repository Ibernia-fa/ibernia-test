# Volume sign-off — S4-write

Generated: 2026-06-03T20:19:51.905Z

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
| Clients (write) | 400 | 280 | FAIL |
| Plans (write) | 3200 | 2166 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_20c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 4634 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 3698 | n/a |
| `POST /api/v1/cashflows` | 14/20 | 6/20 | advisor-01, advisor-03, advisor-04, advisor-11, advisor-16, advisor-17 | 13 | 923 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1967 | n/a |

**Shards all required metrics under budget:** 14/20 · **Any over:** 6/20 · **Failed:** advisor-01, advisor-03, advisor-04, advisor-11, advisor-16, advisor-17

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 273 (p95) | no | 3727 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 366 (p95) | no | 4634 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 841.7 (max) | no | 2158 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3911.6 (max) | no | 88 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 48261 (p95) | **yes** | -43261 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 288 (p95) | no | 3712 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 295 (p95) | no | 4705 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 851.7 (max) | no | 2148 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4770.7 (max) | **yes** | -771 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 35879 (p95) | **yes** | -30879 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 259 (p95) | no | 3741 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 249 (p95) | no | 4751 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 884.9 (max) | no | 2115 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3970.6 (max) | no | 29 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 47828 (p95) | **yes** | -42828 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 269 (p95) | no | 3731 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 262 (p95) | no | 4738 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 880.1 (max) | no | 2120 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4910.7 (max) | **yes** | -911 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 42640 (p95) | **yes** | -37640 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 267 (p95) | no | 3733 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 253 (p95) | no | 4747 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 798.9 (max) | no | 2201 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4413.2 (max) | **yes** | -413 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 46232 (p95) | **yes** | -41232 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 280 (p95) | no | 3720 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 273 (p95) | no | 4727 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 772.3 (max) | no | 2228 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3971 (max) | no | 29 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43727 (p95) | **yes** | -38727 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 256 (p95) | no | 3744 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 267 (p95) | no | 4733 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 913 (max) | no | 2087 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3956.4 (max) | no | 44 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 45787 (p95) | **yes** | -40787 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 277 (p95) | no | 3723 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 288 (p95) | no | 4712 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 860.8 (max) | no | 2139 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3987.4 (max) | no | 13 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43368 (p95) | **yes** | -38368 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 265 (p95) | no | 3735 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 268 (p95) | no | 4732 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1018.1 (max) | no | 1982 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3894.4 (max) | no | 106 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 47396 (p95) | **yes** | -42396 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 262 (p95) | no | 3738 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 269 (p95) | no | 4731 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1002.7 (max) | no | 1997 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3880.8 (max) | no | 119 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 47430 (p95) | **yes** | -42430 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 271 (p95) | no | 3729 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 264 (p95) | no | 4736 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 960.5 (max) | no | 2040 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3931.8 (max) | no | 68 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 37178 (p95) | **yes** | -32178 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 263 (p95) | no | 3737 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 291 (p95) | no | 4709 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 960.2 (max) | no | 2040 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4923.4 (max) | **yes** | -923 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 41963 (p95) | **yes** | -36963 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 281 (p95) | no | 3719 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 289 (p95) | no | 4711 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 887.1 (max) | no | 2113 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3901.3 (max) | no | 99 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 37121 (p95) | **yes** | -32121 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 302 (p95) | no | 3698 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 276 (p95) | no | 4724 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1032.5 (max) | no | 1967 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3964 (max) | no | 36 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43209 (p95) | **yes** | -38209 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 295 (p95) | no | 3705 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 275 (p95) | no | 4725 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 875.4 (max) | no | 2125 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3941.6 (max) | no | 58 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43647 (p95) | **yes** | -38647 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 253 (p95) | no | 3747 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 283 (p95) | no | 4717 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1029.5 (max) | no | 1970 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3986.2 (max) | no | 14 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 38466 (p95) | **yes** | -33466 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 254 (p95) | no | 3746 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 250 (p95) | no | 4750 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 866.7 (max) | no | 2133 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4411.3 (max) | **yes** | -411 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 47963 (p95) | **yes** | -42963 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 280 (p95) | no | 3720 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 266 (p95) | no | 4734 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 848.4 (max) | no | 2152 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4503.3 (max) | **yes** | -503 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 37505 (p95) | **yes** | -32505 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 251 (p95) | no | 3749 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 262 (p95) | no | 4738 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 839.1 (max) | no | 2161 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3947.6 (max) | no | 52 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 42805 (p95) | **yes** | -37805 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 290 (p95) | no | 3710 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 309 (p95) | no | 4691 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 885.4 (max) | no | 2115 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3898.3 (max) | no | 102 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 36530 (p95) | **yes** | -31530 |

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
