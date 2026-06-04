### 1_run_metadata
| field | value |
|-------|-------|
| scenario | S4 |
| phase_a_run_tag (requested) | S4-write |
| phase_b_run_tag (requested) | S4-read |
| phase_a_run_tag (resolved) | S4-write |
| phase_b_run_tag (resolved) | S1-read |
| signoff_fleet_file (requested) | reports/phase-volume/S4-write_signoff-fleet.json |
| signoff_fleet_file (resolved) | reports/phase-volume/S4-write_signoff-fleet.json |
| run_metadata_file (requested) | reports/phase-a/S4-write/run-metadata.json |
| run_metadata_file (resolved) | reports/phase-a/S4-write/run-metadata.json |
| slo_summary_fleet_a (requested) | reports/phase-a/S4-write/slo-summary-fleet.json |
| slo_summary_fleet_a (resolved) | reports/phase-a/S4-write/slo-summary-fleet.json |
| slo_summary_fleet_b (requested) | n/a — not found |
| slo_summary_fleet_b (resolved) | n/a |
| slo_summary_b (resolved) | reports/phase-b/S1-read/slo-summary.json |
| journey_summary (resolved) | reports/journeys/k6-journey-advisor-critical-summary.json |
| profile_file (resolved) | data/scenarios/profile_20u_20c_8p.json |
| volumeScenario | S4 |
| userMode | fixed |
| advisors | 20 |
| concurrency | 20 |
| clientsPerAdvisor | 20 |
| plansPerClient | 8 |
| expectedClients | 400 |
| expectedPlans | 3200 |
| runElapsedSec | 5459.5 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-04T06:39:33.125Z |
| slo_config | config/volume-api-slo.json |

### 2_data_gates
| gate | expected | actual | pass |
|------|----------|--------|------|
| clients (write) | 400 | 93 | no |
| plans (write) | 3200 | 744 | no |
| shards | 20 | 20 | yes |
| manifest validation | n/a | passed=false | no |

### 3_phase_a_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_create_client_duration | 20 | 0 | 20 |  | 2914 | 1086 |
| journey_create_base_plan_duration | 19 | 0 | 20 |  | 4711 | 289 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 1335 | 1664.6 |
| POST /api/v1/cashflows | 19 | 0 | 20 |  | 3706 | 294.5 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 441 | p95 | no | 3559 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 253 | p95 | no | 4747 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 437.8 | max | no | 2562 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 258.7 | max | no | 3741 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 431 | p95 | no | 3569 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 267 | p95 | no | 4733 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 442.6 | max | no | 2557 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 274.2 | max | no | 3726 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 443 | p95 | no | 3557 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 264 | p95 | no | 4736 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 441.4 | max | no | 2559 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 265.7 | max | no | 3734 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 437 | p95 | no | 3563 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 258 | p95 | no | 4742 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 437.2 | max | no | 2563 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 266 | max | no | 3734 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 429 | p95 | no | 3571 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 277 | p95 | no | 4723 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 486.7 | max | no | 2513 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 282.8 | max | no | 3717 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 461 | p95 | no | 3539 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 261 | p95 | no | 4739 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 454.9 | max | no | 2545 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 268.8 | max | no | 3731 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 442 | p95 | no | 3558 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 264 | p95 | no | 4736 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 447.8 | max | no | 2552 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 268.3 | max | no | 3732 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 453 | p95 | no | 3547 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 272 | p95 | no | 4728 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 461.8 | max | no | 2538 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 286.5 | max | no | 3713 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 483 | p95 | no | 3517 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 286 | p95 | no | 4714 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1664.6 | max | no | 1335 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 294.5 | max | no | 3706 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 440 | p95 | no | 3560 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 258 | p95 | no | 4742 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 437.5 | max | no | 2562 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 254.4 | max | no | 3746 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 1086 | p95 | no | 2914 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 265 | p95 | no | 4735 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 516.4 | max | no | 2484 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 265.4 | max | no | 3735 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 439 | p95 | no | 3561 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 268 | p95 | no | 4732 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 435.8 | max | no | 2564 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 265.9 | max | no | 3734 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 428 | p95 | no | 3572 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 260 | p95 | no | 4740 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 442.8 | max | no | 2557 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 258.4 | max | no | 3742 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 438 | p95 | no | 3562 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 286 | p95 | no | 4714 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 467.3 | max | no | 2533 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 282.8 | max | no | 3717 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 447 | p95 | no | 3553 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 289 | p95 | no | 4711 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 479.2 | max | no | 2521 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 286.3 | max | no | 3714 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 263 | p95 | no | 3737 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 271 | p95 | no | 4729 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 432.9 | max | no | 2567 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 268.1 | max | no | 3732 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 452 | p95 | no | 3548 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | n/a | p95 | no | n/a |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 469.8 | max | no | 2530 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | n/a | max | no | n/a |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 284 | p95 | no | 3716 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 275 | p95 | no | 4725 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 450.3 | max | no | 2550 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 271.8 | max | no | 3728 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 455 | p95 | no | 3545 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 269 | p95 | no | 4731 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 580.3 | max | no | 2420 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 291.7 | max | no | 3708 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 446 | p95 | no | 3554 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 262 | p95 | no | 4738 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 443.7 | max | no | 2556 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 258.6 | max | no | 3741 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| n/a | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

### 7_errors
| phase | auth_failure_rate | business_failure_rate | http_req_failed |
|-------|-------------------|----------------------|-----------------|
| A | n/a | n/a | n/a |
| B | 0 | 0 | 0 |

### 8_exits
| phase | runner_exit_code | k6_exit_0 | k6_exit_99 | failed_job_ids |
|-------|------------------|-----------|------------|----------------|
| A | n/a | 20 | 0 | advisor-05, advisor-01, advisor-14, advisor-15, advisor-08, advisor-16, advisor-17, advisor-18, advisor-00, advisor-10, advisor-06, advisor-09, advisor-04, manifest-merge, advisor-02, advisor-12, advisor-19, advisor-11, advisor-07, advisor-03, advisor-13 |
| B | 99 | 0 | 1 | |

### 9_fleet_slo_gate
| phase | passed | failed | failed_shard_ids |
|-------|--------|--------|------------------|
| A | 20 | 0 | n/a |
| B | n/a | n/a | n/a |

### 9a_quota_breach_phase_a
### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._


### 9b_quota_breach_phase_b
### Quota breach — Phase B read

_No sign-off shard data — quota breach summary unavailable._


### 9c_quota_breach_table
| phase | advisors_over_quota | total_advisors | impacted_journey_steps |
|-------|---------------------|----------------|------------------------|
| A (write) | 0 | 20 | none |
| B (read) | n/a | n/a | n/a |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-08 | POST /api/v1/Clients | 1664.6 | 3000 | 1335 |
| 2 | advisor-18 | POST /api/v1/Clients | 580.3 | 3000 | 2420 |
| 3 | advisor-10 | POST /api/v1/Clients | 516.4 | 3000 | 2484 |
| 4 | advisor-04 | POST /api/v1/Clients | 486.7 | 3000 | 2513 |
| 5 | advisor-14 | POST /api/v1/Clients | 479.2 | 3000 | 2521 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| n/a | n/a | n/a | n/a | n/a | n/a |

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
| plans_in_profile | 744 |
| plans_with_seed_block | n/a |
| plans_missing_seed_block | 744 |
| seed_enriched | no |

### 15_seed_per_plan
| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |
|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b015d6592c97658e5f38 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b024d6592c97658e6199 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b033d6592c97658e64af | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b042d6592c97658e67f0 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b055d6592c97658e6e27 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b073d6592c97658e77c6 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b093d6592c97658e81b6 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b014d6592c97658e5f2f | 6a20b0a4d6592c97658e87a8 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b0b2d6592c97658e8dcf | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b0c0d6592c97658e954f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b0d0d6592c97658ea243 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b0e2d6592c97658eb166 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b0fbd6592c97658ec699 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b11ed6592c97658ee451 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b13ed6592c97658f0044 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b0b1d6592c97658e8d2c | 6a20b161d6592c97658f1f7d | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b186d6592c97658f40b8 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b1a8d6592c97658f5f35 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b1cbd6592c97658f7e77 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b1f0d6592c97658f9efe | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b211d6592c97658fbca2 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b233d6592c97658fdae7 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b255d6592c97658ff98e | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b181d6592c97658f3d03 | 6a20b279d6592c97659019a5 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b2a1d6592c9765903d58 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b2c5d6592c9765905d24 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b2e6d6592c9765907a6e | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b305d6592c9765909688 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b329d6592c976590b602 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b34dd6592c976590d65c | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b373d6592c976590f6f4 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b29dd6592c97659039b6 | 6a20b395d6592c97659115f0 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b3bbd6592c9765913779 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b3ddd6592c97659155ed | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b400d6592c976591747d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b424d6592c97659194aa | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b446d6592c976591b290 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b468d6592c976591d0f1 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b488d6592c976591ed41 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b3b7d6592c9765913453 | 6a20b4aad6592c9765920bd0 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b4cfd6592c9765922c1d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b4efd6592c97659248d5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b511d6592c9765926738 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b534d6592c9765928676 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b555d6592c976592a3a1 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b578d6592c976592c2d9 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b59ad6592c976592e0d6 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-00 | User01@gmail.com | 6a20b4cbd6592c97659229d2 | 6a20b5bed6592c9765930097 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b01cd6592c97658e5ffd | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b02bd6592c97658e631b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b03ad6592c97658e662c | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b049d6592c97658e696a | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b063d6592c97658e727f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b081d6592c97658e7be1 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b09cd6592c97658e849d | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b01bd6592c97658e5fe1 | 6a20b0aad6592c97658e8a05 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b0b8d6592c97658e90f0 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b0c7d6592c97658e9ae4 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b0d8d6592c97658ea94d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b0f0d6592c97658ebd49 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b110d6592c97658ed7fb | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b132d6592c97658ef643 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b155d6592c97658f154d | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b0b7d6592c97658e900c | 6a20b177d6592c97658f33fc | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b19bd6592c97658f5413 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b1bdd6592c97658f7206 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b1ddd6592c97658f8e82 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b200d6592c97658fadb5 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b222d6592c97658fcafc | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b243d6592c97658fe884 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b264d6592c97659005f0 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b198d6592c97658f5153 | 6a20b286d6592c97659024b8 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b2add6592c976590473d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b2cdd6592c97659063e6 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b2f0d6592c976590834d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b312d6592c976590a18c | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b334d6592c976590bfb7 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b357d6592c976590df0f | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b37bd6592c976590fe44 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b2a9d6592c97659043fa | 6a20b39ed6592c9765911db1 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b3c8d6592c976591434b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b3ead6592c9765916167 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b40cd6592c9765917fb7 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b42ed6592c9765919e40 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b451d6592c976591bcfe | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b474d6592c976591dca9 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b497d6592c976591fbba | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b3c2d6592c9765913f1a | 6a20b4bcd6592c9765921bfd | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b4e1d6592c9765923c4e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b502d6592c9765925950 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b524d6592c9765927793 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b547d6592c976592973c | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b568d6592c976592b3aa | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b589d6592c976592d15a | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b5add6592c976592f19a | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a20b4dcd6592c97659238c3 | 6a20b5ced6592c9765930f60 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b098d6592c97658e8308 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b0a7d6592c97658e88cb | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b0b3d6592c97658e8e6d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b0c1d6592c97658e961c | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b0d0d6592c97658ea2e1 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b0e4d6592c97658eb316 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b0fdd6592c97658ec886 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b096d6592c97658e8268 | 6a20b11ed6592c97658ee44f | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b142d6592c97658f0519 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b166d6592c97658f243d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b188d6592c97658f42b4 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b1a9d6592c97658f5ffc | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b1cbd6592c97658f7e79 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b1ecd6592c97658f9bda | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b20ed6592c97658fb9f8 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b13ed6592c97658f0177 | 6a20b231d6592c97658fd91c | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b255d6592c97658ff97c | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b278d6592c97659018d5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b29bd6592c9765903810 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b2bdd6592c9765905635 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b2dfd6592c9765907472 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b303d6592c976590944c | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b323d6592c976590b092 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b252d6592c97658ff696 | 6a20b345d6592c976590ceda | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b36cd6592c976590f0b1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b38bd6592c9765910c74 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b3aed6592c9765912bc9 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b3cfd6592c976591493c | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b3f2d6592c976591683b | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b415d6592c9765918751 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b434d6592c976591a383 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b367d6592c976590ed1c | 6a20b454d6592c976591c012 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b478d6592c976591e0ba | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b498d6592c976591fca5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b4bbd6592c9765921b0f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b4dcd6592c97659237cd | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b500d6592c976592574f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b523d6592c97659276a0 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b543d6592c97659293b5 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20b473d6592c976591dc9d | 6a20b564d6592c976592b049 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b0aad6592c97658e8a34 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b0b7d6592c97658e902e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b0c5d6592c97658e993f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b0d4d6592c97658ea5a8 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b0e7d6592c97658eb550 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b100d6592c97658ecaeb | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b124d6592c97658ee9e5 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b0a9d6592c97658e899f | 6a20b145d6592c97658f0717 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b16ad6592c97658f289d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b189d6592c97658f438e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b1a7d6592c97658f5e2e | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b1cad6592c97658f7d66 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b1ecd6592c97658f9bdc | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b20ed6592c97658fb9fa | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b230d6592c97658fd854 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b167d6592c97658f255b | 6a20b252d6592c97658ff6ad | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b277d6592c97659017e4 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b299d6592c9765903634 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b2bbd6592c9765905413 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b2ddd6592c9765907280 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b2ffd6592c97659090bf | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b322d6592c976590afcf | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b344d6592c976590cdc4 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b273d6592c97659013ea | 6a20b367d6592c976590ed0c | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b38ed6592c9765910ee6 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b3acd6592c97659129b2 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b3ced6592c9765914852 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b3f1d6592c9765916751 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b410d6592c976591835c | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b430d6592c976591a01a | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b453d6592c976591bf12 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b389d6592c9765910b97 | 6a20b474d6592c976591dcab | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b49bd6592c976591ff42 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b4c0d6592c9765921f8b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b4e6d6592c97659240f3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b50bd6592c9765926175 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b52ed6592c97659280c3 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b550d6592c9765929f40 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b571d6592c976592bc34 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20b496d6592c976591fbad | 6a20b591d6592c976592d937 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b0c1d6592c97658e960b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b0d1d6592c97658ea381 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b0e4d6592c97658eb31b | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b0fdd6592c97658ec888 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b11ed6592c97658ee456 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b13fd6592c97658f018b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b161d6592c97658f1f9a | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b0bfd6592c97658e94d8 | 6a20b182d6592c97658f3d33 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b1a6d6592c97658f5d5e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b1cbd6592c97658f7e7b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b1f0d6592c97658f9efa | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b212d6592c97658fbd7e | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b233d6592c97658fdae2 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b256d6592c97658ffa40 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b27ad6592c9765901a9a | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b1a3d6592c97658f5a8e | 6a20b29ed6592c9765903ab9 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b2c2d6592c9765905a9f | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b2e3d6592c97659077f5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b306d6592c9765909745 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b329d6592c976590b620 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b34ad6592c976590d370 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b36dd6592c976590f1aa | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b38fd6592c9765910fbc | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b2bed6592c97659056f5 | 6a20b3aed6592c9765912bc6 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b3d3d6592c9765914c6e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b3f6d6592c9765916c86 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b41cd6592c9765918d81 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b43fd6592c976591ac67 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b462d6592c976591cbcb | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b481d6592c976591e7a9 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b4a4d6592c9765920723 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b3ced6592c9765914933 | 6a20b4c9d6592c9765922777 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b4f0d6592c9765924a36 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b512d6592c976592680a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b534d6592c9765928673 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b557d6592c976592a590 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b57cd6592c976592c711 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b59fd6592c976592e593 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b5c2d6592c97659304bc | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a20b4ebd6592c9765924630 | 6a20b5e4d6592c97659322df | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b0b8d6592c97658e909b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b0c6d6592c97658e9a6b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b0d7d6592c97658ea88f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b0ecd6592c97658eb9ed | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b109d6592c97658ed1e9 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b12ad6592c97658eeff6 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b14cd6592c97658f0d95 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b0b6d6592c97658e8fea | 6a20b172d6592c97658f2f32 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b19ad6592c97658f52f2 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b1bad6592c97658f6f3a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b1dcd6592c97658f8d9e | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b200d6592c97658fadad | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b222d6592c97658fcb32 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b242d6592c97658fe795 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b265d6592c97659006e5 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b195d6592c97658f4f87 | 6a20b286d6592c97659024b6 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b2add6592c9765904702 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b2cdd6592c97659063ea | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b2efd6592c976590821d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b312d6592c976590a18e | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b335d6592c976590c0a1 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b356d6592c976590de65 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b37ad6592c976590fd72 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b2a9d6592c976590440f | 6a20b39fd6592c9765911e90 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b3c5d6592c97659140c9 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b3e7d6592c9765915ebb | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b409d6592c9765917cfc | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b42dd6592c9765919d44 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b44ed6592c976591ba22 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b470d6592c976591d872 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b491d6592c976591f638 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b3c0d6592c9765913cef | 6a20b4b3d6592c9765921347 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b4d8d6592c97659233e6 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b4f8d6592c976592502a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b519d6592c9765926dc6 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b53bd6592c9765928c30 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b55bd6592c976592a8f1 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b57dd6592c976592c75d | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b59ed6592c976592e4b3 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20b4d4d6592c9765923124 | 6a20b5c1d6592c97659303b9 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b0bcd6592c97658e9318 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b0ccd6592c97658e9ea7 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b0ddd6592c97658eacc7 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b0f3d6592c97658ebfbf | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b111d6592c97658ed8c4 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b132d6592c97658ef645 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b153d6592c97658f13b5 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b0bbd6592c97658e924d | 6a20b176d6592c97658f331e | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b19fd6592c97658f57e2 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b1c2d6592c97658f768c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b1e3d6592c97658f9403 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b205d6592c97658fb244 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b227d6592c97658fd06f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b24bd6592c97658ff039 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b26cd6592c9765900d7a | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b19bd6592c97658f53f7 | 6a20b28dd6592c9765902ac2 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b2b2d6592c9765904bd4 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b2d1d6592c976590676f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b2f2d6592c976590850f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b314d6592c976590a370 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b334d6592c976590bfb5 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b357d6592c976590df0c | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b37ad6592c976590fd74 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b2aed6592c976590482e | 6a20b39bd6592c9765911b97 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b3c0d6592c9765913c1f | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b3e1d6592c97659158c1 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b402d6592c9765917631 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b423d6592c9765919499 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b446d6592c976591b291 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b468d6592c976591d0f4 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b488d6592c976591ed43 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b3bbd6592c9765913848 | 6a20b4aad6592c9765920bd2 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b4cfd6592c9765922c20 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b4f3d6592c9765924bf1 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b514d6592c97659269a5 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b534d6592c9765928678 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b555d6592c976592a3a3 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b578d6592c976592c2d6 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b599d6592c976592dffb | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20b4cbd6592c97659229d0 | 6a20b5bcd6592c976592fecc | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b0c3d6592c97658e97f5 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b0d3d6592c97658ea564 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b0e8d6592c97658eb6e3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b103d6592c97658eccd1 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b123d6592c97658ee8f0 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b144d6592c97658f0659 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b166d6592c97658f2442 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b0c2d6592c97658e96fe | 6a20b187d6592c97658f41d3 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b1abd6592c97658f61bc | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b1cbd6592c97658f7e71 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b1ebd6592c97658f9afb | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b20dd6592c97658fb913 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b230d6592c97658fd852 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b254d6592c97658ff84b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b273d6592c9765901415 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b1a7d6592c97658f5e1f | 6a20b294d6592c9765903161 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b2b9d6592c97659051eb | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b2dcd6592c9765907130 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b2fed6592c9765908fef | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b31ed6592c976590ab87 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b33fd6592c976590c93d | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b361d6592c976590e7a6 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b385d6592c97659106ad | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b2b6d6592c9765904f3d | 6a20b3a6d6592c976591249c | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b3cad6592c97659144e1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b3ecd6592c976591634c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b40dd6592c97659180c2 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b430d6592c976591a020 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b453d6592c976591bf10 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b474d6592c976591dcad | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b494d6592c976591f992 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b3c6d6592c9765914220 | 6a20b4bad6592c9765921a19 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b4ddd6592c97659238d7 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b501d6592c9765925863 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b521d6592c976592759d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b545d6592c97659295f1 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b566d6592c976592b1dd | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b586d6592c976592cf0f | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b5a6d6592c976592eb83 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a20b4d9d6592c97659235cd | 6a20b5cbd6592c9765930cfb | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b0c9d6592c97658e9bf3 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b0d9d6592c97658eaa0e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b0f0d6592c97658ebd4b | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b10fd6592c97658ed6c4 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b132d6592c97658ef648 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b157d6592c97658f16f3 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b177d6592c97658f33f4 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b0c7d6592c97658e9ae7 | 6a20b198d6592c97658f515e | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b1bcd6592c97658f71a1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b1ded6592c97658f8f78 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b200d6592c97658fadaf | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b222d6592c97658fcafa | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b242d6592c97658fe793 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b263d6592c97659004cf | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b285d6592c97659023a3 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b1b8d6592c97658f6d58 | 6a20b2a7d6592c9765904227 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b2cdd6592c97659063e4 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b2efd6592c976590821b | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b312d6592c976590a190 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b335d6592c976590c0b9 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b355d6592c976590dd80 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b377d6592c976590facc | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b398d6592c9765911842 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b2cad6592c97659060f8 | 6a20b3bbd6592c976591377c | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b3e0d6592c9765915869 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b400d6592c9765917479 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b421d6592c97659191af | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b440d6592c976591ad47 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b462d6592c976591cbc9 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b481d6592c976591e7ae | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b4a3d6592c9765920638 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b3dcd6592c976591551b | 6a20b4c6d6592c97659224ae | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b4edd6592c9765924723 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b50fd6592c9765926634 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b533d6592c97659285b0 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b555d6592c976592a3a5 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b578d6592c976592c2db | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b59dd6592c976592e3a6 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b5bfd6592c9765930273 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20b4e8d6592c9765924370 | 6a20b5e2d6592c97659320e1 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b0dad6592c97658eaaa8 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b0f2d6592c97658ebe45 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b111d6592c97658ed8c3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b133d6592c97658ef71a | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b158d6592c97658f1802 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b17bd6592c97658f376e | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b19cd6592c97658f54ce | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b0d8d6592c97658ea8e3 | 6a20b1c0d6592c97658f74b8 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b1e6d6592c97658f9656 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b209d6592c97658fb5b5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b22dd6592c97658fd5d3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b24fd6592c97658ff423 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b276d6592c97659016ba | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b299d6592c9765903631 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b2bed6592c97659056fc | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b1e2d6592c97658f9320 | 6a20b2e3d6592c9765907800 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b30bd6592c9765909b81 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b32fd6592c976590bb49 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b353d6592c976590dbbf | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b378d6592c976590fbbc | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b39ed6592c9765911db3 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b3c3d6592c9765913f25 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b3e5d6592c9765915cf4 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b308d6592c97659098f7 | 6a20b40ad6592c9765917dbe | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b434d6592c976591a382 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b458d6592c976591c371 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b47ad6592c976591e1fa | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b4a0d6592c976592038a | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b4c4d6592c97659222f6 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b4e8d6592c9765924292 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b50cd6592c9765926286 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20b42ed6592c9765919f0c | 6a20b52ed6592c97659280c1 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b0d6d6592c97658ea741 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b0ead6592c97658eb85f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b104d6592c97658ecd95 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b124d6592c97658ee9e0 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b146d6592c97658f07f6 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b166d6592c97658f243b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b189d6592c97658f438c | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b0d4d6592c97658ea5ab | 6a20b1acd6592c97658f62b3 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b1d0d6592c97658f82d0 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b1f2d6592c97658fa112 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b213d6592c97658fbe50 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b233d6592c97658fdae4 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b255d6592c97658ff97e | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b277d6592c97659017e6 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b29ad6592c9765903712 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b1ccd6592c97658f7f37 | 6a20b2bdd6592c9765905633 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b2e2d6592c97659076d1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b304d6592c9765909584 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b325d6592c976590b207 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b345d6592c976590cedd | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b368d6592c976590ed3f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b38ad6592c9765910ba9 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b3abd6592c97659128df | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b2ddd6592c976590726b | 6a20b3cdd6592c9765914772 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b3efd6592c97659165ce | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b410d6592c976591835e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b42fd6592c9765919f25 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b450d6592c976591bbec | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b472d6592c976591db68 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b494d6592c976591f9ad | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b4b7d6592c97659217dc | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b3ebd6592c976591633a | 6a20b4d9d6592c97659234f0 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b4fbd6592c9765925367 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b51ad6592c9765926e98 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b53ad6592c9765928b41 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b55bd6592c976592a8f3 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b57ed6592c976592c843 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b59fd6592c976592e589 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b5bfd6592c9765930271 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20b4f8d6592c97659250e5 | 6a20b5e1d6592c9765932008 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b0e1d6592c97658eafc4 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b0f9d6592c97658ec4ca | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b11ad6592c97658ee099 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b152d6592c97658f12c4 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b176d6592c97658f331f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b19bd6592c97658f540f | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b1bdd6592c97658f71f9 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b0dfd6592c97658eae0b | 6a20b1ded6592c97658f8f76 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b204d6592c97658fb112 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b227d6592c97658fd070 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b24ad6592c97658fef3f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b26ad6592c9765900b92 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b28cd6592c97659029ec | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b2aed6592c9765904836 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b2d1d6592c9765906726 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b200d6592c97658fad98 | 6a20b2f1d6592c976590842e | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b317d6592c976590a5e9 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b339d6592c976590c40f | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b35bd6592c976590e280 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b37cd6592c976590ff4c | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b39fd6592c9765911e8c | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b3c1d6592c9765913dfe | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b3e5d6592c9765915cf1 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b313d6592c976590a262 | 6a20b407d6592c9765917b32 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b42dd6592c9765919d46 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b451d6592c976591bd00 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b475d6592c976591dd80 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b498d6592c976591fcb3 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b4bbd6592c9765921b0d | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b4ded6592c976592399a | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b501d6592c9765925861 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20b429d6592c9765919a44 | 6a20b525d6592c9765927896 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b0e8d6592c97658eb605 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b102d6592c97658ecbf7 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b124d6592c97658ee9e6 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b145d6592c97658f0719 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b16ad6592c97658f27b4 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b18bd6592c97658f456b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b1acd6592c97658f62b0 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b0e5d6592c97658eb415 | 6a20b1d0d6592c97658f82ce | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b1f6d6592c97658fa427 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b215d6592c97658fbfce | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b236d6592c97658fdda4 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b259d6592c97658ffcd8 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b27dd6592c9765901d19 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b29fd6592c9765903bb7 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b2c0d6592c97659058d9 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b1f2d6592c97658fa10b | 6a20b2e2d6592c9765907708 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b309d6592c976590999a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b32bd6592c976590b7f5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b34dd6592c976590d65f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b370d6592c976590f483 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b393d6592c976591137f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b3b6d6592c9765913324 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b3d8d6592c9765915076 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b304d6592c976590956f | 6a20b3f9d6592c9765916e26 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b420d6592c976591909e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b43fd6592c976591ac65 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b463d6592c976591cc8b | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b486d6592c976591ebb3 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b4aad6592c9765920bd1 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b4ccd6592c97659229de | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b4eed6592c97659247ef | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20b41bd6592c9765918d5f | 6a20b511d6592c9765926736 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b0edd6592c97658eba2d | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b10cd6592c97658ed3e6 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b12cd6592c97658ef0f4 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b14cd6592c97658f0d90 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b172d6592c97658f2f2f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b195d6592c97658f4e8c | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b1b9d6592c97658f6e5b | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b0ead6592c97658eb7bc | 6a20b1dcd6592c97658f8d9f | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b204d6592c97658fb11f | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b228d6592c97658fd14c | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b24bd6592c97658ff037 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b26ed6592c9765900f46 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b28dd6592c9765902abe | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b2aed6592c9765904834 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b2d1d6592c976590676d | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b200d6592c97658fad96 | 6a20b2f2d6592c976590850d | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b318d6592c976590a68a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b339d6592c976590c424 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b35ad6592c976590e1c3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b37dd6592c9765910021 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b39fd6592c9765911e8e | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b3c3d6592c9765913f27 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b3e7d6592c9765915eb8 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b314d6592c976590a353 | 6a20b408d6592c9765917c10 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b431d6592c976591a1c5 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b453d6592c976591bf15 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b475d6592c976591dd83 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b497d6592c976591fbb8 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b4bad6592c9765921a17 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b4ddd6592c97659238d9 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b501d6592c9765925866 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20b42cd6592c9765919d38 | 6a20b524d6592c9765927791 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b0f6d6592c97658ec197 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b115d6592c97658edc3e | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b133d6592c97658ef718 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b154d6592c97658f1484 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b178d6592c97658f34b6 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b19bd6592c97658f5411 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b1bed6592c97658f72f7 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b0f3d6592c97658ebf1a | 6a20b1dfd6592c97658f9069 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b204d6592c97658fb15a | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b227d6592c97658fd072 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b249d6592c97658fee46 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b26bd6592c9765900c93 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b28dd6592c9765902ac0 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b2afd6592c976590493b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b2d2d6592c9765906837 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b201d6592c97658fae80 | 6a20b2f6d6592c9765908869 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b31cd6592c976590a9b4 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b33fd6592c976590c93a | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b361d6592c976590e7a8 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b386d6592c976591078b | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b3a9d6592c9765912743 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b3cbd6592c97659145ca | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b3edd6592c9765916432 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b318d6592c976590a6a5 | 6a20b40fd6592c976591828d | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b434d6592c976591a385 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b454d6592c976591c022 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b47ad6592c976591e1f8 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b4a1d6592c976592044d | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b4c5d6592c97659223b5 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b4e9d6592c9765924380 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b50dd6592c976592634b | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a20b42ed6592c9765919f0e | 6a20b531d6592c97659283f2 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b101d6592c97658ecbd4 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b125d6592c97658eea96 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b14ad6592c97658f0bce | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b170d6592c97658f2d64 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b195d6592c97658f4e95 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b1bad6592c97658f6f2f | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b1ddd6592c97658f8e84 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b0fed6592c97658ec89a | 6a20b201d6592c97658fae9d | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b22bd6592c97658fd38b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b24fd6592c97658ff421 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b274d6592c97659014d3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b298d6592c9765903521 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b2bbd6592c976590544f | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b2dfd6592c9765907470 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b305d6592c976590968c | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b226d6592c97658fcf3a | 6a20b32ad6592c976590b712 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b351d6592c976590d9d3 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b375d6592c976590f904 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b398d6592c9765911840 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b3bed6592c9765913a03 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b3dfd6592c97659156fd | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b400d6592c976591747b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b425d6592c97659195b3 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b34dd6592c976590d645 | 6a20b448d6592c976591b478 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b46ed6592c976591d6b0 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b493d6592c976591f793 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b4b6d6592c97659216a1 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b4dad6592c97659235ea | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b4fcd6592c97659253b7 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b51dd6592c9765927105 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b540d6592c9765929086 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20b46ad6592c976591d37f | 6a20b562d6592c976592ae72 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b0fad6592c97658ec4f2 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b119d6592c97658edfb5 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b139d6592c97658efc68 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b158d6592c97658f1804 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b177d6592c97658f33fe | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b197d6592c97658f5087 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b1b8d6592c97658f6d7a | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b0f6d6592c97658ec21c | 6a20b1dbd6592c97658f8c52 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b204d6592c97658fb153 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b226d6592c97658fcf47 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b247d6592c97658fec69 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b269d6592c9765900a89 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b288d6592c9765902674 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b2a9d6592c976590441d | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b2ccd6592c9765906304 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b200d6592c97658fad94 | 6a20b2edd6592c976590805f | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b311d6592c976590a0a3 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b333d6592c976590bee1 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b353d6592c976590dbbb | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b376d6592c976590f9fe | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b398d6592c976591183e | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b3b8d6592c976591355b | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b3d9d6592c976591515d | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b30ed6592c9765909e32 | 6a20b3f8d6592c9765916d6f | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b41ed6592c9765918f85 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b43fd6592c976591ac69 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b460d6592c976591cabe | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b481d6592c976591e7ab | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b4a3d6592c976592063a | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b4c6d6592c97659224a7 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b4e8d6592c9765924294 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b41ad6592c9765918c7b | 6a20b50ad6592c97659260a2 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b52ed6592c97659280bf | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b551d6592c976592a035 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b573d6592c976592be0f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b594d6592c976592dafa | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b5b7d6592c976592f9fb | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b5d8d6592c97659317cc | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b5f8d6592c976593343e | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a20b52ad6592c9765927df9 | 6a20b61ad6592c9765935291 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b105d6592c97658ece67 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b124d6592c97658ee9e2 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b145d6592c97658f0715 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b167d6592c97658f2560 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b188d6592c97658f42b6 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b1acd6592c97658f62ae | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b1ced6592c97658f8107 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b101d6592c97658ecb11 | 6a20b1f0d6592c97658f9efc | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b215d6592c97658fbfbf | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b236d6592c97658fdda2 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b256d6592c97658ffa3f | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b279d6592c97659019a3 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b29ad6592c9765903710 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b2bdd6592c9765905637 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b2ded6592c9765907373 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b211d6592c97658fbc86 | 6a20b2ffd6592c97659090c1 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b325d6592c976590b209 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b348d6592c976590d197 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b368d6592c976590ee03 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b38bd6592c9765910c76 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b3acd6592c97659129b0 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b3ced6592c976591486a | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b3f2d6592c9765916839 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b321d6592c976590aebd | 6a20b416d6592c9765918832 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b43bd6592c976591a8c7 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b45cd6592c976591c674 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b480d6592c976591e6d3 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b4a5d6592c97659207f9 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b4c9d6592c976592275e | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b4ecd6592c976592465c | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b50cd6592c9765926284 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20b436d6592c976591a5cf | 6a20b52fd6592c97659281b4 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b114d6592c97658edb2c | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b137d6592c97658efa27 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b159d6592c97658f18d1 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b17dd6592c97658f3923 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b1a0d6592c97658f5882 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b1c6d6592c97658f79d4 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b1ead6592c97658f9a1f | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b110d6592c97658ed7f9 | 6a20b20ed6592c97658fb9fc | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b238d6592c97658fdf1e | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b25cd6592c97658fff45 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b27fd6592c9765901ed7 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b2a2d6592c9765903e1b | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b2c7d6592c9765905e97 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b2ebd6592c9765907ec1 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b30dd6592c9765909d56 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b233d6592c97658fdadb | 6a20b331d6592c976590bd24 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b35dd6592c976590e3fc | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b37ed6592c97659100e8 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b3a0d6592c9765911f78 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b3c4d6592c9765913ffb | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b3e8d6592c9765915f91 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b40dd6592c97659180c4 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b432d6592c976591a1e1 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b359d6592c976590e0d8 | 6a20b454d6592c976591c015 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b47ed6592c976591e52b | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b4a3d6592c9765920657 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b4cad6592c976592282d | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b4eed6592c97659247ed | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b512d6592c976592680c | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b537d6592c97659288d9 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b55cd6592c976592a9c6 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20b478d6592c976591e117 | 6a20b581d6592c976592cac4 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b10cd6592c97658ed4b0 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b12cd6592c97658ef0f2 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b14bd6592c97658f0ccc | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b170d6592c97658f2d67 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b190d6592c97658f49fb | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b1b2d6592c97658f67c7 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b1d1d6592c97658f8399 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b109d6592c97658ed1e7 | 6a20b1f2d6592c97658fa110 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b218d6592c97658fc1e1 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b237d6592c97658fde5d | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b258d6592c97658ffc1b | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b27ad6592c9765901a9f | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b29dd6592c97659039bd | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b2bdd6592c976590562f | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b2ded6592c9765907371 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b213d6592c97658fbe43 | 6a20b300d6592c97659091a7 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b326d6592c976590b308 | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b348d6592c976590d195 | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b367d6592c976590ed0a | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b38ad6592c9765910bab | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b3abd6592c97659128e1 | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b3cdd6592c9765914770 | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b3f2d6592c9765916837 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b322d6592c976590afaa | 6a20b412d6592c97659185a0 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b438d6592c976591a6ec | Primary financial plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b45ad6592c976591c4fa | Retirement income scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b47cd6592c976591e396 | Property & mortgage plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b49ed6592c97659201c6 | Education funding plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b4c1d6592c976592205e | Inheritance & legacy plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b4e3d6592c9765923e2e | Business exit scenario | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b506d6592c9765925d26 | Career transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20b433d6592c976591a37b | 6a20b525d6592c9765927894 | Tax optimisation review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

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
| avg_req_per_sec | 16.05 |
| total_http_requests | 9791 |
| total_iterations | 887 |
| requests_per_user | 490 |
| vus_max | 20 |

### 19_breaking_point
| field | value |
|-------|-------|
| reached | yes |
| status | Reached |
| reasons | full_journey_p95=15994ms>15000ms |

### 20_capacity_assessment
| field | value |
|-------|-------|
| status | Saturated |
| detail | full_journey_p95=15994ms>15000ms |

### 21_endpoint_slowest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/cashflows/{cashflowId}/income-expense/financial | n/a | 2380 | 1563 | 11235 |
| 2 | GET /api/v1/wealth/{cashflowId} | n/a | 2293 | 1474 | 10197 |
| 3 | GET /api/v1/cashflows/{cashflowId}/timelines | n/a | 2256 | 1380 | 10197 |
| 4 | GET /api/v1/cashflows/{cashflowId}/financial | n/a | 2251 | 1334 | 10197 |
| 5 | GET /api/v1/Events/default | n/a | 1880 | 1002 | 7930 |

### 22_endpoint_fastest
| rank | endpoint | count | p95_ms | avg_ms | max_ms |
|------|----------|------:|-------:|-------:|-------:|
| 1 | GET /api/v1/client/{clientId}/cashflows | n/a | 418 | 356 | 2376 |
| 2 | GET /api/v1/Clients/{id} | n/a | 420 | 350 | 2006 |
| 3 | GET /api/v1/Clients/{advisorId}/all | n/a | 443 | 370 | 3780 |
| 4 | GET /api/v1/Events/custom | n/a | 1483 | 814 | 9132 |
| 5 | GET /api/v1/cashflows/{cashflowId} | n/a | 1700 | 851 | 2535 |
