### 1_run_metadata
| field | value |
|-------|-------|
| scenario | S2 |
| phase_a_run_tag (requested) | S2-write |
| phase_b_run_tag (requested) | S2-read |
| phase_a_run_tag (resolved) | S2-write |
| phase_b_run_tag (resolved) | S2-read |
| signoff_fleet_file (requested) | reports/phase-volume/S2-write_signoff-fleet.json |
| signoff_fleet_file (resolved) | reports/phase-volume/S2-write_signoff-fleet.json |
| run_metadata_file (requested) | reports/phase-a/S2-write/run-metadata.json |
| run_metadata_file (resolved) | reports/phase-a/S2-write/run-metadata.json |
| slo_summary_fleet_a (requested) | reports/phase-a/S2-write/slo-summary-fleet.json |
| slo_summary_fleet_a (resolved) | reports/phase-a/S2-write/slo-summary-fleet.json |
| slo_summary_fleet_b (requested) | n/a — not found |
| slo_summary_fleet_b (resolved) | n/a |
| slo_summary_b (resolved) | reports/phase-b/S2-read/slo-summary.json |
| journey_summary (resolved) | reports/journeys/k6-journey-advisor-critical-summary.json |
| profile_file (resolved) | data/scenarios/profile_20u_5c_2p.json |
| volumeScenario | S2 |
| userMode | fixed |
| advisors | 20 |
| concurrency | 20 |
| clientsPerAdvisor | 5 |
| plansPerClient | 2 |
| expectedClients | 100 |
| expectedPlans | 200 |
| runElapsedSec | 477.2 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-04T09:48:20.649Z |
| slo_config | config/volume-api-slo.json |

### 2_data_gates
| gate | expected | actual | pass |
|------|----------|--------|------|
| clients (write) | 100 | 100 | yes |
| plans (write) | 200 | 200 | yes |
| shards | 20 | 20 | yes |
| manifest validation | n/a | passed=true | yes |

### 3_phase_a_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_create_client_duration | 20 | 0 | 20 |  | 1895 | 2105 |
| journey_create_base_plan_duration | 20 | 0 | 20 |  | 2619 | 2381 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 1993 | 1006.9 |
| POST /api/v1/cashflows | 20 | 0 | 20 |  | 967 | 3033 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 817 | p95 | no | 3183 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 885 | p95 | no | 4115 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 388.2 | max | no | 2612 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 883.6 | max | no | 3116 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 918 | p95 | no | 3082 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 926 | p95 | no | 4074 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 301.1 | max | no | 2699 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 922.9 | max | no | 3077 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 2004 | p95 | no | 1996 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1943 | p95 | no | 3057 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 904 | max | no | 2096 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2846.5 | max | no | 1154 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 2105 | p95 | no | 1895 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 991 | p95 | no | 4009 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 871.8 | max | no | 2128 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2037.1 | max | no | 1963 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 1983 | p95 | no | 2017 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1163 | p95 | no | 3837 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 962.9 | max | no | 2037 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2892.8 | max | no | 1107 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 986 | p95 | no | 3014 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 881 | p95 | no | 4119 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 928.2 | max | no | 2072 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2885.1 | max | no | 1115 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 1932 | p95 | no | 2068 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2381 | p95 | no | 2619 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 832.7 | max | no | 2167 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3013 | max | no | 987 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 2039 | p95 | no | 1961 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1491 | p95 | no | 3509 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 938.5 | max | no | 2061 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2989.1 | max | no | 1011 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 1216 | p95 | no | 2784 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 603 | p95 | no | 4397 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 892.9 | max | no | 2107 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 1903.2 | max | no | 2097 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 1542 | p95 | no | 2458 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 720 | p95 | no | 4280 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 936 | max | no | 2064 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2784.9 | max | no | 1215 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 1444 | p95 | no | 2556 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1080 | p95 | no | 3920 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 935.2 | max | no | 2065 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2885.6 | max | no | 1114 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 1288 | p95 | no | 2712 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1028 | p95 | no | 3972 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 886.3 | max | no | 2114 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2722.1 | max | no | 1278 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 1126 | p95 | no | 2874 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 586 | p95 | no | 4414 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1006.9 | max | no | 1993 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2606.3 | max | no | 1394 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 1360 | p95 | no | 2640 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 526 | p95 | no | 4474 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 934.2 | max | no | 2066 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2006.7 | max | no | 1993 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 1555 | p95 | no | 2445 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1025 | p95 | no | 3975 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 870.7 | max | no | 2129 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2010.2 | max | no | 1990 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 1026 | p95 | no | 2974 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 530 | p95 | no | 4470 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 965.1 | max | no | 2035 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3019.9 | max | no | 980 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 1633 | p95 | no | 2367 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 969 | p95 | no | 4031 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 534.4 | max | no | 2466 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 1909.7 | max | no | 2090 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 949 | p95 | no | 3051 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 545 | p95 | no | 4455 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 885.7 | max | no | 2114 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2999.5 | max | no | 1001 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 1071 | p95 | no | 2929 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 506 | p95 | no | 4494 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 972.5 | max | no | 2027 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2776.1 | max | no | 1224 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 1036 | p95 | no | 2964 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 507 | p95 | no | 4493 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 961.7 | max | no | 2038 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3033 | max | no | 967 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 1981 | 518.8 |
| full_journey_duration | 20 | 0 | 20 |  | 5925 | 9075 |
| GET /api/v1/Clients/{advisorId}/all | 20 | 0 | 20 |  | 1981 | 518.8 |
| GET /api/v1/client/{clientId}/cashflows | 20 | 0 | 20 |  | 1232 | 1268.5 |
| GET /api/v1/cashflows/{cashflowId} | 20 | 0 | 20 |  | 1865 | 1135.5 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 341.8 | max (retro) | no | 2158 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 6568 | max (retro) | no | 8432 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 341.8 | max (retro) | no | 2158 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 462.5 | max (retro) | no | 2038 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1032.5 | max (retro) | no | 1967 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 395.5 | max (retro) | no | 2105 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 7324 | max (retro) | no | 7676 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 395.5 | max (retro) | no | 2105 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 444.8 | max (retro) | no | 2055 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 657.7 | max (retro) | no | 2342 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 453.3 | max (retro) | no | 2047 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 8425 | max (retro) | no | 6575 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 453.3 | max (retro) | no | 2047 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 465.8 | max (retro) | no | 2034 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1060.2 | max (retro) | no | 1940 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 463.7 | max (retro) | no | 2036 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 7331 | max (retro) | no | 7669 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 463.7 | max (retro) | no | 2036 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 343.8 | max (retro) | no | 2156 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 908.5 | max (retro) | no | 2092 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 500.7 | max (retro) | no | 1999 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 7397 | max (retro) | no | 7603 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 500.7 | max (retro) | no | 1999 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 282.9 | max (retro) | no | 2217 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1039.8 | max (retro) | no | 1960 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 462.9 | max (retro) | no | 2037 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 8374 | max (retro) | no | 6626 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 462.9 | max (retro) | no | 2037 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1024.3 | max (retro) | no | 1476 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 523.3 | max (retro) | no | 2477 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 458.9 | max (retro) | no | 2041 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 7633 | max (retro) | no | 7367 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 458.9 | max (retro) | no | 2041 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 327.7 | max (retro) | no | 2172 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 951.5 | max (retro) | no | 2048 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 382.7 | max (retro) | no | 2117 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 8017 | max (retro) | no | 6983 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 382.7 | max (retro) | no | 2117 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 300.8 | max (retro) | no | 2199 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 635.5 | max (retro) | no | 2365 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 505.9 | max (retro) | no | 1994 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 8207 | max (retro) | no | 6793 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 505.9 | max (retro) | no | 1994 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 327.3 | max (retro) | no | 2173 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1011.3 | max (retro) | no | 1989 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 508.4 | max (retro) | no | 1992 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 8323 | max (retro) | no | 6677 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 508.4 | max (retro) | no | 1992 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 574.8 | max (retro) | no | 1925 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 939.5 | max (retro) | no | 2060 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 447.1 | max (retro) | no | 2053 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 6725 | max (retro) | no | 8275 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 447.1 | max (retro) | no | 2053 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 531.1 | max (retro) | no | 1969 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1060.8 | max (retro) | no | 1939 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 478.3 | max (retro) | no | 2022 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 8594 | max (retro) | no | 6406 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 478.3 | max (retro) | no | 2022 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1268.5 | max (retro) | no | 1232 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1123.5 | max (retro) | no | 1877 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 408.6 | max (retro) | no | 2091 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 6878 | max (retro) | no | 8122 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 408.6 | max (retro) | no | 2091 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 352.4 | max (retro) | no | 2148 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 510.8 | max (retro) | no | 2489 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 412.8 | max (retro) | no | 2087 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 6954 | max (retro) | no | 8046 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 412.8 | max (retro) | no | 2087 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 354.6 | max (retro) | no | 2145 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 458 | max (retro) | no | 2542 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 489.1 | max (retro) | no | 2011 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 7294 | max (retro) | no | 7706 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 489.1 | max (retro) | no | 2011 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 441.6 | max (retro) | no | 2058 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 585.4 | max (retro) | no | 2415 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 518.8 | max (retro) | no | 1981 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 7347 | max (retro) | no | 7653 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 518.8 | max (retro) | no | 1981 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 443.6 | max (retro) | no | 2056 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 672.3 | max (retro) | no | 2328 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 460.4 | max (retro) | no | 2040 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 9075 | max (retro) | no | 5925 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 460.4 | max (retro) | no | 2040 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 314.8 | max (retro) | no | 2185 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1018.4 | max (retro) | no | 1982 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 404.8 | max (retro) | no | 2095 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 7518 | max (retro) | no | 7482 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 404.8 | max (retro) | no | 2095 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 331.3 | max (retro) | no | 2169 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1134.2 | max (retro) | no | 1866 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 511.2 | max (retro) | no | 1989 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 8072 | max (retro) | no | 6928 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 511.2 | max (retro) | no | 1989 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 304.2 | max (retro) | no | 2196 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1135.5 | max (retro) | no | 1865 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 383.1 | max (retro) | no | 2117 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 7840 | max (retro) | no | 7160 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 383.1 | max (retro) | no | 2117 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 293.6 | max (retro) | no | 2206 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 517.4 | max (retro) | no | 2483 |
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
| A | 20 | 0 | n/a |
| B | 20 | 0 | n/a |

### 9a_quota_breach_phase_a
### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._


### 9b_quota_breach_phase_b
### Quota breach — Phase B read

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._


### 9c_quota_breach_table
| phase | advisors_over_quota | total_advisors | impacted_journey_steps |
|-------|---------------------|----------------|------------------------|
| A (write) | 0 | 20 | none |
| B (read) | 0 | 20 | none |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-03 | journey_calculate_projection_duration | 27525 | 5000 | -22525 |
| 2 | advisor-02 | journey_calculate_projection_duration | 27155 | 5000 | -22155 |
| 3 | advisor-04 | journey_calculate_projection_duration | 23968 | 5000 | -18968 |
| 4 | advisor-05 | journey_calculate_projection_duration | 23106 | 5000 | -18106 |
| 5 | advisor-01 | journey_calculate_projection_duration | 22091 | 5000 | -17091 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-11 | GET /api/v1/client/{clientId}/cashflows | 1268.5 | 2500 | 1232 |
| 2 | advisor-05 | GET /api/v1/client/{clientId}/cashflows | 1024.3 | 2500 | 1476 |
| 3 | advisor-18 | GET /api/v1/cashflows/{cashflowId} | 1135.5 | 3000 | 1865 |
| 4 | advisor-17 | GET /api/v1/cashflows/{cashflowId} | 1134.2 | 3000 | 1866 |
| 5 | advisor-11 | GET /api/v1/cashflows/{cashflowId} | 1123.5 | 3000 | 1877 |

### 12_friendly_names_map
| api_metric | plain_name |
|------------|------------|
| journey_create_client_duration | Create client (write step) |
| journey_create_base_plan_duration | Create base plan (write step) |
| journey_calculate_projection_duration | Calculate projection (write step) |
| POST /api/v1/Clients | Create client API |
| POST /api/v1/cashflows | Create cashflow/plan API |
| journey_dashboard_load_duration | Dashboard clients list load |
| full_journey_duration | End-to-end advisor journey |
| GET /api/v1/Clients/{advisorId}/all | List all clients for advisor |
| GET /api/v1/client/{clientId}/cashflows | List client plans |
| GET /api/v1/cashflows/{cashflowId} | Open cashflow/plan |
| GET /api/v1/Reports/{cashflowId} | Get reports/projection API |

### 13_seed_spec_expectations
| field | value |
|-------|-------|
| n/a | profile not enriched — run tools/enrich-volume-profile-seed.mjs |

### 14_seed_coverage
| metric | value |
|--------|-------|
| advisors_in_profile | 20 |
| plans_in_profile | 200 |
| plans_with_seed_block | n/a |
| plans_missing_seed_block | 200 |
| seed_enriched | no |

### 15_seed_per_plan
| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |
|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|
| advisor-00 | User01@gmail.com | 6a214522217bb4e30ab1a2f4 | 6a214524217bb4e30ab1a303 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a214522217bb4e30ab1a2f4 | 6a214533217bb4e30ab1a53c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a214541217bb4e30ab1a855 | 6a214542217bb4e30ab1a87e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a214541217bb4e30ab1a855 | 6a21454f217bb4e30ab1ab8d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a21455d217bb4e30ab1aecb | 6a21455e217bb4e30ab1af03 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a21455d217bb4e30ab1aecb | 6a214569217bb4e30ab1b1e5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a21457a217bb4e30ab1b908 | 6a21457c217bb4e30ab1b999 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a21457a217bb4e30ab1b908 | 6a214587217bb4e30ab1be0c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a214597217bb4e30ab1c990 | 6a214599217bb4e30ab1ca8a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a214597217bb4e30ab1c990 | 6a2145aa217bb4e30ab1d735 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a21452d217bb4e30ab1a3f7 | 6a21452e217bb4e30ab1a423 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a21452d217bb4e30ab1a3f7 | 6a21453d217bb4e30ab1a74f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a21454a217bb4e30ab1aa44 | 6a21454b217bb4e30ab1aa78 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a21454a217bb4e30ab1aa44 | 6a214559217bb4e30ab1ada4 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a214564217bb4e30ab1b0bf | 6a214566217bb4e30ab1b0f5 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a214564217bb4e30ab1b0bf | 6a214573217bb4e30ab1b5a9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a214581217bb4e30ab1bbb5 | 6a214583217bb4e30ab1bc1d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a214581217bb4e30ab1bbb5 | 6a21458d217bb4e30ab1c20b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a21459f217bb4e30ab1cf40 | 6a2145a1217bb4e30ab1d026 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a21459f217bb4e30ab1cf40 | 6a2145b4217bb4e30ab1defd | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a21456a217bb4e30ab1b257 | 6a21456c217bb4e30ab1b2cb | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a21456a217bb4e30ab1b257 | 6a214578217bb4e30ab1b858 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a214582217bb4e30ab1bc0d | 6a214584217bb4e30ab1bc85 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a214582217bb4e30ab1bc0d | 6a21458e217bb4e30ab1c2ba | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a214599217bb4e30ab1ca88 | 6a21459a217bb4e30ab1cb87 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a214599217bb4e30ab1ca88 | 6a2145ab217bb4e30ab1d86e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a2145c5217bb4e30ab1eceb | 6a2145c7217bb4e30ab1eefe | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a2145c5217bb4e30ab1eceb | 6a2145e2217bb4e30ab2055d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a21460a217bb4e30ab227a2 | 6a21460d217bb4e30ab22a95 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a21460a217bb4e30ab227a2 | 6a21462d217bb4e30ab24641 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a214585217bb4e30ab1bd14 | 6a214586217bb4e30ab1bda1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a214585217bb4e30ab1bd14 | 6a214591217bb4e30ab1c53b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a21459d217bb4e30ab1cdf7 | 6a21459f217bb4e30ab1cf1a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a21459d217bb4e30ab1cdf7 | 6a2145b2217bb4e30ab1ddcc | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a2145cb217bb4e30ab1f1fe | 6a2145cd217bb4e30ab1f3f2 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a2145cb217bb4e30ab1f1fe | 6a2145ea217bb4e30ab20c48 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a21460e217bb4e30ab22bb8 | 6a214612217bb4e30ab22f56 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a21460e217bb4e30ab22bb8 | 6a21462f217bb4e30ab2481e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a214658217bb4e30ab26bc6 | 6a21465b217bb4e30ab26e17 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a214658217bb4e30ab26bc6 | 6a214676217bb4e30ab28485 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a214589217bb4e30ab1bfa4 | 6a21458b217bb4e30ab1c06a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a214589217bb4e30ab1bfa4 | 6a214596217bb4e30ab1c87c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a2145a5217bb4e30ab1d389 | 6a2145a6217bb4e30ab1d480 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a2145a5217bb4e30ab1d389 | 6a2145bc217bb4e30ab1e5b0 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a2145d3217bb4e30ab1f8ea | 6a2145d6217bb4e30ab1fba8 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a2145d3217bb4e30ab1f8ea | 6a2145f2217bb4e30ab2131c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a214617217bb4e30ab2338a | 6a21461a217bb4e30ab2363d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a214617217bb4e30ab2338a | 6a214639217bb4e30ab250cd | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a214660217bb4e30ab27271 | 6a214664217bb4e30ab27557 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a214660217bb4e30ab27271 | 6a21467d217bb4e30ab28a97 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a21458f217bb4e30ab1c3af | 6a214591217bb4e30ab1c470 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a21458f217bb4e30ab1c3af | 6a21459b217bb4e30ab1ccba | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a2145ad217bb4e30ab1da06 | 6a2145af217bb4e30ab1dbca | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a2145ad217bb4e30ab1da06 | 6a2145c6217bb4e30ab1ede6 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a2145e1217bb4e30ab2048b | 6a2145e5217bb4e30ab207a9 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a2145e1217bb4e30ab2048b | 6a214602217bb4e30ab2214e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a214629217bb4e30ab24264 | 6a21462b217bb4e30ab24462 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a214629217bb4e30ab24264 | 6a214649217bb4e30ab25e42 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a21466f217bb4e30ab27de8 | 6a214671217bb4e30ab28046 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a21466f217bb4e30ab27de8 | 6a21468b217bb4e30ab2956c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a214595217bb4e30ab1c7c0 | 6a214596217bb4e30ab1c8cb | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a214595217bb4e30ab1c7c0 | 6a2145a4217bb4e30ab1d2d9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a2145b9217bb4e30ab1e329 | 6a2145ba217bb4e30ab1e4c8 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a2145b9217bb4e30ab1e329 | 6a2145d2217bb4e30ab1f833 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a2145ef217bb4e30ab2107a | 6a2145f3217bb4e30ab2142d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a2145ef217bb4e30ab2107a | 6a214610217bb4e30ab22da9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a214636217bb4e30ab24df7 | 6a214639217bb4e30ab250cb | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a214636217bb4e30ab24df7 | 6a214656217bb4e30ab26a48 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a21467d217bb4e30ab28aa3 | 6a214680217bb4e30ab28cdc | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a21467d217bb4e30ab28aa3 | 6a21469b217bb4e30ab2a4a6 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a214599217bb4e30ab1cb29 | 6a21459b217bb4e30ab1cc63 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a214599217bb4e30ab1cb29 | 6a2145ad217bb4e30ab1da19 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a2145c3217bb4e30ab1ec81 | 6a2145c6217bb4e30ab1edeb | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a2145c3217bb4e30ab1ec81 | 6a2145e1217bb4e30ab204a6 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a2145fe217bb4e30ab21dae | 6a214601217bb4e30ab2203f | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a2145fe217bb4e30ab21dae | 6a21461e217bb4e30ab2396d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a214640217bb4e30ab25698 | 6a214643217bb4e30ab259d2 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a214640217bb4e30ab25698 | 6a214660217bb4e30ab2728a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a214681217bb4e30ab28d8c | 6a214684217bb4e30ab28fbc | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a214681217bb4e30ab28d8c | 6a21469b217bb4e30ab2a4aa | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a2145a1217bb4e30ab1d071 | 6a2145a3217bb4e30ab1d1bd | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a2145a1217bb4e30ab1d071 | 6a2145b8217bb4e30ab1e25d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a2145d0217bb4e30ab1f6d9 | 6a2145d4217bb4e30ab1f967 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a2145d0217bb4e30ab1f6d9 | 6a2145f2217bb4e30ab2132f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a214610217bb4e30ab22d82 | 6a214614217bb4e30ab23134 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a214610217bb4e30ab22d82 | 6a214630217bb4e30ab2495c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a214653217bb4e30ab26746 | 6a214655217bb4e30ab2695c | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a214653217bb4e30ab26746 | 6a21466f217bb4e30ab27eaa | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a214691217bb4e30ab29b2f | 6a214693217bb4e30ab29d1d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a214691217bb4e30ab29b2f | 6a2146aa217bb4e30ab2b090 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a2145a5217bb4e30ab1d404 | 6a2145a7217bb4e30ab1d555 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a2145a5217bb4e30ab1d404 | 6a2145bd217bb4e30ab1e743 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a2145d6217bb4e30ab1fb4d | 6a2145d9217bb4e30ab1fe4b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a2145d6217bb4e30ab1fb4d | 6a2145f8217bb4e30ab21889 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a214615217bb4e30ab23207 | 6a214618217bb4e30ab23469 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a214615217bb4e30ab23207 | 6a214638217bb4e30ab25005 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a21465c217bb4e30ab26f0d | 6a21465e217bb4e30ab270f3 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a21465c217bb4e30ab26f0d | 6a214679217bb4e30ab2879f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a21469d217bb4e30ab2a5ff | 6a2146a0217bb4e30ab2a7f1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a21469d217bb4e30ab2a5ff | 6a2146b2217bb4e30ab2b8c2 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a2145aa217bb4e30ab1d7ce | 6a2145ac217bb4e30ab1d97d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a2145aa217bb4e30ab1d7ce | 6a2145c3217bb4e30ab1ebe5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a2145df217bb4e30ab202c6 | 6a2145e2217bb4e30ab20569 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a2145df217bb4e30ab202c6 | 6a214602217bb4e30ab2212e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a214622217bb4e30ab23c5b | 6a214624217bb4e30ab23e7e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a214622217bb4e30ab23c5b | 6a214642217bb4e30ab257f2 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a214664217bb4e30ab27573 | 6a214667217bb4e30ab27766 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a214664217bb4e30ab27573 | 6a21467f217bb4e30ab28c00 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a2146a2217bb4e30ab2a9d3 | 6a2146a5217bb4e30ab2abd8 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a2146a2217bb4e30ab2a9d3 | 6a2146b5217bb4e30ab2bab9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a2145b3217bb4e30ab1de6c | 6a2145b5217bb4e30ab1dfd6 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a2145b3217bb4e30ab1de6c | 6a2145cf217bb4e30ab1f558 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a2145ec217bb4e30ab20d7d | 6a2145ef217bb4e30ab210b3 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a2145ec217bb4e30ab20d7d | 6a214611217bb4e30ab22e92 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a214630217bb4e30ab24931 | 6a214634217bb4e30ab24c70 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a214630217bb4e30ab24931 | 6a214652217bb4e30ab26630 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a214675217bb4e30ab283e1 | 6a214678217bb4e30ab286b6 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a214675217bb4e30ab283e1 | 6a214694217bb4e30ab29e9b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a2146b6217bb4e30ab2bb5b | 6a2146b8217bb4e30ab2bd20 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a2146b6217bb4e30ab2bb5b | 6a2146c9217bb4e30ab2cb72 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a2145b8217bb4e30ab1e295 | 6a2145ba217bb4e30ab1e405 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a2145b8217bb4e30ab1e295 | 6a2145d4217bb4e30ab1f997 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a2145f2217bb4e30ab2141e | 6a2145f6217bb4e30ab2173e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a2145f2217bb4e30ab2141e | 6a214612217bb4e30ab22f75 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a214630217bb4e30ab24928 | 6a214633217bb4e30ab24b96 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a214630217bb4e30ab24928 | 6a214650217bb4e30ab2645a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a214675217bb4e30ab28465 | 6a214678217bb4e30ab286b2 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a214675217bb4e30ab28465 | 6a214694217bb4e30ab29e8d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a2146b6217bb4e30ab2bb66 | 6a2146b8217bb4e30ab2bd21 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a2146b6217bb4e30ab2bb66 | 6a2146c8217bb4e30ab2cad5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a2145bc217bb4e30ab1e5ee | 6a2145be217bb4e30ab1e833 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a2145bc217bb4e30ab1e5ee | 6a2145d7217bb4e30ab1fc83 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a2145f4217bb4e30ab2150a | 6a2145f8217bb4e30ab218cc | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a2145f4217bb4e30ab2150a | 6a214612217bb4e30ab22f74 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a21462e217bb4e30ab24749 | 6a214631217bb4e30ab24a0a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a21462e217bb4e30ab24749 | 6a21464e217bb4e30ab26302 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a214671217bb4e30ab280c3 | 6a214673217bb4e30ab28297 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a214671217bb4e30ab280c3 | 6a21468e217bb4e30ab29897 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a2146b2217bb4e30ab2b8c5 | 6a2146b4217bb4e30ab2ba3a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a2146b2217bb4e30ab2b8c5 | 6a2146c5217bb4e30ab2c7fe | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a2145c1217bb4e30ab1ea39 | 6a2145c3217bb4e30ab1ebdf | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a2145c1217bb4e30ab1ea39 | 6a2145de217bb4e30ab202c4 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a2145fc217bb4e30ab21be7 | 6a2145ff217bb4e30ab21f07 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a2145fc217bb4e30ab21be7 | 6a21461c217bb4e30ab2386f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a21463e217bb4e30ab25519 | 6a214642217bb4e30ab25867 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a21463e217bb4e30ab25519 | 6a21465e217bb4e30ab270a9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a21467f217bb4e30ab28c10 | 6a214683217bb4e30ab28ed1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a21467f217bb4e30ab28c10 | 6a21469b217bb4e30ab2a4b9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a2146b7217bb4e30ab2bc2b | 6a2146ba217bb4e30ab2be48 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a2146b7217bb4e30ab2bc2b | 6a2146c9217bb4e30ab2cb63 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a2145c7217bb4e30ab1eed7 | 6a2145ca217bb4e30ab1f132 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a2145c7217bb4e30ab1eed7 | 6a2145e3217bb4e30ab2060e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a214600217bb4e30ab22027 | 6a214605217bb4e30ab22395 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a214600217bb4e30ab22027 | 6a214621217bb4e30ab23b8b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a21463d217bb4e30ab2542f | 6a214640217bb4e30ab2568f | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a21463d217bb4e30ab2542f | 6a21465e217bb4e30ab270a7 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a21467c217bb4e30ab289f9 | 6a21467f217bb4e30ab28c39 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a21467c217bb4e30ab289f9 | 6a214699217bb4e30ab2a2ce | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a2146b5217bb4e30ab2bb04 | 6a2146b7217bb4e30ab2bc13 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a2146b5217bb4e30ab2bb04 | 6a2146c7217bb4e30ab2c9a0 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a2145cf217bb4e30ab1f5ea | 6a2145d1217bb4e30ab1f794 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a2145cf217bb4e30ab1f5ea | 6a2145ef217bb4e30ab21071 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a21460d217bb4e30ab22af0 | 6a21460f217bb4e30ab22d53 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a21460d217bb4e30ab22af0 | 6a21462d217bb4e30ab24644 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a21464b217bb4e30ab25fde | 6a21464d217bb4e30ab261f7 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a21464b217bb4e30ab25fde | 6a214668217bb4e30ab2785a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a214686217bb4e30ab29162 | 6a214688217bb4e30ab292dc | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a214686217bb4e30ab29162 | 6a2146a1217bb4e30ab2a900 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a2146ba217bb4e30ab2be5f | 6a2146bd217bb4e30ab2c031 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a2146ba217bb4e30ab2be5f | 6a2146cb217bb4e30ab2cce3 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a2145d5217bb4e30ab1faa9 | 6a2145d8217bb4e30ab1fd63 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a2145d5217bb4e30ab1faa9 | 6a2145f6217bb4e30ab216ed | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a214612217bb4e30ab22f58 | 6a214616217bb4e30ab2330f | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a214612217bb4e30ab22f58 | 6a214638217bb4e30ab2502b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a214654217bb4e30ab268a9 | 6a214657217bb4e30ab26b30 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a214654217bb4e30ab268a9 | 6a214671217bb4e30ab2809e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a214693217bb4e30ab29d7c | 6a214696217bb4e30ab2a03a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a214693217bb4e30ab29d7c | 6a2146ad217bb4e30ab2b3e7 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a2146c8217bb4e30ab2cada | 6a2146ca217bb4e30ab2cc45 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a2146c8217bb4e30ab2cada | 6a2146d8217bb4e30ab2d782 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a2145db217bb4e30ab1ff50 | 6a2145de217bb4e30ab201ba | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a2145db217bb4e30ab1ff50 | 6a2145fc217bb4e30ab21be5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a214619217bb4e30ab235c7 | 6a21461d217bb4e30ab2388b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a214619217bb4e30ab235c7 | 6a21463e217bb4e30ab25517 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a21465d217bb4e30ab26fe9 | 6a214660217bb4e30ab27256 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a21465d217bb4e30ab26fe9 | 6a21467b217bb4e30ab28909 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a21469b217bb4e30ab2a4a3 | 6a21469f217bb4e30ab2a736 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a21469b217bb4e30ab2a4a3 | 6a2146b2217bb4e30ab2b8ba | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a2146ce217bb4e30ab2ce9a | 6a2146cf217bb4e30ab2cff8 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a2146ce217bb4e30ab2ce9a | 6a2146dc217bb4e30ab2d910 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a2145df217bb4e30ab202ca | 6a2145e2217bb4e30ab20567 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a2145df217bb4e30ab202ca | 6a214601217bb4e30ab22052 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a21461d217bb4e30ab23962 | 6a214622217bb4e30ab23c4c | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a21461d217bb4e30ab23962 | 6a21463e217bb4e30ab25508 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a21465a217bb4e30ab26ddc | 6a21465d217bb4e30ab26fb1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a21465a217bb4e30ab26ddc | 6a214678217bb4e30ab2863a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a214699217bb4e30ab2a2c8 | 6a21469c217bb4e30ab2a562 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a214699217bb4e30ab2a2c8 | 6a2146b2217bb4e30ab2b8b0 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a2146ce217bb4e30ab2cea4 | 6a2146cf217bb4e30ab2cff7 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a2146ce217bb4e30ab2cea4 | 6a2146db217bb4e30ab2d8e9 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

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
| avg_req_per_sec | 18.21 |
| total_http_requests | 11109 |
| total_iterations | 1008 |
| requests_per_user | 555 |
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
| 1 | GET /api/v1/cashflows/{cashflowId}/income-expense/financial | n/a | 921 | 533 | 1467 |
| 2 | GET /api/v1/wealth/{cashflowId} | n/a | 863 | 512 | 1490 |
| 3 | GET /api/v1/cashflows/{cashflowId}/timelines | n/a | 735 | 445 | 1326 |
| 4 | GET /api/v1/cashflows/{cashflowId}/financial | n/a | 600 | 394 | 1155 |
| 5 | GET /api/v1/Events/default | n/a | 597 | 358 | 1256 |

### 22_endpoint_fastest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/client/{clientId}/cashflows | n/a | 291 | 264 | 1268 |
| 2 | GET /api/v1/Clients/{id} | n/a | 292 | 264 | 470 |
| 3 | GET /api/v1/Clients/{advisorId}/all | n/a | 357 | 292 | 519 |
| 4 | GET /api/v1/cashflows/{cashflowId} | n/a | 528 | 324 | 1135 |
| 5 | GET /api/v1/Events/custom | n/a | 583 | 325 | 1167 |
