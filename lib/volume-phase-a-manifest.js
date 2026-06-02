/**

 * Phase A manifest shard accumulation for k6 full-platform orchestrator.

 */

import { Counter } from 'k6/metrics';

import {

  mergePhaseAManifestShards,

  resolveManifestShardId,

  buildManifestShardFromK6SummaryMetrics,

} from './volume-manifest-core.js';



export {

  mergePhaseAManifestShards,

  parseManifestShard,

  selectManifestTargetForVu,

  flattenManifestTargets,

  resolveManifestShardId,

  buildManifestShardFromK6SummaryMetrics,

  parseK6TaggedMetricKey,

} from './volume-manifest-core.js';



const STORE_KEY = '__k6PhaseAManifestStore';

/** k6 metrics survive VU → handleSummary (module globalThis store does not). */
const phaseAManifestShardMeta = new Counter('phase_a_manifest_shard');
const phaseAManifestPlan = new Counter('phase_a_manifest_plan');
const phaseAManifestClientError = new Counter('phase_a_manifest_client_error');

function tagValue(value, maxLen = 120) {
  const s = value != null ? String(value) : '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function recordManifestShardMeta(store) {
  phaseAManifestShardMeta.add(1, {
    shard_id: tagValue(store.shardId, 80),
    advisor_sub: tagValue(store.advisorSub, 80),
    advisor_email: tagValue(store.advisorEmail, 80),
    run_tag: tagValue(store.runTag, 80),
    scenario: tagValue(store.scenario, 40),
    advisor_index: store.advisorIndex != null ? tagValue(store.advisorIndex) : '',
    vu: store.vu != null ? tagValue(store.vu) : '',
    iteration: store.iteration != null ? tagValue(store.iteration) : '',
  });
}

function recordManifestClientRow(row, shardId) {
  const sid = tagValue(shardId, 80);
  if (row.error) {
    phaseAManifestClientError.add(1, {
      shard_id: sid,
      unique_tag: tagValue(row.uniqueTag, 80),
      error: tagValue(row.error, 40),
    });
    return;
  }
  const clientId = row.clientId != null ? String(row.clientId) : '';
  const uniqueTag = tagValue(row.uniqueTag, 80);
  const cashflows = row.cashflows || [];
  for (let i = 0; i < cashflows.length; i++) {
    const cf = cashflows[i];
    const cashflowId = cf && cf.cashflowId != null ? String(cf.cashflowId) : '';
    if (!clientId || !cashflowId) continue;
    phaseAManifestPlan.add(1, {
      shard_id: sid,
      client_id: tagValue(clientId, 80),
      cashflow_id: tagValue(cashflowId, 80),
      unique_tag: uniqueTag,
      plan_name: tagValue(cf.planName, 80),
    });
  }
}



function getStore() {

  if (!globalThis[STORE_KEY]) {

    globalThis[STORE_KEY] = {

      runTag: '',

      shardId: '',

      advisorSub: '',

      advisorEmail: '',

      vu: null,

      iteration: null,

      scenario: '',

      runId: '',

      advisorIndex: null,

      clients: [],

    };

  }

  return globalThis[STORE_KEY];

}



function truthy(name) {

  const raw = (__ENV[name] || '').trim().toLowerCase();

  return ['1', 'true', 'yes', 'on'].includes(raw);

}



/** @returns {boolean} */

export function isPhaseAManifestExportEnabled() {

  return truthy('PHASE_A_EXPORT_MANIFEST');

}



/** @returns {string} */

export function phaseARunTag() {

  return (

    (__ENV.PHASE_A_RUN_TAG || __ENV.FULL_PLATFORM_RUN_TAG || __ENV.VOLUME_SLO_RUN_ID || '').trim() ||

    `phase-a-${Date.now()}`

  );

}



/** @returns {string} */

export function phaseAShardId() {

  const store = getStore();

  if (store.shardId) return store.shardId;

  const resolved = resolveManifestShardId({

    envShardId: (__ENV.PHASE_A_SHARD_ID || '').trim(),

    advisorSub: store.advisorSub,

    vu: store.vu,

    iteration: store.iteration,

  });

  store.shardId = resolved;

  return resolved;

}



/**

 * @param {{ advisorSub: string, advisorEmail?: string, vu?: number, iteration?: number, shardId?: string }} ctx

 */

export function initPhaseAManifestShard(ctx) {

  if (!isPhaseAManifestExportEnabled()) return;

  const store = getStore();

  store.runTag = phaseARunTag();

  store.advisorSub = ctx.advisorSub != null ? String(ctx.advisorSub) : '';

  store.advisorEmail = ctx.advisorEmail != null ? String(ctx.advisorEmail) : '';

  store.vu = ctx.vu != null ? Number(ctx.vu) : null;

  store.iteration = ctx.iteration != null ? Number(ctx.iteration) : null;

  store.clients = [];

  store.shardId = resolveManifestShardId({

    envShardId: (ctx.shardId || __ENV.PHASE_A_SHARD_ID || '').trim(),

    advisorSub: store.advisorSub,

    vu: store.vu,

    iteration: store.iteration,

  });

  store.scenario = (__ENV.VOLUME_SCENARIO || __ENV.SCENARIO || '').trim();

  store.runId = phaseARunTag();

  store.advisorIndex =
    (__ENV.PHASE_A_ADVISOR_INDEX || '').trim() !== ''
      ? parseInt((__ENV.PHASE_A_ADVISOR_INDEX || '').trim(), 10)
      : ctx.advisorIndex != null
        ? Number(ctx.advisorIndex)
        : store.vu;

  console.log(
    `[volume-manifest] init shardId=${store.shardId} runTag=${store.runTag} advisorSub=${store.advisorSub} ` +
      `advisorEmail=${store.advisorEmail} vu=${store.vu} iteration=${store.iteration}`,
  );

  recordManifestShardMeta(store);

}



/**

 * @param {{ clientId?: string, uniqueTag?: string, cashflows?: object[], error?: string }} row

 */

export function appendPhaseAManifestClient(row) {

  if (!isPhaseAManifestExportEnabled()) return;

  const store = getStore();

  const entry = {

    clientId: row.clientId != null ? String(row.clientId) : '',

    uniqueTag: row.uniqueTag != null ? String(row.uniqueTag) : '',

    cashflows: (row.cashflows || []).map((cf) => ({

      cashflowId: String(cf.cashflowId),

      planName: cf.planName != null ? String(cf.planName) : undefined,

    })),

  };

  if (row.error) entry.error = String(row.error);

  store.clients.push(entry);

  recordManifestClientRow(entry, store.shardId || phaseAShardId());

}



export function emitPhaseAManifestShardMarker() {
  if (!isPhaseAManifestExportEnabled()) return;
  const shard = buildPhaseAManifestShard();
  console.log(`PHASE_A_MANIFEST_SHARD:${JSON.stringify(shard)}`);
}

/** @returns {object} */
export function buildPhaseAManifestShard() {

  const store = getStore();

  let planCount = 0;

  let clientCount = 0;

  for (let i = 0; i < store.clients.length; i++) {

    const c = store.clients[i];

    if (c.error) continue;

    clientCount += 1;

    planCount += (c.cashflows || []).length;

  }

  return {

    reportType: 'phase-a-manifest-shard',

    generatedAt: new Date().toISOString(),

    runTag: store.runTag || phaseARunTag(),

    shardId: phaseAShardId(),

    scenario: store.scenario || (__ENV.VOLUME_SCENARIO || __ENV.SCENARIO || '').trim() || undefined,

    runId: store.runId || phaseARunTag(),

    advisorIndex: store.advisorIndex != null ? store.advisorIndex : store.vu,

    advisorSub: store.advisorSub,

    advisorEmail: store.advisorEmail,

    vu: store.vu,

    iteration: store.iteration,

    clients: store.clients.slice(),

    counts: { clients: clientCount, plans: planCount },

  };

}



/**

 * @param {string} [runTag]

 * @param {string} [shardIdOverride]

 * @returns {string}

 */

export function resolvePhaseAManifestShardPath(runTag, shardIdOverride) {

  const tag = (runTag || phaseARunTag()).replace(/[^a-zA-Z0-9._-]/g, '_');

  const shardId = (shardIdOverride || phaseAShardId()).replace(/[^a-zA-Z0-9._-]/g, '_');

  return `reports/phase-a/${tag}/manifests/shard-${tag}-${shardId}.json`;

}



/**

 * @param {Record<string, string>} out

 * @param {object} [extra]

 */

export function attachPhaseAManifestShardToSummary(out, extra = {}, summaryData = null) {

  if (!isPhaseAManifestExportEnabled()) return out || {};

  const fromMetrics =
    summaryData &&
    buildManifestShardFromK6SummaryMetrics(summaryData, {
      runTag: extra.runTag || phaseARunTag(),
      shardId: (__ENV.PHASE_A_SHARD_ID || '').trim() || extra.shardId,
      scenario: (__ENV.VOLUME_SCENARIO || __ENV.SCENARIO || '').trim(),
      advisorIndex:
        (__ENV.PHASE_A_ADVISOR_INDEX || '').trim() !== ''
          ? parseInt((__ENV.PHASE_A_ADVISOR_INDEX || '').trim(), 10)
          : undefined,
    });

  const storeShard = buildPhaseAManifestShard();

  const shard =
    fromMetrics && (fromMetrics.clients.length > 0 || fromMetrics.counts.clients > 0)
      ? fromMetrics
      : storeShard;

  const source =
    fromMetrics && (fromMetrics.clients.length > 0 || fromMetrics.counts.clients > 0)
      ? 'metrics'
      : storeShard.clients.length > 0
        ? 'store'
        : 'log-marker-expected';

  const rel = resolvePhaseAManifestShardPath(extra.runTag || shard.runTag, shard.shardId);

  console.log(
    `[volume-manifest] export shardId=${shard.shardId} path=${rel} ` +
      `counts.clients=${shard.counts.clients} counts.plans=${shard.counts.plans} ` +
      `clientRows=${shard.clients.length} source=${source}`,
  );

  return Object.assign({}, out || {}, {

    [rel]: JSON.stringify(shard, null, 2),

  });

}



/**
 * k6 `open()` path candidates for repo-root-relative manifest paths.
 * @param {string} target
 * @returns {string[]}
 */
function openManifestCandidates(target) {
  const candidates = [target];
  const looksAbs =
    /^[a-zA-Z]:[\\/]/.test(target) || target.startsWith('\\\\') || target.startsWith('/');
  if (!looksAbs) {
    const stripped = target.replace(/^\.\//, '');
    try {
      candidates.push(String(import.meta.resolve('../../' + stripped)));
    } catch {
      /* ignore */
    }
    candidates.push('../../' + stripped, '../' + stripped);
  }
  const uniq = [];
  const seen = new Set();
  for (const p of candidates) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    uniq.push(p);
  }
  return uniq;
}

/**
 * Load merged manifest JSON for Phase B (k6 open).
 * @param {string} [pathOverride]
 */
export function loadPhaseBManifest(pathOverride) {
  const path = (
    pathOverride ||
    (__ENV.PHASE_B_MANIFEST_FILE ||
      __ENV.SCENARIO_MANIFEST_FILE ||
      __ENV.VOLUME_MANIFEST_FILE ||
      '').trim()
  );
  if (!path) return null;

  const errors = [];
  for (const tryPath of openManifestCandidates(path)) {
    try {
      const parsed = JSON.parse(open(tryPath));
      if (parsed && parsed.reportType === 'phase-a-manifest') return parsed;
      return mergePhaseAManifestShards([parsed], {});
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : String(e);
      errors.push(`${tryPath}: ${msg}`);
    }
  }

  console.warn(
    `[volume-manifest] Could not load manifest "${path}". Tried:\n  - ${errors.join('\n  - ')}`,
  );
  return null;
}


