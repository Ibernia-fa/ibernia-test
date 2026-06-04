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
| runElapsedSec | 200.1 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-04T09:16:14.924Z |
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
| journey_create_client_duration | 20 | 0 | 20 |  | 3002 | 998 |
| journey_create_base_plan_duration | 20 | 0 | 20 |  | 4420 | 580 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 2687 | 313.1 |
| POST /api/v1/cashflows | 20 | 0 | 20 |  | 3421 | 578.8 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 881 | p95 | no | 3119 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 539 | p95 | no | 4461 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 284.8 | max | no | 2715 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 522 | max | no | 3478 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 900 | p95 | no | 3100 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 516 | p95 | no | 4484 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 274.4 | max | no | 2726 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 513.3 | max | no | 3487 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 929 | p95 | no | 3071 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 537 | p95 | no | 4463 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 291 | max | no | 2709 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 535.3 | max | no | 3465 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 998 | p95 | no | 3002 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 580 | p95 | no | 4420 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 313.1 | max | no | 2687 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 578.8 | max | no | 3421 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 926 | p95 | no | 3074 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 525 | p95 | no | 4475 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 284.7 | max | no | 2715 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 523.1 | max | no | 3477 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 916 | p95 | no | 3084 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 572 | p95 | no | 4428 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 286.4 | max | no | 2714 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 569.3 | max | no | 3431 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 888 | p95 | no | 3112 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 536 | p95 | no | 4464 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 276.7 | max | no | 2723 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 530.7 | max | no | 3469 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 884 | p95 | no | 3116 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 506 | p95 | no | 4494 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 263.2 | max | no | 2737 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 504.7 | max | no | 3495 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 925 | p95 | no | 3075 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 544 | p95 | no | 4456 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 277.4 | max | no | 2723 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 541.1 | max | no | 3459 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 923 | p95 | no | 3077 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 537 | p95 | no | 4463 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 299.5 | max | no | 2700 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 531.9 | max | no | 3468 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 907 | p95 | no | 3093 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 530 | p95 | no | 4470 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 285.9 | max | no | 2714 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 528.6 | max | no | 3471 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 992 | p95 | no | 3008 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 550 | p95 | no | 4450 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 306.5 | max | no | 2693 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 544.8 | max | no | 3455 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 938 | p95 | no | 3062 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 563 | p95 | no | 4437 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 282.4 | max | no | 2718 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 560.2 | max | no | 3440 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 910 | p95 | no | 3090 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 542 | p95 | no | 4458 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 280.2 | max | no | 2720 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 540.8 | max | no | 3459 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 951 | p95 | no | 3049 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 548 | p95 | no | 4452 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 285 | max | no | 2715 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 546.7 | max | no | 3453 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 975 | p95 | no | 3025 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 553 | p95 | no | 4447 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 302.2 | max | no | 2698 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 550.3 | max | no | 3450 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 897 | p95 | no | 3103 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 541 | p95 | no | 4459 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 274.1 | max | no | 2726 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 538.5 | max | no | 3462 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 929 | p95 | no | 3071 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 546 | p95 | no | 4454 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 289.5 | max | no | 2710 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 540.6 | max | no | 3459 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 908 | p95 | no | 3092 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 569 | p95 | no | 4431 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 276.8 | max | no | 2723 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 568 | max | no | 3432 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 952 | p95 | no | 3048 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 546 | p95 | no | 4454 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 286.1 | max | no | 2714 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 545.2 | max | no | 3455 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 2175 | 325 |
| full_journey_duration | 18 | 2 | 20 | advisor-12, advisor-17 | 736 | 15439 |
| GET /api/v1/Clients/{advisorId}/all | 19 | 1 | 20 | advisor-15 | 1246 | 3576.6 |
| GET /api/v1/client/{clientId}/cashflows | 20 | 0 | 20 |  | 858 | 1641.6 |
| GET /api/v1/cashflows/{cashflowId} | 19 | 1 | 20 | advisor-11 | 303 | 4271.2 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 314 | p95 | no | 2186 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 9582 | p95 | no | 5418 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 694.3 | max | no | 1806 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 328.9 | max | no | 2171 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2131 | max | no | 869 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 275 | p95 | no | 2225 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 10404 | p95 | no | 4596 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 307.9 | max | no | 2192 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 333.4 | max | no | 2167 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2697.3 | max | no | 303 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 269 | p95 | no | 2231 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 12227 | p95 | no | 2773 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 321.9 | max | no | 2178 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 319.9 | max | no | 2180 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1385.9 | max | no | 1614 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 295 | p95 | no | 2205 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 12074 | p95 | no | 2926 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 461.1 | max | no | 2039 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1641.6 | max | no | 858 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1492.8 | max | no | 1507 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 283 | p95 | no | 2217 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 12776 | p95 | no | 2224 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 375.6 | max | no | 2124 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 370.3 | max | no | 2130 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1425.2 | max | no | 1575 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 296 | p95 | no | 2204 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 11898 | p95 | no | 3102 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 474.1 | max | no | 2026 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 336.7 | max | no | 2163 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1559.9 | max | no | 1440 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 299 | p95 | no | 2201 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 12167 | p95 | no | 2833 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 465.4 | max | no | 2035 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 346.5 | max | no | 2153 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1663.3 | max | no | 1337 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 269 | p95 | no | 2231 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 12642 | p95 | no | 2358 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 365.2 | max | no | 2135 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 564.1 | max | no | 1936 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1183.1 | max | no | 1817 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 267 | p95 | no | 2233 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 14196 | p95 | no | 804 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1254.1 | max | no | 1246 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 314.7 | max | no | 2185 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1415.6 | max | no | 1584 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 275 | p95 | no | 2225 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 14264 | p95 | no | 736 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 486.5 | max | no | 2014 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 477.1 | max | no | 2023 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1206.9 | max | no | 1793 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 325 | p95 | no | 2175 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 12046 | p95 | no | 2954 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 345 | max | no | 2155 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 428.3 | max | no | 2072 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2445.6 | max | no | 554 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 284 | p95 | no | 2216 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 11590 | p95 | no | 3410 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 340.6 | max | no | 2159 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 474.6 | max | no | 2025 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 4271.2 | max | yes | -1271 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 266 | p95 | no | 2234 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 15439 | p95 | yes | -439 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 472 | max | no | 2028 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 343.7 | max | no | 2156 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1926.2 | max | no | 1074 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 261 | p95 | no | 2239 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 13234 | p95 | no | 1766 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 349.7 | max | no | 2150 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 326.9 | max | no | 2173 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1242.3 | max | no | 1758 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 261 | p95 | no | 2239 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 13895 | p95 | no | 1105 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1209.9 | max | no | 1290 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 318.5 | max | no | 2182 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1248.8 | max | no | 1751 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 251 | p95 | no | 2249 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 9970 | p95 | no | 5030 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 3576.6 | max | yes | -1077 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 433 | max | no | 2067 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1361.5 | max | no | 1639 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 283 | p95 | no | 2217 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 11561 | p95 | no | 3439 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 455.6 | max | no | 2044 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 337.7 | max | no | 2162 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1346.9 | max | no | 1653 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 308 | p95 | no | 2192 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 15120 | p95 | yes | -120 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 715.8 | max | no | 1784 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 440.1 | max | no | 2060 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1455.4 | max | no | 1545 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 285 | p95 | no | 2215 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 11483 | p95 | no | 3517 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 489.2 | max | no | 2011 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 334.7 | max | no | 2165 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1355 | max | no | 1645 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 292 | p95 | no | 2208 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 11941 | p95 | no | 3059 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 436.1 | max | no | 2064 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 501.9 | max | no | 1998 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1219.1 | max | no | 1781 |
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
| B | 16 | 4 | advisor-11, advisor-12, advisor-15, advisor-17 |

### 9a_quota_breach_phase_a
### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._


### 9b_quota_breach_phase_b
### Quota breach — Phase B read

**Advisors over latency budget:** 4/20 · **All required metrics under budget:** 16/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| End-to-end advisor journey | 2 | 20 | advisor-12, advisor-17 | 439 |
| List all clients for advisor | 1 | 20 | advisor-15 | 1077 |
| Open cashflow/plan | 1 | 20 | advisor-11 | 1271 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-11 | User12@gmail.com | 1 | Open cashflow/plan |
| advisor-12 | User13@gmail.com | 1 | End-to-end advisor journey |
| advisor-15 | User16@gmail.com | 1 | List all clients for advisor |
| advisor-17 | User18@gmail.com | 1 | End-to-end advisor journey |


### 9c_quota_breach_table
| phase | advisors_over_quota | total_advisors | impacted_journey_steps |
|-------|---------------------|----------------|------------------------|
| A (write) | 0 | 20 | none |
| B (read) | 4 | 20 | End-to-end advisor journey (2); List all clients for advisor (1); Open cashflow/plan (1) |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-11 | journey_calculate_projection_duration | 15524 | 5000 | -10524 |
| 2 | advisor-12 | journey_calculate_projection_duration | 14946 | 5000 | -9946 |
| 3 | advisor-14 | journey_calculate_projection_duration | 14820 | 5000 | -9820 |
| 4 | advisor-13 | journey_calculate_projection_duration | 14465 | 5000 | -9465 |
| 5 | advisor-15 | journey_calculate_projection_duration | 14407 | 5000 | -9407 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-11 | GET /api/v1/cashflows/{cashflowId} | 4271.2 | 3000 | -1271 |
| 2 | advisor-15 | GET /api/v1/Clients/{advisorId}/all | 3576.6 | 2500 | -1077 |
| 3 | advisor-12 | full_journey_duration | 15439 | 15000 | -439 |
| 4 | advisor-17 | full_journey_duration | 15120 | 15000 | -120 |
| 5 | advisor-01 | GET /api/v1/cashflows/{cashflowId} | 2697.3 | 3000 | 303 |

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
| plans_in_profile | 20 |
| plans_with_seed_block | n/a |
| plans_missing_seed_block | 20 |
| seed_enriched | no |

### 15_seed_per_plan
| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |
|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|
| advisor-00 | User01@gmail.com | 6a213f33217bb4e30ab01faa | 6a213f35217bb4e30ab01fb2 | Long-term retirement plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a213f5b217bb4e30ab02144 | 6a213f5c217bb4e30ab0214c | Qualification pathway plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a213f7c217bb4e30ab022e0 | 6a213f7e217bb4e30ab022e8 | Infrastructure career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a213f83217bb4e30ab02385 | 6a213f84217bb4e30ab023ab | Hospitality business plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a213f89217bb4e30ab024a1 | 6a213f8a217bb4e30ab02504 | First-time investor plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a213f90217bb4e30ab02676 | 6a213f91217bb4e30ab026cb | Healthcare career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a213f95217bb4e30ab02809 | 6a213f97217bb4e30ab02860 | Variable income plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a213f9b217bb4e30ab02972 | 6a213f9d217bb4e30ab029d4 | Remote work lifestyle plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a213fa1217bb4e30ab02b4d | 6a213fa3217bb4e30ab02b8c | Late-career consolidation plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a213fa7217bb4e30ab02cd1 | 6a213fa9217bb4e30ab02d27 | Executive wealth plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a213fad217bb4e30ab02e42 | 6a213faf217bb4e30ab02ea2 | Studio succession plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a213fb3217bb4e30ab02fa7 | 6a213fb4217bb4e30ab03006 | Career growth savings plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a213fb8217bb4e30ab03148 | 6a213fba217bb4e30ab03188 | Mid-life financial review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a213fbf217bb4e30ab03312 | 6a213fc1217bb4e30ab0334b | Early career wealth plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a213fc4217bb4e30ab03472 | 6a213fc6217bb4e30ab034bb | Business owner succession plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a213fcc217bb4e30ab0365d | 6a213fcd217bb4e30ab036a2 | Flexible career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a213fd0217bb4e30ab037ba | 6a213fd2217bb4e30ab037fb | Family security plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a213fd8217bb4e30ab0399d | 6a213fd9217bb4e30ab039e6 | Pre-retirement transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a213fdd217bb4e30ab03b22 | 6a213fde217bb4e30ab03b85 | Wealth accumulation plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a213fe3217bb4e30ab03cc8 | 6a213fe5217bb4e30ab03d0d | Long-term retirement plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

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
| avg_req_per_sec | 17.68 |
| total_http_requests | 10786 |
| total_iterations | 978 |
| requests_per_user | 539 |
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
| 1 | GET /api/v1/cashflows/{cashflowId}/income-expense/financial | n/a | 1382 | 825 | 5063 |
| 2 | GET /api/v1/wealth/{cashflowId} | n/a | 1370 | 803 | 5153 |
| 3 | GET /api/v1/cashflows/{cashflowId}/timelines | n/a | 1284 | 675 | 4867 |
| 4 | GET /api/v1/cashflows/{cashflowId}/financial | n/a | 1255 | 605 | 4694 |
| 5 | GET /api/v1/Events/default | n/a | 1214 | 517 | 4271 |

### 22_endpoint_fastest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/Clients/{id} | n/a | 318 | 280 | 1389 |
| 2 | GET /api/v1/Clients/{advisorId}/all | n/a | 324 | 286 | 3577 |
| 3 | GET /api/v1/client/{clientId}/cashflows | n/a | 328 | 282 | 1642 |
| 4 | GET /api/v1/Events/custom | n/a | 849 | 477 | 3429 |
| 5 | GET /api/v1/cashflows/{cashflowId} | n/a | 1139 | 454 | 4271 |
