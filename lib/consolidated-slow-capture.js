/**
 * Slow request capture (> PERF_SLOW_CAPTURE_THRESHOLD_MS) for consolidated forensics.
 * k6 emits __K6_PERF_SLOW__ log lines; Node parses and aggregates for merge.
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveEndpointDisplay } from './api-endpoint-display.js';

export const PERF_SLOW_LOG_MARKER = '__K6_PERF_SLOW__';
export const PERF_WORST_LOG_MARKER = '__K6_PERF_WORST__';
export const DEFAULT_SLOW_CAPTURE_MS = 300;

/**
 * Read k6 log text (PowerShell Tee-Object often writes UTF-16 LE).
 * @param {string} logPath
 * @returns {string}
 */
export function readK6LogText(logPath) {
  const buf = fs.readFileSync(logPath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le');
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.toString('utf8').slice(1);
  }
  return buf.toString('utf8');
}

function userEndpointKey(userEmail, module, method, endpoint) {
  return `${userEmail || 'unknown'}\0${module}\0${method}\0${endpoint}`;
}

/**
 * @param {string} line
 * @param {string} marker
 * @returns {object|null}
 */
function unescapeK6LogJsonFragment(fragment) {
  return String(fragment || '')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\r?\n/g, '');
}

/**
 * PowerShell Tee-Object wraps and escapes JSON inside k6 msg=; full JSON.parse often fails.
 * @param {string} tail text after marker
 * @returns {object|null}
 */
function parseK6ConsolePerfPayload(tail) {
  const joined = String(tail || '').replace(/\r?\n/g, '');
  const open = joined.indexOf('{');
  const src = joined.indexOf('source=console', open >= 0 ? open : 0);
  if (open < 0) return null;

  if (src > open) {
    let raw = joined.slice(open, src).replace(/[\s"\\]+$/g, '');
    try {
      return JSON.parse(unescapeK6LogJsonFragment(raw));
    } catch {
      /* fall through to field extraction */
    }
  }

  const pickStr = (key) => {
    const m = joined.match(new RegExp(`\\\\?"${key}\\\\?":\\\\?"([^"]+)"`));
    return m ? m[1].replace(/\\"/g, '"') : null;
  };
  const pickNum = (key) => {
    const m = joined.match(new RegExp(`\\\\?"${key}\\\\?":([\\d.]+)`));
    return m ? Number(m[1]) : null;
  };
  const ms = pickNum('ms');
  if (ms == null) return null;

  const path = {};
  const pathM = joined.match(/\\?"path\\?":\\?\{([^}]+)\}/);
  if (pathM) {
    const inner = pathM[1].replace(/\\"/g, '"');
    for (const pm of inner.matchAll(/"?([a-zA-Z0-9_]+)"?\s*:\s*"?([^",}]+)"?/g)) {
      path[pm[1]] = pm[2];
    }
  }

  return {
    ms,
    durationMs: pickNum('durationMs') ?? ms,
    module: pickStr('module'),
    method: pickStr('method'),
    endpoint: pickStr('endpoint'),
    script: pickStr('script'),
    scenario: pickStr('scenario'),
    userEmail: pickStr('userEmail'),
    vu: pickNum('vu'),
    iteration: pickNum('iteration'),
    activeSessions: pickNum('activeSessions'),
    status: pickNum('status'),
    cashflowId: pickStr('cashflowId'),
    clientId: pickStr('clientId'),
    advisorId: pickStr('advisorId'),
    actualUrl: pickStr('actualUrl'),
    correlationId: pickStr('correlationId'),
    timestamp: pickStr('timestamp'),
    sliceId: pickStr('sliceId'),
    throttled: joined.includes('"throttled":true'),
    adaptiveAbortNearby: joined.includes('"adaptiveAbortNearby":true'),
    requestContext: Object.keys(path).length ? { path, query: {} } : null,
  };
}

export function parseJsonLineMarker(line, marker) {
  const idx = line.indexOf(marker);
  if (idx < 0) return null;
  const tail = line.slice(idx + marker.length);
  const parsed = parseK6ConsolePerfPayload(tail);
  if (parsed) return parsed;
  const open = tail.indexOf('{');
  const close = tail.lastIndexOf('}');
  if (open < 0 || close <= open) return null;
  try {
    return JSON.parse(tail.slice(open, close + 1));
  } catch {
    return null;
  }
}

/**
 * Extract JSON object(s) after marker; supports multiline (PowerShell Tee-Object wraps long lines).
 * @param {string} text
 * @param {string} marker
 * @returns {object[]}
 */
export function extractJsonRecordsAfterMarker(text, marker) {
  const out = [];
  if (!text || !marker) return out;
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const idx = text.indexOf(marker, searchFrom);
    if (idx < 0) break;
    const tail = text.slice(idx + marker.length);
    const nextMarker = text.indexOf(marker, idx + marker.length);
    const chunkEnd = nextMarker > idx ? nextMarker : text.length;
    const chunk = text.slice(idx + marker.length, chunkEnd);

    const loose = parseK6ConsolePerfPayload(chunk);
    if (loose && loose.ms != null) {
      out.push(loose);
      searchFrom = chunkEnd;
      continue;
    }

    const open = tail.indexOf('{');
    if (open < 0) {
      searchFrom = idx + marker.length;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let i = open; i < tail.length; i++) {
      const ch = tail[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end >= open) {
      try {
        out.push(JSON.parse(unescapeK6LogJsonFragment(tail.slice(open, end + 1))));
      } catch {
        /* skip malformed */
      }
    }
    searchFrom = chunkEnd;
  }
  return out;
}

/**
 * @param {string} text
 * @returns {object[]}
 */
export function parsePerfSlowLines(text) {
  const out = [];
  if (!text) return out;
  const records = extractJsonRecordsAfterMarker(text, PERF_SLOW_LOG_MARKER);
  for (const obj of records) {
    if (!obj) continue;
    if (obj.durationMs == null && obj.ms != null) obj.durationMs = obj.ms;
    if (obj.durationMs == null && obj.ms == null) continue;
    if (obj.ms == null) obj.ms = obj.durationMs;
    out.push(normalizeSlowRecord(obj));
  }
  if (out.length) return out;
  // Fallback: single-line logs (no wrapping)
  for (const line of text.split(/\r?\n/)) {
    const obj = parseJsonLineMarker(line, PERF_SLOW_LOG_MARKER);
    if (!obj || obj.durationMs == null) {
      if (obj && obj.ms != null) obj.durationMs = obj.ms;
      else continue;
    }
    if (obj.ms == null) obj.ms = obj.durationMs;
    out.push(normalizeSlowRecord(obj));
  }
  return out;
}

/**
 * @param {object} raw
 */
export function normalizeSlowRecord(raw) {
  const durationMs = Number(raw.durationMs != null ? raw.durationMs : raw.ms);
  return {
    timestamp: raw.timestamp || new Date().toISOString(),
    userEmail: raw.userEmail || raw.user || null,
    module: raw.module || 'unknown',
    script: raw.script || null,
    scenario: raw.scenario || null,
    method: String(raw.method || 'HTTP').toUpperCase(),
    endpoint: raw.endpoint || 'unknown',
    actualUrl: raw.actualUrl || null,
    status: raw.status != null ? Number(raw.status) : null,
    durationMs,
    ms: durationMs,
    vu: raw.vu != null ? raw.vu : null,
    iteration: raw.iteration != null ? raw.iteration : null,
    activeSessions: raw.activeSessions != null ? raw.activeSessions : null,
    correlationId: raw.correlationId || null,
    cashflowId: raw.cashflowId || null,
    clientId: raw.clientId || null,
    advisorId: raw.advisorId || null,
    requestContext: raw.requestContext || null,
    throttled: !!raw.throttled,
    adaptiveAbortNearby: !!raw.adaptiveAbortNearby,
    sliceId: raw.sliceId || null,
  };
}

/**
 * @param {object} record
 */
export function payloadSummaryFromRecord(record) {
  if (!record || !record.requestContext) return '—';
  const rc = record.requestContext;
  const parts = [];
  const p = rc.path || {};
  const q = rc.query || {};
  const pk = Object.keys(p);
  if (pk.length) parts.push(`path: ${pk.map((k) => `${k}=${p[k]}`).join(', ')}`);
  const qk = Object.keys(q);
  if (qk.length) parts.push(`query: ${qk.map((k) => `${k}=${q[k]}`).join(', ')}`);
  if (record.cashflowId) parts.push(`cashflowId=${record.cashflowId}`);
  if (rc.payloadPreview) {
    const prev = String(rc.payloadPreview).replace(/\|/g, '/').replace(/\n/g, ' ');
    parts.push(`body: ${prev.length > 120 ? prev.slice(0, 120) + '…' : prev}`);
  }
  return parts.length ? parts.join('; ') : '—';
}

/**
 * @param {object[]} slowRequests
 * @param {number} [slowThresholdMs]
 */
export function aggregateSlowRequests(slowRequests, slowThresholdMs = DEFAULT_SLOW_CAPTURE_MS) {
  const sorted = [...(slowRequests || [])]
    .map((r) =>
      Object.assign({}, r, {
        endpointDisplay: resolveEndpointDisplay(r.endpoint, r),
      }),
    )
    .sort((a, b) => (b.durationMs || b.ms || 0) - (a.durationMs || a.ms || 0));

  const byUser = {};
  const endpointStatsMap = {};

  for (const r of sorted) {
    const user = r.userEmail || 'unknown';
    if (!byUser[user]) {
      byUser[user] = { userEmail: user, slowRequests: [], endpointRows: [] };
    }
    byUser[user].slowRequests.push(r);

    const ek = userEndpointKey(user, r.module, r.method, r.endpoint);
    if (!endpointStatsMap[ek]) {
      endpointStatsMap[ek] = {
        userEmail: user,
        module: r.module,
        method: r.method,
        endpoint: r.endpoint,
        script: r.script,
        minMs: r.durationMs,
        maxMs: r.durationMs,
        durationSum: 0,
        slowCallCount: 0,
        latestPayloadPreview: payloadSummaryFromRecord(r),
        worstRequest: r,
      };
    }
    const row = endpointStatsMap[ek];
    const ms = r.durationMs;
    row.slowCallCount += 1;
    row.durationSum += ms;
    row.minMs = Math.min(row.minMs, ms);
    row.maxMs = Math.max(row.maxMs, ms);
    if (ms >= (row.worstRequest?.durationMs || 0)) {
      row.worstRequest = r;
      row.latestPayloadPreview = payloadSummaryFromRecord(r);
    }
    if (!row.script && r.script) row.script = r.script;
  }

  const perUserEndpointStats = Object.values(endpointStatsMap).map((row) => ({
    userEmail: row.userEmail,
    module: row.module,
    script: row.script,
    method: row.method,
    endpoint: row.endpoint,
    endpointDisplay: resolveEndpointDisplay(row.endpoint, row.worstRequest),
    minMs: row.minMs,
    maxMs: row.maxMs,
    avgMs: row.slowCallCount ? row.durationSum / row.slowCallCount : null,
    slowCallCount: row.slowCallCount,
    latestPayloadPreview: row.latestPayloadPreview,
    worstRequest: row.worstRequest,
  }));

  for (const u of Object.keys(byUser)) {
    const keys = new Set(
      perUserEndpointStats.filter((s) => s.userEmail === u).map((s) => `${s.module}\0${s.method}\0${s.endpoint}`),
    );
    byUser[u].endpointRows = perUserEndpointStats
      .filter((s) => s.userEmail === u)
      .sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0));
    byUser[u].slowCallCount = byUser[u].slowRequests.length;
    byUser[u].distinctEndpoints = keys.size;
  }

  const topSlowEndpoints = [...perUserEndpointStats]
    .sort((a, b) => (b.maxMs || 0) - (a.maxMs || 0))
    .slice(0, 50);

  return {
    slowCaptureThresholdMs: slowThresholdMs,
    slowRequests: sorted,
    slowRequestsByUser: byUser,
    perUserEndpointStats,
    topSlowEndpoints,
    totalSlowRequests: sorted.length,
  };
}

/**
 * @param {string} logPath
 * @param {string} sliceId
 * @param {string} spillDir
 * @returns {object[]}
 */
export function parseSlowRequestsFromLogFile(logPath, sliceId) {
  if (!logPath || !fs.existsSync(logPath)) return [];
  const text = fs.readFileSync(logPath, 'utf8');
  const rows = parsePerfSlowLines(text);
  for (const r of rows) {
    if (!r.sliceId) r.sliceId = sliceId;
  }
  return rows;
}

/**
 * @param {string} spillDir
 * @returns {object[]}
 */
/**
 * Collect slowRequests[] embedded in per-script perf slices (preferred over log spill).
 * @param {object[]} slices
 * @returns {object[]}
 */
export function loadSlowRequestsFromSlices(slices) {
  const all = [];
  for (const slice of slices || []) {
    const rows = slice.slowRequests || [];
    for (const r of rows) {
      all.push(normalizeSlowRecord(r));
    }
  }
  return all;
}

export function loadAllSlowRequestSpills(spillDir) {
  const all = [];
  if (!spillDir || !fs.existsSync(spillDir)) return all;

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
        continue;
      }
      if (!ent.name.endsWith('.json')) continue;
      if (ent.name.endsWith('.worst.json')) continue;
      let data;
      try {
        data = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {
        continue;
      }
      const rows = data.slowRequests || [];
      for (const r of rows) all.push(normalizeSlowRecord(r));
    }
  }
  walk(spillDir);
  return all;
}

/**
 * Write slow + worst spill files from k6 log.
 * @param {string} logPath
 * @param {string} sliceId
 * @param {string} spillDir
 */
export function writeSpillsFromLogFile(logPath, sliceId, spillDir) {
  if (!logPath || !sliceId || !fs.existsSync(logPath)) return { slowPath: null, worstPath: null };
  fs.mkdirSync(spillDir, { recursive: true });
  const text = readK6LogText(logPath);

  const slowRows = parsePerfSlowLines(text);
  for (const r of slowRows) {
    if (!r.sliceId) r.sliceId = sliceId;
  }
  let slowPath = null;
  if (slowRows.length) {
    slowPath = path.join(spillDir, `${sliceId}-slow.json`);
    fs.writeFileSync(
      slowPath,
      JSON.stringify({ sliceId, slowRequests: slowRows }, null, 2),
      'utf8',
    );
  }

  const byKey = {};
  const worstRecords = extractJsonRecordsAfterMarker(text, PERF_WORST_LOG_MARKER);
  const worstIter =
    worstRecords.length > 0
      ? worstRecords
      : text.split(/\r?\n/).map((line) => parseJsonLineMarker(line, PERF_WORST_LOG_MARKER)).filter(Boolean);
  for (const obj of worstIter) {
    if (!obj || obj.ms == null) continue;
    const k = `${obj.module}\0${obj.method}\0${obj.endpoint}`;
    const prev = byKey[k];
    if (!prev || Number(obj.ms) > Number(prev.ms)) {
      byKey[k] = Object.assign({ maxMs: obj.ms }, obj);
    }
  }
  const worst = Object.values(byKey);
  let worstPath = null;
  if (worst.length) {
    worstPath = path.join(spillDir, `${sliceId}.json`);
    fs.writeFileSync(
      worstPath,
      JSON.stringify({ sliceId, slowestInstances: worst }, null, 2),
      'utf8',
    );
  }
  return { slowPath, worstPath, slowCount: slowRows.length, worstCount: worst.length };
}
