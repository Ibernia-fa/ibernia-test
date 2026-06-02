# Advisor critical journey — per-endpoint stats

Generated: 2026-06-01T11:09:06.005Z

(no endpoint samples recorded)

## Journey thresholds

| Journey metric | Avg | p90 | p95 | p99 | Max | Budget | Pass/Fail |
|----------------|----:|----:|----:|----:|----:|-------:|:---------:|
| journey_login_duration | 518ms | 590ms | 718ms | n/a | 1021ms | 1500ms | pass |
| journey_dashboard_load_duration | 6575ms | 14509ms | 15370ms | n/a | 16991ms | 2500ms | fail |
| journey_open_client_duration | 293ms | 316ms | 371ms | n/a | 475ms | 2000ms | pass |
| journey_cashflow_load_duration | 925ms | 1616ms | 2002ms | n/a | 2479ms | 3000ms | pass |
| user_lag_rate | 17.14% | n/a | n/a | n/a | n/a | <5% | fail |

## Dashboard payload

```json
{
  "samples": 0,
  "clientsReturned": {
    "min": null,
    "max": null,
    "avg": null
  },
  "responseBytes": {
    "min": null,
    "max": null,
    "avg": null
  }
}
```
