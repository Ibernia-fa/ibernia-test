# Volume sign-off — S2-write

Generated: 2026-06-03T03:01:11.964Z

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
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 926 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 20 | n/a |
| `POST /api/v1/cashflows` | 1/20 | 19/20 | advisor-00, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | 1079 | 2014 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1287 | n/a |

**Shards all required metrics under budget:** 1/20 · **Any over:** 19/20 · **Failed:** advisor-00, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 3980 (p95) | no | 20 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3947 (p95) | no | 1053 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 964.7 (max) | no | 2035 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5962.3 (max) | **yes** | -1962 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 39143 (p95) | **yes** | -36143 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 2394 (p95) | no | 1606 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1328 (p95) | no | 3672 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 936.3 (max) | no | 2064 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 2920.7 (max) | no | 1079 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 38760 (p95) | **yes** | -35760 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 3057 (p95) | no | 943 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3983 (p95) | no | 1017 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 988 (max) | no | 2012 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4981.6 (max) | **yes** | -982 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 36047 (p95) | **yes** | -33047 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 3963 (p95) | no | 37 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4002 (p95) | no | 998 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1067 (max) | no | 1933 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4200 (max) | **yes** | -200 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 36042 (p95) | **yes** | -33042 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3969 (p95) | no | 31 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2984 (p95) | no | 2016 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 981.3 (max) | no | 2019 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6014.4 (max) | **yes** | -2014 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 26002 (p95) | **yes** | -23002 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3941 (p95) | no | 59 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3942 (p95) | no | 1058 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 979.2 (max) | no | 2021 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5953.5 (max) | **yes** | -1954 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 22610 (p95) | **yes** | -19610 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 2965 (p95) | no | 1035 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4074 (p95) | no | 926 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 961.7 (max) | no | 2038 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6001.3 (max) | **yes** | -2001 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 28024 (p95) | **yes** | -25024 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 2998 (p95) | no | 1002 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3966 (p95) | no | 1034 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 976.4 (max) | no | 2024 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5992.5 (max) | **yes** | -1992 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 29613 (p95) | **yes** | -26613 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 3975 (p95) | no | 25 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2983 (p95) | no | 2017 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 966.2 (max) | no | 2034 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5994.8 (max) | **yes** | -1995 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 25477 (p95) | **yes** | -22477 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3962 (p95) | no | 38 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3931 (p95) | no | 1069 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 981.4 (max) | no | 2019 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6013.7 (max) | **yes** | -2014 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 24081 (p95) | **yes** | -21081 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 2877 (p95) | no | 1123 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1911 (p95) | no | 3089 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 982.2 (max) | no | 2018 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4992.2 (max) | **yes** | -992 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 30040 (p95) | **yes** | -27040 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2960 (p95) | no | 1040 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4014 (p95) | no | 986 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 983.9 (max) | no | 2016 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6007.4 (max) | **yes** | -2007 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 29014 (p95) | **yes** | -26014 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3974 (p95) | no | 26 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4033 (p95) | no | 967 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 983.2 (max) | no | 2017 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5034 (max) | **yes** | -1034 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27038 (p95) | **yes** | -24038 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 2034 (p95) | no | 1966 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3969 (p95) | no | 1031 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 871.7 (max) | no | 2128 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4034.1 (max) | **yes** | -34 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 34055 (p95) | **yes** | -31055 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3942 (p95) | no | 58 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3967 (p95) | no | 1033 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 984 (max) | no | 2016 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5047.1 (max) | **yes** | -1047 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27139 (p95) | **yes** | -24139 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 3922 (p95) | no | 78 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2846 (p95) | no | 2154 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 989 (max) | no | 2011 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5965 (max) | **yes** | -1965 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31048 (p95) | **yes** | -28048 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3973 (p95) | no | 27 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3089 (p95) | no | 1911 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 993.5 (max) | no | 2007 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5979.9 (max) | **yes** | -1980 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 28441 (p95) | **yes** | -25441 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 2975 (p95) | no | 1025 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4004 (p95) | no | 996 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 992.5 (max) | no | 2007 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5991.9 (max) | **yes** | -1992 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 29218 (p95) | **yes** | -26218 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3822 (p95) | no | 178 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1952 (p95) | no | 3048 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1713.2 (max) | no | 1287 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5969.1 (max) | **yes** | -1969 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 34046 (p95) | **yes** | -31046 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3011 (p95) | no | 989 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2994 (p95) | no | 2006 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 971.2 (max) | no | 2029 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5939.6 (max) | **yes** | -1940 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 37035 (p95) | **yes** | -34035 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 20/20 | 0/20 | — | 8227 | n/a |
| `GET /api/v1/cashflows/{cashflowId}` | 1/20 | 0/20 | — | 2622 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 2043 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 20/20 | 0/20 | — | 1998 | n/a |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 1998 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 443.6 (max (retro)) | no | 2056 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 6773 (max (retro)) | no | 8227 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 443.6 (max (retro)) | no | 2056 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 310.1 (max (retro)) | no | 2190 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 377.6 (max (retro)) | no | 2622 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 446.5 (max (retro)) | no | 2053 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 5613 (max (retro)) | no | 9387 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 446.5 (max (retro)) | no | 2053 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 340.9 (max (retro)) | no | 2159 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 328.9 (max (retro)) | no | 2171 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 5420 (max (retro)) | no | 9580 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 328.9 (max (retro)) | no | 2171 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 447.1 (max (retro)) | no | 2053 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 330.4 (max (retro)) | no | 2170 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 6112 (max (retro)) | no | 8888 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 330.4 (max (retro)) | no | 2170 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 294.5 (max (retro)) | no | 2205 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 492.1 (max (retro)) | no | 2008 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 5857 (max (retro)) | no | 9143 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 492.1 (max (retro)) | no | 2008 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 446.2 (max (retro)) | no | 2054 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 362.8 (max (retro)) | no | 2137 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 5274 (max (retro)) | no | 9726 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 362.8 (max (retro)) | no | 2137 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 439.8 (max (retro)) | no | 2060 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 336.9 (max (retro)) | no | 2163 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 4326 (max (retro)) | no | 10674 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 336.9 (max (retro)) | no | 2163 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 457.5 (max (retro)) | no | 2043 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 333.2 (max (retro)) | no | 2167 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 4881 (max (retro)) | no | 10119 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 333.2 (max (retro)) | no | 2167 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 300.4 (max (retro)) | no | 2200 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 465.1 (max (retro)) | no | 2035 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 4771 (max (retro)) | no | 10229 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 465.1 (max (retro)) | no | 2035 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 310.6 (max (retro)) | no | 2189 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 453 (max (retro)) | no | 2047 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 3463 (max (retro)) | no | 11537 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 453 (max (retro)) | no | 2047 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 290.3 (max (retro)) | no | 2210 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 368.4 (max (retro)) | no | 2132 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 6237 (max (retro)) | no | 8763 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 368.4 (max (retro)) | no | 2132 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 287.5 (max (retro)) | no | 2213 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 502.1 (max (retro)) | no | 1998 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 4765 (max (retro)) | no | 10235 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 502.1 (max (retro)) | no | 1998 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 328.2 (max (retro)) | no | 2172 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 484.1 (max (retro)) | no | 2016 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 6093 (max (retro)) | no | 8907 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 484.1 (max (retro)) | no | 2016 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 381.7 (max (retro)) | no | 2118 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 467.3 (max (retro)) | no | 2033 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 4852 (max (retro)) | no | 10148 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 467.3 (max (retro)) | no | 2033 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 305.8 (max (retro)) | no | 2194 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 473.2 (max (retro)) | no | 2027 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 4595 (max (retro)) | no | 10405 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 473.2 (max (retro)) | no | 2027 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 448.9 (max (retro)) | no | 2051 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 494.6 (max (retro)) | no | 2005 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 3369 (max (retro)) | no | 11631 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 494.6 (max (retro)) | no | 2005 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 328.4 (max (retro)) | no | 2172 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 461.3 (max (retro)) | no | 2039 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 4878 (max (retro)) | no | 10122 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 461.3 (max (retro)) | no | 2039 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 312.2 (max (retro)) | no | 2188 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 458 (max (retro)) | no | 2042 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 4234 (max (retro)) | no | 10766 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 458 (max (retro)) | no | 2042 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 295 (max (retro)) | no | 2205 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 485.8 (max (retro)) | no | 2014 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 4021 (max (retro)) | no | 10979 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 485.8 (max (retro)) | no | 2014 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 281.8 (max (retro)) | no | 2218 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 366.7 (max (retro)) | no | 2133 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 5262 (max (retro)) | no | 9738 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 366.7 (max (retro)) | no | 2133 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 276.6 (max (retro)) | no | 2223 |
| advisor-19 | User20@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |

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

Machine output: `reports/phase-volume/S2-write_signoff-fleet.json`
