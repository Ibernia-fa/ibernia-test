# Volume sign-off — S1-write-realistic-20260602-1727

Generated: 2026-06-02T12:29:08.163Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S1-write-realistic-20260602-1727` |
| Phase A (write) | `S1-write-realistic-20260602-1727` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 20 | 19 | FAIL |
| Plans (write) | 20 | 19 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_1c_1p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `GET /api/v1/Reports/{cashflowId}` | 20/20 | 0/20 | — | 1190 | n/a |
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 3000 | n/a |
| `journey_create_client_duration` | 19/20 | 1/20 | advisor-16 | 0 | 6000 |
| `POST /api/v1/cashflows` | 10/20 | 10/20 | advisor-03, advisor-04, advisor-05, advisor-06, advisor-09, advisor-11, advisor-13, advisor-14, advisor-18, advisor-19 | 64 | 4965 |
| `POST /api/v1/Clients` | 19/20 | 1/20 | advisor-02 | 1720 | 9524 |

**Shards all required metrics under budget:** 8/20 · **Any over:** 12/20 · **Failed:** advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-09, advisor-11, advisor-13, advisor-14, advisor-16, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 461.6 (max (retro)) | no | 2538 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 530.2 (max (retro)) | no | 3470 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 391.3 (max (retro)) | no | 2609 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 275.2 (max (retro)) | no | 2725 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 525.9 (max (retro)) | no | 3474 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 377.3 (max (retro)) | no | 2623 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 12524.1 (max (retro)) | **yes** | -9524 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3891.4 (max (retro)) | no | 109 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 386.6 (max (retro)) | no | 2613 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 4000 (max (retro)) | no | 0 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1279.6 (max (retro)) | no | 1720 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5107.2 (max (retro)) | **yes** | -1107 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 403.9 (max (retro)) | no | 2596 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 4000 (max (retro)) | no | 0 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 459.7 (max (retro)) | no | 2540 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 8964.5 (max (retro)) | **yes** | -4964 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 394.4 (max (retro)) | no | 2606 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 442.8 (max (retro)) | no | 2557 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6954 (max (retro)) | **yes** | -2954 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 367.6 (max (retro)) | no | 2632 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 484.4 (max (retro)) | no | 2516 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4832.2 (max (retro)) | **yes** | -832 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 408.1 (max (retro)) | no | 2592 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 444.2 (max (retro)) | no | 2556 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3824.9 (max (retro)) | no | 175 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 962.5 (max (retro)) | no | 2037 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 724.4 (max (retro)) | no | 2276 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 2939.8 (max (retro)) | no | 1060 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1142.3 (max (retro)) | no | 1858 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 474.4 (max (retro)) | no | 2526 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5331.1 (max (retro)) | **yes** | -1331 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 962.7 (max (retro)) | no | 2037 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 457.5 (max (retro)) | no | 2543 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3363.9 (max (retro)) | no | 636 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1810.5 (max (retro)) | no | 1190 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 448.1 (max (retro)) | no | 2552 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6068.3 (max (retro)) | **yes** | -2068 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 405.1 (max (retro)) | no | 2595 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 479.8 (max (retro)) | no | 2520 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3129.2 (max (retro)) | no | 871 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1052.9 (max (retro)) | no | 1947 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 489.3 (max (retro)) | no | 2511 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4156.1 (max (retro)) | **yes** | -156 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 396.9 (max (retro)) | no | 2603 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 313.9 (max (retro)) | no | 2686 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4840.5 (max (retro)) | **yes** | -841 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 934.7 (max (retro)) | no | 2065 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 450.8 (max (retro)) | no | 2549 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 2515.6 (max (retro)) | no | 1484 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1045.8 (max (retro)) | no | 1954 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 10000 (max (retro)) | **yes** | -6000 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 272.6 (max (retro)) | no | 2727 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3049.3 (max (retro)) | no | 951 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 579.6 (max (retro)) | no | 2420 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 427.7 (max (retro)) | no | 2572 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3935.6 (max (retro)) | no | 64 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1020.9 (max (retro)) | no | 1979 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 452.1 (max (retro)) | no | 2548 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4942.9 (max (retro)) | **yes** | -943 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 912.6 (max (retro)) | no | 2087 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 450.4 (max (retro)) | no | 2550 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5015.1 (max (retro)) | **yes** | -1015 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1068.6 (max (retro)) | no | 1931 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |

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

- Phase A fleet gate: **PASS** (passed 20, failed 0)

## Recommendation

**NO-GO (or incomplete)** — Review budget tables and data gates before S2.

---

Machine output: `reports/phase-volume/S1-write-realistic-20260602-1727_signoff-fleet.json`
