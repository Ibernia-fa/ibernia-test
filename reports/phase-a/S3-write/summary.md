# Phase A volume summary — S3-write

# Overall Result: FAIL

Generated: 2026-06-04T14:56:47.345Z

## Failure reasons

- Manifest validation failed
- Clients seeded: 106/200
- Plans seeded: 424/800
- 9 advisor job(s) failed at process level
- 13 advisor(s) with partial or missing seed data
- 10 advisors exceeded latency budgets
- Worst create-client latency: 116670 ms
- Manifest shards collected: 13/20

## Scenario

| Field | Value |
|-------|-------|
| Scenario | S3 |
| Advisors | 20 |
| Parallel advisor jobs | 20 |
| Clients/advisor | 10 |
| Plans/client | 4 |
| Profile file | data/scenarios/profile_20u_10c_4p.json |
| Elapsed (s) | 4351.5 |

## Data gates

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 200 | 106 | FAIL |
| Plans | 800 | 424 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |

## Advisor execution summary

| Category | Count |
|----------|-------|
| Successful advisors | 7 |
| Failed advisor jobs | 9 |
| Partial advisor results | 13 |
| Advisors over latency budget | 10 |

## Partial advisor results

- advisor-00 (0/10 clients, 0/40 plans)
- advisor-04 (0/10 clients, 0/40 plans)
- advisor-05 (0/10 clients, 0/40 plans)
- advisor-06 (0/10 clients, 0/40 plans)
- advisor-07 (0/10 clients, 0/40 plans)
- advisor-08 (0/10 clients, 0/40 plans)
- advisor-10 (0/10 clients, 0/40 plans)
- advisor-11 (9/10 clients, 36/40 plans)
- advisor-13 (9/10 clients, 36/40 plans)
- advisor-15 (0/10 clients, 0/40 plans)
- advisor-16 (0/10 clients, 0/40 plans)
- advisor-17 (9/10 clients, 36/40 plans)
- advisor-18 (9/10 clients, 36/40 plans)

## Failed advisor jobs

- advisor-00 (User01@gmail.com) — process failed (exitCode=2)
- advisor-04 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-05 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-06 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-07 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-08 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-10 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-15 — process failed (exitCode=n/a); manifest shard empty or invalid
- advisor-16 (User17@gmail.com) — process failed (exitCode=2)

## Advisor detail

| Advisor | Status | Clients | Plans | Notes |
|---------|--------|---------|-------|-------|
| advisor-00 | Failed | 0/10 | 0/40 | process failed (exitCode=2) |
| advisor-01 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-02 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-03 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-04 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-05 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-06 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-07 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-08 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-09 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-10 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-11 | Partial | 9/10 | 36/40 | plan_seed_failed; exceeded latency budget |
| advisor-12 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-13 | Partial | 9/10 | 36/40 | plan_seed_failed; exceeded latency budget |
| advisor-14 | Slow | 10/10 | 40/40 | exceeded latency budget |
| advisor-15 | Failed | 0/10 | 0/40 | process failed (exitCode=n/a); manifest shard empty or invalid |
| advisor-16 | Failed | 0/10 | 0/40 | process failed (exitCode=2) |
| advisor-17 | Partial | 9/10 | 36/40 | plan_seed_failed; exceeded latency budget |
| advisor-18 | Partial | 9/10 | 36/40 | client_create_failed; exceeded latency budget |
| advisor-19 | Success | 10/10 | 40/40 | — |

## SLO gates

- Fleet SLO gate: **PASS**
- Advisor latency compliance: **FAIL (10/20 advisors exceeded budget)**
_Fleet SLO gate evaluates aggregate endpoint/step violation rates; advisor latency compliance counts per-advisor sign-off budget breaches._

## Latency budget (sign-off)

**Advisors over latency budget:** 10/20 · **All required metrics under budget:** 1/20

#### Impacted journey steps (fleet)

| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |
|--------------|------------------|----------------|------------------|-----------------|
| Create client API | 7 | 20 | advisor-01, advisor-02, advisor-11, advisor-12, advisor-13, advisor-17, advisor-18 | 38430 |
| Create cashflow/plan API | 5 | 20 | advisor-03, advisor-09, advisor-11, advisor-13, advisor-17 | 92720 |
| Create client (write step) | 5 | 20 | advisor-01, advisor-03, advisor-13, advisor-14, advisor-17 | 116670 |

#### Impacted advisors

| shardId | email | metrics over | impacted journey steps |
|---------|-------|--------------|------------------------|
| advisor-01 | User02@gmail.com | 2 | Create client (write step); Create client API |
| advisor-02 | User03@gmail.com | 1 | Create client API |
| advisor-03 | User04@gmail.com | 2 | Create client (write step); Create cashflow/plan API |
| advisor-09 | User10@gmail.com | 1 | Create cashflow/plan API |
| advisor-11 | User12@gmail.com | 2 | Create client API; Create cashflow/plan API |
| advisor-12 | User13@gmail.com | 1 | Create client API |
| advisor-13 | User14@gmail.com | 3 | Create client (write step); Create client API; Create cashflow/plan API |
| advisor-14 | User15@gmail.com | 1 | Create client (write step) |
| advisor-17 | User18@gmail.com | 3 | Create client (write step); Create client API; Create cashflow/plan API |
| advisor-18 | User19@gmail.com | 1 | Create client API |

