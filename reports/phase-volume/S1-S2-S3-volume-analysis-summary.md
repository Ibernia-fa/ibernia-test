# Volume Test Analysis — S1, S2, S3

Summary of findings from the Phase A (write) and Phase B (read) volume reports for scenarios S1–S3.

**Source reports:**

- [S1-write_VOLUME_REPORT.md](./S1-write_VOLUME_REPORT.md)
- [S2-write_VOLUME_REPORT.md](./S2-write_VOLUME_REPORT.md)
- [S3-write_VOLUME_REPORT.md](./S3-write_VOLUME_REPORT.md)

**SLO budgets:** [config/volume-api-slo.json](../../config/volume-api-slo.json)

**Generated:** 2026-06-03 (from report signoff timestamps)

---

## Test goal

Identify the point at which increasing user activity and data volume causes the application to stop meeting its performance targets, and determine which APIs or features become bottlenecks first.

---

## Scenario scale

All scenarios use **20 concurrent advisors** (fixed users). Data volume per advisor increases across scenarios.

| Scenario | Clients / advisor | Plans / client | Total clients | Total plans | Write run time |
|----------|-------------------|----------------|---------------|-------------|----------------|
| **S1** | 1 | 1 | 20 | 20 | ~173 s (~3 min) |
| **S2** | 5 | 2 | 100 | 200 | ~554 s (~9 min) |
| **S3** | 10 | 4 | 200 | 800 | ~2,022 s (~34 min) |

**Data gates:** All three scenarios passed — expected client/plan counts and manifest validation succeeded (0% functional failure).

**Note:** User concurrency is fixed at 20 VUs across S1–S3. These runs isolate **data volume per advisor**, not a concurrency ramp.

---

## Goal fulfillment

| Goal aspect | Status |
|-------------|--------|
| Detect when write performance targets fail (data volume) | **Yes** — clear S1 → S2 → S3 degradation |
| Rank write-path bottlenecks | **Yes** — cashflow create, then projection |
| Detect read breaking point | **Partial** — S1 read failed; S2/S3 read passed |
| Scale user activity (concurrency) | **No** — fixed at 20 advisors |
| Find absolute capacity ceiling | **Partial** — S4/S5 not yet run |

### Write SLO failure rate (shard level, 20 advisors)

| Scenario | Phase A (write) failed | Phase B (read) failed |
|----------|------------------------|------------------------|
| **S1** | 6 / 20 (**30%**) | 20 / 20 (**100%**) |
| **S2** | 19 / 20 (**95%**) | 0 / 20 (**0%**) |
| **S3** | 20 / 20 (**100%**) | 0 / 20 (**0%**) |

### HTTP / auth / business errors (Phase B only)

| Scenario | Auth failure | Business failure | HTTP failed |
|----------|-------------|------------------|-------------|
| **S1** | 0.51% | 0.80% | 0.37% |
| **S2** | 0% | 0% | 0% |
| **S3** | 0% | 0% | 0% |

Phase A does not report HTTP error rates in these reports.

### Capacity (S2 & S3)

Both S2 and S3 report **breaking point: reached** and **capacity: saturated**.

---

## Bottleneck order (write path)

| Order | Bottleneck | Evidence |
|-------|------------|----------|
| **1** | `POST /api/v1/cashflows` (create plan) | First gated metric to breach at scale: 6/20 → 19/20 → 20/20 shards over budget |
| **2** | `journey_calculate_projection_duration` | ~7–9× budget at every scenario (worst absolute latency) |
| **Still OK** | `POST /api/v1/Clients` | 0/20 SLO failures through S3 |
| **Mostly OK** | Create client / create base plan journeys | Pass at S2/S3; minor issues at S1 |

### Read path (S2/S3 only — S1 read unreliable)

Slowest endpoints by p95 (budget 3,000 ms for most):

| Endpoint | S2 p95 | S3 p95 |
|----------|--------|--------|
| `GET .../income-expense/financial` | 1,216 ms | 879 ms |
| `GET /api/v1/wealth/{cashflowId}` | 1,083 ms | 761 ms |
| `GET .../timelines` | 1,057 ms | 687 ms |

These are stress points but remained within SLO at S2/S3.

---

## Performance vs budget — Phase A (write)

Fleet tables use **worst shard** per metric. Over budget = `(actual − budget) / budget`.

### `POST /api/v1/cashflows` — create plan (budget 4,000 ms)

| Scenario | Worst actual | vs budget | Over budget by | Shards failing |
|----------|-------------|-----------|----------------|----------------|
| **S1** | 4,980 ms | **1.25×** | +980 ms (+25%) | 6 / 20 (30%) |
| **S2** | 6,014 ms | **1.50×** | +2,014 ms (+50%) | 19 / 20 (95%) |
| **S3** | 5,908 ms | **1.48×** | +1,908 ms (+48%) | 20 / 20 (100%) |

S1 → S3 worst case: ~19% slower in absolute time (+25% → +48% over budget). Typical failing shard at S3 is ~5,000 ms (~1.25×). Best shard at S1: 582 ms (0.15× budget) — 8.6× spread between advisors at the same scenario.

### `POST /api/v1/Clients` — create client (budget 3,000 ms)

| Scenario | Worst actual | vs budget | Headroom |
|----------|-------------|-----------|----------|
| **S1** | 1,031 ms | **0.34×** | 66% under |
| **S2** | 1,713 ms | **0.57×** | 43% under |
| **S3** | 1,033 ms | **0.34×** | 66% under |

Never exceeded budget at any scale.

### `journey_calculate_projection_duration` (budget 5,000 ms)

| Scenario | Worst actual | vs budget | Over budget by |
|----------|-------------|-----------|----------------|
| **S1** | 35,958 ms | **7.2×** | +30,958 ms (+619%) |
| **S2** | 39,143 ms | **7.8×** | +34,143 ms (+683%) |
| **S3** | 44,176 ms | **8.8×** | +39,176 ms (+784%) |

S1 → S3: ~23% slower in worst case, but already ~7–9× budget at every level.

### Other write journey steps (fleet worst p95)

| Metric | Budget | S1 worst | S2 worst | S3 worst |
|--------|--------|----------|----------|----------|
| Create client | 4,000 ms | 4,015 ms (1.00×, +0.4%) | 3,980 ms (OK) | 3,961 ms (0.99×) |
| Create base plan | 5,000 ms | 4,982 ms (OK) | 4,074 ms (0.81×) | 3,984 ms (0.80×) |

---

## Performance vs budget — Phase B (read)

### End-to-end journey (budget 15,000 ms p95)

| Scenario | Worst actual | vs budget | SLO result |
|----------|-------------|-----------|------------|
| **S1** | 13,283 ms | 0.89× (−11%) | 20/20 **failed** |
| **S2** | 6,773 ms | 0.45× (−55%) | 20/20 passed |
| **S3** | 10,271 ms | 0.68× (−32%) | 20/20 passed |

S1 failed the fleet gate despite worst p95 being under 15 s — individual API max spikes drove failure.

### S1 read — worst API spikes

| Endpoint | Budget | Worst actual | vs budget | Over by |
|----------|--------|-------------|-----------|---------|
| `GET .../client/{clientId}/cashflows` | 2,500 ms | 19,619 ms | **7.8×** | +685% |
| `GET .../Clients/{advisorId}/all` | 2,500 ms | 19,230 ms | **7.7×** | +669% |
| `GET .../cashflows/{cashflowId}` | 3,000 ms | 19,440 ms | **6.5×** | +548% |

### S2 & S3 read — worst APIs (within budget)

| Endpoint | Budget | S2 worst | S2 vs budget | S3 worst | S3 vs budget |
|----------|--------|----------|--------------|----------|--------------|
| Full journey | 15,000 ms | 6,773 ms | 0.45× | 10,271 ms | 0.68× |
| List all clients | 2,500 ms | 502 ms | 0.20× | 2,038 ms | 0.82× |
| List client plans | 2,500 ms | 458 ms | 0.18× | 898 ms | 0.36× |
| Open cashflow | 3,000 ms | 378 ms | 0.13× | 1,359 ms | 0.45× |

---

## Key numbers at a glance

| What | How much slower than budget |
|------|----------------------------|
| Plan create (`POST /cashflows`) | +25% at S1 → +48–50% at S2/S3 (~1.25–1.5×) |
| Client create | ~35–66% **under** budget at all scales |
| Projection | ~7–9× budget (+619% to +784%) |
| S1 read APIs | Spiked to ~6.5–7.8× budget (~19 s vs 2.5–3 s) |
| S2/S3 read | Worst case 0.45–0.82× budget — within targets |

---

## Conclusions

1. **Functional success** — all scenarios created the expected clients and plans.
2. **Write SLO is the scaling problem** — cashflow creation fails increasingly with data volume; S3 fails on every advisor.
3. **First API bottleneck:** `POST /api/v1/cashflows` (~25–50% over 4 s budget).
4. **Heaviest feature cost:** projection calculation (~7–9× the 5 s budget, every scenario).
5. **Client creation** remains within budget through S3.
6. **Read path** is healthy at S2/S3 data scales; S1 read results are an outlier and should be re-run before drawing read-limit conclusions.

---

## Recommended next steps

1. **Re-run S1-read** to resolve the inconsistency with S2/S3 read results.
2. **Add a concurrency ladder** (e.g. 5 → 10 → 20 → 40 VUs at fixed S2 data) to test user-activity scaling.
3. **Run S4/S5** to find the upper data-volume ceiling.
4. **Investigate projection** — largest absolute overrun; consider separate SLO gate or optimization target.
5. **Prioritize `POST /api/v1/cashflows`** for performance work — first gated write failure under load.
