### 1_run_metadata
| field | value |
|-------|-------|
| scenario | S3 |
| phase_a_run_tag (requested) | S3-write |
| phase_b_run_tag (requested) | S3-read |
| phase_a_run_tag (resolved) | S3-write |
| phase_b_run_tag (resolved) | S3-read |
| signoff_fleet_file (requested) | reports/phase-volume/S3-write_signoff-fleet.json |
| signoff_fleet_file (resolved) | reports/phase-volume/S3-write_signoff-fleet.json |
| run_metadata_file (requested) | reports/phase-a/S3-write/run-metadata.json |
| run_metadata_file (resolved) | reports/phase-a/S3-write/run-metadata.json |
| slo_summary_fleet_a (requested) | reports/phase-a/S3-write/slo-summary-fleet.json |
| slo_summary_fleet_a (resolved) | reports/phase-a/S3-write/slo-summary-fleet.json |
| slo_summary_fleet_b (requested) | n/a — not found |
| slo_summary_fleet_b (resolved) | n/a |
| slo_summary_b (resolved) | reports/phase-b/S3-read/slo-summary.json |
| journey_summary (resolved) | reports/journeys/k6-journey-advisor-critical-summary.json |
| profile_file (resolved) | data/scenarios/profile_20u_10c_4p.json |
| volumeScenario | S3 |
| userMode | fixed |
| advisors | 20 |
| concurrency | 20 |
| clientsPerAdvisor | 10 |
| plansPerClient | 4 |
| expectedClients | 200 |
| expectedPlans | 800 |
| runElapsedSec | 2021.5 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-03T05:25:41.953Z |
| slo_config | config/volume-api-slo.json |

### 2_data_gates
| gate | expected | actual | pass |
|------|----------|--------|------|
| clients (write) | 200 | 200 | yes |
| plans (write) | 800 | 800 | yes |
| shards | 20 | 20 | yes |
| manifest validation | n/a | passed=true | yes |

### 3_phase_a_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_create_client_duration | 20 | 0 | 20 |  | 39 | 3961 |
| journey_create_base_plan_duration | 20 | 0 | 20 |  | 1016 | 3984 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 1967 | 1033.1 |
| POST /api/v1/cashflows | 0 | 20 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | n/a | 5908.4 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 3908 | p95 | no | 92 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1907 | p95 | no | 3093 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1020.5 | max | no | 1979 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4971.6 | max | yes | -972 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 3931 | p95 | no | 69 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2946 | p95 | no | 2054 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 990.8 | max | no | 2009 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5074 | max | yes | -1074 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 3023 | p95 | no | 977 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3984 | p95 | no | 1016 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1002.8 | max | no | 1997 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5048 | max | yes | -1048 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 2963 | p95 | no | 1037 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1081 | p95 | no | 3919 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1014.7 | max | no | 1985 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5015.4 | max | yes | -1015 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 3961 | p95 | no | 39 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2046 | p95 | no | 2954 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 988.1 | max | no | 2012 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5050.1 | max | yes | -1050 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 3006 | p95 | no | 994 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2082 | p95 | no | 2918 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 996.8 | max | no | 2003 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5004.8 | max | yes | -1005 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 3010 | p95 | no | 990 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3933 | p95 | no | 1067 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 990.7 | max | no | 2009 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5032.7 | max | yes | -1033 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 3033 | p95 | no | 967 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3068 | p95 | no | 1932 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1021.8 | max | no | 1978 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5017.4 | max | yes | -1017 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 3077 | p95 | no | 923 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2020 | p95 | no | 2980 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1030.7 | max | no | 1969 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5045.3 | max | yes | -1045 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 3938 | p95 | no | 62 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3115 | p95 | no | 1885 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1012.8 | max | no | 1987 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5027.1 | max | yes | -1027 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 2996 | p95 | no | 1004 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3914 | p95 | no | 1086 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 982.7 | max | no | 2017 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5013.2 | max | yes | -1013 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 3879 | p95 | no | 121 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2937 | p95 | no | 2063 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 974.7 | max | no | 2025 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4991.3 | max | yes | -991 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 2901 | p95 | no | 1099 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1987 | p95 | no | 3013 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1006.7 | max | no | 1993 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5041.7 | max | yes | -1042 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 2340 | p95 | no | 1660 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3959 | p95 | no | 1041 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1012.8 | max | no | 1987 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5019.7 | max | yes | -1020 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 3927 | p95 | no | 73 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 684 | p95 | no | 4316 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1008.9 | max | no | 1991 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5033.7 | max | yes | -1034 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 2958 | p95 | no | 1042 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1158 | p95 | no | 3842 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1033.1 | max | no | 1967 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5068.8 | max | yes | -1069 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 3783 | p95 | no | 217 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2110 | p95 | no | 2890 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1010.4 | max | no | 1990 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5003.9 | max | yes | -1004 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 2816 | p95 | no | 1184 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3098 | p95 | no | 1902 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1030.8 | max | no | 1969 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4954.5 | max | yes | -954 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 3032 | p95 | no | 968 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1071 | p95 | no | 3929 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1005.1 | max | no | 1995 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5003.2 | max | yes | -1003 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 3941 | p95 | no | 59 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3927 | p95 | no | 1073 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1001.7 | max | no | 1998 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 5908.4 | max | yes | -1908 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 462 | 2038.2 |
| full_journey_duration | 20 | 0 | 20 |  | 4729 | 10271 |
| GET /api/v1/Clients/{advisorId}/all | 20 | 0 | 20 |  | 462 | 2038.2 |
| GET /api/v1/client/{clientId}/cashflows | 20 | 0 | 20 |  | 1602 | 898.2 |
| GET /api/v1/cashflows/{cashflowId} | 20 | 0 | 20 |  | 1641 | 1358.8 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 668.2 | max (retro) | no | 1832 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 9017 | max (retro) | no | 5983 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 668.2 | max (retro) | no | 1832 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 631 | max (retro) | no | 1869 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 769.5 | max (retro) | no | 2230 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 2038.2 | max (retro) | no | 462 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 5738 | max (retro) | no | 9262 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2038.2 | max (retro) | no | 462 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 318.3 | max (retro) | no | 2182 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 945.4 | max (retro) | no | 2055 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 821.8 | max (retro) | no | 1678 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 6867 | max (retro) | no | 8133 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 821.8 | max (retro) | no | 1678 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 585.7 | max (retro) | no | 1914 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 634.8 | max (retro) | no | 2365 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 524.7 | max (retro) | no | 1975 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 7576 | max (retro) | no | 7424 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 524.7 | max (retro) | no | 1975 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 432.7 | max (retro) | no | 2067 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 707.8 | max (retro) | no | 2292 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 1979.2 | max (retro) | no | 521 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 8473 | max (retro) | no | 6527 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1979.2 | max (retro) | no | 521 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 442.1 | max (retro) | no | 2058 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 685.5 | max (retro) | no | 2314 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 489.7 | max (retro) | no | 2010 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 10004 | max (retro) | no | 4996 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 489.7 | max (retro) | no | 2010 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 322.8 | max (retro) | no | 2177 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1277.9 | max (retro) | no | 1722 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 596.5 | max (retro) | no | 1904 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 6393 | max (retro) | no | 8607 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 596.5 | max (retro) | no | 1904 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 534 | max (retro) | no | 1966 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 973.4 | max (retro) | no | 2027 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 422.8 | max (retro) | no | 2077 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 8272 | max (retro) | no | 6728 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 422.8 | max (retro) | no | 2077 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 441.3 | max (retro) | no | 2059 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 905.2 | max (retro) | no | 2095 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 572.3 | max (retro) | no | 1928 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 9897 | max (retro) | no | 5103 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 572.3 | max (retro) | no | 1928 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 344.4 | max (retro) | no | 2156 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1193.1 | max (retro) | no | 1807 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 560.6 | max (retro) | no | 1939 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 7509 | max (retro) | no | 7491 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 560.6 | max (retro) | no | 1939 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 727.5 | max (retro) | no | 1773 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 828.9 | max (retro) | no | 2171 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 698.6 | max (retro) | no | 1801 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 9381 | max (retro) | no | 5619 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 698.6 | max (retro) | no | 1801 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 343.1 | max (retro) | no | 2157 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 817.8 | max (retro) | no | 2182 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 465.2 | max (retro) | no | 2035 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 6011 | max (retro) | no | 8989 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 465.2 | max (retro) | no | 2035 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 449.5 | max (retro) | no | 2050 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 472.6 | max (retro) | no | 2527 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 423.7 | max (retro) | no | 2076 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 9212 | max (retro) | no | 5788 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 423.7 | max (retro) | no | 2076 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 664.6 | max (retro) | no | 1835 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1358.8 | max (retro) | no | 1641 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 451.9 | max (retro) | no | 2048 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 8255 | max (retro) | no | 6745 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 451.9 | max (retro) | no | 2048 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 483.6 | max (retro) | no | 2016 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 701.7 | max (retro) | no | 2298 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 455.6 | max (retro) | no | 2044 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 7067 | max (retro) | no | 7933 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 455.6 | max (retro) | no | 2044 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 807.2 | max (retro) | no | 1693 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 808.8 | max (retro) | no | 2191 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 543 | max (retro) | no | 1957 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 8956 | max (retro) | no | 6044 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 543 | max (retro) | no | 1957 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 682.9 | max (retro) | no | 1817 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 460.5 | max (retro) | no | 2539 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 538.2 | max (retro) | no | 1962 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 10271 | max (retro) | no | 4729 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 538.2 | max (retro) | no | 1962 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 831.9 | max (retro) | no | 1668 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 726.2 | max (retro) | no | 2274 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 436.1 | max (retro) | no | 2064 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 10222 | max (retro) | no | 4778 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 436.1 | max (retro) | no | 2064 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 898.2 | max (retro) | no | 1602 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 706.9 | max (retro) | no | 2293 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 422.5 | max (retro) | no | 2078 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 8238 | max (retro) | no | 6762 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 422.5 | max (retro) | no | 2078 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 373.7 | max (retro) | no | 2126 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 836.3 | max (retro) | no | 2164 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 438.3 | max (retro) | no | 2062 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 9092 | max (retro) | no | 5908 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 438.3 | max (retro) | no | 2062 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 621.4 | max (retro) | no | 1879 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 822.6 | max (retro) | no | 2177 |
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
| A | 0 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 |
| B | 20 | 0 | n/a |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-00 | journey_calculate_projection_duration | 44176 | 5000 | -39176 |
| 2 | advisor-01 | journey_calculate_projection_duration | 43026 | 5000 | -38026 |
| 3 | advisor-04 | journey_calculate_projection_duration | 39016 | 5000 | -34016 |
| 4 | advisor-17 | journey_calculate_projection_duration | 38015 | 5000 | -33015 |
| 5 | advisor-11 | journey_calculate_projection_duration | 37038 | 5000 | -32038 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-01 | journey_dashboard_load_duration | 2038.2 | 2500 | 462 |
| 2 | advisor-01 | GET /api/v1/Clients/{advisorId}/all | 2038.2 | 2500 | 462 |
| 3 | advisor-04 | journey_dashboard_load_duration | 1979.2 | 2500 | 521 |
| 4 | advisor-04 | GET /api/v1/Clients/{advisorId}/all | 1979.2 | 2500 | 521 |
| 5 | advisor-17 | GET /api/v1/client/{clientId}/cashflows | 898.2 | 2500 | 1602 |

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
| plans_in_profile | 800 |
| plans_with_seed_block | n/a |
| plans_missing_seed_block | 800 |
| seed_enriched | no |

### 15_seed_per_plan
| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |
|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|
| advisor-00 | User01@gmail.com | 6a1faf54901fc6abfb10fa91 | 6a1faf55901fc6abfb10fa9b | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf54901fc6abfb10fa91 | 6a1faf61901fc6abfb10fc64 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf54901fc6abfb10fa91 | 6a1faf6f901fc6abfb10fe9d | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf54901fc6abfb10fa91 | 6a1faf7b901fc6abfb11019a | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf8a901fc6abfb110636 | 6a1faf8f901fc6abfb11072b | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf8a901fc6abfb110636 | 6a1fafb6901fc6abfb11115f | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf8a901fc6abfb110636 | 6a1fafe2901fc6abfb1127d6 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1faf8a901fc6abfb110636 | 6a1fb012901fc6abfb114652 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb041901fc6abfb1164ba | 6a1fb046901fc6abfb116722 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb041901fc6abfb1164ba | 6a1fb074901fc6abfb118409 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb041901fc6abfb1164ba | 6a1fb0a3901fc6abfb11a079 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb041901fc6abfb1164ba | 6a1fb0d0901fc6abfb11bca0 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb101901fc6abfb11dbfb | 6a1fb105901fc6abfb11de1d | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb101901fc6abfb11dbfb | 6a1fb136901fc6abfb11fc9f | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb101901fc6abfb11dbfb | 6a1fb165901fc6abfb121921 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb101901fc6abfb11dbfb | 6a1fb195901fc6abfb123770 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb1c1901fc6abfb125351 | 6a1fb1c5901fc6abfb1255a0 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb1c1901fc6abfb125351 | 6a1fb1f1901fc6abfb1270f6 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb1c1901fc6abfb125351 | 6a1fb223901fc6abfb128fbf | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb1c1901fc6abfb125351 | 6a1fb252901fc6abfb12ad75 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb281901fc6abfb12cb13 | 6a1fb285901fc6abfb12cd5d | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb281901fc6abfb12cb13 | 6a1fb2b4901fc6abfb12eaba | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb281901fc6abfb12cb13 | 6a1fb2e2901fc6abfb1306ad | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb281901fc6abfb12cb13 | 6a1fb311901fc6abfb132463 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb341901fc6abfb134275 | 6a1fb344901fc6abfb13440a | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb341901fc6abfb134275 | 6a1fb373901fc6abfb136127 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb341901fc6abfb134275 | 6a1fb3a5901fc6abfb137fbc | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb341901fc6abfb134275 | 6a1fb3d5901fc6abfb139dee | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb401901fc6abfb13b9f7 | 6a1fb405901fc6abfb13bc17 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb401901fc6abfb13b9f7 | 6a1fb431901fc6abfb13d775 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb401901fc6abfb13b9f7 | 6a1fb463901fc6abfb13f5eb | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb401901fc6abfb13b9f7 | 6a1fb493901fc6abfb1413ed | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb4c3901fc6abfb143280 | 6a1fb4c8901fc6abfb1434ee | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb4c3901fc6abfb143280 | 6a1fb4f5901fc6abfb1450d0 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb4c3901fc6abfb143280 | 6a1fb528901fc6abfb14707f | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb4c3901fc6abfb143280 | 6a1fb55a901fc6abfb148ff3 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb587901fc6abfb14ac68 | 6a1fb58c901fc6abfb14af1f | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb587901fc6abfb14ac68 | 6a1fb5be901fc6abfb14ce0b | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb587901fc6abfb14ac68 | 6a1fb5f1901fc6abfb14edad | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a1fb587901fc6abfb14ac68 | 6a1fb620901fc6abfb150b36 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1faf6c901fc6abfb10fdf0 | 6a1faf6d901fc6abfb10fe06 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1faf6c901fc6abfb10fdf0 | 6a1faf79901fc6abfb1100f4 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1faf6c901fc6abfb10fdf0 | 6a1faf85901fc6abfb1103f0 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1faf6c901fc6abfb10fdf0 | 6a1fafab901fc6abfb110e87 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fafd0901fc6abfb111d57 | 6a1fafd4901fc6abfb111ea6 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fafd0901fc6abfb111d57 | 6a1fb000901fc6abfb113acb | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fafd0901fc6abfb111d57 | 6a1fb02d901fc6abfb11572c | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fafd0901fc6abfb111d57 | 6a1fb057901fc6abfb117185 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb085901fc6abfb118e5c | 6a1fb08a901fc6abfb1190ee | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb085901fc6abfb118e5c | 6a1fb0ba901fc6abfb11aedf | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb085901fc6abfb118e5c | 6a1fb0e8901fc6abfb11cb70 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb085901fc6abfb118e5c | 6a1fb11c901fc6abfb11ec70 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb149901fc6abfb12086c | 6a1fb14e901fc6abfb120acc | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb149901fc6abfb12086c | 6a1fb17c901fc6abfb1227e1 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb149901fc6abfb12086c | 6a1fb1ab901fc6abfb1244f3 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb149901fc6abfb12086c | 6a1fb1d8901fc6abfb1261ce | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb204901fc6abfb127d90 | 6a1fb208901fc6abfb127ed8 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb204901fc6abfb127d90 | 6a1fb239901fc6abfb129de3 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb204901fc6abfb127d90 | 6a1fb267901fc6abfb12bad0 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb204901fc6abfb127d90 | 6a1fb295901fc6abfb12d765 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb2c4901fc6abfb12f43e | 6a1fb2c8901fc6abfb12f69e | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb2c4901fc6abfb12f43e | 6a1fb2fa901fc6abfb1315f3 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb2c4901fc6abfb12f43e | 6a1fb32a901fc6abfb1333a4 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb2c4901fc6abfb12f43e | 6a1fb358901fc6abfb135081 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb388901fc6abfb136e11 | 6a1fb38c901fc6abfb137078 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb388901fc6abfb136e11 | 6a1fb3bb901fc6abfb138ddb | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb388901fc6abfb136e11 | 6a1fb3e9901fc6abfb13aab2 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb388901fc6abfb136e11 | 6a1fb415901fc6abfb13c5f8 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb445901fc6abfb13e384 | 6a1fb44a901fc6abfb13e62c | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb445901fc6abfb13e384 | 6a1fb478901fc6abfb1402b3 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb445901fc6abfb13e384 | 6a1fb4a8901fc6abfb142105 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb445901fc6abfb13e384 | 6a1fb4d9901fc6abfb143f83 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb506901fc6abfb145ba9 | 6a1fb50b901fc6abfb145e79 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb506901fc6abfb145ba9 | 6a1fb53c901fc6abfb147d09 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb506901fc6abfb145ba9 | 6a1fb56b901fc6abfb149a89 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb506901fc6abfb145ba9 | 6a1fb599901fc6abfb14b6c8 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb5c8901fc6abfb14d451 | 6a1fb5cd901fc6abfb14d6f4 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb5c8901fc6abfb14d451 | 6a1fb5fe901fc6abfb14f59d | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb5c8901fc6abfb14d451 | 6a1fb62c901fc6abfb151269 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a1fb5c8901fc6abfb14d451 | 6a1fb65c901fc6abfb15307c | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fafbe901fc6abfb1113e6 | 6a1fafc2901fc6abfb1114fb | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fafbe901fc6abfb1113e6 | 6a1fafee901fc6abfb112f9d | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fafbe901fc6abfb1113e6 | 6a1fb01b901fc6abfb114c5f | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fafbe901fc6abfb1113e6 | 6a1fb04b901fc6abfb116a19 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb079901fc6abfb118783 | 6a1fb07d901fc6abfb118946 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb079901fc6abfb118783 | 6a1fb0ac901fc6abfb11a643 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb079901fc6abfb118783 | 6a1fb0d9901fc6abfb11c28d | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb079901fc6abfb118783 | 6a1fb104901fc6abfb11dd64 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb133901fc6abfb11fb48 | 6a1fb138901fc6abfb11fde6 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb133901fc6abfb11fb48 | 6a1fb166901fc6abfb121a02 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb133901fc6abfb11fb48 | 6a1fb197901fc6abfb123891 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb133901fc6abfb11fb48 | 6a1fb1c4901fc6abfb125505 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb1ef901fc6abfb127001 | 6a1fb1f2901fc6abfb12717d | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb1ef901fc6abfb127001 | 6a1fb224901fc6abfb12907d | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb1ef901fc6abfb127001 | 6a1fb251901fc6abfb12ad2b | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb1ef901fc6abfb127001 | 6a1fb283901fc6abfb12cc3e | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb2b4901fc6abfb12eaa9 | 6a1fb2b7901fc6abfb12ec6f | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb2b4901fc6abfb12eaa9 | 6a1fb2e8901fc6abfb130a43 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb2b4901fc6abfb12eaa9 | 6a1fb317901fc6abfb1327b5 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb2b4901fc6abfb12eaa9 | 6a1fb347901fc6abfb1345ef | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb377901fc6abfb13638a | 6a1fb37a901fc6abfb13659e | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb377901fc6abfb13638a | 6a1fb3a6901fc6abfb138076 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb377901fc6abfb13638a | 6a1fb3d3901fc6abfb139cc0 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb377901fc6abfb13638a | 6a1fb3fd901fc6abfb13b728 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb429901fc6abfb13d269 | 6a1fb42c901fc6abfb13d465 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb429901fc6abfb13d269 | 6a1fb45c901fc6abfb13f13b | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb429901fc6abfb13d269 | 6a1fb48c901fc6abfb140f18 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb429901fc6abfb13d269 | 6a1fb4ba901fc6abfb142c7b | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb4e9901fc6abfb144a19 | 6a1fb4ee901fc6abfb144c74 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb4e9901fc6abfb144a19 | 6a1fb51e901fc6abfb146a75 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb4e9901fc6abfb144a19 | 6a1fb549901fc6abfb148565 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb4e9901fc6abfb144a19 | 6a1fb577901fc6abfb14a221 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb5a4901fc6abfb14be0d | 6a1fb5a8901fc6abfb14bffa | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb5a4901fc6abfb14be0d | 6a1fb5d3901fc6abfb14da83 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb5a4901fc6abfb14be0d | 6a1fb5ff901fc6abfb14f658 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb5a4901fc6abfb14be0d | 6a1fb62e901fc6abfb1513a5 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb659901fc6abfb152eea | 6a1fb65d901fc6abfb1530f6 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb659901fc6abfb152eea | 6a1fb68b901fc6abfb154d55 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb659901fc6abfb152eea | 6a1fb6b5901fc6abfb1566fc | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a1fb659901fc6abfb152eea | 6a1fb6de901fc6abfb158079 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fafc2901fc6abfb11154e | 6a1fafc7901fc6abfb11178b | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fafc2901fc6abfb11154e | 6a1faff8901fc6abfb113616 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fafc2901fc6abfb11154e | 6a1fb028901fc6abfb115405 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fafc2901fc6abfb11154e | 6a1fb05c901fc6abfb1174a1 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb086901fc6abfb118f16 | 6a1fb08b901fc6abfb119178 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb086901fc6abfb118f16 | 6a1fb0bc901fc6abfb11b045 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb086901fc6abfb118f16 | 6a1fb0eb901fc6abfb11cdb6 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb086901fc6abfb118f16 | 6a1fb11d901fc6abfb11ed1d | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb14b901fc6abfb1209c1 | 6a1fb150901fc6abfb120c0a | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb14b901fc6abfb1209c1 | 6a1fb17e901fc6abfb1228d5 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb14b901fc6abfb1209c1 | 6a1fb1b0901fc6abfb12488d | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb14b901fc6abfb1209c1 | 6a1fb1df901fc6abfb1265bf | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb20e901fc6abfb1282a2 | 6a1fb212901fc6abfb128535 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb20e901fc6abfb1282a2 | 6a1fb243901fc6abfb12a418 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb20e901fc6abfb1282a2 | 6a1fb278901fc6abfb12c55c | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb20e901fc6abfb1282a2 | 6a1fb2a9901fc6abfb12e429 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb2d6901fc6abfb12ff3a | 6a1fb2d9901fc6abfb130109 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb2d6901fc6abfb12ff3a | 6a1fb309901fc6abfb131f35 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb2d6901fc6abfb12ff3a | 6a1fb338901fc6abfb133cae | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb2d6901fc6abfb12ff3a | 6a1fb367901fc6abfb1359d4 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb395901fc6abfb137618 | 6a1fb398901fc6abfb1377e9 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb395901fc6abfb137618 | 6a1fb3c7901fc6abfb13955a | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb395901fc6abfb137618 | 6a1fb3f7901fc6abfb13b34c | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb395901fc6abfb137618 | 6a1fb429901fc6abfb13d276 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb45b901fc6abfb13f135 | 6a1fb45f901fc6abfb13f319 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb45b901fc6abfb13f135 | 6a1fb48f901fc6abfb14116b | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb45b901fc6abfb13f135 | 6a1fb4bd901fc6abfb142e4a | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb45b901fc6abfb13f135 | 6a1fb4ea901fc6abfb144a3b | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb518901fc6abfb1466ed | 6a1fb51d901fc6abfb1469bc | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb518901fc6abfb1466ed | 6a1fb54b901fc6abfb1486aa | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb518901fc6abfb1466ed | 6a1fb57b901fc6abfb14a4cd | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb518901fc6abfb1466ed | 6a1fb5a9901fc6abfb14c0bc | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb5d7901fc6abfb14ddbe | 6a1fb5db901fc6abfb14dfa5 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb5d7901fc6abfb14ddbe | 6a1fb609901fc6abfb14fc6e | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb5d7901fc6abfb14ddbe | 6a1fb638901fc6abfb1519e4 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb5d7901fc6abfb14ddbe | 6a1fb664901fc6abfb153557 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb68f901fc6abfb1550bc | 6a1fb693901fc6abfb155238 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb68f901fc6abfb1550bc | 6a1fb6bc901fc6abfb156b7b | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb68f901fc6abfb1550bc | 6a1fb6e6901fc6abfb1585bd | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a1fb68f901fc6abfb1550bc | 6a1fb707901fc6abfb159a2f | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fafb9901fc6abfb111266 | 6a1fafbc901fc6abfb111313 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fafb9901fc6abfb111266 | 6a1fafea901fc6abfb112d85 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fafb9901fc6abfb111266 | 6a1fb014901fc6abfb1147ea | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fafb9901fc6abfb111266 | 6a1fb042901fc6abfb1164fc | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb06d901fc6abfb117fed | 6a1fb071901fc6abfb118209 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb06d901fc6abfb117fed | 6a1fb09e901fc6abfb119d1d | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb06d901fc6abfb117fed | 6a1fb0c8901fc6abfb11b7ba | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb06d901fc6abfb117fed | 6a1fb0f7901fc6abfb11d59f | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb123901fc6abfb11f145 | 6a1fb127901fc6abfb11f3a5 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb123901fc6abfb11f145 | 6a1fb155901fc6abfb120f4a | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb123901fc6abfb11f145 | 6a1fb17f901fc6abfb122970 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb123901fc6abfb11f145 | 6a1fb1ae901fc6abfb12474c | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb1df901fc6abfb1265ba | 6a1fb1e2901fc6abfb126868 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb1df901fc6abfb1265ba | 6a1fb20d901fc6abfb12821d | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb1df901fc6abfb1265ba | 6a1fb237901fc6abfb129cae | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb1df901fc6abfb1265ba | 6a1fb268901fc6abfb12bb63 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb295901fc6abfb12d74a | 6a1fb298901fc6abfb12d941 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb295901fc6abfb12d74a | 6a1fb2c4901fc6abfb12f47a | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb295901fc6abfb12d74a | 6a1fb2ef901fc6abfb130ef3 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb295901fc6abfb12d74a | 6a1fb31d901fc6abfb132bca | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb34d901fc6abfb1349eb | 6a1fb350901fc6abfb134bb3 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb34d901fc6abfb1349eb | 6a1fb37c901fc6abfb1366db | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb34d901fc6abfb1349eb | 6a1fb3ac901fc6abfb138460 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb34d901fc6abfb1349eb | 6a1fb3d9901fc6abfb13a05a | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb40a901fc6abfb13bf0e | 6a1fb40e901fc6abfb13c1d9 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb40a901fc6abfb13bf0e | 6a1fb43a901fc6abfb13dc7d | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb40a901fc6abfb13bf0e | 6a1fb466901fc6abfb13f7e4 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb40a901fc6abfb13bf0e | 6a1fb493901fc6abfb1413eb | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb4c1901fc6abfb143158 | 6a1fb4c6901fc6abfb1433a1 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb4c1901fc6abfb143158 | 6a1fb4f6901fc6abfb145182 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb4c1901fc6abfb143158 | 6a1fb527901fc6abfb146fa8 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb4c1901fc6abfb143158 | 6a1fb556901fc6abfb148d41 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb585901fc6abfb14aaef | 6a1fb58a901fc6abfb14adde | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb585901fc6abfb14aaef | 6a1fb5bd901fc6abfb14cd6a | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb585901fc6abfb14aaef | 6a1fb5eb901fc6abfb14e992 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb585901fc6abfb14aaef | 6a1fb61a901fc6abfb150734 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb647901fc6abfb1523c8 | 6a1fb64c901fc6abfb1526b1 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb647901fc6abfb1523c8 | 6a1fb674901fc6abfb153ee5 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb647901fc6abfb1523c8 | 6a1fb6a0901fc6abfb1559ff | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a1fb647901fc6abfb1523c8 | 6a1fb6cb901fc6abfb15748d | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fafc0901fc6abfb111492 | 6a1fafc4901fc6abfb1115df | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fafc0901fc6abfb111492 | 6a1faff2901fc6abfb113244 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fafc0901fc6abfb111492 | 6a1fb020901fc6abfb114ef6 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fafc0901fc6abfb111492 | 6a1fb04e901fc6abfb116c35 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb07d901fc6abfb1189e6 | 6a1fb081901fc6abfb118b76 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb07d901fc6abfb1189e6 | 6a1fb0b1901fc6abfb11a969 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb07d901fc6abfb1189e6 | 6a1fb0e2901fc6abfb11c814 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb07d901fc6abfb1189e6 | 6a1fb10c901fc6abfb11e2d1 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb138901fc6abfb11fe75 | 6a1fb13d901fc6abfb12012c | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb138901fc6abfb11fe75 | 6a1fb16b901fc6abfb121d30 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb138901fc6abfb11fe75 | 6a1fb199901fc6abfb1239f8 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb138901fc6abfb11fe75 | 6a1fb1cb901fc6abfb125998 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb1fa901fc6abfb12775f | 6a1fb1fe901fc6abfb1278ec | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb1fa901fc6abfb12775f | 6a1fb22e901fc6abfb1296e6 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb1fa901fc6abfb12775f | 6a1fb25d901fc6abfb12b4c3 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb1fa901fc6abfb12775f | 6a1fb28b901fc6abfb12d15f | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb2bb901fc6abfb12eeeb | 6a1fb2bf901fc6abfb12f13b | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb2bb901fc6abfb12eeeb | 6a1fb2f2901fc6abfb1310a3 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb2bb901fc6abfb12eeeb | 6a1fb321901fc6abfb132e5e | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb2bb901fc6abfb12eeeb | 6a1fb34e901fc6abfb134ae5 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb37e901fc6abfb136816 | 6a1fb382901fc6abfb136a7e | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb37e901fc6abfb136816 | 6a1fb3b1901fc6abfb1387d8 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb37e901fc6abfb136816 | 6a1fb3e0901fc6abfb13a53a | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb37e901fc6abfb136816 | 6a1fb413901fc6abfb13c4f1 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb443901fc6abfb13e276 | 6a1fb447901fc6abfb13e474 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb443901fc6abfb13e276 | 6a1fb474901fc6abfb14005b | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb443901fc6abfb13e276 | 6a1fb4a4901fc6abfb141e40 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb443901fc6abfb13e276 | 6a1fb4d4901fc6abfb143c45 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb4fe901fc6abfb1456ec | 6a1fb502901fc6abfb14589d | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb4fe901fc6abfb1456ec | 6a1fb52c901fc6abfb147311 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb4fe901fc6abfb1456ec | 6a1fb557901fc6abfb148de8 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb4fe901fc6abfb1456ec | 6a1fb588901fc6abfb14ac71 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb5b5901fc6abfb14c84a | 6a1fb5b8901fc6abfb14c9ac | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb5b5901fc6abfb14c84a | 6a1fb5e6901fc6abfb14e64b | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb5b5901fc6abfb14c84a | 6a1fb614901fc6abfb150336 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb5b5901fc6abfb14c84a | 6a1fb642901fc6abfb151fd8 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb66d901fc6abfb153b36 | 6a1fb670901fc6abfb153c8d | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb66d901fc6abfb153b36 | 6a1fb69b901fc6abfb1556bf | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb66d901fc6abfb153b36 | 6a1fb6c6901fc6abfb157146 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a1fb66d901fc6abfb153b36 | 6a1fb6f1901fc6abfb158c00 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fafbe901fc6abfb1113ea | 6a1fafc2901fc6abfb111500 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fafbe901fc6abfb1113ea | 6a1faff0901fc6abfb1130c2 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fafbe901fc6abfb1113ea | 6a1fb01f901fc6abfb114e75 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fafbe901fc6abfb1113ea | 6a1fb04e901fc6abfb116c32 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb07c901fc6abfb118940 | 6a1fb081901fc6abfb118b86 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb07c901fc6abfb118940 | 6a1fb0b1901fc6abfb11a96e | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb07c901fc6abfb118940 | 6a1fb0e0901fc6abfb11c700 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb07c901fc6abfb118940 | 6a1fb10b901fc6abfb11e208 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb136901fc6abfb11fd42 | 6a1fb13a901fc6abfb11ff25 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb136901fc6abfb11fd42 | 6a1fb167901fc6abfb121a72 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb136901fc6abfb11fd42 | 6a1fb195901fc6abfb123778 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb136901fc6abfb11fd42 | 6a1fb1c4901fc6abfb125509 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb1ec901fc6abfb126ed9 | 6a1fb1f0901fc6abfb127071 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb1ec901fc6abfb126ed9 | 6a1fb21f901fc6abfb128d68 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb1ec901fc6abfb126ed9 | 6a1fb24b901fc6abfb12a8f5 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb1ec901fc6abfb126ed9 | 6a1fb278901fc6abfb12c55a | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb2a9901fc6abfb12e423 | 6a1fb2ac901fc6abfb12e5c3 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb2a9901fc6abfb12e423 | 6a1fb2da901fc6abfb1301bf | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb2a9901fc6abfb12e423 | 6a1fb309901fc6abfb131f34 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb2a9901fc6abfb12e423 | 6a1fb33a901fc6abfb133de2 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb369901fc6abfb135aff | 6a1fb36c901fc6abfb135d03 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb369901fc6abfb135aff | 6a1fb39e901fc6abfb137bb2 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb369901fc6abfb135aff | 6a1fb3cd901fc6abfb139952 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb369901fc6abfb135aff | 6a1fb3fa901fc6abfb13b539 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb42c901fc6abfb13d45b | 6a1fb430901fc6abfb13d6a5 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb42c901fc6abfb13d45b | 6a1fb45f901fc6abfb13f33f | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb42c901fc6abfb13d45b | 6a1fb48c901fc6abfb140f15 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb42c901fc6abfb13d45b | 6a1fb4ba901fc6abfb142c53 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb4e5901fc6abfb14475e | 6a1fb4e9901fc6abfb144977 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb4e5901fc6abfb14475e | 6a1fb517901fc6abfb1465ba | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb4e5901fc6abfb14475e | 6a1fb541901fc6abfb14801f | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb4e5901fc6abfb14475e | 6a1fb570901fc6abfb149dac | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb59d901fc6abfb14b9ee | 6a1fb5a1901fc6abfb14bc42 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb59d901fc6abfb14b9ee | 6a1fb5ce901fc6abfb14d7b5 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb59d901fc6abfb14b9ee | 6a1fb5fd901fc6abfb14f4c3 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb59d901fc6abfb14b9ee | 6a1fb629901fc6abfb151044 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb659901fc6abfb152eec | 6a1fb65d901fc6abfb1530f8 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb659901fc6abfb152eec | 6a1fb688901fc6abfb154b3e | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb659901fc6abfb152eec | 6a1fb6b3901fc6abfb15659c | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a1fb659901fc6abfb152eec | 6a1fb6dd901fc6abfb157fb7 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fafc2901fc6abfb11154c | 6a1fafc7901fc6abfb111790 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fafc2901fc6abfb11154c | 6a1faff7901fc6abfb113577 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fafc2901fc6abfb11154c | 6a1fb027901fc6abfb11538a | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fafc2901fc6abfb11154c | 6a1fb054901fc6abfb116fc8 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb081901fc6abfb118c20 | 6a1fb086901fc6abfb118e66 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb081901fc6abfb118c20 | 6a1fb0b5901fc6abfb11ac03 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb081901fc6abfb118c20 | 6a1fb0e6901fc6abfb11ca9a | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb081901fc6abfb118c20 | 6a1fb114901fc6abfb11e740 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb141901fc6abfb1203fa | 6a1fb145901fc6abfb12053f | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb141901fc6abfb1203fa | 6a1fb16f901fc6abfb12200c | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb141901fc6abfb1203fa | 6a1fb19f901fc6abfb123e4a | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb141901fc6abfb1203fa | 6a1fb1d1901fc6abfb125da0 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb203901fc6abfb127cfd | 6a1fb208901fc6abfb127ef9 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb203901fc6abfb127cfd | 6a1fb235901fc6abfb129b2d | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb203901fc6abfb127cfd | 6a1fb263901fc6abfb12b822 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb203901fc6abfb127cfd | 6a1fb293901fc6abfb12d63c | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb2bf901fc6abfb12f12c | 6a1fb2c3901fc6abfb12f389 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb2bf901fc6abfb12f12c | 6a1fb2f2901fc6abfb131095 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb2bf901fc6abfb12f12c | 6a1fb321901fc6abfb132e57 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb2bf901fc6abfb12f12c | 6a1fb34e901fc6abfb134aa1 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb37c901fc6abfb1366cc | 6a1fb380901fc6abfb136960 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb37c901fc6abfb1366cc | 6a1fb3b0901fc6abfb138729 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb37c901fc6abfb1366cc | 6a1fb3df901fc6abfb13a4a1 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb37c901fc6abfb1366cc | 6a1fb40d901fc6abfb13c12e | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb43d901fc6abfb13def4 | 6a1fb441901fc6abfb13e0a3 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb43d901fc6abfb13def4 | 6a1fb470901fc6abfb13fdcd | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb43d901fc6abfb13def4 | 6a1fb49c901fc6abfb141997 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb43d901fc6abfb13def4 | 6a1fb4ca901fc6abfb143632 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb4f3901fc6abfb145046 | 6a1fb4f8901fc6abfb145291 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb4f3901fc6abfb145046 | 6a1fb526901fc6abfb146f3e | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb4f3901fc6abfb145046 | 6a1fb556901fc6abfb148d42 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb4f3901fc6abfb145046 | 6a1fb585901fc6abfb14aa5b | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb5b4901fc6abfb14c80e | 6a1fb5b8901fc6abfb14c997 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb5b4901fc6abfb14c80e | 6a1fb5e6901fc6abfb14e64d | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb5b4901fc6abfb14c80e | 6a1fb615901fc6abfb1503d7 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb5b4901fc6abfb14c80e | 6a1fb644901fc6abfb152135 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb66d901fc6abfb153b38 | 6a1fb670901fc6abfb153c9b | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb66d901fc6abfb153b38 | 6a1fb69c901fc6abfb15575d | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb66d901fc6abfb153b38 | 6a1fb6c6901fc6abfb157142 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a1fb66d901fc6abfb153b38 | 6a1fb6ef901fc6abfb158a99 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fafc4901fc6abfb111657 | 6a1fafc9901fc6abfb1118aa | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fafc4901fc6abfb111657 | 6a1faff9901fc6abfb1136de | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fafc4901fc6abfb111657 | 6a1fb029901fc6abfb1154e5 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fafc4901fc6abfb111657 | 6a1fb05c901fc6abfb11749e | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb088901fc6abfb119064 | 6a1fb08c901fc6abfb119212 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb088901fc6abfb119064 | 6a1fb0b9901fc6abfb11ae46 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb088901fc6abfb119064 | 6a1fb0e8901fc6abfb11cb8f | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb088901fc6abfb119064 | 6a1fb119901fc6abfb11ea61 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb145901fc6abfb1205d0 | 6a1fb149901fc6abfb1207b6 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb145901fc6abfb1205d0 | 6a1fb179901fc6abfb12256e | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb145901fc6abfb1205d0 | 6a1fb1a7901fc6abfb12429d | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb145901fc6abfb1205d0 | 6a1fb1d4901fc6abfb125f57 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb204901fc6abfb127cff | 6a1fb208901fc6abfb127eea | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb204901fc6abfb127cff | 6a1fb235901fc6abfb129b2f | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb204901fc6abfb127cff | 6a1fb262901fc6abfb12b7a5 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb204901fc6abfb127cff | 6a1fb294901fc6abfb12d6e7 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb2c5901fc6abfb12f4e4 | 6a1fb2c8901fc6abfb12f69c | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb2c5901fc6abfb12f4e4 | 6a1fb2f8901fc6abfb1314be | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb2c5901fc6abfb12f4e4 | 6a1fb327901fc6abfb1331fb | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb2c5901fc6abfb12f4e4 | 6a1fb355901fc6abfb134e8d | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb386901fc6abfb136cea | 6a1fb38a901fc6abfb136f23 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb386901fc6abfb136cea | 6a1fb3b9901fc6abfb138c8c | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb386901fc6abfb136cea | 6a1fb3ec901fc6abfb13acac | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb386901fc6abfb136cea | 6a1fb419901fc6abfb13c8a8 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb44a901fc6abfb13e6f4 | 6a1fb44e901fc6abfb13e8cf | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb44a901fc6abfb13e6f4 | 6a1fb47d901fc6abfb140642 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb44a901fc6abfb13e6f4 | 6a1fb4a8901fc6abfb142109 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb44a901fc6abfb13e6f4 | 6a1fb4d4901fc6abfb143c41 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb504901fc6abfb145a70 | 6a1fb508901fc6abfb145c4a | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb504901fc6abfb145a70 | 6a1fb536901fc6abfb1478eb | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb504901fc6abfb145a70 | 6a1fb565901fc6abfb149690 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb504901fc6abfb145a70 | 6a1fb594901fc6abfb14b3c9 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb5c5901fc6abfb14d2a4 | 6a1fb5c9901fc6abfb14d48d | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb5c5901fc6abfb14d2a4 | 6a1fb5f7901fc6abfb14f110 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb5c5901fc6abfb14d2a4 | 6a1fb627901fc6abfb150f4d | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb5c5901fc6abfb14d2a4 | 6a1fb652901fc6abfb152a3f | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb680901fc6abfb15471f | 6a1fb684901fc6abfb154894 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb680901fc6abfb15471f | 6a1fb6ad901fc6abfb1561ce | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb680901fc6abfb15471f | 6a1fb6da901fc6abfb157d9c | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a1fb680901fc6abfb15471f | 6a1fb700901fc6abfb15953a | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fafbf901fc6abfb111452 | 6a1fafc4901fc6abfb1115e6 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fafbf901fc6abfb111452 | 6a1faff5901fc6abfb11340f | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fafbf901fc6abfb111452 | 6a1fb020901fc6abfb114ef9 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fafbf901fc6abfb111452 | 6a1fb04c901fc6abfb116adc | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb07c901fc6abfb11893e | 6a1fb081901fc6abfb118b77 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb07c901fc6abfb11893e | 6a1fb0ad901fc6abfb11a71d | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb07c901fc6abfb11893e | 6a1fb0d9901fc6abfb11c28c | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb07c901fc6abfb11893e | 6a1fb107901fc6abfb11df46 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb133901fc6abfb11fb4c | 6a1fb138901fc6abfb11fde4 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb133901fc6abfb11fb4c | 6a1fb164901fc6abfb121889 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb133901fc6abfb11fb4c | 6a1fb193901fc6abfb123612 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb133901fc6abfb11fb4c | 6a1fb1bf901fc6abfb1251c4 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb1ec901fc6abfb126ed7 | 6a1fb1f0901fc6abfb12706e | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb1ec901fc6abfb126ed7 | 6a1fb21d901fc6abfb128c0b | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb1ec901fc6abfb126ed7 | 6a1fb249901fc6abfb12a7bd | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb1ec901fc6abfb126ed7 | 6a1fb279901fc6abfb12c601 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb2a6901fc6abfb12e1db | 6a1fb2aa901fc6abfb12e4af | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb2a6901fc6abfb12e1db | 6a1fb2d6901fc6abfb12ff47 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb2a6901fc6abfb12e1db | 6a1fb306901fc6abfb131d75 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb2a6901fc6abfb12e1db | 6a1fb338901fc6abfb133c93 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb366901fc6abfb135902 | 6a1fb369901fc6abfb135b04 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb366901fc6abfb135902 | 6a1fb396901fc6abfb1376bf | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb366901fc6abfb135902 | 6a1fb3c6901fc6abfb13945b | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb366901fc6abfb135902 | 6a1fb3f4901fc6abfb13b197 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb41f901fc6abfb13cca3 | 6a1fb422901fc6abfb13ce59 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb41f901fc6abfb13cca3 | 6a1fb44d901fc6abfb13e85d | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb41f901fc6abfb13cca3 | 6a1fb479901fc6abfb140357 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb41f901fc6abfb13cca3 | 6a1fb4a8901fc6abfb142107 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb4d3901fc6abfb143c32 | 6a1fb4d8901fc6abfb143ed4 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb4d3901fc6abfb143c32 | 6a1fb503901fc6abfb1459af | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb4d3901fc6abfb143c32 | 6a1fb52f901fc6abfb1474fd | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb4d3901fc6abfb143c32 | 6a1fb55d901fc6abfb1491e7 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb588901fc6abfb14ad1b | 6a1fb58d901fc6abfb14afb9 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb588901fc6abfb14ad1b | 6a1fb5bc901fc6abfb14cc8c | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb588901fc6abfb14ad1b | 6a1fb5eb901fc6abfb14e9d3 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb588901fc6abfb14ad1b | 6a1fb619901fc6abfb15068a | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb647901fc6abfb1523ca | 6a1fb64c901fc6abfb152698 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb647901fc6abfb1523ca | 6a1fb675901fc6abfb153f6b | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb647901fc6abfb1523ca | 6a1fb6a0901fc6abfb1559f2 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a1fb647901fc6abfb1523ca | 6a1fb6c9901fc6abfb157348 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fafbe901fc6abfb1113e8 | 6a1fafc3901fc6abfb11155f | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fafbe901fc6abfb1113e8 | 6a1faff2901fc6abfb11323f | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fafbe901fc6abfb1113e8 | 6a1fb024901fc6abfb115166 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fafbe901fc6abfb1113e8 | 6a1fb052901fc6abfb116ea9 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb081901fc6abfb118c22 | 6a1fb086901fc6abfb118e64 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb081901fc6abfb118c22 | 6a1fb0b1901fc6abfb11a982 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb081901fc6abfb118c22 | 6a1fb0e2901fc6abfb11c870 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb081901fc6abfb118c22 | 6a1fb10f901fc6abfb11e4f8 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb13b901fc6abfb120085 | 6a1fb13f901fc6abfb120287 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb13b901fc6abfb120085 | 6a1fb16c901fc6abfb121dfe | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb13b901fc6abfb120085 | 6a1fb19a901fc6abfb123a8a | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb13b901fc6abfb120085 | 6a1fb1cb901fc6abfb125996 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb1fa901fc6abfb12776f | 6a1fb1fe901fc6abfb1278f2 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb1fa901fc6abfb12776f | 6a1fb22e901fc6abfb1296e4 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb1fa901fc6abfb12776f | 6a1fb25d901fc6abfb12b450 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb1fa901fc6abfb12776f | 6a1fb289901fc6abfb12d00c | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb2bb901fc6abfb12eee4 | 6a1fb2bf901fc6abfb12f13c | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb2bb901fc6abfb12eee4 | 6a1fb2ef901fc6abfb130ef1 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb2bb901fc6abfb12eee4 | 6a1fb31b901fc6abfb132a4c | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb2bb901fc6abfb12eee4 | 6a1fb347901fc6abfb1345dc | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb378901fc6abfb1363de | 6a1fb37a901fc6abfb136566 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb378901fc6abfb1363de | 6a1fb3a6901fc6abfb138074 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb378901fc6abfb1363de | 6a1fb3d5901fc6abfb139deb | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb378901fc6abfb1363de | 6a1fb401901fc6abfb13ba0e | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb42c901fc6abfb13d459 | 6a1fb430901fc6abfb13d6de | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb42c901fc6abfb13d459 | 6a1fb45c901fc6abfb13f152 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb42c901fc6abfb13d459 | 6a1fb48a901fc6abfb140dcf | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb42c901fc6abfb13d459 | 6a1fb4b9901fc6abfb142b80 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb4e9901fc6abfb144a1b | 6a1fb4ee901fc6abfb144c55 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb4e9901fc6abfb144a1b | 6a1fb51b901fc6abfb146852 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb4e9901fc6abfb144a1b | 6a1fb547901fc6abfb1483bf | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb4e9901fc6abfb144a1b | 6a1fb575901fc6abfb14a08c | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb5a0901fc6abfb14bbe8 | 6a1fb5a4901fc6abfb14bd80 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb5a0901fc6abfb14bbe8 | 6a1fb5d0901fc6abfb14d8be | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb5a0901fc6abfb14bbe8 | 6a1fb603901fc6abfb14f8be | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb5a0901fc6abfb14bbe8 | 6a1fb631901fc6abfb1515b3 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb65d901fc6abfb153182 | 6a1fb661901fc6abfb153381 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb65d901fc6abfb153182 | 6a1fb68a901fc6abfb154ca7 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb65d901fc6abfb153182 | 6a1fb6b3901fc6abfb15659a | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a1fb65d901fc6abfb153182 | 6a1fb6e0901fc6abfb1581c4 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fafb8901fc6abfb111231 | 6a1fafbb901fc6abfb1112c5 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fafb8901fc6abfb111231 | 6a1fafe5901fc6abfb112a2b | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fafb8901fc6abfb111231 | 6a1fb014901fc6abfb1147f5 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fafb8901fc6abfb111231 | 6a1fb040901fc6abfb116339 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb06c901fc6abfb117f2b | 6a1fb06f901fc6abfb1180b4 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb06c901fc6abfb117f2b | 6a1fb099901fc6abfb1199a2 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb06c901fc6abfb117f2b | 6a1fb0c4901fc6abfb11b501 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb06c901fc6abfb117f2b | 6a1fb0f0901fc6abfb11d0be | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb11a901fc6abfb11ebd3 | 6a1fb11e901fc6abfb11ed82 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb11a901fc6abfb11ebd3 | 6a1fb14a901fc6abfb120874 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb11a901fc6abfb11ebd3 | 6a1fb173901fc6abfb1222f0 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb11a901fc6abfb11ebd3 | 6a1fb1a1901fc6abfb123f8c | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb1cc901fc6abfb125a37 | 6a1fb1d0901fc6abfb125cdd | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb1cc901fc6abfb125a37 | 6a1fb1fe901fc6abfb1278f0 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb1cc901fc6abfb125a37 | 6a1fb22c901fc6abfb12959b | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb1cc901fc6abfb125a37 | 6a1fb25b901fc6abfb12b305 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb28a901fc6abfb12d089 | 6a1fb28e901fc6abfb12d30d | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb28a901fc6abfb12d089 | 6a1fb2b6901fc6abfb12ebe9 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb28a901fc6abfb12d089 | 6a1fb2e3901fc6abfb13074c | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb28a901fc6abfb12d089 | 6a1fb310901fc6abfb1323da | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb33d901fc6abfb133fca | 6a1fb340901fc6abfb13419d | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb33d901fc6abfb133fca | 6a1fb36c901fc6abfb135d05 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb33d901fc6abfb133fca | 6a1fb39c901fc6abfb1379ec | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb33d901fc6abfb133fca | 6a1fb3c6901fc6abfb1394af | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb3f3901fc6abfb13b0dd | 6a1fb3f7901fc6abfb13b32c | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb3f3901fc6abfb13b0dd | 6a1fb426901fc6abfb13d067 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb3f3901fc6abfb13b0dd | 6a1fb452901fc6abfb13eb3f | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb3f3901fc6abfb13b0dd | 6a1fb47f901fc6abfb14078c | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb4ad901fc6abfb1424fa | 6a1fb4b2901fc6abfb142748 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb4ad901fc6abfb1424fa | 6a1fb4de901fc6abfb1442e4 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb4ad901fc6abfb1424fa | 6a1fb509901fc6abfb145cf9 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb4ad901fc6abfb1424fa | 6a1fb538901fc6abfb147a2e | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb565901fc6abfb149717 | 6a1fb56a901fc6abfb1499d5 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb565901fc6abfb149717 | 6a1fb598901fc6abfb14b62d | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb565901fc6abfb149717 | 6a1fb5ca901fc6abfb14d513 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb565901fc6abfb149717 | 6a1fb5f8901fc6abfb14f19c | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb626901fc6abfb150f1b | 6a1fb62b901fc6abfb1511b2 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb626901fc6abfb150f1b | 6a1fb659901fc6abfb152e43 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb626901fc6abfb150f1b | 6a1fb68b901fc6abfb154d57 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a1fb626901fc6abfb150f1b | 6a1fb6b5901fc6abfb1566fa | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fafc3901fc6abfb1115d8 | 6a1fafc8901fc6abfb111852 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fafc3901fc6abfb1115d8 | 6a1faff5901fc6abfb113411 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fafc3901fc6abfb1115d8 | 6a1fb025901fc6abfb11522b | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fafc3901fc6abfb1115d8 | 6a1fb050901fc6abfb116d70 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb07d901fc6abfb1189e8 | 6a1fb081901fc6abfb118b75 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb07d901fc6abfb1189e8 | 6a1fb0b1901fc6abfb11a96b | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb07d901fc6abfb1189e8 | 6a1fb0e3901fc6abfb11c888 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb07d901fc6abfb1189e8 | 6a1fb10f901fc6abfb11e4e6 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb13e901fc6abfb120272 | 6a1fb143901fc6abfb120455 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb13e901fc6abfb120272 | 6a1fb16e901fc6abfb121f5e | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb13e901fc6abfb120272 | 6a1fb19e901fc6abfb123d77 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb13e901fc6abfb120272 | 6a1fb1cb901fc6abfb125994 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb1fa901fc6abfb1276c2 | 6a1fb1fe901fc6abfb1278ef | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb1fa901fc6abfb1276c2 | 6a1fb22f901fc6abfb12974f | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb1fa901fc6abfb1276c2 | 6a1fb25e901fc6abfb12b50d | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb1fa901fc6abfb1276c2 | 6a1fb28a901fc6abfb12d0a6 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb2b8901fc6abfb12ecf8 | 6a1fb2bc901fc6abfb12ef9d | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb2b8901fc6abfb12ecf8 | 6a1fb2ed901fc6abfb130d9d | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb2b8901fc6abfb12ecf8 | 6a1fb31c901fc6abfb132b01 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb2b8901fc6abfb12ecf8 | 6a1fb34a901fc6abfb1347ba | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb379901fc6abfb1364b1 | 6a1fb37d901fc6abfb136773 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb379901fc6abfb1364b1 | 6a1fb3ab901fc6abfb13835c | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb379901fc6abfb1364b1 | 6a1fb3da901fc6abfb13a111 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb379901fc6abfb1364b1 | 6a1fb40c901fc6abfb13c07d | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb43d901fc6abfb13def0 | 6a1fb441901fc6abfb13e0a1 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb43d901fc6abfb13def0 | 6a1fb472901fc6abfb13ff8f | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb43d901fc6abfb13def0 | 6a1fb4a0901fc6abfb141c03 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb43d901fc6abfb13def0 | 6a1fb4cd901fc6abfb14381b | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb4fc901fc6abfb1455e5 | 6a1fb500901fc6abfb14575a | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb4fc901fc6abfb1455e5 | 6a1fb532901fc6abfb1476f3 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb4fc901fc6abfb1455e5 | 6a1fb55f901fc6abfb14932d | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb4fc901fc6abfb1455e5 | 6a1fb58b901fc6abfb14ae88 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb5ba901fc6abfb14cbc5 | 6a1fb5bf901fc6abfb14ceb2 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb5ba901fc6abfb14cbc5 | 6a1fb5f1901fc6abfb14eda9 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb5ba901fc6abfb14cbc5 | 6a1fb61c901fc6abfb1508ce | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb5ba901fc6abfb14cbc5 | 6a1fb647901fc6abfb15232a | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb66f901fc6abfb153c3c | 6a1fb673901fc6abfb153df6 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb66f901fc6abfb153c3c | 6a1fb6a1901fc6abfb155a97 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb66f901fc6abfb153c3c | 6a1fb6ce901fc6abfb15768d | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a1fb66f901fc6abfb153c3c | 6a1fb6f5901fc6abfb158eb4 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fafbe901fc6abfb1113e4 | 6a1fafc2901fc6abfb1114f9 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fafbe901fc6abfb1113e4 | 6a1fafee901fc6abfb112fb6 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fafbe901fc6abfb1113e4 | 6a1fb01b901fc6abfb114c5d | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fafbe901fc6abfb1113e4 | 6a1fb04b901fc6abfb116a1b | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb078901fc6abfb1186e4 | 6a1fb07c901fc6abfb1188a9 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb078901fc6abfb1186e4 | 6a1fb0aa901fc6abfb11a4c2 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb078901fc6abfb1186e4 | 6a1fb0d6901fc6abfb11c085 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb078901fc6abfb1186e4 | 6a1fb107901fc6abfb11df3f | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb135901fc6abfb11fc8b | 6a1fb13a901fc6abfb11ff6e | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb135901fc6abfb11fc8b | 6a1fb16c901fc6abfb121df8 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb135901fc6abfb11fc8b | 6a1fb19b901fc6abfb123b55 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb135901fc6abfb11fc8b | 6a1fb1cb901fc6abfb125992 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb1f7901fc6abfb12756f | 6a1fb1fc901fc6abfb127807 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb1f7901fc6abfb12756f | 6a1fb226901fc6abfb1291d8 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb1f7901fc6abfb12756f | 6a1fb251901fc6abfb12aced | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb1f7901fc6abfb12756f | 6a1fb27e901fc6abfb12c906 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb2a9901fc6abfb12e421 | 6a1fb2ac901fc6abfb12e5c0 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb2a9901fc6abfb12e421 | 6a1fb2d7901fc6abfb12ffe9 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb2a9901fc6abfb12e421 | 6a1fb304901fc6abfb131be9 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb2a9901fc6abfb12e421 | 6a1fb334901fc6abfb133a2e | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb361901fc6abfb135620 | 6a1fb364901fc6abfb13580a | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb361901fc6abfb135620 | 6a1fb38d901fc6abfb137125 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb361901fc6abfb135620 | 6a1fb3bc901fc6abfb138e84 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb361901fc6abfb135620 | 6a1fb3eb901fc6abfb13ac0f | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb419901fc6abfb13c893 | 6a1fb41d901fc6abfb13cb47 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb419901fc6abfb13c893 | 6a1fb44b901fc6abfb13e706 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb419901fc6abfb13c893 | 6a1fb479901fc6abfb140359 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb419901fc6abfb13c893 | 6a1fb4ac901fc6abfb1423a2 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb4d8901fc6abfb143f67 | 6a1fb4dc901fc6abfb144231 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb4d8901fc6abfb143f67 | 6a1fb50b901fc6abfb145eb2 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb4d8901fc6abfb143f67 | 6a1fb537901fc6abfb147989 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb4d8901fc6abfb143f67 | 6a1fb565901fc6abfb149691 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb593901fc6abfb14b3bb | 6a1fb598901fc6abfb14b62e | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb593901fc6abfb14b3bb | 6a1fb5c9901fc6abfb14d49b | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb593901fc6abfb14b3bb | 6a1fb5f8901fc6abfb14f19a | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb593901fc6abfb14b3bb | 6a1fb629901fc6abfb151040 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb656901fc6abfb152ce4 | 6a1fb659901fc6abfb152e3f | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb656901fc6abfb152ce4 | 6a1fb689901fc6abfb154bec | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb656901fc6abfb152ce4 | 6a1fb6b3901fc6abfb156599 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a1fb656901fc6abfb152ce4 | 6a1fb6dd901fc6abfb157fb9 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fafc2901fc6abfb111552 | 6a1fafc7901fc6abfb1117a1 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fafc2901fc6abfb111552 | 6a1faffc901fc6abfb11389d | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fafc2901fc6abfb111552 | 6a1fb02c901fc6abfb11568f | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fafc2901fc6abfb111552 | 6a1fb05c901fc6abfb11749c | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb088901fc6abfb119066 | 6a1fb08c901fc6abfb119201 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb088901fc6abfb119066 | 6a1fb0bc901fc6abfb11b039 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb088901fc6abfb119066 | 6a1fb0eb901fc6abfb11cdc1 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb088901fc6abfb119066 | 6a1fb11b901fc6abfb11ebdf | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb149901fc6abfb120870 | 6a1fb14e901fc6abfb120adc | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb149901fc6abfb120870 | 6a1fb180901fc6abfb122a45 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb149901fc6abfb120870 | 6a1fb1af901fc6abfb1247df | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb149901fc6abfb120870 | 6a1fb1de901fc6abfb12652b | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb20d901fc6abfb1282a0 | 6a1fb212901fc6abfb128533 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb20d901fc6abfb1282a0 | 6a1fb240901fc6abfb12a1f7 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb20d901fc6abfb1282a0 | 6a1fb275901fc6abfb12c359 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb20d901fc6abfb1282a0 | 6a1fb2a6901fc6abfb12e1ef | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb2d3901fc6abfb12fd1e | 6a1fb2d7901fc6abfb12ffe7 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb2d3901fc6abfb12fd1e | 6a1fb305901fc6abfb131cb5 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb2d3901fc6abfb12fd1e | 6a1fb336901fc6abfb133b67 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb2d3901fc6abfb12fd1e | 6a1fb363901fc6abfb13575b | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb394901fc6abfb13757d | 6a1fb398901fc6abfb1377fe | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb394901fc6abfb13757d | 6a1fb3c7901fc6abfb13955c | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb394901fc6abfb13757d | 6a1fb3f8901fc6abfb13b406 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb394901fc6abfb13757d | 6a1fb429901fc6abfb13d272 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb457901fc6abfb13eec5 | 6a1fb45c901fc6abfb13f13c | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb457901fc6abfb13eec5 | 6a1fb48d901fc6abfb140fe9 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb457901fc6abfb13eec5 | 6a1fb4bc901fc6abfb142dab | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb457901fc6abfb13eec5 | 6a1fb4ed901fc6abfb144bdb | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb51e901fc6abfb146af0 | 6a1fb522901fc6abfb146d15 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb51e901fc6abfb146af0 | 6a1fb552901fc6abfb148ab1 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb51e901fc6abfb146af0 | 6a1fb57e901fc6abfb14a67b | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb51e901fc6abfb146af0 | 6a1fb5ad901fc6abfb14c38b | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb5d9901fc6abfb14def9 | 6a1fb5de901fc6abfb14e197 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb5d9901fc6abfb14def9 | 6a1fb60f901fc6abfb150018 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb5d9901fc6abfb14def9 | 6a1fb63c901fc6abfb151c91 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb5d9901fc6abfb14def9 | 6a1fb66a901fc6abfb1538f4 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb696901fc6abfb15546d | 6a1fb69a901fc6abfb155691 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb696901fc6abfb15546d | 6a1fb6c7901fc6abfb1571ed | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb696901fc6abfb15546d | 6a1fb6f0901fc6abfb158b5e | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a1fb696901fc6abfb15546d | 6a1fb70e901fc6abfb159dbf | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fafc4901fc6abfb111659 | 6a1fafc9901fc6abfb1118c9 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fafc4901fc6abfb111659 | 6a1faff9901fc6abfb1136cd | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fafc4901fc6abfb111659 | 6a1fb029901fc6abfb1154eb | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fafc4901fc6abfb111659 | 6a1fb05a901fc6abfb11736e | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb085901fc6abfb118e5e | 6a1fb08a901fc6abfb1190eb | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb085901fc6abfb118e5e | 6a1fb0bc901fc6abfb11b042 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb085901fc6abfb118e5e | 6a1fb0ed901fc6abfb11cf19 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb085901fc6abfb118e5e | 6a1fb11b901fc6abfb11ebdd | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb14b901fc6abfb1209c3 | 6a1fb150901fc6abfb120c07 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb14b901fc6abfb1209c3 | 6a1fb17e901fc6abfb1228da | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb14b901fc6abfb1209c3 | 6a1fb1af901fc6abfb1247e4 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb14b901fc6abfb1209c3 | 6a1fb1de901fc6abfb12652d | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb20f901fc6abfb128336 | 6a1fb212901fc6abfb128537 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb20f901fc6abfb128336 | 6a1fb241901fc6abfb12a2a5 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb20f901fc6abfb128336 | 6a1fb273901fc6abfb12c210 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb20f901fc6abfb128336 | 6a1fb29d901fc6abfb12dca1 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb2cd901fc6abfb12f9b4 | 6a1fb2d1901fc6abfb12fbbd | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb2cd901fc6abfb12f9b4 | 6a1fb300901fc6abfb131941 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb2cd901fc6abfb12f9b4 | 6a1fb32c901fc6abfb13352e | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb2cd901fc6abfb12f9b4 | 6a1fb359901fc6abfb135129 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb388901fc6abfb136e14 | 6a1fb38c901fc6abfb13707a | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb388901fc6abfb136e14 | 6a1fb3be901fc6abfb138fc1 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb388901fc6abfb136e14 | 6a1fb3ec901fc6abfb13acaa | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb388901fc6abfb136e14 | 6a1fb41b901fc6abfb13c9f5 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb44a901fc6abfb13e6f7 | 6a1fb44e901fc6abfb13e8d1 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb44a901fc6abfb13e6f7 | 6a1fb47f901fc6abfb14078a | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb44a901fc6abfb13e6f7 | 6a1fb4b0901fc6abfb14264f | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb44a901fc6abfb13e6f7 | 6a1fb4da901fc6abfb14404a | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb508901fc6abfb145cf3 | 6a1fb50d901fc6abfb145fad | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb508901fc6abfb145cf3 | 6a1fb53a901fc6abfb147bc6 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb508901fc6abfb145cf3 | 6a1fb56b901fc6abfb149a87 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb508901fc6abfb145cf3 | 6a1fb59b901fc6abfb14b835 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb5ca901fc6abfb14d5be | 6a1fb5cf901fc6abfb14d846 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb5ca901fc6abfb14d5be | 6a1fb5fe901fc6abfb14f59b | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb5ca901fc6abfb14d5be | 6a1fb631901fc6abfb1515b6 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb5ca901fc6abfb14d5be | 6a1fb662901fc6abfb1533f4 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb68f901fc6abfb1550be | 6a1fb693901fc6abfb155244 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb68f901fc6abfb1550be | 6a1fb6be901fc6abfb156ce1 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb68f901fc6abfb1550be | 6a1fb6e7901fc6abfb158660 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a1fb68f901fc6abfb1550be | 6a1fb709901fc6abfb159b1a | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fafbf901fc6abfb111456 | 6a1fafc4901fc6abfb1115e4 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fafbf901fc6abfb111456 | 6a1faff4901fc6abfb11335f | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fafbf901fc6abfb111456 | 6a1fb027901fc6abfb115387 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fafbf901fc6abfb111456 | 6a1fb054901fc6abfb116fe3 | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb082901fc6abfb118cc4 | 6a1fb087901fc6abfb118f23 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb082901fc6abfb118cc4 | 6a1fb0b8901fc6abfb11ad79 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb082901fc6abfb118cc4 | 6a1fb0e8901fc6abfb11cb84 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb082901fc6abfb118cc4 | 6a1fb116901fc6abfb11e862 | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb144901fc6abfb12053c | 6a1fb149901fc6abfb1207ba | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb144901fc6abfb12053c | 6a1fb179901fc6abfb122570 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb144901fc6abfb12053c | 6a1fb1a9901fc6abfb1243d7 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb144901fc6abfb12053c | 6a1fb1d6901fc6abfb12607d | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb202901fc6abfb127c2d | 6a1fb206901fc6abfb127dfa | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb202901fc6abfb127c2d | 6a1fb234901fc6abfb129a75 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb202901fc6abfb127c2d | 6a1fb261901fc6abfb12b6b0 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb202901fc6abfb127c2d | 6a1fb28f901fc6abfb12d3d6 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb2bc901fc6abfb12ef8c | 6a1fb2bf901fc6abfb12f13e | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb2bc901fc6abfb12ef8c | 6a1fb2f0901fc6abfb130f6b | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb2bc901fc6abfb12ef8c | 6a1fb31d901fc6abfb132bcb | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb2bc901fc6abfb12ef8c | 6a1fb34b901fc6abfb1348b0 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb37a901fc6abfb136559 | 6a1fb37e901fc6abfb136825 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb37a901fc6abfb136559 | 6a1fb3ad901fc6abfb13851e | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb37a901fc6abfb136559 | 6a1fb3da901fc6abfb13a114 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb37a901fc6abfb136559 | 6a1fb40b901fc6abfb13bfbe | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb438901fc6abfb13db96 | 6a1fb43c901fc6abfb13de22 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb438901fc6abfb13db96 | 6a1fb46c901fc6abfb13fb16 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb438901fc6abfb13db96 | 6a1fb498901fc6abfb1416dd | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb438901fc6abfb13db96 | 6a1fb4c5901fc6abfb143300 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb4f3901fc6abfb14503d | 6a1fb4f7901fc6abfb1451e7 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb4f3901fc6abfb14503d | 6a1fb526901fc6abfb146f22 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb4f3901fc6abfb14503d | 6a1fb556901fc6abfb148d44 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb4f3901fc6abfb14503d | 6a1fb585901fc6abfb14aa73 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb5b6901fc6abfb14c8fe | 6a1fb5bb901fc6abfb14cbcc | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb5b6901fc6abfb14c8fe | 6a1fb5eb901fc6abfb14e985 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb5b6901fc6abfb14c8fe | 6a1fb619901fc6abfb150688 | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb5b6901fc6abfb14c8fe | 6a1fb648901fc6abfb1523d2 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb676901fc6abfb1540dd | 6a1fb67a901fc6abfb154357 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb676901fc6abfb1540dd | 6a1fb6a5901fc6abfb155d2a | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb676901fc6abfb1540dd | 6a1fb6cf901fc6abfb15773a | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a1fb676901fc6abfb1540dd | 6a1fb6f6901fc6abfb158f2f | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fafba901fc6abfb1112a9 | 6a1fafbe901fc6abfb1113a3 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fafba901fc6abfb1112a9 | 6a1fafee901fc6abfb112faa | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fafba901fc6abfb1112a9 | 6a1fb01b901fc6abfb114c5b | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fafba901fc6abfb1112a9 | 6a1fb04c901fc6abfb116ade | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb07a901fc6abfb118817 | 6a1fb07f901fc6abfb118a5f | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb07a901fc6abfb118817 | 6a1fb0aa901fc6abfb11a4bd | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb07a901fc6abfb118817 | 6a1fb0d6901fc6abfb11c084 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb07a901fc6abfb118817 | 6a1fb103901fc6abfb11dc9e | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb131901fc6abfb11f9dd | 6a1fb135901fc6abfb11fbde | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb131901fc6abfb11f9dd | 6a1fb160901fc6abfb1215f4 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb131901fc6abfb11f9dd | 6a1fb18d901fc6abfb123289 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb131901fc6abfb11f9dd | 6a1fb1ba901fc6abfb124ea6 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb1e5901fc6abfb126a45 | 6a1fb1e9901fc6abfb126c53 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb1e5901fc6abfb126a45 | 6a1fb215901fc6abfb128730 | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb1e5901fc6abfb126a45 | 6a1fb243901fc6abfb12a3f4 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb1e5901fc6abfb126a45 | 6a1fb26f901fc6abfb12bf85 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb29c901fc6abfb12dbc7 | 6a1fb2a0901fc6abfb12de25 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb29c901fc6abfb12dbc7 | 6a1fb2d1901fc6abfb12fbbc | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb29c901fc6abfb12dbc7 | 6a1fb300901fc6abfb131943 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb29c901fc6abfb12dbc7 | 6a1fb32e901fc6abfb133675 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb35b901fc6abfb13527e | 6a1fb35f901fc6abfb1354bc | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb35b901fc6abfb13527e | 6a1fb38a901fc6abfb136f52 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb35b901fc6abfb13527e | 6a1fb3b8901fc6abfb138bb5 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb35b901fc6abfb13527e | 6a1fb3e5901fc6abfb13a7f3 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb413901fc6abfb13c4e8 | 6a1fb416901fc6abfb13c680 | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb413901fc6abfb13c4e8 | 6a1fb446901fc6abfb13e3ab | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb413901fc6abfb13c4e8 | 6a1fb472901fc6abfb13ff2d | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb413901fc6abfb13c4e8 | 6a1fb49d901fc6abfb141a1b | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb4cc901fc6abfb143812 | 6a1fb4d1901fc6abfb143a74 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb4cc901fc6abfb143812 | 6a1fb4fc901fc6abfb145539 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb4cc901fc6abfb143812 | 6a1fb528901fc6abfb147076 | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb4cc901fc6abfb143812 | 6a1fb556901fc6abfb148d46 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb584901fc6abfb14aa49 | 6a1fb589901fc6abfb14ad25 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb584901fc6abfb14aa49 | 6a1fb5b7901fc6abfb14c90e | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb584901fc6abfb14aa49 | 6a1fb5e6901fc6abfb14e64f | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb584901fc6abfb14aa49 | 6a1fb615901fc6abfb1503d9 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb646901fc6abfb1522dd | 6a1fb64a901fc6abfb152531 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb646901fc6abfb1522dd | 6a1fb675901fc6abfb153f67 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb646901fc6abfb1522dd | 6a1fb69e901fc6abfb1558b9 | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a1fb646901fc6abfb1522dd | 6a1fb6c9901fc6abfb157346 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fafc2901fc6abfb111550 | 6a1fafc7901fc6abfb11178f | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fafc2901fc6abfb111550 | 6a1faff7901fc6abfb113568 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fafc2901fc6abfb111550 | 6a1fb027901fc6abfb115388 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fafc2901fc6abfb111550 | 6a1fb054901fc6abfb116fca | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb080901fc6abfb118b70 | 6a1fb085901fc6abfb118dd6 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb080901fc6abfb118b70 | 6a1fb0b9901fc6abfb11ae2e | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb080901fc6abfb118b70 | 6a1fb0eb901fc6abfb11cdb7 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb080901fc6abfb118b70 | 6a1fb11a901fc6abfb11eae8 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb149901fc6abfb12086e | 6a1fb14e901fc6abfb120b13 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb149901fc6abfb12086e | 6a1fb17e901fc6abfb1228cd | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb149901fc6abfb12086e | 6a1fb1ac901fc6abfb124582 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb149901fc6abfb12086e | 6a1fb1dc901fc6abfb1263e3 | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb20c901fc6abfb128216 | 6a1fb210901fc6abfb1283d5 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb20c901fc6abfb128216 | 6a1fb23d901fc6abfb12a01a | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb20c901fc6abfb128216 | 6a1fb26e901fc6abfb12bee4 | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb20c901fc6abfb128216 | 6a1fb29b901fc6abfb12db2b | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb2cb901fc6abfb12f8a3 | 6a1fb2ce901fc6abfb12fa33 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb2cb901fc6abfb12f8a3 | 6a1fb2fd901fc6abfb13179b | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb2cb901fc6abfb12f8a3 | 6a1fb32c901fc6abfb133545 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb2cb901fc6abfb12f8a3 | 6a1fb35d901fc6abfb1353b0 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb38b901fc6abfb136fcd | 6a1fb38e901fc6abfb1371ee | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb38b901fc6abfb136fcd | 6a1fb3bf901fc6abfb139056 | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb38b901fc6abfb136fcd | 6a1fb3ec901fc6abfb13acae | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb38b901fc6abfb136fcd | 6a1fb41d901fc6abfb13cb58 | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb44d901fc6abfb13e8c1 | 6a1fb452901fc6abfb13eb3b | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb44d901fc6abfb13e8c1 | 6a1fb482901fc6abfb140975 | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb44d901fc6abfb13e8c1 | 6a1fb4b5901fc6abfb1428ef | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb44d901fc6abfb13e8c1 | 6a1fb4e6901fc6abfb144765 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb517901fc6abfb146637 | 6a1fb51b901fc6abfb146857 | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb517901fc6abfb146637 | 6a1fb549901fc6abfb148550 | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb517901fc6abfb146637 | 6a1fb57b901fc6abfb14a4cb | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb517901fc6abfb146637 | 6a1fb5a9901fc6abfb14c0c1 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb5d7901fc6abfb14ddbc | 6a1fb5db901fc6abfb14dfb3 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb5d7901fc6abfb14ddbc | 6a1fb609901fc6abfb14fc71 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb5d7901fc6abfb14ddbc | 6a1fb639901fc6abfb151a96 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb5d7901fc6abfb14ddbc | 6a1fb667901fc6abfb15372e | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb693901fc6abfb1552e7 | 6a1fb697901fc6abfb155473 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb693901fc6abfb1552e7 | 6a1fb6c1901fc6abfb156e70 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb693901fc6abfb1552e7 | 6a1fb6ed901fc6abfb158969 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a1fb693901fc6abfb1552e7 | 6a1fb70b901fc6abfb159c1a | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fafbf901fc6abfb111454 | 6a1fafc4901fc6abfb1115e8 | Primary financial plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fafbf901fc6abfb111454 | 6a1faff2901fc6abfb11323c | Retirement income scenario ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fafbf901fc6abfb111454 | 6a1fb01f901fc6abfb114e8a | Property & mortgage plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fafbf901fc6abfb111454 | 6a1fb04d901fc6abfb116b6d | Education funding plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb07b901fc6abfb1188a2 | 6a1fb07f901fc6abfb118a62 | Primary financial plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb07b901fc6abfb1188a2 | 6a1fb0ad901fc6abfb11a71f | Retirement income scenario ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb07b901fc6abfb1188a2 | 6a1fb0dc901fc6abfb11c4ce | Property & mortgage plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb07b901fc6abfb1188a2 | 6a1fb106901fc6abfb11de89 | Education funding plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb133901fc6abfb11fb4a | 6a1fb138901fc6abfb11fdeb | Primary financial plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb133901fc6abfb11fb4a | 6a1fb169901fc6abfb121bad | Retirement income scenario ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb133901fc6abfb11fb4a | 6a1fb199901fc6abfb123a1c | Property & mortgage plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb133901fc6abfb11fb4a | 6a1fb1cc901fc6abfb125a50 | Education funding plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb1f7901fc6abfb127571 | 6a1fb1fb901fc6abfb127774 | Primary financial plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb1f7901fc6abfb127571 | 6a1fb228901fc6abfb129302 | Retirement income scenario ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb1f7901fc6abfb127571 | 6a1fb256901fc6abfb12afe7 | Property & mortgage plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb1f7901fc6abfb127571 | 6a1fb283901fc6abfb12cc3d | Education funding plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb2b4901fc6abfb12eaab | 6a1fb2b7901fc6abfb12ec97 | Primary financial plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb2b4901fc6abfb12eaab | 6a1fb2e5901fc6abfb1308b4 | Retirement income scenario ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb2b4901fc6abfb12eaab | 6a1fb311901fc6abfb132460 | Property & mortgage plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb2b4901fc6abfb12eaab | 6a1fb341901fc6abfb13427f | Education funding plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb36d901fc6abfb135da8 | 6a1fb370901fc6abfb135f3c | Primary financial plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb36d901fc6abfb135da8 | 6a1fb39e901fc6abfb137bb0 | Retirement income scenario ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb36d901fc6abfb135da8 | 6a1fb3c9901fc6abfb1396d4 | Property & mortgage plan ΓÇö Alessandro Conti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb36d901fc6abfb135da8 | 6a1fb3f8901fc6abfb13b404 | Education funding plan ΓÇö Andrea Moretti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb429901fc6abfb13d26b | 6a1fb42c901fc6abfb13d463 | Primary financial plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb429901fc6abfb13d26b | 6a1fb45a901fc6abfb13effe | Retirement income scenario ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb429901fc6abfb13d26b | 6a1fb48b901fc6abfb140e76 | Property & mortgage plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb429901fc6abfb13d26b | 6a1fb4ba901fc6abfb142c51 | Education funding plan ΓÇö Luca Ferrero | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb4ea901fc6abfb144abe | 6a1fb4ef901fc6abfb144d50 | Primary financial plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb4ea901fc6abfb144abe | 6a1fb51e901fc6abfb146a72 | Retirement income scenario ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb4ea901fc6abfb144abe | 6a1fb54a901fc6abfb148612 | Property & mortgage plan ΓÇö Marco Rossi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb4ea901fc6abfb144abe | 6a1fb577901fc6abfb14a1cc | Education funding plan ΓÇö Francesca Gallo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb5a5901fc6abfb14be90 | 6a1fb5aa901fc6abfb14c170 | Primary financial plan ΓÇö Chiara Marini | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb5a5901fc6abfb14be90 | 6a1fb5d8901fc6abfb14ddc0 | Retirement income scenario ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb5a5901fc6abfb14be90 | 6a1fb600901fc6abfb14f6de | Property & mortgage plan ΓÇö Elena Romano | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb5a5901fc6abfb14be90 | 6a1fb62e901fc6abfb1513a7 | Education funding plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb65c901fc6abfb1530e2 | 6a1fb660901fc6abfb153348 | Primary financial plan ΓÇö Sofia Valenti | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb65c901fc6abfb1530e2 | 6a1fb68a901fc6abfb154ca8 | Retirement income scenario ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb65c901fc6abfb1530e2 | 6a1fb6b8901fc6abfb1568f5 | Property & mortgage plan ΓÇö Matteo Russo | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a1fb65c901fc6abfb1530e2 | 6a1fb6e0901fc6abfb1581c5 | Education funding plan ΓÇö Giulia Bianchi | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

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
| avg_req_per_sec | 18.12 |
| total_http_requests | 11055 |
| total_iterations | 1005 |
| requests_per_user | 553 |
| vus_max | 20 |

### 19_breaking_point
| field | value |
|-------|-------|
| reached | yes |
| status | Reached |
| reasons | none |

### 20_capacity_assessment
| field | value |
|-------|-------|
| status | Saturated |
| detail | none |

### 21_endpoint_slowest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/cashflows/{cashflowId}/income-expense/financial | n/a | 879 | 508 | 2410 |
| 2 | GET /api/v1/wealth/{cashflowId} | n/a | 761 | 422 | 1866 |
| 3 | GET /api/v1/cashflows/{cashflowId}/timelines | n/a | 687 | 385 | 1866 |
| 4 | GET /api/v1/Events/custom | n/a | 625 | 325 | 2008 |
| 5 | GET /api/v1/cashflows/{cashflowId}/financial | n/a | 615 | 359 | 2810 |

### 22_endpoint_fastest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/client/{clientId}/cashflows | n/a | 324 | 279 | 898 |
| 2 | GET /api/v1/Clients/{id} | n/a | 353 | 282 | 1025 |
| 3 | GET /api/v1/Clients/{advisorId}/all | n/a | 424 | 306 | 2038 |
| 4 | GET /api/v1/cashflows/{cashflowId} | n/a | 519 | 312 | 1359 |
| 5 | GET /api/v1/Events/default | n/a | 567 | 329 | 2889 |
