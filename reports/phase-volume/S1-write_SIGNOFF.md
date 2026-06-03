# Volume sign-off — S1-write

Generated: 2026-06-03T16:40:14.820Z

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
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 899 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 919 | n/a |
| `POST /api/v1/cashflows` | 10/20 | 10/20 | advisor-04, advisor-06, advisor-07, advisor-08, advisor-10, advisor-13, advisor-14, advisor-16, advisor-17, advisor-19 | 6 | 98 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1901 | n/a |

**Shards all required metrics under budget:** 10/20 · **Any over:** 10/20 · **Failed:** advisor-04, advisor-06, advisor-07, advisor-08, advisor-10, advisor-13, advisor-14, advisor-16, advisor-17, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 841 (p95) | no | 3159 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 541 (p95) | no | 4459 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 258.4 (max) | no | 2742 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 538.6 (max) | no | 3461 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 10170 (p95) | **yes** | -5170 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 880 (p95) | no | 3120 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 528 (p95) | no | 4472 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 260.7 (max) | no | 2739 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 526 (max) | no | 3474 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 10864 (p95) | **yes** | -5864 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 2109 (p95) | no | 1891 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2057 (p95) | no | 2943 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 288.2 (max) | no | 2712 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2055 (max) | no | 1945 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30311 (p95) | **yes** | -25311 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 2137 (p95) | no | 1863 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1972 (p95) | no | 3028 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 276 (max) | no | 2724 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 1965.7 (max) | no | 2034 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29377 (p95) | **yes** | -24377 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3006 (p95) | no | 994 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4078 (p95) | no | 922 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 992.2 (max) | no | 2008 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4074.7 (max) | **yes** | -75 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 26203 (p95) | **yes** | -21203 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 1008 (p95) | no | 2992 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2003 (p95) | no | 2997 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 268.9 (max) | no | 2731 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 1983.5 (max) | no | 2016 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 31384 (p95) | **yes** | -26384 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 2801 (p95) | no | 1199 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4101 (p95) | no | 899 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 714.1 (max) | no | 2286 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4097.5 (max) | **yes** | -97 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27279 (p95) | **yes** | -22279 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3081 (p95) | no | 919 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4015 (p95) | no | 985 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1037.9 (max) | no | 1962 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4007.1 (max) | **yes** | -7 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27338 (p95) | **yes** | -22338 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2847 (p95) | no | 1153 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4094 (p95) | no | 906 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 739.7 (max) | no | 2260 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4092.1 (max) | **yes** | -92 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27379 (p95) | **yes** | -22379 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 2112 (p95) | no | 1888 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4001 (p95) | no | 999 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 245 (max) | no | 2755 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3993.8 (max) | no | 6 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28328 (p95) | **yes** | -23328 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 2798 (p95) | no | 1202 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4019 (p95) | no | 981 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 703.9 (max) | no | 2296 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4017.3 (max) | **yes** | -17 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28350 (p95) | **yes** | -23350 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2092 (p95) | no | 1908 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3935 (p95) | no | 1065 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 258.6 (max) | no | 2741 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3928.4 (max) | no | 72 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28326 (p95) | **yes** | -23326 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 2133 (p95) | no | 1867 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3960 (p95) | no | 1040 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 248.4 (max) | no | 2752 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3953 (max) | no | 47 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28345 (p95) | **yes** | -23345 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 2113 (p95) | no | 1887 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4012 (p95) | no | 988 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 257.1 (max) | no | 2743 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4006.1 (max) | **yes** | -6 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28292 (p95) | **yes** | -23292 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3032 (p95) | no | 968 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4059 (p95) | no | 941 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1099 (max) | no | 1901 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4051.4 (max) | **yes** | -51 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 26954 (p95) | **yes** | -21954 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 991 (p95) | no | 3009 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2004 (p95) | no | 2996 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 280.8 (max) | no | 2719 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2000.1 (max) | no | 2000 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 31380 (p95) | **yes** | -26380 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3063 (p95) | no | 937 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4032 (p95) | no | 968 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1094.8 (max) | no | 1905 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4023 (max) | **yes** | -23 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27228 (p95) | **yes** | -22228 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 2107 (p95) | no | 1893 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4008 (p95) | no | 992 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 273.2 (max) | no | 2727 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4007.5 (max) | **yes** | -7 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29372 (p95) | **yes** | -24372 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 948 (p95) | no | 3052 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2042 (p95) | no | 2958 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 278.2 (max) | no | 2722 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2038.1 (max) | no | 1962 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29340 (p95) | **yes** | -24340 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 2130 (p95) | no | 1870 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4016 (p95) | no | 984 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 265 (max) | no | 2735 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4008.4 (max) | **yes** | -8 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29312 (p95) | **yes** | -24312 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 17/20 | 3/20 | advisor-00, advisor-10, advisor-13 | 444 | 829 |
| `GET /api/v1/cashflows/{cashflowId}` | 20/20 | 0/20 | — | 465 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 124 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 17/20 | 3/20 | advisor-03, advisor-07, advisor-17 | 326 | 1280 |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 2130 | n/a |

**Shards all required metrics under budget:** 14/20 · **Any over:** 6/20 · **Failed:** advisor-00, advisor-03, advisor-07, advisor-10, advisor-13, advisor-17

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 328 (p95) | no | 2172 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 15808 (p95) | **yes** | -808 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 689.2 (max) | no | 1811 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 761.5 (max) | no | 1738 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2275.7 (max) | no | 724 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 320 (p95) | no | 2180 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 14036 (p95) | no | 964 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 530.6 (max) | no | 1969 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 465.3 (max) | no | 2035 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1867.1 (max) | no | 1133 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 310 (p95) | no | 2190 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 12722 (p95) | no | 2278 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 778 (max) | no | 1722 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1846.9 (max) | no | 653 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1780.3 (max) | no | 1220 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 357 (p95) | no | 2143 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 10807 (p95) | no | 4193 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 2802.3 (max) | **yes** | -302 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 430.8 (max) | no | 2069 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2186.8 (max) | no | 813 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 333 (p95) | no | 2167 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 11986 (p95) | no | 3014 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 2148.4 (max) | no | 352 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1441.3 (max) | no | 1059 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2056.7 (max) | no | 943 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 312 (p95) | no | 2188 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 14556 (p95) | no | 444 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 2174 (max) | no | 326 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1958.8 (max) | no | 541 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1807.8 (max) | no | 1192 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 323 (p95) | no | 2177 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 12140 (p95) | no | 2860 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 479.7 (max) | no | 2020 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 494.4 (max) | no | 2006 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2456.5 (max) | no | 543 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 298 (p95) | no | 2202 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 12303 (p95) | no | 2697 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 3779.5 (max) | **yes** | -1280 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 433.5 (max) | no | 2066 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2334 (max) | no | 666 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 326 (p95) | no | 2174 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 11967 (p95) | no | 3033 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 436 (max) | no | 2064 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 579.9 (max) | no | 1920 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1634.4 (max) | no | 1366 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 315 (p95) | no | 2185 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 11612 (p95) | no | 3388 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 425.5 (max) | no | 2074 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 710 (max) | no | 1790 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1772.6 (max) | no | 1227 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 336 (p95) | no | 2164 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 15829 (p95) | **yes** | -829 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 2117.4 (max) | no | 383 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 417.1 (max) | no | 2083 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2159.4 (max) | no | 841 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 306 (p95) | no | 2194 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 13314 (p95) | no | 1686 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 2060.3 (max) | no | 440 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 422.8 (max) | no | 2077 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2436.6 (max) | no | 563 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 329 (p95) | no | 2171 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 13135 (p95) | no | 1865 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 724.2 (max) | no | 1776 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 552.5 (max) | no | 1948 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1701.9 (max) | no | 1298 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 370 (p95) | no | 2130 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 15180 (p95) | **yes** | -180 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 987.8 (max) | no | 1512 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 679.6 (max) | no | 1820 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2070.1 (max) | no | 930 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 338 (p95) | no | 2162 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 14256 (p95) | no | 744 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 490.9 (max) | no | 2009 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 2125.3 (max) | no | 375 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1959.6 (max) | no | 1040 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 353 (p95) | no | 2147 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 10548 (p95) | no | 4452 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 1099 (max) | no | 1401 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 2375.7 (max) | no | 124 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2392.5 (max) | no | 607 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 321 (p95) | no | 2179 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 11682 (p95) | no | 3318 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 418.6 (max) | no | 2081 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1711.3 (max) | no | 789 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2141.3 (max) | no | 859 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 313 (p95) | no | 2187 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 12911 (p95) | no | 2089 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 2552.8 (max) | **yes** | -53 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 438.9 (max) | no | 2061 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2484.3 (max) | no | 516 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 359 (p95) | no | 2141 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 13980 (p95) | no | 1020 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 469.7 (max) | no | 2030 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 424.4 (max) | no | 2076 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 2534.7 (max) | no | 465 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 358 (p95) | no | 2142 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 12881 (p95) | no | 2119 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 626.7 (max) | no | 1873 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 917.2 (max) | no | 1583 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1620.1 (max) | no | 1380 |

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
