# Volume sign-off — S3-write

Generated: 2026-06-04T16:08:23.657Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S3-write` |
| Phase A (write) | `S3-write` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 200 | 200 | PASS |
| Plans (write) | 800 | 800 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

Phase B profile/manifest binding: `data/scenarios/profile_20u_10c_4p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 983 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 932 | n/a |
| `POST /api/v1/cashflows` | 6/20 | 14/20 | advisor-00, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-13, advisor-17, advisor-18 | 1 | 1275 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1964 | n/a |

**Shards all required metrics under budget:** 6/20 · **Any over:** 14/20 · **Failed:** advisor-00, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-13, advisor-17, advisor-18

### Quota breach summary

**Advisors over latency budget:** 14/20 · **All required metrics under budget:** 6/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create cashflow/plan API | 14 | 20 | advisor-00, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-13, advisor-17, advisor-18 | 1275 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-00 | User01@gmail.com | 1 | Create cashflow/plan API |
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
| advisor-13 | User14@gmail.com | 1 | Create cashflow/plan API |
| advisor-17 | User18@gmail.com | 1 | Create cashflow/plan API |
| advisor-18 | User19@gmail.com | 1 | Create cashflow/plan API |

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 1979 (p95) | no | 2021 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2941 (p95) | no | 2059 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 970 (max) | no | 2030 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4070.3 (max) | **yes** | -70 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28052 (p95) | **yes** | -23052 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 2065 (p95) | no | 1935 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3019 (p95) | no | 1981 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 975.4 (max) | no | 2025 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3962.7 (max) | no | 37 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 30026 (p95) | **yes** | -25026 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 2013 (p95) | no | 1987 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 932 (p95) | no | 4068 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1035.8 (max) | no | 1964 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4041.6 (max) | **yes** | -42 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12492 (p95) | **yes** | -7492 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 2029 (p95) | no | 1971 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2193 (p95) | no | 2807 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 999.2 (max) | no | 2001 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4999.2 (max) | **yes** | -999 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23794 (p95) | **yes** | -18794 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 1973 (p95) | no | 2027 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1121 (p95) | no | 3879 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1007.2 (max) | no | 1993 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4955.1 (max) | **yes** | -955 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 17938 (p95) | **yes** | -12938 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3068 (p95) | no | 932 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1173 (p95) | no | 3827 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 999.6 (max) | no | 2000 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4026.4 (max) | **yes** | -26 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 28838 (p95) | **yes** | -23838 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 2036 (p95) | no | 1964 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1022 (p95) | no | 3978 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 973.1 (max) | no | 2027 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4028.5 (max) | **yes** | -29 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 19448 (p95) | **yes** | -14448 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 1981 (p95) | no | 2019 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4017 (p95) | no | 983 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 990.1 (max) | no | 2010 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4970.9 (max) | **yes** | -971 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23979 (p95) | **yes** | -18979 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 3007 (p95) | no | 993 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1138 (p95) | no | 3862 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 999.9 (max) | no | 2000 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4012.6 (max) | **yes** | -13 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 20371 (p95) | **yes** | -15371 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 2053 (p95) | no | 1947 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 720 (p95) | no | 4280 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1001.6 (max) | no | 1998 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5275.1 (max) | **yes** | -1275 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 15585 (p95) | **yes** | -10585 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1966 (p95) | no | 2034 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1124 (p95) | no | 3876 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 982.2 (max) | no | 2018 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4021.9 (max) | **yes** | -22 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21903 (p95) | **yes** | -16903 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2973 (p95) | no | 1027 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1138 (p95) | no | 3862 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 990.8 (max) | no | 2009 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4070.9 (max) | **yes** | -71 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 19783 (p95) | **yes** | -14783 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 1977 (p95) | no | 2023 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 534 (p95) | no | 4466 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1023.5 (max) | no | 1977 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3996.6 (max) | no | 3 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 11277 (p95) | **yes** | -6277 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 1994 (p95) | no | 2006 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 529 (p95) | no | 4471 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1016 (max) | no | 1984 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4927.8 (max) | **yes** | -928 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 11349 (p95) | **yes** | -6349 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 1982 (p95) | no | 2018 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1076 (p95) | no | 3924 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1030.4 (max) | no | 1970 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3976.7 (max) | no | 23 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 18299 (p95) | **yes** | -13299 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2035 (p95) | no | 1965 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1181 (p95) | no | 3819 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 985.4 (max) | no | 2015 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3989.6 (max) | no | 10 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21790 (p95) | **yes** | -16790 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 2061 (p95) | no | 1939 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1084 (p95) | no | 3916 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1009.9 (max) | no | 1990 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3998.5 (max) | no | 1 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14815 (p95) | **yes** | -9815 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 2025 (p95) | no | 1975 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1146 (p95) | no | 3854 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 975.5 (max) | no | 2025 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4017.2 (max) | **yes** | -17 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21858 (p95) | **yes** | -16858 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3036 (p95) | no | 964 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 684 (p95) | no | 4316 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 991.5 (max) | no | 2008 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4974.1 (max) | **yes** | -974 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12570 (p95) | **yes** | -7570 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3026 (p95) | no | 974 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3056 (p95) | no | 1944 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1000.8 (max) | no | 1999 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 3991.7 (max) | no | 8 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 24007 (p95) | **yes** | -19007 |

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

- Phase A fleet gate: **PASS** (passed 0, failed 0)

## Recommendation

**NO-GO (or incomplete)** — Review budget tables and data gates before S2.

---

Machine output: `reports/phase-volume/S3-write_signoff-fleet.json`
