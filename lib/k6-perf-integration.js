/**
 * Wire consolidated API perf slices into k6 handleSummary output.
 */
import { perfConfigFromEnv, enrichSliceFromK6Metrics } from './api-performance-collector.js';
import { CONSOLIDATED_SLICES_REL } from './consolidated-perf-paths.js';
import { wrapHandleSummaryWithAdaptive } from './k6-adaptive-integration.js';

/**
 * @param {string} [moduleName]
 * @param {string} [sliceId] unique slice file id (defaults to PERF_SLICE_ID env or module name)
 * @returns {string|null}
 */
export function perfSliceRelativePath(moduleName, sliceId) {
  const cfg = perfConfigFromEnv();
  if (!cfg.enabled) return null;
  const id =
    (sliceId || (__ENV.PERF_SLICE_ID || '').trim() || moduleName || cfg.moduleName || 'unknown').trim() ||
    'unknown';
  const outDir = (__ENV.PERF_SLICE_OUT_DIR || '').trim().replace(/\\/g, '/').replace(/\/$/, '');
  const base = outDir || CONSOLIDATED_SLICES_REL;
  return `${base}/${id}.json`;
}

/**
 * @param {object} out existing handleSummary map
 * @param {object} data k6 summary data
 * @param {string} [moduleName]
 * @param {object} [extraApis] optional apis to merge into slice when in-memory samples are sparse
 * @param {string} [sliceId] unique slice filename id (one per k6 script run)
 */
export function attachPerfSliceToSummary(out, data, moduleName, extraApis, sliceId) {
  const cfg = perfConfigFromEnv();
  if (!cfg.enabled) return out || {};

  const mod = (moduleName || cfg.moduleName || 'unknown').trim() || 'unknown';
  const slice = enrichSliceFromK6Metrics(data, mod);
  const sid = (sliceId || (__ENV.PERF_SLICE_ID || '').trim() || mod).trim() || mod;
  slice.module = mod;
  slice.sliceId = sid;
  slice.script = slice.script || (__ENV.PERF_SCRIPT_FILE || '').trim() || `${sid}.js`;
  slice.runId = cfg.runId || slice.runId || 'unknown';
  slice.captureRequestContext = cfg.captureRequestContext;
  const userLabel = (__ENV.PERF_USER_LABEL || '').trim();
  if (userLabel) slice.userEmail = userLabel;
  const perfEnv = (__ENV.PERF_ENVIRONMENT || '').trim();
  if (perfEnv) slice.environment = perfEnv;

  if (extraApis && extraApis.length) {
    for (const api of extraApis) {
      const exists = slice.apis.some(
        (a) =>
          a.module === api.module &&
          a.endpoint === api.endpoint &&
          a.method === api.method,
      );
      if (!exists) slice.apis.push(api);
    }
  }

  const rel = perfSliceRelativePath(mod, slice.sliceId);
  if (!rel) return out || {};

  return Object.assign({}, out || {}, {
    [rel]: JSON.stringify(slice, null, 2),
  });
}

/**
 * Chains base handleSummary → adaptive reports (if enabled) → consolidated perf slice.
 * @param {Function|null} baseFn
 * @param {{ scriptTag?: string, moduleName?: string, reportSubdir?: string, setupData?: object }} ctx
 */
export function wrapHandleSummaryWithConsolidatedPerf(baseFn, ctx) {
  const adaptiveWrapped = wrapHandleSummaryWithAdaptive(baseFn, {
    scriptTag: (ctx && ctx.scriptTag) || (ctx && ctx.moduleName) || 'k6',
    reportSubdir: ctx && ctx.reportSubdir,
    setupData: ctx && ctx.setupData,
  });

  return function handleSummary(data) {
    const out = adaptiveWrapped(data);
    const sliceId =
      (ctx && ctx.sliceId) || (__ENV.PERF_SLICE_ID || '').trim() || (ctx && ctx.moduleName);
    return attachPerfSliceToSummary(out, data, ctx && ctx.moduleName, null, sliceId);
  };
}
