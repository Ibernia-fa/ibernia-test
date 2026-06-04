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
  lines.push(formatQuotaBreachSummaryMarkdown(buildQuotaBreachSummary(section)));
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

/** Plain-language labels for sign-off metrics (journey steps / API calls). */
export const SIGNOFF_JOURNEY_LABELS = Object.freeze({
  journey_create_client_duration: 'Create client (write step)',
  journey_create_base_plan_duration: 'Create base plan (write step)',
  journey_calculate_projection_duration: 'Calculate projection (write step)',
  'POST /api/v1/Clients': 'Create client API',
  'POST /api/v1/cashflows': 'Create cashflow/plan API',
  journey_dashboard_load_duration: 'Dashboard clients list load',
  full_journey_duration: 'End-to-end advisor journey',
  'GET /api/v1/Clients/{advisorId}/all': 'List all clients for advisor',
  'GET /api/v1/client/{clientId}/cashflows': 'List client plans',
  'GET /api/v1/cashflows/{cashflowId}': 'Open cashflow/plan',
  'GET /api/v1/Reports/{cashflowId}': 'Get reports/projection API',
});

/**
 * @param {string} metric
 * @returns {string}
 */
export function signoffJourneyLabel(metric) {
  return SIGNOFF_JOURNEY_LABELS[metric] || metric;
}

/**
 * Summarize advisors that exceeded latency budget and which journey steps failed.
 * @param {object|null|undefined} section output of buildSignoffFleetSection
 */
export function buildQuotaBreachSummary(section) {
  if (!section?.shards?.length) {
    return {
      totalAdvisors: 0,
      advisorsOverQuota: 0,
      advisorsUnderQuota: 0,
      failedShardIds: [],
      byJourney: [],
      byAdvisor: [],
    };
  }
  const totalAdvisors = section.expectedShards || section.actualShards || section.shards.length;
  /** @type {object[]} */
  const byAdvisor = [];
  for (const s of section.shards) {
    const breached = (s.rows || []).filter((r) => !r.optional && r.over);
    if (!breached.length) continue;
    byAdvisor.push({
      shardId: s.shardId,
      advisorEmail: s.advisorEmail || null,
      metricsOver: breached.length,
      journeys: breached.map((r) => ({
        metric: r.metric,
        journeyName: signoffJourneyLabel(r.metric),
        actualMs: r.actualMs,
        budgetMs: r.budgetMs,
        marginMs: r.marginMs,
      })),
    });
  }
  byAdvisor.sort((a, b) => String(a.shardId).localeCompare(String(b.shardId)));

  const byJourney = Object.entries(section.byMetric || {})
    .map(([metric, m]) => ({
      metric,
      journeyName: signoffJourneyLabel(metric),
      usersOverQuota: m.over || 0,
      totalAdvisors,
      failedShardIds: m.failedShards || [],
      worstOverMs: m.worstOverMs,
    }))
    .filter((j) => j.usersOverQuota > 0)
    .sort((a, b) => b.usersOverQuota - a.usersOverQuota || a.journeyName.localeCompare(b.journeyName));

  return {
    totalAdvisors,
    advisorsOverQuota: section.shardsAnyOver != null ? section.shardsAnyOver : byAdvisor.length,
    advisorsUnderQuota:
      section.shardsAllUnder != null
        ? section.shardsAllUnder
        : Math.max(0, totalAdvisors - byAdvisor.length),
    failedShardIds: section.failedShardIds || byAdvisor.map((a) => a.shardId),
    byJourney,
    byAdvisor,
  };
}

/**
 * @param {ReturnType<typeof buildQuotaBreachSummary>} summary
 * @param {string} [phaseLabel]
 * @returns {string}
 */
export function formatQuotaBreachSummaryMarkdown(summary, phaseLabel = '') {
  const lines = [];
  if (phaseLabel) {
    lines.push(`### Quota breach — ${phaseLabel}`);
    lines.push('');
  } else {
    lines.push('### Quota breach summary');
    lines.push('');
  }
  if (!summary.totalAdvisors) {
    lines.push('_No sign-off shard data — quota breach summary unavailable._');
    lines.push('');
    return lines.join('\n');
  }
  lines.push(
    `**Advisors over latency budget:** ${summary.advisorsOverQuota}/${summary.totalAdvisors} · **All required metrics under budget:** ${summary.advisorsUnderQuota}/${summary.totalAdvisors}`,
  );
  lines.push('');
  if (summary.advisorsOverQuota === 0) {
    lines.push('_No advisors exceeded the latency budget — all monitored journey steps are within quota._');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('#### Impacted journey steps (fleet)');
  lines.push('');
  lines.push('| Journey step | Users over quota | Total advisors | Failed shard IDs | Worst over (ms) |');
  lines.push('|--------------|------------------|----------------|------------------|-----------------|');
  for (const j of summary.byJourney) {
    const ids = j.failedShardIds.length ? j.failedShardIds.join(', ') : '—';
    lines.push(
      `| ${j.journeyName} | ${j.usersOverQuota} | ${j.totalAdvisors} | ${ids} | ${j.worstOverMs != null ? j.worstOverMs : 'n/a'} |`,
    );
  }
  lines.push('');
  lines.push('#### Impacted advisors');
  lines.push('');
  lines.push('| shardId | email | metrics over | impacted journey steps |');
  lines.push('|---------|-------|--------------|------------------------|');
  for (const a of summary.byAdvisor) {
    const journeyList = a.journeys.map((j) => j.journeyName).join('; ');
    lines.push(
      `| ${a.shardId} | ${a.advisorEmail || 'n/a'} | ${a.metricsOver} | ${journeyList} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}
