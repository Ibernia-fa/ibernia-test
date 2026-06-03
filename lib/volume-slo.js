/**
 * Volume SLO framework for Ibernia k6 load tests.
 *
 * Opt-in via VOLUME_SLO=1. Config: config/volume-api-slo.json (override with VOLUME_SLO_FILE or VOLUME_SLO_CONFIG).
 * Profiles: read (GET-heavy) and write (mutations). Auto-selected from HTTP method when
 * VOLUME_SLO_AUTO_PROFILE=1 (default).
 *
 * Pure logic lives in volume-slo-core.js (Node-testable).
 */
import { Trend, Rate, Counter } from 'k6/metrics';
import {
  DEFAULT_CONFIG_PATH,
  DEFAULT_SCENARIOS_PATH,
  CONFIG_OPEN_FALLBACKS,
  SCENARIOS_OPEN_FALLBACKS,
  parseVolumeSloConfig,
  parseVolumeScenariosConfig,
  applyScenarioToSloConfig,
  resolveVolumeScenario,
  profileForHttpMethod,
  normalizeProfileName,
  normalizeEndpointPath,
  resolveStepBudget,
  createVolumeSloStore,
  recordEndpointSample,
  recordStepSample,
  buildVolumeSloSummary,
  evaluateVolumeSloGate,
} from './volume-slo-core.js';
import { resolveManifestShardId } from './volume-manifest-core.js';
import { recordSignoffStep, recordSignoffHttp } from './volume-signoff-k6.js';

export {
  parseVolumeSloConfig,
  parseVolumeScenariosConfig,
  applyScenarioToSloConfig,
  resolveVolumeScenario,
  profileForHttpMethod,
  normalizeProfileName,
  normalizeEndpointPath,
  resolveEndpointBudget,
  resolveEndpointHardMax,
  resolveStepBudget,
  calculateP95,
  calculateViolationRate,
  summarizeSamples,
  createVolumeSloStore,
  recordEndpointSample,
  recordStepSample,
  buildVolumeSloSummary,
  buildEndpointRow,
  buildStepRow,
  endpointBudgetKey,
  percentile,
  evaluateVolumeSloGate,
  DEFAULT_SCENARIOS_PATH,
} from './volume-slo-core.js';

/** Phase A full-platform creation flow step metrics (write profile). */
export const PHASE_A_STEP_METRICS = Object.freeze([
  'journey_create_client_duration',
  'journey_create_base_plan_duration',
  'journey_create_timeline_events_duration',
  'journey_add_income_expenses_duration',
  'journey_add_saving_pots_duration',
  'journey_add_contributions_withdrawals_duration',
  'journey_calculate_projection_duration',
  'journey_full_plan_build_duration',
]);

function volumeSloMetricsEnabledAtInit() {
  const raw = (__ENV.VOLUME_SLO || '').trim().toLowerCase();
  const gateRaw = (__ENV.VOLUME_SLO_GATE || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw) || ['1', 'true', 'yes', 'on'].includes(gateRaw);
}

/** @type {import('k6/metrics').Trend|null} */
let volumeSloDuration = null;
/** @type {import('k6/metrics').Rate|null} */
let volumeSloViolation = null;
/** @type {import('k6/metrics').Counter|null} */
let sloEndpointViolationCount = null;
/** @type {import('k6/metrics').Rate|null} */
let sloEndpointViolationRate = null;
/** @type {import('k6/metrics').Counter|null} */
let sloStepViolationCount = null;
/** @type {import('k6/metrics').Rate|null} */
let sloStepViolationRate = null;
/** @type {import('k6/metrics').Counter|null} */
let createdClientsCount = null;
/** @type {import('k6/metrics').Counter|null} */
let createdPlansCount = null;

/** @type {Record<string, import('k6/metrics').Trend>} */
const phaseATrendRegistry = Object.create(null);

if (volumeSloMetricsEnabledAtInit()) {
  volumeSloDuration = new Trend('volume_slo_duration_ms', true);
  volumeSloViolation = new Rate('volume_slo_violation_rate', true);
  sloEndpointViolationCount = new Counter('slo_endpoint_violation_count', true);
  sloEndpointViolationRate = new Rate('slo_endpoint_violation_rate', true);
  sloStepViolationCount = new Counter('slo_step_violation_count', true);
  sloStepViolationRate = new Rate('slo_step_violation_rate', true);
  createdClientsCount = new Counter('created_clients_count');
  createdPlansCount = new Counter('created_plans_count');
  for (let i = 0; i < PHASE_A_STEP_METRICS.length; i++) {
    const name = PHASE_A_STEP_METRICS[i];
    phaseATrendRegistry[name] = new Trend(name, true);
  }
}

export {
  sloEndpointViolationCount,
  sloEndpointViolationRate,
  sloStepViolationCount,
  sloStepViolationRate,
  createdClientsCount,
  createdPlansCount,
};

/** @type {import('./volume-slo-core.js').VolumeSloConfig|null} */
let cachedConfig = null;
/** @type {import('./volume-slo-core.js').VolumeScenariosConfig|null} */
let cachedScenarios = null;
/** @type {{ name: string, scenario: import('./volume-slo-core.js').VolumeScenario }|null} */
let cachedScenarioResolved = null;

/** Shared in-process store (visible in handleSummary). */
const moduleStore = createVolumeSloStore();

function truthy(name) {
  const raw = (__ENV[name] || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

/**
 * @returns {{
 *   enabled: boolean,
 *   configPath: string,
 *   profileOverride: string|null,
 *   autoProfile: boolean,
 *   runId: string,
 * }}
 */
export function volumeSloConfigFromEnv() {
  const autoProfile = !['0', 'false', 'no'].includes(
    (__ENV.VOLUME_SLO_AUTO_PROFILE || '1').trim().toLowerCase(),
  );
  const profileRaw = (__ENV.VOLUME_SLO_PROFILE || '').trim();
  const scenarioRaw = (__ENV.VOLUME_SCENARIO || __ENV.VOLUME_SLO_SCENARIO || '').trim();
  return {
    enabled: truthy('VOLUME_SLO'),
    configPath: (
      (__ENV.VOLUME_SLO_FILE || __ENV.VOLUME_SLO_CONFIG || DEFAULT_CONFIG_PATH).trim()
    ),
    scenariosPath: (
      (__ENV.VOLUME_SCENARIOS_FILE || DEFAULT_SCENARIOS_PATH).trim()
    ),
    profileOverride: profileRaw ? normalizeProfileName(profileRaw) : null,
    scenarioName: scenarioRaw || null,
    autoProfile,
    runId: (
      (__ENV.VOLUME_SLO_RUN_ID || __ENV.PHASE_A_RUN_TAG || __ENV.FULL_PLATFORM_RUN_TAG || __ENV.PERF_RUN_ID || '').trim()
    ),
    gateEnabled: truthy('VOLUME_SLO_GATE'),
    readOnlyJourney: truthy('VOLUME_READ_ONLY') || truthy('PHASE_B_READ_ONLY'),
  };
}

/**
 * Try k6 open() across repo-relative fallbacks (script dir vs repo root).
 * @param {string} preferred
 * @param {readonly string[]} fallbacks
 */
function openJsonWithFallbacks(preferred, fallbacks) {
  const seen = new Set();
  const paths = [preferred].concat(fallbacks || []);
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    if (!p || seen.has(p)) continue;
    seen.add(p);
    try {
      return { path: p, data: JSON.parse(open(p)) };
    } catch {
      /* try next */
    }
  }
  throw new Error(`[volume-slo] could not open JSON at ${preferred}`);
}

/** @returns {boolean} */
export function isVolumeSloEnabled() {
  return volumeSloConfigFromEnv().enabled;
}

/** @returns {boolean} */
export function isVolumeSloGateEnabled() {
  const env = volumeSloConfigFromEnv();
  return env.enabled && env.gateEnabled;
}

/**
 * Load and cache SLO config from JSON file (k6 `open()` in init context).
 * @param {string} [pathOverride]
 * @returns {import('./volume-slo-core.js').VolumeSloConfig}
 */
export function loadVolumeSloConfig(pathOverride) {
  if (cachedConfig) return getEffectiveSloConfig();
  const env = volumeSloConfigFromEnv();
  const preferred = (pathOverride || env.configPath || DEFAULT_CONFIG_PATH).trim();
  try {
    const opened = openJsonWithFallbacks(preferred, CONFIG_OPEN_FALLBACKS);
    cachedConfig = parseVolumeSloConfig(opened.data);
    cachedConfig = applyEnvSloOverrides(cachedConfig);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.warn(`[volume-slo] Could not load "${preferred}": ${msg}. Using embedded defaults.`);
    cachedConfig = parseVolumeSloConfig(getEmbeddedDefaultConfig());
  }
  return getEffectiveSloConfig();
}

/**
 * @param {string} [pathOverride]
 * @returns {import('./volume-slo-core.js').VolumeScenariosConfig}
 */
export function loadVolumeScenariosConfig(pathOverride) {
  if (cachedScenarios) return cachedScenarios;
  const env = volumeSloConfigFromEnv();
  const preferred = (pathOverride || env.scenariosPath || DEFAULT_SCENARIOS_PATH).trim();
  try {
    const opened = openJsonWithFallbacks(preferred, SCENARIOS_OPEN_FALLBACKS);
    cachedScenarios = parseVolumeScenariosConfig(opened.data);
  } catch (e) {
    console.warn(`[volume-slo] scenarios file unavailable (${preferred}); using inline default.`);
    cachedScenarios = parseVolumeScenariosConfig(getEmbeddedDefaultScenarios());
  }
  return cachedScenarios;
}

function getEmbeddedDefaultScenarios() {
  return {
    version: 1,
    defaultScenario: 'phase-a-write-default',
    scenarios: {
      'phase-a-write-default': {
        profile: 'write',
        clientsPerAdvisor: 1,
        plansPerClient: 1,
      },
      'phase-b-read-default': {
        profile: 'read',
        readOnly: true,
      },
    },
  };
}

/** @param {unknown} raw @returns {Record<string, number>} */
function budgetMapFromUnknown(raw) {
  if (!raw || typeof raw !== 'object') return {};
  /** @type {Record<string, number>} */
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out[String(k).trim()] = Math.round(n);
  }
  return out;
}

/**
 * Deep-merge partial profile maps onto a base SLO config (immutable copy).
 * @param {import('./volume-slo-core.js').VolumeSloConfig} config
 * @param {unknown} patchRaw
 * @returns {import('./volume-slo-core.js').VolumeSloConfig}
 */
export function mergeSloProfilePatch(config, patchRaw) {
  if (!config) return config;
  if (!patchRaw || typeof patchRaw !== 'object') return config;
  /** @type {Record<string, unknown>} */
  const patch = patchRaw;
  const profilesPatch = patch.profiles;
  if (!profilesPatch || typeof profilesPatch !== 'object') {
    const gatesPatch = patch.gates;
    if (gatesPatch && typeof gatesPatch === 'object') {
      return Object.assign({}, config, {
        gates: Object.assign({}, config.gates || {}, gatesPatch),
      });
    }
    return config;
  }
  return Object.assign({}, config, {
    profiles: {
      read: mergeOneSloProfile(config.profiles && config.profiles.read, profilesPatch.read),
      write: mergeOneSloProfile(config.profiles && config.profiles.write, profilesPatch.write),
    },
    gates:
      patch.gates && typeof patch.gates === 'object'
        ? Object.assign({}, config.gates || {}, patch.gates)
        : config.gates,
  });
}

/** @param {import('./volume-slo-core.js').VolumeSloProfile|undefined} base @param {unknown} patch */
function mergeOneSloProfile(base, patch) {
  const safeBase = base || {
    defaultBudgetMs: 3000,
    endpointBudgetMs: {},
    endpointMaxMs: {},
    stepBudgetMs: {},
  };
  if (!patch || typeof patch !== 'object') return safeBase;
  /** @type {Record<string, unknown>} */
  const p = patch;
  return Object.assign({}, safeBase, {
    defaultBudgetMs:
      p.defaultBudgetMs != null && Number.isFinite(Number(p.defaultBudgetMs))
        ? Math.round(Number(p.defaultBudgetMs))
        : safeBase.defaultBudgetMs,
    endpointBudgetMs: Object.assign(
      {},
      safeBase.endpointBudgetMs || {},
      budgetMapFromUnknown(p.endpointBudgetMs),
    ),
    endpointMaxMs: Object.assign(
      {},
      safeBase.endpointMaxMs || {},
      budgetMapFromUnknown(p.endpointMaxMs),
    ),
    stepBudgetMs: Object.assign({}, safeBase.stepBudgetMs || {}, budgetMapFromUnknown(p.stepBudgetMs)),
  });
}

function applyEnvSloOverrides(config) {
  if (!config) return config;
  const overridesPath = (__ENV.VOLUME_SLO_OVERRIDES_FILE || '').trim();
  if (!overridesPath) return config;
  try {
    const opened = openJsonWithFallbacks(overridesPath, CONFIG_OPEN_FALLBACKS);
    return mergeSloProfilePatch(config, opened.data);
  } catch (e) {
    console.warn(`[volume-slo] VOLUME_SLO_OVERRIDES_FILE failed: ${e.message || e}`);
    return config;
  }
}

/**
 * Apply scenario JSON overrides + optional sloOverridesFile onto effective config.
 * @param {import('./volume-slo-core.js').VolumeSloConfig} config
 * @param {import('./volume-slo-core.js').VolumeScenario|null|undefined} scenario
 */
export function applyScenarioSloOverrides(config, scenario) {
  if (!config) return config;
  if (!scenario) return config;
  let merged = config;
  if (scenario.sloOverridesFile) {
    try {
      const opened = openJsonWithFallbacks(String(scenario.sloOverridesFile), CONFIG_OPEN_FALLBACKS);
      merged = mergeSloProfilePatch(merged, opened.data);
    } catch (e) {
      console.warn(`[volume-slo] scenario sloOverridesFile failed: ${e.message || e}`);
    }
  }
  return merged;
}

/**
 * Record Phase A creation totals on k6 counters and optionally attach to a summary object.
 * @param {object|null|undefined} summary
 * @param {{ clients?: number, plans?: number }} [counters]
 * @returns {{ clients: number, plans: number }}
 */
export function recordPhaseACreationCounts(summary, counters = {}) {
  const clients = Math.max(0, Number(counters && counters.clients != null ? counters.clients : 0) || 0);
  const plans = Math.max(0, Number(counters && counters.plans != null ? counters.plans : 0) || 0);
  if (createdClientsCount && clients > 0) createdClientsCount.add(clients);
  if (createdPlansCount && plans > 0) createdPlansCount.add(plans);
  const out = { clients, plans };
  if (summary && typeof summary === 'object') {
    summary.created_clients_count = clients;
    summary.created_plans_count = plans;
  }
  return out;
}

/**
 * Active scenario + merged SLO config (scenario overrides applied).
 */
export function getEffectiveSloConfig() {
  if (!cachedConfig) {
    loadVolumeSloConfig();
  }
  const scenarios = loadVolumeScenariosConfig();
  const env = volumeSloConfigFromEnv();
  if (!cachedScenarioResolved) {
    cachedScenarioResolved = resolveVolumeScenario(scenarios, env.scenarioName || undefined);
  }
  let merged = applyScenarioToSloConfig(cachedConfig, cachedScenarioResolved.scenario);
  merged = applyScenarioSloOverrides(merged, cachedScenarioResolved.scenario);
  return merged;
}

/**
 * Resolve step budget (ms) with scenario + profile overrides applied.
 * @param {string} stepName
 * @param {string} [profileOverride]
 * @returns {number}
 */
export function resolveEffectiveStepBudgetMs(stepName, profileOverride) {
  const config = getEffectiveSloConfig();
  const env = volumeSloConfigFromEnv();
  const profile = normalizeProfileName(
    profileOverride || env.profileOverride || config.defaultProfile || 'read',
  );
  const resolved = resolveStepBudget(config, profile, stepName);
  return resolved.budgetMs != null ? resolved.budgetMs : config.fallbackBudgetMs || 3000;
}

/** @returns {{ name: string, scenario: import('./volume-slo-core.js').VolumeScenario }} */
export function getActiveVolumeScenario() {
  loadVolumeScenariosConfig();
  const env = volumeSloConfigFromEnv();
  if (!cachedScenarioResolved) {
    cachedScenarioResolved = resolveVolumeScenario(
      cachedScenarios,
      env.scenarioName || undefined,
    );
  }
  return cachedScenarioResolved;
}

function recordEndpointViolation(profile, method, endpoint, violated) {
  if (!sloEndpointViolationRate) return;
  const tags = { profile, method, endpoint: String(endpoint).slice(0, 120) };
  sloEndpointViolationRate.add(violated ? 1 : 0, tags);
  if (violated && sloEndpointViolationCount) sloEndpointViolationCount.add(1, tags);
}

function recordStepViolation(profile, step, violated) {
  if (!sloStepViolationRate) return;
  const tags = { profile, step: String(step).slice(0, 80) };
  sloStepViolationRate.add(violated ? 1 : 0, tags);
  if (violated && sloStepViolationCount) sloStepViolationCount.add(1, tags);
}

/** Minimal fallback when config file is missing (matches config/volume-api-slo.json shape). */
function getEmbeddedDefaultConfig() {
  return {
    version: 1,
    defaultProfile: 'read',
    fallbackBudgetMs: 3000,
    profiles: {
      read: {
        defaultBudgetMs: 2500,
        endpointBudgetMs: {
          'GET /api/v1/Clients/{advisorId}/all': 2500,
          'GET /api/v1/Clients/{id}': 2000,
          'GET /api/v1/cashflows/{cashflowId}': 3000,
          'GET /api/v1/Reports/{cashflowId}': 5000,
        },
        stepBudgetMs: {
          login: 1500,
          dashboard_load: 2500,
          open_client: 2000,
          cashflow_load: 3000,
          journey_login_duration: 1500,
          journey_dashboard_load_duration: 2500,
          journey_open_client_duration: 2000,
          journey_client_plans_load_duration: 2000,
          journey_open_plan_duration: 2000,
          journey_timeline_load_duration: 2500,
          journey_income_expenses_load_duration: 2500,
          journey_saving_pots_load_duration: 3000,
          journey_projection_load_duration: 6000,
          journey_cashflow_load_duration: 3000,
          full_journey_duration: 15000,
        },
      },
      write: {
        defaultBudgetMs: 3000,
        endpointBudgetMs: {
          'POST /api/v1/Clients': 3000,
          'PUT /api/v1/Clients': 2500,
          'POST /api/v1/cashflows': 4000,
        },
        stepBudgetMs: {
          save_assumption: 2000,
          cashflow_recalculate: 5000,
          save_changes: 2500,
          journey_create_client_duration: 4000,
          journey_create_base_plan_duration: 5000,
          journey_create_timeline_events_duration: 8000,
          journey_add_income_expenses_duration: 3500,
          journey_add_saving_pots_duration: 3000,
          journey_add_contributions_withdrawals_duration: 3000,
          journey_calculate_projection_duration: 5000,
          journey_full_plan_build_duration: 30000,
        },
      },
    },
  };
}

/**
 * Resolve profile for one HTTP observation.
 * @param {object} meta
 * @param {string} method
 */
function resolveProfileForHttp(meta, method) {
  const env = volumeSloConfigFromEnv();
  if (meta && meta.sloProfile) return normalizeProfileName(meta.sloProfile);
  if (meta && meta.profile) return normalizeProfileName(meta.profile);
  if (env.profileOverride) return env.profileOverride;
  if (env.autoProfile) return profileForHttpMethod(method);
  return getEffectiveSloConfig().defaultProfile;
}

function pathFromResponse(res, meta) {
  const raw = meta && meta.endpoint != null ? String(meta.endpoint).trim() : '';
  if (raw.startsWith('/api/') || raw.startsWith('/connect/')) {
    return normalizeEndpointPath(raw);
  }
  if (/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+\//i.test(raw)) {
    const sp = raw.indexOf(' ');
    if (sp > 0) return normalizeEndpointPath(raw.slice(sp + 1));
  }
  const url = res && res.url ? String(res.url) : '';
  if (url) return normalizeEndpointPath(url);
  if (meta && meta.tagName) return normalizeEndpointPath(String(meta.tagName));
  return 'unknown';
}

function methodFromResponse(res, meta) {
  if (meta && meta.method) return String(meta.method).toUpperCase();
  if (res && res.request && res.request.method) return String(res.request.method).toUpperCase();
  return 'GET';
}

/**
 * Record one HTTP sample against endpoint SLO budgets (called from observeHttp).
 * @param {import('k6/http').RefinedResponse|import('k6/http').Response|null} res
 * @param {object} [meta]
 */
export function recordVolumeSloHttp(res, meta = {}) {
  const env = volumeSloConfigFromEnv();
  if (!env.enabled) return null;

  const config = getEffectiveSloConfig();
  const method = methodFromResponse(res, meta);
  const endpoint = pathFromResponse(res, meta);
  const profile = resolveProfileForHttp(meta, method);
  const ms =
    res && res.timings && res.timings.duration != null ? Number(res.timings.duration) : 0;

  const { bucket, violated } = recordEndpointSample(moduleStore, config, {
    method,
    endpoint,
    durationMs: ms,
    profile,
  });

  const tags = {
    profile,
    method,
    endpoint: endpoint.slice(0, 120),
  };
  if (volumeSloDuration) volumeSloDuration.add(ms, tags);
  if (volumeSloViolation) volumeSloViolation.add(violated ? 1 : 0, tags);
  recordEndpointViolation(profile, method, endpoint, violated);
  recordSignoffHttp(method, endpoint, ms);

  return { profile, endpoint, method, durationMs: ms, budgetMs: bucket.budgetMs, violated };
}

/**
 * Record a journey/step duration against step SLO budgets (for future journey integration).
 * @param {string} stepName
 * @param {number} durationMs
 * @param {object} [meta]
 */
export function recordVolumeSloStep(stepName, durationMs, meta = {}) {
  const env = volumeSloConfigFromEnv();
  if (!env.enabled) return null;

  const config = getEffectiveSloConfig();
  const profile =
    meta && meta.sloProfile
      ? normalizeProfileName(meta.sloProfile)
      : meta && meta.profile
        ? normalizeProfileName(meta.profile)
        : env.profileOverride || config.defaultProfile;

  const { bucket, violated } = recordStepSample(moduleStore, config, {
    step: stepName,
    durationMs,
    profile,
  });

  if (volumeSloViolation) {
    volumeSloViolation.add(violated ? 1 : 0, { profile, step: String(stepName).slice(0, 80) });
  }
  recordStepViolation(profile, stepName, violated);
  recordSignoffStep(stepName, durationMs);

  return {
    step: stepName,
    profile,
    durationMs,
    budgetMs: bucket.budgetMs,
    violated,
  };
}

/**
 * @returns {import('./volume-slo-core.js').VolumeSloSampleStore}
 */
export function getVolumeSloStore() {
  return moduleStore;
}

/**
 * Build summary from in-memory store (handleSummary path).
 * @param {object} [extra]
 */
export function buildVolumeSloReport(extra = {}) {
  const env = volumeSloConfigFromEnv();
  const config = getEffectiveSloConfig();
  const scenario = getActiveVolumeScenario();
  return buildVolumeSloSummary(
    moduleStore,
    config,
    Object.assign(
      {
        enabled: env.enabled,
        runId: env.runId || null,
        scenario: scenario.name,
        scenarioProfile: scenario.scenario.profile || config.defaultProfile,
      },
      extra,
    ),
  );
}

/**
 * Attach volume SLO JSON to handleSummary output map.
 * @param {Record<string, string>} out
 * @param {object} [extra]
 * @returns {Record<string, string>}
 */
export function attachVolumeSloToSummary(out, extra = {}) {
  const env = volumeSloConfigFromEnv();
  if (!env.enabled) return out || {};

  const rel = (__ENV.VOLUME_SLO_SUMMARY_JSON || 'reports/volume-slo/volume-slo-summary.json').trim();
  const report = buildVolumeSloReport(extra);
  return Object.assign({}, out || {}, {
    [rel]: JSON.stringify(report, null, 2),
  });
}

/**
 * Reset store (tests / multi-scenario scripts only).
 */
export function resetVolumeSloStoreForTest() {
  const fresh = createVolumeSloStore();
  moduleStore.endpoints = fresh.endpoints;
  moduleStore.steps = fresh.steps;
  moduleStore.profilesUsed = fresh.profilesUsed;
}

/**
 * Resolve write-profile SLO meta for full-platform creation HTTP calls.
 * @param {object} [meta]
 */
export function fullPlatformSloMeta(meta = {}) {
  if (!isVolumeSloEnabled()) return meta;
  return Object.assign({ sloProfile: 'write', module: 'full-platform' }, meta);
}

/** @returns {number} epoch ms */
export function startPhaseAStep() {
  return Date.now();
}

/**
 * @param {string} metricName one of PHASE_A_STEP_METRICS
 * @param {number} startMs
 * @param {{ ok?: boolean, skipped?: boolean, reason?: string }} [opts]
 */
export function completePhaseAStep(metricName, startMs, opts = {}) {
  if (!isVolumeSloEnabled()) return null;
  const durationMs = Math.max(0, Date.now() - startMs);
  const trend = phaseATrendRegistry[metricName];
  if (trend) trend.add(durationMs);
  const stepResult = recordVolumeSloStep(metricName, durationMs, {
    sloProfile: 'write',
    skipped: opts.skipped,
    reason: opts.reason,
  });
  if (opts.ok === false && stepResult && volumeSloViolation) {
    volumeSloViolation.add(1, { profile: 'write', step: metricName, kind: 'business_fail' });
  }
  return Object.assign({ metricName, durationMs }, stepResult || {});
}

/**
 * Record a Phase A step with zero duration (not yet implemented in orchestrator).
 * @param {string} metricName
 * @param {{ reason?: string }} [meta]
 */
export function skipPhaseAStep(metricName, meta = {}) {
  if (!isVolumeSloEnabled()) return null;
  return completePhaseAStep(metricName, Date.now(), {
    ok: true,
    skipped: true,
    reason: meta.reason || 'not_implemented',
  });
}

/**
 * Resolve Phase A SLO shard id (env > advisorSub hash > vu-iter fallback).
 * @param {object} [ctx]
 */
export function resolvePhaseASloShardId(ctx = {}) {
  const vu = ctx.vu != null ? ctx.vu : typeof __VU !== 'undefined' ? __VU : 0;
  const iteration = ctx.iteration != null ? ctx.iteration : typeof __ITER !== 'undefined' ? __ITER : 0;
  return resolveManifestShardId({
    envShardId: (ctx.envShardId || __ENV.PHASE_A_SHARD_ID || '').trim(),
    advisorSub: ctx.advisorSub,
    vu,
    iteration,
  });
}

/**
 * @param {string} [runId]
 * @param {string} [shardId]
 * @returns {string}
 */
export function resolvePhaseASloShardPath(runId, shardId) {
  const env = volumeSloConfigFromEnv();
  const raw = (runId || env.runId || `run-${Date.now()}`).trim();
  const safeTag = raw.replace(/[^a-zA-Z0-9._-]/g, '_');
  const sid = (shardId || resolvePhaseASloShardId()).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `reports/phase-a/${safeTag}/slo-shards/slo-${sid}.json`;
}

/**
 * Legacy single-process path (direct runs without fleet sharding).
 * @param {string} [runId]
 * @returns {string}
 */
export function resolvePhaseASloReportPath(runId) {
  const env = volumeSloConfigFromEnv();
  const raw = (runId || env.runId || `run-${Date.now()}`).trim();
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `reports/phase-a/${safe}/slo-summary.json`;
}

/**
 * Build k6 threshold lines for Phase A step metrics (write profile budgets).
 * @returns {Record<string, string[]>}
 */
export function buildPhaseAThresholds() {
  if (!isVolumeSloGateEnabled()) return {};
  let config;
  try {
    config = getEffectiveSloConfig();
  } catch {
    return {};
  }
  const prof = config.profiles.write;
  const thr = {
    volume_slo_violation_rate: ['rate<0.05'],
    slo_endpoint_violation_rate: ['rate<0.05'],
    slo_step_violation_rate: ['rate<0.05'],
  };
  for (let i = 0; i < PHASE_A_STEP_METRICS.length; i++) {
    const metric = PHASE_A_STEP_METRICS[i];
    const budget =
      (prof.stepBudgetMs && prof.stepBudgetMs[metric]) ||
      prof.defaultBudgetMs ||
      config.fallbackBudgetMs;
    thr[metric] = [`p(95)<${budget}`];
  }
  return thr;
}

/**
 * Phase A rows extracted from summary steps list.
 * @param {object} summary
 */
export function buildPhaseAStepRows(summary) {
  const steps = summary && summary.steps ? summary.steps : [];
  const set = new Set(PHASE_A_STEP_METRICS);
  return steps.filter((row) => set.has(row.step));
}

/**
 * Attach Phase A report to handleSummary output: reports/phase-a/{RunId}/slo-summary.json
 * @param {Record<string, string>} out
 * @param {object} [extra]
 */
export function attachPhaseASloToSummary(out, extra = {}) {
  const env = volumeSloConfigFromEnv();
  if (!env.enabled) return out || {};

  const summary = buildVolumeSloReport(
    Object.assign(
      {
        phase: 'A',
        integration: 'k6-full-platform-orchestrator',
        sloProfile: env.profileOverride || 'write',
      },
      extra,
    ),
  );
  summary.phaseA = {
    steps: buildPhaseAStepRows(summary),
    metrics: PHASE_A_STEP_METRICS.slice(),
  };
  if (env.gateEnabled) {
    const failOnEndpointP95 = ['1', 'true', 'yes', 'on'].includes(
      (__ENV.VOLUME_SLO_GATE_ENDPOINT_P95 || '').trim().toLowerCase(),
    );
    const gates = summary.gates || {};
    summary.gate = evaluateVolumeSloGate(summary, {
      phaseASteps: PHASE_A_STEP_METRICS,
      maxStepViolationRate: gates.maxStepP95ViolationRate,
      maxEndpointViolationRate: gates.maxEndpointP95ViolationRate,
      maxSingleRequestOverMaxMsRate: gates.maxSingleRequestOverMaxMsRate,
      failOnEndpointP95,
    });
  }

  summary.shardId = resolvePhaseASloShardId({
    advisorSub: extra.advisorSub,
    vu: extra.vu,
    iteration: extra.iteration,
  });

  const useShardPath =
    (__ENV.PHASE_A_SHARD_ID || '').trim() ||
    extra.shardId ||
    isPhaseAManifestExportEnabled();
  const rel = useShardPath
    ? resolvePhaseASloShardPath(extra.runId || env.runId, summary.shardId)
    : resolvePhaseASloReportPath(extra.runId || env.runId);

  const endpointSamples = summary.totals ? summary.totals.endpointSamples : 0;
  const stepSamples = summary.totals ? summary.totals.stepSamples : 0;
  const endpointViol = summary.rates && summary.rates.endpointViolationRate != null
    ? summary.rates.endpointViolationRate
    : 'n/a';
  const stepViol = summary.rates && summary.rates.stepViolationRate != null
    ? summary.rates.stepViolationRate
    : 'n/a';
  console.log(
    `[volume-slo] export phase=A shardId=${summary.shardId} path=${rel} ` +
      `endpointSamples=${endpointSamples} stepSamples=${stepSamples} ` +
      `endpointViolationRate=${endpointViol} stepViolationRate=${stepViol} ` +
      `gate=${summary.gate ? summary.gate.passed : 'n/a'}`,
  );

  return Object.assign({}, out || {}, {
    [rel]: JSON.stringify(summary, null, 2),
  });
}

function isPhaseAManifestExportEnabled() {
  return ['1', 'true', 'yes', 'on'].includes(
    (__ENV.PHASE_A_EXPORT_MANIFEST || '').trim().toLowerCase(),
  );
}

/**
 * Phase B journey report: reports/phase-b/{RunId}/slo-summary.json
 * @param {Record<string, string>} out
 * @param {object} [extra]
 */
export function attachPhaseBSloToSummary(out, extra = {}) {
  const env = volumeSloConfigFromEnv();
  if (!env.enabled) return out || {};

  const summary = buildVolumeSloReport(
    Object.assign(
      {
        phase: 'B',
        integration: 'k6-journey-advisor-critical',
        sloProfile: env.profileOverride || 'read',
      },
      extra,
    ),
  );
  const scenario = getActiveVolumeScenario();
  summary.scenario = scenario.name;
  summary.scenarioMetadata = {
    scenario: scenario.name,
    phaseBScenario: scenario.scenario.phaseBScenario || null,
    profile: scenario.scenario.profile || 'read',
  };
  if (dataLagRate(extra, summary)) {
    summary.rates = summary.rates || {};
    summary.rates.userLagRate = dataLagRate(extra, summary);
  }

  if (env.gateEnabled) {
    const failOnEndpointP95 = ['1', 'true', 'yes', 'on'].includes(
      (__ENV.VOLUME_SLO_GATE_ENDPOINT_P95 || '').trim().toLowerCase(),
    );
    const gates = summary.gates || {};
    summary.gate = evaluateVolumeSloGate(summary, {
      maxStepViolationRate: gates.maxStepP95ViolationRate,
      maxEndpointViolationRate: gates.maxEndpointP95ViolationRate,
      maxSingleRequestOverMaxMsRate: gates.maxSingleRequestOverMaxMsRate,
      failOnEndpointP95,
    });
  }

  const runId = (extra.runId || env.runId || `phase-b-${Date.now()}`).replace(
    /[^a-zA-Z0-9._-]/g,
    '_',
  );
  const scenarioName = (
    env.scenarioName ||
    (__ENV.SCENARIO || '').trim() ||
    scenario.name ||
    'phase-b'
  ).replace(/[^a-zA-Z0-9._-]/g, '_');
  const rel = `reports/phase-b/${runId}/slo-summary.json`;
  const volumeSloRel = `reports/volume-slo/${scenarioName}-${runId}.json`;
  const json = JSON.stringify(summary, null, 2);
  return Object.assign({}, out || {}, {
    [rel]: json,
    [volumeSloRel]: json,
  });
}

/** @param {object} extra @param {object} summary */
function dataLagRate(extra, summary) {
  if (extra && extra.userLagRate != null) return extra.userLagRate;
  if (summary.rates && summary.rates.stepViolationRate != null) return summary.rates.stepViolationRate;
  return null;
}

/** Journey read-profile meta for observeHttp / recordVolumeSloHttp. */
export function journeyReadSloMeta(meta = {}) {
  if (!isVolumeSloEnabled()) return meta;
  return Object.assign({ sloProfile: 'read', module: 'journey' }, meta);
}

/**
 * Phase B k6 thresholds when VOLUME_SLO_GATE=1.
 * @returns {Record<string, string[]>}
 */
export function buildPhaseBThresholds() {
  if (!isVolumeSloGateEnabled()) return {};
  let config;
  try {
    config = getEffectiveSloConfig();
  } catch {
    return {};
  }
  const prof = config.profiles.read;
  const thr = {
    volume_slo_violation_rate: ['rate<0.05'],
    slo_endpoint_violation_rate: ['rate<0.05'],
    slo_step_violation_rate: ['rate<0.05'],
    user_lag_rate: ['rate<0.05'],
  };
  const journeySteps = [
    'journey_login_duration',
    'journey_dashboard_load_duration',
    'journey_open_client_duration',
    'journey_client_plans_load_duration',
    'journey_open_plan_duration',
    'journey_timeline_load_duration',
    'journey_income_expenses_load_duration',
    'journey_saving_pots_load_duration',
    'journey_projection_load_duration',
    'journey_cashflow_load_duration',
    'full_journey_duration',
  ];
  for (let i = 0; i < journeySteps.length; i++) {
    const metric = journeySteps[i];
    const budget = resolveEffectiveStepBudgetMs(metric, 'read');
    thr[metric] = [`p(95)<${budget}`];
  }
  return thr;
}

/**
 * Resolve Phase A volume counts from env or active scenario.
 * @returns {{ clientsPerAdvisor: number, plansPerClient: number }}
 */
export function resolvePhaseAVolumeCounts() {
  const envClients = parseInt(
    (__ENV.PHASE_A_CLIENTS_PER_ADVISOR || __ENV.FULL_PLATFORM_CLIENTS_PER_ADVISOR || '').trim(),
    10,
  );
  const envPlans = parseInt(
    (__ENV.PHASE_A_PLANS_PER_CLIENT || __ENV.FULL_PLATFORM_PLANS_PER_CLIENT || '').trim(),
    10,
  );
  let clients =
    Number.isFinite(envClients) && envClients > 0 ? envClients : null;
  let plans = Number.isFinite(envPlans) && envPlans > 0 ? envPlans : null;
  try {
    const { scenario } = getActiveVolumeScenario();
    if (clients == null && scenario.clientsPerAdvisor != null) {
      clients = Number(scenario.clientsPerAdvisor);
    }
    if (plans == null && scenario.plansPerClient != null) {
      plans = Number(scenario.plansPerClient);
    }
  } catch {
    /* defaults */
  }
  return {
    clientsPerAdvisor: clients != null ? Math.max(1, Math.floor(clients)) : 1,
    plansPerClient: plans != null ? Math.max(1, Math.floor(plans)) : 1,
  };
}
