# Volume sign-off — S1-write-realistic-v3

Generated: 2026-06-02T14:08:50.049Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S1-write-realistic-v3` |
| Phase A (write) | `S1-write-realistic-v3` |
| Phase B (read) | _pending — run Phase B read_ |
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
| `GET /api/v1/Reports/{cashflowId}` | 20/20 | 0/20 | — | 625 | n/a |
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 2000 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 1000 | n/a |
| `POST /api/v1/cashflows` | 6/20 | 14/20 | advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-09, advisor-11, advisor-13, advisor-14, advisor-15, advisor-16, advisor-18, advisor-19 | 56 | 1979 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 2012 | n/a |

**Shards all required metrics under budget:** 6/20 · **Any over:** 14/20 · **Failed:** advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-09, advisor-11, advisor-13, advisor-14, advisor-15, advisor-16, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 349.6 (max (retro)) | no | 2650 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 731.5 (max (retro)) | no | 3268 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 411.2 (max (retro)) | no | 2589 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 293.9 (max (retro)) | no | 2706 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 546.9 (max (retro)) | no | 3453 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 422.3 (max (retro)) | no | 2578 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 987.7 (max (retro)) | no | 2012 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4968.6 (max (retro)) | **yes** | -969 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1005.7 (max (retro)) | no | 1994 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 955 (max (retro)) | no | 2045 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5054.8 (max (retro)) | **yes** | -1055 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 441.1 (max (retro)) | no | 2559 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 964.7 (max (retro)) | no | 2035 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5002.3 (max (retro)) | **yes** | -1002 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 413.9 (max (retro)) | no | 2586 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 3000 (max (retro)) | no | 2000 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 950.2 (max (retro)) | no | 2050 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5974 (max (retro)) | **yes** | -1974 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 431.6 (max (retro)) | no | 2568 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 948.6 (max (retro)) | no | 2051 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5024.3 (max (retro)) | **yes** | -1024 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 931.6 (max (retro)) | no | 2068 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 959 (max (retro)) | no | 2041 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5054.7 (max (retro)) | **yes** | -1055 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 471.9 (max (retro)) | no | 2528 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 971.8 (max (retro)) | no | 2028 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3943.7 (max (retro)) | no | 56 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1013.2 (max (retro)) | no | 1987 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 946.5 (max (retro)) | no | 2053 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5059 (max (retro)) | **yes** | -1059 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 960.3 (max (retro)) | no | 2040 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 968 (max (retro)) | no | 2032 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3927.6 (max (retro)) | no | 72 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 992.1 (max (retro)) | no | 2008 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 918.9 (max (retro)) | no | 2081 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4885.4 (max (retro)) | **yes** | -885 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 431.9 (max (retro)) | no | 2568 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 969.9 (max (retro)) | no | 2030 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3091.4 (max (retro)) | no | 909 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 443.6 (max (retro)) | no | 2556 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 965.6 (max (retro)) | no | 2034 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5043.7 (max (retro)) | **yes** | -1044 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 934.4 (max (retro)) | no | 2066 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 971.4 (max (retro)) | no | 2029 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5979.4 (max (retro)) | **yes** | -1979 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 455 (max (retro)) | no | 2545 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 944.6 (max (retro)) | no | 2055 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4963.5 (max (retro)) | **yes** | -964 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 924.2 (max (retro)) | no | 2076 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 925.8 (max (retro)) | no | 2074 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5037.2 (max (retro)) | **yes** | -1037 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 446.2 (max (retro)) | no | 2554 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 913.4 (max (retro)) | no | 2087 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3910.5 (max (retro)) | no | 89 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 962.1 (max (retro)) | no | 2038 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 935.1 (max (retro)) | no | 2065 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5050.7 (max (retro)) | **yes** | -1051 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 2374.6 (max (retro)) | no | 625 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 287.9 (max (retro)) | no | 2712 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4940.1 (max (retro)) | **yes** | -940 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 428.6 (max (retro)) | no | 2571 |
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

Machine output: `reports/phase-volume/S1-write-realistic-v3_signoff-fleet.json`
