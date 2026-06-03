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
| runElapsedSec | 112.1 |
| manifestCollected | 20 |
| sloCollected | 20 |
| signoff_generatedAt | 2026-06-03T16:40:14.814Z |
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
| journey_create_client_duration | 20 | 0 | 20 |  | 919 | 3081 |
| journey_create_base_plan_duration | 20 | 0 | 20 |  | 899 | 4101 |
| POST /api/v1/Clients | 20 | 0 | 20 |  | 1901 | 1099 |
| POST /api/v1/cashflows | 10 | 10 | 20 | advisor-04, advisor-06, advisor-07, advisor-08, advisor-10, advisor-13, advisor-14, advisor-16, advisor-17, advisor-19 | 6 | 4097.5 |

### 4_phase_a_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_create_client_duration | 4000 | n/a | 841 | p95 | no | 3159 |
| advisor-00 | User01@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 541 | p95 | no | 4459 |
| advisor-00 | User01@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 258.4 | max | no | 2742 |
| advisor-00 | User01@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 538.6 | max | no | 3461 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_create_client_duration | 4000 | n/a | 880 | p95 | no | 3120 |
| advisor-01 | User02@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 528 | p95 | no | 4472 |
| advisor-01 | User02@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 260.7 | max | no | 2739 |
| advisor-01 | User02@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 526 | max | no | 3474 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_create_client_duration | 4000 | n/a | 2109 | p95 | no | 1891 |
| advisor-02 | User03@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2057 | p95 | no | 2943 |
| advisor-02 | User03@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 288.2 | max | no | 2712 |
| advisor-02 | User03@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2055 | max | no | 1945 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_create_client_duration | 4000 | n/a | 2137 | p95 | no | 1863 |
| advisor-03 | User04@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 1972 | p95 | no | 3028 |
| advisor-03 | User04@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 276 | max | no | 2724 |
| advisor-03 | User04@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 1965.7 | max | no | 2034 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_create_client_duration | 4000 | n/a | 3006 | p95 | no | 994 |
| advisor-04 | User05@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4078 | p95 | no | 922 |
| advisor-04 | User05@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 992.2 | max | no | 2008 |
| advisor-04 | User05@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4074.7 | max | yes | -75 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_create_client_duration | 4000 | n/a | 1008 | p95 | no | 2992 |
| advisor-05 | User06@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2003 | p95 | no | 2997 |
| advisor-05 | User06@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 268.9 | max | no | 2731 |
| advisor-05 | User06@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 1983.5 | max | no | 2016 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_create_client_duration | 4000 | n/a | 2801 | p95 | no | 1199 |
| advisor-06 | User07@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4101 | p95 | no | 899 |
| advisor-06 | User07@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 714.1 | max | no | 2286 |
| advisor-06 | User07@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4097.5 | max | yes | -97 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_create_client_duration | 4000 | n/a | 3081 | p95 | no | 919 |
| advisor-07 | User08@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4015 | p95 | no | 985 |
| advisor-07 | User08@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1037.9 | max | no | 1962 |
| advisor-07 | User08@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4007.1 | max | yes | -7 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_create_client_duration | 4000 | n/a | 2847 | p95 | no | 1153 |
| advisor-08 | User09@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4094 | p95 | no | 906 |
| advisor-08 | User09@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 739.7 | max | no | 2260 |
| advisor-08 | User09@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4092.1 | max | yes | -92 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_create_client_duration | 4000 | n/a | 2112 | p95 | no | 1888 |
| advisor-09 | User10@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4001 | p95 | no | 999 |
| advisor-09 | User10@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 245 | max | no | 2755 |
| advisor-09 | User10@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3993.8 | max | no | 6 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_create_client_duration | 4000 | n/a | 2798 | p95 | no | 1202 |
| advisor-10 | User11@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4019 | p95 | no | 981 |
| advisor-10 | User11@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 703.9 | max | no | 2296 |
| advisor-10 | User11@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4017.3 | max | yes | -17 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_create_client_duration | 4000 | n/a | 2092 | p95 | no | 1908 |
| advisor-11 | User12@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3935 | p95 | no | 1065 |
| advisor-11 | User12@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 258.6 | max | no | 2741 |
| advisor-11 | User12@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3928.4 | max | no | 72 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_create_client_duration | 4000 | n/a | 2133 | p95 | no | 1867 |
| advisor-12 | User13@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 3960 | p95 | no | 1040 |
| advisor-12 | User13@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 248.4 | max | no | 2752 |
| advisor-12 | User13@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 3953 | max | no | 47 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_create_client_duration | 4000 | n/a | 2113 | p95 | no | 1887 |
| advisor-13 | User14@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4012 | p95 | no | 988 |
| advisor-13 | User14@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 257.1 | max | no | 2743 |
| advisor-13 | User14@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4006.1 | max | yes | -6 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_create_client_duration | 4000 | n/a | 3032 | p95 | no | 968 |
| advisor-14 | User15@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4059 | p95 | no | 941 |
| advisor-14 | User15@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1099 | max | no | 1901 |
| advisor-14 | User15@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4051.4 | max | yes | -51 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_create_client_duration | 4000 | n/a | 991 | p95 | no | 3009 |
| advisor-15 | User16@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2004 | p95 | no | 2996 |
| advisor-15 | User16@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 280.8 | max | no | 2719 |
| advisor-15 | User16@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2000.1 | max | no | 2000 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_create_client_duration | 4000 | n/a | 3063 | p95 | no | 937 |
| advisor-16 | User17@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4032 | p95 | no | 968 |
| advisor-16 | User17@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 1094.8 | max | no | 1905 |
| advisor-16 | User17@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4023 | max | yes | -23 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_create_client_duration | 4000 | n/a | 2107 | p95 | no | 1893 |
| advisor-17 | User18@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4008 | p95 | no | 992 |
| advisor-17 | User18@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 273.2 | max | no | 2727 |
| advisor-17 | User18@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4007.5 | max | yes | -7 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_create_client_duration | 4000 | n/a | 948 | p95 | no | 3052 |
| advisor-18 | User19@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 2042 | p95 | no | 2958 |
| advisor-18 | User19@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 278.2 | max | no | 2722 |
| advisor-18 | User19@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 2038.1 | max | no | 1962 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_create_client_duration | 4000 | n/a | 2130 | p95 | no | 1870 |
| advisor-19 | User20@gmail.com | journey_create_base_plan_duration | 5000 | n/a | 4016 | p95 | no | 984 |
| advisor-19 | User20@gmail.com | POST /api/v1/Clients | 3000 | 8000 | 265 | max | no | 2735 |
| advisor-19 | User20@gmail.com | POST /api/v1/cashflows | 4000 | 15000 | 4008.4 | max | yes | -8 |
| advisor-19 | User20@gmail.com | GET /api/v1/Reports/{cashflowId} | 3000 | 7500 | n/a | n/a | n/a | n/a |

### 5_phase_b_fleet

| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |
|--------|-------------|------------|--------------|------------------|-----------------|-----------------|
| journey_dashboard_load_duration | 20 | 0 | 20 |  | 2130 | 370 |
| full_journey_duration | 17 | 3 | 20 | advisor-00, advisor-10, advisor-13 | 444 | 15829 |
| GET /api/v1/Clients/{advisorId}/all | 17 | 3 | 20 | advisor-03, advisor-07, advisor-17 | 326 | 3779.5 |
| GET /api/v1/client/{clientId}/cashflows | 20 | 0 | 20 |  | 124 | 2375.7 |
| GET /api/v1/cashflows/{cashflowId} | 20 | 0 | 20 |  | 465 | 2534.7 |
| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |

### 6_phase_b_per_shard
| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |
|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|
| advisor-00 | User01@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 328 | p95 | no | 2172 |
| advisor-00 | User01@gmail.com | full_journey_duration | 15000 | n/a | 15808 | p95 | yes | -808 |
| advisor-00 | User01@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 689.2 | max | no | 1811 |
| advisor-00 | User01@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 761.5 | max | no | 1738 |
| advisor-00 | User01@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2275.7 | max | no | 724 |
| advisor-00 | User01@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 320 | p95 | no | 2180 |
| advisor-01 | User02@gmail.com | full_journey_duration | 15000 | n/a | 14036 | p95 | no | 964 |
| advisor-01 | User02@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 530.6 | max | no | 1969 |
| advisor-01 | User02@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 465.3 | max | no | 2035 |
| advisor-01 | User02@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1867.1 | max | no | 1133 |
| advisor-01 | User02@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 310 | p95 | no | 2190 |
| advisor-02 | User03@gmail.com | full_journey_duration | 15000 | n/a | 12722 | p95 | no | 2278 |
| advisor-02 | User03@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 778 | max | no | 1722 |
| advisor-02 | User03@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1846.9 | max | no | 653 |
| advisor-02 | User03@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1780.3 | max | no | 1220 |
| advisor-02 | User03@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 357 | p95 | no | 2143 |
| advisor-03 | User04@gmail.com | full_journey_duration | 15000 | n/a | 10807 | p95 | no | 4193 |
| advisor-03 | User04@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2802.3 | max | yes | -302 |
| advisor-03 | User04@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 430.8 | max | no | 2069 |
| advisor-03 | User04@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2186.8 | max | no | 813 |
| advisor-03 | User04@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 333 | p95 | no | 2167 |
| advisor-04 | User05@gmail.com | full_journey_duration | 15000 | n/a | 11986 | p95 | no | 3014 |
| advisor-04 | User05@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2148.4 | max | no | 352 |
| advisor-04 | User05@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1441.3 | max | no | 1059 |
| advisor-04 | User05@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2056.7 | max | no | 943 |
| advisor-04 | User05@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 312 | p95 | no | 2188 |
| advisor-05 | User06@gmail.com | full_journey_duration | 15000 | n/a | 14556 | p95 | no | 444 |
| advisor-05 | User06@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2174 | max | no | 326 |
| advisor-05 | User06@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1958.8 | max | no | 541 |
| advisor-05 | User06@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1807.8 | max | no | 1192 |
| advisor-05 | User06@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 323 | p95 | no | 2177 |
| advisor-06 | User07@gmail.com | full_journey_duration | 15000 | n/a | 12140 | p95 | no | 2860 |
| advisor-06 | User07@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 479.7 | max | no | 2020 |
| advisor-06 | User07@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 494.4 | max | no | 2006 |
| advisor-06 | User07@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2456.5 | max | no | 543 |
| advisor-06 | User07@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 298 | p95 | no | 2202 |
| advisor-07 | User08@gmail.com | full_journey_duration | 15000 | n/a | 12303 | p95 | no | 2697 |
| advisor-07 | User08@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 3779.5 | max | yes | -1280 |
| advisor-07 | User08@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 433.5 | max | no | 2066 |
| advisor-07 | User08@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2334 | max | no | 666 |
| advisor-07 | User08@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 326 | p95 | no | 2174 |
| advisor-08 | User09@gmail.com | full_journey_duration | 15000 | n/a | 11967 | p95 | no | 3033 |
| advisor-08 | User09@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 436 | max | no | 2064 |
| advisor-08 | User09@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 579.9 | max | no | 1920 |
| advisor-08 | User09@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1634.4 | max | no | 1366 |
| advisor-08 | User09@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 315 | p95 | no | 2185 |
| advisor-09 | User10@gmail.com | full_journey_duration | 15000 | n/a | 11612 | p95 | no | 3388 |
| advisor-09 | User10@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 425.5 | max | no | 2074 |
| advisor-09 | User10@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 710 | max | no | 1790 |
| advisor-09 | User10@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1772.6 | max | no | 1227 |
| advisor-09 | User10@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 336 | p95 | no | 2164 |
| advisor-10 | User11@gmail.com | full_journey_duration | 15000 | n/a | 15829 | p95 | yes | -829 |
| advisor-10 | User11@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2117.4 | max | no | 383 |
| advisor-10 | User11@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 417.1 | max | no | 2083 |
| advisor-10 | User11@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2159.4 | max | no | 841 |
| advisor-10 | User11@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 306 | p95 | no | 2194 |
| advisor-11 | User12@gmail.com | full_journey_duration | 15000 | n/a | 13314 | p95 | no | 1686 |
| advisor-11 | User12@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2060.3 | max | no | 440 |
| advisor-11 | User12@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 422.8 | max | no | 2077 |
| advisor-11 | User12@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2436.6 | max | no | 563 |
| advisor-11 | User12@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 329 | p95 | no | 2171 |
| advisor-12 | User13@gmail.com | full_journey_duration | 15000 | n/a | 13135 | p95 | no | 1865 |
| advisor-12 | User13@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 724.2 | max | no | 1776 |
| advisor-12 | User13@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 552.5 | max | no | 1948 |
| advisor-12 | User13@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1701.9 | max | no | 1298 |
| advisor-12 | User13@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 370 | p95 | no | 2130 |
| advisor-13 | User14@gmail.com | full_journey_duration | 15000 | n/a | 15180 | p95 | yes | -180 |
| advisor-13 | User14@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 987.8 | max | no | 1512 |
| advisor-13 | User14@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 679.6 | max | no | 1820 |
| advisor-13 | User14@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2070.1 | max | no | 930 |
| advisor-13 | User14@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 338 | p95 | no | 2162 |
| advisor-14 | User15@gmail.com | full_journey_duration | 15000 | n/a | 14256 | p95 | no | 744 |
| advisor-14 | User15@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 490.9 | max | no | 2009 |
| advisor-14 | User15@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 2125.3 | max | no | 375 |
| advisor-14 | User15@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1959.6 | max | no | 1040 |
| advisor-14 | User15@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 353 | p95 | no | 2147 |
| advisor-15 | User16@gmail.com | full_journey_duration | 15000 | n/a | 10548 | p95 | no | 4452 |
| advisor-15 | User16@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 1099 | max | no | 1401 |
| advisor-15 | User16@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 2375.7 | max | no | 124 |
| advisor-15 | User16@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2392.5 | max | no | 607 |
| advisor-15 | User16@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 321 | p95 | no | 2179 |
| advisor-16 | User17@gmail.com | full_journey_duration | 15000 | n/a | 11682 | p95 | no | 3318 |
| advisor-16 | User17@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 418.6 | max | no | 2081 |
| advisor-16 | User17@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 1711.3 | max | no | 789 |
| advisor-16 | User17@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2141.3 | max | no | 859 |
| advisor-16 | User17@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 313 | p95 | no | 2187 |
| advisor-17 | User18@gmail.com | full_journey_duration | 15000 | n/a | 12911 | p95 | no | 2089 |
| advisor-17 | User18@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 2552.8 | max | yes | -53 |
| advisor-17 | User18@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 438.9 | max | no | 2061 |
| advisor-17 | User18@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2484.3 | max | no | 516 |
| advisor-17 | User18@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 359 | p95 | no | 2141 |
| advisor-18 | User19@gmail.com | full_journey_duration | 15000 | n/a | 13980 | p95 | no | 1020 |
| advisor-18 | User19@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 469.7 | max | no | 2030 |
| advisor-18 | User19@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 424.4 | max | no | 2076 |
| advisor-18 | User19@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 2534.7 | max | no | 465 |
| advisor-18 | User19@gmail.com | GET /api/v1/Reports/{cashflowId} | 5000 | 15000 | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | journey_dashboard_load_duration | 2500 | n/a | 358 | p95 | no | 2142 |
| advisor-19 | User20@gmail.com | full_journey_duration | 15000 | n/a | 12881 | p95 | no | 2119 |
| advisor-19 | User20@gmail.com | GET /api/v1/Clients/{advisorId}/all | 2500 | 5000 | 626.7 | max | no | 1873 |
| advisor-19 | User20@gmail.com | GET /api/v1/client/{clientId}/cashflows | 2500 | 4000 | 917.2 | max | no | 1583 |
| advisor-19 | User20@gmail.com | GET /api/v1/cashflows/{cashflowId} | 3000 | 4000 | 1620.1 | max | no | 1380 |
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
| A | 10 | 10 | advisor-04, advisor-06, advisor-07, advisor-08, advisor-10, advisor-13, advisor-14, advisor-16, advisor-17, advisor-19 |
| B | 14 | 6 | advisor-00, advisor-03, advisor-07, advisor-10, advisor-13, advisor-17 |

### 10_top5_slowest_phase_a
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-05 | journey_calculate_projection_duration | 31384 | 5000 | -26384 |
| 2 | advisor-15 | journey_calculate_projection_duration | 31380 | 5000 | -26380 |
| 3 | advisor-02 | journey_calculate_projection_duration | 30311 | 5000 | -25311 |
| 4 | advisor-03 | journey_calculate_projection_duration | 29377 | 5000 | -24377 |
| 5 | advisor-17 | journey_calculate_projection_duration | 29372 | 5000 | -24372 |

### 11_top5_slowest_phase_b
| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |
|------|----------|--------|-----------|-----------|-----------|
| 1 | advisor-07 | GET /api/v1/Clients/{advisorId}/all | 3779.5 | 2500 | -1280 |
| 2 | advisor-10 | full_journey_duration | 15829 | 15000 | -829 |
| 3 | advisor-00 | full_journey_duration | 15808 | 15000 | -808 |
| 4 | advisor-03 | GET /api/v1/Clients/{advisorId}/all | 2802.3 | 2500 | -302 |
| 5 | advisor-13 | full_journey_duration | 15180 | 15000 | -180 |

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
| advisor-00 | User01@gmail.com | 6a2055f0d6592c976556bc11 | 6a2055f1d6592c976556bc19 | Long-term retirement plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-01 | User02@gmail.com | 6a2055f4d6592c976556bc9b | 6a2055f6d6592c976556bcd9 | Qualification pathway plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-02 | User03@gmail.com | 6a20562dd6592c976556bf51 | 6a205630d6592c976556c06d | Infrastructure career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-03 | User04@gmail.com | 6a20562ed6592c976556bf88 | 6a205631d6592c976556c0bf | Hospitality business plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-04 | User05@gmail.com | 6a205630d6592c976556c061 | 6a205634d6592c976556c292 | First-time investor plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-05 | User06@gmail.com | 6a20562dd6592c976556bf5b | 6a20562fd6592c976556bfb5 | Healthcare career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-06 | User07@gmail.com | 6a20562fd6592c976556bfc5 | 6a205633d6592c976556c1c9 | Variable income plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-07 | User08@gmail.com | 6a205630d6592c976556c05f | 6a205634d6592c976556c2a4 | Remote work lifestyle plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-08 | User09@gmail.com | 6a20562fd6592c976556bfc3 | 6a205633d6592c976556c1d8 | Late-career consolidation plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-09 | User10@gmail.com | 6a20562fd6592c976556bfa6 | 6a205632d6592c976556c11b | Executive wealth plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-10 | User11@gmail.com | 6a20562fd6592c976556bfc7 | 6a205633d6592c976556c1c1 | Studio succession plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-11 | User12@gmail.com | 6a20562fd6592c976556bfb0 | 6a205632d6592c976556c156 | Career growth savings plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-12 | User13@gmail.com | 6a20562fd6592c976556bfa2 | 6a205632d6592c976556c15b | Mid-life financial review | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-13 | User14@gmail.com | 6a20562fd6592c976556bfa7 | 6a205632d6592c976556c128 | Early career wealth plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-14 | User15@gmail.com | 6a205630d6592c976556c065 | 6a205634d6592c976556c294 | Business owner succession plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-15 | User16@gmail.com | 6a20562dd6592c976556bf58 | 6a20562fd6592c976556bfb2 | Flexible career plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-16 | User17@gmail.com | 6a205630d6592c976556c063 | 6a205634d6592c976556c28d | Family security plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-17 | User18@gmail.com | 6a20562fd6592c976556bfae | 6a205632d6592c976556c154 | Pre-retirement transition plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-18 | User19@gmail.com | 6a20562dd6592c976556bf60 | 6a20562fd6592c976556bfac | Wealth accumulation plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| advisor-19 | User20@gmail.com | 6a20562fd6592c976556bfa9 | 6a205632d6592c976556c130 | Long-term retirement plan | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

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
