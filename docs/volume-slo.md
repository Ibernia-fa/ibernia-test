# Volume SLO framework (Phase 1)

Reusable **volume SLO** (service level objective) framework for Ibernia k6 load tests. Phase 1 provides configuration, pure math/store logic, k6 HTTP integration via `observeHttp`, and summary generation — without journey scripts, orchestrator changes, or PowerShell runners.

**Related:** [k6-journey-lag-implementation-report.md](k6-journey-lag-implementation-report.md), [load-testing-automation-implementation.md](load-testing-automation-implementation.md).

---

## Files

| Path | Role |
|------|------|
| `config/volume-api-slo.json` | Read/write profile budgets (endpoints + steps) |
| `lib/volume-slo-core.js` | Pure logic — Node unit-testable |
| `lib/volume-slo.js` | k6 integration (Trend/Rate, store, env) |
| `lib/k6-http-observe.js` | Calls `recordVolumeSloHttp` when enabled |
| `tools/volume-slo.test.mjs` | Unit tests (`node --test tools/volume-slo.test.mjs`) |

---

## Enable

```powershell
k6 run k6/clients/k6-clients-list-load.js `
  -e VOLUME_SLO=1 `
  -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
  -e SIGNUP_ROPC_CLIENT_SECRET=$env:STS_SECRET
```

Any script that uses `observeHttp()` (or ROPC via `lib/auth/ropc.js`) records samples when `VOLUME_SLO=1`.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VOLUME_SLO` | off | `1` / `true` enables sampling |
| `VOLUME_SLO_CONFIG` | `config/volume-api-slo.json` | Budget config path (alias: **`VOLUME_SLO_FILE`**) |
| `VOLUME_SLO_FILE` | — | Alias for **`VOLUME_SLO_CONFIG`** |
| `VOLUME_SLO_PROFILE` | — | Force `read` or `write` for all samples |
| `VOLUME_SLO_AUTO_PROFILE` | `1` | Infer profile from HTTP method (GET→read, POST/PUT/DELETE→write) |
| `VOLUME_SLO_GATE` | off | When `1`, enforce step/endpoint violation rates + optional p95 gate in summary JSON |
| `VOLUME_SLO_GATE_ENDPOINT_P95` | off | When `1` with gate, fail gate on any endpoint row with p95 > budget (strict mode) |
| `VOLUME_SLO_RUN_ID` | `FULL_PLATFORM_RUN_TAG` / `PERF_RUN_ID` | Run label; Phase A report dir name |
| `FULL_PLATFORM_RUN_TAG` | — | Default run id for Phase A report path |
| `VOLUME_SLO_SUMMARY_JSON` | `reports/volume-slo/volume-slo-summary.json` | Generic handleSummary path (Phase 1) |

---

## Profiles: read vs write

| Profile | Typical use | Default budget |
|---------|-------------|----------------|
| **read** | GET list/open/plan load | 2500 ms |
| **write** | POST/PUT/DELETE mutations | 3000 ms |

Each profile defines:

- `defaultBudgetMs` — fallback when endpoint/step not listed
- `endpointBudgetMs` — keys like `"GET /api/v1/Clients/{advisorId}/all"`
- `stepBudgetMs` — journey step names (for Phase 2+)

When `VOLUME_SLO_AUTO_PROFILE=1` (default), HTTP observations pick the profile from the request method. Override per request with `meta.sloProfile` or `meta.profile` in `observeHttp(res, meta)`.

---

## API reference

### `lib/volume-slo-core.js` (pure, Node-testable)

| Function | Description |
|----------|-------------|
| `parseVolumeSloConfig(raw)` | Parse and validate JSON config object |
| `profileForHttpMethod(method)` | `GET`/`HEAD`/`OPTIONS` → `read`; else → `write` |
| `normalizeProfileName(value, fallback)` | Normalize to `read` or `write` |
| `normalizeEndpointPath(urlOrPath)` | Catalog-style path with `{id}` placeholders |
| `endpointBudgetKey(method, endpoint)` | `"GET /api/v1/..."` lookup key |
| `resolveEndpointBudget(config, profile, method, endpoint)` | `{ profile, budgetMs, key }` |
| `resolveStepBudget(config, profile, stepName)` | `{ profile, budgetMs, step }` |
| `percentile(sorted, p)` | Percentile on sorted array |
| `calculateP95(samples)` | p95 ms |
| `calculateViolationRate(samples, budgetMs)` | `{ violations, violationRate, count }` |
| `summarizeSamples(samples)` | count, avg, min, max, p90, p95, p99 |
| `createVolumeSloStore()` | Empty `{ endpoints, steps, profilesUsed }` |
| `recordEndpointSample(store, config, input)` | Append HTTP duration; increment violations |
| `recordStepSample(store, config, input)` | Append step duration |
| `buildEndpointRow(bucket)` / `buildStepRow(bucket)` | Single summary row with `passFail` |
| `buildVolumeSloSummary(store, config, meta)` | Full report object |

**Pass/fail rule:** `passFail` is `pass` when **p95 ≤ budgetMs**, else `fail`.

### `lib/volume-slo.js` (k6)

| Function | Description |
|----------|-------------|
| `volumeSloConfigFromEnv()` | Read enable flag, paths, profile overrides |
| `loadVolumeSloConfig(pathOverride?)` | Load JSON via k6 `open()`; embedded fallback on error |
| `recordVolumeSloHttp(res, meta?)` | Record one HTTP sample (from `observeHttp`) |
| `recordVolumeSloStep(stepName, durationMs, meta?)` | Record journey step (Phase 2) |
| `getVolumeSloStore()` | In-process sample store |
| `buildVolumeSloReport(extra?)` | Summary from store |
| `attachVolumeSloToSummary(out, extra?)` | Add JSON file to handleSummary map |

Re-exports all core functions for convenience.

### k6 custom metrics (when enabled)

| Metric | Type | Tags |
|--------|------|------|
| `volume_slo_duration_ms` | Trend | `profile`, `method`, `endpoint` |
| `volume_slo_violation_rate` | Rate | `profile`, `method`, `endpoint` or `step` |

---

## Data structures

### Config (`config/volume-api-slo.json`)

```json
{
  "version": 1,
  "defaultProfile": "read",
  "fallbackBudgetMs": 3000,
  "profiles": {
    "read": {
      "description": "...",
      "defaultBudgetMs": 2500,
      "endpointBudgetMs": { "GET /api/v1/Clients/{advisorId}/all": 2500 },
      "stepBudgetMs": { "dashboard_load": 2500 }
    },
    "write": { "...": "..." }
  }
}
```

### In-memory store

```javascript
{
  endpoints: {
    "read\u0000GET /api/v1/Clients/{advisorId}/all": {
      method: "GET",
      endpoint: "/api/v1/Clients/{advisorId}/all",
      profile: "read",
      budgetMs: 2500,
      durations: [1200, 3100, ...],
      violations: 1
    }
  },
  steps: { /* same shape for journey steps */ },
  profilesUsed: { read: true, write: true }
}
```

### Summary output (`reports/volume-slo/volume-slo-summary.json`)

```json
{
  "reportType": "volume-slo-summary",
  "generatedAt": "2026-06-02T12:00:00.000Z",
  "configVersion": 1,
  "defaultProfile": "read",
  "profilesUsed": ["read", "write"],
  "enabled": true,
  "runId": "concurrent-20260602-120000",
  "endpoints": [
    {
      "method": "GET",
      "endpoint": "/api/v1/Clients/{advisorId}/all",
      "profile": "read",
      "budgetMs": 2500,
      "count": 120,
      "violations": 8,
      "violationRate": 0.0667,
      "avgMs": 980,
      "p95Ms": 2400,
      "passFail": "pass"
    }
  ],
  "steps": [],
  "rates": {
    "endpointViolationRate": 0.04,
    "stepViolationRate": null
  },
  "totals": {
    "endpointSamples": 120,
    "stepSamples": 0,
    "endpointViolations": 8,
    "stepViolations": 0
  }
}
```

---

## Phase A — full-platform write SLO (integrated)

**Script:** `k6/full-platform/k6-full-platform-orchestrator.js` + `lib/k6-full-platform-phases.js`

```powershell
k6 run k6/full-platform/k6-full-platform-orchestrator.js `
  -e VOLUME_SLO=1 `
  -e VOLUME_SLO_PROFILE=write `
  -e VOLUME_SLO_GATE=1 `
  -e FULL_PLATFORM_RUN_TAG=phase-a-dev-001 `
  -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
  -e SIGNUP_ROPC_CLIENT_SECRET=$env:STS_SECRET `
  -e USE_USER_POOL=1 -e POOL_SLICE_FILE=... `
  -e VUS=5 -e DURATION=3m
```

**Output:** `reports/phase-a/{RunId}/slo-summary.json` (RunId = `FULL_PLATFORM_RUN_TAG` or `VOLUME_SLO_RUN_ID`).

### Phase A step metrics (write profile)

| Metric | Full-platform phase |
|--------|---------------------|
| `journey_create_client_duration` | POST/GET/PUT Clients |
| `journey_create_base_plan_duration` | POST cashflow |
| `journey_create_timeline_events_duration` | Timelines + Events GETs |
| `journey_add_income_expenses_duration` | Income-expense GET + POST income |
| `journey_add_saving_pots_duration` | GET wealth dashboard |
| `journey_add_contributions_withdrawals_duration` | Skipped (placeholder; not in orchestrator v1) |
| `journey_calculate_projection_duration` | GET Reports |
| `journey_full_plan_build_duration` | End-to-end creation (excludes cleanup) |

All HTTP calls in phases use **`observeHttp`** with **`sloProfile: write`**. When **`VOLUME_SLO` is off**, behavior is unchanged from pre-Phase A (no extra metrics, no report file).

### Phase A API (`lib/volume-slo.js`)

| Function | Description |
|----------|-------------|
| `startPhaseAStep()` | Returns timer start (epoch ms) |
| `completePhaseAStep(metricName, startMs, opts?)` | Trend + step store |
| `skipPhaseAStep(metricName, meta?)` | Zero-duration placeholder step |
| `fullPlatformSloMeta(meta?)` | `{ sloProfile: 'write', module: 'full-platform' }` |
| `buildPhaseAThresholds()` | k6 thresholds when **`VOLUME_SLO_GATE=1`** |
| `attachPhaseASloToSummary(out, extra?)` | Writes Phase A JSON path |
| `evaluateVolumeSloGate(summary, opts?)` | Pure gate evaluation (also in core) |

---

## Integration points (future phases)

| Phase | Integration | API to use |
|-------|-------------|------------|
| **2 — Journey** | Call `recordVolumeSloStep` from `k6-journey-advisor-critical.js` after each step | `recordVolumeSloStep('dashboard_load', ms, { profile: 'read' })` |
| **2 — handleSummary** | Chain `attachVolumeSloToSummary` in journey/orchestrator | `attachVolumeSloToSummary(out, { script: '...' })` |
| **3 — Runners** | Enable `-VolumeSlo` on baseline/journey runners | `-e VOLUME_SLO=1` + merge step |
| **4 — Thresholds** | k6 `options.thresholds` on `volume_slo_violation_rate` | `volume_slo_violation_rate: ['rate<0.05']` |
| **5 — Consolidated report** | Merge volume SLO section into consolidated MD | `buildVolumeSloSummary` + generator hook |
| **6 — Ramp** | Per-step JSON under `reports/volume-slo/runs/{runId}/` | `VOLUME_SLO_RUN_ID` per ramp step |

### observeHttp meta fields

```javascript
observeHttp(res, {
  method: 'GET',
  endpoint: '/api/v1/Clients/{advisorId}/all',  // preferred
  tagName: 'clients_list_all',                   // fallback path resolution
  sloProfile: 'read',                            // optional override
  module: 'clients',
});
```

Scripts that do **not** use `observeHttp` (e.g. raw `http.get` in journey/orchestrator) do not record volume SLO samples until those paths are wired in a later phase.

---

## Gate semantics (`evaluateVolumeSloGate`)

When **`VOLUME_SLO_GATE=1`**, k6 thresholds and the JSON **`gate`** block in handleSummary use the same rules:

| Check | Default threshold | k6 metric (when gate on) |
|-------|-------------------|---------------------------|
| Step p95 vs budget | Any scoped step row with `passFail=fail` | `journey_*` / Phase A step Trends |
| Step violation rate | `stepViolationRate <= 0.05` | `slo_step_violation_rate` |
| Endpoint violation rate | `endpointViolationRate <= 0.05` | `slo_endpoint_violation_rate` |
| Endpoint p95 strict (optional) | Any endpoint row with `passFail=fail` | Enable with **`VOLUME_SLO_GATE_ENDPOINT_P95=1`** |

Phase A fleet runs write per-shard SLO JSON under **`reports/phase-a/{RunTag}/slo-shards/slo-{shardId}.json`**. Merge with **`tools/merge-phase-a-slo.mjs`**.

---

## Unit tests

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
node --test tools/volume-slo.test.mjs
```

Tests cover config parsing, path normalization, budget resolution, p95/violation math, store aggregation, and summary shape.

---

## handleSummary example (manual, Phase 2)

```javascript
import { attachVolumeSloToSummary } from '../../lib/volume-slo.js';

export function handleSummary(data) {
  const out = {};
  // ... other reports ...
  return attachVolumeSloToSummary(out, { script: 'k6-clients-list-load.js' });
}
```

Phase 1 does not modify existing script `handleSummary` handlers; enable sampling via `VOLUME_SLO=1` on scripts that already call `observeHttp`.

---

*Phase 1 — volume SLO framework foundation. June 2026.*
