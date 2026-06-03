# Volume sign-off — S2-write

Generated: 2026-06-03T02:17:33.842Z

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
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 113 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 21 | n/a |
| `POST /api/v1/cashflows` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 2046 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1947 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 3979 (p95) | no | 21 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4887 (p95) | no | 113 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 947.2 (max) | no | 2053 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4884.7 (max) | **yes** | -885 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 43128 (p95) | **yes** | -40128 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 2047 (p95) | no | 1953 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3773 (p95) | no | 1227 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 839.5 (max) | no | 2160 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5950.6 (max) | **yes** | -1951 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 41228 (p95) | **yes** | -38228 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 3769 (p95) | no | 231 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3854 (p95) | no | 1146 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 964 (max) | no | 2036 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5842 (max) | **yes** | -1842 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 22961 (p95) | **yes** | -19961 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 1890 (p95) | no | 2110 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3004 (p95) | no | 1996 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 940.3 (max) | no | 2060 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5934.6 (max) | **yes** | -1935 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 37046 (p95) | **yes** | -34046 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3055 (p95) | no | 945 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3867 (p95) | no | 1133 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1008.2 (max) | no | 1992 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6045.9 (max) | **yes** | -2046 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 28707 (p95) | **yes** | -25707 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 2979 (p95) | no | 1021 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3782 (p95) | no | 1218 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 965.4 (max) | no | 2035 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4838.8 (max) | **yes** | -839 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 39245 (p95) | **yes** | -36245 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3026 (p95) | no | 974 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2845 (p95) | no | 2155 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 972.7 (max) | no | 2027 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5071.7 (max) | **yes** | -1072 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 35173 (p95) | **yes** | -32173 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3804 (p95) | no | 196 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3862 (p95) | no | 1138 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 962.9 (max) | no | 2037 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5948.6 (max) | **yes** | -1949 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 22676 (p95) | **yes** | -19676 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2941 (p95) | no | 1059 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2947 (p95) | no | 2053 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1019 (max) | no | 1981 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6038.5 (max) | **yes** | -2039 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 25618 (p95) | **yes** | -22618 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 1872 (p95) | no | 2128 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1785 (p95) | no | 3215 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 925.3 (max) | no | 2075 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5979.7 (max) | **yes** | -1980 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 29614 (p95) | **yes** | -26614 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1914 (p95) | no | 2086 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3786 (p95) | no | 1214 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 952.1 (max) | no | 2048 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5843.2 (max) | **yes** | -1843 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 37158 (p95) | **yes** | -34158 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 3825 (p95) | no | 175 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3859 (p95) | no | 1141 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1053.1 (max) | no | 1947 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5923.5 (max) | **yes** | -1924 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 22472 (p95) | **yes** | -19472 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 1981 (p95) | no | 2019 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3977 (p95) | no | 1023 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 925.6 (max) | no | 2074 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5936.6 (max) | **yes** | -1937 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27155 (p95) | **yes** | -24155 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3798 (p95) | no | 202 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2965 (p95) | no | 2035 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 961.9 (max) | no | 2038 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5991.7 (max) | **yes** | -1992 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 22749 (p95) | **yes** | -19749 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 2924 (p95) | no | 1076 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3839 (p95) | no | 1161 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 969.6 (max) | no | 2030 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4879.6 (max) | **yes** | -880 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 37087 (p95) | **yes** | -34087 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2187 (p95) | no | 1813 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3353 (p95) | no | 1647 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1008 (max) | no | 1992 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5917.5 (max) | **yes** | -1918 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 31108 (p95) | **yes** | -28108 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3806 (p95) | no | 194 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3883 (p95) | no | 1117 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 959.7 (max) | no | 2040 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5999.7 (max) | **yes** | -2000 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 22880 (p95) | **yes** | -19880 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 3769 (p95) | no | 231 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1073 (p95) | no | 3927 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 976.5 (max) | no | 2023 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5994.5 (max) | **yes** | -1994 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27491 (p95) | **yes** | -24491 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 2004 (p95) | no | 1996 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1257 (p95) | no | 3743 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 943.7 (max) | no | 2056 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5976.4 (max) | **yes** | -1976 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 34903 (p95) | **yes** | -31903 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3837 (p95) | no | 163 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3905 (p95) | no | 1095 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 981 (max) | no | 2019 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4939.8 (max) | **yes** | -940 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 38131 (p95) | **yes** | -35131 |

## Phase B — read profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `full_journey_duration` | 20/20 | 0/20 | — | 5944 | n/a |
| `GET /api/v1/cashflows/{cashflowId}` | 1/20 | 0/20 | — | 1729 | n/a |
| `GET /api/v1/client/{clientId}/cashflows` | 20/20 | 0/20 | — | 1883 | n/a |
| `GET /api/v1/Clients/{advisorId}/all` | 20/20 | 0/20 | — | 1474 | n/a |
| `journey_dashboard_load_duration` | 20/20 | 0/20 | — | 1474 | n/a |

**Shards all required metrics under budget:** 20/20 · **Any over:** 0/20

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 434.5 (max (retro)) | no | 2066 |
| advisor-00 | User01@gmail.com | `full_journey_duration` | 15000 | — | 9056 (max (retro)) | no | 5944 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 434.5 (max (retro)) | no | 2066 |
| advisor-00 | User01@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 395.4 (max (retro)) | no | 2105 |
| advisor-00 | User01@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | 1270.5 (max (retro)) | no | 1729 |
| advisor-01 | User02@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 516.2 (max (retro)) | no | 1984 |
| advisor-01 | User02@gmail.com | `full_journey_duration` | 15000 | — | 6024 (max (retro)) | no | 8976 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 516.2 (max (retro)) | no | 1984 |
| advisor-01 | User02@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 355.6 (max (retro)) | no | 2144 |
| advisor-01 | User02@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 458.9 (max (retro)) | no | 2041 |
| advisor-02 | User03@gmail.com | `full_journey_duration` | 15000 | — | 4625 (max (retro)) | no | 10375 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 458.9 (max (retro)) | no | 2041 |
| advisor-02 | User03@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 361.2 (max (retro)) | no | 2139 |
| advisor-02 | User03@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 595.8 (max (retro)) | no | 1904 |
| advisor-03 | User04@gmail.com | `full_journey_duration` | 15000 | — | 4272 (max (retro)) | no | 10728 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 595.8 (max (retro)) | no | 1904 |
| advisor-03 | User04@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 323 (max (retro)) | no | 2177 |
| advisor-03 | User04@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 566.9 (max (retro)) | no | 1933 |
| advisor-04 | User05@gmail.com | `full_journey_duration` | 15000 | — | 4710 (max (retro)) | no | 10290 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 566.9 (max (retro)) | no | 1933 |
| advisor-04 | User05@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 483.7 (max (retro)) | no | 2016 |
| advisor-04 | User05@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 580 (max (retro)) | no | 1920 |
| advisor-05 | User06@gmail.com | `full_journey_duration` | 15000 | — | 3661 (max (retro)) | no | 11339 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 580 (max (retro)) | no | 1920 |
| advisor-05 | User06@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 617.1 (max (retro)) | no | 1883 |
| advisor-05 | User06@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 600.9 (max (retro)) | no | 1899 |
| advisor-06 | User07@gmail.com | `full_journey_duration` | 15000 | — | 3712 (max (retro)) | no | 11288 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 600.9 (max (retro)) | no | 1899 |
| advisor-06 | User07@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 394.4 (max (retro)) | no | 2106 |
| advisor-06 | User07@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 504.3 (max (retro)) | no | 1996 |
| advisor-07 | User08@gmail.com | `full_journey_duration` | 15000 | — | 3437 (max (retro)) | no | 11563 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 504.3 (max (retro)) | no | 1996 |
| advisor-07 | User08@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 333.6 (max (retro)) | no | 2166 |
| advisor-07 | User08@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 447 (max (retro)) | no | 2053 |
| advisor-08 | User09@gmail.com | `full_journey_duration` | 15000 | — | 4055 (max (retro)) | no | 10945 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 447 (max (retro)) | no | 2053 |
| advisor-08 | User09@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 350.4 (max (retro)) | no | 2150 |
| advisor-08 | User09@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 540 (max (retro)) | no | 1960 |
| advisor-09 | User10@gmail.com | `full_journey_duration` | 15000 | — | 4430 (max (retro)) | no | 10570 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 540 (max (retro)) | no | 1960 |
| advisor-09 | User10@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 353.7 (max (retro)) | no | 2146 |
| advisor-09 | User10@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 559.5 (max (retro)) | no | 1940 |
| advisor-10 | User11@gmail.com | `full_journey_duration` | 15000 | — | 5656 (max (retro)) | no | 9344 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 559.5 (max (retro)) | no | 1940 |
| advisor-10 | User11@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 331.3 (max (retro)) | no | 2169 |
| advisor-10 | User11@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 544.3 (max (retro)) | no | 1956 |
| advisor-11 | User12@gmail.com | `full_journey_duration` | 15000 | — | 3179 (max (retro)) | no | 11821 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 544.3 (max (retro)) | no | 1956 |
| advisor-11 | User12@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 337.3 (max (retro)) | no | 2163 |
| advisor-11 | User12@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 607.7 (max (retro)) | no | 1892 |
| advisor-12 | User13@gmail.com | `full_journey_duration` | 15000 | — | 5144 (max (retro)) | no | 9856 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 607.7 (max (retro)) | no | 1892 |
| advisor-12 | User13@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 341.6 (max (retro)) | no | 2158 |
| advisor-12 | User13@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 544.4 (max (retro)) | no | 1956 |
| advisor-13 | User14@gmail.com | `full_journey_duration` | 15000 | — | 4062 (max (retro)) | no | 10938 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 544.4 (max (retro)) | no | 1956 |
| advisor-13 | User14@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 335.6 (max (retro)) | no | 2164 |
| advisor-13 | User14@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 462.9 (max (retro)) | no | 2037 |
| advisor-14 | User15@gmail.com | `full_journey_duration` | 15000 | — | 4999 (max (retro)) | no | 10001 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 462.9 (max (retro)) | no | 2037 |
| advisor-14 | User15@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 319.4 (max (retro)) | no | 2181 |
| advisor-14 | User15@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 483.9 (max (retro)) | no | 2016 |
| advisor-15 | User16@gmail.com | `full_journey_duration` | 15000 | — | 4330 (max (retro)) | no | 10670 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 483.9 (max (retro)) | no | 2016 |
| advisor-15 | User16@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 414.2 (max (retro)) | no | 2086 |
| advisor-15 | User16@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 796.2 (max (retro)) | no | 1704 |
| advisor-16 | User17@gmail.com | `full_journey_duration` | 15000 | — | 4533 (max (retro)) | no | 10467 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 796.2 (max (retro)) | no | 1704 |
| advisor-16 | User17@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 461.6 (max (retro)) | no | 2038 |
| advisor-16 | User17@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 559.1 (max (retro)) | no | 1941 |
| advisor-17 | User18@gmail.com | `full_journey_duration` | 15000 | — | 6321 (max (retro)) | no | 8679 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 559.1 (max (retro)) | no | 1941 |
| advisor-17 | User18@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 332.9 (max (retro)) | no | 2167 |
| advisor-17 | User18@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 498.2 (max (retro)) | no | 2002 |
| advisor-18 | User19@gmail.com | `full_journey_duration` | 15000 | — | 5423 (max (retro)) | no | 9577 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 498.2 (max (retro)) | no | 2002 |
| advisor-18 | User19@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 583.7 (max (retro)) | no | 1916 |
| advisor-18 | User19@gmail.com | `GET /api/v1/cashflows/{cashflowId}` | 3000 | 4000 | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | `journey_dashboard_load_duration` | 2500 | — | 1026.3 (max (retro)) | no | 1474 |
| advisor-19 | User20@gmail.com | `full_journey_duration` | 15000 | — | 4607 (max (retro)) | no | 10393 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Clients/{advisorId}/all` | 2500 | 5000 | 1026.3 (max (retro)) | no | 1474 |
| advisor-19 | User20@gmail.com | `GET /api/v1/client/{clientId}/cashflows` | 2500 | 4000 | 442.1 (max (retro)) | no | 2058 |
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
