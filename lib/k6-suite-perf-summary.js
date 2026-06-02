/**
 * Attach multi-API suite load reports to consolidated perf slices.
 */
import { perfConfigFromEnv } from './api-performance-collector.js';
import { attachPerfSliceToSummary } from './k6-perf-integration.js';

/**
 * @param {object[]} reportApis rows from suite handleSummary `apis` array
 * @param {string} moduleName
 * @returns {object[]}
 */
export function suiteReportApisToPerfRows(reportApis, moduleName) {
  const cfg = perfConfigFromEnv();
  const mod = moduleName || 'unknown';
  return (reportApis || []).map((a) => {
    const avg = a.averageResponseTimeMs;
    const p95 = a.p95ResponseTimeMs;
    const max = p95 != null ? p95 : avg;
    const calls = a.totalRequests || 0;
    const failures = a.errorCount || 0;
    return {
      module: mod,
      method: (a.method || 'HTTP').toUpperCase(),
      endpoint: a.endpoint || a.apiName || 'unknown',
      totalCalls: calls,
      failures,
      slowCount: max != null && max > cfg.thresholdMs ? Math.max(1, calls - failures) : 0,
      avgMs: avg,
      minMs: a.minResponseTimeMs != null ? a.minResponseTimeMs : null,
      maxMs: a.maxResponseTimeMs != null ? a.maxResponseTimeMs : max,
      p90Ms: null,
      p95Ms: p95,
    };
  });
}

/**
 * @param {object} out handleSummary output map
 * @param {object} data k6 summary data
 * @param {string} moduleName
 * @param {string} sliceId
 * @param {object[]} reportApis
 */
export function attachSuitePerfSlice(out, data, moduleName, sliceId, reportApis) {
  const rows = suiteReportApisToPerfRows(reportApis, moduleName);
  return attachPerfSliceToSummary(out, data, moduleName, rows, sliceId);
}
