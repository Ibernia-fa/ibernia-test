# Final Architecture Review — Volume Testing (Static Analysis)

**Scope:** Static code and documentation review only. No k6, runners, pool-cli, provisioning, or HTTP traffic was executed for this review.

**Verdict:** Implementation is structurally sound for single-process, single-iteration Phase A/B flows. **Not approved for multi-advisor volume execution** until shard naming, iteration semantics, and count-validation gaps are addressed.

---

## 1. Executive Summary

The volume framework delivers a coherent Phase A write loop (client → plans), hierarchical manifest schema (advisor → client → cashflow), and Phase B read journey with seed/teardown suppression. SLO sampling is correctly gated on `VOLUME_SLO=1`, and backward compatibility is largely preserved for existing baseline runners.

**Blocking concerns for volume execution:**

| Priority | Issue |
|----------|--------|
| **Critical** | Parallel Phase A workers all use `VUS=1` → shard path `shard-{RunTag}-1.json` collides across advisors |
| **Critical** | Phase A worker uses `constant-vus` + `DURATION` with no iteration cap → counts exceed scenario table if runtime > one iteration |
| **High** | Phase B manifest selection always uses `advisors[vu].clients[0].cashflows[0]` — ignores multi-client/plan volume |
| **High** | `run-phase-a-volume.ps1` expected counts ignore scenario JSON unless `-ClientsPerAdvisor`/`-PlansPerClient` are passed explicitly |
| **Medium** | Parallel advisors overwrite shared `reports/phase-a/{RunTag}/slo-summary.json` |
| **Medium** | Phase B dashboard uses pool-user `advisorSub`, not manifest `advisorSub` — cross-advisor mismatch risk |

**PowerShell `&&` error:** Caused by agent validation shell syntax, not repository runner code. All `.ps1` files target **PowerShell 5.1** and contain **zero** `&&` command chaining.

---

## 2. PowerShell Review

### 2.1 Error origin

**Exact command that failed** (from prior implementation session, not from repo scripts):

```powershell
cd "c:\Users\gulle\source\repos\load-testing-k6" && node --test tools/volume-slo.test.mjs && node --check lib/volume-slo.js && ...
```

**Classification:** Agent validation command in the implementation session — **not** part of runner code, not part of committed `.ps1` files, not part of `docs/volume-testing-implementation.md` smoke examples (those use backtick line continuation).

**Cause:** Windows PowerShell **5.1** (per `#Requires -Version 5.1` on all runners) does not support `&&` as a statement separator. That operator was added in **PowerShell 7+**.

### 2.2 Rerun status

After failure, validation was rerun with `;` separators and reported **exit code 0** with **16/16** unit tests passing and `node --check` succeeding on modified entry points. That rerun was performed during implementation; **this review did not re-execute any commands.**

### 2.3 `&&` repository search

**PowerShell runners (`.ps1`):** **0 occurrences** — **Safe**

**Markdown/docs with shell-like `&&`:**

| File | Line | Context | Status |
|------|------|---------|--------|
| `load-testing-k6/docs/advisor-clients-isolation-security.md` | 37 | C# LINQ `.Where(... && ...)` | **Safe** (not shell) |
| `load-testing-k6/reports/journeys/k6-journey-advisor-critical-bottleneck-analysis-10vu.md` | 79, 89 | C# LINQ | **Safe** |
| `ibernia-backend/Services/.../CLIENTS_PAGED_API.md` | 20 | C# filter | **Safe** |
| `ibernia-backend/docs/clientaccess_phase_1_backend_cbcf38e8.plan.md` | 69 | C# query | **Safe** |
| `ibernia-backend/docs/DEPLOY_DEV_CHECKLIST.md` | 206 | `dotnet run` in markdown table cell | **Safe** (documentation; not executed by k6 runners) |

**JavaScript `&&`:** Hundreds of logical-AND uses in `.js` files — **Safe** (not PowerShell).

**Conclusion:** No PowerShell runner depends on PS7 `&&` syntax. All volume runners declare `#Requires -Version 5.1`.

---

## 3. Phase A Loop Review

### 3.1 Actual implementation flow

```text
executeFullPlatformSequence()
  resolvePhaseAVolumeCounts() → clientCount, planCount
  for ci = 0 .. clientCount-1:
    clientTag = uniqueTag OR uniqueTag + "c{ci+1}"
    POST client → GET client → PUT client          [CREATE_CLIENT step]
    for pi = 0 .. planCount-1:
      buildPlanPhases():
        POST cashflow                              [CREATE_BASE_PLAN]
        GET timelines, financing, events           [CREATE_TIMELINE_EVENTS]
        GET income-expense + POST income           [ADD_INCOME_EXPENSES]
        GET Reports                                [CALCULATE_PROJECTION]
        GET wealth                                 [ADD_SAVING_POTS]
    finishFullPlanBuild() per client               [FULL_PLAN_BUILD]
    appendPhaseAManifestClient() if cashflows > 0
    deleteClientsAndPlansByLastNameNeedle() unless skipDelete
```

Key code: `lib/k6-full-platform-phases.js` — outer `for (ci = 0; ci < clientCount; ci++)`, inner `for (pi = 0; pi < planCount; pi++)`, manifest append when `cashflows.length > 0`.

### 3.2 Pseudo-execution (ClientsPerAdvisor=5, PlansPerClient=2, one advisor, one iteration)

```text
advisor A (1 k6 process, 1 iteration)
  client 1 (tag: ...c1)
    plan 1 (FP-...c1-p1)
    plan 2 (FP-...c1-p2)
  client 2 (tag: ...c2)
    plan 1
    plan 2
  ...
  client 5
    plan 1
    plan 2
→ 5 clients, 10 plans per advisor per iteration
```

### 3.3 Scenario totals (AdvisorCount=20, one iteration per advisor)

Formula:

```text
TotalClients = 20 × ClientsPerAdvisor × Iterations
TotalPlans   = 20 × ClientsPerAdvisor × PlansPerClient × Iterations
```

| Scenario | Clients/Adv | Plans/Client | Expected Clients | Expected Plans | Implementation (1 iter) |
|----------|-------------|--------------|------------------|----------------|-------------------------|
| S1 | 1 | 1 | 20 | 20 | **Matches** |
| S2 | 5 | 2 | 100 | 200 | **Matches** |
| S3 | 10 | 4 | 200 | 800 | **Matches** |
| S4 | 20 | 8 | 400 | 3200 | **Matches** |
| S5 | 30 | 8 | 600 | 4800 | **Matches** |

Inner loop arithmetic is correct. **No off-by-one** in `for (ci = 0; ci < clientCount)` or `for (pi = 0; pi < planCount)`.

### 3.4 Counting risks

| Risk | Severity | Detail |
|------|----------|--------|
| **Multiple k6 iterations** | **Critical** | Worker uses `LOAD_MODE=vus`, `VUS=1`, `DURATION=5m` with no `ITERATIONS=1`. Orchestrator default function re-runs for the full duration. Totals become `table × iterations`. |
| **Failed client skipped** | Medium | Failed client uses `continue` — manifest omits that client; totals lower than expected. |
| **Client with zero successful plans** | Medium | Not appended to manifest (`cashflows.length` must be > 0). |
| **Runner expected-count vs scenario** | High | `run-phase-a-volume.ps1` only sets `--expected-clients/plans` when `-ClientsPerAdvisor`/`-PlansPerClient` CLI params are passed — **not** from `VOLUME_SCENARIO` JSON (`phase-a-write-volume` = 3×2). |
| **Parallel advisor shard collision** | Critical | See §9 — not a loop bug but destroys per-advisor count integrity in merge. |

---

## 4. Manifest Review

### 4.1 Shard schema (actual)

Produced by `buildPhaseAManifestShard()` in `lib/volume-phase-a-manifest.js`:

```json
{
  "reportType": "phase-a-manifest-shard",
  "generatedAt": "2026-06-02T12:00:00.000Z",
  "runTag": "phase-a-20260602-120000",
  "advisorSub": "auth0|abc123",
  "advisorEmail": "user@example.com",
  "vu": 1,
  "iteration": 0,
  "clients": [
    {
      "clientId": "507f1f77bcf86cd799439011",
      "uniqueTag": "fp1_g0_1734567890c1",
      "cashflows": [
        { "cashflowId": "550e8400-e29b-41d4-a716-446655440000", "planName": "FP-...-p1" },
        { "cashflowId": "660e8400-e29b-41d4-a716-446655440001", "planName": "FP-...-p2" }
      ]
    }
  ],
  "counts": { "clients": 1, "plans": 2 }
}
```

### 4.2 Merged schema (actual)

Produced by `mergePhaseAManifestShards()` in `lib/volume-manifest-core.js`:

```json
{
  "reportType": "phase-a-manifest",
  "generatedAt": "2026-06-02T12:05:00.000Z",
  "runTag": "phase-a-20260602-120000",
  "shardCount": 20,
  "advisors": [
    {
      "advisorSub": "auth0|abc123",
      "advisorEmail": "user@example.com",
      "vu": 1,
      "iteration": 0,
      "clients": [],
      "counts": { "clients": 5, "plans": 10 },
      "generatedAt": "..."
    }
  ],
  "totals": { "clients": 100, "plans": 200 },
  "validation": {
    "expectedClients": 100,
    "expectedPlans": 200,
    "actualClients": 100,
    "actualPlans": 200,
    "clientCountOk": true,
    "planCountOk": true,
    "passed": true
  }
}
```

### 4.3 Hierarchy preservation

**Confirmed:** Structure is **Advisor → Client → Cashflow**, not flat ID arrays.

- Shard: one advisor per shard, `clients[]` each with `cashflows[]`
- Merge: `advisors[]` preserves nested `clients[]` / `cashflows[]`

### 4.4 Phase B identification logic

From `selectManifestTargetForVu()` in `lib/volume-manifest-core.js`:

```javascript
const idx = Math.max(0, (Number(vu) || 1) - 1) % manifest.advisors.length;
const advisor = manifest.advisors[idx];
const client = advisor.clients[0];           // always first client
const cf = client.cashflows[0];               // always first plan
```

| Entity | How identified | Limitation |
|--------|----------------|------------|
| **Advisor** | `manifest.advisors[(VU-1) % advisorCount]` | Assumes VU index maps to merge order of shards |
| **Client** | `advisor.clients[0]` only | **Ignores clients 2..N** |
| **Cashflow / plan** | `clients[0].cashflows[0]` only | **Ignores plans 2..N**; `planName` stored but unused in selection |
| **Plan name** | In manifest as `planName` | Not used by Phase B selector |

### 4.5 Missing / weak fields

- No explicit **VU ↔ advisor index** mapping field (relies on merge order + modulo)
- No **clientIndex** / **planIndex** for Phase B rotation
- **`advisorEmail`** present but unused in journey selection
- No **iteration** tracking in merge validation (multi-iteration conflation)

---

## 5. Read-Only Audit (`PHASE_B_READ_ONLY=1`)

Enforcement flags (init time) in `k6/journeys/k6-journey-advisor-critical.js`:

```javascript
const READ_ONLY_JOURNEY =
  ['1','true','yes'].includes(PHASE_B_READ_ONLY || VOLUME_READ_ONLY) ||
  (PHASE_B_MANIFEST != null && PHASE_B_MANIFEST.reportType === 'phase-a-manifest');
const SKIP_JOURNEY_SEED = READ_ONLY_JOURNEY || PHASE_B_MANIFEST != null;
```

| Operation | Reachable when `PHASE_B_READ_ONLY=1`? | Evidence |
|-----------|----------------------------------------|----------|
| Create Client | **No** | Seed blocked before `http.post` Clients |
| Update Client | **No** | No PUT in journey script |
| Delete Client | **No** | Teardown skipped when `READ_ONLY_JOURNEY \|\| SKIP_JOURNEY_SEED` |
| Create Cashflow | **No** | Same seed gate before `http.post` cashflows |
| Update Cashflow | **No** | No PUT cashflow in journey |
| Delete Cashflow | **No** | Teardown skipped |
| Create Timeline | **No** | Journey only GETs in `runCashflowLoadParallel` |
| Create Event | **No** | Only GET Events/default, Events/custom |
| Create Income | **No** | POST only in seed path (blocked) |
| Create Wealth Object | **No** | No wealth POST in journey |

**Reachable read paths:** `runLogin` (identity ROPC POST — auth, not Ibernia API entity mutation), `runDashboard` (GET), `runOpenClient` (GET), `runCashflowLoadParallel` (GET batch).

**Gap:** With manifest, seed is non-mutating but **`runDashboard` uses `login.advisorSub` from pool token**, not `seed.advisorSub` from manifest — can open a client ID from advisor A while listing clients for advisor B.

---

## 6. SLO Gate Review

### 6.1 Evaluation scope

| Layer | Scope |
|-------|--------|
| **Per-request violation** | Each HTTP/step sample: `ms > budgetMs` → violation counters/rates |
| **In-memory store** | Single `moduleStore` per k6 process — aggregates **all VUs and all iterations** in that process |
| **k6 Rate metrics** | `slo_endpoint_violation_rate`, `slo_step_violation_rate` — **global within one k6 run** |
| **k6 thresholds** | Evaluated **globally** at end of one k6 process |
| **JSON gate (`evaluateVolumeSloGate`)** | Built once in `handleSummary` from in-memory store for **that k6 process only** |

**Phase A parallel advisors:** Each advisor = separate k6 process. Gates are **per-advisor/per-process**, **not** aggregated across the 20-advisor fleet. There is no cross-shard SLO rollup.

### 6.2 Aggregation of violation rates

- `slo_endpoint_violation_rate` / `slo_step_violation_rate`: k6 Counter/Rate metrics — **all samples in process**
- Summary JSON `rates.endpointViolationRate` / `stepViolationRate`: from in-memory store row aggregation

These should align within one process but are independent of k6 threshold evaluation.

### 6.3 Pass/fail calculation

**k6 thresholds (when `VOLUME_SLO_GATE=1`):**

```text
volume_slo_violation_rate: ['rate<0.05']
slo_endpoint_violation_rate: ['rate<0.05']
slo_step_violation_rate: ['rate<0.05']
+ p(95) thresholds on phase/journey step metrics
```

**JSON gate (`evaluateVolumeSloGate` in `lib/volume-slo-core.js`):**

```text
passed =
  failedSteps.length === 0 &&                    // step rows with passFail === 'fail'
  (!failOnEndpointP95 || failedEndpoints.length === 0) &&
  !violationRateFailed;                        // stepViolationRate > 0.05
```

**Design mismatches:**

1. **Endpoint p95 failures do not fail JSON gate** unless `failOnEndpointP95` is set (it is not in Phase A/B attach paths).
2. **JSON gate uses `stepViolationRate` from store**, while k6 also enforces `slo_endpoint_violation_rate` — dual criteria may disagree.
3. **Phase A gate filters failed steps** to `PHASE_A_STEP_METRICS` only; other step rows ignored.
4. **No cross-advisor gate** for fleet Phase A runs.

---

## 7. Backward Compatibility Review (`VOLUME_SLO` unset / `0`)

| Component | Changed? | When SLO disabled | Identical behavior? |
|-----------|----------|-------------------|-------------------|
| `run-baseline-single-user.ps1` | No | Unchanged | **Yes** |
| `run-baseline-concurrent-users.ps1` | No | Unchanged | **Yes** |
| `run-all-modules.ps1` | No | Unchanged | **Yes** |
| `run-full-platform.ps1` | No | Unchanged | **Yes** |
| `k6-http-observe.js` | Doc + existing hook | `recordVolumeSloHttp` returns immediately | **Yes** |
| `k6-full-platform-phases.js` | Loops + manifest | Defaults 1×1; manifest no-op without `PHASE_A_EXPORT_MANIFEST` | **Yes** |
| `k6-full-platform-orchestrator.js` | Manifest init/summary | No-op without export/SLO flags | **Yes** |
| `k6-journey-advisor-critical.js` | Manifest/read-only/SLO | Without manifest env: no read-only; seed/teardown unchanged | **Mostly yes** |
| `k6-journey-metrics.js` | Imports `volume-slo.js` | Legacy lag budgets; no step SLO recording | **Mostly yes** |
| `k6-journey-endpoint-stats.js` | SLO branch | `observeHttp` not called when SLO off | **Yes** |
| Consolidated reporting | Not modified | Unchanged | **Yes** |
| Adaptive throttling | Still first in `observeHttp` | Unchanged | **Yes** |

**Exceptions:**

1. **`k6-journey-metrics.js` imports `volume-slo.js` at module load** — registers additional k6 metrics even when `VOLUME_SLO=0`. Low regression (noise in reports).
2. **`loadPhaseBManifest()` at journey init** — only calls `open()` if `PHASE_B_MANIFEST_FILE` is set; otherwise null.

**Expected result holds:** No material behavior change unless volume env vars are explicitly enabled.

---

## 8. Report Path Review

| Path | Producer | Consumer | Collision risk |
|------|----------|----------|----------------|
| `reports/phase-a/{RunTag}/slo-summary.json` | Orchestrator `handleSummary` | CI / human | **Yes** — all parallel advisors write same path |
| `reports/phase-a/{RunTag}/manifests/shard-{RunTag}-{vu}.json` | Orchestrator `handleSummary` | `merge-phase-a-manifest.mjs` | **Yes** — all workers `vu=1` |
| `reports/phase-a/{RunTag}/manifest.json` | Merge CLI | Phase B journey, cleanup runner | Safe (single merge output) |
| `reports/phase-a/{RunTag}/cleanup-plan.json` | `run-phase-a-cleanup.ps1` | Manual cleanup | Safe |
| `reports/phase-a/{RunTag}/workers/advisor-XX/` | Volume runner (copy) | Operator | Safe (isolated) |
| `reports/phase-a/{RunTag}/logs/` | Volume runner | Operator | Safe |
| `reports/phase-b/{RunId}/slo-summary.json` | Journey `handleSummary` | CI / human | **Yes** if concurrent journeys share `PHASE_B_RUN_TAG` |
| `reports/volume-slo/volume-slo-summary.json` | `attachVolumeSloToSummary` | Generic | Low (opt-in path) |
| `reports/journeys/k6-journey-advisor-critical-summary.json` | Journey (pre-existing) | Operator | Unchanged |
| `reports/journeys/k6-journey-advisor-critical-endpoints.md` | Journey (pre-existing) | Operator | Unchanged |
| `k6/full-platform/reports/full-platform-orchestrator-report.json` | Orchestrator (pre-existing) | Operator | Per-run overwrite (existing behavior) |

**Concurrent advisor overwrite:** **Confirmed risk** — shard and slo-summary filenames do not include advisor index or worker id. Workers copy to isolated `workers/advisor-XX/` dirs, but k6 processes race on the shared repo-root path during execution.

---

## 9. Defect List

| # | Severity | File(s) | Root cause | Recommended fix |
|---|----------|---------|------------|-----------------|
| 1 | **Critical** | `lib/volume-phase-a-manifest.js`, `runners/scripts/Invoke-PhaseAAdvisorWorker.ps1` | Shard path uses `vu` only; all parallel workers have `VUS=1` → `shard-{tag}-1.json` | Include `advisorSub` hash or worker index (`PHASE_A_SHARD_ID`) in shard filename |
| 2 | **Critical** | `Invoke-PhaseAAdvisorWorker.ps1`, orchestrator | `constant-vus` + `DURATION=5m` allows many iterations; counts ≠ scenario table | Add `ITERATIONS=1` or `shared-iterations` with `iterations: 1` |
| 3 | **High** | `lib/volume-manifest-core.js` | `selectManifestTargetForVu` always picks first client/plan | Add VU→(clientIndex, planIndex) mapping; rotate through volume data |
| 4 | **High** | `runners/run-phase-a-volume.ps1` | Expected counts only from CLI params, not `volume-scenarios.json` | Parse scenario file or pass scenario counts into merge validation |
| 5 | **High** | `k6/journeys/k6-journey-advisor-critical.js` | Dashboard uses `login.advisorSub`; manifest target may belong to different advisor | Use `seed.advisorSub` (manifest) for dashboard when manifest-driven |
| 6 | **Medium** | `lib/volume-phase-a-manifest.js`, orchestrator | All advisors overwrite `slo-summary.json` | Per-advisor path + fleet merge |
| 7 | **Medium** | `lib/volume-slo-core.js` | `evaluateVolumeSloGate` ignores endpoint p95 failures by default | Set `failOnEndpointP95: true` when gate enabled, or document omission |
| 8 | **Medium** | `runners/run-phase-a-volume.ps1` | Job failure detection logic unreliable | Check job state / exit code only |
| 9 | **Medium** | `lib/k6-journey-metrics.js` | Static import of `volume-slo.js` registers metrics when SLO off | Lazy import or guard metric registration |
| 10 | **Low** | `lib/k6-full-platform-phases.js` | Failed clients omitted from manifest silently | Optionally record failed client stubs with `error` field |
| 11 | **Low** | `runners/run-phase-a-cleanup.ps1` | Emits plan only; no automated delete | Document as intentional; wire to k6 cleanup later |
| 12 | **Low** | Phase B journey | Multiple VUs share one `PHASE_B_RUN_TAG` default at init | Derive run tag in `setup()` or include timestamp per run |

---

## 10. Final Recommendation

**Do not approve for volume execution** in the current state.

**Approve for:**

- Single-advisor, single-iteration Phase A smoke (manual k6 with `ITERATIONS=1` or very short duration)
- Static/unit validation (`node --test tools/volume-slo.test.mjs`)
- Code review and design alignment

**Block until fixed:**

1. Unique manifest shard naming per parallel advisor
2. Explicit single-iteration semantics for volume seed workers
3. Phase B manifest target selection for multi-client/plan scenarios
4. Scenario-driven expected count validation in the PowerShell runner

**After fixes:** Re-run static review on shard naming and count formulas only — still no dev traffic until explicit execution approval.

---

*Review performed by static analysis of source files only. No code was modified. No tests or runners were executed for this review.*
