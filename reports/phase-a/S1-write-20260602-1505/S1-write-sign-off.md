# S1 Write — Phase A Sign-Off Report

**Run tag:** `S1-write-20260602-1505`  
**Generated:** 2026-06-02  
**Report type:** Phase A volume write sign-off (S1)

---

## 1. Run summary

| Field | Value |
|-------|-------|
| Scenario | **S1** (20 advisors × 1 client × 1 plan) |
| Date / time (UTC) | 2026-06-02, ~10:05–10:07 (`generatedAt` 10:06:50Z) |
| Environment | `dev-api.ibernia.it` / `dev-identity.ibernia.it` |
| User mode | Fixed advisors (`User01@gmail.com` … `User20@gmail.com`) |
| Concurrency | 20 parallel advisor workers |
| Elapsed | ~80 s (runner `runElapsedSec`: 79.6) |
| Runner exit code | **0** |
| Flags | `-UseFixedAdvisors`, `-VolumeSloGate`, `-SkipTeardown:$true` |

### k6 worker exit codes (informational)

The PowerShell runner recorded **no failed jobs** (`failedJobs: []`). Eleven workers returned k6 exit code **99** (built-in threshold breach under concurrent load); nine returned **0**.

| Shard | Advisor | k6 exit | Runner `jobFailed` |
|-------|---------|---------|-------------------|
| advisor-03 | User04@gmail.com | 99 | false |
| advisor-04 | User05@gmail.com | 99 | false |
| advisor-05 | User06@gmail.com | 99 | false |
| advisor-07 | User08@gmail.com | 99 | false |
| advisor-09 | User10@gmail.com | 99 | false |
| advisor-12 | User13@gmail.com | 99 | false |
| advisor-13 | User14@gmail.com | 99 | false |
| advisor-14 | User15@gmail.com | 99 | false |
| advisor-16 | User17@gmail.com | 99 | false |
| advisor-17 | User18@gmail.com | 99 | false |
| advisor-18 | User19@gmail.com | 99 | false |
| *all others* | User01–03, 07, 09, 11–12, 16, 20 | 0 | false |

Exit 99 correlates with k6 threshold lines on `slo_endpoint_violation_rate` / journey-duration metrics — not with missing data or HTTP failures (see §4–5).

**Detailed threshold audit:** [k6-exit-99-threshold-audit.md](./k6-exit-99-threshold-audit.md) (configured limits vs per-shard failures).

---

## 2. Data gates & manifest

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Clients | 20 | 20 | **PASS** |
| Plans | 20 | 20 | **PASS** |
| Shards | 20 | 20 | **PASS** |
| Manifest validation | — | `passed: true` | **PASS** |
| Duplicate advisor subs | — | none | **PASS** |

**Manifest (canonical):**  
`load-testing-k6/reports/phase-a/S1-write-20260602-1505/manifest.json`

**Profile exported for Phase B:**  
`load-testing-k6/data/scenarios/profile_20u_1c_1p.json`  
(also referenced in manifest as `manifestProfileFile`)

**Phase B scenario alias:** `phase-b-read-default`

### Manifest summary

- **20 shards**, each with **1 client** and **1 cashflow/plan**
- **Totals:** 20 clients, 20 plans
- **Unique advisor subs:** 20 (no duplicates)
- All shards include `clientId`, `cashflowId`, and `planName` suitable for manifest-driven Phase B reads

Example row (User01):

| Shard | Email | clientId | cashflowId |
|-------|-------|----------|------------|
| advisor-00 | User01@gmail.com | `6a1eaaee221185e8396afa3f` | `6a1eaaf0221185e8396afa49` |

Full ID map: see attached manifest (528 lines) or `profile_20u_1c_1p.json`.

### Merge / ID issues

- **None.** All 20 `PHASE_A_MANIFEST_SHARD` markers present in k6 logs; merge validation passed.
- Per-shard handleSummary metric export still reports `counts.clients=0` (known k6 VU isolation quirk); merged manifest and log-marker extraction are authoritative and correct.

**Related artifacts:**

| Artifact | Path |
|----------|------|
| Runner summary | `reports/phase-a/S1-write-20260602-1505/summary.md` |
| Run metadata | `reports/phase-a/S1-write-20260602-1505/run-metadata.json` |
| SLO fleet | `reports/phase-a/S1-write-20260602-1505/slo-summary-fleet.json` |
| Per-advisor logs | `reports/phase-a/S1-write-20260602-1505/logs/advisor-XX/k6.log` |

---

## 3. Full-platform write journey (projection + validate)

**Result: YES — all 20/20 advisors completed the full write journey**, including projection (Reports GET) and validate (wealth dashboard GET).

Evidence per shard (k6 logs):

- `PHASE_A_MANIFEST_SHARD` emitted only after journey completion → **20/20**
- `GET /api/v1/Reports/{cashflowId}` with **HTTP 200** → **20/20**
- `GET /api/v1/wealth/{cashflowId}` with **HTTP 200** → **20/20**

No advisor stopped early on auth, client create, plan build, or validation. No functional step failure identified.

---

## 4. Errors & failure rates

| Category | Rate / finding |
|----------|----------------|
| **Auth (ROPC / token)** | **0 failures** observed; all shards authenticated via fixed pool slices |
| **Business / API errors (4xx/5xx)** | **0** in journey telemetry; observed statuses 200/201 only |
| **HTTP failure rate (`http_req_failed`)** | **Not measured** — k6 end-of-run summary not captured in worker logs (stdout redirected). Inferred **~0%** from per-request perf lines |
| **k6 checks failure rate** | **Not measured** (same log truncation) |

No auth, business-logic, or hard HTTP failures block Phase B.

---

## 5. SLO gates (write budgets)

| Setting | Value |
|---------|-------|
| Write budgets | **ON** (`VOLUME_SLO=1`, `-VolumeSloGate`) |
| SLO profile | `write` (`config/volume-api-slo.json`) |
| Fleet gate | **PASS** (`gatePassed: 20`, `gateFailed: 0`) |
| Per-shard `gate.passed` | **20/20 true** |

Fleet SLO gate **passed** despite 11 k6 processes exiting 99. Shard-level gate logic did not flag failed steps or endpoints; k6 built-in thresholds fired on latency/violation-rate metrics under 20-way concurrency.

### k6 threshold breaches (11 shards)

| Metric | Shards crossing k6 threshold |
|--------|------------------------------|
| `slo_endpoint_violation_rate` | 11 |
| `volume_slo_violation_rate` | 11 |
| `slo_step_violation_rate` | 8 |
| `journey_create_base_plan_duration` | 4 (03, 12, 17, 18) |
| `journey_create_client_duration` | 3 (09, 13, 16) |
| `journey_create_timeline_events_duration` | 1 (14) |

### Slowest endpoints (Reports projection — validate step)

Under concurrent load, projection/Reports dominated tail latency:

| Shard | Advisor | Reports GET (ms) |
|-------|---------|------------------|
| advisor-05 | User06 | **2069** |
| advisor-07 | User08 | 1957 |
| advisor-13 | User14 | 1956 |
| advisor-18 | User19 | 1935 |
| advisor-19 | User20 | 1932 |
| advisor-10 | User11 | 1930 |

Isolated early shards (e.g. advisor-00, advisor-02) completed Reports in **~500 ms**. Contention at ~10:06 UTC produced ~1.9–2.1 s Reports responses for the bulk of the fleet — still HTTP 200.

Other notable slow calls under load: `POST /api/v1/Clients` up to **~9.7 s** (advisor-16) and **~5.8 s** (advisor-09) — again 201/200, not failures.

---

## 6. Phase B readiness

| Check | Status |
|-------|--------|
| Teardown skipped | **Yes** (`skipTeardown=true`) — seeded data remains on dev |
| Seeded data on dev | **Yes** — 20 clients, 20 plans across User01–User20 |
| Dedicated accounts | **Yes** — one fixed advisor per shard (~1 client each) |
| Manifest for Phase B | **Yes** — `manifest.json` + `profile_20u_1c_1p.json` |
| Phase B scenario | **`phase-b-read-default`** |

### Suggested Phase B command

```powershell
.\runners\run-phase-b-volume.ps1 `
  -Scenario S1 `
  -RunId S1-write-20260602-1505-read `
  -PhaseARunTag S1-write-20260602-1505 `
  -UseFixedAdvisors `
  -VolumeSloGate
```

---

## 7. Recommendation

### **GO** — proceed with S1 Phase B read

**Rationale:**

- Data gates **20/20/20** with validated manifest and profile export
- All advisors completed **full write journey** including **projection + wealth validate**
- **Zero** functional/auth/HTTP failures observed
- Fleet **Volume SLO gate PASS** (20/20 shards)

**Caveats (non-blocking for Phase B read):**

1. **11/20 k6 workers exited 99** due to latency thresholds under 20-way write concurrency — monitor read-phase latency; consider runner policy to surface k6 exit 99 as warning.
2. **Reports/projection tail latency** (~2 s) under simultaneous writes — informational for capacity planning, not a data-integrity issue.
3. Aggregate **HTTP/check failure rates** were not captured in logs; acceptable for this sign-off given 100% successful journey telemetry.

---

*Sign-off based on artifacts under `load-testing-k6/reports/phase-a/S1-write-20260602-1505/`.*
