/**
 * Journey concurrency + throughput instrumentation for k6 volume read tests.
 */
import http from 'k6/http';
import { Gauge, Trend } from 'k6/metrics';

export const journeyHttpInFlight = new Gauge('journey_http_in_flight');
export const journeyActiveVus = new Gauge('journey_active_vus');
export const journeyCallsPerIteration = new Trend('journey_calls_per_iteration');

const ITER_CALLS_KEY = '__k6JourneyIterHttpCalls';

function iterCalls() {
  if (globalThis[ITER_CALLS_KEY] == null) globalThis[ITER_CALLS_KEY] = 0;
  return globalThis[ITER_CALLS_KEY];
}

/** @param {number} [count] */
export function recordJourneyHttpCall(count = 1) {
  globalThis[ITER_CALLS_KEY] = iterCalls() + Math.max(1, Number(count) || 1);
}

export function beginJourneyIteration() {
  globalThis[ITER_CALLS_KEY] = 0;
  journeyActiveVus.add(1);
}

export function endJourneyIteration() {
  journeyCallsPerIteration.add(iterCalls());
  journeyActiveVus.add(-1);
  globalThis[ITER_CALLS_KEY] = 0;
}

function withInFlight(count, fn) {
  const n = Math.max(1, Number(count) || 1);
  journeyHttpInFlight.add(n);
  try {
    return fn();
  } finally {
    journeyHttpInFlight.add(-n);
  }
}

export function journeyHttpGet(url, params) {
  return withInFlight(1, () => {
    recordJourneyHttpCall(1);
    return http.get(url, params);
  });
}

export function journeyHttpPost(url, body, params) {
  return withInFlight(1, () => {
    recordJourneyHttpCall(1);
    return http.post(url, body, params);
  });
}

/** @param {object[]} requests */
export function journeyHttpBatch(requests) {
  const n = requests && requests.length ? requests.length : 0;
  if (n < 1) return [];
  return withInFlight(n, () => {
    recordJourneyHttpCall(n);
    return http.batch(requests);
  });
}

function metricValues(data, name) {
  const m = data && data.metrics && data.metrics[name];
  if (!m || !m.values) return null;
  const v = m.values;
  return {
    avg: v.avg != null ? v.avg : null,
    min: v.min != null ? v.min : null,
    max: v.max != null ? v.max : null,
    count: v.count != null ? v.count : null,
  };
}

/**
 * @param {object} data k6 handleSummary data
 */
export function buildConcurrencyReport(data) {
  const activeVus = metricValues(data, 'journey_active_vus');
  const inFlight = metricValues(data, 'journey_http_in_flight');
  const callsPerIter = metricValues(data, 'journey_calls_per_iteration');
  const vusMax =
    data &&
    data.metrics &&
    data.metrics.vus_max &&
    data.metrics.vus_max.values &&
    data.metrics.vus_max.values.max != null
      ? data.metrics.vus_max.values.max
      : null;
  const httpReqs =
    data &&
    data.metrics &&
    data.metrics.http_reqs &&
    data.metrics.http_reqs.values
      ? data.metrics.http_reqs.values
      : null;
  const durationSec =
    data && data.state && data.state.testRunDurationMs != null
      ? data.state.testRunDurationMs / 1000
      : null;
  const avgReqPerSec =
    httpReqs && httpReqs.rate != null
      ? httpReqs.rate
      : httpReqs && httpReqs.count && durationSec
        ? httpReqs.count / durationSec
        : null;
  const iterations =
    data &&
    data.metrics &&
    data.metrics.iterations &&
    data.metrics.iterations.values
      ? data.metrics.iterations.values
      : null;
  const requestsPerUser =
    httpReqs && httpReqs.count && vusMax ? httpReqs.count / vusMax : null;
  const avgCallsPerUser =
    callsPerIter && callsPerIter.avg != null ? callsPerIter.avg : null;

  return {
    peakActiveUsers: activeVus && activeVus.max != null ? activeVus.max : vusMax,
    avgActiveUsers: activeVus && activeVus.avg != null ? activeVus.avg : null,
    peakInFlightRequests: inFlight && inFlight.max != null ? inFlight.max : null,
    avgInFlightRequests: inFlight && inFlight.avg != null ? inFlight.avg : null,
    avgCallsPerIteration: avgCallsPerUser,
    maxCallsPerIteration: callsPerIter && callsPerIter.max != null ? callsPerIter.max : null,
    avgReqPerSec,
    peakReqPerSec: avgReqPerSec,
    totalHttpRequests: httpReqs && httpReqs.count != null ? httpReqs.count : null,
    totalIterations: iterations && iterations.count != null ? iterations.count : null,
    requestsPerUser,
    vusMax,
    testRunDurationSec: durationSec,
  };
}
