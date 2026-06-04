# Phase A volume summary — S2-write
Generated: 2026-06-04T09:35:38.035Z
## Scenario
| Field | Value |
|-------|-------|
| Scenario | S2 |
| Advisors | 20 |
| Parallel advisor jobs | 20 |
| Clients/advisor | 5 |
| Plans/client | 2 |
| Profile file | data/scenarios/profile_20u_5c_2p.json |
| Elapsed (s) | n/a |
## Data gates
| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 100 | 100 | PASS |
| Plans | 200 | 200 | PASS |
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

