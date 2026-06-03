### 1_run_metadata
| field | value |
|-------|-------|
| scenario | S1 |
| phase_a_run_tag (requested) | S1-write |
| phase_b_run_tag (requested) | S1-read |
| phase_a_run_tag (resolved) | S1-write |
| phase_b_run_tag (resolved) | S1-read |
| signoff_fleet_file (requested) | reports/phase-volume/S1-write_signoff-fleet.json |
| signoff_fleet_file (resolved) | reports/phase-volume/S1-write_signoff-fleet.json |
| run_metadata_file (requested) | reports/phase-a/S1-write/run-metadata.json |
| run_metadata_file (resolved) | reports/phase-a/S1-write/run-metadata.json |
| slo_summary_fleet_a (requested) | reports/phase-a/S1-write/slo-summary-fleet.json |
| slo_summary_fleet_a (resolved) | reports/phase-a/S1-write/slo-summary-fleet.json |
| slo_summary_fleet_b (requested) | n/a — not found |
| slo_summary_fleet_b (resolved) | n/a |
| slo_summary_b (resolved) | reports/phase-b/S1-read/slo-summary.json |
| journey_summary (resolved) | reports/journeys/k6-journey-advisor-critical-summary.json |
| profile_file (resolved) | data/scenarios/profile_20u_1c_1p.json |
| seed_spec_version | 1 |
| seed_spec_enriched_at | 2026-06-03T02:35:18.072Z |
| seed_spec_source | deterministic (lib/k6-volume-realistic-data.js) — not live API GET |
| profile_run_binding | S1-write |
| volumeScenario | S1 |
| userMode | fixed |
| advisors | 20 |
| concurrency | 20 |
| clientsPerAdvisor | 1 |
| plansPerClient | 1 |
| expectedClients | 20 |
| expectedPlans | 20 |
| runElapsedSec | 172.8 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-03T02:35:21.971Z |
| slo_config | config/volume-api-slo.json |

### 2_data_gates
| gate | expected | actual | pass |
|------|----------|--------|------|
| clients (write) | 20 | 20 | yes |
| plans (write) | 20 | 20 | yes |
| shards | 20 | 20 | yes |
| manifest validation | n/a | passed=true | yes |

### 3_phase_a_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_create_client_duration | 19 | 1 | 20 | advisor-10 | 5 | 4015 |
| journey_create_base_plan_duration | 20 | 0 | 20 |  | 18 | 4982 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 1969 | 1030.6 |
| POST /api/v1/cashflows | 14 | 6 | 20 | advisor-08, advisor-10, advisor-13, advisor-14, advisor-17, advisor-19 | 4 | 4980.2 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 885 | p95 | no | 3115 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 619 | p95 | no | 4381 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 265.9 | max | no | 2734 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 582.3 | max | no | 3418 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 989 | p95 | no | 3011 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 527 | p95 | no | 4473 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 295.7 | max | no | 2704 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 525.2 | max | no | 3475 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 869 | p95 | no | 3131 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 514 | p95 | no | 4486 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 259.5 | max | no | 2741 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 513.3 | max | no | 3487 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 833 | p95 | no | 3167 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 496 | p95 | no | 4504 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 254.6 | max | no | 2745 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 494.9 | max | no | 3505 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 2056 | p95 | no | 1944 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3026 | p95 | no | 1974 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 283.7 | max | no | 2716 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3024.9 | max | no | 975 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 2071 | p95 | no | 1929 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3022 | p95 | no | 1978 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 285.8 | max | no | 2714 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3019.9 | max | no | 980 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 3046 | p95 | no | 954 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3958 | p95 | no | 1042 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 989.5 | max | no | 2011 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3954.9 | max | no | 45 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 3062 | p95 | no | 938 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3960 | p95 | no | 1040 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1005.3 | max | no | 1995 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3957.6 | max | no | 42 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 3995 | p95 | no | 5 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4964 | p95 | no | 36 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1028.1 | max | no | 1972 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4963 | max | yes | -963 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 3991 | p95 | no | 9 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4001 | p95 | no | 999 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 957 | max | no | 2043 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3995.8 | max | no | 4 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 4015 | p95 | yes | -15 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4036 | p95 | no | 964 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1009.3 | max | no | 1991 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4032.2 | max | yes | -32 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 2031 | p95 | no | 1969 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1930 | p95 | no | 3070 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 965.8 | max | no | 2034 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 1924.4 | max | no | 2076 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 3045 | p95 | no | 955 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2953 | p95 | no | 2047 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 991.9 | max | no | 2008 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2950 | max | no | 1050 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 3962 | p95 | no | 38 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4007 | p95 | no | 993 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 958 | max | no | 2042 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4004.2 | max | yes | -4 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 3995 | p95 | no | 5 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4981 | p95 | no | 19 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1030.6 | max | no | 1969 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4978.1 | max | yes | -978 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 2049 | p95 | no | 1951 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2984 | p95 | no | 2016 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 962.4 | max | no | 2038 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2979.9 | max | no | 1020 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 3046 | p95 | no | 954 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3920 | p95 | no | 1080 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 999.4 | max | no | 2001 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3918.1 | max | no | 82 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 3981 | p95 | no | 19 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4982 | p95 | no | 18 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1029.3 | max | no | 1971 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4980.2 | max | yes | -980 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 2066 | p95 | no | 1934 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2995 | p95 | no | 2005 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 274 | max | no | 2726 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2991.5 | max | no | 1009 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 3024 | p95 | no | 976 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4928 | p95 | no | 72 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 983.1 | max | no | 2017 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4926.6 | max | yes | -927 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 2207 | 293 |
| full_journey_duration | 0 | 20 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 13283 |
| GET /api/v1/Clients/{advisorId}/all | 19 | 1 | 20 | advisor-02 | 579 | 19229.6 |
| GET /api/v1/client/{clientId}/cashflows | 15 | 5 | 20 | advisor-03, advisor-05, advisor-09, advisor-12, advisor-15 | 1385 | 19618.5 |
| GET /api/v1/cashflows/{cashflowId} | 16 | 4 | 20 | advisor-11, advisor-13, advisor-16, advisor-19 | 1285 | 19439.8 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 260 | p95 | no | 2240 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 10791 | p95 | yes | -8291 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 611.8 | max | no | 1888 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 451.1 | max | no | 2049 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1256.6 | max | no | 1743 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 270 | p95 | no | 2230 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 10879 | p95 | yes | -8379 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 444.3 | max | no | 2056 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 301.9 | max | no | 2198 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 945.3 | max | no | 2055 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 269 | p95 | no | 2231 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 11823 | p95 | yes | -9323 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 19229.6 | max | yes | -16730 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 506.6 | max | no | 1993 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 563.8 | max | no | 2436 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 12589 | p95 | yes | -10089 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 471.1 | max | no | 2029 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 19240.2 | max | yes | -16740 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 967.4 | max | no | 2033 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 268 | p95 | no | 2232 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 10868 | p95 | yes | -8368 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 651.3 | max | no | 1849 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 315.3 | max | no | 2185 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1019 | max | no | 1981 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 256 | p95 | no | 2244 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 10791 | p95 | yes | -8291 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 275 | max | no | 2225 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 19275.6 | max | yes | -16776 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1195.4 | max | no | 1805 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 263 | p95 | no | 2237 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 10609 | p95 | yes | -8109 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 315.9 | max | no | 2184 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 654.1 | max | no | 1846 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 744 | max | no | 2256 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 11775 | p95 | yes | -9275 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 757.5 | max | no | 1743 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 777.9 | max | no | 1722 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 391.6 | max | no | 2608 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 260 | p95 | no | 2240 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 12580 | p95 | yes | -10080 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 573 | max | no | 1927 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 420.5 | max | no | 2080 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 392.4 | max | no | 2608 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 269 | p95 | no | 2231 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 12997 | p95 | yes | -10497 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1920.9 | max | no | 579 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 19618.5 | max | yes | -17118 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 633.4 | max | no | 2367 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 13283 | p95 | yes | -10783 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 595.9 | max | no | 1904 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 283.7 | max | no | 2216 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1715 | max | no | 1285 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 11874 | p95 | yes | -9374 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 402.1 | max | no | 2098 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 326.3 | max | no | 2174 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 19241.3 | max | yes | -16241 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 293 | p95 | no | 2207 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 13104 | p95 | yes | -10604 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 428.8 | max | no | 2071 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 19268.4 | max | yes | -16768 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1530.2 | max | no | 1470 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 285 | p95 | no | 2215 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 12233 | p95 | yes | -9733 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 396.5 | max | no | 2104 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 725.3 | max | no | 1775 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 19413.2 | max | yes | -16413 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 263 | p95 | no | 2237 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 11235 | p95 | yes | -8735 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 597 | max | no | 1903 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 815.6 | max | no | 1684 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 711.3 | max | no | 2289 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 258 | p95 | no | 2242 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 10842 | p95 | yes | -8342 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 790 | max | no | 1710 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 19579.9 | max | yes | -17080 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 509.8 | max | no | 2490 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 265 | p95 | no | 2235 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 12151 | p95 | yes | -9651 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 593.3 | max | no | 1907 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 870.7 | max | no | 1629 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 19269 | max | yes | -16269 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 286 | p95 | no | 2214 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 12602 | p95 | yes | -10102 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 446 | max | no | 2054 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 441 | max | no | 2059 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 548.5 | max | no | 2451 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 266 | p95 | no | 2234 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 9182 | p95 | yes | -6682 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 654.9 | max | no | 1845 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 633.5 | max | no | 1866 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1109 | max | no | 1891 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 271 | p95 | no | 2229 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 9958 | p95 | yes | -7458 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 285.2 | max | no | 2215 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1114.7 | max | no | 1385 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 19439.8 | max | yes | -16440 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |

### 7_errors
| phase | auth_failure_rate | business_failure_rate | http_req_failed |
|-------|-------------------|----------------------|-----------------|
| A | n/a | n/a | n/a |
| B | 0.00508130081300813 | 0.007957559681697613 | 0.003652711435796572 |

### 8_exits
| phase | runner_exit_code | k6_exit_0 | k6_exit_99 | failed_job_ids |
|-------|------------------|-----------|------------|----------------|
| A | n/a | 20 | 0 |  |
| B | 99 | 0 | 1 | |

### 9_fleet_slo_gate
| phase | passed | failed | failed_shard_ids |
|-------|--------|--------|------------------|
| A | 14 | 6 | advisor-08, advisor-10, advisor-13, advisor-14, advisor-17, advisor-19 |
| B | 0 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-04 | journey_calculate_projection_duration | 35958 | 5000 | -32958 |
| 2 | advisor-11 | journey_calculate_projection_duration | 35225 | 5000 | -32225 |
| 3 | advisor-05 | journey_calculate_projection_duration | 35073 | 5000 | -32073 |
| 4 | advisor-18 | journey_calculate_projection_duration | 34088 | 5000 | -31088 |
| 5 | advisor-06 | journey_calculate_projection_duration | 33158 | 5000 | -30158 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-09 | GET /api/v1/client/{clientId}/cashflows | 19618.5 | 2500 | -17118 |
| 2 | advisor-15 | GET /api/v1/client/{clientId}/cashflows | 19579.9 | 2500 | -17080 |
| 3 | advisor-05 | GET /api/v1/client/{clientId}/cashflows | 19275.6 | 2500 | -16776 |
| 4 | advisor-12 | GET /api/v1/client/{clientId}/cashflows | 19268.4 | 2500 | -16768 |
| 5 | advisor-03 | GET /api/v1/client/{clientId}/cashflows | 19240.2 | 2500 | -16740 |

### 12_friendly_names_map
| api_metric | plain_name |
|------------|------------|
| journey_create_client_duration | Create client (write step) |
| journey_create_base_plan_duration | Create base plan (write step) |
| POST /api/v1/Clients | Create client API |
| POST /api/v1/cashflows | Create cashflow/plan API |
| GET /api/v1/Reports/{cashflowId} | Get reports/projection API |
| journey_dashboard_load_duration | Dashboard clients list load |
| full_journey_duration | End-to-end advisor journey |
| GET /api/v1/Clients/{advisorId}/all | List all clients for advisor |
| GET /api/v1/client/{clientId}/cashflows | List client plans |
| GET /api/v1/cashflows/{cashflowId} | Open cashflow/plan |

### 13_seed_spec_expectations
| field | value |
|-------|-------|
| clientsPerAdvisor | 1 |
| plansPerClient | 1 |
| timelineGoalChipCount | 5 |
| moneyInOutIncomeRows | 3 |
| moneyInOutExpenseRows | 2 |
| savingPotsPerPlan | 2 |
| reportsSeeded | false |

### 14_seed_coverage
| metric | value |
|--------|-------|
| advisors_in_profile | 20 |
| plans_in_profile | 20 |
| plans_with_seed_block | 20 |
| plans_missing_seed_block | 0 |
| seed_enriched | yes |

### 15_seed_per_plan
| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |
|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|
| advisor-00 | User01@gmail.com | 6a1f8f87901fc6abfb096331 | 6a1f8f88901fc6abfb09633b | Wealth accumulation plan | Giulia Bianchi | 1990 | Management consultant | 4800 | 858 | 1352 | 9681 | 2 | 42681; 9981 | 2 | 2 | 85681 | 147681 | 5 | skipped |
| advisor-01 | User02@gmail.com | 6a1f8f96901fc6abfb0964e8 | 6a1f8f97901fc6abfb0964f2 | Early career wealth plan | Matteo Russo | 1995 | Software developer | 3800 | 627 | 988 | 9500 | 2 | 44750; 12050 | 2 | 2 | 89750 | 147750 | 5 | skipped |
| advisor-02 | User03@gmail.com | 6a1f8fdf901fc6abfb0966d1 | 6a1f8fe0901fc6abfb09671c | Business owner succession plan | Francesca Gallo | 1983 | Pharmacist (own practice) | 5600 | 1056 | 1664 | 11309 | 2 | 43309; 10609 | 2 | 2 | 88309 | 146309 | 5 | skipped |
| advisor-03 | User04@gmail.com | 6a1f8fdf901fc6abfb0966ce | 6a1f8fe0901fc6abfb0966e2 | Mid-life financial review | Chiara Marini | 1980 | HR director | 5900 | 1023 | 1612 | 11085 | 2 | 43335; 10635 | 2 | 2 | 88335 | 146335 | 5 | skipped |
| advisor-04 | User05@gmail.com | 6a1f8ff7901fc6abfb096ce0 | 6a1f8ff9901fc6abfb096db7 | Mid-life financial review | Chiara Marini | 1980 | HR director | 5900 | 1023 | 1612 | 12409 | 2 | 45159; 12459 | 2 | 2 | 87159 | 146159 | 5 | skipped |
| advisor-05 | User06@gmail.com | 6a1f8ff7901fc6abfb096cd9 | 6a1f8ff9901fc6abfb096db5 | Long-term retirement plan | Marco Rossi | 1985 | Engineering manager | 5200 | 957 | 1508 | 12058 | 2 | 44808; 12108 | 2 | 2 | 89808 | 145808 | 5 | skipped |
| advisor-06 | User07@gmail.com | 6a1f8ff9901fc6abfb096daa | 6a1f8ffc901fc6abfb096f09 | Business owner succession plan | Francesca Gallo | 1983 | Pharmacist (own practice) | 5600 | 1056 | 1664 | 10653 | 2 | 44653; 11953 | 2 | 2 | 87653 | 147653 | 5 | skipped |
| advisor-07 | User08@gmail.com | 6a1f8ff9901fc6abfb096da6 | 6a1f8ffc901fc6abfb096f01 | Mid-life financial review | Chiara Marini | 1980 | HR director | 5900 | 1023 | 1612 | 12557 | 2 | 45807; 13107 | 2 | 2 | 89807 | 147807 | 5 | skipped |
| advisor-08 | User09@gmail.com | 6a1f8ffa901fc6abfb096e01 | 6a1f8ffe901fc6abfb09703e | Family security plan | Elena Romano | 1992 | Secondary school teacher | 3100 | 693 | 1092 | 8417 | 2 | 42667; 9967 | 2 | 2 | 85667 | 145667 | 5 | skipped |
| advisor-09 | User10@gmail.com | 6a1f8ff8901fc6abfb096d51 | 6a1f8ffc901fc6abfb096f0b | Flexible career plan | Alessandro Conti | 1988 | Product designer | 4200 | 809 | 1274 | 9033 | 2 | 43908; 11208 | 2 | 2 | 87908 | 145908 | 5 | skipped |
| advisor-10 | User11@gmail.com | 6a1f8ff8901fc6abfb096d4a | 6a1f8ffc901fc6abfb096f0d | Long-term retirement plan | Marco Rossi | 1985 | Engineering manager | 5200 | 957 | 1508 | 12070 | 2 | 45320; 12620 | 2 | 2 | 87320 | 146320 | 5 | skipped |
| advisor-11 | User12@gmail.com | 6a1f8ff5901fc6abfb096c8f | 6a1f8ff7901fc6abfb096cfc | Early career wealth plan | Matteo Russo | 1995 | Software developer | 3800 | 627 | 988 | 8252 | 2 | 45502; 12802 | 2 | 2 | 88502 | 145502 | 5 | skipped |
| advisor-12 | User13@gmail.com | 6a1f8ff7901fc6abfb096cf2 | 6a1f8ffa901fc6abfb096e1b | Mid-life financial review | Chiara Marini | 1980 | HR director | 5900 | 1023 | 1612 | 11053 | 2 | 42303; 9603 | 2 | 2 | 88303 | 147303 | 5 | skipped |
| advisor-13 | User14@gmail.com | 6a1f8ff8901fc6abfb096d4f | 6a1f8ffc901fc6abfb096f05 | Early career wealth plan | Matteo Russo | 1995 | Software developer | 3800 | 627 | 988 | 8792 | 2 | 43542; 10842 | 2 | 2 | 86542 | 146542 | 5 | skipped |
| advisor-14 | User15@gmail.com | 6a1f8ffa901fc6abfb096e03 | 6a1f8ffe901fc6abfb09703b | Wealth accumulation plan | Giulia Bianchi | 1990 | Management consultant | 4800 | 858 | 1352 | 10285 | 2 | 44785; 12085 | 2 | 2 | 88785 | 146785 | 5 | skipped |
| advisor-15 | User16@gmail.com | 6a1f8ff6901fc6abfb096cb6 | 6a1f8ff8901fc6abfb096d5d | Long-term retirement plan | Marco Rossi | 1985 | Engineering manager | 5200 | 957 | 1508 | 12122 | 2 | 44872; 12172 | 2 | 2 | 89872 | 145872 | 5 | skipped |
| advisor-16 | User17@gmail.com | 6a1f8ff9901fc6abfb096da8 | 6a1f8ffc901fc6abfb096efe | Wealth accumulation plan | Giulia Bianchi | 1990 | Management consultant | 4800 | 858 | 1352 | 9729 | 2 | 42729; 10029 | 2 | 2 | 85729 | 145729 | 5 | skipped |
| advisor-17 | User18@gmail.com | 6a1f8ffa901fc6abfb096e05 | 6a1f8ffe901fc6abfb09703c | Business owner succession plan | Francesca Gallo | 1983 | Pharmacist (own practice) | 5600 | 1056 | 1664 | 12289 | 2 | 43789; 11089 | 2 | 2 | 86789 | 146789 | 5 | skipped |
| advisor-18 | User19@gmail.com | 6a1f8ff6901fc6abfb096ca7 | 6a1f8ff8901fc6abfb096d5f | Business owner succession plan | Francesca Gallo | 1983 | Pharmacist (own practice) | 5600 | 1056 | 1664 | 11273 | 2 | 45773; 13073 | 2 | 2 | 85773 | 146773 | 5 | skipped |
| advisor-19 | User20@gmail.com | 6a1f8ffb901fc6abfb096e86 | 6a1f8ffe901fc6abfb097053 | Flexible career plan | Alessandro Conti | 1988 | Product designer | 4200 | 809 | 1274 | 9765 | 2 | 44140; 11440 | 2 | 2 | 86140 | 145140 | 5 | skipped |

### 16_seed_money_in_out_detail
| shard_id | cashflow_id | row_type | description | amount |
|----------|-------------|----------|-------------|--------|
| advisor-00 | 6a1f8f88901fc6abfb09633b | income | Salary | 4800 |
| advisor-00 | 6a1f8f88901fc6abfb09633b | income | State pension | 1824 |
| advisor-00 | 6a1f8f88901fc6abfb09633b | income | Inheritance | 65000 |
| advisor-00 | 6a1f8f88901fc6abfb09633b | expense | Living costs | 858 |
| advisor-00 | 6a1f8f88901fc6abfb09633b | expense | Housing | 1352 |
| advisor-01 | 6a1f8f97901fc6abfb0964f2 | income | Salary | 3800 |
| advisor-01 | 6a1f8f97901fc6abfb0964f2 | income | State pension | 1444 |
| advisor-01 | 6a1f8f97901fc6abfb0964f2 | income | Inheritance | 65000 |
| advisor-01 | 6a1f8f97901fc6abfb0964f2 | expense | Living costs | 627 |
| advisor-01 | 6a1f8f97901fc6abfb0964f2 | expense | Housing | 988 |
| advisor-02 | 6a1f8fe0901fc6abfb09671c | income | Salary | 5600 |
| advisor-02 | 6a1f8fe0901fc6abfb09671c | income | State pension | 2128 |
| advisor-02 | 6a1f8fe0901fc6abfb09671c | income | Inheritance | 65000 |
| advisor-02 | 6a1f8fe0901fc6abfb09671c | expense | Living costs | 1056 |
| advisor-02 | 6a1f8fe0901fc6abfb09671c | expense | Housing | 1664 |
| advisor-03 | 6a1f8fe0901fc6abfb0966e2 | income | Salary | 5900 |
| advisor-03 | 6a1f8fe0901fc6abfb0966e2 | income | State pension | 2242 |
| advisor-03 | 6a1f8fe0901fc6abfb0966e2 | income | Inheritance | 65000 |
| advisor-03 | 6a1f8fe0901fc6abfb0966e2 | expense | Living costs | 1023 |
| advisor-03 | 6a1f8fe0901fc6abfb0966e2 | expense | Housing | 1612 |
| advisor-04 | 6a1f8ff9901fc6abfb096db7 | income | Salary | 5900 |
| advisor-04 | 6a1f8ff9901fc6abfb096db7 | income | State pension | 2242 |
| advisor-04 | 6a1f8ff9901fc6abfb096db7 | income | Inheritance | 65000 |
| advisor-04 | 6a1f8ff9901fc6abfb096db7 | expense | Living costs | 1023 |
| advisor-04 | 6a1f8ff9901fc6abfb096db7 | expense | Housing | 1612 |
| advisor-05 | 6a1f8ff9901fc6abfb096db5 | income | Salary | 5200 |
| advisor-05 | 6a1f8ff9901fc6abfb096db5 | income | State pension | 1976 |
| advisor-05 | 6a1f8ff9901fc6abfb096db5 | income | Inheritance | 65000 |
| advisor-05 | 6a1f8ff9901fc6abfb096db5 | expense | Living costs | 957 |
| advisor-05 | 6a1f8ff9901fc6abfb096db5 | expense | Housing | 1508 |
| advisor-06 | 6a1f8ffc901fc6abfb096f09 | income | Salary | 5600 |
| advisor-06 | 6a1f8ffc901fc6abfb096f09 | income | State pension | 2128 |
| advisor-06 | 6a1f8ffc901fc6abfb096f09 | income | Inheritance | 65000 |
| advisor-06 | 6a1f8ffc901fc6abfb096f09 | expense | Living costs | 1056 |
| advisor-06 | 6a1f8ffc901fc6abfb096f09 | expense | Housing | 1664 |
| advisor-07 | 6a1f8ffc901fc6abfb096f01 | income | Salary | 5900 |
| advisor-07 | 6a1f8ffc901fc6abfb096f01 | income | State pension | 2242 |
| advisor-07 | 6a1f8ffc901fc6abfb096f01 | income | Inheritance | 65000 |
| advisor-07 | 6a1f8ffc901fc6abfb096f01 | expense | Living costs | 1023 |
| advisor-07 | 6a1f8ffc901fc6abfb096f01 | expense | Housing | 1612 |
| advisor-08 | 6a1f8ffe901fc6abfb09703e | income | Salary | 3100 |
| advisor-08 | 6a1f8ffe901fc6abfb09703e | income | State pension | 1178 |
| advisor-08 | 6a1f8ffe901fc6abfb09703e | income | Inheritance | 65000 |
| advisor-08 | 6a1f8ffe901fc6abfb09703e | expense | Living costs | 693 |
| advisor-08 | 6a1f8ffe901fc6abfb09703e | expense | Housing | 1092 |
| advisor-09 | 6a1f8ffc901fc6abfb096f0b | income | Salary | 4200 |
| advisor-09 | 6a1f8ffc901fc6abfb096f0b | income | State pension | 1596 |
| advisor-09 | 6a1f8ffc901fc6abfb096f0b | income | Inheritance | 65000 |
| advisor-09 | 6a1f8ffc901fc6abfb096f0b | expense | Living costs | 809 |
| advisor-09 | 6a1f8ffc901fc6abfb096f0b | expense | Housing | 1274 |
| advisor-10 | 6a1f8ffc901fc6abfb096f0d | income | Salary | 5200 |
| advisor-10 | 6a1f8ffc901fc6abfb096f0d | income | State pension | 1976 |
| advisor-10 | 6a1f8ffc901fc6abfb096f0d | income | Inheritance | 65000 |
| advisor-10 | 6a1f8ffc901fc6abfb096f0d | expense | Living costs | 957 |
| advisor-10 | 6a1f8ffc901fc6abfb096f0d | expense | Housing | 1508 |
| advisor-11 | 6a1f8ff7901fc6abfb096cfc | income | Salary | 3800 |
| advisor-11 | 6a1f8ff7901fc6abfb096cfc | income | State pension | 1444 |
| advisor-11 | 6a1f8ff7901fc6abfb096cfc | income | Inheritance | 65000 |
| advisor-11 | 6a1f8ff7901fc6abfb096cfc | expense | Living costs | 627 |
| advisor-11 | 6a1f8ff7901fc6abfb096cfc | expense | Housing | 988 |
| advisor-12 | 6a1f8ffa901fc6abfb096e1b | income | Salary | 5900 |
| advisor-12 | 6a1f8ffa901fc6abfb096e1b | income | State pension | 2242 |
| advisor-12 | 6a1f8ffa901fc6abfb096e1b | income | Inheritance | 65000 |
| advisor-12 | 6a1f8ffa901fc6abfb096e1b | expense | Living costs | 1023 |
| advisor-12 | 6a1f8ffa901fc6abfb096e1b | expense | Housing | 1612 |
| advisor-13 | 6a1f8ffc901fc6abfb096f05 | income | Salary | 3800 |
| advisor-13 | 6a1f8ffc901fc6abfb096f05 | income | State pension | 1444 |
| advisor-13 | 6a1f8ffc901fc6abfb096f05 | income | Inheritance | 65000 |
| advisor-13 | 6a1f8ffc901fc6abfb096f05 | expense | Living costs | 627 |
| advisor-13 | 6a1f8ffc901fc6abfb096f05 | expense | Housing | 988 |
| advisor-14 | 6a1f8ffe901fc6abfb09703b | income | Salary | 4800 |
| advisor-14 | 6a1f8ffe901fc6abfb09703b | income | State pension | 1824 |
| advisor-14 | 6a1f8ffe901fc6abfb09703b | income | Inheritance | 65000 |
| advisor-14 | 6a1f8ffe901fc6abfb09703b | expense | Living costs | 858 |
| advisor-14 | 6a1f8ffe901fc6abfb09703b | expense | Housing | 1352 |
| advisor-15 | 6a1f8ff8901fc6abfb096d5d | income | Salary | 5200 |
| advisor-15 | 6a1f8ff8901fc6abfb096d5d | income | State pension | 1976 |
| advisor-15 | 6a1f8ff8901fc6abfb096d5d | income | Inheritance | 65000 |
| advisor-15 | 6a1f8ff8901fc6abfb096d5d | expense | Living costs | 957 |
| advisor-15 | 6a1f8ff8901fc6abfb096d5d | expense | Housing | 1508 |
| advisor-16 | 6a1f8ffc901fc6abfb096efe | income | Salary | 4800 |
| advisor-16 | 6a1f8ffc901fc6abfb096efe | income | State pension | 1824 |
| advisor-16 | 6a1f8ffc901fc6abfb096efe | income | Inheritance | 65000 |
| advisor-16 | 6a1f8ffc901fc6abfb096efe | expense | Living costs | 858 |
| advisor-16 | 6a1f8ffc901fc6abfb096efe | expense | Housing | 1352 |
| advisor-17 | 6a1f8ffe901fc6abfb09703c | income | Salary | 5600 |
| advisor-17 | 6a1f8ffe901fc6abfb09703c | income | State pension | 2128 |
| advisor-17 | 6a1f8ffe901fc6abfb09703c | income | Inheritance | 65000 |
| advisor-17 | 6a1f8ffe901fc6abfb09703c | expense | Living costs | 1056 |
| advisor-17 | 6a1f8ffe901fc6abfb09703c | expense | Housing | 1664 |
| advisor-18 | 6a1f8ff8901fc6abfb096d5f | income | Salary | 5600 |
| advisor-18 | 6a1f8ff8901fc6abfb096d5f | income | State pension | 2128 |
| advisor-18 | 6a1f8ff8901fc6abfb096d5f | income | Inheritance | 65000 |
| advisor-18 | 6a1f8ff8901fc6abfb096d5f | expense | Living costs | 1056 |
| advisor-18 | 6a1f8ff8901fc6abfb096d5f | expense | Housing | 1664 |
| advisor-19 | 6a1f8ffe901fc6abfb097053 | income | Salary | 4200 |
| advisor-19 | 6a1f8ffe901fc6abfb097053 | income | State pension | 1596 |
| advisor-19 | 6a1f8ffe901fc6abfb097053 | income | Inheritance | 65000 |
| advisor-19 | 6a1f8ffe901fc6abfb097053 | expense | Living costs | 809 |
| advisor-19 | 6a1f8ffe901fc6abfb097053 | expense | Housing | 1274 |
