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
import { endpointBudgetKey, parseVolumeSloConfig } from './volume-slo-core.js';

export { VOLUME_SIGNOFF_SHARD_MARKER };

const STORE_KEY = '__volumeSignoffStore';
const CONFIG_OPEN_FALLBACKS = Object.freeze([
  '../../config/volume-api-slo.json',
  '../config/volume-api-slo.json',
  'config/volume-api-slo.json',
]);

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
    const stripped = p.replace(/^\.\//, '');
    const candidates = [p];
    if (!/^[A-Za-z]:[\\/]/.test(p) && !p.startsWith('/') && !p.startsWith('\\\\')) {
      try {
        candidates.push(String(import.meta.resolve('../../' + stripped)));
      } catch {
        /* ignore */
      }
      candidates.push('../../' + stripped, '../' + stripped);
    }
    for (let j = 0; j < candidates.length; j++) {
      const tryPath = candidates[j];
      if (!tryPath || seen.has('try:' + tryPath)) continue;
      seen.add('try:' + tryPath);
      try {
        return loadSignoffConfigFromObject(JSON.parse(open(tryPath)));
      } catch {
        /* try next */
      }
    }
  }
  throw new Error('[volume-signoff] could not open volume-api-slo.json');
}

function getSignoffConfig() {
  if (cachedSignoffConfig) return cachedSignoffConfig;
  const preferred = (__ENV.VOLUME_SLO_FILE || __ENV.VOLUME_SLO_CONFIG || CONFIG_OPEN_FALLBACKS[0]).trim();
  cachedSignoffConfig = openSignoffJsonWithFallbacks(preferred);
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
