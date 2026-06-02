# Volume sign-off — S1-write

Generated: 2026-06-02T18:20:18.247Z

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
| `GET /api/v1/Reports/{cashflowId}` | 20/20 | 0/20 | — | 1575 | n/a |
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 2000 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 1000 | n/a |
| `POST /api/v1/cashflows` | 4/20 | 16/20 | advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-19 | 38 | 2098 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1955 | n/a |

**Shards all required metrics under budget:** 4/20 · **Any over:** 16/20 · **Failed:** advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 304.7 (max (retro)) | no | 2695 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 612.4 (max (retro)) | no | 3388 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 458.4 (max (retro)) | no | 2542 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 268.7 (max (retro)) | no | 2731 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 642.7 (max (retro)) | no | 3357 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 589 (max (retro)) | no | 2411 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1014.1 (max (retro)) | no | 1986 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5091.4 (max (retro)) | **yes** | -1091 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 905.1 (max (retro)) | no | 2095 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 903 (max (retro)) | no | 2097 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4078.1 (max (retro)) | **yes** | -78 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1425.1 (max (retro)) | no | 1575 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1008.8 (max (retro)) | no | 1991 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5033.2 (max (retro)) | **yes** | -1033 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 398.6 (max (retro)) | no | 2601 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 929.3 (max (retro)) | no | 2071 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4994.9 (max (retro)) | **yes** | -995 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 617 (max (retro)) | no | 2383 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 929.9 (max (retro)) | no | 2070 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5007.4 (max (retro)) | **yes** | -1007 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 433.2 (max (retro)) | no | 2567 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 256 (max (retro)) | no | 2744 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3961.9 (max (retro)) | no | 38 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1071.2 (max (retro)) | no | 1929 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1002.8 (max (retro)) | no | 1997 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5076.7 (max (retro)) | **yes** | -1077 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 588.6 (max (retro)) | no | 2411 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 765.4 (max (retro)) | no | 2235 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6093 (max (retro)) | **yes** | -2093 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1021 (max (retro)) | no | 1979 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1013.6 (max (retro)) | no | 1986 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5040.5 (max (retro)) | **yes** | -1041 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1003.7 (max (retro)) | no | 1996 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 248.7 (max (retro)) | no | 2751 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5070.5 (max (retro)) | **yes** | -1070 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1068.9 (max (retro)) | no | 1931 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 774.7 (max (retro)) | no | 2225 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6098 (max (retro)) | **yes** | -2098 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 774.5 (max (retro)) | no | 2225 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1045.3 (max (retro)) | no | 1955 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4945.4 (max (retro)) | **yes** | -945 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 873.1 (max (retro)) | no | 2127 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 894.6 (max (retro)) | no | 2105 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6027.9 (max (retro)) | **yes** | -2028 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 876.4 (max (retro)) | no | 2124 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 897 (max (retro)) | no | 2103 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5978.7 (max (retro)) | **yes** | -1979 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1372.3 (max (retro)) | no | 1628 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1025.2 (max (retro)) | no | 1975 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5948.8 (max (retro)) | **yes** | -1949 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 408.2 (max (retro)) | no | 2592 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 272 (max (retro)) | no | 2728 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6067 (max (retro)) | **yes** | -2067 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 386.8 (max (retro)) | no | 2613 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 814 (max (retro)) | no | 2186 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3676.3 (max (retro)) | no | 324 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1018.7 (max (retro)) | no | 1981 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 924 (max (retro)) | no | 2076 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5010.6 (max (retro)) | **yes** | -1011 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 641.7 (max (retro)) | no | 2358 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 11290 |
| `GET /api/v1/cashflows/{cashflowId}` | 20/20 | 0/20 | — | 1017 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 466 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 20/20 | 0/20 | — | 1283 | n/a |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 2184 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 261 (p95) | no | 2239 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 2500 | — | 11163 (p95) | **yes** | -8663 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 469.6 (max) | no | 2030 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 2033.6 (max) | no | 466 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1624.6 (max) | no | 1375 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 301 (p95) | no | 2199 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 2500 | — | 12914 (p95) | **yes** | -10414 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 504.8 (max) | no | 1995 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 431.2 (max) | no | 2069 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1074.6 (max) | no | 1925 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 284 (p95) | no | 2216 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 2500 | — | 11916 (p95) | **yes** | -9416 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 454.9 (max) | no | 2045 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 305.9 (max) | no | 2194 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 539.6 (max) | no | 2460 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 276 (p95) | no | 2224 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 2500 | — | 12856 (p95) | **yes** | -10356 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 477.1 (max) | no | 2023 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 542.8 (max) | no | 1957 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1282 (max) | no | 1718 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 264 (p95) | no | 2236 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 2500 | — | 13117 (p95) | **yes** | -10617 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 484.4 (max) | no | 2016 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 725.5 (max) | no | 1775 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1342.1 (max) | no | 1658 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 2500 | — | 10116 (p95) | **yes** | -7616 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 470.8 (max) | no | 2029 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 476 (max) | no | 2024 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1757.1 (max) | no | 1243 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 264 (p95) | no | 2236 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 2500 | — | 13509 (p95) | **yes** | -11009 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 665.8 (max) | no | 1834 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 356.4 (max) | no | 2144 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1841.4 (max) | no | 1159 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 272 (p95) | no | 2228 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 2500 | — | 10873 (p95) | **yes** | -8373 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 1216.6 (max) | no | 1283 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 590.6 (max) | no | 1909 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1423.2 (max) | no | 1577 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 280 (p95) | no | 2220 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 2500 | — | 13790 (p95) | **yes** | -11290 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 462.5 (max) | no | 2037 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 493.9 (max) | no | 2006 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1657.5 (max) | no | 1343 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 316 (p95) | no | 2184 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 2500 | — | 12058 (p95) | **yes** | -9558 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 446.2 (max) | no | 2054 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 353 (max) | no | 2147 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1983 (max) | no | 1017 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 272 (p95) | no | 2228 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 2500 | — | 11678 (p95) | **yes** | -9178 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 866 (max) | no | 1634 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 682.3 (max) | no | 1818 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1624.9 (max) | no | 1375 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 312 (p95) | no | 2188 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 2500 | — | 12248 (p95) | **yes** | -9748 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 454.3 (max) | no | 2046 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 685 (max) | no | 1815 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1362.3 (max) | no | 1638 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 298 (p95) | no | 2202 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 2500 | — | 10313 (p95) | **yes** | -7813 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 470.2 (max) | no | 2030 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 740.1 (max) | no | 1760 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1308 (max) | no | 1692 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 2500 | — | 11490 (p95) | **yes** | -8990 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 541.2 (max) | no | 1959 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 666.7 (max) | no | 1833 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1036.5 (max) | no | 1964 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 257 (p95) | no | 2243 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 2500 | — | 10569 (p95) | **yes** | -8069 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 516.5 (max) | no | 1983 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 942.2 (max) | no | 1558 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 608.9 (max) | no | 2391 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 294 (p95) | no | 2206 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 2500 | — | 12644 (p95) | **yes** | -10144 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 641 (max) | no | 1859 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 590.1 (max) | no | 1910 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 607.3 (max) | no | 2393 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 302 (p95) | no | 2198 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 2500 | — | 12605 (p95) | **yes** | -10105 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 458.5 (max) | no | 2041 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 599 (max) | no | 1901 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1593.7 (max) | no | 1406 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 280 (p95) | no | 2220 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 2500 | — | 12445 (p95) | **yes** | -9945 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 489.7 (max) | no | 2010 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 717 (max) | no | 1783 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1761 (max) | no | 1239 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 275 (p95) | no | 2225 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 2500 | — | 13438 (p95) | **yes** | -10938 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 581 (max) | no | 1919 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 704.3 (max) | no | 1796 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 723.3 (max) | no | 2277 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 277 (p95) | no | 2223 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 2500 | — | 13432 (p95) | **yes** | -10932 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 429.7 (max) | no | 2070 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 335 (max) | no | 2165 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 953 (max) | no | 2047 |

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
