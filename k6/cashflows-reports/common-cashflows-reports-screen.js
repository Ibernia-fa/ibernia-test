/**
 * Shared helpers for /cashflows/{cashflowId}/reports (client reports / projections).
 *
 * Backend Reports tag (OpenAPI dev-api):
 * - GET /api/v1/Reports/{cashflowId} optional inflationRate; 200 or 204
 * - POST /api/v1/Reports/{cashflowId} ReportForecastPayloadModel; 200 or 204
 * - POST /api/v1/Reports/{cashflowId}/scenario ReportScenarioPayloadModel; 200 or 204
 *
 * UI also uses GET cashflow and GET financial (other scripts in this folder).
 */
export const REPORTS_HTTP_SUCCESS = [200, 204];

/**
 * Forecast window: staggered start month, horizon 20 to 26 years by vu.
 * @param {number} vu
 * @param {number} iter
 * @param {string} runTag
 */
export function buildReportForecastPayload(vu, iter, runTag) {
  const monthSkew = (vu * 17 + iter * 3 + (runTag ? String(runTag).length : 0)) % 8;
  const start = new Date();
  start.setUTCMonth(start.getUTCMonth() + 1 + monthSkew, 1);
  start.setUTCHours(10, 30, 0, 0);
  const horizonYears = 20 + (vu % 7);
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + horizonYears);
  return {
    forecastStartDate: start.toISOString(),
    forecastEndDate: end.toISOString(),
  };
}

/**
 * Scenario run: same dates as forecast payload plus realistic inflationRate (about 2 to 3.5 percent).
 */
export function buildReportScenarioPayload(vu, iter, runTag) {
  const core = buildReportForecastPayload(vu, iter, runTag);
  const inflationRate = 1.8 + ((vu * 13 + iter * 5) % 25) / 10;
  return Object.assign({}, core, { inflationRate });
}

export {
  API_BASE,
  apiHeaders,
  assertApiBase,
  assertDevIdentityHost,
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  metricCount,
  metricValuesForTrend,
  readAllLifecycleUsersAtInit,
  recordOutcomeWithBuckets,
  SHARED_CASHFLOW_ID,
  seedCashflowForVu,
  sharedCashflowContext,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
} from '../cashflows-income/common-income-screen.js';
