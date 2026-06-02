# Advisor critical journey — per-endpoint stats

Generated: 2026-06-02T11:39:16.848Z

(no endpoint samples recorded)

## Journey thresholds

| Journey metric | Avg | p90 | p95 | p99 | Max | Budget | Pass/Fail |
|----------------|----:|----:|----:|----:|----:|-------:|:---------:|
| journey_login_duration | 540ms | 627ms | 679ms | n/a | 1375ms | 1500ms | pass |
| journey_dashboard_load_duration | 360ms | 577ms | 755ms | n/a | 1393ms | 2500ms | pass |
| journey_open_client_duration | 353ms | 552ms | 750ms | n/a | 1872ms | 2000ms | pass |
| journey_client_plans_load_duration | 350ms | 534ms | 733ms | n/a | 1214ms | 2000ms | pass |
| journey_open_plan_duration | 407ms | 661ms | 847ms | n/a | 3929ms | 2000ms | pass |
| journey_timeline_load_duration | 474ms | 782ms | 991ms | n/a | 3498ms | 2500ms | pass |
| journey_income_expenses_load_duration | 652ms | 1061ms | 1220ms | n/a | 6109ms | 2500ms | pass |
| journey_saving_pots_load_duration | 540ms | 888ms | 1084ms | n/a | 5679ms | 3000ms | pass |
| journey_projection_load_duration | 869ms | 1395ms | 1892ms | n/a | 5749ms | 6000ms | pass |
| journey_cashflow_load_duration | 1045ms | 1626ms | 1970ms | n/a | 8915ms | 3000ms | pass |
| full_journey_duration | 12653ms | 14353ms | 15048ms | n/a | 22320ms | 15000ms | fail |
| dashboard_response_size | 845ms | 530ms | 3380ms | n/a | 4223ms | 2500ms | fail |
| client_plans_response_size | 610ms | 610ms | 610ms | n/a | 610ms | 2500ms | pass |
| cashflow_response_size | 568ms | 568ms | 568ms | n/a | 568ms | 2500ms | pass |
| projection_response_size | 493ms | 493ms | 493ms | n/a | 493ms | 2500ms | pass |
| user_lag_rate | 0.81% | n/a | n/a | n/a | n/a | <5% | pass |

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
