/**
 * Pure Phase A summary builders — Node-testable (no fs/k6).
 */
import { countManifestClientsPlans } from './volume-manifest-core.js';
import { buildQuotaBreachSummary, signoffJourneyLabel } from './volume-signoff-core.js';

/**
 * @param {object|null|undefined} manifest
 * @param {string} shardId
 */
function manifestAdvisorRow(manifest, shardId) {
  const list = manifest && Array.isArray(manifest.advisors) ? manifest.advisors : [];
  return list.find((a) => a && String(a.shardId) === shardId) || null;
}

/**
 * @param {object|null|undefined} runMeta
 * @param {string} shardId
 */
function runAdvisorRow(runMeta, shardId) {
  const list = runMeta && Array.isArray(runMeta.advisorRuns) ? runMeta.advisorRuns : [];
  return list.find((r) => r && String(r.advisorKey || r.shardId) === shardId) || null;
}

/**
 * @param {object[]} clients
 */
function clientErrorNote(clients) {
  const errs = (clients || []).filter((c) => c && c.error).map((c) => String(c.error));
  if (!errs.length) return '';
  const uniq = [...new Set(errs)];
  return uniq.join(', ');
}

/**
 * @param {{
 *   runMeta?: object|null,
 *   manifest?: object|null,
 *   signoffSection?: object|null,
 *   sloGate?: { passed?: boolean }|null,
 * }} ctx
 */
export function buildPhaseAAdvisorExecutionSummary(ctx = {}) {
  const runMeta = ctx.runMeta || null;
  const manifest = ctx.manifest || null;
  const signoffSection = ctx.signoffSection || null;
  const validation = manifest && manifest.validation ? manifest.validation : null;

  const advisorCount =
    runMeta && runMeta.advisors != null
      ? Number(runMeta.advisors)
      : validation && validation.expectedShards != null
        ? Number(validation.expectedShards)
        : manifest && Array.isArray(manifest.advisors)
          ? manifest.advisors.length
          : 0;

  const clientsPerAdvisor =
    runMeta && runMeta.clientsPerAdvisor != null
      ? Number(runMeta.clientsPerAdvisor)
      : validation && validation.expectedClients != null && advisorCount > 0
        ? Math.floor(Number(validation.expectedClients) / advisorCount)
        : 0;
  const plansPerClient =
    runMeta && runMeta.plansPerClient != null
      ? Number(runMeta.plansPerClient)
      : clientsPerAdvisor > 0 && validation && validation.expectedPlans != null && advisorCount > 0
        ? Math.floor(Number(validation.expectedPlans) / (advisorCount * clientsPerAdvisor))
        : 0;
  const expectedPlansPerAdvisor = clientsPerAdvisor * plansPerClient;

  const quotaSummary = signoffSection ? buildQuotaBreachSummary(signoffSection) : buildQuotaBreachSummary(null);
  const latencyOverSet = new Set(quotaSummary.byAdvisor.map((a) => a.shardId));

  /** @type {Set<string>} */
  const shardIds = new Set();
  if (runMeta && Array.isArray(runMeta.advisorRuns)) {
    for (const r of runMeta.advisorRuns) {
      if (r && r.advisorKey) shardIds.add(String(r.advisorKey));
    }
  }
  if (manifest && Array.isArray(manifest.advisors)) {
    for (const a of manifest.advisors) {
      if (a && a.shardId) shardIds.add(String(a.shardId));
    }
  }
  for (let i = 0; i < advisorCount; i++) {
    shardIds.add(`advisor-${String(i).padStart(2, '0')}`);
  }

  const processFailedKeys = new Set(
    (runMeta && Array.isArray(runMeta.failedJobs) ? runMeta.failedJobs : [])
      .filter((k) => k && k !== 'manifest-merge' && k !== 'slo-merge')
      .concat(
        (runMeta && Array.isArray(runMeta.advisorRuns) ? runMeta.advisorRuns : [])
          .filter((r) => r && r.jobFailed && r.advisorKey)
          .map((r) => String(r.advisorKey)),
      ),
  );

  /** @type {object[]} */
  const advisors = [];
  for (const shardId of [...shardIds].sort()) {
    if (!/^advisor-\d+$/.test(shardId) && !shardId.startsWith('advisor-')) continue;

    const run = runAdvisorRow(runMeta, shardId);
    const row = manifestAdvisorRow(manifest, shardId);
    const clients = row && Array.isArray(row.clients) ? row.clients : [];
    const counts =
      row && row.counts && typeof row.counts === 'object'
        ? {
            clients: Number(row.counts.clients) || 0,
            plans: Number(row.counts.plans) || 0,
          }
        : countManifestClientsPlans(clients);

    const dataComplete =
      clientsPerAdvisor > 0 &&
      expectedPlansPerAdvisor > 0 &&
      counts.clients >= clientsPerAdvisor &&
      counts.plans >= expectedPlansPerAdvisor;
    const dataPartial = !dataComplete;
    const dataEmpty = counts.clients === 0 && counts.plans === 0;

    const processFailed = processFailedKeys.has(shardId) || !!(run && run.jobFailed);
    const manifestMissing =
      !row ||
      (dataEmpty && !row.advisorEmail && !row.advisorSub && run && run.jobState === 'Failed');
    const overLatency = latencyOverSet.has(shardId);

    /** @type {string[]} */
    const notes = [];
    if (processFailed) {
      const code = run && run.exitCode != null ? run.exitCode : 'n/a';
      notes.push(`process failed (exitCode=${code})`);
    }
    if (manifestMissing && !row) notes.push('manifest shard missing');
    else if (manifestMissing) notes.push('manifest shard empty or invalid');
    const errNote = clientErrorNote(clients);
    if (errNote) notes.push(errNote);
    if (overLatency) notes.push('exceeded latency budget');
    if (dataEmpty && !processFailed && !errNote) notes.push('no clients seeded');

    let status = 'Success';
    if (processFailed && dataEmpty) status = 'Failed';
    else if (!dataComplete) status = 'Partial';
    else if (overLatency) status = 'Slow';

    advisors.push({
      shardId,
      email: (row && row.advisorEmail) || (run && run.advisorEmail) || '',
      status,
      clients: counts.clients,
      plans: counts.plans,
      expectedClients: clientsPerAdvisor,
      expectedPlans: expectedPlansPerAdvisor,
      processFailed,
      dataComplete,
      dataPartial: !dataComplete,
      dataEmpty,
      manifestMissing,
      overLatency,
      notes: notes.join('; ') || '—',
    });
  }

  advisors.sort((a, b) => a.shardId.localeCompare(b.shardId));

  const successfulAdvisors = advisors.filter((a) => a.dataComplete && !a.processFailed).length;
  const failedAdvisorJobs = advisors.filter((a) => a.processFailed).length;
  const partialAdvisorResults = advisors.filter((a) => a.dataPartial).length;
  const advisorsOverLatency = quotaSummary.advisorsOverQuota || 0;

  const totals = manifest && manifest.totals ? manifest.totals : { clients: 0, plans: 0 };
  const expectedClients =
    validation && validation.expectedClients != null
      ? validation.expectedClients
      : runMeta && runMeta.expectedClients != null
        ? runMeta.expectedClients
        : null;
  const expectedPlans =
    validation && validation.expectedPlans != null
      ? validation.expectedPlans
      : runMeta && runMeta.expectedPlans != null
        ? runMeta.expectedPlans
        : null;

  const manifestOk = validation ? !!validation.passed : null;
  const dataOk =
    expectedClients != null && expectedPlans != null
      ? totals.clients >= expectedClients && totals.plans >= expectedPlans
      : null;
  const latencyOk = advisorsOverLatency === 0;
  const processOk = failedAdvisorJobs === 0;

  const overallPass =
    manifestOk === true && dataOk === true && latencyOk && processOk && partialAdvisorResults === 0;

  /** @type {string[]} */
  const failureReasons = [];
  if (manifestOk === false) failureReasons.push('Manifest validation failed');
  if (expectedClients != null && totals.clients < expectedClients) {
    failureReasons.push(`Clients seeded: ${totals.clients}/${expectedClients}`);
  }
  if (expectedPlans != null && totals.plans < expectedPlans) {
    failureReasons.push(`Plans seeded: ${totals.plans}/${expectedPlans}`);
  }
  if (failedAdvisorJobs > 0) {
    failureReasons.push(`${failedAdvisorJobs} advisor job(s) failed at process level`);
  }
  if (partialAdvisorResults > 0) {
    failureReasons.push(`${partialAdvisorResults} advisor(s) with partial or missing seed data`);
  }
  if (advisorsOverLatency > 0) {
    failureReasons.push(`${advisorsOverLatency} advisors exceeded latency budgets`);
  }
  const worstCreateClient = pickWorstLatencyMs(signoffSection, [
    'journey_create_client_duration',
    'POST /api/v1/Clients',
  ]);
  if (worstCreateClient != null && advisorsOverLatency > 0) {
    failureReasons.push(`Worst create-client latency: ${worstCreateClient} ms`);
  }
  if (runMeta && runMeta.manifestCollected != null && advisorCount > 0) {
    const collected = Number(runMeta.manifestCollected);
    if (collected < advisorCount) {
      failureReasons.push(`Manifest shards collected: ${collected}/${advisorCount}`);
    }
  }

  return {
    advisorCount,
    clientsPerAdvisor,
    plansPerClient,
    expectedPlansPerAdvisor,
    advisors,
    categories: {
      successfulAdvisors,
      failedAdvisorJobs,
      partialAdvisorResults,
      advisorsOverLatency,
    },
    quotaSummary,
    overallPass,
    failureReasons,
    sloGate: ctx.sloGate || null,
    worstCreateClientMs: worstCreateClient,
  };
}

/**
 * @param {object|null|undefined} signoffSection
 * @param {string[]} metrics
 */
function pickWorstLatencyMs(signoffSection, metrics) {
  if (!signoffSection || !signoffSection.byMetric) return null;
  let worst = null;
  for (const m of metrics) {
    const row = signoffSection.byMetric[m];
    if (row && row.worstOverMs != null) {
      const v = Number(row.worstOverMs);
      if (!Number.isNaN(v) && (worst == null || v > worst)) worst = v;
    }
  }
  return worst;
}

/**
 * @param {{
 *   runTag: string,
 *   runMeta?: object|null,
 *   manifest?: object|null,
 *   signoffSection?: object|null,
 *   sloGate?: { passed?: boolean }|null,
 *   sloFleet?: object|null,
 *   generatedAt?: string,
 * }} ctx
 * @returns {string}
 */
export function buildPhaseASummaryMarkdown(ctx) {
  const runTag = ctx.runTag || 'phase-a';
  const runMeta = ctx.runMeta || null;
  const manifest = ctx.manifest || null;
  const validation = manifest && manifest.validation ? manifest.validation : null;
  const totals = manifest && manifest.totals ? manifest.totals : { clients: 0, plans: 0 };
  const exec = buildPhaseAAdvisorExecutionSummary({
    runMeta,
    manifest,
    signoffSection: ctx.signoffSection,
    sloGate: ctx.sloGate,
  });

  const expectedClients =
    validation && validation.expectedClients != null
      ? validation.expectedClients
      : runMeta && runMeta.expectedClients != null
        ? runMeta.expectedClients
        : 'n/a';
  const expectedPlans =
    validation && validation.expectedPlans != null
      ? validation.expectedPlans
      : runMeta && runMeta.expectedPlans != null
        ? runMeta.expectedPlans
        : 'n/a';

  const elapsedSec = runMeta && runMeta.runElapsedSec != null ? runMeta.runElapsedSec : 'n/a';
  const scenario = runMeta && runMeta.volumeScenario ? runMeta.volumeScenario : 'n/a';
  const profilePath = runMeta && runMeta.manifestProfileFile ? runMeta.manifestProfileFile : 'n/a';
  const fmtBool = (v) => (v ? 'PASS' : 'FAIL');

  const lines = [
    `# Phase A volume summary — ${runTag}`,
    '',
    `# Overall Result: ${exec.overallPass ? 'PASS' : 'FAIL'}`,
    '',
    `Generated: ${ctx.generatedAt || new Date().toISOString()}`,
    '',
  ];

  if (!exec.overallPass && exec.failureReasons.length) {
    lines.push('## Failure reasons');
    lines.push('');
    for (const r of exec.failureReasons) {
      lines.push(`- ${r}`);
    }
    lines.push('');
  }

  lines.push('## Scenario');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| Scenario | ${scenario} |`);
  lines.push(`| Advisors | ${runMeta && runMeta.advisors != null ? runMeta.advisors : exec.advisorCount || 'n/a'} |`);
  lines.push(
    `| Parallel advisor jobs | ${runMeta && runMeta.concurrency != null ? runMeta.concurrency : 'n/a'} |`,
  );
  lines.push(
    `| Clients/advisor | ${runMeta && runMeta.clientsPerAdvisor != null ? runMeta.clientsPerAdvisor : exec.clientsPerAdvisor || 'n/a'} |`,
  );
  lines.push(
    `| Plans/client | ${runMeta && runMeta.plansPerClient != null ? runMeta.plansPerClient : exec.plansPerClient || 'n/a'} |`,
  );
  lines.push(`| Profile file | ${profilePath} |`);
  lines.push(`| Elapsed (s) | ${elapsedSec} |`);
  lines.push('');

  lines.push('## Data gates');
  lines.push('');
  lines.push('| Gate | Expected | Actual | Result |');
  lines.push('|------|----------|--------|--------|');
  lines.push(
    `| Clients | ${expectedClients} | ${totals.clients} | ${validation ? fmtBool(validation.clientCountOk) : 'n/a'} |`,
  );
  lines.push(
    `| Plans | ${expectedPlans} | ${totals.plans} | ${validation ? fmtBool(validation.planCountOk) : 'n/a'} |`,
  );
  lines.push(
    `| Shards | ${validation && validation.expectedShards != null ? validation.expectedShards : 'n/a'} | ${validation && validation.actualShards != null ? validation.actualShards : 'n/a'} | ${validation ? fmtBool(validation.shardCountOk) : 'n/a'} |`,
  );
  lines.push(
    `| Manifest validation | — | — | ${validation ? fmtBool(validation.passed) : 'n/a'} |`,
  );
  lines.push('');

  lines.push('## Advisor execution summary');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|----------|-------|');
  lines.push(`| Successful advisors | ${exec.categories.successfulAdvisors} |`);
  lines.push(`| Failed advisor jobs | ${exec.categories.failedAdvisorJobs} |`);
  lines.push(`| Partial advisor results | ${exec.categories.partialAdvisorResults} |`);
  lines.push(`| Advisors over latency budget | ${exec.categories.advisorsOverLatency} |`);
  lines.push('');

  const partialRows = exec.advisors.filter((a) => a.dataPartial);
  if (partialRows.length) {
    lines.push('## Partial advisor results');
    lines.push('');
    for (const a of partialRows) {
      lines.push(`- ${a.shardId} (${a.clients}/${a.expectedClients} clients, ${a.plans}/${a.expectedPlans} plans)`);
    }
    lines.push('');
  }

  const processFailedRows = exec.advisors.filter((a) => a.processFailed);
  if (processFailedRows.length) {
    lines.push('## Failed advisor jobs');
    lines.push('');
    for (const a of processFailedRows) {
      lines.push(`- ${a.shardId}${a.email ? ` (${a.email})` : ''}${a.notes !== '—' ? ` — ${a.notes}` : ''}`);
    }
    lines.push('');
  }

  lines.push('## Advisor detail');
  lines.push('');
  lines.push('| Advisor | Status | Clients | Plans | Notes |');
  lines.push('|---------|--------|---------|-------|-------|');
  for (const a of exec.advisors) {
    lines.push(
      `| ${a.shardId} | ${a.status} | ${a.clients}/${a.expectedClients} | ${a.plans}/${a.expectedPlans} | ${a.notes} |`,
    );
  }
  lines.push('');

  lines.push('## SLO gates');
  lines.push('');
  const sloGate = ctx.sloGate;
  if (sloGate) {
    lines.push(`- Fleet SLO gate: **${fmtBool(sloGate.passed)}**`);
  } else {
    lines.push('- Fleet SLO summary not found (slo-summary-fleet.json missing)');
  }
  const latencyCompliance =
    exec.categories.advisorsOverLatency === 0
      ? `PASS (0/${exec.quotaSummary.totalAdvisors || exec.advisorCount} advisors exceeded budget)`
      : `FAIL (${exec.categories.advisorsOverLatency}/${exec.quotaSummary.totalAdvisors || exec.advisorCount} advisors exceeded budget)`;
  lines.push(`- Advisor latency compliance: **${latencyCompliance}**`);
  lines.push(
    '_Fleet SLO gate evaluates aggregate endpoint/step violation rates; advisor latency compliance counts per-advisor sign-off budget breaches._',
  );

  const sloFleet = ctx.sloFleet;
  if (sloFleet && sloFleet.rates) {
    if (sloFleet.rates.endpointViolationRate != null) {
      lines.push(
        `- Endpoint violation rate: ${(sloFleet.rates.endpointViolationRate * 100).toFixed(2)}%`,
      );
    }
    if (sloFleet.rates.stepViolationRate != null) {
      lines.push(`- Step violation rate: ${(sloFleet.rates.stepViolationRate * 100).toFixed(2)}%`);
    }
    if (sloFleet.rates.hardMaxViolationRate != null) {
      lines.push(
        `- Hard max violation rate: ${(sloFleet.rates.hardMaxViolationRate * 100).toFixed(2)}%`,
      );
    }
  }
  lines.push('');

  if (ctx.signoffSection && exec.quotaSummary.totalAdvisors) {
    lines.push('## Latency budget (sign-off)');
    lines.push('');
    lines.push(formatQuotaBreachSection(exec.quotaSummary));
  } else {
    lines.push('## Latency budget (sign-off)');
    lines.push('');
    lines.push('_Sign-off fleet not found (signoff-fleet.json missing or empty)._');
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

/**
 * @param {ReturnType<typeof buildQuotaBreachSummary>} summary
 */
function formatQuotaBreachSection(summary) {
  const lines = [];
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
    const journeyList = a.journeys.map((j) => signoffJourneyLabel(j.metric)).join('; ');
    lines.push(`| ${a.shardId} | ${a.advisorEmail || 'n/a'} | ${a.metricsOver} | ${journeyList} |`);
  }
  lines.push('');
  return lines.join('\n');
}
