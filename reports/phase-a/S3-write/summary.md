# Phase A volume summary — S3-write

# Overall Result: PASS WITH PERFORMANCE VIOLATIONS

Data seeding completed successfully.
Manifest validation passed.

However:
- Fleet and/or advisor latency requirements were not met.

## Result summary

| Dimension | Result |
|------------|---------|
| Data seeding | PASS |
| Manifest validation | PASS |
| Fleet SLO gate | PASS |
| Advisor latency compliance | FAIL |
| Performance certification | FAIL |

Generated: 2026-06-04T16:24:46.970Z

## Performance failures

- 14 advisors exceeded latency budgets

## Scenario

| Field | Value |
|-------|-------|
| Scenario | S3 |
| Advisors | 20 |
| Parallel advisor jobs | 20 |
| Clients/advisor | 10 |
| Plans/client | 4 |
| Profile file | data/scenarios/profile_20u_10c_4p.json |
| Elapsed (s) | 1625 |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 200 | 200 | PASS |
| Plans | 800 | 800 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

## Advisor execution summary

| Category | Count |
|----------|-------|
| Successful advisors | 20 |
| Failed advisor jobs | 0 |
| Partial advisor results | 0 |
| Advisors over latency budget | 14 |

## Advisor detail

| Advisor | Status | Clients | Plans | Notes |
|---------|--------|---------|-------|-------|
| advisor-00 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-01 | Success | 10/10 | 40/40 | — |
| advisor-02 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-03 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-04 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-05 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-06 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-07 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-08 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-09 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-10 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-11 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-12 | Success | 10/10 | 40/40 | — |
| advisor-13 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-14 | Success | 10/10 | 40/40 | — |
| advisor-15 | Success | 10/10 | 40/40 | — |
| advisor-16 | Success | 10/10 | 40/40 | — |
| advisor-17 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-18 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-19 | Success | 10/10 | 40/40 | — |

## SLO gates

- Fleet SLO gate: **PASS**
- Advisor latency compliance: **FAIL (14/20 advisors exceeded budget)**
_Fleet SLO gate evaluates aggregate endpoint/step violation rates; advisor latency compliance counts per-advisor sign-off budget breaches._

## Latency budget (sign-off)

**Advisors over latency budget:** 14/20 · **All required metrics under budget:** 6/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create cashflow/plan API | 14 | 20 | advisor-00, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-13, advisor-17, advisor-18 | 1275 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-00 | User01@gmail.com | 1 | Create cashflow/plan API |
| advisor-02 | User03@gmail.com | 1 | Create cashflow/plan API |
| advisor-03 | User04@gmail.com | 1 | Create cashflow/plan API |
| advisor-04 | User05@gmail.com | 1 | Create cashflow/plan API |
| advisor-05 | User06@gmail.com | 1 | Create cashflow/plan API |
| advisor-06 | User07@gmail.com | 1 | Create cashflow/plan API |
| advisor-07 | User08@gmail.com | 1 | Create cashflow/plan API |
| advisor-08 | User09@gmail.com | 1 | Create cashflow/plan API |
| advisor-09 | User10@gmail.com | 1 | Create cashflow/plan API |
| advisor-10 | User11@gmail.com | 1 | Create cashflow/plan API |
| advisor-11 | User12@gmail.com | 1 | Create cashflow/plan API |
| advisor-13 | User14@gmail.com | 1 | Create cashflow/plan API |
| advisor-17 | User18@gmail.com | 1 | Create cashflow/plan API |
| advisor-18 | User19@gmail.com | 1 | Create cashflow/plan API |

