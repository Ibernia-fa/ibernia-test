# Phase A volume summary — S3-write
Generated: 2026-06-03T04:16:05.263Z
## Scenario
| Field | Value |
|-------|-------|
| Scenario | S3 |
| Advisors | 20 |
| Clients/advisor | 10 |
| Plans/client | 4 |
| Profile file | data/scenarios/profile_20u_10c_4p.json |
| Elapsed (s) | n/a |
## Data gates
| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 200 | 20 | FAIL |
| Plans | 800 | 80 | FAIL |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | FAIL |
## SLO gates
- Fleet SLO gate: **PASS**
## Failed advisor jobs
- (none)
