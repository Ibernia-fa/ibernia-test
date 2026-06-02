# Consolidated API performance reporting

Cross-module API timing for Ibernia **dev** k6 suites. Existing per-module reports and runners are unchanged; consolidated reporting is **opt-in**.

## Quick start (single-user baseline — all domain APIs)

Runs **every** `k6-*-load.js` script (plus `k6-client-full-lifecycle.js`) under clients, clients-profile, cashflows-finances, income, reports, timeline, and wealth. Each script writes its own perf slice; merge builds one report with catalog coverage.

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
$env:STS_SECRET = '...'   # or SIGNUP_ROPC_CLIENT_SECRET

.\runners\run-baseline-single-user.ps1
# Shorter per-script window: .\runners\run-baseline-single-user.ps1 -Duration 20s -ContinueOnError
```

For the **11-module smoke path** (one script per domain, longer duration), use:

```powershell
.\runners\run-all-modules.ps1 -Vus 1 -Duration 90s -ConsolidatedPerf -ContinueOnError
```

Output:

- `reports/consolidated/slices/<script>.json` — per-script slices for the **current** run (cleared at start of each consolidated run)
- `reports/consolidated/consolidated-api-performance.json` — **updated in place** each run
- `reports/consolidated/consolidated-api-performance.md` — **over 100ms**, **at or under 100ms**, and **all APIs (by max latency)** tables (same path every time)
- `reports/consolidated/consolidated-api-performance.pdf` — PDF of the same report (regenerated on each merge)

**PDF dependency:** run `npm install` once in the repo root (`md-to-pdf` / Puppeteer). Skip PDF with `node tools/merge-consolidated-report.mjs --no-pdf`.

## Full suite with consolidation (one script per domain, ~11 modules)

```powershell
.\runners\run-all-modules.ps1 -Vus 100 -Duration 5m -PoolEnv dev -ConsolidatedPerf -ContinueOnError
```

## All API scripts at 100 VUs (~57 scripts, one consolidated report)

Scripts run **one after another**; within each script, **100 VUs** hit the API concurrently (100 distinct pool users).

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
$env:STS_SECRET = '...'   # need ≥100 verified users in the pool

.\runners\run-baseline-single-user.ps1 -Vus 100 -Duration 5m -ContinueOnError
```

Requires **100 leased pool users** (`node tools/pool-cli/bin/pool-cli.js stats --env dev`). Provision more users if lease fails.

## Concurrent users — full catalog per user (20 users default)

Uses the **dev user pool** only (`-PoolEnv dev` → `data/user-pool/dev/`). Each leased user runs **all** baseline scripts (full module order: clients → clients-profile → timeline → income → finances → reports → wealth). This is **not** sharding modules across users; every user executes the complete API surface.

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
$env:STS_SECRET = '...'   # need ≥20 verified users in the pool

.\runners\run-baseline-concurrent-users.ps1 -Users 20 -Duration 30s -ContinueOnError
```

Per-run artifacts (slices, logs, spills) are isolated under `reports/consolidated/runs/<run-id>/`. Merge still writes the stable report paths:

- `reports/consolidated/consolidated-api-performance.{md,json,pdf}`

## Slow request forensics (>300 ms)

Every HTTP request over **300 ms** (configurable) emits a `__K6_PERF_SLOW__` log line with user, module, script, scenario, method, endpoint, status, VU, iteration, sanitized request context, and correlation id when present. The runner parses k6 logs into `reports/consolidated/spill/` (or per-user subdirs under a concurrent run) as `{sliceId}-slow.json`.

The consolidated report **appends** (existing sections unchanged):

| Section | Content |
|---------|---------|
| **Slow Requests By User (>300ms)** | Per-user table: module, script, method, endpoint, min/max/avg, slow call count, latest payload preview |
| **All Slow Requests (>300ms)** | One row per captured request, sorted by duration (markdown capped at 500 rows; full list in JSON) |
| **Top slow endpoints** | Max latency per user + endpoint |

JSON fields added (existing schema preserved): `slowRequests[]`, `slowRequestsByUser{}`, `perUserEndpointStats[]`, `topSlowEndpoints[]`, `slowCaptureThresholdMs`, `apisByUser{}`.

### Per-user API tables and resolved paths

The markdown report has two per-user sections (read in this order):

| Section | What it shows |
|---------|----------------|
| **API performance by user and script** | One table per **k6 script** (~30s run). Calls are **only** from that script — use this when a total looks too high. |
| **API performance by user (endpoint totals)** | Same endpoint **merged across all baseline scripts** for that user. **Scripts (calls each)** column explains the sum (e.g. `get-advisor-all (31) + suite (20)` → 51 total calls). |

**Why call counts look high:** A 20-user concurrent run executes ~57 scripts per user. Several scripts hit the same catalog endpoint (dedicated `*-load.js` plus suite/lifecycle scripts). Totals are correct aggregates, not “one script called 51 times.”

Endpoint columns show **resolved paths** (real IDs from `actualUrl` or `requestContext.path`), not catalog templates:

- Catalog key (internal): `/api/v1/Clients/{advisorId}/search`
- Report column: `/api/v1/Clients/6f468969-…/search`

JSON fields: `apisByUser{}` (merged per endpoint), `apisByUserAndScript{}` (per script), and per-row `contributingScripts[]` / `scriptRunCount` on merged APIs.

Per-user API rows include **`minMs`**, **`maxMs`**, and **`activeSessionsMin` / `activeSessionsMax` / `activeSessionsAtMax`** (k6 `vusActive` when the request ran). Markdown **Active sessions** shows a range (`1–4`) or a single value; **at max** is the session count on the slowest captured request for that endpoint.

Each API row includes `endpointDisplay` in JSON; markdown/PDF use **Resolved path** column headers.

### Sequential pool users (User80–User99)

By default, lease picks recently verified users. For a fixed numeric range:

```powershell
.\runners\run-baseline-concurrent-users.ps1 -Users 20 -UserNumberMin 80 -UserNumberMax 99 -ContinueOnError
# or CLI:
node tools/pool-cli/bin/pool-cli.js lease --count 20 --run-id myrun --env dev `
  --email-glob 'User*@*' --user-num-min 80 --user-num-max 99 --order user-number
```

## Environment flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `CONSOLIDATED_PERF` | off | Enable timing capture + slice export |
| `BASELINE_SINGLE_USER_RUN` | off | Set by baseline runner (`VUS=1`, short duration) |
| `PERF_RUN_ID` | — | Shared run id (runner sets `allmod-…`) |
| `MODULE_NAME` | — | Module tag on each request (runner sets per module) |
| `SLOW_API_THRESHOLD_MS` | `100` | Slow API threshold for report section |
| `PERF_SCRIPT_FILE` | — | Relative script path (set by runners) for slowest-request forensics |
| `PERF_SLICE_ID` | — | Slice filename id (defaults to script basename) |
| `PERF_CAPTURE_REQUEST_CONTEXT` | on when `CONSOLIDATED_PERF=1` | Capture per-request metadata for slowest-instance tracking |
| `PERF_CAPTURE_PAYLOAD_BYTES` | `512` | Max JSON/body preview length stored per request |
| `PERF_CAPTURE_MAX_SLOW_SAMPLES` | `100` | Cap on retained slow-request ring buffer per script |
| `PERF_SLOW_CAPTURE_THRESHOLD_MS` | `300` | Log every request slower than this (forensics table) |
| `PERF_CAPTURE_MAX_SLOW_RECORDS` | `2000` | Max `__K6_PERF_SLOW__` lines per script run |
| `PERF_USER_LABEL` | — | User email when pool session hints are missing (runners set from lease) |
| `PERF_SLICE_OUT_DIR` | `reports/consolidated/slices` | Override slice output (required for concurrent per-user dirs) |

**Per-user table labels:** slices include `userEmail` from `PERF_USER_LABEL` (runners set this from the pool lease). For concurrent runs, merge can also map `user-00` … `user-19` from `data/user-pool/<env>/user-slices-<run-id>/pool-slice-user-XX.json` when re-merging an older run.

**Log encoding:** `run-baseline-concurrent-users.ps1` writes UTF-8 logs (required for reliable `__K6_PERF_*` parsing). `run-baseline-single-user.ps1` still uses `Tee-Object` (UTF-16 on Windows); `readK6LogText()` handles both. Re-parse old runs: `node tools/reparse-run-spills.mjs <run-id>`.

**Baseline script coverage:** all **57** `*-load.js` scripts in `BaselinePlan.ps1` export `handleSummary` (via `singleApiHandleSummaryFactory`, `wrapHandleSummaryWithConsolidatedPerf`, or suite helpers). Scripts that use raw `http.*` without `observeHttp` still contribute **`http_req_duration`** tags to slices when `CONSOLIDATED_PERF=1`; slow-request forensics (`>300 ms`) require `observeHttp` / `recordOutcome*`.

Audit: `node tools/audit-baseline-perf.mjs`.

### Slowest request forensics

When context capture is enabled, each slice records the **single slowest request instance** per `(module, method, endpoint)`. The merged report adds:

- **`slowestRequestDetails`** in `consolidated-api-performance.json`
- **`## Slowest Request Details`** in markdown/PDF (script, user, VU, iteration, active sessions, scenario, sanitized request context)

**Privacy:** Authorization headers, passwords, tokens, and client secrets are never stored. Body previews are truncated and redacted.

**Session hints:** Scripts may call `registerPerfVuSession(vu, { userEmail, cashflowId, clientId, advisorId })` after seed (done in `common-income-screen.js`). Other modules can use the same helper or rely on `*ByVu` global seed bags.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  observeHttp / recordOutcome* → recordApiPerformance        │
│  (lib/api-performance-collector.js)                         │
│    • in-memory samples per k6 process                       │
│    • k6 metrics: api_perf_duration_ms{module,method,endpoint} │
└──────────────────────────┬──────────────────────────────────┘
                           │ handleSummary
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  wrapHandleSummaryWithConsolidatedPerf                      │
│  (lib/k6-perf-integration.js)                               │
│    writes reports/consolidated/slices/<script>.json │
└──────────────────────────┬──────────────────────────────────┘
                           │ after all modules (PowerShell)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  node tools/merge-consolidated-report.mjs                   │
│  (lib/consolidated-report-generator.js)                     │
│    → consolidated-api-performance.json / .md / .pdf           │
└─────────────────────────────────────────────────────────────┘
```

### Timing aggregation

1. **Per request:** `recordApiPerformance` stores timing plus optional context (`lib/api-perf-request-context.js`). Requests over `PERF_SLOW_CAPTURE_THRESHOLD_MS` emit `__K6_PERF_SLOW__{...}`; each new worst latency emits `__K6_PERF_WORST__{...}` (k6 **v2+** does not expose tagged custom metrics in `handleSummary`). Runners capture stdout to log files and `tools/parse-perf-spill-from-log.mjs` writes `{sliceId}-slow.json` and `{sliceId}.json` spill files for merge.
2. **Per script (end of each k6 run):** slices written to `reports/consolidated/slices/`. The runner **clears** that folder at the start of each consolidated run, then merges into the single report files.
3. **Cross-module merge:** Node merge loads all slice files, merges rows by `module+method+endpoint`, recomputes weighted averages, splits APIs into **over threshold** vs **at or under threshold** tables. Rows are ordered by domain sequence: **clients → clients-profile → timeline (events) → income → finances → reports → wealth** (`lib/consolidated-module-order.js`).

### Integration points

- `lib/k6-http-observe.js` — all `observeHttp` calls
- `k6/cashflows-income/common-income-screen.js` — `recordOutcome` / `recordOutcomeWithBuckets` / `singleApiHandleSummaryFactory`
- `wrapHandleSummaryWithConsolidatedPerf` on some timeline/client scripts; most `*-load.js` use **`singleApiHandleSummaryFactory`** → `attachPerfSliceToSummary`
- Income/finances/reports/wealth scripts using `common-*-screen.js` inherit `recordOutcome*` hooks automatically

Scripts that only use raw `http.*` without `observeHttp` still contribute **k6 `http_req_duration{name:…}`** metrics in `handleSummary` when a consolidated wrapper is present.

## Manual merge

```powershell
npm install   # once: md-to-pdf for PDF output
node tools/merge-consolidated-report.mjs --threshold-ms 100 --slow-capture-ms 300
# Optional: --run-id <pool-run-id> for metadata in the report header
# Optional: --slices-dir reports/consolidated/runs/<run-id>/slices
# Optional: --spill-dir reports/consolidated/runs/<run-id>/spill
# Optional: --no-pdf to skip PDF generation
```

## Sample report

See [docs/samples/consolidated-api-performance.sample.md](samples/consolidated-api-performance.sample.md).
