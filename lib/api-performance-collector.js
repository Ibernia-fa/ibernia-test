/**
 * Central API timing collection for consolidated cross-module reports.
 *
 * Opt-in: CONSOLIDATED_PERF=1 | BASELINE_SINGLE_USER_RUN=1 | ENABLE_API_PERF_COLLECT=1
 * Per-module tag: MODULE_NAME=wealth (set by runners)
 * Cross-run merge: PERF_RUN_ID=allmod-... (set by runners)
 *
 * Request forensics: PERF_CAPTURE_REQUEST_CONTEXT=1 (auto-on with CONSOLIDATED_PERF)
 */
import { Counter, Trend } from 'k6/metrics';
import {
  buildRequestObservation,
  captureContextEnabled,
  requestContextLimits,
  scriptFileFromEnv,
} from './api-perf-request-context.js';

const apiPerfDuration = new Trend('api_perf_duration_ms', true);
const apiPerfRequests = new Counter('api_perf_requests', true);
const apiPerfFailures = new Counter('api_perf_failures', true);
/** Survives handleSummary (VU module state does not). One trend series per worst-so-far snapshot. */
const apiPerfWorstSnapshot = new Trend('api_perf_worst_snapshot_ms', true);

function truthy(name) {
  const raw = (__ENV[name] || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

/**
 * @returns {{
 *   enabled: boolean,
 *   thresholdMs: number,
 *   moduleName: string,
 *   runId: string,
 *   baselineSingleUser: boolean,
 *   captureRequestContext: boolean,
 * }}
 */
export function perfConfigFromEnv() {
  const baselineSingleUser = truthy('BASELINE_SINGLE_USER_RUN');
  const consolidated = truthy('CONSOLIDATED_PERF');
  const enabled =
    consolidated || truthy('ENABLE_API_PERF_COLLECT') || baselineSingleUser;
  const captureRequestContext =
    truthy('PERF_CAPTURE_REQUEST_CONTEXT') || consolidated || baselineSingleUser;
  return {
    enabled,
    thresholdMs: Math.max(
      1,
      parseInt((__ENV.SLOW_API_THRESHOLD_MS || '100').trim(), 10) || 100,
    ),
    slowCaptureThresholdMs: Math.max(
      1,
      parseInt((__ENV.PERF_SLOW_CAPTURE_THRESHOLD_MS || '300').trim(), 10) || 300,
    ),
    moduleName: (__ENV.MODULE_NAME || __ENV.K6_MODULE_NAME || '').trim(),
    runId: (__ENV.PERF_RUN_ID || '').trim(),
    baselineSingleUser,
    captureRequestContext,
  };
}

/** Module-level store (shared across VUs; VU globalThis is not visible in handleSummary). */
const modulePerfStore = {
  samples: [],
  worstByKey: {},
  slowRing: [],
  slowLogCount: 0,
  slowRecords: [],
};

function store() {
  return modulePerfStore;
}

function apiKey(module, method, endpoint) {
  return `${module}\0${method}\0${endpoint}`;
}

function pathFromUrl(url) {
  if (!url) return 'unknown';
  try {
    const m = String(url).match(/https?:\/\/[^/]+(\/[^?#]*)/i);
    if (!m) return String(url);
    let path = m[1];
    path = path.replace(
      /\/[0-9a-f]{24,32}(?=\/|$)/gi,
      '/{id}',
    );
    path = path.replace(/\/\d+(?=\/|$)/g, '/{id}');
    return path;
  } catch {
    return 'unknown';
  }
}

/** Prefer catalog-style `/api/...` paths over k6 check labels like `script GET x vu1`. */
function resolvePerfEndpoint(meta, res) {
  const raw = meta && meta.endpoint != null ? String(meta.endpoint).trim() : '';
  if (raw.startsWith('/api/')) return raw.slice(0, 200);
  const fromUrl = pathFromUrl(res && res.url ? res.url : '');
  if (fromUrl.startsWith('/api/')) return fromUrl.slice(0, 200);
  return (raw || meta.tagName || fromUrl || 'unknown').slice(0, 200);
}

function tagValue(value, maxLen) {
  if (value == null || value === '') return '';
  return String(value).slice(0, maxLen);
}

/** k6 v2 handleSummary has no per-tag metric series; runner parses these log lines. */
const PERF_WORST_LOG_MARKER = '__K6_PERF_WORST__';
const PERF_SLOW_LOG_MARKER = '__K6_PERF_SLOW__';

function buildForensicsPayload(sample, ms) {
  const ctx = sample && sample.context;
  if (!ctx) return null;
  const sliceId = (__ENV.PERF_SLICE_ID || '').trim();
  const userLabel = (__ENV.PERF_USER_LABEL || '').trim();
  return {
    ms,
    durationMs: ms,
    module: sample.module,
    method: sample.method,
    endpoint: sample.endpoint,
    script: ctx.script || scriptFileFromEnv(sliceId),
    scenario: ctx.scenario || null,
    userEmail: ctx.userEmail || userLabel || null,
    vu: ctx.vu != null ? ctx.vu : null,
    iteration: ctx.iteration != null ? ctx.iteration : null,
    activeSessions: ctx.activeSessions != null ? ctx.activeSessions : null,
    status: ctx.status != null ? ctx.status : null,
    cashflowId: ctx.cashflowId || null,
    clientId: ctx.clientId || null,
    advisorId: ctx.advisorId || null,
    actualUrl: ctx.actualUrl || null,
    correlationId: ctx.correlationId || null,
    timestamp: ctx.timestamp || new Date().toISOString(),
    sliceId: sliceId || null,
    throttled: !!ctx.throttled,
    adaptiveAbortNearby: !!ctx.adaptiveAbortNearby,
    requestContext: ctx.requestContext || null,
  };
}

function emitWorstSnapshotLog(sample, ms) {
  const payload = buildForensicsPayload(sample, ms);
  if (!payload) return;
  console.log(PERF_WORST_LOG_MARKER + JSON.stringify(payload));
}

function emitSlowRequestLog(sample, ms) {
  const payload = buildForensicsPayload(sample, ms);
  if (!payload) return;
  const st = store();
  const maxSlowLog = Math.max(
    50,
    parseInt((__ENV.PERF_CAPTURE_MAX_SLOW_RECORDS || '2000').trim(), 10) || 2000,
  );
  if (st.slowRecords.length < maxSlowLog) {
    st.slowRecords.push(payload);
  }
  console.log(PERF_SLOW_LOG_MARKER + JSON.stringify(payload));
}

function pushSlowRing(st, entry, maxN) {
  st.slowRing.push(entry);
  if (st.slowRing.length > maxN) {
    st.slowRing.sort((a, b) => b.ms - a.ms);
    st.slowRing.length = maxN;
  }
}

function cloneSlowestRequest(sample, ms) {
  if (!sample || !sample.context) return null;
  return Object.assign({ ms }, sample.context);
}

/**
 * Record one HTTP observation (call from observeHttp / recordOutcome paths).
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {object} [meta]
 */
export function recordApiPerformance(res, meta = {}) {
  const cfg = perfConfigFromEnv();
  if (!cfg.enabled) return;

  const module = (meta.module || cfg.moduleName || 'unknown').trim() || 'unknown';
  const method = String(
    meta.method || (res && res.request && res.request.method) || 'HTTP',
  ).toUpperCase();
  const endpoint = resolvePerfEndpoint(meta, res);
  const status = res && res.status != null ? Number(res.status) : 0;
  const ms =
    res && res.timings && res.timings.duration != null ? Number(res.timings.duration) : 0;
  const ok = status >= 200 && status < 400;

  const tags = { module, method, endpoint };
  apiPerfDuration.add(ms, tags);
  apiPerfRequests.add(1, tags);
  if (!ok) apiPerfFailures.add(1, tags);

  const st = store();
  const sliceId = (__ENV.PERF_SLICE_ID || '').trim();
  const captureOn = captureContextEnabled(cfg);
  const limits = requestContextLimits(cfg);

  let context = null;
  if (captureOn) {
    const adaptiveSt = globalThis.__k6AdaptiveThrottle;
    const userLabel = (__ENV.PERF_USER_LABEL || '').trim();
    const metaAug = Object.assign(
      {
        module,
        method,
        endpoint,
        sliceId,
        script: scriptFileFromEnv(sliceId),
        userEmail: meta.userEmail || userLabel || undefined,
        throttled: !!meta.throttled,
        adaptiveAbortNearby: !!meta.adaptiveAbortNearby,
      },
      meta,
    );
    if (adaptiveSt && adaptiveSt.aborted) metaAug.adaptiveAbortNearby = true;
    context = buildRequestObservation(res, metaAug, cfg);
    context.module = module;
    context.method = method;
    context.endpoint = endpoint;
    context.ms = ms;
    context.ok = ok;
    context.slow = ms > cfg.thresholdMs;
  }

  const sample = {
    module,
    method,
    endpoint,
    status,
    ms,
    ok,
    slow: ms > cfg.thresholdMs,
    ts: Date.now(),
    context,
  };

  if (st.samples.length < limits.maxSlowSamples * 20) {
    st.samples.push(sample);
  }

  if (captureOn && context) {
    const k = apiKey(module, method, endpoint);
    const prev = st.worstByKey[k];
    if (!prev || ms >= prev.ms) {
      st.worstByKey[k] = sample;
      emitWorstSnapshotLog(sample, ms);
    }
    if (ms >= cfg.slowCaptureThresholdMs) {
      const maxSlowLog = Math.max(
        50,
        parseInt((__ENV.PERF_CAPTURE_MAX_SLOW_RECORDS || '2000').trim(), 10) || 2000,
      );
      if (st.slowLogCount == null) st.slowLogCount = 0;
      if (st.slowLogCount < maxSlowLog) {
        emitSlowRequestLog(sample, ms);
        st.slowLogCount += 1;
      }
    }
    if (ms >= cfg.thresholdMs || !ok) {
      pushSlowRing(st, sample, limits.maxSlowSamples);
    }
  }
}

/**
 * Aggregate in-memory samples for this k6 process (one module run).
 * @param {string} [moduleName]
 * @returns {object}
 */
export function buildModulePerfSlice(moduleName) {
  const cfg = perfConfigFromEnv();
  const mod = (moduleName || cfg.moduleName || 'unknown').trim() || 'unknown';
  const st = store();
  const sliceId = (__ENV.PERF_SLICE_ID || '').trim() || mod;
  const byKey = {};

  for (const s of st.samples) {
    const k = apiKey(s.module, s.method, s.endpoint);
    if (!byKey[k]) {
      byKey[k] = {
        module: s.module,
        method: s.method,
        endpoint: s.endpoint,
        durations: [],
        failures: 0,
        slowCount: 0,
      };
    }
    const row = byKey[k];
    row.durations.push(s.ms);
    if (!s.ok) row.failures += 1;
    if (s.ms > cfg.thresholdMs) row.slowCount += 1;
  }

  const apis = Object.values(byKey).map((row) => {
    const d = row.durations.slice().sort((a, b) => a - b);
    const n = d.length;
    const sum = d.reduce((a, b) => a + b, 0);
    const k = apiKey(row.module, row.method, row.endpoint);
    const worst = st.worstByKey[k];
    return {
      module: row.module,
      method: row.method,
      endpoint: row.endpoint,
      totalCalls: n,
      failures: row.failures,
      slowCount: row.slowCount,
      avgMs: n ? sum / n : null,
      minMs: n ? d[0] : null,
      maxMs: n ? d[n - 1] : null,
      p90Ms: n ? percentile(d, 90) : null,
      p95Ms: n ? percentile(d, 95) : null,
      slowestRequest: worst ? cloneSlowestRequest(worst, worst.ms) : null,
    };
  });

  apis.sort((a, b) => String(a.endpoint).localeCompare(String(b.endpoint)));

  const slowestInstances = apis
    .filter((a) => a.slowestRequest && a.maxMs != null)
    .map((a) =>
      Object.assign(
        {
          endpoint: a.endpoint,
          method: a.method,
          module: a.module,
          maxMs: a.maxMs,
          p95Ms: a.p95Ms,
          avgMs: a.avgMs,
          totalCalls: a.totalCalls,
          failures: a.failures,
        },
        a.slowestRequest,
      ),
    )
    .sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0));

  return {
    module: mod,
    runId: cfg.runId,
    thresholdMs: cfg.thresholdMs,
    sampleCount: st.samples.length,
    collectedAt: new Date().toISOString(),
    script: scriptFileFromEnv(sliceId),
    sliceId,
    captureRequestContext: cfg.captureRequestContext,
    apis,
    slowestInstances,
    slowSampleCount: st.slowRing.length,
    slowRequests: st.slowRecords.slice(),
  };
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function metricTrendValues(data, key) {
  const m = data && data.metrics && data.metrics[key];
  if (!m || !m.values) {
    return { avg: null, min: null, max: null, p90: null, p95: null, count: 0 };
  }
  const v = m.values;
  return {
    avg: v.avg != null ? v.avg : null,
    min: v.min != null ? v.min : null,
    max: v.max != null ? v.max : null,
    p90: v['p(90)'] != null ? v['p(90)'] : null,
    p95: v['p(95)'] != null ? v['p(95)'] : null,
    count: v.count != null ? v.count : 0,
  };
}

function metricCounterValue(data, key) {
  const m = data && data.metrics && data.metrics[key];
  if (!m || !m.values) return 0;
  return m.values.count != null ? m.values.count : 0;
}

/** Parse k6 tagged metric keys like `foo{method:GET,name:bar,endpoint:/x}`. */
function parseTagsFromMetricKey(key) {
  const out = {
    name: null,
    endpoint: null,
    method: null,
    module: null,
    vu: null,
    iter: null,
    user: null,
    scenario: null,
    script: null,
    status: null,
    sessions: null,
    cashflow: null,
  };
  const open = key.indexOf('{');
  const close = key.lastIndexOf('}');
  if (open < 0 || close <= open) return out;
  const inner = key.slice(open + 1, close);
  for (const part of inner.split(',')) {
    const eq = part.indexOf(':');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === 'name') out.name = v;
    if (k === 'endpoint') out.endpoint = v;
    if (k === 'method') out.method = v;
    if (k === 'module') out.module = v;
    if (k === 'vu') out.vu = v;
    if (k === 'iter') out.iter = v;
    if (k === 'user') out.user = v;
    if (k === 'scenario') out.scenario = v;
    if (k === 'script') out.script = v;
    if (k === 'status') out.status = v;
    if (k === 'sessions') out.sessions = v;
    if (k === 'cashflow') out.cashflow = v;
  }
  return out;
}

/**
 * Rebuild slowest-request rows from api_perf_worst_snapshot_ms (available in handleSummary).
 * @param {object} data
 * @param {string} [moduleName]
 * @returns {Record<string, object>}
 */
export function buildWorstSnapshotsFromMetrics(data, moduleName) {
  const mod = (moduleName || 'unknown').trim() || 'unknown';
  const byKey = {};
  if (!data || !data.metrics) return byKey;

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('api_perf_worst_snapshot_ms{')) continue;
    const tags = parseTagsFromMetricKey(key);
    const endpoint = tags.endpoint || tags.name || 'unknown';
    const method = (tags.method || 'HTTP').toUpperCase();
    const module = (tags.module || mod).trim() || mod;
    const vals = metricTrendValues(data, key);
    const ms = vals.max != null ? vals.max : vals.avg;
    if (ms == null) continue;
    const k = apiKey(module, method, endpoint);
    const prev = byKey[k];
    if (!prev || ms > prev.ms) {
      byKey[k] = {
        ms,
        module,
        method,
        endpoint,
        script: tags.script || null,
        scenario: tags.scenario || null,
        userEmail: tags.user || null,
        vu: tags.vu != null && tags.vu !== '' ? Number(tags.vu) : null,
        iteration: tags.iter != null && tags.iter !== '' ? Number(tags.iter) : null,
        activeSessions:
          tags.sessions != null && tags.sessions !== '' ? Number(tags.sessions) : null,
        status: tags.status != null && tags.status !== '' ? Number(tags.status) : null,
        cashflowId: tags.cashflow || null,
      };
    }
  }
  return byKey;
}

function applyWorstSnapshotsToApis(apis, data, moduleName) {
  const worst = buildWorstSnapshotsFromMetrics(data, moduleName);
  for (const api of apis) {
    const k = apiKey(api.module, api.method, api.endpoint);
    const snap = worst[k];
    if (!snap) continue;
    if (!api.slowestRequest || snap.ms >= (api.slowestRequest.ms || 0)) {
      api.slowestRequest = snap;
    }
  }
  for (const snap of Object.values(worst)) {
    const exists = apis.some(
      (a) =>
        a.module === snap.module &&
        a.method === snap.method &&
        a.endpoint === snap.endpoint,
    );
    if (!exists) {
      apis.push({
        module: snap.module,
        method: snap.method,
        endpoint: snap.endpoint,
        totalCalls: 0,
        failures: 0,
        slowCount: 0,
        avgMs: null,
        minMs: null,
        maxMs: snap.ms,
        p90Ms: null,
        p95Ms: null,
        slowestRequest: snap,
      });
    }
  }
}

function apiRowKey(module, method, endpoint) {
  return `${module}\0${method}\0${endpoint}`;
}

function upsertApiRow(map, row) {
  const k = apiRowKey(row.module, row.method, row.endpoint);
  const existing = map[k];
  if (!existing) {
    map[k] = Object.assign({}, row);
    return map[k];
  }
  if (row.avgMs != null) existing.avgMs = row.avgMs;
  if (row.minMs != null) existing.minMs = row.minMs;
  if (row.maxMs != null) existing.maxMs = row.maxMs;
  if (row.p90Ms != null) existing.p90Ms = row.p90Ms;
  if (row.p95Ms != null) existing.p95Ms = row.p95Ms;
  if (row.totalCalls > existing.totalCalls) existing.totalCalls = row.totalCalls;
  existing.failures += row.failures || 0;
  existing.slowCount += row.slowCount || 0;
  if (row.slowestRequest && (!existing.slowestRequest || row.slowestRequest.ms >= existing.slowestRequest.ms)) {
    existing.slowestRequest = row.slowestRequest;
  }
  return existing;
}

/**
 * Build API rows from k6 handleSummary metrics (VU globalThis is not visible here).
 * @param {object} data
 * @param {string} moduleName
 * @returns {object[]}
 */
export function buildApisFromK6Metrics(data, moduleName) {
  const cfg = perfConfigFromEnv();
  const mod = (moduleName || 'unknown').trim() || 'unknown';
  const byKey = {};
  if (!data || !data.metrics) return [];

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('api_perf_duration_ms{')) continue;
    const tags = parseTagsFromMetricKey(key);
    const endpoint = tags.endpoint || tags.name || 'unknown';
    const method = (tags.method || 'HTTP').toUpperCase();
    const module = (tags.module || mod).trim() || mod;
    const vals = metricTrendValues(data, key);
    upsertApiRow(byKey, {
      module,
      method,
      endpoint,
      totalCalls: vals.count,
      failures: 0,
      slowCount: 0,
      avgMs: vals.avg,
      minMs: vals.min,
      maxMs: vals.max,
      p90Ms: vals.p90,
      p95Ms: vals.p95,
      slowestRequest: null,
    });
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('api_perf_requests{')) continue;
    const tags = parseTagsFromMetricKey(key);
    const endpoint = tags.endpoint || tags.name || 'unknown';
    const method = (tags.method || 'HTTP').toUpperCase();
    const module = (tags.module || mod).trim() || mod;
    const count = metricCounterValue(data, key);
    const row = upsertApiRow(byKey, {
      module,
      method,
      endpoint,
      totalCalls: count,
      failures: 0,
      slowCount: 0,
      avgMs: null,
      minMs: null,
      maxMs: null,
      p90Ms: null,
      p95Ms: null,
      slowestRequest: null,
    });
    if (row.totalCalls < count) row.totalCalls = count;
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('api_perf_failures{')) continue;
    const tags = parseTagsFromMetricKey(key);
    const endpoint = tags.endpoint || tags.name || 'unknown';
    const method = (tags.method || 'HTTP').toUpperCase();
    const module = (tags.module || mod).trim() || mod;
    const row = upsertApiRow(byKey, {
      module,
      method,
      endpoint,
      totalCalls: 0,
      failures: metricCounterValue(data, key),
      slowCount: 0,
      avgMs: null,
      minMs: null,
      maxMs: null,
      p90Ms: null,
      p95Ms: null,
      slowestRequest: null,
    });
    row.failures = metricCounterValue(data, key);
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith('http_req_duration{')) continue;
    const tags = parseTagsFromMetricKey(key);
    const endpoint = tags.endpoint || tags.name;
    if (!endpoint) continue;
    const method = (tags.method || inferHttpMethodFromTag(endpoint)).toUpperCase();
    const module = (tags.module || mod).trim() || mod;
    const vals = metricTrendValues(data, key);
    const row = upsertApiRow(byKey, {
      module,
      method,
      endpoint,
      totalCalls: vals.count,
      failures: 0,
      slowCount: 0,
      avgMs: vals.avg,
      minMs: vals.min,
      maxMs: vals.max,
      p90Ms: vals.p90,
      p95Ms: vals.p95,
      slowestRequest: null,
    });
    if (row.maxMs != null && row.maxMs > cfg.thresholdMs && row.slowCount === 0) {
      row.slowCount = row.totalCalls;
    }
  }

  return Object.values(byKey);
}

function inferHttpMethodFromTag(endpointOrName) {
  const n = String(endpointOrName).toLowerCase();
  if (n.includes('_post_') || n.startsWith('post_') || n.includes('_create_')) return 'POST';
  if (n.includes('_put_') || n.startsWith('put_') || n.includes('_update_')) return 'PUT';
  if (n.includes('_delete_') || n.startsWith('delete_')) return 'DELETE';
  if (n.startsWith('/api/') && n.includes('/connect/token')) return 'POST';
  return 'GET';
}

/**
 * Supplement slice with k6 summary metrics (api_perf_* and http_req_duration tags).
 * @param {object} data handleSummary metrics
 * @param {string} moduleName
 * @returns {object}
 */
export function enrichSliceFromK6Metrics(data, moduleName) {
  const slice = buildModulePerfSlice(moduleName);
  const fromMetrics = buildApisFromK6Metrics(data, moduleName);
  const cfg = perfConfigFromEnv();

  for (const api of fromMetrics) {
    const existing = slice.apis.find(
      (a) =>
        a.module === api.module && a.method === api.method && a.endpoint === api.endpoint,
    );
    if (existing) {
      if (api.avgMs != null) existing.avgMs = api.avgMs;
      if (api.minMs != null) existing.minMs = api.minMs;
      if (api.maxMs != null) existing.maxMs = api.maxMs;
      if (api.p90Ms != null) existing.p90Ms = api.p90Ms;
      if (api.p95Ms != null) existing.p95Ms = api.p95Ms;
      if (api.totalCalls > existing.totalCalls) existing.totalCalls = api.totalCalls;
      existing.failures += api.failures || 0;
      existing.slowCount += api.slowCount || 0;
      if (
        existing.slowestRequest &&
        existing.maxMs != null &&
        existing.slowestRequest.ms != null &&
        existing.slowestRequest.ms < existing.maxMs
      ) {
        existing.slowestRequest.ms = existing.maxMs;
      }
    } else {
      if (api.maxMs != null && api.maxMs > cfg.thresholdMs && !api.slowCount) {
        api.slowCount = api.totalCalls;
      }
      slice.apis.push(api);
    }
  }

  applyWorstSnapshotsToApis(slice.apis, data, moduleName);

  slice.apis.sort((a, b) => String(a.endpoint).localeCompare(String(b.endpoint)));
  slice.slowestInstances = slice.apis
    .filter((a) => a.slowestRequest)
    .map((a) =>
      Object.assign(
        {
          endpoint: a.endpoint,
          method: a.method,
          module: a.module,
          maxMs: a.maxMs,
          p95Ms: a.p95Ms,
          avgMs: a.avgMs,
          totalCalls: a.totalCalls,
          failures: a.failures,
        },
        a.slowestRequest,
      ),
    )
    .sort((a, b) => (b.maxMs || b.ms || 0) - (a.maxMs || a.ms || 0));

  return slice;
}

export { registerPerfVuSession } from './api-perf-request-context.js';
