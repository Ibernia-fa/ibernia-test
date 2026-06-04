# Volume sign-off — S4-write

Generated: 2026-06-04T19:11:05.800Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S4-write` |
| Phase A (write) | `S4-write` |
| Phase B (read) | `S4-read` |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 400 | 400 | PASS |
| Plans (write) | 3200 | 3200 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

Phase B profile/manifest binding: `data/scenarios/profile_20u_20c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 950 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 1039 | n/a |
| `POST /api/v1/cashflows` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 1018 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1580 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Quota breach summary

**Advisors over latency budget:** 20/20 · **All required metrics under budget:** 0/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create cashflow/plan API | 20 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | 1018 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-00 | User01@gmail.com | 1 | Create cashflow/plan API |
| advisor-01 | User02@gmail.com | 1 | Create cashflow/plan API |
| advisor-02 | User03@gmail.com | 1 | Create cashflow/plan API |
| advisor-03 | User04@gmail.com | 1 | Create cashflow/plan API |
| advisor-04 | User05@gmail.com | 1 | Create cashflow/plan API |
| advisor-05 | User06@gmail.com | 1 | Create cashflow/plan API |
| advisor-06 | User07@gmail.com | 1 | Create cashflow/plan API |
| advisor-07 | User08@gmail.com | 1 | Create cashflow/plan API |
| advisor-08 | User09@gmail.com | 1 | Create cashflow/plan API |
| advisor-09 | User10@gmail.com | 1 | Create cashflow/plan API |
| advisor-10 | User11@gmail.com | 1 | Create cashflow/plan API |
| advisor-11 | User12@gmail.com | 1 | Create cashflow/plan API |
| advisor-12 | User13@gmail.com | 1 | Create cashflow/plan API |
| advisor-13 | User14@gmail.com | 1 | Create cashflow/plan API |
| advisor-14 | User15@gmail.com | 1 | Create cashflow/plan API |
| advisor-15 | User16@gmail.com | 1 | Create cashflow/plan API |
| advisor-16 | User17@gmail.com | 1 | Create cashflow/plan API |
| advisor-17 | User18@gmail.com | 1 | Create cashflow/plan API |
| advisor-18 | User19@gmail.com | 1 | Create cashflow/plan API |
| advisor-19 | User20@gmail.com | 1 | Create cashflow/plan API |

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 1962 (p95) | no | 2038 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1497 (p95) | no | 3503 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 989.1 (max) | no | 2011 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4024 (max) | **yes** | -24 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23090 (p95) | **yes** | -18090 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 2031 (p95) | no | 1969 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2956 (p95) | no | 2044 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 983.2 (max) | no | 2017 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4050.9 (max) | **yes** | -51 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29074 (p95) | **yes** | -24074 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 1448 (p95) | no | 2552 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 607 (p95) | no | 4393 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 990.8 (max) | no | 2009 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4932 (max) | **yes** | -932 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14886 (p95) | **yes** | -9886 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 1308 (p95) | no | 2692 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1172 (p95) | no | 3828 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1040.9 (max) | no | 1959 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4975.4 (max) | **yes** | -975 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 18830 (p95) | **yes** | -13830 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 2079 (p95) | no | 1921 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4050 (p95) | no | 950 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1018.4 (max) | no | 1982 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4084.2 (max) | **yes** | -84 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23990 (p95) | **yes** | -18990 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 2371 (p95) | no | 1629 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1153 (p95) | no | 3847 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 988.7 (max) | no | 2011 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4973.3 (max) | **yes** | -973 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 18820 (p95) | **yes** | -13820 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 1911 (p95) | no | 2089 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 524 (p95) | no | 4476 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1010.4 (max) | no | 1990 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4123.9 (max) | **yes** | -124 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14839 (p95) | **yes** | -9839 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 957 (p95) | no | 3043 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 525 (p95) | no | 4475 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1067.4 (max) | no | 1933 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4917.8 (max) | **yes** | -918 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14374 (p95) | **yes** | -9374 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2058 (p95) | no | 1942 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 551 (p95) | no | 4449 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 990.8 (max) | no | 2009 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4928.5 (max) | **yes** | -928 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 16297 (p95) | **yes** | -11297 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 1974 (p95) | no | 2026 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1978 (p95) | no | 3022 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 965.2 (max) | no | 2035 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4082.9 (max) | **yes** | -83 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27032 (p95) | **yes** | -22032 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1816 (p95) | no | 2184 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 669 (p95) | no | 4331 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1037.7 (max) | no | 1962 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4094.8 (max) | **yes** | -95 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14421 (p95) | **yes** | -9421 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2961 (p95) | no | 1039 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1999 (p95) | no | 3001 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1420.4 (max) | no | 1580 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4938.5 (max) | **yes** | -939 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 24010 (p95) | **yes** | -19010 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 957 (p95) | no | 3043 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 530 (p95) | no | 4470 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1022.3 (max) | no | 1978 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4965 (max) | **yes** | -965 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 15165 (p95) | **yes** | -10165 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 1261 (p95) | no | 2739 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2024 (p95) | no | 2976 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 986.8 (max) | no | 2013 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4041 (max) | **yes** | -41 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21637 (p95) | **yes** | -16637 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 1267 (p95) | no | 2733 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1052 (p95) | no | 3948 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 962.8 (max) | no | 2037 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5018.3 (max) | **yes** | -1018 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 24989 (p95) | **yes** | -19989 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 991 (p95) | no | 3009 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 906 (p95) | no | 4094 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1018.2 (max) | no | 1982 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4085 (max) | **yes** | -85 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 20449 (p95) | **yes** | -15449 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 1374 (p95) | no | 2626 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 510 (p95) | no | 4490 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 965.2 (max) | no | 2035 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5004.1 (max) | **yes** | -1004 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14520 (p95) | **yes** | -9520 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 1232 (p95) | no | 2768 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 532 (p95) | no | 4468 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 970.7 (max) | no | 2029 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4001.6 (max) | **yes** | -2 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13843 (p95) | **yes** | -8843 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 1314 (p95) | no | 2686 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1141 (p95) | no | 3859 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 972.5 (max) | no | 2027 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4972.7 (max) | **yes** | -973 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27907 (p95) | **yes** | -22907 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 1984 (p95) | no | 2016 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 598 (p95) | no | 4402 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 966.7 (max) | no | 2033 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4104.7 (max) | **yes** | -105 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14440 (p95) | **yes** | -9440 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 20/20 | 0/20 | — | 5655 | n/a |
| `GET /api/v1/cashflows/{cashflowId}` | 20/20 | 0/20 | — | 2532 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 2012 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 20/20 | 0/20 | — | 1873 | n/a |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 1873 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Quota breach summary

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 476.2 (max (retro)) | no | 2024 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 6553 (max (retro)) | no | 8447 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 476.2 (max (retro)) | no | 2024 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 382.1 (max (retro)) | no | 2118 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 350.4 (max (retro)) | no | 2650 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 333.4 (max (retro)) | no | 2167 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 8042 (max (retro)) | no | 6958 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 333.4 (max (retro)) | no | 2167 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 408.2 (max (retro)) | no | 2092 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 307.8 (max (retro)) | no | 2692 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 627.1 (max (retro)) | no | 1873 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 7288 (max (retro)) | no | 7712 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 627.1 (max (retro)) | no | 1873 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 355.3 (max (retro)) | no | 2145 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 436.6 (max (retro)) | no | 2563 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 469.1 (max (retro)) | no | 2031 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 5883 (max (retro)) | no | 9117 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 469.1 (max (retro)) | no | 2031 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 319.2 (max (retro)) | no | 2181 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 342.7 (max (retro)) | no | 2657 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 467.5 (max (retro)) | no | 2032 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 6927 (max (retro)) | no | 8073 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 467.5 (max (retro)) | no | 2032 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 369.2 (max (retro)) | no | 2131 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 354.8 (max (retro)) | no | 2645 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 349.5 (max (retro)) | no | 2150 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 7477 (max (retro)) | no | 7523 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 349.5 (max (retro)) | no | 2150 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 319.5 (max (retro)) | no | 2181 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 310.3 (max (retro)) | no | 2690 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 351.8 (max (retro)) | no | 2148 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 5805 (max (retro)) | no | 9195 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 351.8 (max (retro)) | no | 2148 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 349 (max (retro)) | no | 2151 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 448.6 (max (retro)) | no | 2551 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 446.9 (max (retro)) | no | 2053 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 6021 (max (retro)) | no | 8979 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 446.9 (max (retro)) | no | 2053 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 350.3 (max (retro)) | no | 2150 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 428.4 (max (retro)) | no | 2572 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 572.3 (max (retro)) | no | 1928 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 8015 (max (retro)) | no | 6985 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 572.3 (max (retro)) | no | 1928 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 369.5 (max (retro)) | no | 2130 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 350.2 (max (retro)) | no | 2650 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 431.7 (max (retro)) | no | 2068 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 6617 (max (retro)) | no | 8383 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 431.7 (max (retro)) | no | 2068 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 330.9 (max (retro)) | no | 2169 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 442.6 (max (retro)) | no | 2557 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 470.8 (max (retro)) | no | 2029 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 5838 (max (retro)) | no | 9162 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 470.8 (max (retro)) | no | 2029 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 337 (max (retro)) | no | 2163 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 433.1 (max (retro)) | no | 2567 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 448.1 (max (retro)) | no | 2052 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 9345 (max (retro)) | no | 5655 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 448.1 (max (retro)) | no | 2052 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 375 (max (retro)) | no | 2125 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 325.3 (max (retro)) | no | 2675 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 476.2 (max (retro)) | no | 2024 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 6885 (max (retro)) | no | 8115 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 476.2 (max (retro)) | no | 2024 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 382.8 (max (retro)) | no | 2117 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 319.7 (max (retro)) | no | 2680 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 329.4 (max (retro)) | no | 2171 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 8869 (max (retro)) | no | 6131 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 329.4 (max (retro)) | no | 2171 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 434.6 (max (retro)) | no | 2065 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 468 (max (retro)) | no | 2532 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 339.1 (max (retro)) | no | 2161 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 9330 (max (retro)) | no | 5670 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 339.1 (max (retro)) | no | 2161 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 487.5 (max (retro)) | no | 2012 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 339.6 (max (retro)) | no | 2660 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 428.5 (max (retro)) | no | 2072 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 7458 (max (retro)) | no | 7542 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 428.5 (max (retro)) | no | 2072 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 445.4 (max (retro)) | no | 2055 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 361.7 (max (retro)) | no | 2638 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 453.7 (max (retro)) | no | 2046 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 7653 (max (retro)) | no | 7347 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 453.7 (max (retro)) | no | 2046 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 392.7 (max (retro)) | no | 2107 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 395.5 (max (retro)) | no | 2605 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 434 (max (retro)) | no | 2066 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 7564 (max (retro)) | no | 7436 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 434 (max (retro)) | no | 2066 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 408.2 (max (retro)) | no | 2092 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 374.6 (max (retro)) | no | 2625 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 325.6 (max (retro)) | no | 2174 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 6808 (max (retro)) | no | 8192 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 325.6 (max (retro)) | no | 2174 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 358.4 (max (retro)) | no | 2142 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 447.9 (max (retro)) | no | 2552 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 467.5 (max (retro)) | no | 2032 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 5495 (max (retro)) | no | 9505 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 467.5 (max (retro)) | no | 2032 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 317.2 (max (retro)) | no | 2183 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 406.3 (max (retro)) | no | 2594 |

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

Machine output: `reports/phase-volume/S4-write_signoff-fleet.json`
