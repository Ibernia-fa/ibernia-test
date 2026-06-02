/**
 * Helpers to wire adaptive monitoring into k6 setup / handleSummary.
 */
import { initAdaptiveMonitor, adaptiveConfigFromEnv } from './adaptive-throttle-monitor.js';
import {
  buildAdaptiveLatencyReport,
  attachAdaptiveReportsToSummary,
  defaultAdaptiveReportPaths,
} from './api-latency-reporter.js';

/**
 * @param {object} [setupData]
 * @param {string} scriptTag
 */
export function adaptiveSetupData(setupData, scriptTag) {
  initAdaptiveMonitor(scriptTag);
  return Object.assign({}, setupData || {}, {
    adaptiveScriptTag: scriptTag,
    adaptiveEnabled: adaptiveConfigFromEnv().enabled,
  });
}

/**
 * @param {Function|null} baseFn
 * @param {{ scriptTag: string, reportSubdir?: string, setupData?: object }} ctx
 */
export function wrapHandleSummaryWithAdaptive(baseFn, ctx) {
  return function handleSummary(data) {
    const out = typeof baseFn === 'function' ? baseFn(data) : {};
    if (!adaptiveConfigFromEnv().enabled) {
      return out;
    }
    const scriptTag = (ctx && ctx.scriptTag) || 'k6';
    const paths = defaultAdaptiveReportPaths(scriptTag, ctx && ctx.reportSubdir);
    const report = buildAdaptiveLatencyReport({
      scriptTag,
      data,
      setupData: (ctx && ctx.setupData) || null,
    });
    return attachAdaptiveReportsToSummary(out, report, paths.json, paths.md);
  };
}
