# Volume sign-off — S1-write-realistic-v2

Generated: 2026-06-02T12:33:50.410Z

## Run pair

| Field | Value |
|-------|-------|
| Pair run tag | `S1-write-realistic-v2` |
| Phase A (write) | `S1-write-realistic-v2` |
| Phase B (read) | _pending — run Phase B read_ |
| SLO config | `config/volume-api-slo.json` |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients (write) | 20 | 19 | FAIL |
| Plans (write) | 20 | 19 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

Phase B profile/manifest binding: `data/scenarios/profile_20u_1c_1p.json`

## Phase A — write profile

### Fleet summary

| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |
|--------|--------------|-------------|---------------|-------------------|-----------------|
| `GET /api/v1/Reports/{cashflowId}` | 20/20 | 0/20 | — | 1961 | n/a |
| `journey_create_base_plan_duration` | 20/20 | 0/20 | — | 3000 | n/a |
| `journey_create_client_duration` | 20/20 | 0/20 | — | 1000 | n/a |
| `POST /api/v1/cashflows` | 6/20 | 14/20 | advisor-02, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-12, advisor-13, advisor-14, advisor-16, advisor-18, advisor-19 | 117 | 2010 |
| `POST /api/v1/Clients` | 20/20 | 0/20 | — | 2076 | n/a |

**Shards all required metrics under budget:** 6/20 · **Any over:** 14/20 · **Failed:** advisor-02, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-12, advisor-13, advisor-14, advisor-16, advisor-18, advisor-19

### Per-advisor budget table

| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |
|--------|-------|--------|----------|-------|----------|-------|----------|
| advisor-00 | User01@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-00 | User01@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-00 | User01@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 278.6 (max (retro)) | no | 2721 |
| advisor-00 | User01@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 530.3 (max (retro)) | no | 3470 |
| advisor-00 | User01@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 395.6 (max (retro)) | no | 2604 |
| advisor-00 | User01@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-01 | User02@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-01 | User02@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 460.4 (max (retro)) | no | 2540 |
| advisor-01 | User02@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 524.9 (max (retro)) | no | 3475 |
| advisor-01 | User02@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 381.4 (max (retro)) | no | 2619 |
| advisor-01 | User02@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-02 | User03@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-02 | User03@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-02 | User03@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 766 (max (retro)) | no | 2234 |
| advisor-02 | User03@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6003.9 (max (retro)) | **yes** | -2004 |
| advisor-02 | User03@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 395.7 (max (retro)) | no | 2604 |
| advisor-02 | User03@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-03 | User04@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-03 | User04@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-03 | User04@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 523.3 (max (retro)) | no | 2477 |
| advisor-03 | User04@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3655.2 (max (retro)) | no | 345 |
| advisor-03 | User04@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 863.3 (max (retro)) | no | 2137 |
| advisor-03 | User04@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-04 | User05@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-04 | User05@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-04 | User05@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 866.9 (max (retro)) | no | 2133 |
| advisor-04 | User05@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 6009.5 (max (retro)) | **yes** | -2009 |
| advisor-04 | User05@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 958.4 (max (retro)) | no | 2042 |
| advisor-04 | User05@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-05 | User06@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-05 | User06@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-05 | User06@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 488.5 (max (retro)) | no | 2511 |
| advisor-05 | User06@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4949 (max (retro)) | **yes** | -949 |
| advisor-05 | User06@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1039.2 (max (retro)) | no | 1961 |
| advisor-05 | User06@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-06 | User07@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-06 | User07@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-06 | User07@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 924.2 (max (retro)) | no | 2076 |
| advisor-06 | User07@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5056 (max (retro)) | **yes** | -1056 |
| advisor-06 | User07@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 380.2 (max (retro)) | no | 2620 |
| advisor-06 | User07@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-07 | User08@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-07 | User08@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-07 | User08@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 358.3 (max (retro)) | no | 2642 |
| advisor-07 | User08@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5929.1 (max (retro)) | **yes** | -1929 |
| advisor-07 | User08@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1000.2 (max (retro)) | no | 2000 |
| advisor-07 | User08@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-08 | User09@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-08 | User09@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-08 | User09@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 276.3 (max (retro)) | no | 2724 |
| advisor-08 | User09@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5054.2 (max (retro)) | **yes** | -1054 |
| advisor-08 | User09@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 962 (max (retro)) | no | 2038 |
| advisor-08 | User09@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-09 | User10@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-09 | User10@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-09 | User10@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 858.8 (max (retro)) | no | 2141 |
| advisor-09 | User10@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5074.7 (max (retro)) | **yes** | -1075 |
| advisor-09 | User10@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 968.1 (max (retro)) | no | 2032 |
| advisor-09 | User10@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-10 | User11@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-10 | User11@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-10 | User11@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 475.4 (max (retro)) | no | 2525 |
| advisor-10 | User11@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4971 (max (retro)) | **yes** | -971 |
| advisor-10 | User11@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1029.3 (max (retro)) | no | 1971 |
| advisor-10 | User11@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-11 | User12@gmail.com | `journey_create_client_duration` | 4000 | — | 0 (max (retro)) | no | 4000 |
| advisor-11 | User12@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-11 | User12@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 487.9 (max (retro)) | no | 2512 |
| advisor-11 | User12@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3883.3 (max (retro)) | no | 117 |
| advisor-11 | User12@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 989 (max (retro)) | no | 2011 |
| advisor-11 | User12@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-12 | User13@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-12 | User13@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-12 | User13@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 890.2 (max (retro)) | no | 2110 |
| advisor-12 | User13@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5998 (max (retro)) | **yes** | -1998 |
| advisor-12 | User13@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 984.5 (max (retro)) | no | 2016 |
| advisor-12 | User13@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-13 | User14@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-13 | User14@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-13 | User14@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 458.9 (max (retro)) | no | 2541 |
| advisor-13 | User14@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5026.4 (max (retro)) | **yes** | -1026 |
| advisor-13 | User14@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 1024.5 (max (retro)) | no | 1975 |
| advisor-13 | User14@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-14 | User15@gmail.com | `journey_create_client_duration` | 4000 | — | 2000 (max (retro)) | no | 2000 |
| advisor-14 | User15@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-14 | User15@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 315.7 (max (retro)) | no | 2684 |
| advisor-14 | User15@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5069.2 (max (retro)) | **yes** | -1069 |
| advisor-14 | User15@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 959.2 (max (retro)) | no | 2041 |
| advisor-14 | User15@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-15 | User16@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-15 | User16@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-15 | User16@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 493.2 (max (retro)) | no | 2507 |
| advisor-15 | User16@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3846.6 (max (retro)) | no | 153 |
| advisor-15 | User16@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 873.3 (max (retro)) | no | 2127 |
| advisor-15 | User16@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-16 | User17@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-16 | User17@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-16 | User17@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 474.8 (max (retro)) | no | 2525 |
| advisor-16 | User17@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 4621.5 (max (retro)) | **yes** | -622 |
| advisor-16 | User17@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 858.7 (max (retro)) | no | 2141 |
| advisor-16 | User17@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-17 | User18@gmail.com | `journey_create_client_duration` | 4000 | — | 1000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-17 | User18@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 503.3 (max (retro)) | no | 2497 |
| advisor-17 | User18@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 3878.9 (max (retro)) | no | 121 |
| advisor-17 | User18@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 991.8 (max (retro)) | no | 2008 |
| advisor-17 | User18@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-18 | User19@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-18 | User19@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 2000 (max (retro)) | no | 3000 |
| advisor-18 | User19@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 501.5 (max (retro)) | no | 2498 |
| advisor-18 | User19@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5061.6 (max (retro)) | **yes** | -1062 |
| advisor-18 | User19@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 415.4 (max (retro)) | no | 2585 |
| advisor-18 | User19@gmail.com | `journey_calculate_projection_duration` | 5000 | — | 0 (max (retro)) | no | 5000 |
| advisor-19 | User20@gmail.com | `journey_create_client_duration` | 4000 | — | 3000 (max (retro)) | no | 1000 |
| advisor-19 | User20@gmail.com | `journey_create_base_plan_duration` | 5000 | — | 1000 (max (retro)) | no | 4000 |
| advisor-19 | User20@gmail.com | `POST /api/v1/Clients` | 3000 | 8000 | 911.1 (max (retro)) | no | 2089 |
| advisor-19 | User20@gmail.com | `POST /api/v1/cashflows` | 4000 | 15000 | 5985.7 (max (retro)) | **yes** | -1986 |
| advisor-19 | User20@gmail.com | `GET /api/v1/Reports/{cashflowId}` | 3000 | 9000 | 406.5 (max (retro)) | no | 2593 |
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

Machine output: `reports/phase-volume/S1-write-realistic-v2_signoff-fleet.json`
