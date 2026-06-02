/**
 * Volume sign-off report core (Node-testable; safe to import from k6).
 */
import {
  parseVolumeSloConfig,
  resolveEndpointBudget,
  resolveEndpointHardMax,
  resolveStepBudget,
} from './volume-slo-core.js';

export const VOLUME_SIGNOFF_SHARD_MARKER = 'VOLUME_SIGNOFF_SHARD:';

/** @typedef {'step'|'http'} SignoffMetricKind */

/** Phase A write sign-off metrics (required unless optional). */
export const PHASE_A_SIGNOFF_SPECS = Object.freeze([
  { metric: 'journey_create_client_duration', kind: 'step' },
  { metric: 'journey_create_base_plan_duration', kind: 'step' },
  { metric: 'POST /api/v1/Clients', kind: 'http', method: 'POST', endpoint: '/api/v1/Clients' },
  { metric: 'POST /api/v1/cashflows', kind: 'http', method: 'POST', endpoint: '/api/v1/cashflows' },
  { metric: 'journey_calculate_projection_duration', kind: 'step', optional: true },
]);

/** Phase B read sign-off metrics. */
export const PHASE_B_SIGNOFF_SPECS = Object.freeze([
  { metric: 'journey_dashboard_load_duration', kind: 'step' },
  { metric: 'full_journey_duration', kind: 'step' },
  {
    metric: 'GET /api/v1/Clients/{advisorId}/all',
    kind: 'http',
    method: 'GET',
    endpoint: '/api/v1/Clients/{advisorId}/all',
  },
  {
    metric: 'GET /api/v1/client/{clientId}/cashflows',
    kind: 'http',
    method: 'GET',
    endpoint: '/api/v1/client/{clientId}/cashflows',
  },
  {
    metric: 'GET /api/v1/cashflows/{cashflowId}',
    kind: 'http',
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}',
  },
]);

/**
 * @param {object} config parsed volume-api-slo.json
 * @returns {import('./volume-slo-core.js').VolumeSloConfig}
 */
export function loadSignoffConfigFromObject(config) {
  return parseVolumeSloConfig(config);
}

/**
 * @param {object} spec
 * @param {'read'|'write'} profile
 * @param {import('./volume-slo-core.js').VolumeSloConfig} config
 */
export function resolveSignoffBudgets(spec, profile, config) {
  if (spec.kind === 'step') {
    const resolved = resolveStepBudget(config, profile, spec.metric);
    return { budgetMs: resolved.budgetMs, maxMs: null, profile: resolved.profile };
  }
  const resolved = resolveEndpointBudget(config, profile, spec.method, spec.endpoint);
  const hard = resolveEndpointHardMax(config, profile, spec.method, spec.endpoint, resolved.budgetMs);
  return { budgetMs: resolved.budgetMs, maxMs: hard.hardMaxMs, profile: resolved.profile };
}

/**
 * @param {object} input
 * @returns {object}
 */
export function buildSignoffRow(input) {
  const budgetMs = input.budgetMs != null ? Number(input.budgetMs) : null;
  const maxMs = input.maxMs != null ? Number(input.maxMs) : null;
  const actualMs = input.actualMs != null ? Number(input.actualMs) : null;
  const actualLabel = input.actualLabel || (input.kind === 'http' ? 'max' : 'p95');
  let over = null;
  let marginMs = null;
  if (actualMs != null && budgetMs != null) {
    over = actualMs > budgetMs;
    marginMs = Math.round(budgetMs - actualMs);
  }
  const overHardMax = actualMs != null && maxMs != null ? actualMs > maxMs : null;
  return {
    metric: input.metric,
    kind: input.kind,
    optional: !!input.optional,
    budgetMs,
    maxMs,
    actualMs: actualMs != null ? Math.round(actualMs * 10) / 10 : null,
    actualLabel,
    over,
    marginMs,
    overHardMax,
    note: input.note || null,
  };
}

/**
 * @param {object[]} specs
 * @param {'read'|'write'} profile
 * @param {import('./volume-slo-core.js').VolumeSloConfig} config
 */
export function buildSignoffRowTemplates(specs, profile, config) {
  return specs.map((spec) => {
    const budgets = resolveSignoffBudgets(spec, profile, config);
    return buildSignoffRow({
      metric: spec.metric,
      kind: spec.kind,
      optional: spec.optional,
      budgetMs: budgets.budgetMs,
      maxMs: budgets.maxMs,
      actualMs: null,
      actualLabel: spec.kind === 'http' ? 'max' : 'p95',
      note: spec.note || null,
    });
  });
}

/**
 * @param {object[]} rows
 * @param {{ requiredOnly?: boolean }} [opts]
 */
export function summarizeShardRows(rows, opts = {}) {
  const list = (rows || []).filter((r) => !opts.requiredOnly || !r.optional);
  const withActual = list.filter((r) => r.actualMs != null && r.budgetMs != null);
  const required = list.filter((r) => !r.optional);
  const requiredWithActual = required.filter((r) => r.actualMs != null && r.budgetMs != null);
  let underBudget = 0;
  let overBudget = 0;
  let worstMarginMs = null;
  let worstOverMs = null;
  for (const r of withActual) {
    if (r.over) {
      overBudget += 1;
      const overBy = r.actualMs - r.budgetMs;
      if (worstOverMs == null || overBy > worstOverMs) worstOverMs = Math.round(overBy);
    } else {
      underBudget += 1;
      if (r.marginMs != null && (worstMarginMs == null || r.marginMs < worstMarginMs)) {
        worstMarginMs = r.marginMs;
      }
    }
  }
  const failedShard =
    requiredWithActual.length > 0 && requiredWithActual.some((r) => r.over === true);
  return {
    totalRows: list.length,
    rowsWithActual: withActual.length,
    underBudget,
    overBudget,
    failedShard,
    worstMarginMs,
    worstOverMs,
  };
}

/**
 * @param {object[]} templates
 * @param {{ steps?: Record<string, number>, http?: Record<string, number> }} samples
 * @param {{ actualLabel?: string }} [opts]
 */
export function applySamplesToRows(templates, samples, opts = {}) {
  const steps = samples && samples.steps ? samples.steps : {};
  const http = samples && samples.http ? samples.http : {};
  return templates.map((tpl) => {
    const actualMs =
      tpl.kind === 'step'
        ? steps[tpl.metric] != null
          ? steps[tpl.metric]
          : null
        : http[tpl.metric] != null
          ? http[tpl.metric]
          : null;
    return buildSignoffRow({
      ...tpl,
      actualMs,
      actualLabel: opts.actualLabel || tpl.actualLabel,
    });
  });
}

/**
 * @param {object} shard
 * @returns {object}
 */
export function finalizeSignoffShard(shard) {
  const rows = shard.rows || [];
  const summary = summarizeShardRows(rows);
  return {
    ...shard,
    rows,
    summary: { ...summary, ...shard.summary },
  };
}

/**
 * @param {object} input
 * @returns {object}
 */
export function buildSignoffShard(input) {
  return finalizeSignoffShard({
    reportType: 'volume-signoff-shard',
    generatedAt: new Date().toISOString(),
    phase: input.phase,
    profile: input.profile,
    runTag: input.runTag || null,
    shardId: input.shardId,
    advisorEmail: input.advisorEmail || null,
    k6ExitCode: input.k6ExitCode != null ? input.k6ExitCode : null,
    source: input.source || 'k6-marker',
    rows: input.rows || [],
  });
}

/**
 * @param {object[]} shards
 * @param {number} [expectedShards]
 */
export function buildSignoffFleetSection(shards, expectedShards = shards.length) {
  const list = shards || [];
  /** @type {Record<string, object>} */
  const byMetric = {};
  const failedShardIds = [];
  let shardsAllUnder = 0;
  for (const s of list) {
    const reqRows = (s.rows || []).filter((r) => !r.optional && r.actualMs != null);
    const shardFailed = reqRows.some((r) => r.over);
    if (shardFailed) failedShardIds.push(s.shardId);
    else if (reqRows.length > 0) shardsAllUnder += 1;
    for (const r of s.rows || []) {
      if (r.optional || r.actualMs == null) continue;
      if (!byMetric[r.metric]) {
        byMetric[r.metric] = {
          under: 0,
          over: 0,
          failedShards: [],
          worstMarginMs: null,
          worstOverMs: null,
        };
      }
      const m = byMetric[r.metric];
      if (r.over) {
        m.over += 1;
        if (!m.failedShards.includes(s.shardId)) m.failedShards.push(s.shardId);
        const overBy = r.actualMs - r.budgetMs;
        if (m.worstOverMs == null || overBy > m.worstOverMs) m.worstOverMs = Math.round(overBy);
      } else {
        m.under += 1;
        if (r.marginMs != null && (m.worstMarginMs == null || r.marginMs < m.worstMarginMs)) {
          m.worstMarginMs = r.marginMs;
        }
      }
    }
  }
  return {
    expectedShards,
    actualShards: list.length,
    shardsAllUnder,
    shardsAnyOver: failedShardIds.length,
    failedShardIds,
    byMetric,
    shards: list,
  };
}

/**
 * @param {object} opts
 * @returns {object}
 */
export function mergeVolumeSignoffFleet(opts) {
  const phaseA = opts.phaseA
    ? buildSignoffFleetSection(opts.phaseA.shards, opts.phaseA.expectedShards)
    : null;
  const phaseB = opts.phaseB
    ? buildSignoffFleetSection(opts.phaseB.shards, opts.phaseB.expectedShards)
    : null;
  return {
    reportType: 'volume-signoff-fleet',
    generatedAt: new Date().toISOString(),
    pairRunTag: opts.pairRunTag || null,
    phaseARunTag: opts.phaseARunTag || null,
    phaseBRunTag: opts.phaseBRunTag || null,
    phaseA,
    phaseB,
  };
}

/**
 * @param {object} sloFleet
 * @param {object} signoffFleet
 */
export function attachSignoffToSloFleet(sloFleet, signoffFleet) {
  if (!signoffFleet || !signoffFleet.phaseA) return sloFleet;
  return {
    ...sloFleet,
    signoff: {
      phase: 'A',
      fleet: signoffFleet.phaseA,
    },
  };
}

/**
 * @param {object} section
 * @param {string} phaseLabel
 */
export function formatSignoffSectionMarkdown(section, phaseLabel) {
  if (!section || !section.shards || !section.shards.length) {
    return `## ${phaseLabel}\n\n_N/A — no sign-off shard data._\n`;
  }
  const n = section.expectedShards || section.actualShards;
  const lines = [];
  lines.push(`## ${phaseLabel}`);
  lines.push('');
  lines.push('### Fleet summary');
  lines.push('');
  lines.push(
    '| Metric | Under budget | Over budget | Failed shards | Worst margin (ms) | Worst over (ms) |',
  );
  lines.push('|--------|--------------|-------------|---------------|-------------------|-----------------|');
  for (const [metric, m] of Object.entries(section.byMetric || {}).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    lines.push(
      `| \`${metric}\` | ${m.under}/${n} | ${m.over}/${n} | ${m.failedShards.length ? m.failedShards.join(', ') : '—'} | ${m.worstMarginMs != null ? m.worstMarginMs : 'n/a'} | ${m.worstOverMs != null ? m.worstOverMs : 'n/a'} |`,
    );
  }
  lines.push('');
  lines.push(
    `**Shards all required metrics under budget:** ${section.shardsAllUnder}/${n} · **Any over:** ${section.shardsAnyOver}/${n}` +
      (section.failedShardIds.length ? ` · **Failed:** ${section.failedShardIds.join(', ')}` : ''),
  );
  lines.push('');
  lines.push('### Per-advisor budget table');
  lines.push('');
  lines.push('| shardId | email | metric | budgetMs | maxMs | actualMs | over? | marginMs |');
  lines.push('|--------|-------|--------|----------|-------|----------|-------|----------|');
  for (const s of section.shards) {
    for (const r of s.rows || []) {
      if (r.optional && r.actualMs == null) continue;
      lines.push(
        `| ${s.shardId} | ${s.advisorEmail || 'n/a'} | \`${r.metric}\` | ${r.budgetMs ?? 'n/a'} | ${r.maxMs ?? '—'} | ${r.actualMs != null ? `${r.actualMs} (${r.actualLabel})` : 'n/a'} | ${r.over == null ? 'n/a' : r.over ? '**yes**' : 'no'} | ${r.marginMs != null ? r.marginMs : 'n/a'} |`,
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}

export const DEFAULT_SIGNOFF_CONFIG_PATH = 'config/volume-api-slo.json';
