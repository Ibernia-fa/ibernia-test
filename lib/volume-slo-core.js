/**
 * Pure volume SLO logic — no k6 imports. Unit-testable from Node (`tools/volume-slo.test.mjs`).
 */

/** @typedef {'read'|'write'} VolumeSloProfileName */

/**
 * @typedef {object} VolumeSloProfile
 * @property {string} [description]
 * @property {number} defaultBudgetMs
 * @property {Record<string, number>} [endpointBudgetMs]
 * @property {Record<string, number>} [endpointMaxMs]
 * @property {Record<string, number>} [stepBudgetMs]
 */

/**
 * @typedef {object} VolumeSloConfig
 * @property {number} version
 * @property {VolumeSloProfileName} defaultProfile
 * @property {number} fallbackBudgetMs
 * @property {number} [hardMaxMultiplier]
 * @property {{ maxEndpointP95ViolationRate?: number, maxStepP95ViolationRate?: number, maxSingleRequestOverMaxMsRate?: number }} [gates]
 * @property {Record<VolumeSloProfileName, VolumeSloProfile>} profiles
 */

/**
 * @typedef {object} VolumeSloSampleStore
 * @property {Record<string, VolumeSloEndpointBucket>} endpoints
 * @property {Record<string, VolumeSloStepBucket>} steps
 * @property {Record<string, true>} profilesUsed
 */

/**
 * @typedef {object} VolumeSloEndpointBucket
 * @property {string} method
 * @property {string} endpoint
 * @property {VolumeSloProfileName} profile
 * @property {number} budgetMs
 * @property {number} hardMaxMs
 * @property {number[]} durations
 * @property {number} violations
 * @property {number} hardViolations
 */

/**
 * @typedef {object} VolumeSloStepBucket
 * @property {string} step
 * @property {VolumeSloProfileName} profile
 * @property {number} budgetMs
 * @property {number[]} durations
 * @property {number} violations
 */

export const DEFAULT_CONFIG_PATH = 'config/volume-api-slo.json';
export const DEFAULT_SCENARIOS_PATH = 'config/volume-scenarios.json';

/** k6 entry scripts live under k6/ — try repo-root config when open() is script-relative. */
export const CONFIG_OPEN_FALLBACKS = Object.freeze([
  '../config/volume-api-slo.json',
  '../../config/volume-api-slo.json',
  'config/volume-api-slo.json',
  '../../../config/volume-api-slo.json',
]);

export const SCENARIOS_OPEN_FALLBACKS = Object.freeze([
  '../config/volume-scenarios.json',
  '../../config/volume-scenarios.json',
  'config/volume-scenarios.json',
  '../../../config/volume-scenarios.json',
]);

export const READ_HTTP_METHODS = Object.freeze(['GET', 'HEAD', 'OPTIONS']);

function parseGates(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      maxEndpointP95ViolationRate: 0.05,
      maxStepP95ViolationRate: 0.05,
      maxSingleRequestOverMaxMsRate: 0.01,
    };
  }
  /** @type {Record<string, unknown>} */
  const g = raw;
  return {
    maxEndpointP95ViolationRate: positiveRate(g.maxEndpointP95ViolationRate, 0.05),
    maxStepP95ViolationRate: positiveRate(g.maxStepP95ViolationRate, 0.05),
    maxSingleRequestOverMaxMsRate: positiveRate(g.maxSingleRequestOverMaxMsRate, 0.01),
  };
}

/**
 * @param {unknown} value
 * @param {number} fallback
 */
function positiveRate(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

/**
 * @param {unknown} raw
 * @returns {VolumeSloConfig}
 */
export function parseVolumeSloConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[volume-slo] config must be a JSON object');
  }
  /** @type {Record<string, unknown>} */
  const o = raw;
  const version = Number(o.version);
  if (!Number.isFinite(version) || version < 1) {
    throw new Error('[volume-slo] config.version must be >= 1');
  }
  const defaultProfile = normalizeProfileName(o.defaultProfile, 'read');
  const fallbackBudgetMs = positiveMs(o.fallbackBudgetMs, 3000);
  const hardMaxMultiplier = positiveMs(o.hardMaxMultiplier, 2.5);
  const gates = parseGates(o.gates);
  const profilesRaw = o.profiles;
  if (!profilesRaw || typeof profilesRaw !== 'object') {
    throw new Error('[volume-slo] config.profiles is required');
  }
  /** @type {Record<VolumeSloProfileName, VolumeSloProfile>} */
  const profiles = {
    read: parseProfile(profilesRaw.read, 'read', fallbackBudgetMs),
    write: parseProfile(profilesRaw.write, 'write', fallbackBudgetMs),
  };
  return {
    version,
    defaultProfile,
    fallbackBudgetMs,
    hardMaxMultiplier,
    gates,
    profiles,
  };
}

/**
 * @param {unknown} value
 * @param {VolumeSloProfileName} fallback
 * @returns {VolumeSloProfileName}
 */
export function normalizeProfileName(value, fallback = 'read') {
  const s = String(value || '')
    .trim()
    .toLowerCase();
  if (s === 'read' || s === 'write') return s;
  return fallback;
}

/**
 * @param {unknown} profileRaw
 * @param {VolumeSloProfileName} name
 * @param {number} fallbackBudgetMs
 * @returns {VolumeSloProfile}
 */
function parseProfile(profileRaw, name, fallbackBudgetMs) {
  if (!profileRaw || typeof profileRaw !== 'object') {
    return {
      description: `${name} profile`,
      defaultBudgetMs: fallbackBudgetMs,
      endpointBudgetMs: {},
      endpointMaxMs: {},
      stepBudgetMs: {},
    };
  }
  /** @type {Record<string, unknown>} */
  const p = profileRaw;
  return {
    description: p.description != null ? String(p.description) : `${name} profile`,
    defaultBudgetMs: positiveMs(p.defaultBudgetMs, fallbackBudgetMs),
    endpointBudgetMs: parseBudgetMap(p.endpointBudgetMs),
    endpointMaxMs: parseBudgetMap(p.endpointMaxMs),
    stepBudgetMs: parseBudgetMap(p.stepBudgetMs),
  };
}

/**
 * @param {unknown} raw
 * @returns {Record<string, number>}
 */
function parseBudgetMap(raw) {
  if (!raw || typeof raw !== 'object') return {};
  /** @type {Record<string, number>} */
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const ms = positiveMs(v, NaN);
    if (Number.isFinite(ms)) out[String(k).trim()] = ms;
  }
  return out;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function positiveMs(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.round(n);
}

/**
 * @param {string} method
 * @returns {VolumeSloProfileName}
 */
export function profileForHttpMethod(method) {
  const m = String(method || 'GET')
    .trim()
    .toUpperCase();
  return READ_HTTP_METHODS.includes(m) ? 'read' : 'write';
}

/**
 * @param {VolumeSloConfig} config
 * @param {VolumeSloProfileName|string|undefined|null} profileName
 * @returns {VolumeSloProfile}
 */
export function resolveProfile(config, profileName) {
  const name = normalizeProfileName(profileName, config.defaultProfile);
  return config.profiles[name] || config.profiles.read;
}

/**
 * Normalize URL or path to catalog-style `/api/...` with `{id}` placeholders.
 * @param {string} urlOrPath
 * @returns {string}
 */
export function normalizeEndpointPath(urlOrPath) {
  if (!urlOrPath) return 'unknown';
  let path = String(urlOrPath).trim();
  try {
    const m = path.match(/https?:\/\/[^/]+(\/[^?#]*)/i);
    if (m) path = m[1];
  } catch {
    /* keep path */
  }
  if (!path.startsWith('/')) {
    if (path.startsWith('api/')) path = `/${path}`;
    else return path.slice(0, 200);
  }
  path = path.replace(/\/[0-9a-f]{24,32}(?=\/|$)/gi, '/{id}');
  path = path.replace(/\/[0-9a-f-]{36}(?=\/|$)/gi, '/{id}');
  path = path.replace(/\/\d+(?=\/|$)/g, '/{id}');
  path = path.replace(/\/{id}(\/{id})+/g, '/{id}');
  return path.slice(0, 200);
}

/**
 * @param {string} method
 * @param {string} endpoint
 * @returns {string}
 */
export function endpointBudgetKey(method, endpoint) {
  return `${String(method || 'GET').toUpperCase()} ${normalizeEndpointPath(endpoint)}`;
}

/**
 * Catalog paths may use {advisorId}/{cashflowId}; normalized URLs use {id}.
 * @param {string} path
 * @returns {string[]}
 */
export function endpointBudgetLookupKeys(path) {
  const norm = normalizeEndpointPath(path);
  const keys = new Set([norm]);
  keys.add(norm.replace(/\{id\}/g, '{advisorId}'));
  keys.add(norm.replace(/\{id\}/g, '{cashflowId}'));
  keys.add(norm.replace(/\{id\}/g, '{clientId}'));
  keys.add(norm.replace(/\{id\}/g, '{assetId}'));
  keys.add(norm.replace(/\{id\}/g, '{liabilityId}'));
  return [...keys];
}

/**
 * @param {VolumeSloConfig} config
 * @param {VolumeSloProfileName|string} profileName
 * @param {string} method
 * @param {string} endpoint
 * @returns {{ profile: VolumeSloProfileName, budgetMs: number, key: string }}
 */
export function resolveEndpointBudget(config, profileName, method, endpoint) {
  const profile = normalizeProfileName(profileName, config.defaultProfile);
  const prof = resolveProfile(config, profile);
  const normPath = normalizeEndpointPath(endpoint);
  const methodUp = String(method || 'GET').toUpperCase();
  const key = `${methodUp} ${normPath}`;
  const map = prof.endpointBudgetMs || {};
  let budgetMs = null;
  for (const pathKey of endpointBudgetLookupKeys(endpoint)) {
    const candidate = `${methodUp} ${pathKey}`;
    if (map[candidate] != null) {
      budgetMs = map[candidate];
      break;
    }
  }
  if (budgetMs == null) {
    for (const [pattern, ms] of Object.entries(map)) {
      if (endpointPatternMatches(key, pattern)) {
        budgetMs = ms;
        break;
      }
    }
  }
  if (budgetMs == null) budgetMs = prof.defaultBudgetMs;
  if (budgetMs == null) budgetMs = config.fallbackBudgetMs;
  return { profile, budgetMs, key };
}

/**
 * @param {VolumeSloConfig} config
 * @param {VolumeSloProfileName|string} profileName
 * @param {string} method
 * @param {string} endpoint
 * @param {number} [budgetMsHint]
 * @returns {{ profile: VolumeSloProfileName, hardMaxMs: number, key: string }}
 */
export function resolveEndpointHardMax(config, profileName, method, endpoint, budgetMsHint) {
  const profile = normalizeProfileName(profileName, config.defaultProfile);
  const prof = resolveProfile(config, profile);
  const resolved = resolveEndpointBudget(config, profile, method, endpoint);
  const budgetMs = budgetMsHint != null ? budgetMsHint : resolved.budgetMs;
  const map = prof.endpointMaxMs || {};
  const methodUp = String(method || 'GET').toUpperCase();
  let hardMaxMs = null;
  for (const pathKey of endpointBudgetLookupKeys(endpoint)) {
    const candidate = `${methodUp} ${pathKey}`;
    if (map[candidate] != null) {
      hardMaxMs = map[candidate];
      break;
    }
  }
  if (hardMaxMs == null) {
    for (const [pattern, ms] of Object.entries(map)) {
      if (endpointPatternMatches(resolved.key, pattern)) {
        hardMaxMs = ms;
        break;
      }
    }
  }
  if (hardMaxMs == null) {
    const mult = config.hardMaxMultiplier != null ? config.hardMaxMultiplier : 2.5;
    hardMaxMs = Math.round(budgetMs * mult);
  }
  return { profile, hardMaxMs, key: resolved.key };
}

/**
 * @param {VolumeSloConfig} config
 * @param {VolumeSloProfileName|string} profileName
 * @param {string} stepName
 * @returns {{ profile: VolumeSloProfileName, budgetMs: number, step: string }}
 */
export function resolveStepBudget(config, profileName, stepName) {
  const profile = normalizeProfileName(profileName, config.defaultProfile);
  const prof = resolveProfile(config, profile);
  const step = String(stepName || '').trim();
  const map = prof.stepBudgetMs || {};
  let budgetMs = map[step];
  if (budgetMs == null) budgetMs = prof.defaultBudgetMs;
  if (budgetMs == null) budgetMs = config.fallbackBudgetMs;
  return { profile, budgetMs, step };
}

/**
 * Loose match: exact key or same method + normalized path suffix.
 * @param {string} key e.g. GET /api/v1/Clients/{id}
 * @param {string} pattern from config
 */
export function endpointPatternMatches(key, pattern) {
  if (key === pattern) return true;
  const keyParts = key.split(/\s+/, 2);
  const patParts = String(pattern).trim().split(/\s+/, 2);
  if (keyParts.length < 2 || patParts.length < 2) return false;
  if (keyParts[0] !== patParts[0].toUpperCase()) return false;
  return normalizeEndpointPath(keyParts[1]) === normalizeEndpointPath(patParts[1]);
}

/**
 * @param {number[]} sorted ascending
 * @param {number} p 0-100
 * @returns {number|null}
 */
export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

/**
 * @param {number[]} samples
 * @returns {number|null}
 */
export function calculateP95(samples) {
  if (!samples || !samples.length) return null;
  const sorted = samples.slice().sort((a, b) => a - b);
  return percentile(sorted, 95);
}

/**
 * @param {number[]} samples
 * @param {number} budgetMs
 * @returns {{ violations: number, violationRate: number|null, count: number }}
 */
export function calculateViolationRate(samples, budgetMs) {
  const count = samples ? samples.length : 0;
  if (!count || budgetMs == null || !Number.isFinite(budgetMs)) {
    return { violations: 0, violationRate: null, count };
  }
  let violations = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i] > budgetMs) violations += 1;
  }
  return {
    violations,
    violationRate: violations / count,
    count,
  };
}

/**
 * @param {number[]} samples
 * @returns {{
 *   count: number,
 *   avgMs: number|null,
 *   minMs: number|null,
 *   maxMs: number|null,
 *   p90Ms: number|null,
 *   p95Ms: number|null,
 *   p99Ms: number|null,
 * }}
 */
export function summarizeSamples(samples) {
  if (!samples || !samples.length) {
    return {
      count: 0,
      avgMs: null,
      minMs: null,
      maxMs: null,
      p90Ms: null,
      p95Ms: null,
      p99Ms: null,
    };
  }
  const sorted = samples.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avgMs: sum / sorted.length,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    p90Ms: percentile(sorted, 90),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
  };
}

/**
 * @returns {VolumeSloSampleStore}
 */
export function createVolumeSloStore() {
  return {
    endpoints: Object.create(null),
    steps: Object.create(null),
    profilesUsed: Object.create(null),
  };
}

/**
 * @param {VolumeSloSampleStore} store
 * @param {VolumeSloConfig} config
 * @param {{ method: string, endpoint: string, durationMs: number, profile?: string }} input
 * @returns {{ bucket: VolumeSloEndpointBucket, violated: boolean }}
 */
export function recordEndpointSample(store, config, input) {
  const method = String(input.method || 'GET').toUpperCase();
  const endpoint = normalizeEndpointPath(input.endpoint);
  const profileHint = input.profile != null ? normalizeProfileName(input.profile) : profileForHttpMethod(method);
  const resolved = resolveEndpointBudget(config, profileHint, method, endpoint);
  const hardResolved = resolveEndpointHardMax(config, profileHint, method, endpoint, resolved.budgetMs);
  const storeKey = `${resolved.profile}\0${resolved.key}`;
  if (!store.endpoints[storeKey]) {
    store.endpoints[storeKey] = {
      method,
      endpoint,
      profile: resolved.profile,
      budgetMs: resolved.budgetMs,
      hardMaxMs: hardResolved.hardMaxMs,
      durations: [],
      violations: 0,
      hardViolations: 0,
    };
  }
  const bucket = store.endpoints[storeKey];
  const ms = Math.max(0, Number(input.durationMs) || 0);
  bucket.durations.push(ms);
  const violated = ms > bucket.budgetMs;
  if (violated) bucket.violations += 1;
  const hardViolated = ms > bucket.hardMaxMs;
  if (hardViolated) bucket.hardViolations += 1;
  store.profilesUsed[resolved.profile] = true;
  return { bucket, violated, hardViolated };
}

/**
 * @param {VolumeSloSampleStore} store
 * @param {VolumeSloConfig} config
 * @param {{ step: string, durationMs: number, profile?: string }} input
 * @returns {{ bucket: VolumeSloStepBucket, violated: boolean }}
 */
export function recordStepSample(store, config, input) {
  const step = String(input.step || '').trim();
  const profileHint =
    input.profile != null ? normalizeProfileName(input.profile) : config.defaultProfile;
  const resolved = resolveStepBudget(config, profileHint, step);
  const storeKey = `${resolved.profile}\0${resolved.step}`;
  if (!store.steps[storeKey]) {
    store.steps[storeKey] = {
      step: resolved.step,
      profile: resolved.profile,
      budgetMs: resolved.budgetMs,
      durations: [],
      violations: 0,
    };
  }
  const bucket = store.steps[storeKey];
  const ms = Math.max(0, Number(input.durationMs) || 0);
  bucket.durations.push(ms);
  const violated = ms > bucket.budgetMs;
  if (violated) bucket.violations += 1;
  store.profilesUsed[resolved.profile] = true;
  return { bucket, violated };
}

/**
 * @param {VolumeSloEndpointBucket} bucket
 * @returns {object}
 */
export function buildEndpointRow(bucket) {
  const stats = summarizeSamples(bucket.durations);
  const viol = calculateViolationRate(bucket.durations, bucket.budgetMs);
  const hardViol = calculateViolationRate(bucket.durations, bucket.hardMaxMs);
  const p95 = stats.p95Ms;
  const passFail =
    p95 != null && bucket.budgetMs != null
      ? p95 <= bucket.budgetMs
        ? 'pass'
        : 'fail'
      : null;
  return {
    method: bucket.method,
    endpoint: bucket.endpoint,
    profile: bucket.profile,
    budgetMs: bucket.budgetMs,
    hardMaxMs: bucket.hardMaxMs,
    count: stats.count,
    violations: viol.violations,
    violationRate: viol.violationRate,
    hardViolations: hardViol.violations,
    hardViolationRate: hardViol.violationRate,
    avgMs: stats.avgMs,
    minMs: stats.minMs,
    maxMs: stats.maxMs,
    p90Ms: stats.p90Ms,
    p95Ms: stats.p95Ms,
    p99Ms: stats.p99Ms,
    passFail,
  };
}

/**
 * @param {VolumeSloStepBucket} bucket
 * @returns {object}
 */
export function buildStepRow(bucket) {
  const stats = summarizeSamples(bucket.durations);
  const viol = calculateViolationRate(bucket.durations, bucket.budgetMs);
  const p95 = stats.p95Ms;
  const passFail =
    p95 != null && bucket.budgetMs != null
      ? p95 <= bucket.budgetMs
        ? 'pass'
        : 'fail'
      : null;
  return {
    step: bucket.step,
    profile: bucket.profile,
    budgetMs: bucket.budgetMs,
    count: stats.count,
    violations: viol.violations,
    violationRate: viol.violationRate,
    avgMs: stats.avgMs,
    minMs: stats.minMs,
    maxMs: stats.maxMs,
    p90Ms: stats.p90Ms,
    p95Ms: stats.p95Ms,
    p99Ms: stats.p99Ms,
    passFail,
  };
}

/**
 * @param {number[]} violationRates
 * @returns {number|null}
 */
export function aggregateViolationRate(violationRates) {
  const rates = (violationRates || []).filter((r) => r != null && Number.isFinite(r));
  if (!rates.length) return null;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

/**
 * @typedef {object} VolumeScenario
 * @property {string} [description]
 * @property {'read'|'write'} [profile]
 * @property {boolean} [readOnly]
 * @property {number} [clientsPerAdvisor]
 * @property {number} [plansPerClient]
 * @property {number} [advisors]
 * @property {string} [manifestProfileFile]
 * @property {string} [phaseBScenario]
 * @property {string} [sloOverridesFile]
 * @property {Record<string, number>} [endpointBudgetOverrides]
 * @property {Record<string, number>} [stepBudgetOverrides]
 */

/**
 * @typedef {object} VolumeScenariosConfig
 * @property {number} version
 * @property {string} defaultScenario
 * @property {Record<string, VolumeScenario>} scenarios
 */

/**
 * @param {unknown} raw
 * @returns {VolumeScenariosConfig}
 */
export function parseVolumeScenariosConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[volume-slo] scenarios must be a JSON object');
  }
  /** @type {Record<string, unknown>} */
  const o = raw;
  const version = Number(o.version);
  if (!Number.isFinite(version) || version < 1) {
    throw new Error('[volume-slo] scenarios.version must be >= 1');
  }
  const defaultScenario = String(o.defaultScenario || 'phase-a-write-default').trim();
  const scenariosRaw = o.scenarios;
  if (!scenariosRaw || typeof scenariosRaw !== 'object') {
    throw new Error('[volume-slo] scenarios.scenarios is required');
  }
  /** @type {Record<string, VolumeScenario>} */
  const scenarios = {};
  for (const [key, val] of Object.entries(scenariosRaw)) {
    scenarios[key] = parseScenarioEntry(val);
  }
  if (!scenarios[defaultScenario]) {
    const first = Object.keys(scenarios)[0];
    if (!first) throw new Error('[volume-slo] scenarios.scenarios is empty');
  }
  return { version, defaultScenario, scenarios };
}

/**
 * @param {unknown} raw
 * @returns {VolumeScenario}
 */
function parseScenarioEntry(raw) {
  if (!raw || typeof raw !== 'object') return {};
  /** @type {Record<string, unknown>} */
  const s = raw;
  return {
    description: s.description != null ? String(s.description) : undefined,
    profile: s.profile != null ? normalizeProfileName(s.profile) : undefined,
    readOnly: s.readOnly === true,
    clientsPerAdvisor: positiveInt(s.clientsPerAdvisor, 1),
    plansPerClient: positiveInt(s.plansPerClient, 1),
    advisors:
      s.advisors != null && Number.isFinite(Number(s.advisors))
        ? Math.max(0, Math.floor(Number(s.advisors)))
        : undefined,
    writeParallelJobs:
      s.writeParallelJobs != null && Number.isFinite(Number(s.writeParallelJobs))
        ? Math.max(1, Math.floor(Number(s.writeParallelJobs)))
        : undefined,
    disableFleetStagger: s.disableFleetStagger === true,
    manifestProfileFile:
      s.manifestProfileFile != null ? String(s.manifestProfileFile).trim() : undefined,
    phaseBScenario: s.phaseBScenario != null ? String(s.phaseBScenario).trim() : undefined,
    sloOverridesFile: s.sloOverridesFile != null ? String(s.sloOverridesFile).trim() : undefined,
    endpointBudgetOverrides: parseBudgetMap(s.endpointBudgetOverrides),
    stepBudgetOverrides: parseBudgetMap(s.stepBudgetOverrides),
  };
}

/**
 * @param {unknown} value
 * @param {number} fallback
 */
function positiveInt(value, fallback) {
  const n = parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

/**
 * Apply scenario profile overrides onto a base SLO config (immutable copy).
 * @param {VolumeSloConfig} baseConfig
 * @param {VolumeScenario} scenario
 * @returns {VolumeSloConfig}
 */
export function applyScenarioToSloConfig(baseConfig, scenario) {
  if (!scenario) return baseConfig;
  const profileName = normalizeProfileName(scenario.profile, baseConfig.defaultProfile);
  const profiles = {
    read: Object.assign({}, baseConfig.profiles.read, {
      endpointBudgetMs: Object.assign(
        {},
        baseConfig.profiles.read.endpointBudgetMs,
        profileName === 'read' ? scenario.endpointBudgetOverrides || {} : {},
      ),
      stepBudgetMs: Object.assign(
        {},
        baseConfig.profiles.read.stepBudgetMs,
        profileName === 'read' ? scenario.stepBudgetOverrides || {} : {},
      ),
    }),
    write: Object.assign({}, baseConfig.profiles.write, {
      endpointBudgetMs: Object.assign(
        {},
        baseConfig.profiles.write.endpointBudgetMs,
        profileName === 'write' ? scenario.endpointBudgetOverrides || {} : {},
      ),
      stepBudgetMs: Object.assign(
        {},
        baseConfig.profiles.write.stepBudgetMs,
        profileName === 'write' ? scenario.stepBudgetOverrides || {} : {},
      ),
    }),
  };
  return {
    version: baseConfig.version,
    defaultProfile: profileName,
    fallbackBudgetMs: baseConfig.fallbackBudgetMs,
    profiles,
  };
}

/**
 * @param {VolumeScenariosConfig} scenariosConfig
 * @param {string} [scenarioName]
 * @returns {{ name: string, scenario: VolumeScenario }}
 */
export function resolveVolumeScenario(scenariosConfig, scenarioName) {
  const name = String(scenarioName || scenariosConfig.defaultScenario || '').trim();
  const scenario = scenariosConfig.scenarios[name];
  if (!scenario) {
    const keys = Object.keys(scenariosConfig.scenarios);
    const fallback = keys[0];
    if (!fallback) throw new Error('[volume-slo] no scenarios defined');
    return { name: fallback, scenario: scenariosConfig.scenarios[fallback] };
  }
  return { name, scenario };
}

/**
 * Evaluate gate pass/fail from a built summary (pure, unit-testable).
 *
 * Gate semantics (aligned with k6 thresholds when VOLUME_SLO_GATE=1):
 * - Step p95: any scoped step row with passFail=fail fails the gate.
 * - Step violation rate: aggregate stepViolationRate must be <= maxStepViolationRate (default 5%).
 * - Endpoint violation rate: aggregate endpointViolationRate must be <= maxEndpointViolationRate (default 5%).
 * - Optional strict endpoint p95: when failOnEndpointP95=true, any endpoint row with passFail=fail fails the gate.
 *
 * @param {object} summary output of buildVolumeSloSummary
 * @param {{
 *   phaseASteps?: string[],
 *   requirePhaseASteps?: boolean,
 *   failOnEndpointP95?: boolean,
 *   maxStepViolationRate?: number,
 *   maxEndpointViolationRate?: number,
 *   maxSingleRequestOverMaxMsRate?: number,
 * }} [opts]
 */
export function evaluateVolumeSloGate(summary, opts = {}) {
  const phaseASteps = opts.phaseASteps || [];
  const stepRows = summary && summary.steps ? summary.steps : [];
  const failedSteps = [];
  for (let i = 0; i < stepRows.length; i++) {
    const row = stepRows[i];
    if (row.passFail !== 'fail') continue;
    if (phaseASteps.length && !phaseASteps.includes(row.step)) continue;
    failedSteps.push(row.step);
  }
  const endpointRows = summary && summary.endpoints ? summary.endpoints : [];
  const failedEndpoints = [];
  for (let i = 0; i < endpointRows.length; i++) {
    const row = endpointRows[i];
    if (row.passFail === 'fail') failedEndpoints.push(`${row.method} ${row.endpoint}`);
  }
  const stepViolationRate =
    summary && summary.rates && summary.rates.stepViolationRate != null
      ? summary.rates.stepViolationRate
      : null;
  const endpointViolationRate =
    summary && summary.rates && summary.rates.endpointViolationRate != null
      ? summary.rates.endpointViolationRate
      : null;
  const hardMaxViolationRate =
    summary && summary.rates && summary.rates.hardMaxViolationRate != null
      ? summary.rates.hardMaxViolationRate
      : null;
  const gates = summary && summary.gates ? summary.gates : {};
  const maxStepViolationRate =
    opts.maxStepViolationRate != null
      ? Number(opts.maxStepViolationRate)
      : gates.maxStepP95ViolationRate != null
        ? Number(gates.maxStepP95ViolationRate)
        : 0.05;
  const maxEndpointViolationRate =
    opts.maxEndpointViolationRate != null
      ? Number(opts.maxEndpointViolationRate)
      : gates.maxEndpointP95ViolationRate != null
        ? Number(gates.maxEndpointP95ViolationRate)
        : 0.05;
  const maxSingleRequestOverMaxMsRate =
    opts.maxSingleRequestOverMaxMsRate != null
      ? Number(opts.maxSingleRequestOverMaxMsRate)
      : gates.maxSingleRequestOverMaxMsRate != null
        ? Number(gates.maxSingleRequestOverMaxMsRate)
        : 0.01;
  const stepViolationRateFailed =
    stepViolationRate != null && Number.isFinite(maxStepViolationRate)
      ? stepViolationRate > maxStepViolationRate
      : false;
  const endpointViolationRateFailed =
    endpointViolationRate != null && Number.isFinite(maxEndpointViolationRate)
      ? endpointViolationRate > maxEndpointViolationRate
      : false;
  const hardMaxViolationRateFailed =
    hardMaxViolationRate != null && Number.isFinite(maxSingleRequestOverMaxMsRate)
      ? hardMaxViolationRate > maxSingleRequestOverMaxMsRate
      : false;

  const passed =
    failedSteps.length === 0 &&
    (!opts.failOnEndpointP95 || failedEndpoints.length === 0) &&
    !stepViolationRateFailed &&
    !endpointViolationRateFailed &&
    !hardMaxViolationRateFailed;

  return {
    enabled: true,
    passed,
    failedSteps,
    failedEndpoints: opts.failOnEndpointP95 ? failedEndpoints : [],
    stepViolationRate,
    endpointViolationRate,
    hardMaxViolationRate,
    maxStepViolationRate,
    maxEndpointViolationRate,
    maxSingleRequestOverMaxMsRate,
    stepViolationRateFailed,
    endpointViolationRateFailed,
    hardMaxViolationRateFailed,
    violationRateFailed: stepViolationRateFailed || endpointViolationRateFailed || hardMaxViolationRateFailed,
  };
}

/**
 * @param {VolumeSloSampleStore} store
 * @param {VolumeSloConfig} config
 * @param {object} [meta]
 * @returns {object}
 */
export function buildVolumeSloSummary(store, config, meta = {}) {
  const endpointRows = Object.values(store.endpoints || {})
    .map(buildEndpointRow)
    .sort((a, b) => (b.p95Ms || 0) - (a.p95Ms || 0));
  const stepRows = Object.values(store.steps || {})
    .map(buildStepRow)
    .sort((a, b) => (b.p95Ms || 0) - (a.p95Ms || 0));

  const endpointViolationRate = aggregateViolationRate(
    endpointRows.map((r) => r.violationRate),
  );
  const stepViolationRate = aggregateViolationRate(stepRows.map((r) => r.violationRate));
  const hardMaxViolationRate = aggregateViolationRate(
    endpointRows.map((r) => r.hardViolationRate),
  );

  const profilesUsed = Object.keys(store.profilesUsed || {}).sort();

  return Object.assign(
    {
      reportType: 'volume-slo-summary',
      generatedAt: new Date().toISOString(),
      configVersion: config.version,
      defaultProfile: config.defaultProfile,
      gates: config.gates || null,
      profilesUsed,
      endpoints: endpointRows,
      steps: stepRows,
      rates: {
        endpointViolationRate,
        stepViolationRate,
        hardMaxViolationRate,
      },
      totals: {
        endpointSamples: endpointRows.reduce((n, r) => n + (r.count || 0), 0),
        stepSamples: stepRows.reduce((n, r) => n + (r.count || 0), 0),
        endpointViolations: endpointRows.reduce((n, r) => n + (r.violations || 0), 0),
        stepViolations: stepRows.reduce((n, r) => n + (r.violations || 0), 0),
        hardMaxViolations: endpointRows.reduce((n, r) => n + (r.hardViolations || 0), 0),
      },
    },
    meta,
  );
}
