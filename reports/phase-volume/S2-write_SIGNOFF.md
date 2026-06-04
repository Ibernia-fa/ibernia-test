# Volume sign-off — S2-write

Generated: 2026-06-04T09:48:20.655Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S2-write` |
| Phase A (write) | `S2-write` |
| Phase B (read) | `S2-read` |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 100 | 100 | PASS |
| Plans (write) | 200 | 200 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

Phase B profile/manifest binding: `data/scenarios/profile_20u_5c_2p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 2619 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 1895 | n/a |
| `POST /api/v1/cashflows` | 20/20 | 0/20 | — | 967 | n/a |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1993 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Quota breach summary

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 817 (p95) | no | 3183 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 885 (p95) | no | 4115 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 388.2 (max) | no | 2612 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 883.6 (max) | no | 3116 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21069 (p95) | **yes** | -16069 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 918 (p95) | no | 3082 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 926 (p95) | no | 4074 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 301.1 (max) | no | 2699 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 922.9 (max) | no | 3077 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 22091 (p95) | **yes** | -17091 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 2004 (p95) | no | 1996 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1943 (p95) | no | 3057 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 904 (max) | no | 2096 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2846.5 (max) | no | 1154 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27155 (p95) | **yes** | -22155 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 2105 (p95) | no | 1895 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 991 (p95) | no | 4009 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 871.8 (max) | no | 2128 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2037.1 (max) | no | 1963 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 27525 (p95) | **yes** | -22525 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 1983 (p95) | no | 2017 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1163 (p95) | no | 3837 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 962.9 (max) | no | 2037 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2892.8 (max) | no | 1107 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23968 (p95) | **yes** | -18968 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 986 (p95) | no | 3014 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 881 (p95) | no | 4119 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 928.2 (max) | no | 2072 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2885.1 (max) | no | 1115 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23106 (p95) | **yes** | -18106 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 1932 (p95) | no | 2068 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2381 (p95) | no | 2619 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 832.7 (max) | no | 2167 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3013 (max) | no | 987 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 20450 (p95) | **yes** | -15450 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 2039 (p95) | no | 1961 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1491 (p95) | no | 3509 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 938.5 (max) | no | 2061 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2989.1 (max) | no | 1011 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 19911 (p95) | **yes** | -14911 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 1216 (p95) | no | 2784 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 603 (p95) | no | 4397 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 892.9 (max) | no | 2107 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 1903.2 (max) | no | 2097 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 16766 (p95) | **yes** | -11766 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 1542 (p95) | no | 2458 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 720 (p95) | no | 4280 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 936 (max) | no | 2064 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2784.9 (max) | no | 1215 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 17020 (p95) | **yes** | -12020 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1444 (p95) | no | 2556 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1080 (p95) | no | 3920 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 935.2 (max) | no | 2065 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2885.6 (max) | no | 1114 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 15401 (p95) | **yes** | -10401 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 1288 (p95) | no | 2712 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1028 (p95) | no | 3972 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 886.3 (max) | no | 2114 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2722.1 (max) | no | 1278 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14266 (p95) | **yes** | -9266 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 1126 (p95) | no | 2874 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 586 (p95) | no | 4414 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1006.9 (max) | no | 1993 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2606.3 (max) | no | 1394 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13195 (p95) | **yes** | -8195 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 1360 (p95) | no | 2640 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 526 (p95) | no | 4474 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 934.2 (max) | no | 2066 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2006.7 (max) | no | 1993 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13777 (p95) | **yes** | -8777 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 1555 (p95) | no | 2445 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1025 (p95) | no | 3975 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 870.7 (max) | no | 2129 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2010.2 (max) | no | 1990 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13790 (p95) | **yes** | -8790 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 1026 (p95) | no | 2974 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 530 (p95) | no | 4470 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 965.1 (max) | no | 2035 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3019.9 (max) | no | 980 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12456 (p95) | **yes** | -7456 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 1633 (p95) | no | 2367 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 969 (p95) | no | 4031 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 534.4 (max) | no | 2466 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 1909.7 (max) | no | 2090 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12366 (p95) | **yes** | -7366 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 949 (p95) | no | 3051 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 545 (p95) | no | 4455 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 885.7 (max) | no | 2114 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2999.5 (max) | no | 1001 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 10690 (p95) | **yes** | -5690 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 1071 (p95) | no | 2929 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 506 (p95) | no | 4494 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 972.5 (max) | no | 2027 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 2776.1 (max) | no | 1224 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 10710 (p95) | **yes** | -5710 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 1036 (p95) | no | 2964 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 507 (p95) | no | 4493 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 961.7 (max) | no | 2038 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3033 (max) | no | 967 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 10139 (p95) | **yes** | -5139 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 20/20 | 0/20 | — | 5925 | n/a |
| `GET /api/v1/cashflows/{cashflowId}` | 20/20 | 0/20 | — | 1865 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 1232 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 20/20 | 0/20 | — | 1981 | n/a |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 1981 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Quota breach summary

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 341.8 (max (retro)) | no | 2158 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 6568 (max (retro)) | no | 8432 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 341.8 (max (retro)) | no | 2158 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 462.5 (max (retro)) | no | 2038 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1032.5 (max (retro)) | no | 1967 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 395.5 (max (retro)) | no | 2105 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 7324 (max (retro)) | no | 7676 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 395.5 (max (retro)) | no | 2105 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 444.8 (max (retro)) | no | 2055 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 657.7 (max (retro)) | no | 2342 |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 453.3 (max (retro)) | no | 2047 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 8425 (max (retro)) | no | 6575 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 453.3 (max (retro)) | no | 2047 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 465.8 (max (retro)) | no | 2034 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1060.2 (max (retro)) | no | 1940 |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 463.7 (max (retro)) | no | 2036 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 7331 (max (retro)) | no | 7669 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 463.7 (max (retro)) | no | 2036 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 343.8 (max (retro)) | no | 2156 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 908.5 (max (retro)) | no | 2092 |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 500.7 (max (retro)) | no | 1999 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 7397 (max (retro)) | no | 7603 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 500.7 (max (retro)) | no | 1999 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 282.9 (max (retro)) | no | 2217 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1039.8 (max (retro)) | no | 1960 |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 462.9 (max (retro)) | no | 2037 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 8374 (max (retro)) | no | 6626 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 462.9 (max (retro)) | no | 2037 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1024.3 (max (retro)) | no | 1476 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 523.3 (max (retro)) | no | 2477 |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 458.9 (max (retro)) | no | 2041 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 7633 (max (retro)) | no | 7367 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 458.9 (max (retro)) | no | 2041 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 327.7 (max (retro)) | no | 2172 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 951.5 (max (retro)) | no | 2048 |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 382.7 (max (retro)) | no | 2117 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 8017 (max (retro)) | no | 6983 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 382.7 (max (retro)) | no | 2117 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 300.8 (max (retro)) | no | 2199 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 635.5 (max (retro)) | no | 2365 |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 505.9 (max (retro)) | no | 1994 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 8207 (max (retro)) | no | 6793 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 505.9 (max (retro)) | no | 1994 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 327.3 (max (retro)) | no | 2173 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1011.3 (max (retro)) | no | 1989 |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 508.4 (max (retro)) | no | 1992 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 8323 (max (retro)) | no | 6677 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 508.4 (max (retro)) | no | 1992 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 574.8 (max (retro)) | no | 1925 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 939.5 (max (retro)) | no | 2060 |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 447.1 (max (retro)) | no | 2053 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 6725 (max (retro)) | no | 8275 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 447.1 (max (retro)) | no | 2053 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 531.1 (max (retro)) | no | 1969 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1060.8 (max (retro)) | no | 1939 |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 478.3 (max (retro)) | no | 2022 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 8594 (max (retro)) | no | 6406 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 478.3 (max (retro)) | no | 2022 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 1268.5 (max (retro)) | no | 1232 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1123.5 (max (retro)) | no | 1877 |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 408.6 (max (retro)) | no | 2091 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 6878 (max (retro)) | no | 8122 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 408.6 (max (retro)) | no | 2091 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 352.4 (max (retro)) | no | 2148 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 510.8 (max (retro)) | no | 2489 |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 412.8 (max (retro)) | no | 2087 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 6954 (max (retro)) | no | 8046 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 412.8 (max (retro)) | no | 2087 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 354.6 (max (retro)) | no | 2145 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 458 (max (retro)) | no | 2542 |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 489.1 (max (retro)) | no | 2011 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 7294 (max (retro)) | no | 7706 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 489.1 (max (retro)) | no | 2011 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 441.6 (max (retro)) | no | 2058 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 585.4 (max (retro)) | no | 2415 |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 518.8 (max (retro)) | no | 1981 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 7347 (max (retro)) | no | 7653 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 518.8 (max (retro)) | no | 1981 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 443.6 (max (retro)) | no | 2056 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 672.3 (max (retro)) | no | 2328 |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 460.4 (max (retro)) | no | 2040 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 9075 (max (retro)) | no | 5925 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 460.4 (max (retro)) | no | 2040 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 314.8 (max (retro)) | no | 2185 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1018.4 (max (retro)) | no | 1982 |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 404.8 (max (retro)) | no | 2095 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 7518 (max (retro)) | no | 7482 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 404.8 (max (retro)) | no | 2095 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 331.3 (max (retro)) | no | 2169 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1134.2 (max (retro)) | no | 1866 |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 511.2 (max (retro)) | no | 1989 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 8072 (max (retro)) | no | 6928 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 511.2 (max (retro)) | no | 1989 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 304.2 (max (retro)) | no | 2196 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1135.5 (max (retro)) | no | 1865 |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 383.1 (max (retro)) | no | 2117 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 7840 (max (retro)) | no | 7160 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 383.1 (max (retro)) | no | 2117 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 293.6 (max (retro)) | no | 2206 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 517.4 (max (retro)) | no | 2483 |

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

**GO** — S1 write + read sign-off complete. Proceed toward S2 after review.

---

Machine output: `reports/phase-volume/S2-write_signoff-fleet.json`
