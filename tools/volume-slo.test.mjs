/**
 * Unit tests for lib/volume-slo-core.js (Node built-in test runner).
 *
 * Run: node --test tools/volume-slo.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildPhaseAAdvisorExecutionSummary,
  buildPhaseASummaryMarkdown,
} from '../lib/phase-a-summary-core.js';
import {
  parseVolumeSloConfig,
  parseVolumeScenariosConfig,
  applyScenarioToSloConfig,
  resolveVolumeScenario,
  profileForHttpMethod,
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
  endpointBudgetKey,
  evaluateVolumeSloGate,
} from '../lib/volume-slo-core.js';
import {
  mergePhaseAManifestShards,
  parseManifestShard,
  selectManifestTargetForVu,
  flattenManifestTargets,
  resolveManifestShardId,
  advisorSubShardId,
  buildManifestShardFromK6SummaryMetrics,
} from '../lib/volume-manifest-core.js';
import { normalizeVolumeConfigOpenPath } from '../lib/volume-http-retry.js';
import {
  volumeFleetStaggerEnabledFromEnv,
  volumePreRunCleanupEnabledFromEnv,
} from '../lib/k6-load-cleanup-core.js';
import {
  buildSignoffFleetSection,
  buildQuotaBreachSummary,
  formatQuotaBreachSummaryMarkdown,
  signoffJourneyLabel,
} from '../lib/volume-signoff-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '..', 'config', 'volume-api-slo.json');
const scenariosPath = join(__dirname, '..', 'config', 'volume-scenarios.json');
const repoConfig = parseVolumeSloConfig(JSON.parse(readFileSync(configPath, 'utf8')));
const repoScenarios = parseVolumeScenariosConfig(JSON.parse(readFileSync(scenariosPath, 'utf8')));

test('parseVolumeSloConfig loads repo config with read and write profiles', () => {
  assert.equal(repoConfig.version, 1);
  assert.equal(repoConfig.defaultProfile, 'read');
  assert.ok(repoConfig.profiles.read.defaultBudgetMs > 0);
  assert.ok(repoConfig.profiles.write.defaultBudgetMs > 0);
  assert.equal(
    repoConfig.profiles.read.endpointBudgetMs['GET /api/v1/Clients/{advisorId}/all'],
    2500,
  );
});

test('profileForHttpMethod maps GET to read and POST to write', () => {
  assert.equal(profileForHttpMethod('GET'), 'read');
  assert.equal(profileForHttpMethod('HEAD'), 'read');
  assert.equal(profileForHttpMethod('POST'), 'write');
  assert.equal(profileForHttpMethod('PUT'), 'write');
});

test('normalizeEndpointPath replaces ids with placeholders', () => {
  assert.equal(
    normalizeEndpointPath('https://dev-api.ibernia.it/api/v1/Clients/507f1f77bcf86cd799439011'),
    '/api/v1/Clients/{id}',
  );
  assert.equal(
    normalizeEndpointPath('/api/v1/cashflows/550e8400-e29b-41d4-a716-446655440000/timelines'),
    '/api/v1/cashflows/{id}/timelines',
  );
});

test('resolveEndpointBudget uses read profile for GET clients all', () => {
  const r = resolveEndpointBudget(
    repoConfig,
    'read',
    'GET',
    '/api/v1/Clients/fa1b2c3d4e5f678901234567/all',
  );
  assert.equal(r.profile, 'read');
  assert.equal(r.budgetMs, 2500);
  assert.equal(r.key, 'GET /api/v1/Clients/{id}/all');
});

test('resolveEndpointBudget falls back to profile defaultBudgetMs', () => {
  const r = resolveEndpointBudget(repoConfig, 'read', 'GET', '/api/v1/unknown/route');
  assert.equal(r.budgetMs, repoConfig.profiles.read.defaultBudgetMs);
});

test('resolveStepBudget returns write step budgets', () => {
  const r = resolveStepBudget(repoConfig, 'write', 'cashflow_recalculate');
  assert.equal(r.profile, 'write');
  assert.equal(r.budgetMs, 5000);
  assert.equal(r.step, 'cashflow_recalculate');
});

test('calculateP95 and calculateViolationRate', () => {
  const samples = [100, 200, 300, 400, 500, 600, 700, 800, 900, 2000];
  assert.equal(calculateP95(samples), 2000);
  const viol = calculateViolationRate(samples, 500);
  assert.equal(viol.count, 10);
  assert.equal(viol.violations, 5);
  assert.equal(viol.violationRate, 0.5);
});

test('summarizeSamples computes distribution stats', () => {
  const s = summarizeSamples([10, 20, 30, 40, 50]);
  assert.equal(s.count, 5);
  assert.equal(s.minMs, 10);
  assert.equal(s.maxMs, 50);
  assert.equal(s.avgMs, 30);
  assert.equal(s.p95Ms, 50);
});

test('recordEndpointSample aggregates violations in store', () => {
  const store = createVolumeSloStore();
  recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{advisorId}/all',
    durationMs: 2000,
    profile: 'read',
  });
  recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{advisorId}/all',
    durationMs: 4000,
    profile: 'read',
  });
  const key = `read\0${endpointBudgetKey('GET', '/api/v1/Clients/{advisorId}/all')}`;
  const bucket = store.endpoints[key];
  assert.equal(bucket.durations.length, 2);
  assert.equal(bucket.violations, 1);
  assert.ok(store.profilesUsed.read);
});

test('recordStepSample tracks step durations', () => {
  const store = createVolumeSloStore();
  recordStepSample(store, repoConfig, {
    step: 'dashboard_load',
    durationMs: 3000,
    profile: 'read',
  });
  assert.equal(Object.keys(store.steps).length, 1);
  const row = Object.values(store.steps)[0];
  assert.equal(row.step, 'dashboard_load');
  assert.equal(row.violations, 1);
});

test('buildVolumeSloSummary produces endpoint and step rows with passFail', () => {
  const store = createVolumeSloStore();
  recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{id}',
    durationMs: 1500,
    profile: 'read',
  });
  recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{id}',
    durationMs: 1800,
    profile: 'read',
  });
  recordStepSample(store, repoConfig, {
    step: 'open_client',
    durationMs: 1900,
    profile: 'read',
  });
  const summary = buildVolumeSloSummary(store, repoConfig, { runId: 'test-run' });
  assert.equal(summary.reportType, 'volume-slo-summary');
  assert.equal(summary.runId, 'test-run');
  assert.equal(summary.endpoints.length, 1);
  assert.equal(summary.endpoints[0].passFail, 'pass');
  assert.equal(summary.steps.length, 1);
  assert.equal(summary.steps[0].step, 'open_client');
  assert.ok(summary.rates.endpointViolationRate != null);
});

test('evaluateVolumeSloGate fails when phase A step p95 exceeds budget', () => {
  const store = createVolumeSloStore();
  for (let i = 0; i < 10; i++) {
    recordStepSample(store, repoConfig, {
      step: 'journey_create_client_duration',
      durationMs: i < 9 ? 1000 : 9000,
      profile: 'write',
    });
  }
  const summary = buildVolumeSloSummary(store, repoConfig);
  const gate = evaluateVolumeSloGate(summary, {
    phaseASteps: ['journey_create_client_duration'],
    maxStepViolationRate: 0.05,
  });
  assert.equal(gate.enabled, true);
  assert.equal(gate.passed, false);
  assert.ok(gate.failedSteps.includes('journey_create_client_duration'));
});

test('parseVolumeSloConfig includes Phase A write step budgets', () => {
  assert.equal(repoConfig.profiles.write.stepBudgetMs.journey_full_plan_build_duration, 45000);
});

test('parseVolumeScenariosConfig loads phase-a and phase-b scenarios', () => {
  assert.equal(repoScenarios.version, 1);
  assert.ok(repoScenarios.scenarios['phase-a-write-volume']);
  assert.ok(repoScenarios.scenarios['phase-b-read-default']);
});

test('applyScenarioToSloConfig merges volume scenario overrides', () => {
  const { scenario } = resolveVolumeScenario(repoScenarios, 'phase-a-write-volume');
  const merged = applyScenarioToSloConfig(repoConfig, scenario);
  assert.equal(merged.defaultProfile, 'write');
  assert.equal(merged.profiles.write.endpointBudgetMs['POST /api/v1/Clients'], 3500);
  assert.equal(merged.profiles.write.stepBudgetMs.journey_full_plan_build_duration, 45000);
});

test('mergePhaseAManifestShards validates expected counts', () => {
  const shard = parseManifestShard({
    reportType: 'phase-a-manifest-shard',
    runTag: 't1',
    advisorSub: 'adv-1',
    clients: [{ clientId: 'c1', uniqueTag: 'tag1', cashflows: [{ cashflowId: 'cf1' }] }],
    counts: { clients: 1, plans: 1 },
  });
  const merged = mergePhaseAManifestShards([shard], { runTag: 't1', expectedClients: 1, expectedPlans: 1 });
  assert.equal(merged.reportType, 'phase-a-manifest');
  assert.equal(merged.validation.passed, true);
  const target = selectManifestTargetForVu(merged, 1);
  assert.equal(target.clientId, 'c1');
  assert.equal(target.cashflowId, 'cf1');
});

test('resolveManifestShardId prefers env then advisorSub hash', () => {
  assert.equal(resolveManifestShardId({ envShardId: 'advisor-02' }), 'advisor-02');
  const fromSub = resolveManifestShardId({ advisorSub: 'sub-abc-123' });
  assert.equal(fromSub, advisorSubShardId('sub-abc-123'));
  assert.equal(resolveManifestShardId({ vu: 3, iteration: 1 }), 'vu-3-iter-1');
});

test('mergePhaseAManifestShards detects duplicate advisorSub across shards', () => {
  const shardA = parseManifestShard({
    runTag: 't1',
    shardId: 'shard-a',
    advisorSub: 'same-advisor',
    clients: [{ clientId: 'c1', cashflows: [{ cashflowId: 'cf1' }] }],
  });
  const shardB = parseManifestShard({
    runTag: 't1',
    shardId: 'shard-b',
    advisorSub: 'same-advisor',
    clients: [{ clientId: 'c2', cashflows: [{ cashflowId: 'cf2' }] }],
  });
  const merged = mergePhaseAManifestShards([shardA, shardB], { expectedShards: 2 });
  assert.equal(merged.validation.duplicateAdvisorOk, false);
  assert.equal(merged.validation.passed, false);
  assert.equal(merged.validation.duplicateAdvisorSubs.length, 1);
});

test('flattenManifestTargets covers all clients and plans', () => {
  const manifest = mergePhaseAManifestShards([
    parseManifestShard({
      runTag: 't2',
      shardId: 's1',
      advisorSub: 'adv-1',
      clients: [
        {
          clientId: 'c1',
          cashflows: [{ cashflowId: 'cf1' }, { cashflowId: 'cf2' }],
        },
        {
          clientId: 'c2',
          cashflows: [{ cashflowId: 'cf3' }],
        },
      ],
    }),
  ]);
  const targets = flattenManifestTargets(manifest);
  assert.equal(targets.length, 3);
  assert.equal(selectManifestTargetForVu(manifest, 1).cashflowId, 'cf1');
  assert.equal(selectManifestTargetForVu(manifest, 2).cashflowId, 'cf2');
  assert.equal(selectManifestTargetForVu(manifest, 3).cashflowId, 'cf3');
  assert.equal(selectManifestTargetForVu(manifest, 4).cashflowId, 'cf1');
});

test('mergePhaseAManifestShards excludes error stub rows from counts', () => {
  const shard = parseManifestShard({
    runTag: 't3',
    advisorSub: 'adv-1',
    clients: [
      { clientId: '', uniqueTag: 'fail1', cashflows: [], error: 'client_create_failed' },
      { clientId: 'c1', uniqueTag: 'ok1', cashflows: [{ cashflowId: 'cf1' }] },
    ],
  });
  const merged = mergePhaseAManifestShards([shard], { expectedClients: 1, expectedPlans: 1 });
  assert.equal(merged.totals.clients, 1);
  assert.equal(merged.totals.plans, 1);
  assert.equal(merged.validation.passed, true);
});

test('evaluateVolumeSloGate fails on endpoint violation rate', () => {
  const store = createVolumeSloStore();
  for (let i = 0; i < 10; i++) {
    recordEndpointSample(store, repoConfig, {
      method: 'GET',
      endpoint: '/api/v1/Clients/{id}',
      durationMs: i < 6 ? 1500 : 5000,
      profile: 'read',
    });
  }
  const summary = buildVolumeSloSummary(store, repoConfig);
  const gate = evaluateVolumeSloGate(summary, { maxEndpointViolationRate: 0.05 });
  assert.equal(gate.passed, false);
  assert.equal(gate.endpointViolationRateFailed, true);
});

test('evaluateVolumeSloGate strict endpoint p95 mode', () => {
  const store = createVolumeSloStore();
  recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{id}',
    durationMs: 5000,
    profile: 'read',
  });
  recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/{id}',
    durationMs: 1500,
    profile: 'read',
  });
  const summary = buildVolumeSloSummary(store, repoConfig);
  const gate = evaluateVolumeSloGate(summary, {
    failOnEndpointP95: true,
    maxEndpointViolationRate: 1,
    maxStepViolationRate: 1,
  });
  assert.equal(gate.passed, false);
  assert.ok(gate.failedEndpoints.length > 0);
});

test('volume scenario expected count formula', () => {
  const { scenario } = resolveVolumeScenario(repoScenarios, 'phase-a-write-volume');
  const advisors = 20;
  const iterations = 1;
  const expectedClients = advisors * scenario.clientsPerAdvisor * iterations;
  const expectedPlans =
    advisors * scenario.clientsPerAdvisor * scenario.plansPerClient * iterations;
  assert.equal(expectedClients, 60);
  assert.equal(expectedPlans, 120);
});

test('resolveEndpointHardMax uses explicit endpointMaxMs', () => {
  const hard = resolveEndpointHardMax(
    repoConfig,
    'read',
    'GET',
    '/api/v1/Clients/fa1/all',
  );
  assert.ok(hard.hardMaxMs >= hard.budgetMs || hard.hardMaxMs > 0);
});

test('recordEndpointSample tracks hardViolations', () => {
  const store = createVolumeSloStore();
  const hardMax = resolveEndpointHardMax(
    repoConfig,
    'read',
    'GET',
    '/api/v1/Clients/advisor1/all',
  );
  const { hardViolated } = recordEndpointSample(store, repoConfig, {
    method: 'GET',
    endpoint: '/api/v1/Clients/advisor1/all',
    durationMs: hardMax.hardMaxMs + 1000,
    profile: 'read',
  });
  assert.equal(hardViolated, true);
  const summary = buildVolumeSloSummary(store, repoConfig);
  assert.ok(summary.totals.hardMaxViolations >= 1);
});

test('S1 scenario resolves 20 advisors and profile path', () => {
  const { name, scenario } = resolveVolumeScenario(repoScenarios, 'S1');
  assert.equal(name, 'S1');
  assert.equal(scenario.advisors, 20);
  assert.equal(scenario.writeParallelJobs, 20);
  assert.equal(scenario.manifestProfileFile, 'data/scenarios/profile_20u_1c_1p.json');
});

test('S2–S5 volume ladder matches expected user/client/plan totals', () => {
  const table = [
    { id: 'S2', advisors: 20, clientsPerAdvisor: 5, plansPerClient: 2, totalClients: 100, totalPlans: 200 },
    { id: 'S3', advisors: 20, clientsPerAdvisor: 10, plansPerClient: 4, totalClients: 200, totalPlans: 800 },
    { id: 'S4', advisors: 20, clientsPerAdvisor: 20, plansPerClient: 8, totalClients: 400, totalPlans: 3200 },
    { id: 'S5', advisors: 20, clientsPerAdvisor: 30, plansPerClient: 8, totalClients: 600, totalPlans: 4800 },
  ];
  for (const row of table) {
    const { name, scenario } = resolveVolumeScenario(repoScenarios, row.id);
    assert.equal(name, row.id);
    if (row.id === 'S3' || row.id === 'S4') {
      assert.equal(scenario.disableFleetStagger, true, `${row.id} should disable fleet stagger`);
    } else if (row.id === 'S5') {
      assert.notEqual(scenario.disableFleetStagger, true, 'S5 keeps fleet stagger by default');
    }
    assert.equal(scenario.advisors, row.advisors);
    assert.equal(scenario.clientsPerAdvisor, row.clientsPerAdvisor);
    assert.equal(scenario.plansPerClient, row.plansPerClient);
    assert.equal(scenario.writeParallelJobs, 20, `${row.id} writeParallelJobs`);
    const clients = row.advisors * row.clientsPerAdvisor;
    const plans = clients * row.plansPerClient;
    assert.equal(clients, row.totalClients);
    assert.equal(plans, row.totalPlans);
  }
});

test('buildManifestShardFromK6SummaryMetrics rebuilds shard from tagged counters', () => {
  const data = {
    metrics: {
      'phase_a_manifest_shard{shard_id:advisor-00,advisor_sub:sub1,advisor_email:User01@gmail.com,run_tag:smoke,scenario:S1}':
        { values: { count: 1 } },
      'phase_a_manifest_plan{shard_id:advisor-00,client_id:clientA,cashflow_id:cf1,unique_tag:tag1,plan_name:Plan1}':
        { values: { count: 1 } },
      'phase_a_manifest_plan{shard_id:advisor-00,client_id:clientA,cashflow_id:cf2,unique_tag:tag1,plan_name:Plan2}':
        { values: { count: 1 } },
    },
  };
  const shard = buildManifestShardFromK6SummaryMetrics(data);
  assert.ok(shard);
  assert.equal(shard.shardId, 'advisor-00');
  assert.equal(shard.advisorEmail, 'User01@gmail.com');
  assert.equal(shard.counts.clients, 1);
  assert.equal(shard.counts.plans, 2);
  assert.equal(shard.clients[0].clientId, 'clientA');
  assert.equal(shard.clients[0].cashflows.length, 2);

  const merged = mergePhaseAManifestShards([shard], {
    runTag: 'smoke',
    expectedClients: 1,
    expectedPlans: 2,
    expectedShards: 1,
  });
  assert.equal(merged.validation.passed, true);
});

test('buildQuotaBreachSummary counts advisors and maps impacted journeys', () => {
  const shards = [
    {
      shardId: 'advisor-00',
      advisorEmail: 'a0@test.com',
      rows: [
        { metric: 'journey_create_client_duration', optional: false, over: true, actualMs: 5000, budgetMs: 4000, marginMs: -1000 },
        { metric: 'POST /api/v1/Clients', optional: false, over: false, actualMs: 800, budgetMs: 2000, marginMs: 1200 },
      ],
    },
    {
      shardId: 'advisor-01',
      advisorEmail: 'a1@test.com',
      rows: [
        { metric: 'journey_create_client_duration', optional: false, over: false, actualMs: 900, budgetMs: 4000, marginMs: 3100 },
        { metric: 'POST /api/v1/cashflows', optional: false, over: true, actualMs: 6000, budgetMs: 5000, marginMs: -1000 },
      ],
    },
  ];
  const section = buildSignoffFleetSection(shards, 2);
  const summary = buildQuotaBreachSummary(section);
  assert.equal(summary.totalAdvisors, 2);
  assert.equal(summary.advisorsOverQuota, 2);
  assert.equal(summary.byAdvisor.length, 2);
  assert.equal(summary.byJourney.length, 2);
  assert.equal(signoffJourneyLabel('journey_create_client_duration'), 'Create client (write step)');
  const md = formatQuotaBreachSummaryMarkdown(summary, 'Phase A write');
  assert.match(md, /Advisors over latency budget.*2\/2/);
  assert.match(md, /Create client \(write step\)/);
  assert.match(md, /advisor-00/);
});

test('formatQuotaBreachSummaryMarkdown reports no breaches when all under budget', () => {
  const section = buildSignoffFleetSection(
    [
      {
        shardId: 'advisor-00',
        rows: [{ metric: 'journey_create_client_duration', optional: false, over: false, actualMs: 100, budgetMs: 4000, marginMs: 3900 }],
      },
    ],
    1,
  );
  const summary = buildQuotaBreachSummary(section);
  assert.equal(summary.advisorsOverQuota, 0);
  const md = formatQuotaBreachSummaryMarkdown(summary);
  assert.match(md, /No advisors exceeded the latency budget/);
});

test('normalizeVolumeConfigOpenPath strips absolute prefix to config/', () => {
  const p = normalizeVolumeConfigOpenPath('C:/Users/me/load-testing-k6/config/volume-scenarios.json');
  assert.equal(p, 'config/volume-scenarios.json');
});

test('volumePreRunCleanupEnabledFromEnv respects explicit flags for multi-client volume', () => {
  const writeEnv = { FULL_PLATFORM_PRE_RUN_CLEANUP: '1' };
  assert.equal(volumePreRunCleanupEnabledFromEnv(writeEnv, 1), true);
  assert.equal(volumePreRunCleanupEnabledFromEnv(writeEnv, 20), true);
  assert.equal(volumePreRunCleanupEnabledFromEnv({ FULL_PLATFORM_PRE_RUN_CLEANUP: '0' }, 20), false);
});

test('volumeFleetStaggerEnabledFromEnv on by default for S4-scale client counts', () => {
  assert.equal(volumeFleetStaggerEnabledFromEnv({}, 20), true);
  assert.equal(volumeFleetStaggerEnabledFromEnv({}, 4), true);
  assert.equal(volumeFleetStaggerEnabledFromEnv({ VOLUME_DISABLE_FLEET_STAGGER: '1' }, 20), false);
});

test('buildPhaseAAdvisorExecutionSummary flags partial seed and process failures', () => {
  const runMeta = {
    advisors: 3,
    clientsPerAdvisor: 10,
    plansPerClient: 4,
    expectedClients: 30,
    expectedPlans: 120,
    manifestCollected: 2,
    failedJobs: ['advisor-00', 'manifest-merge'],
    advisorRuns: [
      { advisorKey: 'advisor-00', advisorEmail: 'a0@test.com', exitCode: 2, jobFailed: true },
      { advisorKey: 'advisor-01', advisorEmail: 'a1@test.com', exitCode: 0, jobFailed: false },
      { advisorKey: 'advisor-02', advisorEmail: 'a2@test.com', exitCode: 0, jobFailed: false },
    ],
  };
  const manifest = {
    totals: { clients: 16, plans: 64 },
    validation: {
      passed: false,
      expectedClients: 30,
      expectedPlans: 120,
      expectedShards: 3,
      actualShards: 3,
      clientCountOk: false,
      planCountOk: false,
      shardCountOk: true,
    },
    advisors: [
      { shardId: 'advisor-00', advisorEmail: 'a0@test.com', clients: [], counts: { clients: 0, plans: 0 } },
      {
        shardId: 'advisor-01',
        advisorEmail: 'a1@test.com',
        clients: [{ clientId: 'c1', cashflows: [{}, {}, {}, {}] }],
        counts: { clients: 1, plans: 4 },
      },
      {
        shardId: 'advisor-02',
        advisorEmail: 'a2@test.com',
        clients: Array.from({ length: 10 }, () => ({ clientId: 'c', cashflows: [{}, {}, {}, {}] })),
        counts: { clients: 10, plans: 40 },
      },
    ],
  };
  const signoffSection = {
    expectedShards: 3,
    actualShards: 3,
    shardsAnyOver: 1,
    shardsAllUnder: 2,
    shards: [
      {
        shardId: 'advisor-02',
        advisorEmail: 'a2@test.com',
        rows: [{ metric: 'journey_create_client_duration', optional: false, over: true, actualMs: 5000, budgetMs: 4000, marginMs: -1000 }],
      },
    ],
    byMetric: {
      journey_create_client_duration: { over: 1, worstOverMs: 5000, failedShards: ['advisor-02'] },
    },
  };
  const exec = buildPhaseAAdvisorExecutionSummary({ runMeta, manifest, signoffSection, sloGate: { passed: true } });
  assert.equal(exec.overallPass, false);
  assert.equal(exec.categories.failedAdvisorJobs, 1);
  assert.equal(exec.categories.partialAdvisorResults, 2);
  assert.equal(exec.categories.successfulAdvisors, 1);
  assert.equal(exec.categories.advisorsOverLatency, 1);
  assert.match(exec.failureReasons.join(' '), /Manifest validation failed/);
  assert.match(exec.failureReasons.join(' '), /Clients seeded: 16\/30/);
});

test('buildPhaseASummaryMarkdown never shows failed jobs none when manifest failed', () => {
  const md = buildPhaseASummaryMarkdown({
    runTag: 'S3-write',
    runMeta: {
      advisors: 2,
      concurrency: 20,
      clientsPerAdvisor: 10,
      plansPerClient: 4,
      runElapsedSec: 100,
      volumeScenario: 'S3',
      failedJobs: ['advisor-00'],
      advisorRuns: [
        { advisorKey: 'advisor-00', jobFailed: true, exitCode: 2 },
        { advisorKey: 'advisor-01', jobFailed: false, exitCode: 0 },
      ],
    },
    manifest: {
      totals: { clients: 5, plans: 20 },
      validation: {
        passed: false,
        expectedClients: 20,
        expectedPlans: 80,
        expectedShards: 2,
        actualShards: 2,
        clientCountOk: false,
        planCountOk: false,
        shardCountOk: true,
      },
      advisors: [
        { shardId: 'advisor-00', clients: [], counts: { clients: 0, plans: 0 } },
        { shardId: 'advisor-01', clients: [{ clientId: 'x', cashflows: [{}, {}, {}, {}] }], counts: { clients: 1, plans: 4 } },
      ],
    },
    sloGate: { passed: true },
    signoffSection: { expectedShards: 2, actualShards: 2, shards: [], byMetric: {} },
    generatedAt: '2026-01-01T00:00:00.000Z',
  });
  assert.match(md, /# Overall Result: FAIL/);
  assert.match(md, /## Failure reasons/);
  assert.match(md, /Failed advisor jobs \| 1/);
  assert.match(md, /Partial advisor results \| 2/);
  assert.match(md, /Advisor latency compliance: \*\*PASS/);
  assert.match(md, /Fleet SLO gate: \*\*PASS\*\*/);
  assert.doesNotMatch(md, /Failed advisor jobs\n\n- \(none\)/);
  assert.match(md, /## Failed advisor jobs/);
  assert.match(md, /advisor-00/);
});
