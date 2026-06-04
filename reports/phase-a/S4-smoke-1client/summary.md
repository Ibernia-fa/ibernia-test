# Phase A volume summary — S4-smoke-1client
Generated: 2026-06-04T08:00:19.738Z
## Scenario
| Field | Value |
|-------|-------|
| Scenario | S4 |
| Advisors | 1 |
| Parallel advisor jobs | 1 |
| Clients/advisor | 1 |
| Plans/client | 1 |
| Profile file | data/scenarios/profile_20u_20c_8p.json |
| Elapsed (s) | n/a |
## Data gates
| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 1 | 0 | FAIL |
| Plans | 1 | 0 | FAIL |
| Shards | 1 | 1 | PASS |
| Manifest validation | — | — | FAIL |
## SLO gates
- Fleet SLO gate: **PASS**
## Failed advisor jobs
- (none)
## Latency budget (sign-off)
### Quota breach — Phase A write

**Advisors over latency budget:** 0/1 · **All required metrics under budget:** 1/1

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

