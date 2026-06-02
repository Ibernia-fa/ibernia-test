/**
 * k6 runtime volume sign-off shard store + stdout marker (VU-local).
 */
import {
  VOLUME_SIGNOFF_SHARD_MARKER,
  PHASE_A_SIGNOFF_SPECS,
  PHASE_B_SIGNOFF_SPECS,
  buildSignoffRowTemplates,
  applySamplesToRows,
  buildSignoffShard,
  loadSignoffConfigFromObject,
} from './volume-signoff-core.js';
import {
  CONFIG_OPEN_FALLBACKS,
  DEFAULT_CONFIG_PATH,
  endpointBudgetKey,
  parseVolumeSloConfig,
} from './volume-slo-core.js';

export { VOLUME_SIGNOFF_SHARD_MARKER };

const STORE_KEY = '__volumeSignoffStore';

/** Minimal fallback when config file is missing (matches config/volume-api-slo.json shape). */
function getEmbeddedSignoffConfig() {
  return loadSignoffConfigFromObject(
    parseVolumeSloConfig({
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
          },
          stepBudgetMs: {
            login: 1500,
            dashboard_load: 2500,
            open_client: 2000,
            cashflow_load: 3000,
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
            journey_create_client_duration: 4000,
            journey_create_base_plan_duration: 5000,
            journey_full_plan_build_duration: 30000,
          },
        },
      },
    }),
  );
}

/** @type {import('./volume-slo-core.js').VolumeSloConfig|null} */
let cachedSignoffConfig = null;

function signoffEnabled() {
  const slo = (__ENV.VOLUME_SLO || '').trim().toLowerCase();
  const gate = (__ENV.VOLUME_SLO_GATE || '').trim().toLowerCase();
  const signoff = (__ENV.VOLUME_SIGNOFF || '').trim().toLowerCase();
  return (
    ['1', 'true', 'yes', 'on'].includes(slo) ||
    ['1', 'true', 'yes', 'on'].includes(gate) ||
    ['1', 'true', 'yes', 'on'].includes(signoff)
  );
}

function openSignoffJsonWithFallbacks(preferred) {
  const seen = new Set();
  const paths = [preferred].concat(CONFIG_OPEN_FALLBACKS);
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    if (!p || seen.has(p)) continue;
    seen.add(p);
    try {
      return loadSignoffConfigFromObject(JSON.parse(open(p)));
    } catch {
      /* try next */
    }
  }
  return null;
}

function getSignoffConfig() {
  if (cachedSignoffConfig) return cachedSignoffConfig;
  const preferred = (__ENV.VOLUME_SLO_FILE || __ENV.VOLUME_SLO_CONFIG || DEFAULT_CONFIG_PATH).trim();
  cachedSignoffConfig = openSignoffJsonWithFallbacks(preferred);
  if (!cachedSignoffConfig) {
    console.warn(`[volume-signoff] could not open ${preferred}; using embedded defaults.`);
    cachedSignoffConfig = getEmbeddedSignoffConfig();
  }
  return cachedSignoffConfig;
}

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = { steps: Object.create(null), http: Object.create(null) };
  }
  return globalThis[STORE_KEY];
}

/**
 * @param {string} metric
 * @param {number} durationMs
 */
export function recordSignoffStep(metric, durationMs) {
  if (!signoffEnabled()) return;
  const ms = Math.max(0, Number(durationMs) || 0);
  getStore().steps[String(metric)] = ms;
}

/**
 * @param {string} method
 * @param {string} endpoint
 * @param {number} durationMs
 */
export function recordSignoffHttp(method, endpoint, durationMs) {
  if (!signoffEnabled()) return;
  const key = endpointBudgetKey(method, endpoint);
  const ms = Math.max(0, Number(durationMs) || 0);
  const store = getStore();
  const prev = store.http[key];
  store.http[key] = prev == null ? ms : Math.max(prev, ms);
}

/**
 * @param {'A'|'B'} phase
 * @param {'read'|'write'} profile
 * @param {object} meta
 */
export function buildVolumeSignoffShardPayload(phase, profile, meta = {}) {
  const config = getSignoffConfig();
  const specs = phase === 'B' ? PHASE_B_SIGNOFF_SPECS : PHASE_A_SIGNOFF_SPECS;
  const templates = buildSignoffRowTemplates(specs, profile, config);
  const store = getStore();
  const rows = applySamplesToRows(templates, {
    steps: store.steps,
    http: store.http,
  });
  return buildSignoffShard({
    phase,
    profile,
    runTag: meta.runTag || null,
    shardId: meta.shardId || null,
    advisorEmail: meta.advisorEmail || null,
    k6ExitCode: meta.k6ExitCode != null ? meta.k6ExitCode : null,
    source: 'k6-marker',
    rows,
  });
}

/**
 * @param {'A'|'B'} phase
 * @param {'read'|'write'} profile
 * @param {object} meta
 */
export function emitVolumeSignoffShardMarker(phase, profile, meta = {}) {
  if (!signoffEnabled()) return null;
  const shard = buildVolumeSignoffShardPayload(phase, profile, meta);
  console.log(`${VOLUME_SIGNOFF_SHARD_MARKER}${JSON.stringify(shard)}`);
  return shard;
}

export function resetVolumeSignoffStore() {
  delete globalThis[STORE_KEY];
}
