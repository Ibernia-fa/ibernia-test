/**
 * Build consolidated API performance report from per-module slices.
 * Used by tools/merge-consolidated-report.mjs (Node) and documented for k6 handleSummary.
 */
import { PLATFORM_API_CATALOG, catalogApiKey } from './platform-api-catalog.js';
import {
  compareApisByModuleOrder,
  sortModules,
} from './consolidated-module-order.js';
import { formatRequestContextSummary } from './api-perf-request-context-format.js';
import {
  aggregateSlowRequests,
  payloadSummaryFromRecord,
  DEFAULT_SLOW_CAPTURE_MS,
} from './consolidated-slow-capture.js';
import {
  resolveEndpointDisplay,
  displayEndpointCell,
  pathOnlyFromUrl,
} from './api-endpoint-display.js';

function apiKey(module, method, endpoint) {
  return `${module}\0${method}\0${endpoint}`;
}

/**
 * @param {object} record
 * @param {object} apiRow
 */
function recordMatchesApiRow(record, apiRow) {
  if (!record || !apiRow) return false;
  if (record.module !== apiRow.module) return false;
  if (String(record.method || '').toUpperCase() !== String(apiRow.method || '').toUpperCase()) {
    return false;
  }
  if (record.endpoint === apiRow.endpoint) return true;
  const recPath = pathOnlyFromUrl(record.actualUrl) || record.endpoint;
  const rowDisplay = apiRow.endpointDisplay || resolveEndpointDisplay(apiRow.endpoint, apiRow);
  const recDisplay = resolveEndpointDisplay(apiRow.endpoint, record);
  return recPath === rowDisplay || recDisplay === rowDisplay || recPath === recDisplay;
}

/**
 * @param {{ min: number|null, max: number|null, atMax: number|null }} stats
 * @param {number|null|undefined} sessions
 * @param {number|null|undefined} ms
 */
function noteActiveSessions(stats, sessions, ms) {
  if (sessions == null || !Number.isFinite(Number(sessions))) return;
  const n = Number(sessions);
  stats.min = stats.min == null ? n : Math.min(stats.min, n);
  stats.max = stats.max == null ? n : Math.max(stats.max, n);
  if (ms != null && Number.isFinite(ms)) {
    if (stats.atMaxMs == null || ms >= stats.atMaxMs) {
      stats.atMaxMs = ms;
      stats.atMax = n;
    }
  }
}

/**
 * @param {object} apiRow
 * @param {object[]} slices
 * @param {object[]} [extraRecords] spill slow requests / forensics for this user
 */
function enrichApiRowsWithSessionStats(apiRows, slices, extraRecords = []) {
  for (const row of apiRows || []) {
    const stats = { min: null, max: null, atMax: null, atMaxMs: null };
    for (const r of extraRecords || []) {
      if (!recordMatchesApiRow(r, row)) continue;
      noteActiveSessions(stats, r.activeSessions, r.durationMs ?? r.ms ?? r.maxMs);
    }
    for (const slice of slices || []) {
      for (const r of [...(slice.slowRequests || []), ...(slice.slowestInstances || [])]) {
        if (!recordMatchesApiRow(r, row)) continue;
        noteActiveSessions(stats, r.activeSessions, r.durationMs ?? r.ms ?? r.maxMs);
      }
      const k = apiKey(row.module, row.method, row.endpoint);
      for (const api of slice.apis || []) {
        if (apiKey(api.module, api.method, api.endpoint) !== k) continue;
        if (api.slowestRequest) {
          noteActiveSessions(
            stats,
            api.slowestRequest.activeSessions,
            api.slowestRequest.ms ?? api.maxMs,
          );
        }
      }
    }
    if (row.slowestRequest?.activeSessions != null) {
      noteActiveSessions(
        stats,
        row.slowestRequest.activeSessions,
        row.slowestRequest.ms ?? row.maxMs,
      );
    }
    row.activeSessionsMin = stats.min;
    row.activeSessionsMax = stats.max;
    row.activeSessionsAtMax =
      stats.atMax ?? row.slowestRequest?.activeSessions ?? stats.max ?? stats.min ?? null;
  }
}

/**
 * @param {object} row
 * @returns {string}
 */
function formatActiveSessionsCell(row) {
  const min = row.activeSessionsMin;
  const max = row.activeSessionsMax;
  const atMax = row.activeSessionsAtMax;
  if (min == null && max == null && atMax == null) return 'n/a';
  if (min != null && max != null && min !== max) return `${min}–${max}`;
  const single = min ?? max ?? atMax;
  if (atMax != null && single != null && Number(atMax) !== Number(single)) {
    return `${single} (at max: ${atMax})`;
  }
  return String(single ?? atMax);
}

/**
 * @param {object} slice
 * @returns {string}
 */
function extractSliceUserEmail(slice) {
  if (!slice) return 'unknown';
  if (slice.userEmail) return String(slice.userEmail);
  for (const api of slice.apis || []) {
    const sr = api.slowestRequest;
    if (sr && sr.userEmail) return String(sr.userEmail);
  }
  const inst = slice.slowestInstances || [];
  for (const instRow of inst) {
    if (instRow && instRow.userEmail) return String(instRow.userEmail);
  }
  const slow = slice.slowRequests || [];
  for (const r of slow) {
    if (r && r.userEmail) return String(r.userEmail);
  }
  if (slice._perfSubdir) return slice._perfSubdir;
  return 'unknown';
}

/**
 * @param {object[]} slices
 * @returns {Record<string, object[]>}
 */
function groupSlicesByUser(slices) {
  const byUser = {};
  for (const slice of slices || []) {
    const email = extractSliceUserEmail(slice);
    if (!byUser[email]) byUser[email] = [];
    byUser[email].push(slice);
  }
  return byUser;
}

/**
 * @param {object} row
 */
function attachEndpointDisplay(row) {
  if (!row) return row;
  const forensics = row.slowestRequest || row.worstRequest || row;
  row.endpointDisplay = resolveEndpointDisplay(row.endpoint, forensics);
  return row;
}

/**
 * @param {string} email
 * @returns {number|null}
 */
function parseUserNumberFromEmail(email) {
  const m = String(email || '').match(/User(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * @param {object} row merged api row with contributingScripts[]
 * @returns {string}
 */
function formatContributingScripts(row) {
  const parts = (row.contributingScripts || []).map((c) => {
    const label = c.sliceId || c.script || 'script';
    return `${label} (${c.totalCalls})`;
  });
  return parts.length ? parts.join(' + ') : '—';
}

/**
 * Per-user rows grouped by k6 script (no cross-script endpoint merge).
 * @param {object[]} slices
 */
function buildApisByUserAndScript(slices) {
  const grouped = groupSlicesByUser(slices);
  const out = {};
  for (const [email, userSlices] of Object.entries(grouped)) {
    const scripts = [];
    for (const slice of userSlices || []) {
      if (!slice || !Array.isArray(slice.apis)) continue;
      const apis = slice.apis.map((a) => {
        const row = attachEndpointDisplay({ ...a });
        enrichApiRowsWithSessionStats([row], [slice]);
        return row;
      });
      scripts.push({
        sliceId: slice.sliceId || 'unknown',
        script: slice.script || null,
        module: slice.module || null,
        totalCalls: apis.reduce((s, a) => s + (a.totalCalls || 0), 0),
        apis: apis.sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0)),
      });
    }
    scripts.sort((a, b) => String(a.sliceId).localeCompare(String(b.sliceId)));
    out[email] = {
      userEmail: email,
      userNumber: parseUserNumberFromEmail(email),
      scriptRuns: scripts.length,
      scripts,
    };
  }
  return out;
}

/**
 * @param {object[]} slices
 * @param {number} thresholdMs
 * @param {object[]} [slowRequests]
 * @returns {Record<string, object>}
 */
function buildApisByUser(slices, thresholdMs, slowRequests = []) {
  const grouped = groupSlicesByUser(slices);
  const apisByUser = {};
  for (const [email, userSlices] of Object.entries(grouped)) {
    const merged = mergeSlices(userSlices, thresholdMs);
    const userSlow = (slowRequests || []).filter(
      (r) => (r.userEmail || 'unknown') === email,
    );
    for (const list of [merged.apis, merged.slowApis, merged.fastApis, merged.unmeasuredApis]) {
      for (const row of list || []) attachEndpointDisplay(row);
      enrichApiRowsWithSessionStats(list, userSlices, userSlow);
    }
    apisByUser[email] = {
      userEmail: email,
      sliceCount: userSlices.length,
      summary: merged.summary,
      apis: merged.apis,
      slowApis: merged.slowApis,
      fastApis: merged.fastApis,
      unmeasuredApis: merged.unmeasuredApis,
    };
  }
  return apisByUser;
}

/**
 * Merge per-endpoint slowest request instances across slices (keeps highest ms).
 * @param {object[]} slices
 * @param {object[]} apis merged api rows
 */
function buildSlowestRequestDetails(slices, apis) {
  const byEndpoint = {};
  for (const slice of slices || []) {
    const script =
      slice.script ||
      (slice.sliceId ? `k6/${slice.module || 'unknown'}/${slice.sliceId}.js` : null) ||
      slice.module;
    for (const inst of slice.slowestInstances || []) {
      const k = apiKey(inst.module, inst.method, inst.endpoint);
      const ms = inst.ms != null ? inst.ms : inst.maxMs;
      if (ms == null) continue;
      const prev = byEndpoint[k];
      if (!prev || ms > (prev.ms != null ? prev.ms : prev.maxMs)) {
        byEndpoint[k] = Object.assign({}, inst, {
          ms,
          maxMs: ms,
          script: inst.script || script,
        });
      }
    }
    for (const api of slice.apis || []) {
      if (!api.slowestRequest) continue;
      const k = apiKey(api.module, api.method, api.endpoint);
      const sr = api.slowestRequest;
      const ms = sr.ms != null ? sr.ms : api.maxMs;
      if (ms == null) continue;
      const prev = byEndpoint[k];
      if (!prev || ms > (prev.ms != null ? prev.ms : prev.maxMs)) {
        byEndpoint[k] = Object.assign({}, sr, {
          endpoint: api.endpoint,
          method: api.method,
          module: api.module,
          ms,
          maxMs: ms,
          p95Ms: api.p95Ms,
          avgMs: api.avgMs,
          totalCalls: api.totalCalls,
          failures: api.failures,
          script: sr.script || script,
        });
      }
    }
  }

  for (const api of apis || []) {
    const k = apiKey(api.module, api.method, api.endpoint);
    if (byEndpoint[k]) {
      byEndpoint[k].maxMs = api.maxMs;
      byEndpoint[k].p95Ms = api.p95Ms;
      byEndpoint[k].avgMs = api.avgMs;
      byEndpoint[k].totalCalls = api.totalCalls;
      byEndpoint[k].failures = api.failures;
      if (!byEndpoint[k].slowestRequest && api.slowestRequest) {
        byEndpoint[k].slowestRequest = api.slowestRequest;
      }
    }
  }

  const rows = Object.values(byEndpoint).filter((r) => (r.totalCalls || 0) > 0 || r.ms != null);
  for (const r of rows) {
    if (!r.slowestRequest && r.maxMs != null) {
      r.slowestRequest = {
        ms: r.maxMs,
        maxMs: r.maxMs,
        module: r.module,
        method: r.method,
        endpoint: r.endpoint,
        script: r.script || null,
        note: 'Aggregated from k6 metrics only (no per-request capture in slice)',
      };
    }
    attachEndpointDisplay(r);
  }
  return rows.sort((a, b) => (b.ms || b.maxMs || 0) - (a.ms || a.maxMs || 0));
}

/**
 * API exceeds slow threshold when max, avg, or per-request slow count indicates > threshold.
 * @param {object} api
 * @param {number} thresholdMs
 */
export function apiExceedsThreshold(api, thresholdMs) {
  if (api.maxMs != null && api.maxMs > thresholdMs) return true;
  if (api.avgMs != null && api.avgMs > thresholdMs) return true;
  if ((api.slowCount || 0) > 0) return true;
  return false;
}

/**
 * @param {object[]} slices array of module slice objects
 * @param {object} [opts]
 * @param {number} [opts.thresholdMs]
 * @param {string} [opts.runId]
 */
function mergeSlices(slices, thresholdMs) {
  const byKey = {};
  let totalSamples = 0;

  for (const slice of slices || []) {
    if (!slice || !Array.isArray(slice.apis)) continue;
    totalSamples += slice.sampleCount || 0;
    const sliceId = slice.sliceId || slice.script || 'unknown';
    const sliceScript = slice.script || null;
    for (const api of slice.apis) {
      const k = `${api.module}\0${api.method}\0${api.endpoint}`;
      if (!byKey[k]) {
        byKey[k] = {
          module: api.module,
          method: api.method,
          endpoint: api.endpoint,
          totalCalls: 0,
          failures: 0,
          slowCount: 0,
          durationSum: 0,
          minMs: null,
          maxMs: null,
          p90Ms: null,
          p95Ms: null,
          avgMs: null,
          slowestRequest: null,
          _contrib: {},
        };
      }
      const row = byKey[k];
      const calls = api.totalCalls || 0;
      if (!row._contrib[sliceId]) {
        row._contrib[sliceId] = {
          sliceId,
          script: sliceScript,
          module: slice.module,
          totalCalls: 0,
          maxMs: null,
        };
      }
      row._contrib[sliceId].totalCalls += calls;
      if (api.minMs != null) {
        row._contrib[sliceId].minMs =
          row._contrib[sliceId].minMs == null
            ? api.minMs
            : Math.min(row._contrib[sliceId].minMs, api.minMs);
      }
      if (api.maxMs != null) {
        row._contrib[sliceId].maxMs =
          row._contrib[sliceId].maxMs == null
            ? api.maxMs
            : Math.max(row._contrib[sliceId].maxMs, api.maxMs);
      }
      row.totalCalls += calls;
      row.failures += api.failures || 0;
      row.slowCount += api.slowCount || 0;
      if (api.avgMs != null && calls > 0) {
        row.durationSum += api.avgMs * calls;
      }
      if (api.minMs != null) {
        row.minMs = row.minMs == null ? api.minMs : Math.min(row.minMs, api.minMs);
      }
      if (api.maxMs != null) {
        row.maxMs = row.maxMs == null ? api.maxMs : Math.max(row.maxMs, api.maxMs);
      }
      if (api.p90Ms != null) {
        row.p90Ms = row.p90Ms == null ? api.p90Ms : Math.max(row.p90Ms, api.p90Ms);
      }
      if (api.p95Ms != null) {
        row.p95Ms = row.p95Ms == null ? api.p95Ms : Math.max(row.p95Ms, api.p95Ms);
      }
      if (api.slowestRequest) {
        const ms = api.slowestRequest.ms != null ? api.slowestRequest.ms : api.maxMs;
        const prev = row.slowestRequest;
        if (
          !prev ||
          ms > (prev.ms != null ? prev.ms : row.maxMs || 0) ||
          (ms === (prev.ms != null ? prev.ms : 0) &&
            !prev.script &&
            api.slowestRequest.script)
        ) {
          row.slowestRequest = Object.assign({}, api.slowestRequest, { ms });
        }
      }
    }
  }

  const apis = Object.values(byKey).map((row) => {
    const avgMs = row.totalCalls > 0 ? row.durationSum / row.totalCalls : null;
    const contributingScripts = Object.values(row._contrib || {}).sort((a, b) =>
      String(a.sliceId).localeCompare(String(b.sliceId)),
    );
    const apiRow = {
      module: row.module,
      method: row.method,
      endpoint: row.endpoint,
      totalCalls: row.totalCalls,
      failures: row.failures,
      slowCount: row.slowCount,
      avgMs: avgMs,
      minMs: row.minMs,
      maxMs: row.maxMs,
      p90Ms: row.p90Ms,
      p95Ms: row.p95Ms,
      overThresholdMs: thresholdMs,
      slowestRequest: row.slowestRequest || null,
      contributingScripts,
      scriptRunCount: contributingScripts.length,
    };
    return attachEndpointDisplay(apiRow);
  });

  apis.sort(compareApisByModuleOrder);

  const toSummaryRow = (a) =>
    attachEndpointDisplay({
      module: a.module,
      method: a.method,
      endpoint: a.endpoint,
      endpointDisplay: a.endpointDisplay,
      maxMs: a.maxMs,
      avgMs: a.avgMs,
      minMs: a.minMs,
      p95Ms: a.p95Ms,
      totalCalls: a.totalCalls,
      failures: a.failures,
      slowCount: a.slowCount,
      slowestRequest: a.slowestRequest,
      contributingScripts: a.contributingScripts,
      scriptRunCount: a.scriptRunCount,
      activeSessionsMin: a.activeSessionsMin,
      activeSessionsMax: a.activeSessionsMax,
      activeSessionsAtMax: a.activeSessionsAtMax,
    });

  const hasTraffic = (a) => (a.totalCalls || 0) > 0;
  const measuredApis = apis.filter(hasTraffic);
  const unmeasuredApis = apis.filter((a) => !hasTraffic(a));

  const slowApisRaw = measuredApis.filter((a) => apiExceedsThreshold(a, thresholdMs));
  const fastApisRaw = measuredApis.filter((a) => !apiExceedsThreshold(a, thresholdMs));

  const slowApis = slowApisRaw.map(toSummaryRow).sort(compareApisByModuleOrder);
  const fastApis = fastApisRaw.map(toSummaryRow).sort(compareApisByModuleOrder);

  const pickSlowest = (rows) =>
    rows.reduce(
      (best, a) =>
        !best || (a.maxMs ?? 0) > (best.maxMs ?? 0) ? a : best,
      null,
    );
  const pickFastest = (rows) =>
    rows.reduce(
      (best, a) =>
        !best || (a.maxMs ?? Infinity) < (best.maxMs ?? Infinity) ? a : best,
      null,
    );

  const allMax = apis.map((a) => a.maxMs).filter((x) => x != null);
  const allAvg = apis.filter((a) => a.avgMs != null);
  const overallAvg =
    allAvg.length > 0
      ? allAvg.reduce((s, a) => s + a.avgMs * a.totalCalls, 0) /
        allAvg.reduce((s, a) => s + a.totalCalls, 0)
      : null;

  return {
    apis,
    slowApis,
    fastApis,
    totalSamples,
    overallAvg,
    summary: {
      totalApiKeys: apis.length,
      totalSamples,
      totalCalls: apis.reduce((s, a) => s + a.totalCalls, 0),
      totalFailures: apis.reduce((s, a) => s + a.failures, 0),
      totalSuccessful: apis.reduce((s, a) => s + Math.max(0, a.totalCalls - a.failures), 0),
      apisExceedingThresholdMs: slowApis.length,
      apisWithinThresholdMs: fastApis.length,
      apisNotMeasured: unmeasuredApis.length,
      slowestApi: pickSlowest(slowApis),
      fastestApi: pickFastest(fastApis),
      overallAvgMs: overallAvg,
    },
    unmeasuredApis,
  };
}

export function buildConsolidatedReport(slices, opts = {}) {
  return buildReportCore(slices, opts);
}

/**
 * @param {object[]} slowRequests
 * @param {number} slowCaptureThresholdMs
 */
export function buildSlowForensics(slowRequests, slowCaptureThresholdMs) {
  return aggregateSlowRequests(slowRequests, slowCaptureThresholdMs);
}

function buildReportCore(slices, opts) {
  const thresholdMs =
    opts.thresholdMs != null
      ? opts.thresholdMs
      : parseInt(String(opts.thresholdMs || 100), 10) || 100;
  const slowCaptureThresholdMs =
    opts.slowCaptureThresholdMs != null
      ? opts.slowCaptureThresholdMs
      : parseInt(String(opts.slowCaptureThresholdMs || DEFAULT_SLOW_CAPTURE_MS), 10) ||
        DEFAULT_SLOW_CAPTURE_MS;
  const runId = opts.runId || 'unknown';
  const catalog = opts.catalog || PLATFORM_API_CATALOG;
  const slowRequestsInput = opts.slowRequests || [];

  const sliceResult = mergeSlices(slices, thresholdMs);
  const { apis, slowApis, fastApis, unmeasuredApis, summary } = sliceResult;

  const observedKeys = new Set(
    apis.map((a) => `${a.module}\0${a.method}\0${a.endpoint}`),
  );
  const catalogMissing = catalog
    .filter((c) => !observedKeys.has(catalogApiKey(c)))
    .sort(compareApisByModuleOrder);
  const catalogObserved = catalog.filter((c) => observedKeys.has(catalogApiKey(c)));

  const modulesIncluded = sortModules([
    ...new Set([
      ...slices.map((s) => s.module).filter(Boolean),
      ...apis.map((a) => a.module),
    ]),
  ]);

  const slowestRequestDetails = buildSlowestRequestDetails(slices, apis);
  const globalSlowest =
    slowestRequestDetails[0] ||
    (summary.slowestApi
      ? {
          endpoint: summary.slowestApi.endpoint,
          method: summary.slowestApi.method,
          module: summary.slowestApi.module,
          maxMs: summary.slowestApi.maxMs,
          ms: summary.slowestApi.maxMs,
        }
      : null);

  const slowForensics = buildSlowForensics(slowRequestsInput, slowCaptureThresholdMs);
  const apisByUser = buildApisByUser(slices, thresholdMs, slowRequestsInput);
  const apisByUserAndScript = buildApisByUserAndScript(slices);

  return {
    reportType: 'consolidated-api-performance',
    generatedAt: new Date().toISOString(),
    runId,
    environment: opts.environment || 'dev-non-production',
    thresholdMs,
    slowCaptureThresholdMs,
    modulesIncluded,
    sliceCount: slices.length,
    catalogCoverage: {
      expectedInCatalog: catalog.length,
      observedMatchingCatalog: catalogObserved.length,
      missingFromRun: catalogMissing,
    },
    summary,
    apis,
    slowApis,
    fastApis,
    unmeasuredApis,
    slowestRequestDetails,
    globalSlowestRequest: globalSlowest,
    slowRequests: slowForensics.slowRequests,
    slowRequestsByUser: slowForensics.slowRequestsByUser,
    perUserEndpointStats: slowForensics.perUserEndpointStats,
    topSlowEndpoints: slowForensics.topSlowEndpoints,
    slowForensicsSummary: {
      totalSlowRequests: slowForensics.totalSlowRequests,
      distinctUsers: Object.keys(slowForensics.slowRequestsByUser).length,
    },
    apisByUser,
    apisByUserAndScript,
  };
}

/** Escape pipe characters for markdown table cells. */
function mdCell(s) {
  return String(s ?? 'n/a').replace(/\|/g, '/');
}

/**
 * @param {string[]} lines
 * @param {object} report
 */
function appendApisByUserAndScriptMarkdown(lines, report) {
  const byUser = report.apisByUserAndScript || {};
  const emails = Object.keys(byUser).sort((a, b) => {
    const na = parseUserNumberFromEmail(a);
    const nb = parseUserNumberFromEmail(b);
    if (na != null && nb != null) return na - nb;
    return a.localeCompare(b);
  });
  if (!emails.length) return;

  lines.push('');
  lines.push('## API performance by user and script');
  lines.push('');
  lines.push(
    'One block per **k6 script run** (~30s `constant-vus` each). **Calls** here are only from that script — use this section when a combined endpoint total looks too high.',
  );

  for (const email of emails) {
    const block = byUser[email];
    lines.push('');
    const numLabel = block.userNumber != null ? ` (User${block.userNumber})` : '';
    lines.push(`### ${email}${numLabel}`);
    lines.push('');
    lines.push(`- Script runs with perf data: **${block.scriptRuns}** (of ~57 baseline scripts per user)`);

    for (const run of block.scripts || []) {
      const top = (run.apis || []).slice(0, 8);
      if (!top.length) continue;
      lines.push('');
      lines.push(`#### ${run.sliceId}`);
      if (run.script) lines.push(`- Script: \`${run.script}\``);
      lines.push(`- HTTP calls in this run: **${run.totalCalls}**`);
      lines.push('');
      lines.push(
        '| Method | Resolved path | Min (ms) | Max (ms) | Avg (ms) | Active sessions | Calls |',
      );
      lines.push(
        '|--------|---------------|----------|----------|----------|-----------------|------:|',
      );
      for (const a of top) {
        lines.push(
          `| ${a.method} | ${mdCell(displayEndpointCell(a))} | ${fmt(a.minMs)} | ${fmt(a.maxMs)} | ${fmt(a.avgMs)} | ${formatActiveSessionsCell(a)} | ${a.totalCalls} |`,
        );
      }
      if ((run.apis || []).length > top.length) {
        lines.push('');
        lines.push(`_… ${run.apis.length - top.length} more endpoint(s) in JSON \`apisByUserAndScript\`._`);
      }
    }
  }
}

/**
 * @param {string[]} lines
 * @param {object} report
 * @param {number} th
 */
function appendApisByUserMarkdown(lines, report, th) {
  const apisByUser = report.apisByUser || {};
  const emails = Object.keys(apisByUser).sort((a, b) => {
    const na = parseUserNumberFromEmail(a);
    const nb = parseUserNumberFromEmail(b);
    if (na != null && nb != null) return na - nb;
    return a.localeCompare(b);
  });
  if (!emails.length) return;

  lines.push('');
  lines.push('## API performance by user (endpoint totals)');
  lines.push('');
  lines.push(
    'Totals **sum the same endpoint across multiple baseline scripts** for that user (e.g. dedicated `k6-clients-get-advisor-all-load` + `k6-clients-suite-load` both call GET `/Clients/{advisorId}/all` → calls add up). See **API performance by user and script** above for per-script counts.',
  );
  lines.push('');
  lines.push(
    '**Calls** = HTTP requests recorded during the run. **Slow requests** = calls over the slow threshold (max/avg/slowCount), not a separate request type.',
  );
  lines.push('');
  lines.push(
    '**Resolved path** shows real IDs from the request, not catalog placeholders like `{advisorId}`.',
  );
  lines.push('');
  lines.push(
    '**Active sessions** = k6 VUs active globally when the request ran (`exec.instance.vusActive`). With concurrent baseline (`VUS=1` per script) this is usually **1**; it rises when many user jobs overlap.',
  );

  for (const email of emails) {
    const block = apisByUser[email];
    const s = block.summary || {};
    lines.push('');
    lines.push(`### User: ${email}`);
    lines.push('');
    lines.push(
      `- Slices: ${block.sliceCount ?? 'n/a'} | Distinct APIs: ${s.totalApiKeys ?? (block.apis || []).length} | Calls: ${s.totalCalls ?? 'n/a'} | Over ${th} ms: ${s.apisExceedingThresholdMs ?? (block.slowApis || []).length}`,
    );

    const slow = block.slowApis || [];
    if (slow.length) {
      lines.push('');
      lines.push(`#### APIs over ${th} ms`);
      lines.push('');
      lines.push(
        '| Module | Method | Resolved path | Scripts (calls each) | Min (ms) | Max (ms) | Avg (ms) | P95 (ms) | Active sessions | Total calls | Failures |',
      );
      lines.push(
        '|--------|--------|---------------|----------------------|----------|----------|----------|----------|-----------------|------------|----------:|',
      );
      for (const a of slow) {
        lines.push(
          `| ${a.module} | ${a.method} | ${mdCell(displayEndpointCell(a))} | ${mdCell(formatContributingScripts(a))} | ${fmt(a.minMs)} | ${fmt(a.maxMs)} | ${fmt(a.avgMs)} | ${fmt(a.p95Ms)} | ${formatActiveSessionsCell(a)} | ${a.totalCalls} | ${a.failures} |`,
        );
      }
    }

    const fast = block.fastApis || [];
    if (fast.length) {
      lines.push('');
      lines.push(`#### APIs at or under ${th} ms`);
      lines.push('');
      lines.push(
        '| Module | Method | Resolved path | Min (ms) | Max (ms) | Avg (ms) | P95 (ms) | Active sessions | Calls | Failures |',
      );
      lines.push(
        '|--------|--------|---------------|----------|----------|----------|----------|-----------------|------:|----------:|',
      );
      for (const a of fast) {
        lines.push(
          `| ${a.module} | ${a.method} | ${mdCell(displayEndpointCell(a))} | ${fmt(a.minMs)} | ${fmt(a.maxMs)} | ${fmt(a.avgMs)} | ${fmt(a.p95Ms)} | ${formatActiveSessionsCell(a)} | ${a.totalCalls} | ${a.failures} |`,
        );
      }
    }

    const allApis = [...(block.apis || [])].sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0));
    if (allApis.length) {
      lines.push('');
      lines.push('#### All APIs (by max latency)');
      lines.push('');
      lines.push(
        '| Module | Method | Resolved path | Scripts (calls each) | Min | Max | Avg | P90 | P95 | Active sessions | Total calls | Failures |',
      );
      lines.push(
        '|--------|--------|---------------|----------------------|----:|----:|----:|----:|----:|-----------------|------------|----------:|',
      );
      for (const a of allApis) {
        const scriptsCol =
          (a.scriptRunCount || 0) > 1
            ? mdCell(formatContributingScripts(a))
            : mdCell((a.contributingScripts || [])[0]?.sliceId || '—');
        lines.push(
          `| ${a.module} | ${a.method} | ${mdCell(displayEndpointCell(a))} | ${scriptsCol} | ${fmt(a.minMs)} | ${fmt(a.maxMs)} | ${fmt(a.avgMs)} | ${fmt(a.p90Ms)} | ${fmt(a.p95Ms)} | ${formatActiveSessionsCell(a)} | ${a.totalCalls} | ${a.failures} |`,
        );
      }
    }
  }
}

/**
 * @param {object} report
 * @returns {string}
 */
export function formatConsolidatedMarkdown(report) {
  const lines = [];
  const th = report.thresholdMs;
  lines.push('# Consolidated API performance report');
  lines.push('');
  lines.push(`- **Run ID:** ${report.runId}`);
  lines.push(`- **Generated:** ${report.generatedAt}`);
  lines.push(`- **Slow threshold:** ${th} ms`);
  lines.push(`- **Modules:** ${(report.modulesIncluded || []).join(', ')}`);
  lines.push('');
  const s = report.summary;
  lines.push('## Overall summary');
  lines.push('');
  lines.push(
    '**How to read this report:** Each concurrent user runs ~57 baseline scripts (≈30s each, `VUS=1`). **Endpoint totals** add calls for the same URL across scripts; use **API performance by user and script** for per-script counts. **Scripts (calls each)** shows which scripts contributed (e.g. `get-advisor-all (31) + suite (20)`).',
  );
  lines.push('');
  lines.push(`- Total distinct APIs: ${s.totalApiKeys}`);
  lines.push(`- Total HTTP samples: ${s.totalSamples}`);
  lines.push(`- Total calls (aggregated): ${s.totalCalls}`);
  lines.push(`- Total failures: ${s.totalFailures}`);
  lines.push(`- Total successful: ${s.totalSuccessful}`);
  lines.push(`- APIs over ${th} ms (max, avg, or any request): ${s.apisExceedingThresholdMs}`);
  lines.push(`- APIs at or under ${th} ms: ${s.apisWithinThresholdMs ?? (report.fastApis || []).length}`);
  if ((s.apisNotMeasured || 0) > 0) {
    lines.push(`- APIs not measured (0 calls — login/setup failed or script skipped): ${s.apisNotMeasured}`);
  }
  lines.push(`- Overall average: ${fmt(s.overallAvgMs)} ms`);
  if (s.slowestApi) {
    lines.push(
      `- Slowest API: **${s.slowestApi.method} ${displayEndpointCell(s.slowestApi)}** (${fmt(s.slowestApi.maxMs)} ms max, module \`${s.slowestApi.module}\`)`,
    );
  }
  if (report.globalSlowestRequest && report.globalSlowestRequest.script) {
    const g = report.globalSlowestRequest;
    lines.push(
      `- Slowest request instance: script \`${g.script}\`, user \`${g.userEmail || 'n/a'}\`, VU ${g.vu ?? 'n/a'}, iteration ${g.iteration ?? 'n/a'}, active sessions ${g.activeSessions ?? 'n/a'}`,
    );
  }
  lines.push('');
  lines.push('## Slowest Request Details');
  lines.push('');
  lines.push(
    'For each endpoint, the single request instance with the highest measured latency in this run (when `PERF_CAPTURE_REQUEST_CONTEXT` or `CONSOLIDATED_PERF` is enabled).',
  );
  lines.push('');
  lines.push(
    '| Resolved path | Max ms | Module | Script | User | VU | Iteration | Active Sessions | Scenario | Status | Request Context |',
  );
  lines.push(
    '|---------------|-------:|--------|--------|------|---:|----------:|----------------:|----------|-------:|-----------------|',
  );
  for (const r of report.slowestRequestDetails || []) {
    const ctx = formatRequestContextSummary(r);
    const ts = r.timestamp ? ` @ ${r.timestamp}` : '';
    const flags = [r.throttled ? 'throttled' : null, r.adaptiveAbortNearby ? 'adaptive-abort' : null]
      .filter(Boolean)
      .join(', ');
    const ctxCell = `${ctx}${ts ? ` ${ts}` : ''}${flags ? ` (${flags})` : ''}`.replace(/\|/g, '/');
    const pathCell = displayEndpointCell(r).replace(/\|/g, '/');
    lines.push(
      `| ${r.method} ${pathCell} | ${fmt(r.ms != null ? r.ms : r.maxMs)} | ${r.module} | ${r.script || 'n/a'} | ${r.userEmail || 'n/a'} | ${r.vu ?? 'n/a'} | ${r.iteration ?? 'n/a'} | ${r.activeSessions ?? 'n/a'} | ${r.scenario || 'n/a'} | ${r.status ?? 'n/a'} | ${ctxCell} |`,
    );
  }
  if (!(report.slowestRequestDetails || []).length) {
    lines.push(
      '| — | — | (no per-request context captured — enable CONSOLIDATED_PERF or PERF_CAPTURE_REQUEST_CONTEXT=1) | — | — | — | — | — | — | — | — |',
    );
  }
  if (s.fastestApi) {
    lines.push(
      `- Fastest API (within threshold): **${s.fastestApi.method} ${displayEndpointCell(s.fastestApi)}** (${fmt(s.fastestApi.maxMs)} ms max, module \`${s.fastestApi.module}\`)`,
    );
  }
  appendApisByUserAndScriptMarkdown(lines, report);
  appendApisByUserMarkdown(lines, report, th);
  lines.push('');
  lines.push(`## APIs over ${th} ms (all users combined)`);
  lines.push('');
  lines.push(
    `APIs where **max** or **avg** latency exceeds ${th} ms, or at least one measured request was slower than ${th} ms.`,
  );
  lines.push('');
  lines.push(
    '| Module | Method | Resolved path | Scripts (calls each) | Min (ms) | Max (ms) | Avg (ms) | P95 (ms) | Total calls | Failures |',
  );
  lines.push(
    '|--------|--------|---------------|----------------------|----------|----------|----------|----------|------------|----------:|',
  );
  for (const a of report.slowApis || []) {
    const scriptsCol =
      (a.scriptRunCount || 0) > 1 ? mdCell(formatContributingScripts(a)) : mdCell((a.contributingScripts || [])[0]?.sliceId || '—');
    lines.push(
      `| ${a.module} | ${a.method} | ${mdCell(displayEndpointCell(a))} | ${scriptsCol} | ${fmt(a.minMs)} | ${fmt(a.maxMs)} | ${fmt(a.avgMs)} | ${fmt(a.p95Ms)} | ${a.totalCalls} | ${a.failures} |`,
    );
  }
  if (!(report.slowApis || []).length) {
    lines.push(`| — | — | (none over ${th} ms) | — | — | — | — | — | — | — |`);
  }
  lines.push('');
  lines.push(`## APIs at or under ${th} ms (all users combined)`);
  lines.push('');
  lines.push(
    `APIs where **max** and **avg** are ≤ ${th} ms and no requests exceeded ${th} ms in this run.`,
  );
  lines.push('');
  lines.push('| Module | Method | Resolved path | Max (ms) | Avg (ms) | Min (ms) | P95 (ms) | Calls | Failures |');
  lines.push('|--------|--------|---------------|----------|----------|----------|----------|------:|----------:|');
  for (const a of report.fastApis || []) {
    lines.push(
      `| ${a.module} | ${a.method} | ${mdCell(displayEndpointCell(a))} | ${fmt(a.maxMs)} | ${fmt(a.avgMs)} | ${fmt(a.minMs)} | ${fmt(a.p95Ms)} | ${a.totalCalls} | ${a.failures} |`,
    );
  }
  if (!(report.fastApis || []).length) {
    lines.push(`| — | — | (none at or under ${th} ms in this run) | — | — | — | — | — | — |`);
  }
  lines.push('');
  lines.push('## All APIs (by max latency, all users combined)');
  lines.push('');
  lines.push(
    'Resolved path shows the actual URL path from captured requests (real IDs), not catalog placeholders like `{advisorId}`.',
  );
  lines.push('');
  lines.push('| Module | Method | Resolved path | Avg | Min | Max | P90 | P95 | Calls | Failures | Slow requests |');
  lines.push('|--------|--------|---------------|----:|----:|----:|----:|----:|------:|----------:|--------------:|');
  const allApisByMax = [...(report.apis || [])].sort((a, b) => {
    const maxDiff = (b.maxMs ?? -1) - (a.maxMs ?? -1);
    if (maxDiff !== 0) return maxDiff;
    return compareApisByModuleOrder(a, b);
  });
  for (const a of allApisByMax) {
    lines.push(
      `| ${a.module} | ${a.method} | ${mdCell(displayEndpointCell(a))} | ${fmt(a.avgMs)} | ${fmt(a.minMs)} | ${fmt(a.maxMs)} | ${fmt(a.p90Ms)} | ${fmt(a.p95Ms)} | ${a.totalCalls} | ${a.failures} | ${a.slowCount} |`,
    );
  }
  if (!allApisByMax.length) {
    lines.push('| — | — | (no APIs in this run) | — | — | — | — | — | — | — | — |');
  }
  if ((report.unmeasuredApis || []).length) {
    lines.push('');
    lines.push('## APIs not measured in this run');
    lines.push('');
    lines.push(
      'These endpoints appeared in perf slices but had **0 HTTP calls** (typical when ROPC login failed or the script aborted in setup).',
    );
    lines.push('');
    lines.push('| Module | Method | Endpoint |');
    lines.push('|--------|--------|----------|');
    for (const a of report.unmeasuredApis) {
      lines.push(`| ${a.module} | ${a.method} | ${a.endpoint} |`);
    }
  }
  if (report.catalogCoverage && (report.catalogCoverage.missingFromRun || []).length) {
    lines.push('');
    lines.push('## Catalog APIs not observed in this run');
    lines.push('');
    lines.push(
      `Expected **${report.catalogCoverage.expectedInCatalog}** catalog APIs; **${report.catalogCoverage.observedMatchingCatalog}** matched observed traffic.`,
    );
    lines.push('');
    lines.push('| Module | Method | Endpoint |');
    lines.push('|--------|--------|----------|');
    for (const m of report.catalogCoverage.missingFromRun) {
      lines.push(`| ${m.module} | ${m.method} | ${m.endpoint} |`);
    }
  }

  appendSlowForensicsMarkdown(lines, report);
  lines.push('');
  return lines.join('\n');
}

/**
 * @param {string[]} lines
 * @param {object} report
 */
function appendSlowForensicsMarkdown(lines, report) {
  const slowTh = report.slowCaptureThresholdMs || DEFAULT_SLOW_CAPTURE_MS;
  const slowRows = report.slowRequests || [];
  const byUser = report.slowRequestsByUser || {};
  const userEmails = Object.keys(byUser).sort();

  lines.push('');
  lines.push(`## Slow Requests By User (>${slowTh} ms)`);
  lines.push('');
  lines.push(
    `Captured **${slowRows.length}** request(s) over **${slowTh} ms** across **${userEmails.length}** user(s). Secrets and Authorization headers are never stored.`,
  );
  if (!slowRows.length) {
    lines.push('');
    lines.push(
      '_No slow requests captured. Ensure CONSOLIDATED_PERF=1, PERF_CAPTURE_REQUEST_CONTEXT=1, and spill logs are parsed after each k6 run._',
    );
    return;
  }

  for (const email of userEmails) {
    const block = byUser[email];
    lines.push('');
    lines.push(`### User: ${email}`);
    lines.push('');
    lines.push(
      '| Module | Script | Method | Resolved path | Status | Avg (ms) | Min (ms) | Max (ms) | Calls >' +
        slowTh +
        'ms | Worst Request Payload |',
    );
    lines.push(
      '| ------ | ------ | ------ | --------------- | ------ | -------- | -------- | -------- | ------------ | --------------------- |',
    );
    for (const row of block.endpointRows || []) {
      const payload = (row.latestPayloadPreview || '—').replace(/\|/g, '/');
      lines.push(
        `| ${row.module} | ${row.script || 'n/a'} | ${row.method} | ${mdCell(displayEndpointCell(row))} | ${row.worstRequest?.status ?? 'n/a'} | ${fmt(row.avgMs)} | ${fmt(row.minMs)} | ${fmt(row.maxMs)} | ${row.slowCallCount} | ${payload} |`,
      );
    }
    if (!(block.endpointRows || []).length) {
      lines.push(`| — | — | — | — | — | — | — | — | — | — |`);
    }
  }

  lines.push('');
  lines.push(`## All Slow Requests (>${slowTh} ms)`);
  lines.push('');
  lines.push(
    '| Timestamp | User | Module | Scenario | Method | Resolved path | Status | Duration (ms) | VU | Iteration | Request payload summary | Correlation id |',
  );
  lines.push(
    '|-----------|------|--------|----------|--------|---------------|--------|-------------|---:|----------:|-------------------------|----------------|',
  );
  const sortedSlow = [...slowRows].sort(
    (a, b) => (b.durationMs || b.ms || 0) - (a.durationMs || a.ms || 0),
  );
  const maxDetailRows = 500;
  for (let i = 0; i < Math.min(sortedSlow.length, maxDetailRows); i++) {
    const r = sortedSlow[i];
    const payload = payloadSummaryFromRecord(r).replace(/\|/g, '/');
    lines.push(
      `| ${r.timestamp || 'n/a'} | ${r.userEmail || 'n/a'} | ${r.module} | ${r.scenario || 'n/a'} | ${r.method} | ${mdCell(displayEndpointCell(r))} | ${r.status ?? 'n/a'} | ${fmt(r.durationMs || r.ms)} | ${r.vu ?? 'n/a'} | ${r.iteration ?? 'n/a'} | ${payload} | ${r.correlationId || 'n/a'} |`,
    );
  }
  if (sortedSlow.length > maxDetailRows) {
    lines.push('');
    lines.push(`_… ${sortedSlow.length - maxDetailRows} additional slow request(s) omitted from markdown (see JSON)._`);
  }

  if ((report.topSlowEndpoints || []).length) {
    lines.push('');
    lines.push('## Top slow endpoints (by max latency per user + endpoint)');
    lines.push('');
    lines.push('| User | Module | Method | Resolved path | Max (ms) | Avg (ms) | Slow calls |');
    lines.push('|------|--------|--------|---------------|----------|----------|------------|');
    for (const row of report.topSlowEndpoints.slice(0, 30)) {
      lines.push(
        `| ${row.userEmail} | ${row.module} | ${row.method} | ${mdCell(displayEndpointCell(row))} | ${fmt(row.maxMs)} | ${fmt(row.avgMs)} | ${row.slowCallCount} |`,
      );
    }
  }
}

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return String(Math.round(n * 10) / 10);
}
