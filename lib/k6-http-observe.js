/**
 * Thin helper to instrument HTTP responses for adaptive monitoring, consolidated API perf,
 * and volume SLO sampling (opt-in via VOLUME_SLO=1).
 *
 * Write profile (Phase A): endpoint + phase step budgets via fullPlatformSloMeta / sloProfile: write.
 * Read profile (Phase B): endpoint + journey step budgets via journeyReadSloMeta / sloProfile: read.
 * Emits slo_endpoint_violation_* and slo_step_violation_* when VOLUME_SLO=1.
 */
import { recordAdaptiveHttp } from './adaptive-throttle-monitor.js';
import { recordApiPerformance } from './api-performance-collector.js';
import { recordVolumeSloHttp } from './volume-slo.js';

/**
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {object} [meta]
 * @param {string} [meta.endpoint]
 * @param {string} [meta.method]
 * @param {string} [meta.tagName] k6 request tag `name`
 * @param {string} [meta.module] MODULE_NAME override
 * @param {string} [meta.scriptTag]
 */
export function observeHttp(res, meta = {}) {
  const m = Object.assign({}, meta);
  if (m.tagName && !m.endpoint) m.endpoint = m.tagName;
  recordAdaptiveHttp(res, m);
  recordApiPerformance(res, m);
  recordVolumeSloHttp(res, m);
}
