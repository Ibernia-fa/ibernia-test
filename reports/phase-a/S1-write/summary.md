# Phase A volume summary — S1-write
Generated: 2026-06-04T09:05:58.276Z
## Scenario
| Field | Value |
|-------|-------|
| Scenario | S1 |
| Advisors | 20 |
| Parallel advisor jobs | 20 |
| Clients/advisor | 1 |
| Plans/client | 1 |
| Profile file | data/scenarios/profile_20u_1c_1p.json |
| Elapsed (s) | n/a |
## Data gates
| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 20 | 20 | PASS |
| Plans | 20 | 20 | PASS |
| Shards | 20 | 20 | PASS |
| Manifest validation | — | — | PASS |
## SLO gates
- Fleet SLO gate: **PASS**
## Failed advisor jobs
- (none)
## Latency budget (sign-off)
### Quota breach — Phase A write

**Advisors over latency budget:** 0/20 · **All required metrics under budget:** 20/20

_No advisors exceeded the latency budget — all monitored journey steps are within quota._

