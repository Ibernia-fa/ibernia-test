# Volume sign-off — S3-write

Generated: 2026-06-03T05:09:50.709Z

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
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 1016 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 39 | n/a |
| `POST /api/v1/cashflows` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 1908 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1967 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 3908 (p95) | no | 92 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1907 (p95) | no | 3093 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1020.5 (max) | no | 1979 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4971.6 (max) | **yes** | -972 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 44176 (p95) | **yes** | -39176 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 3931 (p95) | no | 69 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2946 (p95) | no | 2054 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 990.8 (max) | no | 2009 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5074 (max) | **yes** | -1074 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 43026 (p95) | **yes** | -38026 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 3023 (p95) | no | 977 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3984 (p95) | no | 1016 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1002.8 (max) | no | 1997 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5048 (max) | **yes** | -1048 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 35092 (p95) | **yes** | -30092 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 2963 (p95) | no | 1037 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1081 (p95) | no | 3919 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1014.7 (max) | no | 1985 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5015.4 (max) | **yes** | -1015 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14591 (p95) | **yes** | -9591 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3961 (p95) | no | 39 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2046 (p95) | no | 2954 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 988.1 (max) | no | 2012 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5050.1 (max) | **yes** | -1050 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 39016 (p95) | **yes** | -34016 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3006 (p95) | no | 994 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2082 (p95) | no | 2918 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 996.8 (max) | no | 2003 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5004.8 (max) | **yes** | -1005 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 25795 (p95) | **yes** | -20795 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3010 (p95) | no | 990 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3933 (p95) | no | 1067 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 990.7 (max) | no | 2009 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5032.7 (max) | **yes** | -1033 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33078 (p95) | **yes** | -28078 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3033 (p95) | no | 967 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3068 (p95) | no | 1932 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1021.8 (max) | no | 1978 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5017.4 (max) | **yes** | -1017 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 26950 (p95) | **yes** | -21950 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 3077 (p95) | no | 923 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2020 (p95) | no | 2980 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1030.7 (max) | no | 1969 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5045.3 (max) | **yes** | -1045 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 17584 (p95) | **yes** | -12584 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3938 (p95) | no | 62 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3115 (p95) | no | 1885 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1012.8 (max) | no | 1987 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5027.1 (max) | **yes** | -1027 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 34903 (p95) | **yes** | -29903 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 2996 (p95) | no | 1004 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3914 (p95) | no | 1086 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 982.7 (max) | no | 2017 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5013.2 (max) | **yes** | -1013 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 34039 (p95) | **yes** | -29039 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 3879 (p95) | no | 121 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2937 (p95) | no | 2063 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 974.7 (max) | no | 2025 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4991.3 (max) | **yes** | -991 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 37038 (p95) | **yes** | -32038 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 2901 (p95) | no | 1099 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1987 (p95) | no | 3013 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1006.7 (max) | no | 1993 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5041.7 (max) | **yes** | -1042 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 23461 (p95) | **yes** | -18461 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 2340 (p95) | no | 1660 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3959 (p95) | no | 1041 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1012.8 (max) | no | 1987 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5019.7 (max) | **yes** | -1020 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 33048 (p95) | **yes** | -28048 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3927 (p95) | no | 73 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 684 (p95) | no | 4316 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1008.9 (max) | no | 1991 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5033.7 (max) | **yes** | -1034 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12844 (p95) | **yes** | -7844 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2958 (p95) | no | 1042 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1158 (p95) | no | 3842 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1033.1 (max) | no | 1967 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5068.8 (max) | **yes** | -1069 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 14152 (p95) | **yes** | -9152 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3783 (p95) | no | 217 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2110 (p95) | no | 2890 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1010.4 (max) | no | 1990 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5003.9 (max) | **yes** | -1004 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 21794 (p95) | **yes** | -16794 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 2816 (p95) | no | 1184 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3098 (p95) | no | 1902 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1030.8 (max) | no | 1969 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 4954.5 (max) | **yes** | -954 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 38015 (p95) | **yes** | -33015 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3032 (p95) | no | 968 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1071 (p95) | no | 3929 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1005.1 (max) | no | 1995 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5003.2 (max) | **yes** | -1003 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 12457 (p95) | **yes** | -7457 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3941 (p95) | no | 59 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3927 (p95) | no | 1073 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 7500 | 1001.7 (max) | no | 1998 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 10000 | 5908.4 (max) | **yes** | -1908 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 35077 (p95) | **yes** | -30077 |

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
