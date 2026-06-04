# Phase A volume summary — S4-write
Generated: 2026-06-04T06:39:32.978Z
## Scenario
| Field | Value |
|-------|-------|
| Scenario | S4 |
| Advisors | 20 |
| Clients/advisor | 20 |
| Plans/client | 8 |
| Profile file | data/scenarios/profile_20u_20c_8p.json |
| Elapsed (s) | 5459.5 |
## Data gates
| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 400 | 93 | FAIL |
| Plans | 3200 | 744 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |
## SLO gates
- Fleet SLO gate: **PASS**
## Failed advisor jobs
- advisor-05
- advisor-01
- advisor-14
- advisor-15
- advisor-08
- advisor-16
- advisor-17
- advisor-18
- advisor-00
- advisor-10
- advisor-06
- advisor-09
- advisor-04
- manifest-merge
- advisor-02
- advisor-12
- advisor-19
- advisor-11
- advisor-07
- advisor-03
- advisor-13
## Latency budget (sign-off)
### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

