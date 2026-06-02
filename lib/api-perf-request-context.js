/**
 * Build sanitized request context for consolidated perf forensics (k6 runtime).
 * Never log secrets, tokens, or passwords.
 */
import exec from 'k6/execution';

const SENSITIVE_KEY = /^(authorization|password|secret|token|client_secret|access_token|id_token|refresh_token|api[_-]?key)$/i;
const SENSITIVE_JSON_KEY = /"(password|secret|token|client_secret|access_token|id_token|refresh_token)"/i;

/**
 * @param {object} cfg
 * @returns {boolean}
 */
export function captureContextEnabled(cfg) {
  if (!cfg || !cfg.enabled) return false;
  if (cfg.captureRequestContext) return true;
  const raw = (__ENV.PERF_CAPTURE_REQUEST_CONTEXT || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

/**
 * @param {object} [cfg]
 */
export function requestContextLimits(cfg) {
  const c = cfg || {};
  return {
    payloadBytes: Math.max(
      64,
      parseInt((__ENV.PERF_CAPTURE_PAYLOAD_BYTES || '512').trim(), 10) || 512,
    ),
    maxSlowSamples: Math.max(
      1,
      parseInt((__ENV.PERF_CAPTURE_MAX_SLOW_SAMPLES || '100').trim(), 10) || 100,
    ),
  };
}

/**
 * @param {string} scriptId PERF_SLICE_ID or script basename
 */
export function scriptFileFromEnv(scriptId) {
  const file = (__ENV.PERF_SCRIPT_FILE || '').trim();
  if (file) return file;
  const id = (scriptId || (__ENV.PERF_SLICE_ID || '').trim()).trim();
  return id ? `${id}.js` : 'unknown';
}

/**
 * Register per-VU session facts (optional; call from seed/setup).
 * @param {number} [vu]
 * @param {object} data
 */
export function registerPerfVuSession(vu, data) {
  const id = vu != null ? vu : typeof __VU !== 'undefined' ? __VU : 0;
  if (!globalThis.__k6PerfVuSession) globalThis.__k6PerfVuSession = {};
  globalThis.__k6PerfVuSession[id] = Object.assign({}, globalThis.__k6PerfVuSession[id] || {}, data || {});
}

/**
 * @returns {object}
 */
export function getK6ExecutionContext() {
  let vu = null;
  let iteration = null;
  let scenario = null;
  let activeSessions = null;

  try {
    if (typeof __VU !== 'undefined') vu = Number(__VU);
    if (typeof __ITER !== 'undefined') iteration = Number(__ITER);
  } catch {
    /* k6 init */
  }

  try {
    if (exec && exec.scenario && exec.scenario.name) scenario = String(exec.scenario.name);
    if (exec && exec.vu) {
      if (vu == null && exec.vu.idInTest != null) vu = Number(exec.vu.idInTest);
      if (iteration == null && exec.vu.iterationInScenario != null) {
        iteration = Number(exec.vu.iterationInScenario);
      }
    }
    if (exec && exec.instance && exec.instance.vusActive != null) {
      activeSessions = Number(exec.instance.vusActive);
    }
  } catch {
    /* outside VU or older k6 */
  }

  if (activeSessions == null) {
    const v = parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || __ENV.SUITE_VUS || '1').trim(), 10);
    if (Number.isFinite(v) && v > 0) activeSessions = v;
  }

  return { vu, iteration, scenario, activeSessions };
}

/**
 * Probe common script globals for email / ids for current VU.
 * @param {number|null} vu
 */
export function resolveVuSessionHints(vu) {
  const id = vu != null ? vu : typeof __VU !== 'undefined' ? __VU : null;
  const out = {};
  if (id == null) return out;

  if (globalThis.__k6PerfVuSession && globalThis.__k6PerfVuSession[id]) {
    Object.assign(out, globalThis.__k6PerfVuSession[id]);
  }

  for (const key of Object.keys(globalThis)) {
    if (!key.includes('ByVu') && !key.includes('ByVU')) continue;
    const bag = globalThis[key];
    if (!bag || typeof bag !== 'object') continue;
    const row = bag[id] || bag[String(id)];
    if (!row || typeof row !== 'object') continue;
    if (row.email && !out.userEmail) out.userEmail = String(row.email);
    if (row.cashflowId && !out.cashflowId) out.cashflowId = String(row.cashflowId);
    if (row.clientId && !out.clientId) out.clientId = String(row.clientId);
    if (row.advisorId && !out.advisorId) out.advisorId = String(row.advisorId);
  }

  return out;
}

/**
 * @param {string} url
 */
export function parseUrlParts(url) {
  const out = { path: {}, query: {}, actualUrl: url ? String(url) : '' };
  if (!url) return out;
  try {
    const u = String(url);
    const qIdx = u.indexOf('?');
    const pathPart = qIdx >= 0 ? u.slice(0, qIdx) : u;
    const queryPart = qIdx >= 0 ? u.slice(qIdx + 1) : '';
    out.actualUrl = u.length > 500 ? u.slice(0, 500) + '…' : u;

    const pathOnly = pathPart.replace(/^https?:\/\/[^/]+/i, '');
    const segments = pathOnly.split('/').filter(Boolean);
    const uuidRe = /^[0-9a-f]{8,32}$/i;
    const numericId = /^\d+$/;
    let si = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const next = segments[i + 1];
      if (next && (uuidRe.test(next) || numericId.test(next))) {
        out.path[seg] = next;
        i += 1;
      } else if (uuidRe.test(seg) || numericId.test(seg)) {
        out.path[`segment${si}`] = seg;
        si += 1;
      }
    }

    if (queryPart) {
      for (const pair of queryPart.split('&')) {
        const eq = pair.indexOf('=');
        if (eq < 0) out.query[pair] = '';
        else out.query[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * @param {object} headers
 */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = String(v).length > 120 ? String(v).slice(0, 120) + '…' : String(v);
    }
  }
  return out;
}

/**
 * @param {string} body
 * @param {number} maxBytes
 */
export function truncatePayloadPreview(body, maxBytes) {
  if (body == null) return null;
  let s = typeof body === 'string' ? body : '';
  if (!s && typeof body === 'object') {
    try {
      s = JSON.stringify(body);
    } catch {
      s = String(body);
    }
  }
  if (!s) return null;
  if (SENSITIVE_JSON_KEY.test(s)) {
    s = s.replace(
      /"(password|secret|token|client_secret|access_token|id_token|refresh_token)"\s*:\s*"[^"]*"/gi,
      '"$1":"[redacted]"',
    );
  }
  if (s.length > maxBytes) return s.slice(0, maxBytes) + '…';
  return s;
}

/**
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {object} meta
 * @param {object} cfg perfConfigFromEnv()
 */
export function buildRequestObservation(res, meta, cfg) {
  const limits = requestContextLimits(cfg);
  const execCtx = getK6ExecutionContext();
  const vu = meta.vu != null ? meta.vu : execCtx.vu;
  const hints = Object.assign({}, resolveVuSessionHints(vu), meta.session || {});

  const url = (res && res.url) || meta.url || '';
  const urlParts = parseUrlParts(url);
  const method = String(meta.method || (res && res.request && res.request.method) || 'HTTP').toUpperCase();

  let correlationId = meta.correlationId || null;
  const reqHeaders =
    (res && res.request && res.request.headers) || meta.requestHeaders || meta.headers || {};
  const hdrs = sanitizeHeaders(reqHeaders);
  if (!correlationId) {
    correlationId =
      hdrs['X-Correlation-Id'] ||
      hdrs['x-correlation-id'] ||
      hdrs['X-Correlation-ID'] ||
      null;
  }

  const reqBody =
    meta.requestBody != null
      ? meta.requestBody
      : res && res.request && res.request.body != null
        ? res.request.body
        : null;

  const responseSize =
    res && res.body != null
      ? typeof res.body === 'string'
        ? res.body.length
        : Array.isArray(res.body)
          ? res.body.length
          : null
      : null;

  return {
    script: meta.script || scriptFileFromEnv(meta.sliceId),
    scenario: meta.scenario || execCtx.scenario || meta.tagName || null,
    userEmail: meta.userEmail || hints.userEmail || hints.email || null,
    advisorId: meta.advisorId || hints.advisorId || null,
    clientId: meta.clientId || hints.clientId || null,
    cashflowId: meta.cashflowId || hints.cashflowId || null,
    vu: vu != null ? vu : null,
    iteration: meta.iteration != null ? meta.iteration : execCtx.iteration,
    activeSessions:
      meta.activeSessions != null ? meta.activeSessions : execCtx.activeSessions,
    timestamp: new Date().toISOString(),
    actualUrl: urlParts.actualUrl || null,
    status: res && res.status != null ? Number(res.status) : 0,
    responseSize,
    correlationId: correlationId ? String(correlationId) : null,
    throttled: !!meta.throttled,
    adaptiveAbortNearby: !!meta.adaptiveAbortNearby,
    requestContext: {
      path: Object.assign({}, urlParts.path, meta.path || {}),
      query: Object.assign({}, urlParts.query, meta.query || {}),
      payloadPreview: truncatePayloadPreview(reqBody, limits.payloadBytes),
    },
  };
}
