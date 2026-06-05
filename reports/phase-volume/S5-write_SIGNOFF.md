# Volume sign-off — S5-write

Generated: 2026-06-05T03:38:41.380Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S5-write` |
| Phase A (write) | `S5-write` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 600 | 600 | PASS |
| Plans (write) | 4800 | 4800 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

Phase B profile/manifest binding: `data/scenarios/profile_20u_30c_8p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 2036 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 992 | n/a |
| `POST /api/v1/cashflows` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 994 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1901 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Quota breach summary

**Advisors over latency budget:** 20/20 · **All required metrics under budget:** 0/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create cashflow/plan API | 20 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | 994 |

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
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 2006 (p95) | no | 1994 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1125 (p95) | no | 3875 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 977.7 (max) | no | 2022 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4981 (max) | **yes** | -981 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23867 (p95) | **yes** | -18867 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 1965 (p95) | no | 2035 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2964 (p95) | no | 2036 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1018 (max) | no | 1982 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4010.1 (max) | **yes** | -10 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29067 (p95) | **yes** | -24067 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 1918 (p95) | no | 2082 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 564 (p95) | no | 4436 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1046.1 (max) | no | 1954 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4966.4 (max) | **yes** | -966 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 15500 (p95) | **yes** | -10500 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 1986 (p95) | no | 2014 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1957 (p95) | no | 3043 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 986.4 (max) | no | 2014 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4949 (max) | **yes** | -949 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 24081 (p95) | **yes** | -19081 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3004 (p95) | no | 996 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 544 (p95) | no | 4456 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 994.3 (max) | no | 2006 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4973.8 (max) | **yes** | -974 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14635 (p95) | **yes** | -9635 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 2995 (p95) | no | 1005 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1149 (p95) | no | 3851 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 999 (max) | no | 2001 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4994.3 (max) | **yes** | -994 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 22866 (p95) | **yes** | -17866 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 1957 (p95) | no | 2043 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 535 (p95) | no | 4465 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1099.2 (max) | no | 1901 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4939.1 (max) | **yes** | -939 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 13878 (p95) | **yes** | -8878 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 1995 (p95) | no | 2005 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1971 (p95) | no | 3029 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 976.6 (max) | no | 2023 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4007.7 (max) | **yes** | -8 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 29015 (p95) | **yes** | -24015 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 1336 (p95) | no | 2664 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 549 (p95) | no | 4451 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 991.9 (max) | no | 2008 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4969.3 (max) | **yes** | -969 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14504 (p95) | **yes** | -9504 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 1993 (p95) | no | 2007 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 585 (p95) | no | 4415 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 999.4 (max) | no | 2001 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4966.7 (max) | **yes** | -967 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14755 (p95) | **yes** | -9755 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1933 (p95) | no | 2067 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2111 (p95) | no | 2889 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1007.1 (max) | no | 1993 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4936.9 (max) | **yes** | -937 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 26886 (p95) | **yes** | -21886 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 1338 (p95) | no | 2662 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 551 (p95) | no | 4449 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 976.9 (max) | no | 2023 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4916.5 (max) | **yes** | -916 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14258 (p95) | **yes** | -9258 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 2001 (p95) | no | 1999 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1149 (p95) | no | 3851 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1026.5 (max) | no | 1973 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4950.3 (max) | **yes** | -950 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 26879 (p95) | **yes** | -21879 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 1988 (p95) | no | 2012 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 647 (p95) | no | 4353 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 995.9 (max) | no | 2004 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4992.3 (max) | **yes** | -992 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 20767 (p95) | **yes** | -15767 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 1303 (p95) | no | 2697 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 662 (p95) | no | 4338 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 977.8 (max) | no | 2022 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4507.4 (max) | **yes** | -507 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 18916 (p95) | **yes** | -13916 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 1982 (p95) | no | 2018 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 608 (p95) | no | 4392 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1015.1 (max) | no | 1985 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4088.4 (max) | **yes** | -88 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 20830 (p95) | **yes** | -15830 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 2981 (p95) | no | 1019 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1065 (p95) | no | 3935 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 987.5 (max) | no | 2013 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4028.1 (max) | **yes** | -28 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21903 (p95) | **yes** | -16903 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 1991 (p95) | no | 2009 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1131 (p95) | no | 3869 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 992.5 (max) | no | 2007 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4059.4 (max) | **yes** | -59 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 16747 (p95) | **yes** | -11747 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3008 (p95) | no | 992 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1120 (p95) | no | 3880 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1006.8 (max) | no | 1993 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4978.8 (max) | **yes** | -979 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 19632 (p95) | **yes** | -14632 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 2978 (p95) | no | 1022 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1076 (p95) | no | 3924 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1017.6 (max) | no | 1982 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4961.1 (max) | **yes** | -961 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 24877 (p95) | **yes** | -19877 |

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

Machine output: `reports/phase-volume/S5-write_signoff-fleet.json`
