/**
 * Pure Phase A manifest merge/validation — Node-testable (no k6 imports).
 */

/**
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeShardId(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

/**
 * Derive a stable shard id from advisorSub when PHASE_A_SHARD_ID is unset.
 * @param {string} advisorSub
 */
export function advisorSubShardId(advisorSub) {
  const sub = String(advisorSub || '').trim();
  if (!sub) return '';
  let h = 0;
  for (let i = 0; i < sub.length; i++) {
    h = (Math.imul(31, h) + sub.charCodeAt(i)) >>> 0;
  }
  return `adv-${h.toString(16).slice(0, 12)}`;
}

/**
 * Resolve unique manifest/SLO shard id.
 * Priority: env shardId > advisorSub hash > vu-iter fallback.
 * @param {{ envShardId?: string, advisorSub?: string, vu?: number|null, iteration?: number|null }} ctx
 */
export function resolveManifestShardId(ctx = {}) {
  const fromEnv = sanitizeShardId(ctx.envShardId);
  if (fromEnv) return fromEnv;
  const fromSub = advisorSubShardId(ctx.advisorSub);
  if (fromSub) return fromSub;
  const v = ctx.vu != null ? Number(ctx.vu) : 1;
  const it = ctx.iteration != null ? Number(ctx.iteration) : 0;
  return `vu-${v}-iter-${it}`;
}

/**
 * @param {unknown} raw
 * @returns {object}
 */
export function parseManifestShard(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[volume-manifest] shard must be a JSON object');
  }
  /** @type {Record<string, unknown>} */
  const o = raw;
  return {
    reportType: String(o.reportType || 'phase-a-manifest-shard'),
    runTag: o.runTag != null ? String(o.runTag) : '',
    shardId: o.shardId != null ? String(o.shardId) : '',
    advisorSub: o.advisorSub != null ? String(o.advisorSub) : '',
    advisorEmail: o.advisorEmail != null ? String(o.advisorEmail) : '',
    vu: o.vu != null ? Number(o.vu) : null,
    iteration: o.iteration != null ? Number(o.iteration) : null,
    clients: Array.isArray(o.clients) ? o.clients : [],
    counts: o.counts && typeof o.counts === 'object' ? o.counts : { clients: 0, plans: 0 },
    generatedAt: o.generatedAt != null ? String(o.generatedAt) : null,
  };
}

/**
 * Count successful clients/plans (excludes error-only stub rows).
 * @param {object[]} clients
 */
export function countManifestClientsPlans(clients) {
  let clientCount = 0;
  let planCount = 0;
  for (let i = 0; i < (clients || []).length; i++) {
    const c = clients[i];
    if (c && c.error) continue;
    clientCount += 1;
    const cfs = c && c.cashflows ? c.cashflows : [];
    planCount += cfs.length;
  }
  return { clients: clientCount, plans: planCount };
}

/**
 * @param {object[]} shards
 * @param {{
 *   runTag?: string,
 *   expectedClients?: number,
 *   expectedPlans?: number,
 *   expectedShards?: number,
 *   scenario?: object,
 *   iterations?: number,
 * }} [opts]
 */
export function mergePhaseAManifestShards(shards, opts = {}) {
  const list = shards || [];
  const runTag =
    (opts.runTag && String(opts.runTag).trim()) ||
    (list[0] && list[0].runTag ? String(list[0].runTag) : '');
  const advisors = [];
  let totalClients = 0;
  let totalPlans = 0;
  const advisorSubSeen = new Map();
  const duplicateAdvisorSubs = [];

  for (let i = 0; i < list.length; i++) {
    const s = parseManifestShard(list[i]);
    const shardId =
      s.shardId ||
      resolveManifestShardId({ advisorSub: s.advisorSub, vu: s.vu, iteration: s.iteration });
    if (s.advisorSub) {
      if (advisorSubSeen.has(s.advisorSub)) {
        duplicateAdvisorSubs.push({
          advisorSub: s.advisorSub,
          shardIds: [advisorSubSeen.get(s.advisorSub), shardId],
        });
      } else {
        advisorSubSeen.set(s.advisorSub, shardId);
      }
    }
    const tallies = countManifestClientsPlans(s.clients);
    totalClients += tallies.clients;
    totalPlans += tallies.plans;
    advisors.push({
      shardId,
      advisorSub: s.advisorSub,
      advisorEmail: s.advisorEmail,
      vu: s.vu,
      iteration: s.iteration,
      clients: s.clients,
      counts: tallies,
      generatedAt: s.generatedAt,
    });
  }

  const expectedClients =
    opts.expectedClients != null ? Number(opts.expectedClients) : null;
  const expectedPlans = opts.expectedPlans != null ? Number(opts.expectedPlans) : null;
  const expectedShards =
    opts.expectedShards != null ? Number(opts.expectedShards) : null;
  const duplicateAdvisorOk = duplicateAdvisorSubs.length === 0;
  const validation = {
    scenario: opts.scenario || null,
    iterations: opts.iterations != null ? Number(opts.iterations) : 1,
    expectedClients,
    expectedPlans,
    expectedShards,
    actualClients: totalClients,
    actualPlans: totalPlans,
    actualShards: list.length,
    clientCountOk: expectedClients == null || totalClients === expectedClients,
    planCountOk: expectedPlans == null || totalPlans === expectedPlans,
    shardCountOk: expectedShards == null || list.length === expectedShards,
    duplicateAdvisorOk,
    duplicateAdvisorSubs,
    passed:
      (expectedClients == null || totalClients === expectedClients) &&
      (expectedPlans == null || totalPlans === expectedPlans) &&
      (expectedShards == null || list.length === expectedShards) &&
      duplicateAdvisorOk,
  };

  return {
    reportType: 'phase-a-manifest',
    generatedAt: new Date().toISOString(),
    runTag,
    scenario: opts.scenario && opts.scenario.scenarioName ? opts.scenario.scenarioName : null,
    phaseBScenario:
      opts.scenario && opts.scenario.phaseBScenario ? opts.scenario.phaseBScenario : null,
    manifestProfileFile:
      opts.scenario && opts.scenario.manifestProfileFile
        ? opts.scenario.manifestProfileFile
        : null,
    shardCount: list.length,
    advisors,
    totals: { clients: totalClients, plans: totalPlans },
    validation,
  };
}

/**
 * Flatten manifest to all client/cashflow targets (Phase B read distribution).
 * @param {object} manifest
 * @returns {object[]}
 */
export function flattenManifestTargets(manifest) {
  const targets = [];
  if (!manifest || !Array.isArray(manifest.advisors)) return targets;
  for (let ai = 0; ai < manifest.advisors.length; ai++) {
    const advisor = manifest.advisors[ai];
    const clients = advisor.clients || [];
    for (let ci = 0; ci < clients.length; ci++) {
      const client = clients[ci];
      if (client && client.error) continue;
      const cashflows = client.cashflows || [];
      if (!cashflows.length) continue;
      for (let pi = 0; pi < cashflows.length; pi++) {
        const cf = cashflows[pi];
        if (!cf || !cf.cashflowId) continue;
        targets.push({
          advisorSub: advisor.advisorSub,
          advisorEmail: advisor.advisorEmail,
          shardId: advisor.shardId || null,
          clientId: client.clientId,
          cashflowId: cf.cashflowId,
          planName: cf.planName != null ? cf.planName : undefined,
          uniqueTag: client.uniqueTag || null,
        });
      }
    }
  }
  return targets;
}

/**
 * Pick manifest client/cashflow for a VU (Phase B read journeys).
 * @param {object} manifest merged manifest
 * @param {number} vu 1-based
 */
export function selectManifestTargetForVu(manifest, vu) {
  const targets = flattenManifestTargets(manifest);
  if (!targets.length) return null;
  const idx = Math.max(0, (Number(vu) || 1) - 1) % targets.length;
  return targets[idx];
}

/**
 * Merge Phase A SLO shard summaries into a fleet rollup.
 * @param {object[]} shards
 * @param {{ runTag?: string, expectedShards?: number }} [opts]
 */
/**
 * Parse k6 handleSummary metric keys like `phase_a_manifest_plan{client_id:abc}`.
 * @param {string} key
 * @param {string} metricPrefix
 * @returns {Record<string, string>|null}
 */
export function parseK6TaggedMetricKey(key, metricPrefix) {
  const prefix = `${metricPrefix}{`;
  if (!key || !key.startsWith(prefix)) return null;
  const open = key.indexOf('{');
  const close = key.lastIndexOf('}');
  if (open < 0 || close <= open) return null;
  /** @type {Record<string, string>} */
  const tags = {};
  const inner = key.slice(open + 1, close);
  for (const part of inner.split(',')) {
    const eq = part.indexOf(':');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) tags[k] = v;
  }
  return tags;
}

/**
 * Rebuild a manifest shard from k6 Counter metrics (VU-safe; survives handleSummary).
 * @param {object} [data] — handleSummary data
 * @param {object} [fallback] — env defaults when meta tags missing
 * @returns {object|null}
 */
export function buildManifestShardFromK6SummaryMetrics(data, fallback = {}) {
  const metrics = data && data.metrics ? data.metrics : null;
  if (!metrics) return null;

  /** @type {Record<string, string>|null} */
  let meta = null;
  /** @type {Array<Record<string, string>>} */
  const planRows = [];
  /** @type {Array<Record<string, string>>} */
  const errorRows = [];

  for (const key of Object.keys(metrics)) {
    const m = metrics[key];
    const count =
      m && m.values && m.values.count != null ? Number(m.values.count) : 0;
    if (!count || count <= 0) continue;

    if (key.startsWith('phase_a_manifest_shard{')) {
      meta = parseK6TaggedMetricKey(key, 'phase_a_manifest_shard');
    } else if (key.startsWith('phase_a_manifest_plan{')) {
      const tags = parseK6TaggedMetricKey(key, 'phase_a_manifest_plan');
      if (tags) {
        for (let i = 0; i < count; i++) planRows.push(tags);
      }
    } else if (key.startsWith('phase_a_manifest_client_error{')) {
      const tags = parseK6TaggedMetricKey(key, 'phase_a_manifest_client_error');
      if (tags) {
        for (let i = 0; i < count; i++) errorRows.push(tags);
      }
    }
  }

  if (!meta && planRows.length === 0 && errorRows.length === 0) return null;

  const runTag =
    (meta && meta.run_tag) ||
    (fallback.runTag != null ? String(fallback.runTag) : '') ||
    '';
  const shardId =
    (meta && meta.shard_id) ||
    (fallback.shardId != null ? String(fallback.shardId) : '') ||
    '';
  const scenario =
    (meta && meta.scenario) ||
    (fallback.scenario != null ? String(fallback.scenario) : '') ||
    '';

  /** @type {Map<string, { clientId: string, uniqueTag: string, cashflows: object[] }>} */
  const byClient = new Map();
  for (let i = 0; i < planRows.length; i++) {
    const row = planRows[i];
    const clientId = row.client_id != null ? String(row.client_id) : '';
    if (!clientId) continue;
    if (!byClient.has(clientId)) {
      byClient.set(clientId, {
        clientId,
        uniqueTag: row.unique_tag != null ? String(row.unique_tag) : '',
        cashflows: [],
      });
    }
    const entry = byClient.get(clientId);
    const cfId = row.cashflow_id != null ? String(row.cashflow_id) : '';
    if (!cfId) continue;
    entry.cashflows.push({
      cashflowId: cfId,
      planName: row.plan_name != null ? String(row.plan_name) : undefined,
    });
  }

  /** @type {object[]} */
  const clients = Array.from(byClient.values());
  for (let i = 0; i < errorRows.length; i++) {
    const row = errorRows[i];
    clients.push({
      clientId: '',
      uniqueTag: row.unique_tag != null ? String(row.unique_tag) : '',
      cashflows: [],
      error: row.error != null ? String(row.error) : 'error',
    });
  }

  const counts = countManifestClientsPlans(clients);
  return {
    reportType: 'phase-a-manifest-shard',
    generatedAt: new Date().toISOString(),
    runTag,
    shardId,
    scenario: scenario || undefined,
    runId: runTag || undefined,
    advisorIndex:
      meta && meta.advisor_index != null && meta.advisor_index !== ''
        ? parseInt(meta.advisor_index, 10)
        : fallback.advisorIndex != null
          ? Number(fallback.advisorIndex)
          : null,
    advisorSub: meta && meta.advisor_sub != null ? String(meta.advisor_sub) : '',
    advisorEmail: meta && meta.advisor_email != null ? String(meta.advisor_email) : '',
    vu: meta && meta.vu != null && meta.vu !== '' ? parseInt(meta.vu, 10) : fallback.vu ?? null,
    iteration:
      meta && meta.iteration != null && meta.iteration !== ''
        ? parseInt(meta.iteration, 10)
        : fallback.iteration ?? null,
    clients,
    counts,
  };
}

export function mergePhaseASloShards(shards, opts = {}) {
  const list = shards || [];
  const runTag =
    (opts.runTag && String(opts.runTag).trim()) ||
    (list[0] && list[0].runId ? String(list[0].runId) : '');
  let passed = 0;
  let failed = 0;
  for (let i = 0; i < list.length; i++) {
    const g = list[i] && list[i].gate;
    if (g && g.passed === false) failed += 1;
    else if (g && g.passed === true) passed += 1;
  }
  const expectedShards =
    opts.expectedShards != null ? Number(opts.expectedShards) : null;
  return {
    reportType: 'phase-a-slo-fleet',
    generatedAt: new Date().toISOString(),
    runTag,
    shardCount: list.length,
    shards: list,
    fleet: {
      gatePassed: passed,
      gateFailed: failed,
    },
    validation: {
      expectedShards,
      actualShards: list.length,
      shardCountOk: expectedShards == null || list.length === expectedShards,
      passed: expectedShards == null || list.length === expectedShards,
    },
  };
}
