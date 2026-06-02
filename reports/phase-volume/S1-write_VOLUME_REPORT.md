### 1_run_metadata
| field | value |
|-------|-------|
| scenario | S1 |
| phase_a_run_tag (requested) | S1-write-20260602-1505 |
| phase_b_run_tag (requested) | S1-write-20260602-1505-read-v2 |
| phase_a_run_tag (resolved) | S1-write |
| phase_b_run_tag (resolved) | S1-read |
| signoff_fleet_file (requested) | n/a — not found |
| signoff_fleet_file (resolved) | reports/phase-volume/S1-write_signoff-fleet.json |
| run_metadata_file (requested) | n/a — not found |
| run_metadata_file (resolved) | reports/phase-a/S1-write/run-metadata.json |
| slo_summary_fleet_a (requested) | n/a — not found |
| slo_summary_fleet_a (resolved) | reports/phase-a/S1-write/slo-summary-fleet.json |
| slo_summary_fleet_b (requested) | n/a — not found |
| slo_summary_fleet_b (resolved) | n/a |
| slo_summary_b (resolved) | reports/phase-b/S1-read/slo-summary.json |
| journey_summary (resolved) | reports/journeys/k6-journey-advisor-critical-summary.json |
| profile_file (resolved) | data/scenarios/profile_20u_1c_1p.json |
| volumeScenario | S1 |
| userMode | fixed |
| advisors | 20 |
| concurrency | 20 |
| clientsPerAdvisor | 1 |
| plansPerClient | 1 |
| expectedClients | 20 |
| expectedPlans | 20 |
| runElapsedSec | 122.7 |
| manifestCollected | 400 |
| sloCollected | 400 |
| signoff_generatedAt | 2026-06-02T18:20:18.238Z |
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
| journey_create_client_duration | 20 | 0 | 20 |  | 1000 | 3000 |
| journey_create_base_plan_duration | 20 | 0 | 20 |  | 2000 | 3000 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 1955 | 1045.3 |
| POST /api/v1/cashflows | 4 | 16 | 20 | advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-19 | 38 | 6098 |
| GET /api/v1/Reports/{cashflowId} | 20 | 0 | 20 |  | 1575 | 1425.1 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 0 | max (retro) | no | 4000 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1000 | max (retro) | no | 4000 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 304.7 | max (retro) | no | 2695 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 612.4 | max (retro) | no | 3388 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 458.4 | max (retro) | no | 2542 |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 1000 | max (retro) | no | 3000 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1000 | max (retro) | no | 4000 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 268.7 | max (retro) | no | 2731 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 642.7 | max (retro) | no | 3357 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 589 | max (retro) | no | 2411 |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2000 | max (retro) | no | 3000 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1014.1 | max (retro) | no | 1986 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5091.4 | max (retro) | yes | -1091 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 905.1 | max (retro) | no | 2095 |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 903 | max (retro) | no | 2097 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4078.1 | max (retro) | yes | -78 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1425.1 | max (retro) | no | 1575 |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1008.8 | max (retro) | no | 1991 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5033.2 | max (retro) | yes | -1033 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 398.6 | max (retro) | no | 2601 |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2000 | max (retro) | no | 3000 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 929.3 | max (retro) | no | 2071 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4994.9 | max (retro) | yes | -995 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 617 | max (retro) | no | 2383 |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2000 | max (retro) | no | 3000 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 929.9 | max (retro) | no | 2070 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5007.4 | max (retro) | yes | -1007 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 433.2 | max (retro) | no | 2567 |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 256 | max (retro) | no | 2744 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3961.9 | max (retro) | no | 38 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1071.2 | max (retro) | no | 1929 |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1002.8 | max (retro) | no | 1997 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5076.7 | max (retro) | yes | -1077 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 588.6 | max (retro) | no | 2411 |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 765.4 | max (retro) | no | 2235 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6093 | max (retro) | yes | -2093 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1021 | max (retro) | no | 1979 |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1013.6 | max (retro) | no | 1986 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5040.5 | max (retro) | yes | -1041 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1003.7 | max (retro) | no | 1996 |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 248.7 | max (retro) | no | 2751 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5070.5 | max (retro) | yes | -1070 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1068.9 | max (retro) | no | 1931 |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 774.7 | max (retro) | no | 2225 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6098 | max (retro) | yes | -2098 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 774.5 | max (retro) | no | 2225 |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1045.3 | max (retro) | no | 1955 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4945.4 | max (retro) | yes | -945 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 873.1 | max (retro) | no | 2127 |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2000 | max (retro) | no | 3000 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 894.6 | max (retro) | no | 2105 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6027.9 | max (retro) | yes | -2028 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 876.4 | max (retro) | no | 2124 |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2000 | max (retro) | no | 3000 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 897 | max (retro) | no | 2103 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5978.7 | max (retro) | yes | -1979 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1372.3 | max (retro) | no | 1628 |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 2000 | max (retro) | no | 2000 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1025.2 | max (retro) | no | 1975 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5948.8 | max (retro) | yes | -1949 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 408.2 | max (retro) | no | 2592 |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 272 | max (retro) | no | 2728 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6067 | max (retro) | yes | -2067 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 386.8 | max (retro) | no | 2613 |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 1000 | max (retro) | no | 3000 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3000 | max (retro) | no | 2000 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 814 | max (retro) | no | 2186 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3676.3 | max (retro) | no | 324 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 1018.7 | max (retro) | no | 1981 |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 3000 | max (retro) | no | 1000 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2000 | max (retro) | no | 3000 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 924 | max (retro) | no | 2076 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5010.6 | max (retro) | yes | -1011 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | 641.7 | max (retro) | no | 2358 |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 2184 | 316 |
| full_journey_duration | 0 | 20 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 13790 |
| GET /api/v1/Clients/{advisorId}/all | 20 | 0 | 20 |  | 1283 | 1216.6 |
| GET /api/v1/client/{clientId}/cashflows | 20 | 0 | 20 |  | 466 | 2033.6 |
| GET /api/v1/cashflows/{cashflowId} | 20 | 0 | 20 |  | 1017 | 1983 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 261 | p95 | no | 2239 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 11163 | p95 | yes | -8663 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 469.6 | max | no | 2030 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 2033.6 | max | no | 466 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1624.6 | max | no | 1375 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 301 | p95 | no | 2199 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 12914 | p95 | yes | -10414 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 504.8 | max | no | 1995 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 431.2 | max | no | 2069 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1074.6 | max | no | 1925 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 284 | p95 | no | 2216 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 11916 | p95 | yes | -9416 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 454.9 | max | no | 2045 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 305.9 | max | no | 2194 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 539.6 | max | no | 2460 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 276 | p95 | no | 2224 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 12856 | p95 | yes | -10356 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 477.1 | max | no | 2023 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 542.8 | max | no | 1957 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1282 | max | no | 1718 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 264 | p95 | no | 2236 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 13117 | p95 | yes | -10617 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 484.4 | max | no | 2016 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 725.5 | max | no | 1775 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1342.1 | max | no | 1658 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 10116 | p95 | yes | -7616 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 470.8 | max | no | 2029 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 476 | max | no | 2024 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1757.1 | max | no | 1243 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 264 | p95 | no | 2236 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 13509 | p95 | yes | -11009 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 665.8 | max | no | 1834 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 356.4 | max | no | 2144 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1841.4 | max | no | 1159 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 272 | p95 | no | 2228 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 10873 | p95 | yes | -8373 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1216.6 | max | no | 1283 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 590.6 | max | no | 1909 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1423.2 | max | no | 1577 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 280 | p95 | no | 2220 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 13790 | p95 | yes | -11290 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 462.5 | max | no | 2037 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 493.9 | max | no | 2006 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1657.5 | max | no | 1343 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 316 | p95 | no | 2184 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 12058 | p95 | yes | -9558 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 446.2 | max | no | 2054 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 353 | max | no | 2147 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1983 | max | no | 1017 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 272 | p95 | no | 2228 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 11678 | p95 | yes | -9178 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 866 | max | no | 1634 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 682.3 | max | no | 1818 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1624.9 | max | no | 1375 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 312 | p95 | no | 2188 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 12248 | p95 | yes | -9748 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 454.3 | max | no | 2046 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 685 | max | no | 1815 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1362.3 | max | no | 1638 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 298 | p95 | no | 2202 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 10313 | p95 | yes | -7813 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 470.2 | max | no | 2030 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 740.1 | max | no | 1760 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1308 | max | no | 1692 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 11490 | p95 | yes | -8990 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 541.2 | max | no | 1959 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 666.7 | max | no | 1833 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1036.5 | max | no | 1964 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 257 | p95 | no | 2243 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 10569 | p95 | yes | -8069 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 516.5 | max | no | 1983 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 942.2 | max | no | 1558 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 608.9 | max | no | 2391 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 294 | p95 | no | 2206 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 12644 | p95 | yes | -10144 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 641 | max | no | 1859 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 590.1 | max | no | 1910 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 607.3 | max | no | 2393 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 302 | p95 | no | 2198 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 12605 | p95 | yes | -10105 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 458.5 | max | no | 2041 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 599 | max | no | 1901 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1593.7 | max | no | 1406 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 280 | p95 | no | 2220 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 12445 | p95 | yes | -9945 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 489.7 | max | no | 2010 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 717 | max | no | 1783 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1761 | max | no | 1239 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 275 | p95 | no | 2225 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 13438 | p95 | yes | -10938 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 581 | max | no | 1919 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 704.3 | max | no | 1796 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 723.3 | max | no | 2277 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 277 | p95 | no | 2223 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 13432 | p95 | yes | -10932 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 429.7 | max | no | 2070 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 335 | max | no | 2165 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 953 | max | no | 2047 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |

### 7_errors
| phase | auth_failure_rate | business_failure_rate | http_req_failed |
|-------|-------------------|----------------------|-----------------|
| A | n/a | n/a | n/a |
| B | 0 | 0 | 0 |

### 8_exits
| phase | runner_exit_code | k6_exit_0 | k6_exit_99 | failed_job_ids |
|-------|------------------|-----------|------------|----------------|
| A | n/a | 20 | 0 |  |
| B | 99 | 0 | 1 | |

### 9_fleet_slo_gate
| phase | passed | failed | failed_shard_ids |
|-------|--------|--------|------------------|
| A | 4 | 16 | advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-19 |
| B | 0 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-12 | POST /api/v1/cashflows | 6098 | 4000 | -2098 |
| 2 | advisor-09 | POST /api/v1/cashflows | 6093 | 4000 | -2093 |
| 3 | advisor-17 | POST /api/v1/cashflows | 6067 | 4000 | -2067 |
| 4 | advisor-14 | POST /api/v1/cashflows | 6027.9 | 4000 | -2028 |
| 5 | advisor-15 | POST /api/v1/cashflows | 5978.7 | 4000 | -1979 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-08 | full_journey_duration | 13790 | 15000 | -11290 |
| 2 | advisor-06 | full_journey_duration | 13509 | 15000 | -11009 |
| 3 | advisor-18 | full_journey_duration | 13438 | 15000 | -10938 |
| 4 | advisor-19 | full_journey_duration | 13432 | 15000 | -10932 |
| 5 | advisor-04 | full_journey_duration | 13117 | 15000 | -10617 |

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
