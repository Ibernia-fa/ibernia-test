# Volume sign-off — S1-write

Generated: 2026-06-02T15:36:23.651Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S1-write` |
| Phase A (write) | `S1-write` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 20 | 13 | FAIL |
| Plans (write) | 20 | 13 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_1c_1p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `GET /api/v1/Reports/{cashflowId}` | 20/20 | 0/20 | — | 1006 | n/a |
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 2000 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 1000 | n/a |
| `POST /api/v1/cashflows` | 5/20 | 15/20 | advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-09, advisor-10, advisor-12, advisor-13, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | 1949 | 1982 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 1987 | n/a |

**Shards all required metrics under budget:** 5/20 · **Any over:** 15/20 · **Failed:** advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-09, advisor-10, advisor-12, advisor-13, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 268.7 (max (retro)) | no | 2731 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 556.3 (max (retro)) | no | 3444 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 397.6 (max (retro)) | no | 2602 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 299.4 (max (retro)) | no | 2701 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 533.1 (max (retro)) | no | 3467 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 406.1 (max (retro)) | no | 2594 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1005.1 (max (retro)) | no | 1995 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5932.1 (max (retro)) | **yes** | -1932 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 992 (max (retro)) | no | 2008 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 991.8 (max (retro)) | no | 2008 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5955 (max (retro)) | **yes** | -1955 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 437.1 (max (retro)) | no | 2563 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1004 (max (retro)) | no | 1996 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5952.1 (max (retro)) | **yes** | -1952 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 408 (max (retro)) | no | 2592 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1007.3 (max (retro)) | no | 1993 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5963.6 (max (retro)) | **yes** | -1964 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 385.9 (max (retro)) | no | 2614 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1000.8 (max (retro)) | no | 1999 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4017.4 (max (retro)) | **yes** | -17 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 981 (max (retro)) | no | 2019 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 971.4 (max (retro)) | no | 2029 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4975 (max (retro)) | **yes** | -975 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 845.1 (max (retro)) | no | 2155 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 265.3 (max (retro)) | no | 2735 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 2051.3 (max (retro)) | no | 1949 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1883.1 (max (retro)) | no | 1117 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 977.6 (max (retro)) | no | 2022 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4962.1 (max (retro)) | **yes** | -962 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 407.6 (max (retro)) | no | 2592 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1013.4 (max (retro)) | no | 1987 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5926.3 (max (retro)) | **yes** | -1926 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 558.4 (max (retro)) | no | 2442 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 258.5 (max (retro)) | no | 2741 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 2038.4 (max (retro)) | no | 1962 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1994.3 (max (retro)) | no | 1006 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1001.3 (max (retro)) | no | 1999 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5982 (max (retro)) | **yes** | -1982 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 530 (max (retro)) | no | 2470 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 970.5 (max (retro)) | no | 2030 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5934.6 (max (retro)) | **yes** | -1935 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 410.3 (max (retro)) | no | 2590 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 456.6 (max (retro)) | no | 2543 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 2028.9 (max (retro)) | no | 1971 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1084.9 (max (retro)) | no | 1915 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 990.1 (max (retro)) | no | 2010 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5965.8 (max (retro)) | **yes** | -1966 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 403.9 (max (retro)) | no | 2596 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1002.8 (max (retro)) | no | 1997 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4965.6 (max (retro)) | **yes** | -966 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 838.4 (max (retro)) | no | 2162 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 968.6 (max (retro)) | no | 2031 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5950.9 (max (retro)) | **yes** | -1951 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 422.2 (max (retro)) | no | 2578 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 997.8 (max (retro)) | no | 2002 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5911.7 (max (retro)) | **yes** | -1912 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 386.4 (max (retro)) | no | 2614 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 1000.3 (max (retro)) | no | 2000 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4976.3 (max (retro)) | **yes** | -976 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 890 (max (retro)) | no | 2110 |
| advisor-19 | User20@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |

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

Machine output: `reports/phase-volume/S1-write_signoff-fleet.json`
