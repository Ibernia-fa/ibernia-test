# Consolidated API performance report

- **Run ID:** allmod-20260520-120000
- **Generated:** 2026-05-20T12:00:00.000Z
- **Slow threshold:** 100 ms
- **Modules:** clients, timeline, events-custom, wealth

## Overall summary

- Total distinct APIs: 12
- Total HTTP samples: 48
- Total calls (aggregated): 48
- Total failures: 0
- Total successful: 48
- APIs over 100 ms (max, avg, or any request): 3
- APIs at or under 100 ms: 9
- Overall average: 156.2 ms
- Slowest API: **GET /api/v1/Reports/forecast** (512 ms max, module `reports`)
- Fastest API (within threshold): **GET /api/v1/wealth/{cashflowId}** (78 ms max, module `wealth`)

## APIs over 100 ms

APIs where **max** or **avg** latency exceeds 100 ms, or at least one measured request was slower than 100 ms.

| Module | Method | Endpoint | Max (ms) | Avg (ms) | P95 (ms) | Calls | Failures | Slow requests |
|--------|--------|----------|----------|----------|----------|------:|----------:|----------------:|
| reports | GET | /api/v1/Reports/forecast | 512 | 401 | 498 | 4 | 0 | 4 |
| events-custom | POST | /api/v1/Events/custom | 188 | 142 | 180 | 8 | 0 | 6 |
| clients | GET | /api/v1/Clients/all | 142 | 118 | 138 | 2 | 0 | 2 |

## APIs at or under 100 ms

APIs where **max** and **avg** are ≤ 100 ms and no requests exceeded 100 ms in this run.

| Module | Method | Endpoint | Max (ms) | Avg (ms) | Min (ms) | P95 (ms) | Calls | Failures |
|--------|--------|----------|----------|----------|----------|----------|------:|----------:|
| wealth | GET | /api/v1/wealth/{cashflowId} | 78 | 62 | 45 | 75 | 4 | 0 |
| clients | GET | /api/v1/Clients/{id} | 92 | 71 | 55 | 88 | 6 | 0 |

(Full tables omitted in sample — see generated `.md` after a real run.)
