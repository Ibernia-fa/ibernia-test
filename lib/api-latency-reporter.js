/**
 * Per-API latency aggregation and report builders for k6 handleSummary.
 */
import { adaptiveConfigFromEnv, getAdaptiveVuSnapshot } from './adaptive-throttle-monitor.js';

function metricCount(data, name) {
  const m = data && data.metrics && data.metrics[name];
  if (!m || m.values == null) return 0;
  const c = m.values.count;
  return c != null ? c : 0;
}

function metricTrendValues(data, name) {
  const m = data && data.metrics && data.metrics[name];
  if (!m || !m.values) {
    return { avg: null, min: null, max: null, med: null, p90: null, p95: null };
  }
  const v = m.values;
  return {
    avg: v.avg != null ? v.avg : null,
    min: v.min != null ? v.min : null,
    max: v.max != null ? v.max : null,
    med: v.med != null ? v.med : null,
    p90: v['p(90)'] != null ? v['p(90)'] : null,
    p95: v['p(95)'] != null ? v['p(95)'] : null,
  };
}

/**
 * Parse tagged adaptive metrics: adaptive_api_latency_ms{endpoint:...,method:GET}
 * @param {object} data k6 handleSummary data
 * @param {number} maxAcceptableMs
 */
export function buildEndpointStatsFromMetrics(data, maxAcceptableMs) {
  const endpoints = {};
  if (!data || !data.metrics) return endpoints;

  const latencyPrefix = 'adaptive_api_latency_ms{';
  const totalPrefix = 'adaptive_api_requests{';
  const slowPrefix = 'adaptive_api_slow_requests{';

  for (const key of Object.keys(data.metrics)) {
    let endpoint = null;
    let method = 'HTTP';
    if (key.startsWith(latencyPrefix)) {
      const tags = parseTagsFromMetricKey(key, 'adaptive_api_latency_ms');
      endpoint = tags.endpoint;
      method = tags.method || method;
    } else if (key.startsWith(totalPrefix)) {
      const tags = parseTagsFromMetricKey(key, 'adaptive_api_requests');
      endpoint = tags.endpoint;
      method = tags.method || method;
    } else {
      continue;
    }
    if (!endpoint) continue;
    const ek = `${method} ${endpoint}`;
    if (!endpoints[ek]) {
      endpoints[ek] = {
        endpoint,
        method,
        totalRequests: 0,
        successCount: null,
        failureCount: null,
        slowCount: 0,
        avgMs: null,
        p90Ms: null,
        p95Ms: null,
        maxMs: null,
        overThresholdCount: 0,
        overThresholdPercent: null,
      };
    }
    const lat = metricTrendValues(data, key);
    if (key.startsWith(latencyPrefix)) {
      endpoints[ek].avgMs = lat.avg;
      endpoints[ek].p90Ms = lat.p90;
      endpoints[ek].p95Ms = lat.p95;
      endpoints[ek].maxMs = lat.max;
    }
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith(totalPrefix)) continue;
    const tags = parseTagsFromMetricKey(key, 'adaptive_api_requests');
    const ek = `${tags.method || 'HTTP'} ${tags.endpoint}`;
    if (!endpoints[ek]) continue;
    endpoints[ek].totalRequests += metricCount(data, key);
  }

  for (const key of Object.keys(data.metrics)) {
    if (!key.startsWith(slowPrefix)) continue;
    const tags = parseTagsFromMetricKey(key, 'adaptive_api_slow_requests');
    const ek = `${tags.method || 'HTTP'} ${tags.endpoint}`;
    if (!endpoints[ek]) continue;
    endpoints[ek].slowCount += metricCount(data, key);
    endpoints[ek].overThresholdCount = endpoints[ek].slowCount;
  }

  const list = Object.values(endpoints);
  for (const row of list) {
    if (row.totalRequests > 0) {
      row.overThresholdPercent = (100 * row.overThresholdCount) / row.totalRequests;
    }
    row.thresholdMs = maxAcceptableMs;
  }
  list.sort((a, b) => String(a.endpoint).localeCompare(String(b.endpoint)));
  return list;
}

function parseTagsFromMetricKey(key, metricName) {
  const out = { endpoint: null, method: null };
  const open = key.indexOf('{');
  const close = key.lastIndexOf('}');
  if (open < 0 || close <= open) return out;
  const inner = key.slice(open + 1, close);
  const parts = inner.split(',');
  for (const p of parts) {
    const eq = p.indexOf(':');
    if (eq < 0) continue;
    const k = p.slice(0, eq).trim();
    const v = p.slice(eq + 1).trim();
    if (k === 'endpoint') out.endpoint = v;
    if (k === 'method') out.method = v;
  }
  return out;
}

/**
 * @param {object} data
 * @param {object} [setupData]
 */
export function buildSessionContext(data, setupData) {
  const vuSnap = getAdaptiveVuSnapshot();
  const vusMax =
    data.metrics.vus_max && data.metrics.vus_max.values && data.metrics.vus_max.values.max != null
      ? data.metrics.vus_max.values.max
      : null;
  const vusActive =
    data.metrics.vus && data.metrics.vus.values && data.metrics.vus.values.value != null
      ? data.metrics.vus.values.value
      : null;
  const iterations =
    data.metrics.iterations && data.metrics.iterations.values
      ? data.metrics.iterations.values.count
      : null;
  const durationMs =
    data.state && data.state.testRunDurationMs != null ? data.state.testRunDurationMs : null;

  return {
    configuredVus: vusMax,
    activeVusAtEnd: vusActive,
    completedIterations: iterations,
    testDurationMs: durationMs,
    poolRunId: setupData && setupData.poolRunId ? setupData.poolRunId : null,
    leasedUserCount: setupData && setupData.leasedUserCount != null ? setupData.leasedUserCount : null,
    adaptiveAbort: vuSnap.aborted
      ? {
          reason: vuSnap.abortReason,
          abortVu: vuSnap.abortVu,
          abortAt: vuSnap.abortAt,
        }
      : null,
  };
}

/**
 * @param {object} opts
 * @param {string} opts.scriptTag
 * @param {object} opts.data handleSummary data
 * @param {object} [opts.setupData]
 * @param {string} [opts.reportDir] directory for JSON/md (relative to cwd)
 */
export function buildAdaptiveLatencyReport(opts) {
  const cfg = adaptiveConfigFromEnv();
  const maxMs = cfg.maxAcceptableMs;
  const apis = buildEndpointStatsFromMetrics(opts.data, maxMs);
  const session = buildSessionContext(opts.data, opts.setupData || {});
  const vuSnap = getAdaptiveVuSnapshot();

  return {
    reportType: 'adaptive-api-latency',
    generatedAt: new Date().toISOString(),
    script: opts.scriptTag || vuSnap.scriptTag || 'k6',
    environment: 'dev-non-production',
    config: {
      maxAcceptableMs: maxMs,
      windowSize: cfg.windowSize,
      slowPercent: cfg.slowPercent,
      stopOnDegradation: cfg.stopOnDegradation,
    },
    session,
    degradation: vuSnap.aborted
      ? {
          detected: true,
          reason: vuSnap.abortReason,
          abortVu: vuSnap.abortVu,
        }
      : { detected: false },
    apis,
  };
}

/**
 * @param {object} report
 * @returns {string}
 */
export function formatLatencyReportMarkdown(report) {
  const lines = [];
  lines.push(`# Adaptive API latency report`);
  lines.push('');
  lines.push(`- **Script:** ${report.script}`);
  lines.push(`- **Generated:** ${report.generatedAt}`);
  lines.push(`- **Threshold:** ${report.config.maxAcceptableMs} ms`);
  lines.push(`- **Configured VUs:** ${report.session.configuredVus != null ? report.session.configuredVus : 'n/a'}`);
  lines.push(`- **Completed iterations:** ${report.session.completedIterations != null ? report.session.completedIterations : 'n/a'}`);
  if (report.degradation.detected) {
    lines.push(`- **Early stop:** yes — ${report.degradation.reason}`);
  } else {
    lines.push(`- **Early stop:** no`);
  }
  lines.push('');
  lines.push(`## Per-endpoint latency`);
  lines.push('');
  lines.push(
    '| Method | Endpoint | Total | > threshold | % slow | avg (ms) | p90 | p95 | max |',
  );
  lines.push('|--------|----------|------:|------------:|-------:|---------:|----:|----:|----:|');
  for (const api of report.apis) {
    lines.push(
      `| ${api.method} | ${api.endpoint} | ${api.totalRequests} | ${api.overThresholdCount} | ${api.overThresholdPercent != null ? api.overThresholdPercent.toFixed(1) : 'n/a'} | ${fmt(api.avgMs)} | ${fmt(api.p90Ms)} | ${fmt(api.p95Ms)} | ${fmt(api.maxMs)} |`,
    );
  }
  if (!report.apis.length) {
    lines.push('| — | (no adaptive_api_* samples — enable ENABLE_ADAPTIVE_THROTTLE=1) | | | | | | | | |');
  }
  lines.push('');
  return lines.join('\n');
}

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return String(Math.round(n * 10) / 10);
}

/**
 * @param {object} baseHandleSummaryOut
 * @param {object} report
 * @param {string} jsonPath
 * @param {string} mdPath
 */
export function attachAdaptiveReportsToSummary(baseHandleSummaryOut, report, jsonPath, mdPath) {
  const out = Object.assign({}, baseHandleSummaryOut || {});
  if (jsonPath) {
    out[jsonPath] = JSON.stringify(report, null, 2);
  }
  if (mdPath) {
    out[mdPath] = formatLatencyReportMarkdown(report);
  }
  return out;
}

/**
 * @param {string} scriptTag
 * @param {string} [subdir] e.g. cashflows-income/reports
 */
export function defaultAdaptiveReportPaths(scriptTag, subdir) {
  const base = (__ENV.ADAPTIVE_REPORT_DIR || subdir || 'reports').replace(/\\/g, '/').replace(/\/$/, '');
  const slug = String(scriptTag || 'k6')
    .replace(/^k6-/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    json: `${base}/${slug}-adaptive-latency-${stamp}.json`,
    md: `${base}/${slug}-adaptive-latency-${stamp}.md`,
  };
}
