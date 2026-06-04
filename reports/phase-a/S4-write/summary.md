# Phase A volume summary — S4-write
Generated: 2026-06-04T07:55:06.991Z
## Scenario
| Field | Value |
|-------|-------|
| Scenario | S4 |
| Advisors | 20 |
| Parallel advisor jobs | 4 |
| Clients/advisor | 20 |
| Plans/client | 8 |
| Profile file | data/scenarios/profile_20u_20c_8p.json |
| Elapsed (s) | n/a |
## Data gates
| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 400 | 0 | FAIL |
| Plans | 3200 | 0 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |
## SLO gates
- Fleet SLO gate: **PASS**
## Failed advisor jobs
- (none)
## Latency budget (sign-off)
### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

