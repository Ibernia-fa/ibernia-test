/**
 * Per-endpoint timing + size stats for journey scripts.
 * Primary source: k6 tagged http_req_duration in handleSummary (VU-safe).
 * Fallback: in-run samples + dashboard payload Trends.
 *
 * When VOLUME_SLO=1, HTTP calls are also sampled via observeHttp (read profile).
 */
import { Trend } from 'k6/metrics';
import { observeHttp } from './k6-http-observe.js';
import { isVolumeSloEnabled, journeyReadSloMeta, getEffectiveSloConfig } from './volume-slo.js';
import { resolveEndpointBudget } from './volume-slo-core.js';

/** Recorded each successful dashboard list parse (visible in handleSummary via metrics). */
export const dashboardClientsReturned = new Trend('journey_dashboard_clients_returned', true);
export const dashboardPayloadBytes = new Trend('journey_dashboard_payload_bytes', true);

/** k6 request `tags.name` → catalog endpoint path */
export const JOURNEY_HTTP_TAG_MAP = Object.freeze({
  journey_dashboard_clients_all: { method: 'GET', endpoint: '/api/v1/Clients/{advisorId}/all' },
  journey_open_client_get: { method: 'GET', endpoint: '/api/v1/Clients/{id}' },
  journey_client_plans_get: { method: 'GET', endpoint: '/api/v1/client/{clientId}/cashflows' },
  journey_cf_get: { method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}' },
  journey_cf_timelines: { method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/timelines' },
  journey_cf_financial: { method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/financial' },
  journey_cf_income_expense_financial: {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/income-expense/financial',
  },
  journey_cf_reports: { method: 'GET', endpoint: '/api/v1/Reports/{cashflowId}' },
  journey_cf_wealth: { method: 'GET', endpoint: '/api/v1/wealth/{cashflowId}' },
  journey_cf_events_default: { method: 'GET', endpoint: '/api/v1/Events/default' },
  journey_cf_events_custom: { method: 'GET', endpoint: '/api/v1/Events/custom' },
  journey_seed_post_clients: { method: 'POST', endpoint: '/api/v1/Clients' },
  journey_seed_post_cashflow: { method: 'POST', endpoint: '/api/v1/cashflows' },
});

function journeyEpMetricName(tagName) {
  return `journey_ep_${String(tagName).replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

/** Pre-declared at init — k6 forbids `new Trend()` in VU/default context. */
/** @type {Record<string, Trend>} */
const endpointTrends = Object.create(null);
for (const tagName of Object.keys(JOURNEY_HTTP_TAG_MAP)) {
  endpointTrends[tagName] = new Trend(journeyEpMetricName(tagName), true);
}

function endpointTrend(tagName) {
  return endpointTrends[tagName] || null;
}

const STORE_KEY = '__k6JourneyEndpointStatsStore';

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = { byKey: Object.create(null) };
  }
  return globalThis[STORE_KEY];
}

function keyFor(endpoint, method) {
  return `${method || 'GET'}\0${endpoint || 'unknown'}`;
}

function bucket(endpoint, method) {
  const store = getStore();
  const k = keyFor(endpoint, method);
  if (!store.byKey[k]) {
    store.byKey[k] = {
      endpoint,
      method: method || 'GET',
      durations: [],
      sizes: [],
      failures: 0,
      timeouts: 0,
      statusCounts: Object.create(null),
    };
  }
  return store.byKey[k];
}

function isTimeout(res) {
  if (!res) return true;
  if (res.status === 0) return true;
  const err = res.error != null ? String(res.error) : '';
  return /timeout|deadline|context canceled/i.test(err);
}

/**
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {{ endpoint: string, method?: string, name?: string }} meta
 */
export function recordJourneyEndpoint(res, meta) {
  const endpoint = meta && meta.endpoint ? String(meta.endpoint) : 'unknown';
  const method = meta && meta.method ? String(meta.method) : 'GET';
  const k6Name = meta && meta.k6Name ? String(meta.k6Name) : null;
  if (isVolumeSloEnabled()) {
    observeHttp(
      res,
      journeyReadSloMeta({
        endpoint,
        method,
        tagName: k6Name || undefined,
        module: 'journey',
      }),
    );
  }
  const b = bucket(endpoint, method);
  const ms = res && res.timings && res.timings.duration != null ? res.timings.duration : 0;
  if (k6Name && JOURNEY_HTTP_TAG_MAP[k6Name]) {
    const trend = endpointTrend(k6Name);
    if (trend) trend.add(ms);
  }
  b.durations.push(ms);
  const size =
    res && res.body != null
      ? typeof res.body === 'string'
        ? res.body.length
        : res.body.byteLength != null
          ? res.body.byteLength
          : 0
      : 0;
  if (size > 0) b.sizes.push(size);
  const st = res && res.status != null ? String(res.status) : '0';
  b.statusCounts[st] = (b.statusCounts[st] || 0) + 1;
  if (isTimeout(res)) {
    b.timeouts += 1;
    b.failures += 1;
  } else if (!res || res.status < 200 || (res.status >= 300 && res.status !== 304)) {
    b.failures += 1;
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function summarizeDurations(arr) {
  if (!arr.length) {
    return { count: 0, avg: null, p90: null, p95: null, p99: null, max: null };
  }
  const sorted = arr.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg: sum / sorted.length,
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1],
  };
}

function avgSize(sizes) {
  if (!sizes.length) return null;
  return sizes.reduce((a, b) => a + b, 0) / sizes.length;
}

function attachSloBudgetToRows(rows) {
  if (!isVolumeSloEnabled() || !rows.length) return rows;
  let config;
  try {
    config = getEffectiveSloConfig();
  } catch {
    return rows;
  }
  const profile = config.defaultProfile || 'read';
  return rows.map((r) => {
    const budget = resolveEndpointBudget(config, profile, r.method, r.endpoint);
    const p95 = r.p95Ms;
    const sloPassFail =
      p95 != null && budget.budgetMs != null ? (p95 <= budget.budgetMs ? 'pass' : 'fail') : null;
    return Object.assign({}, r, {
      sloBudgetMs: budget.budgetMs,
      sloPassFail,
    });
  });
}

export function buildEndpointStatsReport(data) {
  const fromK6 = data ? buildEndpointStatsFromK6Summary(data) : [];
  if (fromK6.length) return attachSloBudgetToRows(fromK6);

  const store = getStore();
  const rows = [];
  for (const k of Object.keys(store.byKey)) {
    const b = store.byKey[k];
    const s = summarizeDurations(b.durations);
    rows.push({
      endpoint: b.endpoint,
      method: b.method,
      count: s.count,
      avgMs: s.avg,
      p90Ms: s.p90,
      p95Ms: s.p95,
      p99Ms: s.p99,
      maxMs: s.max,
      failures: b.failures,
      timeoutCount: b.timeouts,
      avgResponseBytes: avgSize(b.sizes),
      maxResponseBytes: b.sizes.length ? Math.max(...b.sizes) : null,
      statusCounts: Object.assign({}, b.statusCounts),
    });
  }
  rows.sort((a, b) => (b.p95Ms || 0) - (a.p95Ms || 0));
  return attachSloBudgetToRows(rows);
}

/** @param {object[]} rows */
export function splitEndpointRowsBySpeed(rows) {
  if (!rows || !rows.length) {
    return { slowest: [], fastest: [], distribution: [] };
  }
  const sorted = rows.slice().sort((a, b) => (b.p95Ms || 0) - (a.p95Ms || 0));
  const slowest = sorted.slice(0, Math.min(5, sorted.length));
  const fastest = sorted.slice().reverse().slice(0, Math.min(5, sorted.length));
  const total = sorted.reduce((sum, r) => sum + (r.count || 0), 0);
  const distribution = sorted.map((r) => ({
    endpoint: `${r.method} ${r.endpoint}`,
    count: r.count,
    sharePct: total > 0 && r.count ? Math.round((r.count / total) * 1000) / 10 : null,
    p95Ms: r.p95Ms,
  }));
  return { slowest, fastest, distribution };
}

export function formatEndpointDistributionMarkdown(rows) {
  const { slowest, fastest, distribution } = splitEndpointRowsBySpeed(rows);
  if (!distribution.length) return '(no endpoint samples recorded)';
  const lines = [
    '#### Slowest endpoints (p95)',
    '',
    formatEndpointStatsMarkdown(slowest),
    '',
    '#### Fastest endpoints (p95)',
    '',
    formatEndpointStatsMarkdown(fastest),
    '',
    '#### Endpoint distribution',
    '',
    '| Endpoint | Count | Share % | p95 |',
    '|----------|------:|--------:|----:|',
  ];
  for (let i = 0; i < distribution.length; i++) {
    const d = distribution[i];
    lines.push(
      `| ${d.endpoint} | ${d.count != null ? d.count : 'n/a'} | ${d.sharePct != null ? d.sharePct : 'n/a'} | ${roundMs(d.p95Ms)}ms |`,
    );
  }
  return lines.join('\n');
}

const DASHBOARD_META_KEY = '__k6JourneyDashboardMetaStore';

function getDashboardMetaStore() {
  if (!globalThis[DASHBOARD_META_KEY]) {
    globalThis[DASHBOARD_META_KEY] = { clientCounts: [], responseBytes: [] };
  }
  return globalThis[DASHBOARD_META_KEY];
}

/** @param {{ clientCount: number, responseBytes: number }} meta */
export function recordDashboardMeta(meta) {
  const dashboardMetaStore = getDashboardMetaStore();
  if (meta.clientCount != null && Number.isFinite(meta.clientCount)) {
    dashboardMetaStore.clientCounts.push(meta.clientCount);
    dashboardClientsReturned.add(meta.clientCount);
  }
  if (meta.responseBytes != null && Number.isFinite(meta.responseBytes)) {
    dashboardMetaStore.responseBytes.push(meta.responseBytes);
    dashboardPayloadBytes.add(meta.responseBytes);
  }
}

function metricTrendValues(data, name) {
  const m = data && data.metrics && data.metrics[name];
  if (!m || !m.values) {
    return {
      count: 0,
      avg: null,
      p90: null,
      p95: null,
      p99: null,
      max: null,
    };
  }
  const v = m.values;
  return {
    count: v.count != null ? v.count : 0,
    avg: v.avg != null ? v.avg : null,
    min: v.min != null ? v.min : null,
    p90: v['p(90)'] != null ? v['p(90)'] : null,
    p95: v['p(95)'] != null ? v['p(95)'] : null,
    p99: v['p(99)'] != null ? v['p(99)'] : null,
    max: v.max != null ? v.max : null,
  };
}

function metricFailedCount(data, name) {
  const m = data && data.metrics && data.metrics[name];
  if (!m || !m.values) return 0;
  if (m.values.fails != null) return m.values.fails;
  if (m.values.count != null && m.type === 'rate') {
    return Math.round((m.values.rate || 0) * (m.values.passes + m.values.fails || 0));
  }
  return 0;
}

function parseNameTagFromMetricKey(key) {
  const open = key.indexOf('{');
  const close = key.lastIndexOf('}');
  if (open < 0 || close <= open) return null;
  const inner = key.slice(open + 1, close);
  const parts = inner.split(',');
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const eq = p.indexOf(':');
    if (eq < 0) continue;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    if (k === 'name') return v;
  }
  return null;
}

/**
 * Build per-endpoint rows from k6 summary `data.metrics` (tagged http_req_duration).
 * @param {object} data handleSummary data
 */
export function buildEndpointStatsFromK6Summary(data) {
  if (!data || !data.metrics) return [];
  const rows = [];

  for (const tagName of Object.keys(JOURNEY_HTTP_TAG_MAP)) {
    const metricKey = journeyEpMetricName(tagName);
    const lat = metricTrendValues(data, metricKey);
    const hasSamples =
      (lat.count != null && lat.count > 0) || lat.avg != null || lat.p95 != null || lat.max != null;
    if (!hasSamples) continue;
    const map = JOURNEY_HTTP_TAG_MAP[tagName];
    rows.push({
      endpoint: map.endpoint,
      method: map.method,
      count: lat.count != null && lat.count > 0 ? lat.count : null,
      avgMs: lat.avg,
      p90Ms: lat.p90,
      p95Ms: lat.p95,
      p99Ms: lat.p99,
      maxMs: lat.max,
      failures: 0,
      timeoutCount: lat.max != null && lat.max >= 119000 ? 1 : 0,
      avgResponseBytes: null,
      maxResponseBytes: null,
    });
  }
  if (rows.length) {
    rows.sort((a, b) => (b.p95Ms || 0) - (a.p95Ms || 0));
    return rows;
  }

  const byName = Object.create(null);

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('http_req_duration{')) continue;
    const tagName = parseNameTagFromMetricKey(key);
    if (!tagName || !JOURNEY_HTTP_TAG_MAP[tagName]) continue;
    const lat = metricTrendValues(data, key);
    byName[tagName] = Object.assign({ tagName }, JOURNEY_HTTP_TAG_MAP[tagName], lat);
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('http_reqs{')) continue;
    const tagName = parseNameTagFromMetricKey(key);
    if (!tagName || !byName[tagName]) continue;
    const c = metricTrendValues(data, key);
    if (c.count > 0) byName[tagName].count = c.count;
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('http_req_failed{')) continue;
    const tagName = parseNameTagFromMetricKey(key);
    if (!tagName || !byName[tagName]) continue;
    const failKey = key;
    const m = data.metrics[failKey];
    let failures = 0;
    if (m && m.values) {
      if (m.values.fails != null) failures = m.values.fails;
      else if (m.values.rate != null && byName[tagName].count) {
        failures = Math.round(m.values.rate * byName[tagName].count);
      }
    }
    byName[tagName].failures = failures;
    const maxMs = byName[tagName].max;
    byName[tagName].timeoutCount =
      maxMs != null && maxMs >= 119000 ? failures || 1 : failures > 0 && maxMs >= 60000 ? failures : 0;
  }

  for (const tagName of Object.keys(JOURNEY_HTTP_TAG_MAP)) {
    const row = byName[tagName];
    if (!row || !row.count) continue;
    rows.push({
      endpoint: row.endpoint,
      method: row.method,
      count: row.count,
      avgMs: row.avg,
      p90Ms: row.p90,
      p95Ms: row.p95,
      p99Ms: row.p99,
      maxMs: row.max,
      failures: row.failures || 0,
      timeoutCount: row.timeoutCount || 0,
      avgResponseBytes: null,
      maxResponseBytes: null,
    });
  }
  rows.sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0));
  return rows;
}

export function buildDashboardMetaReport(data) {
  const dashboardMetaStore = getDashboardMetaStore();
  let counts = dashboardMetaStore.clientCounts;
  let bytes = dashboardMetaStore.responseBytes;
  if (data && data.metrics) {
    const cc = metricTrendValues(data, 'journey_dashboard_clients_returned');
    const bb = metricTrendValues(data, 'journey_dashboard_payload_bytes');
    if (cc.count > 0) {
      return {
        samples: cc.count,
        clientsReturned: {
          min: cc.min,
          max: cc.max,
          avg: cc.avg,
          p95: cc.p95,
        },
        responseBytes: {
          min: bb.min,
          max: bb.max,
          avg: bb.avg,
          p95: bb.p95,
        },
      };
    }
  }
  function summarizeNums(arr) {
    if (!arr.length) return { min: null, max: null, avg: null };
    const sorted = arr.slice().sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p95: percentile(sorted, 95),
    };
  }
  return {
    samples: counts.length,
    clientsReturned: summarizeNums(counts),
    responseBytes: summarizeNums(bytes),
  };
}

export function journeyHeaders(step, journeyName) {
  const j = journeyName || step || 'advisor_critical';
  return {
    'X-Correlation-Id': `k6-jadv-vu${__VU}-iter${__ITER}-${step}-${Date.now()}`,
    'X-Journey': String(j),
    'X-VU': String(__VU),
    'X-Iteration': String(__ITER),
    'X-k6-Script': 'k6-journey-advisor-critical',
  };
}

function roundMs(n) {
  return n != null && Number.isFinite(n) ? Math.round(n) : 'n/a';
}

function roundBytes(n) {
  return n != null && Number.isFinite(n) ? Math.round(n) : 'n/a';
}

/** Markdown table for handleSummary stdout. */
export function formatEndpointStatsMarkdown(rows) {
  if (!rows.length) return '(no endpoint samples recorded)';
  const header =
    '| Endpoint | Count | Avg | p90 | p95 | p99 | Max | Failures | Timeout | Avg size | Max size |\n' +
    '|----------|------:|----:|----:|----:|----:|----:|---------:|--------:|---------:|---------:|';
  const lines = [header];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    lines.push(
      `| ${r.method} ${r.endpoint} | ${r.count} | ${roundMs(r.avgMs)}ms | ${roundMs(r.p90Ms)}ms | ${roundMs(r.p95Ms)}ms | ${roundMs(r.p99Ms)}ms | ${roundMs(r.maxMs)}ms | ${r.failures} | ${r.timeoutCount} | ${roundBytes(r.avgResponseBytes)}B | ${roundBytes(r.maxResponseBytes)}B |`,
    );
  }
  return lines.join('\n');
}
