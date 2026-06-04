# Phase A volume summary — S4-write

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

Generated: 2026-06-04T18:46:51.668Z

## Performance failures

- 20 advisors exceeded latency budgets

## Scenario

| Field | Value |
|-------|-------|
| Scenario | S4 |
| Advisors | 20 |
| Parallel advisor jobs | 20 |
| Clients/advisor | 20 |
| Plans/client | 8 |
| Profile file | data/scenarios/profile_20u_20c_8p.json |
| Elapsed (s) | 5794.8 |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 400 | 400 | PASS |
| Plans | 3200 | 3200 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |

## Advisor execution summary

| Category | Count |
|----------|-------|
| Successful advisors | 20 |
| Failed advisor jobs | 0 |
| Partial advisor results | 0 |
| Advisors over latency budget | 20 |

## Advisor detail

| Advisor | Status | Clients | Plans | Notes |
|---------|--------|---------|-------|-------|
| advisor-00 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-01 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-02 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-03 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-04 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-05 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-06 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-07 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-08 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-09 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-10 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-11 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-12 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-13 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-14 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-15 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-16 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-17 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-18 | Slow | 20/20 | 160/160 | exceeded latency budget |
| advisor-19 | Slow | 20/20 | 160/160 | exceeded latency budget |

## SLO gates

- Fleet SLO gate: **PASS**
- Advisor latency compliance: **FAIL (20/20 advisors exceeded budget)**
_Fleet SLO gate evaluates aggregate endpoint/step violation rates; advisor latency compliance counts per-advisor sign-off budget breaches._

## Latency budget (sign-off)

**Advisors over latency budget:** 20/20 · **All required metrics under budget:** 0/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create cashflow/plan API | 20 | 20 | advisor-00, advisor-01, advisor-02, advisor-03, advisor-04, advisor-05, advisor-06, advisor-07, advisor-08, advisor-09, advisor-10, advisor-11, advisor-12, advisor-13, advisor-14, advisor-15, advisor-16, advisor-17, advisor-18, advisor-19 | 1018 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-00 | User01@gmail.com | 1 | Create cashflow/plan API |
| advisor-01 | User02@gmail.com | 1 | Create cashflow/plan API |
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
| advisor-12 | User13@gmail.com | 1 | Create cashflow/plan API |
| advisor-13 | User14@gmail.com | 1 | Create cashflow/plan API |
| advisor-14 | User15@gmail.com | 1 | Create cashflow/plan API |
| advisor-15 | User16@gmail.com | 1 | Create cashflow/plan API |
| advisor-16 | User17@gmail.com | 1 | Create cashflow/plan API |
| advisor-17 | User18@gmail.com | 1 | Create cashflow/plan API |
| advisor-18 | User19@gmail.com | 1 | Create cashflow/plan API |
| advisor-19 | User20@gmail.com | 1 | Create cashflow/plan API |

