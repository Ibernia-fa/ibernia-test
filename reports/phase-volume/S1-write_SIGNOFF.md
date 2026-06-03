# Volume sign-off — S1-write

Generated: 2026-06-03T02:35:21.979Z

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
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 18 | n/a |
| `journey_create_client_duration` | 19/20 | 1/20 | advisor-10 | 5 | 15 |
| `POST /api/v1/cashflows` | 14/20 | 6/20 | advisor-08, advisor-10, advisor-13, advisor-14, advisor-17, advisor-19 | 4 | 980 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1969 | n/a |

**Shards all required metrics under budget:** 14/20 · **Any over:** 6/20 · **Failed:** advisor-08, advisor-10, advisor-13, advisor-14, advisor-17, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 885 (p95) | no | 3115 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 619 (p95) | no | 4381 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 265.9 (max) | no | 2734 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 582.3 (max) | no | 3418 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 12918 (p95) | **yes** | -9918 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 989 (p95) | no | 3011 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 527 (p95) | no | 4473 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 295.7 (max) | no | 2704 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 525.2 (max) | no | 3475 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 11721 (p95) | **yes** | -8721 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 869 (p95) | no | 3131 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 514 (p95) | no | 4486 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 259.5 (max) | no | 2741 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 513.3 (max) | no | 3487 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 18981 (p95) | **yes** | -15981 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 833 (p95) | no | 3167 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 496 (p95) | no | 4504 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 254.6 (max) | no | 2745 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 494.9 (max) | no | 3505 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 19245 (p95) | **yes** | -16245 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 2056 (p95) | no | 1944 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3026 (p95) | no | 1974 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 283.7 (max) | no | 2716 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 3024.9 (max) | no | 975 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 35958 (p95) | **yes** | -32958 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 2071 (p95) | no | 1929 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3022 (p95) | no | 1978 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 285.8 (max) | no | 2714 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 3019.9 (max) | no | 980 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 35073 (p95) | **yes** | -32073 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3046 (p95) | no | 954 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3958 (p95) | no | 1042 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 989.5 (max) | no | 2011 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 3954.9 (max) | no | 45 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 33158 (p95) | **yes** | -30158 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3062 (p95) | no | 938 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3960 (p95) | no | 1040 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1005.3 (max) | no | 1995 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 3957.6 (max) | no | 42 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 33090 (p95) | **yes** | -30090 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 3995 (p95) | no | 5 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4964 (p95) | no | 36 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1028.1 (max) | no | 1972 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4963 (max) | **yes** | -963 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31100 (p95) | **yes** | -28100 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3991 (p95) | no | 9 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4001 (p95) | no | 999 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 957 (max) | no | 2043 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 3995.8 (max) | no | 4 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 32610 (p95) | **yes** | -29610 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 4015 (p95) | **yes** | -15 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4036 (p95) | no | 964 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1009.3 (max) | no | 1991 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4032.2 (max) | **yes** | -32 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31142 (p95) | **yes** | -28142 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2031 (p95) | no | 1969 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1930 (p95) | no | 3070 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 965.8 (max) | no | 2034 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 1924.4 (max) | no | 2076 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 35225 (p95) | **yes** | -32225 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3045 (p95) | no | 955 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2953 (p95) | no | 2047 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 991.9 (max) | no | 2008 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 2950 (max) | no | 1050 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 33102 (p95) | **yes** | -30102 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3962 (p95) | no | 38 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4007 (p95) | no | 993 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 958 (max) | no | 2042 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4004.2 (max) | **yes** | -4 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31158 (p95) | **yes** | -28158 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3995 (p95) | no | 5 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4981 (p95) | no | 19 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1030.6 (max) | no | 1969 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4978.1 (max) | **yes** | -978 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 30573 (p95) | **yes** | -27573 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2049 (p95) | no | 1951 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2984 (p95) | no | 2016 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 962.4 (max) | no | 2038 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 2979.9 (max) | no | 1020 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 32097 (p95) | **yes** | -29097 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3046 (p95) | no | 954 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3920 (p95) | no | 1080 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 999.4 (max) | no | 2001 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 3918.1 (max) | no | 82 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31177 (p95) | **yes** | -28177 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 3981 (p95) | no | 19 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4982 (p95) | no | 18 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1029.3 (max) | no | 1971 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4980.2 (max) | **yes** | -980 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 30189 (p95) | **yes** | -27189 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 2066 (p95) | no | 1934 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2995 (p95) | no | 2005 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 274 (max) | no | 2726 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 2991.5 (max) | no | 1009 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 34088 (p95) | **yes** | -31088 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3024 (p95) | no | 976 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4928 (p95) | no | 72 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 983.1 (max) | no | 2017 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4926.6 (max) | **yes** | -927 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31134 (p95) | **yes** | -28134 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 10783 |
| `GET /api/v1/cashflows/{cashflowId}` | 16/20 | 4/20 | advisor-11, advisor-13, advisor-16, advisor-19 | 1285 | 16440 |
| `GET /api/v1/client/{clientId}/cashflows` | 15/20 | 5/20 | advisor-03, advisor-05, advisor-09, advisor-12, advisor-15 | 1385 | 17119 |
| `GET /api/v1/Clients/{advisorId}/all` | 19/20 | 1/20 | advisor-02 | 579 | 16730 |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 2207 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 260 (p95) | no | 2240 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 2500 | — | 10791 (p95) | **yes** | -8291 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 611.8 (max) | no | 1888 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 451.1 (max) | no | 2049 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1256.6 (max) | no | 1743 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 270 (p95) | no | 2230 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 2500 | — | 10879 (p95) | **yes** | -8379 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 444.3 (max) | no | 2056 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 301.9 (max) | no | 2198 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 945.3 (max) | no | 2055 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 269 (p95) | no | 2231 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 2500 | — | 11823 (p95) | **yes** | -9323 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 19229.6 (max) | **yes** | -16730 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 506.6 (max) | no | 1993 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 563.8 (max) | no | 2436 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 2500 | — | 12589 (p95) | **yes** | -10089 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 471.1 (max) | no | 2029 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 19240.2 (max) | **yes** | -16740 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 967.4 (max) | no | 2033 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 268 (p95) | no | 2232 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 2500 | — | 10868 (p95) | **yes** | -8368 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 651.3 (max) | no | 1849 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 315.3 (max) | no | 2185 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1019 (max) | no | 1981 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 256 (p95) | no | 2244 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 2500 | — | 10791 (p95) | **yes** | -8291 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 275 (max) | no | 2225 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 19275.6 (max) | **yes** | -16776 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1195.4 (max) | no | 1805 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 263 (p95) | no | 2237 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 2500 | — | 10609 (p95) | **yes** | -8109 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 315.9 (max) | no | 2184 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 654.1 (max) | no | 1846 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 744 (max) | no | 2256 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 2500 | — | 11775 (p95) | **yes** | -9275 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 757.5 (max) | no | 1743 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 777.9 (max) | no | 1722 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 391.6 (max) | no | 2608 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 260 (p95) | no | 2240 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 2500 | — | 12580 (p95) | **yes** | -10080 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 573 (max) | no | 1927 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 420.5 (max) | no | 2080 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 392.4 (max) | no | 2608 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 269 (p95) | no | 2231 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 2500 | — | 12997 (p95) | **yes** | -10497 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 1920.9 (max) | no | 579 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 19618.5 (max) | **yes** | -17118 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 633.4 (max) | no | 2367 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 2500 | — | 13283 (p95) | **yes** | -10783 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 595.9 (max) | no | 1904 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 283.7 (max) | no | 2216 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1715 (max) | no | 1285 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 267 (p95) | no | 2233 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 2500 | — | 11874 (p95) | **yes** | -9374 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 402.1 (max) | no | 2098 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 326.3 (max) | no | 2174 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 19241.3 (max) | **yes** | -16241 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 293 (p95) | no | 2207 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 2500 | — | 13104 (p95) | **yes** | -10604 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 428.8 (max) | no | 2071 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 19268.4 (max) | **yes** | -16768 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1530.2 (max) | no | 1470 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 285 (p95) | no | 2215 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 2500 | — | 12233 (p95) | **yes** | -9733 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 396.5 (max) | no | 2104 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 725.3 (max) | no | 1775 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 19413.2 (max) | **yes** | -16413 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 263 (p95) | no | 2237 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 2500 | — | 11235 (p95) | **yes** | -8735 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 597 (max) | no | 1903 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 815.6 (max) | no | 1684 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 711.3 (max) | no | 2289 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 258 (p95) | no | 2242 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 2500 | — | 10842 (p95) | **yes** | -8342 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 790 (max) | no | 1710 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 19579.9 (max) | **yes** | -17080 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 509.8 (max) | no | 2490 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 265 (p95) | no | 2235 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 2500 | — | 12151 (p95) | **yes** | -9651 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 593.3 (max) | no | 1907 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 870.7 (max) | no | 1629 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 19269 (max) | **yes** | -16269 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 286 (p95) | no | 2214 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 2500 | — | 12602 (p95) | **yes** | -10102 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 446 (max) | no | 2054 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 441 (max) | no | 2059 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 548.5 (max) | no | 2451 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 266 (p95) | no | 2234 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 2500 | — | 9182 (p95) | **yes** | -6682 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 654.9 (max) | no | 1845 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 633.5 (max) | no | 1866 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 1109 (max) | no | 1891 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 271 (p95) | no | 2229 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 2500 | — | 9958 (p95) | **yes** | -7458 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 7500 | 285.2 (max) | no | 2215 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 7500 | 1114.7 (max) | no | 1385 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 9000 | 19439.8 (max) | **yes** | -16440 |

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
