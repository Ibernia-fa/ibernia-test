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
| volumeScenario | S1 |
| userMode | fixed |
| advisors | 20 |
| concurrency | 20 |
| clientsPerAdvisor | 1 |
| plansPerClient | 1 |
| expectedClients | 20 |
| expectedPlans | 20 |
| runElapsedSec | 118.5 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-03T15:15:36.715Z |
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
| journey_create_client_duration | 20 | 0 | 20 |  | 236 | 3764 |
| journey_create_base_plan_duration | 16 | 4 | 20 | advisor-07, advisor-10, advisor-12, advisor-15 | 937 | 6166 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 2010 | 989.8 |
| POST /api/v1/cashflows | 12 | 8 | 20 | advisor-02, advisor-06, advisor-07, advisor-08, advisor-10, advisor-11, advisor-12, advisor-15 | 8 | 6159.4 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 971 | p95 | no | 3029 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 889 | p95 | no | 4111 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 337.1 | max | no | 2663 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 887 | max | no | 3113 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 895 | p95 | no | 3105 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 572 | p95 | no | 4428 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 274.3 | max | no | 2726 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 562.7 | max | no | 3437 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 1886 | p95 | no | 2114 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4063 | p95 | no | 937 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 290.7 | max | no | 2709 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4052.5 | max | yes | -53 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 1073 | p95 | no | 2927 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 604 | p95 | no | 4396 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 316.9 | max | no | 2683 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 599 | max | no | 3401 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 987 | p95 | no | 3013 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 963 | p95 | no | 4037 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 283.8 | max | no | 2716 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 960.9 | max | no | 3039 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 2631 | p95 | no | 1369 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3093 | p95 | no | 1907 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 607.7 | max | no | 2392 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3088.2 | max | no | 912 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 1678 | p95 | no | 2322 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4041 | p95 | no | 959 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 565.1 | max | no | 2435 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4031.5 | max | yes | -31 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 1861 | p95 | no | 2139 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 6026 | p95 | yes | -1026 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 725.5 | max | no | 2275 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6018.2 | max | yes | -2018 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 2115 | p95 | no | 1885 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4013 | p95 | no | 987 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 939.1 | max | no | 2061 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4002.9 | max | yes | -3 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 1261 | p95 | no | 2739 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3035 | p95 | no | 1965 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 311 | max | no | 2689 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3030.2 | max | no | 970 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 1187 | p95 | no | 2813 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 6023 | p95 | yes | -1023 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 314 | max | no | 2686 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6017.7 | max | yes | -2018 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 2624 | p95 | no | 1376 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4011 | p95 | no | 989 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 950.9 | max | no | 2049 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4010 | max | yes | -10 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 1783 | p95 | no | 2217 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 5593 | p95 | yes | -593 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 305 | max | no | 2695 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5586.6 | max | yes | -1587 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 3764 | p95 | no | 236 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3994 | p95 | no | 1006 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 309.9 | max | no | 2690 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3992.1 | max | no | 8 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 962 | p95 | no | 3038 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2005 | p95 | no | 2995 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 282 | max | no | 2718 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 1996.8 | max | no | 2003 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 2098 | p95 | no | 1902 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 6166 | p95 | yes | -1166 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 989.8 | max | no | 2010 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 6159.4 | max | yes | -2159 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 1014 | p95 | no | 2986 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 925 | p95 | no | 4075 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 307.3 | max | no | 2693 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 922.5 | max | no | 3078 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 2547 | p95 | no | 1453 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2979 | p95 | no | 2021 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 318.2 | max | no | 2682 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2975.6 | max | no | 1024 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 1388 | p95 | no | 2612 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2918 | p95 | no | 2082 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 314.5 | max | no | 2685 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2912.8 | max | no | 1087 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 1730 | p95 | no | 2270 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2686 | p95 | no | 2314 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 300.4 | max | no | 2700 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2683.9 | max | no | 1316 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 2160 | 340 |
| full_journey_duration | 18 | 2 | 20 | advisor-05, advisor-08 | 88 | 15261 |
| GET /api/v1/Clients/{advisorId}/all | 19 | 1 | 20 | advisor-18 | 878 | 3430.1 |
| GET /api/v1/client/{clientId}/cashflows | 20 | 0 | 20 |  | 1584 | 915.9 |
| GET /api/v1/cashflows/{cashflowId} | 20 | 0 | 20 |  | 595 | 2404.6 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 296 | p95 | no | 2204 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 12684 | p95 | no | 2316 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 390.3 | max | no | 2110 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 523.1 | max | no | 1977 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1588.9 | max | no | 1411 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 253 | p95 | no | 2247 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 14912 | p95 | no | 88 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 332.9 | max | no | 2167 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 691.6 | max | no | 1808 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1437.2 | max | no | 1563 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 274 | p95 | no | 2226 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 13568 | p95 | no | 1432 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 654 | max | no | 1846 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 915.9 | max | no | 1584 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1480.4 | max | no | 1520 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 278 | p95 | no | 2222 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 12522 | p95 | no | 2478 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 677.5 | max | no | 1822 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 491.6 | max | no | 2008 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1361.4 | max | no | 1639 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 340 | p95 | no | 2160 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 11900 | p95 | no | 3100 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1141.3 | max | no | 1359 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 681 | max | no | 1819 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1171.5 | max | no | 1829 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 282 | p95 | no | 2218 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 15126 | p95 | yes | -126 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 389.5 | max | no | 2111 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 357 | max | no | 2143 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1351.3 | max | no | 1649 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 259 | p95 | no | 2241 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 13658 | p95 | no | 1342 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 646.4 | max | no | 1854 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 331.9 | max | no | 2168 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1441.4 | max | no | 1559 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 256 | p95 | no | 2244 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 13929 | p95 | no | 1071 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 471.7 | max | no | 2028 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 452.8 | max | no | 2047 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1280.1 | max | no | 1720 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 270 | p95 | no | 2230 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 15261 | p95 | yes | -261 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 674.8 | max | no | 1825 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 333 | max | no | 2167 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1325.6 | max | no | 1674 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 281 | p95 | no | 2219 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 11751 | p95 | no | 3249 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1621.7 | max | no | 878 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 668.9 | max | no | 1831 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1449.6 | max | no | 1550 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 308 | p95 | no | 2192 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 11678 | p95 | no | 3322 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 376.3 | max | no | 2124 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 339.6 | max | no | 2160 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1316.8 | max | no | 1683 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 283 | p95 | no | 2217 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 12405 | p95 | no | 2595 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 474 | max | no | 2026 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 693.4 | max | no | 1807 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1305.9 | max | no | 1694 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 290 | p95 | no | 2210 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 11597 | p95 | no | 3403 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 459.9 | max | no | 2040 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 347.7 | max | no | 2152 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1402.8 | max | no | 1597 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 270 | p95 | no | 2230 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 14462 | p95 | no | 538 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 476.2 | max | no | 2024 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 315.7 | max | no | 2184 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1410.4 | max | no | 1590 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 331 | p95 | no | 2169 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 13076 | p95 | no | 1924 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 488 | max | no | 2012 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 412.2 | max | no | 2088 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1424.4 | max | no | 1576 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 289 | p95 | no | 2211 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 10358 | p95 | no | 4642 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 390.1 | max | no | 2110 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 474.2 | max | no | 2026 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1746.2 | max | no | 1254 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 259 | p95 | no | 2241 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 13595 | p95 | no | 1405 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 802.3 | max | no | 1698 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 371.9 | max | no | 2128 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1263.6 | max | no | 1736 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 302 | p95 | no | 2198 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 10281 | p95 | no | 4719 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 362.9 | max | no | 2137 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 825.9 | max | no | 1674 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1607.7 | max | no | 1392 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 309 | p95 | no | 2191 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 13372 | p95 | no | 1628 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 3430.1 | max | yes | -930 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 641.1 | max | no | 1859 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1384.5 | max | no | 1616 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 310 | p95 | no | 2190 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 10319 | p95 | no | 4681 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 352.8 | max | no | 2147 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 634.9 | max | no | 1865 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2404.6 | max | no | 595 |
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
| A | 12 | 8 | advisor-02, advisor-06, advisor-07, advisor-08, advisor-10, advisor-11, advisor-12, advisor-15 |
| B | 17 | 3 | advisor-05, advisor-08, advisor-18 |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-17 | journey_calculate_projection_duration | 33503 | 5000 | -28503 |
| 2 | advisor-03 | journey_calculate_projection_duration | 33377 | 5000 | -28377 |
| 3 | advisor-16 | journey_calculate_projection_duration | 32557 | 5000 | -27557 |
| 4 | advisor-04 | journey_calculate_projection_duration | 32296 | 5000 | -27296 |
| 5 | advisor-14 | journey_calculate_projection_duration | 31413 | 5000 | -26413 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-18 | GET /api/v1/Clients/{advisorId}/all | 3430.1 | 2500 | -930 |
| 2 | advisor-08 | full_journey_duration | 15261 | 15000 | -261 |
| 3 | advisor-05 | full_journey_duration | 15126 | 15000 | -126 |
| 4 | advisor-01 | full_journey_duration | 14912 | 15000 | 88 |
| 5 | advisor-13 | full_journey_duration | 14462 | 15000 | 538 |

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
| n/a | profile not enriched — run tools/enrich-volume-profile-seed.mjs |

### 14_seed_coverage
| metric | value |
|--------|-------|
| advisors_in_profile | 20 |
| plans_in_profile | 20 |
| plans_with_seed_block | n/a |
| plans_missing_seed_block | 20 |
| seed_enriched | no |

### 15_seed_per_plan
| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |
|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|
| advisor-00 | User01@gmail.com | 6a203f6fd6592c9765559a46 | 6a203f70d6592c9765559a4e | Long-term retirement plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a203f76d6592c9765559b39 | 6a203f77d6592c9765559b5c | Qualification pathway plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a203fb1d6592c9765559e58 | 6a203fb4d6592c976555a038 | Infrastructure career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a203fafd6592c9765559deb | 6a203fb0d6592c9765559e10 | Hospitality business plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a203fb0d6592c9765559df9 | 6a203fb1d6592c9765559e98 | First-time investor plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a203fb1d6592c9765559e7f | 6a203fb5d6592c976555a0a7 | Healthcare career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a203fb1d6592c9765559e7d | 6a203fb4d6592c976555a035 | Variable income plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a203fb2d6592c9765559f03 | 6a203fb5d6592c976555a0a1 | Remote work lifestyle plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a203fb2d6592c9765559efe | 6a203fb5d6592c976555a0a9 | Late-career consolidation plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a203fb1d6592c9765559e3a | 6a203fb3d6592c9765559f6d | Executive wealth plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a203fb0d6592c9765559dfb | 6a203fb7d6592c976555a188 | Studio succession plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a203fb2d6592c9765559f05 | 6a203fb6d6592c976555a14c | Career growth savings plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a203fb1d6592c9765559e65 | 6a203fb3d6592c9765559f89 | Mid-life financial review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a203fb1d6592c9765559e72 | 6a203fb6d6592c976555a155 | Early career wealth plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a203fb0d6592c9765559df4 | 6a203fb1d6592c9765559e67 | Business owner succession plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a203fb2d6592c9765559f01 | 6a203fb5d6592c976555a0b2 | Flexible career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a203fb0d6592c9765559df0 | 6a203fb1d6592c9765559e5a | Family security plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a203fafd6592c9765559dee | 6a203fb3d6592c9765559f6f | Pre-retirement transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a203fb0d6592c9765559e16 | 6a203fb3d6592c9765559f72 | Wealth accumulation plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a203fb1d6592c9765559e6f | 6a203fb4d6592c9765559fb6 | Long-term retirement plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

### 16_seed_money_in_out_detail
| shard_id | cashflow_id | row_type | description | amount |
|----------|-------------|----------|-------------|--------|
| n/a | n/a | n/a | n/a | n/a |

### 17_concurrency
| metric | value |
|--------|-------|
| peak_active_users | 1 |
| avg_active_users | n/a |
| peak_in_flight_requests | 7 |
| avg_in_flight_requests | n/a |
| avg_calls_per_iteration | 11 |
| max_calls_per_iteration | 11 |

### 18_throughput
| metric | value |
|--------|-------|
| avg_req_per_sec | 17.11 |
| total_http_requests | 10435 |
| total_iterations | 948 |
| requests_per_user | 522 |
| vus_max | 20 |

### 19_breaking_point
| field | value |
|-------|-------|
| reached | yes |
| status | Reached |
| reasons | full_journey_p95=15085ms>15000ms |

### 20_capacity_assessment
| field | value |
|-------|-------|
| status | Saturated |
| detail | full_journey_p95=15085ms>15000ms |

### 21_endpoint_slowest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/cashflows/{cashflowId}/income-expense/financial | n/a | 1558 | 1050 | 2819 |
| 2 | GET /api/v1/wealth/{cashflowId} | n/a | 1530 | 943 | 2708 |
| 3 | GET /api/v1/cashflows/{cashflowId}/timelines | n/a | 1462 | 864 | 2405 |
| 4 | GET /api/v1/cashflows/{cashflowId}/financial | n/a | 1420 | 799 | 2708 |
| 5 | GET /api/v1/Events/default | n/a | 1297 | 560 | 2708 |

### 22_endpoint_fastest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/client/{clientId}/cashflows | n/a | 340 | 299 | 916 |
| 2 | GET /api/v1/Clients/{id} | n/a | 344 | 298 | 1740 |
| 3 | GET /api/v1/Clients/{advisorId}/all | n/a | 350 | 305 | 3430 |
| 4 | GET /api/v1/Events/custom | n/a | 1056 | 634 | 1399 |
| 5 | GET /api/v1/cashflows/{cashflowId} | n/a | 1235 | 485 | 2405 |
