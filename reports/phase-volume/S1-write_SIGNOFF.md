# Volume sign-off — S1-write

Generated: 2026-06-03T15:15:36.725Z

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
| `journey_create_base_plan_duration` | 16/20 | 4/20 | advisor-07, advisor-10, advisor-12, advisor-15 | 937 | 1166 |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 236 | n/a |
| `POST /api/v1/cashflows` | 12/20 | 8/20 | advisor-02, advisor-06, advisor-07, advisor-08, advisor-10, advisor-11, advisor-12, advisor-15 | 8 | 2159 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 2010 | n/a |

**Shards all required metrics under budget:** 12/20 · **Any over:** 8/20 · **Failed:** advisor-02, advisor-06, advisor-07, advisor-08, advisor-10, advisor-11, advisor-12, advisor-15

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 971 (p95) | no | 3029 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 889 (p95) | no | 4111 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 337.1 (max) | no | 2663 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 887 (max) | no | 3113 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13191 (p95) | **yes** | -8191 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 895 (p95) | no | 3105 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 572 (p95) | no | 4428 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 274.3 (max) | no | 2726 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 562.7 (max) | no | 3437 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12381 (p95) | **yes** | -7381 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 1886 (p95) | no | 2114 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4063 (p95) | no | 937 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 290.7 (max) | no | 2709 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4052.5 (max) | **yes** | -53 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30124 (p95) | **yes** | -25124 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 1073 (p95) | no | 2927 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 604 (p95) | no | 4396 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 316.9 (max) | no | 2683 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 599 (max) | no | 3401 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33377 (p95) | **yes** | -28377 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 987 (p95) | no | 3013 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 963 (p95) | no | 4037 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 283.8 (max) | no | 2716 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 960.9 (max) | no | 3039 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 32296 (p95) | **yes** | -27296 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 2631 (p95) | no | 1369 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3093 (p95) | no | 1907 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 607.7 (max) | no | 2392 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3088.2 (max) | no | 912 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29776 (p95) | **yes** | -24776 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 1678 (p95) | no | 2322 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4041 (p95) | no | 959 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 565.1 (max) | no | 2435 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4031.5 (max) | **yes** | -31 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28639 (p95) | **yes** | -23639 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 1861 (p95) | no | 2139 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 6026 (p95) | **yes** | -1026 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 725.5 (max) | no | 2275 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 6018.2 (max) | **yes** | -2018 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27103 (p95) | **yes** | -22103 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2115 (p95) | no | 1885 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4013 (p95) | no | 987 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 939.1 (max) | no | 2061 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4002.9 (max) | **yes** | -3 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30108 (p95) | **yes** | -25108 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 1261 (p95) | no | 2739 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3035 (p95) | no | 1965 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 311 (max) | no | 2689 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3030.2 (max) | no | 970 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30638 (p95) | **yes** | -25638 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1187 (p95) | no | 2813 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 6023 (p95) | **yes** | -1023 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 314 (max) | no | 2686 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 6017.7 (max) | **yes** | -2018 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29025 (p95) | **yes** | -24025 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2624 (p95) | no | 1376 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4011 (p95) | no | 989 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 950.9 (max) | no | 2049 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4010 (max) | **yes** | -10 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28085 (p95) | **yes** | -23085 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 1783 (p95) | no | 2217 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 5593 (p95) | **yes** | -593 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 305 (max) | no | 2695 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5586.6 (max) | **yes** | -1587 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29812 (p95) | **yes** | -24812 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3764 (p95) | no | 236 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3994 (p95) | no | 1006 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 309.9 (max) | no | 2690 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3992.1 (max) | no | 8 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29203 (p95) | **yes** | -24203 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 962 (p95) | no | 3038 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2005 (p95) | no | 2995 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 282 (max) | no | 2718 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 1996.8 (max) | no | 2003 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 31413 (p95) | **yes** | -26413 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2098 (p95) | no | 1902 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 6166 (p95) | **yes** | -1166 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 989.8 (max) | no | 2010 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 6159.4 (max) | **yes** | -2159 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28320 (p95) | **yes** | -23320 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 1014 (p95) | no | 2986 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 925 (p95) | no | 4075 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 307.3 (max) | no | 2693 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 922.5 (max) | no | 3078 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 32557 (p95) | **yes** | -27557 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 2547 (p95) | no | 1453 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2979 (p95) | no | 2021 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 318.2 (max) | no | 2682 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2975.6 (max) | no | 1024 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33503 (p95) | **yes** | -28503 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 1388 (p95) | no | 2612 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2918 (p95) | no | 2082 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 314.5 (max) | no | 2685 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2912.8 (max) | no | 1087 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30721 (p95) | **yes** | -25721 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 1730 (p95) | no | 2270 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2686 (p95) | no | 2314 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 300.4 (max) | no | 2700 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2683.9 (max) | no | 1316 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30670 (p95) | **yes** | -25670 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 18/20 | 2/20 | advisor-05, advisor-08 | 88 | 261 |
| `GET /api/v1/cashflows/{cashflowId}` | 20/20 | 0/20 | — | 595 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 1584 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 19/20 | 1/20 | advisor-18 | 878 | 930 |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 2160 | n/a |

**Shards all required metrics under budget:** 17/20 · **Any over:** 3/20 · **Failed:** advisor-05, advisor-08, advisor-18

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 296 (p95) | no | 2204 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 12684 (p95) | no | 2316 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 390.3 (max) | no | 2110 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 523.1 (max) | no | 1977 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1588.9 (max) | no | 1411 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 253 (p95) | no | 2247 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 14912 (p95) | no | 88 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 332.9 (max) | no | 2167 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 691.6 (max) | no | 1808 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1437.2 (max) | no | 1563 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 274 (p95) | no | 2226 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 13568 (p95) | no | 1432 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 654 (max) | no | 1846 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 915.9 (max) | no | 1584 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1480.4 (max) | no | 1520 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 278 (p95) | no | 2222 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 12522 (p95) | no | 2478 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 677.5 (max) | no | 1822 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 491.6 (max) | no | 2008 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1361.4 (max) | no | 1639 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 340 (p95) | no | 2160 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 11900 (p95) | no | 3100 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 1141.3 (max) | no | 1359 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 681 (max) | no | 1819 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1171.5 (max) | no | 1829 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 282 (p95) | no | 2218 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 15126 (p95) | **yes** | -126 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 389.5 (max) | no | 2111 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 357 (max) | no | 2143 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1351.3 (max) | no | 1649 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 259 (p95) | no | 2241 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 13658 (p95) | no | 1342 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 646.4 (max) | no | 1854 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 331.9 (max) | no | 2168 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1441.4 (max) | no | 1559 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 256 (p95) | no | 2244 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 13929 (p95) | no | 1071 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 471.7 (max) | no | 2028 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 452.8 (max) | no | 2047 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1280.1 (max) | no | 1720 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 270 (p95) | no | 2230 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 15261 (p95) | **yes** | -261 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 674.8 (max) | no | 1825 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 333 (max) | no | 2167 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1325.6 (max) | no | 1674 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 281 (p95) | no | 2219 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 11751 (p95) | no | 3249 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 1621.7 (max) | no | 878 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 668.9 (max) | no | 1831 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1449.6 (max) | no | 1550 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 308 (p95) | no | 2192 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 11678 (p95) | no | 3322 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 376.3 (max) | no | 2124 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 339.6 (max) | no | 2160 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1316.8 (max) | no | 1683 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 283 (p95) | no | 2217 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 12405 (p95) | no | 2595 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 474 (max) | no | 2026 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 693.4 (max) | no | 1807 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1305.9 (max) | no | 1694 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 290 (p95) | no | 2210 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 11597 (p95) | no | 3403 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 459.9 (max) | no | 2040 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 347.7 (max) | no | 2152 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1402.8 (max) | no | 1597 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 270 (p95) | no | 2230 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 14462 (p95) | no | 538 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 476.2 (max) | no | 2024 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 315.7 (max) | no | 2184 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1410.4 (max) | no | 1590 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 331 (p95) | no | 2169 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 13076 (p95) | no | 1924 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 488 (max) | no | 2012 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 412.2 (max) | no | 2088 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1424.4 (max) | no | 1576 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 289 (p95) | no | 2211 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 10358 (p95) | no | 4642 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 390.1 (max) | no | 2110 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 474.2 (max) | no | 2026 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1746.2 (max) | no | 1254 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 259 (p95) | no | 2241 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 13595 (p95) | no | 1405 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 802.3 (max) | no | 1698 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 371.9 (max) | no | 2128 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1263.6 (max) | no | 1736 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 302 (p95) | no | 2198 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 10281 (p95) | no | 4719 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 362.9 (max) | no | 2137 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 825.9 (max) | no | 1674 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1607.7 (max) | no | 1392 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 309 (p95) | no | 2191 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 13372 (p95) | no | 1628 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 3430.1 (max) | **yes** | -930 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 641.1 (max) | no | 1859 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1384.5 (max) | no | 1616 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 310 (p95) | no | 2190 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 10319 (p95) | no | 4681 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 352.8 (max) | no | 2147 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 634.9 (max) | no | 1865 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2404.6 (max) | no | 595 |

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
