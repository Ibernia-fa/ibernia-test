# Volume sign-off — S2-write

Generated: 2026-06-03T01:38:42.021Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S2-write` |
| Phase A (write) | `S2-write` |
| Phase B (read) | _pending — run Phase B read_ |
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
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 118 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 87 | n/a |
| `POST /api/v1/cashflows` | 0/20 | 20/20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 2087 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1950 | n/a |

**Shards all required metrics under budget:** 0/20 · **Any over:** 20/20 · **Failed:** advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 2984 (p95) | no | 1016 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4882 (p95) | no | 118 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 921.5 (max) | no | 2079 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5821.5 (max) | **yes** | -1821 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 43166 (p95) | **yes** | -40166 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 3833 (p95) | no | 167 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4882 (p95) | no | 118 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 918.5 (max) | no | 2081 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5122.4 (max) | **yes** | -1122 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 42259 (p95) | **yes** | -39259 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 3913 (p95) | no | 87 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1824 (p95) | no | 3176 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 965.6 (max) | no | 2034 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4960.7 (max) | **yes** | -961 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 37143 (p95) | **yes** | -34143 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 1887 (p95) | no | 2113 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1824 (p95) | no | 3176 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 998.4 (max) | no | 2002 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4952.1 (max) | **yes** | -952 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 36355 (p95) | **yes** | -33355 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 2959 (p95) | no | 1041 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1958 (p95) | no | 3042 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 977.2 (max) | no | 2023 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4996.5 (max) | **yes** | -996 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 37138 (p95) | **yes** | -34138 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3790 (p95) | no | 210 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2870 (p95) | no | 2130 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 952.5 (max) | no | 2047 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5989.9 (max) | **yes** | -1990 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 24676 (p95) | **yes** | -21676 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 2718 (p95) | no | 1282 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2689 (p95) | no | 2311 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1015.7 (max) | no | 1984 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6042.3 (max) | **yes** | -2042 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 38202 (p95) | **yes** | -35202 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3867 (p95) | no | 133 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4865 (p95) | no | 135 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1049.7 (max) | no | 1950 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 4933.2 (max) | **yes** | -933 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 39374 (p95) | **yes** | -36374 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 3745 (p95) | no | 255 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4230 (p95) | no | 770 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 997.4 (max) | no | 2003 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5931 (max) | **yes** | -1931 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 24666 (p95) | **yes** | -21666 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3775 (p95) | no | 225 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2905 (p95) | no | 2095 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1023.4 (max) | no | 1977 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6059.6 (max) | **yes** | -2060 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 26785 (p95) | **yes** | -23785 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 3715 (p95) | no | 285 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2715 (p95) | no | 2285 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1016.8 (max) | no | 1983 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5961.1 (max) | **yes** | -1961 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27072 (p95) | **yes** | -24072 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 3820 (p95) | no | 180 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3832 (p95) | no | 1168 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 968.4 (max) | no | 2032 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5935.3 (max) | **yes** | -1935 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 24683 (p95) | **yes** | -21683 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3013 (p95) | no | 987 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 4800 (p95) | no | 200 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1029.4 (max) | no | 1971 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5020.4 (max) | **yes** | -1020 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 38437 (p95) | **yes** | -35437 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3791 (p95) | no | 209 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2864 (p95) | no | 2136 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1009.5 (max) | no | 1991 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5833.9 (max) | **yes** | -1834 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27284 (p95) | **yes** | -24284 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 2912 (p95) | no | 1088 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3824 (p95) | no | 1176 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 963.5 (max) | no | 2036 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5989.9 (max) | **yes** | -1990 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 25606 (p95) | **yes** | -22606 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2943 (p95) | no | 1057 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2805 (p95) | no | 2195 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 976.1 (max) | no | 2024 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5942.1 (max) | **yes** | -1942 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27150 (p95) | **yes** | -24150 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3784 (p95) | no | 216 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2873 (p95) | no | 2127 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 1018.7 (max) | no | 1981 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5982.7 (max) | **yes** | -1983 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27289 (p95) | **yes** | -24289 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 1983 (p95) | no | 2017 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1480 (p95) | no | 3520 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 982.5 (max) | no | 2017 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 6087.1 (max) | **yes** | -2087 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 30129 (p95) | **yes** | -27129 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3770 (p95) | no | 230 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2952 (p95) | no | 2048 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 959.4 (max) | no | 2041 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5051.8 (max) | **yes** | -1052 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 25203 (p95) | **yes** | -22203 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 2926 (p95) | no | 1074 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2823 (p95) | no | 2177 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 9000 | 949.8 (max) | no | 2050 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 12000 | 5935.3 (max) | **yes** | -1935 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 3000 | — | 27149 (p95) | **yes** | -24149 |

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

Machine output: `reports/phase-volume/S2-write_signoff-fleet.json`
