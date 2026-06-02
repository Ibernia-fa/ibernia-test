/**
 * Adaptive degradation detection for k6 (dev load tests).
 *
 * Opt-in via ENABLE_ADAPTIVE_THROTTLE=1 (and STOP_ON_DEGRADATION=1 to abort).
 * Default: disabled — existing suites behave unchanged.
 */
import { Counter, Trend } from 'k6/metrics';
import exec from 'k6/execution';

const DEGRADE_HTTP_STATUSES = new Set([0, 429, 503, 502, 504]);

// k6 requires custom metrics at module init (not inside VU functions).
const trendLatency = new Trend('adaptive_api_latency_ms', true);
const counterTotal = new Counter('adaptive_api_requests', true);
const counterSlow = new Counter('adaptive_api_slow_requests', true);
const counterDegradeStatus = new Counter('adaptive_api_degrade_status', true);

function truthyEnv(name, defaultFalse = true) {
  const raw = (__ENV[name] || '').trim().toLowerCase();
  if (raw === '') return !defaultFalse;
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

/**
 * @returns {{
 *   enabled: boolean,
 *   stopOnDegradation: boolean,
 *   maxAcceptableMs: number,
 *   windowSize: number,
 *   slowPercent: number,
 *   minSamples: number,
 *   consecutiveWindows: number,
 *   checkP95: boolean,
 * }}
 */
export function adaptiveConfigFromEnv() {
  const enabled = truthyEnv('ENABLE_ADAPTIVE_THROTTLE', false);
  return {
    enabled,
    stopOnDegradation: enabled && truthyEnv('STOP_ON_DEGRADATION', true),
    maxAcceptableMs: Math.max(
      50,
      parseInt((__ENV.MAX_ACCEPTABLE_API_MS || '500').trim(), 10) || 500,
    ),
    windowSize: Math.max(10, parseInt((__ENV.THROTTLE_WINDOW_SIZE || '100').trim(), 10) || 100),
    slowPercent: Math.min(
      100,
      Math.max(1, parseFloat((__ENV.THROTTLE_FAILURE_PERCENT || '20').trim()) || 20),
    ),
    minSamples: Math.max(5, parseInt((__ENV.THROTTLE_MIN_SAMPLES || '30').trim(), 10) || 30),
    consecutiveWindows: Math.max(
      1,
      parseInt((__ENV.THROTTLE_CONSECUTIVE_WINDOWS || '2').trim(), 10) || 2,
    ),
    checkP95: truthyEnv('THROTTLE_CHECK_P95', true),
  };
}

function state() {
  if (!globalThis.__k6AdaptiveThrottle) {
    globalThis.__k6AdaptiveThrottle = {
      scriptTag: '',
      startedAt: Date.now(),
      window: [],
      badWindowStreak: 0,
      aborted: false,
      abortReason: null,
      abortAt: null,
      abortVu: null,
      totalRecorded: 0,
    };
  }
  return globalThis.__k6AdaptiveThrottle;
}

/**
 * Call from setup() once per script (optional; auto-inits on first record).
 * @param {string} [scriptTag]
 */
export function initAdaptiveMonitor(scriptTag) {
  const cfg = adaptiveConfigFromEnv();
  if (!cfg.enabled) return;
  const s = state();
  s.scriptTag = scriptTag || s.scriptTag || 'k6';
  s.startedAt = Date.now();
}

function pathFromUrl(url) {
  if (!url) return 'unknown';
  try {
    const u = String(url);
    const m = u.match(/https?:\/\/[^/]+(\/[^?#]*)/i);
    return m ? m[1] : u;
  } catch {
    return 'unknown';
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/**
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {object} meta
 * @param {string} [meta.endpoint] e.g. `/api/v1/Events/custom`
 * @param {string} [meta.method] GET|POST|...
 * @param {string} [meta.tagName] k6 tag `name` (preferred when set on request)
 * @param {string} [meta.scriptTag]
 */
export function recordAdaptiveHttp(res, meta = {}) {
  const cfg = adaptiveConfigFromEnv();
  if (!cfg.enabled) return;

  const s = state();
  if (meta.scriptTag) s.scriptTag = meta.scriptTag;

  const method = (meta.method || (res && res.request && res.request.method) || 'HTTP').toUpperCase();
  const endpoint =
    meta.endpoint ||
    (meta.tagName ? String(meta.tagName) : pathFromUrl(res && res.url ? res.url : ''));
  const status = res && res.status != null ? res.status : 0;
  const ms =
    res && res.timings && res.timings.duration != null ? Number(res.timings.duration) : 0;

  const tags = { endpoint: String(endpoint).slice(0, 120), method };
  trendLatency.add(ms, tags);
  counterTotal.add(1, tags);

  const isSlow = ms > cfg.maxAcceptableMs;
  const isDegradeStatus = DEGRADE_HTTP_STATUSES.has(status) || status >= 500;
  if (isSlow) counterSlow.add(1, tags);
  if (isDegradeStatus) counterDegradeStatus.add(1, tags);

  const sample = { ms, status, endpoint, method, ts: Date.now(), slow: isSlow || isDegradeStatus };
  s.window.push(sample);
  if (s.window.length > cfg.windowSize) {
    s.window.splice(0, s.window.length - cfg.windowSize);
  }
  s.totalRecorded += 1;

  if (!cfg.stopOnDegradation || s.aborted) return;

  const verdict = evaluateWindow(s.window, cfg);
  if (verdict) {
    s.badWindowStreak += 1;
  } else {
    s.badWindowStreak = 0;
  }

  if (s.badWindowStreak >= cfg.consecutiveWindows) {
    s.aborted = true;
    s.abortReason = verdict;
    s.abortAt = Date.now();
    s.abortVu = exec.vu.idInTest;
    const msg =
      `Environment capacity threshold reached (${verdict}). ` +
      `VU=${s.abortVu} endpoint=${endpoint} method=${method} ` +
      `window=${s.window.length} maxMs=${cfg.maxAcceptableMs}`;
    exec.test.abort(`[adaptive-throttle] ${msg}`);
  }
}

/**
 * @param {Array<{ms:number,status:number,slow:boolean}>} samples
 * @param {ReturnType<typeof adaptiveConfigFromEnv>} cfg
 * @returns {string|null} reason if degraded
 */
export function evaluateWindow(samples, cfg) {
  if (samples.length < cfg.minSamples) return null;

  const slowish = samples.filter((x) => x.slow || x.ms > cfg.maxAcceptableMs);
  const pct = (100 * slowish.length) / samples.length;

  if (pct >= cfg.slowPercent) {
    return `${pct.toFixed(1)}% of last ${samples.length} requests exceeded ${cfg.maxAcceptableMs}ms or had degrade status`;
  }

  if (cfg.checkP95) {
    const durations = samples.map((x) => x.ms).sort((a, b) => a - b);
    const p95 = percentile(durations, 95);
    if (p95 > cfg.maxAcceptableMs) {
      return `p95=${Math.round(p95)}ms > ${cfg.maxAcceptableMs}ms over last ${samples.length} requests`;
    }
  }

  return null;
}

/** Snapshot for handleSummary (per-VU slice; k6 aggregates custom metrics globally). */
export function getAdaptiveVuSnapshot() {
  const cfg = adaptiveConfigFromEnv();
  const s = state();
  return {
    enabled: cfg.enabled,
    scriptTag: s.scriptTag,
    aborted: s.aborted,
    abortReason: s.abortReason,
    abortVu: s.abortVu,
    abortAt: s.abortAt,
    vu: exec.vu.idInTest,
    iteration: exec.vu.iterationInScenario,
    windowSize: s.window.length,
    totalRecorded: s.totalRecorded,
    lastVerdict: s.window.length ? evaluateWindow(s.window, cfg) : null,
  };
}
