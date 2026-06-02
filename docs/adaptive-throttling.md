# Adaptive throttling & per-API latency reports

Dev-only enhancement for `load-testing-k6`. **Disabled by default** — existing runners and scripts behave unchanged until you opt in.

## Goals

- Per-endpoint latency breakdown (avg, p90, p95, max, count over threshold)
- Detect **sustained** slowdown (not single spikes)
- Graceful early stop via `exec.test.abort()` when degradation is detected
- Preserve teardown, pool lease release, and existing `handleSummary` outputs

## Enable

```powershell
$env:ENABLE_ADAPTIVE_THROTTLE = '1'
$env:STOP_ON_DEGRADATION = '1'          # default on when adaptive enabled
$env:MAX_ACCEPTABLE_API_MS = '500'      # success latency budget

.\runners\run-all-modules.ps1 -Vus 20 -Duration 5m -AdaptiveThrottle
```

Or per run:

```powershell
k6 run -e ENABLE_ADAPTIVE_THROTTLE=1 -e STOP_ON_DEGRADATION=1 `
  -e MAX_ACCEPTABLE_API_MS=500 `
  k6/cashflows-timeline/k6-events-custom-load.js
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_ADAPTIVE_THROTTLE` | off | Master switch |
| `STOP_ON_DEGRADATION` | on (when enabled) | Call `exec.test.abort` on sustained degradation |
| `MAX_ACCEPTABLE_API_MS` | `500` | Latency threshold (ms) |
| `THROTTLE_WINDOW_SIZE` | `100` | Rolling window sample count (per VU) |
| `THROTTLE_FAILURE_PERCENT` | `20` | % of window that must be slow/degrade to count as bad window |
| `THROTTLE_MIN_SAMPLES` | `30` | Minimum samples before evaluation |
| `THROTTLE_CONSECUTIVE_WINDOWS` | `2` | Bad windows in a row before abort |
| `THROTTLE_CHECK_P95` | on | Also fail window if p95 > `MAX_ACCEPTABLE_API_MS` |
| `ADAPTIVE_REPORT_DIR` | script `reports/` subdir | Directory for JSON + markdown reports |

When **`CONSOLIDATED_PERF=1`** (or **`PERF_CAPTURE_REQUEST_CONTEXT=1`**), the same `observeHttp` / `recordApiPerformance` path also feeds **slowest-request forensics** into consolidated slices. See [consolidated-api-performance.md](consolidated-api-performance.md).

## Detection logic

Per VU, each observed HTTP response is appended to a rolling window. A **bad window** occurs when (after `THROTTLE_MIN_SAMPLES`):

- **≥ `THROTTLE_FAILURE_PERCENT`** of samples are slower than `MAX_ACCEPTABLE_API_MS`, or have status `0`, `429`, `502`, `503`, `504`, or **5xx**
- **OR** (if `THROTTLE_CHECK_P95=1`) window **p95** > `MAX_ACCEPTABLE_API_MS`

After **`THROTTLE_CONSECUTIVE_WINDOWS`** bad windows in a row, the test aborts with:

`[adaptive-throttle] Environment capacity threshold reached (...)`

k6 still runs **teardown** and runners still **release** pool leases in `finally`.

## Instrumentation coverage

| Layer | Coverage |
|-------|----------|
| `recordOutcome` / `recordOutcomeWithBuckets` in `common-income-screen.js` | All scripts re-exporting those helpers (income, finances, reports, wealth, …) |
| `lib/auth/ropc.js` | ROPC `/connect/token` |
| `k6-cashflows-timelines-load.js` | Seed + load GET timelines |
| `k6-events-custom-load.js` | Load GET Events/custom + adaptive reports |
| Other timeline/client scripts | Add `observeHttp(res, { … })` after `http.*` calls as needed |

## Reports

When enabled, `handleSummary` also writes:

- `*-adaptive-latency-<timestamp>.json` — structured per-endpoint stats + session context
- `*-adaptive-latency-<timestamp>.md` — human-readable table

Session section includes:

- configured VUs (`vus_max`)
- completed iterations
- early-stop reason / abort VU (if triggered)

### Sample JSON (abbreviated)

```json
{
  "reportType": "adaptive-api-latency",
  "script": "k6-events-custom-load",
  "config": { "maxAcceptableMs": 500, "windowSize": 100, "slowPercent": 20 },
  "session": { "configuredVus": 20, "completedIterations": 412 },
  "degradation": { "detected": true, "reason": "p95=612ms > 500ms over last 100 requests", "abortVu": 7 },
  "apis": [
    {
      "method": "GET",
      "endpoint": "events_custom_get",
      "totalRequests": 8200,
      "overThresholdCount": 410,
      "overThresholdPercent": 5.0,
      "avgMs": 380,
      "p95Ms": 520,
      "maxMs": 2100
    }
  ]
}
```

## Library modules

- `lib/adaptive-throttle-monitor.js` — rolling window, metrics, abort
- `lib/api-latency-reporter.js` — aggregate metrics → JSON/markdown
- `lib/k6-http-observe.js` — `observeHttp(res, meta)`
- `lib/k6-adaptive-integration.js` — `adaptiveSetupData`, `wrapHandleSummaryWithAdaptive`

## Notes

- This does **not** change backend code or production behaviour.
- Under heavy dev load you may see **HTTP 500** on client create before adaptive logic triggers; that is an API outage, not throttling detection.
- Tune `MAX_ACCEPTABLE_API_MS` for dev reality (your runs often show ~2s p95 on Events APIs).
