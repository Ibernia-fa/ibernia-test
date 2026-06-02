# k6 exit 99 — threshold audit (S1-write-20260602-1505)

## What exit 99 means

**Exit code 99 is k6’s standard failure code when any `options.thresholds` line fails.** It is not a latency budget of 99 ms or 99%.

This run used `VOLUME_SLO=1` and `VOLUME_SLO_GATE=1` (`-VolumeSloGate`), so Phase A thresholds from `buildPhaseAThresholds()` in `lib/volume-slo.js` were active.

## Configured k6 thresholds (Phase A write)

Source: `config/volume-api-slo.json` + `k6/full-platform/k6-full-platform-orchestrator.js`

### Base (orchestrator)

| Metric | Threshold |
|--------|-----------|
| `checks` | rate > 0.9 (90% pass) |
| `http_req_failed` | rate < 0.15 (15% max failures) |

### Volume SLO (when `-VolumeSloGate`)

| Metric | Threshold | Config gate |
|--------|-----------|-------------|
| `volume_slo_violation_rate` | rate < 0.05 | max combined violations 5% |
| `slo_endpoint_violation_rate` | rate < 0.05 | maxEndpointP95ViolationRate 0.05 |
| `slo_step_violation_rate` | rate < 0.05 | maxStepP95ViolationRate 0.05 |

### Journey step p95 (write profile `stepBudgetMs`)

| k6 Trend metric | p95 limit |
|-----------------|-----------|
| `journey_create_client_duration` | **4000 ms** |
| `journey_create_base_plan_duration` | **5000 ms** |
| `journey_create_timeline_events_duration` | **8000 ms** |
| `journey_add_income_expenses_duration` | **3500 ms** |
| `journey_add_saving_pots_duration` | **3000 ms** |
| `journey_add_contributions_withdrawals_duration` | **3000 ms** |
| `journey_calculate_projection_duration` | **5000 ms** |
| `journey_full_plan_build_duration` | **30000 ms** |

**Note:** Each advisor shard runs **1 VU × 1 iteration**. A single slow step or endpoint marks violation rate **100%**, which fails the **5%** rate thresholds immediately.

## This run: exit 99 shards

| Result | Count |
|--------|-------|
| k6 exit **0** | 9 |
| k6 exit **99** | 11 |

### Crossed metrics (exit 99 shards only)

| Metric | Shards failing | Limit breached |
|--------|----------------|----------------|
| `slo_endpoint_violation_rate` | 11 | HTTP over endpoint budget → rate ≥ 5% |
| `volume_slo_violation_rate` | 11 | any SLO violation → rate ≥ 5% with 1 sample |
| `slo_step_violation_rate` | 8 | step over stepBudgetMs → rate ≥ 5% |
| `journey_create_base_plan_duration` | 4 | p(95) > 5000 ms |
| `journey_create_client_duration` | 3 | p(95) > 4000 ms |
| `journey_create_timeline_events_duration` | 1 | p(95) > 8000 ms |

### Per-shard detail

| Shard | Advisor | Exit | Crossed thresholds |
|-------|---------|------|---------------------|
| advisor-00 | User01@gmail.com | 0 | — |
| advisor-01 | User02@gmail.com | 0 | — |
| advisor-02 | User03@gmail.com | 0 | — |
| advisor-03 | User04@gmail.com | 99 | `journey_create_base_plan_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-04 | User05@gmail.com | 99 | `slo_endpoint_violation_rate`, `volume_slo_violation_rate` |
| advisor-05 | User06@gmail.com | 99 | `slo_endpoint_violation_rate`, `volume_slo_violation_rate` |
| advisor-06 | User07@gmail.com | 0 | — |
| advisor-07 | User08@gmail.com | 99 | `slo_endpoint_violation_rate`, `volume_slo_violation_rate` |
| advisor-08 | User09@gmail.com | 0 | — |
| advisor-09 | User10@gmail.com | 99 | `journey_create_client_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-10 | User11@gmail.com | 0 | — |
| advisor-11 | User12@gmail.com | 0 | — |
| advisor-12 | User13@gmail.com | 99 | `journey_create_base_plan_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-13 | User14@gmail.com | 99 | `journey_create_client_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-14 | User15@gmail.com | 99 | `journey_create_timeline_events_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-15 | User16@gmail.com | 0 | — |
| advisor-16 | User17@gmail.com | 99 | `journey_create_client_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-17 | User18@gmail.com | 99 | `journey_create_base_plan_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-18 | User19@gmail.com | 99 | `journey_create_base_plan_duration`, `slo_endpoint_violation_rate`, `slo_step_violation_rate`, `volume_slo_violation_rate` |
| advisor-19 | User20@gmail.com | 0 | — |

## Fleet SLO gate vs k6 exit 99

- **k6 exit 99:** fails if **any** k6 `options.thresholds` expression is false at end of run.
- **Fleet gate (`slo-summary-fleet.json`):** `evaluateVolumeSloGate()` on exported JSON — this run reported **gatePassed: 20** (shard JSON often had `endpointSamples: 0`, so rates were `null` and gate passed).

Functional journey and data gates still **passed**; exit 99 here is **latency / SLO rate under concurrency**, not missing clients or HTTP errors.
