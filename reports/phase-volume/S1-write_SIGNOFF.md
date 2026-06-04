# Volume sign-off — S1-write

Generated: 2026-06-04T09:16:14.931Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S1-write` |
| Phase A (write) | `S1-write` |
| Phase B (read) | `S1-read` |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 20 | 20 | PASS |
| Plans (write) | 20 | 20 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

Phase B profile/manifest binding: `data/scenarios/profile_20u_1c_1p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 4420 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 3002 | n/a |
| `POST /api/v1/cashflows` | 20/20 | 0/20 | — | 3421 | n/a |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 2687 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Quota breach summary

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 881 (p95) | no | 3119 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 539 (p95) | no | 4461 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 284.8 (max) | no | 2715 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 522 (max) | no | 3478 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 9948 (p95) | **yes** | -4948 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 900 (p95) | no | 3100 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 516 (p95) | no | 4484 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 274.4 (max) | no | 2726 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 513.3 (max) | no | 3487 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12779 (p95) | **yes** | -7779 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 929 (p95) | no | 3071 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 537 (p95) | no | 4463 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 291 (max) | no | 2709 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 535.3 (max) | no | 3465 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13480 (p95) | **yes** | -8480 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 998 (p95) | no | 3002 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 580 (p95) | no | 4420 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 313.1 (max) | no | 2687 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 578.8 (max) | no | 3421 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13264 (p95) | **yes** | -8264 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 926 (p95) | no | 3074 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 525 (p95) | no | 4475 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 284.7 (max) | no | 2715 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 523.1 (max) | no | 3477 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12812 (p95) | **yes** | -7812 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 916 (p95) | no | 3084 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 572 (p95) | no | 4428 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 286.4 (max) | no | 2714 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 569.3 (max) | no | 3431 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12899 (p95) | **yes** | -7899 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 888 (p95) | no | 3112 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 536 (p95) | no | 4464 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 276.7 (max) | no | 2723 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 530.7 (max) | no | 3469 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12555 (p95) | **yes** | -7555 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 884 (p95) | no | 3116 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 506 (p95) | no | 4494 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 263.2 (max) | no | 2737 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 504.7 (max) | no | 3495 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12332 (p95) | **yes** | -7332 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 925 (p95) | no | 3075 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 544 (p95) | no | 4456 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 277.4 (max) | no | 2723 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 541.1 (max) | no | 3459 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13353 (p95) | **yes** | -8353 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 923 (p95) | no | 3077 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 537 (p95) | no | 4463 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 299.5 (max) | no | 2700 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 531.9 (max) | no | 3468 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14119 (p95) | **yes** | -9119 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 907 (p95) | no | 3093 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 530 (p95) | no | 4470 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 285.9 (max) | no | 2714 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 528.6 (max) | no | 3471 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14197 (p95) | **yes** | -9197 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 992 (p95) | no | 3008 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 550 (p95) | no | 4450 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 306.5 (max) | no | 2693 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 544.8 (max) | no | 3455 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 15524 (p95) | **yes** | -10524 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 938 (p95) | no | 3062 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 563 (p95) | no | 4437 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 282.4 (max) | no | 2718 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 560.2 (max) | no | 3440 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14946 (p95) | **yes** | -9946 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 910 (p95) | no | 3090 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 542 (p95) | no | 4458 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 280.2 (max) | no | 2720 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 540.8 (max) | no | 3459 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14465 (p95) | **yes** | -9465 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 951 (p95) | no | 3049 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 548 (p95) | no | 4452 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 285 (max) | no | 2715 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 546.7 (max) | no | 3453 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14820 (p95) | **yes** | -9820 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 975 (p95) | no | 3025 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 553 (p95) | no | 4447 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 302.2 (max) | no | 2698 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 550.3 (max) | no | 3450 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14407 (p95) | **yes** | -9407 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 897 (p95) | no | 3103 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 541 (p95) | no | 4459 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 274.1 (max) | no | 2726 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 538.5 (max) | no | 3462 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14062 (p95) | **yes** | -9062 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 929 (p95) | no | 3071 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 546 (p95) | no | 4454 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 289.5 (max) | no | 2710 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 540.6 (max) | no | 3459 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14084 (p95) | **yes** | -9084 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 908 (p95) | no | 3092 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 569 (p95) | no | 4431 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 276.8 (max) | no | 2723 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 568 (max) | no | 3432 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13671 (p95) | **yes** | -8671 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 952 (p95) | no | 3048 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 546 (p95) | no | 4454 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 286.1 (max) | no | 2714 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 545.2 (max) | no | 3455 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13637 (p95) | **yes** | -8637 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 18/20 | 2/20 | advisor-12, advisor-17 | 736 | 439 |
| `GET /api/v1/cashflows/{cashflowId}` | 19/20 | 1/20 | advisor-11 | 303 | 1271 |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 858 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 19/20 | 1/20 | advisor-15 | 1246 | 1077 |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 2175 | n/a |

**Shards all required metrics under budget:** 16/20 · **Any over:** 4/20 · **Failed:** advisor-11, advisor-12, advisor-15, advisor-17

### Quota breach summary

**Advisors over latency budget:** 4/20 · **All required metrics under budget:** 16/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| End-to-end advisor journey | 2 | 20 | advisor-12, advisor-17 | 439 |
| List all clients for advisor | 1 | 20 | advisor-15 | 1077 |
| Open cashflow/plan | 1 | 20 | advisor-11 | 1271 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-11 | User12@gmail.com | 1 | Open cashflow/plan |
| advisor-12 | User13@gmail.com | 1 | End-to-end advisor journey |
| advisor-15 | User16@gmail.com | 1 | List all clients for advisor |
| advisor-17 | User18@gmail.com | 1 | End-to-end advisor journey |

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 314 (p95) | no | 2186 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 9582 (p95) | no | 5418 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 694.3 (max) | no | 1806 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 328.9 (max) | no | 2171 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2131 (max) | no | 869 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 275 (p95) | no | 2225 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 10404 (p95) | no | 4596 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 307.9 (max) | no | 2192 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 333.4 (max) | no | 2167 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2697.3 (max) | no | 303 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 269 (p95) | no | 2231 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 12227 (p95) | no | 2773 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 321.9 (max) | no | 2178 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 319.9 (max) | no | 2180 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1385.9 (max) | no | 1614 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 295 (p95) | no | 2205 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 12074 (p95) | no | 2926 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 461.1 (max) | no | 2039 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1641.6 (max) | no | 858 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1492.8 (max) | no | 1507 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 283 (p95) | no | 2217 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 12776 (p95) | no | 2224 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 375.6 (max) | no | 2124 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 370.3 (max) | no | 2130 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1425.2 (max) | no | 1575 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 296 (p95) | no | 2204 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 11898 (p95) | no | 3102 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 474.1 (max) | no | 2026 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 336.7 (max) | no | 2163 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1559.9 (max) | no | 1440 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 299 (p95) | no | 2201 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 12167 (p95) | no | 2833 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 465.4 (max) | no | 2035 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 346.5 (max) | no | 2153 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1663.3 (max) | no | 1337 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 269 (p95) | no | 2231 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 12642 (p95) | no | 2358 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 365.2 (max) | no | 2135 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 564.1 (max) | no | 1936 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1183.1 (max) | no | 1817 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 14196 (p95) | no | 804 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 1254.1 (max) | no | 1246 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 314.7 (max) | no | 2185 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1415.6 (max) | no | 1584 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 275 (p95) | no | 2225 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 14264 (p95) | no | 736 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 486.5 (max) | no | 2014 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 477.1 (max) | no | 2023 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1206.9 (max) | no | 1793 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 325 (p95) | no | 2175 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 12046 (p95) | no | 2954 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 345 (max) | no | 2155 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 428.3 (max) | no | 2072 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2445.6 (max) | no | 554 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 284 (p95) | no | 2216 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 11590 (p95) | no | 3410 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 340.6 (max) | no | 2159 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 474.6 (max) | no | 2025 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 4271.2 (max) | **yes** | -1271 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 266 (p95) | no | 2234 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 15439 (p95) | **yes** | -439 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 472 (max) | no | 2028 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 343.7 (max) | no | 2156 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1926.2 (max) | no | 1074 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 261 (p95) | no | 2239 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 13234 (p95) | no | 1766 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 349.7 (max) | no | 2150 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 326.9 (max) | no | 2173 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1242.3 (max) | no | 1758 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 261 (p95) | no | 2239 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 13895 (p95) | no | 1105 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 1209.9 (max) | no | 1290 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 318.5 (max) | no | 2182 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1248.8 (max) | no | 1751 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 251 (p95) | no | 2249 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 9970 (p95) | no | 5030 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 3576.6 (max) | **yes** | -1077 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 433 (max) | no | 2067 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1361.5 (max) | no | 1639 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 283 (p95) | no | 2217 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 11561 (p95) | no | 3439 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 455.6 (max) | no | 2044 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 337.7 (max) | no | 2162 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1346.9 (max) | no | 1653 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 308 (p95) | no | 2192 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 15120 (p95) | **yes** | -120 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 715.8 (max) | no | 1784 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 440.1 (max) | no | 2060 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1455.4 (max) | no | 1545 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 285 (p95) | no | 2215 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 11483 (p95) | no | 3517 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 489.2 (max) | no | 2011 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 334.7 (max) | no | 2165 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1355 (max) | no | 1645 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 292 (p95) | no | 2208 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 11941 (p95) | no | 3059 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 436.1 (max) | no | 2064 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 501.9 (max) | no | 1998 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1219.1 (max) | no | 1781 |

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
- Phase B gate: _pending_

## Recommendation

**NO-GO (or incomplete)** — Review budget tables and data gates before S2.

---

Machine output: `reports/phase-volume/S1-write_signoff-fleet.json`
