#!/usr/bin/env node
/**
 * Generate volume report markdown from on-disk Phase A/B artifacts.
 * Resolves nearest files when requested run tags are missing.
 *
 * Usage: node tools/generate-volume-report.mjs [phaseARunTag] [phaseBRunTag] [scenario] [outPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildQuotaBreachSummary,
  formatQuotaBreachSummaryMarkdown,
  SIGNOFF_JOURNEY_LABELS,
} from '../lib/volume-signoff-core.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQ_A = process.argv[2] || 'S1-write';
const REQ_B = process.argv[3] || 'S1-read';
const SCENARIO = process.argv[4] || 'S1';
const OUT = process.argv[5] || `reports/phase-volume/${REQ_A}_VOLUME_REPORT.md`;

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}
function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
}

let fleetPath = exists(`reports/phase-volume/${REQ_A}_signoff-fleet.json`)
  ? `reports/phase-volume/${REQ_A}_signoff-fleet.json`
  : exists('reports/phase-volume/S1-write_signoff-fleet.json')
    ? 'reports/phase-volume/S1-write_signoff-fleet.json'
    : null;
const fleet = fleetPath ? readJson(fleetPath) : null;

const phaseAOnDisk = fleet?.phaseARunTag || 'S1-write';
const phaseBOnDisk = fleet?.phaseBRunTag || 'S1-read';

const metaPath = exists(`reports/phase-a/${REQ_A}/run-metadata.json`)
  ? `reports/phase-a/${REQ_A}/run-metadata.json`
  : exists(`reports/phase-a/${phaseAOnDisk}/run-metadata.json`)
    ? `reports/phase-a/${phaseAOnDisk}/run-metadata.json`
    : null;
const meta = metaPath ? readJson(metaPath) : null;

const manifestPath = exists(`reports/phase-a/${REQ_A}/manifest.json`)
  ? `reports/phase-a/${REQ_A}/manifest.json`
  : exists(`reports/phase-a/${phaseAOnDisk}/manifest.json`)
    ? `reports/phase-a/${phaseAOnDisk}/manifest.json`
    : null;
const manifest = manifestPath ? readJson(manifestPath) : null;

const sloAFleetPath = exists(`reports/phase-a/${REQ_A}/slo-summary-fleet.json`)
  ? `reports/phase-a/${REQ_A}/slo-summary-fleet.json`
  : exists(`reports/phase-a/${phaseAOnDisk}/slo-summary-fleet.json`)
    ? `reports/phase-a/${phaseAOnDisk}/slo-summary-fleet.json`
    : null;

const sloBFleetPath = exists(`reports/phase-b/${REQ_B}/slo-summary-fleet.json`)
  ? `reports/phase-b/${REQ_B}/slo-summary-fleet.json`
  : exists(`reports/phase-b/${phaseBOnDisk}/slo-summary-fleet.json`)
    ? `reports/phase-b/${phaseBOnDisk}/slo-summary-fleet.json`
    : null;

const sloBPath = exists(`reports/phase-b/${REQ_B}/slo-summary.json`)
  ? `reports/phase-b/${REQ_B}/slo-summary.json`
  : exists(`reports/phase-b/${phaseBOnDisk}/slo-summary.json`)
    ? `reports/phase-b/${phaseBOnDisk}/slo-summary.json`
    : null;

const journeyPath = exists('reports/journeys/k6-journey-advisor-critical-summary.json')
  ? 'reports/journeys/k6-journey-advisor-critical-summary.json'
  : null;
const journey = journeyPath ? readJson(journeyPath) : null;

function resolveProfilePath() {
  const fromManifest = manifest?.manifestProfileFile;
  if (fromManifest && exists(fromManifest)) return fromManifest;
  try {
    const scenarios = readJson('config/volume-scenarios.json');
    const manifestFile = scenarios.scenarios?.[SCENARIO]?.manifestProfileFile;
    if (manifestFile && exists(manifestFile)) return manifestFile;
  } catch {
    /* optional config */
  }
  const fallback = 'data/scenarios/profile_20u_1c_1p.json';
  if (exists(fallback)) return fallback;
  const dir = path.join(ROOT, 'data/scenarios');
  const profiles = fs.readdirSync(dir).filter((f) => f.startsWith('profile_') && f.endsWith('.json'));
  return profiles.length ? `data/scenarios/${profiles[0]}` : null;
}

let profilePath = resolveProfilePath();
const profile = profilePath && exists(profilePath) ? readJson(profilePath) : null;

function iterProfilePlans(prof) {
  const rows = [];
  for (const adv of prof?.advisors || []) {
    for (const client of adv.clients || []) {
      for (const cf of client.cashflows || []) {
        rows.push({ advisor: adv, client, cashflow: cf });
      }
    }
  }
  return rows;
}

function seedSummaryRow(adv, client, cf) {
  const seed = cf.seed;
  const persona = cf.persona || client.persona;
  const mio = seed?.moneyInOut;
  const savings = seed?.savings;
  const wealth = seed?.wealth;
  const incomeSalary = mio?.incomes?.find((x) => x.description === 'Salary')?.amount ?? mio?.incomes?.[0]?.amount;
  const expenseLiving = mio?.expenses?.find((x) => x.description === 'Living costs')?.amount ?? mio?.expenses?.[0]?.amount;
  const expenseHousing = mio?.expenses?.find((x) => x.description === 'Housing')?.amount ?? mio?.expenses?.[1]?.amount;
  const potValues = (savings?.pots || []).map((p) => p.startingPotValue).join('; ');
  return {
    shard_id: adv.shardId,
    advisor_email: adv.advisorEmail || 'n/a',
    client_id: client.clientId,
    cashflow_id: cf.cashflowId,
    plan_name: cf.planName || 'n/a',
    display_name: client.displayName || persona?.firstName ? `${persona?.firstName} ${persona?.lastName}` : 'n/a',
    birth_year: persona?.birthYear ?? 'n/a',
    occupation: persona?.occupation ?? 'n/a',
    salary: incomeSalary ?? 'n/a',
    living_costs: expenseLiving ?? 'n/a',
    housing: expenseHousing ?? 'n/a',
    cash_balance: savings?.cashBalanceAmount ?? 'n/a',
    saving_pots: savings?.newPotCount ?? savings?.pots?.length ?? 'n/a',
    pot_values: potValues || 'n/a',
    contrib_rows: seed?.flows?.contributions?.length ?? 'n/a',
    withdraw_rows: seed?.flows?.withdrawals?.length ?? 'n/a',
    asset_value: wealth?.asset?.value ?? 'n/a',
    liability_outstanding: wealth?.liability?.outstanding ?? 'n/a',
    timeline_chips: seed?.timelineGoalChipCount ?? 'n/a',
    reports_module: seed?.reportsModule ?? 'n/a',
    has_seed: Boolean(seed),
  };
}

const slo = readJson('config/volume-api-slo.json');
const w = slo.profiles.write;
const r = slo.profiles.read;
const hm = slo.hardMaxMultiplier || 2.5;

function maxMs(prof, metric, kind) {
  if (kind === 'step') return 'n/a';
  const b = prof.endpointBudgetMs?.[metric] ?? prof.defaultBudgetMs;
  if (prof.endpointMaxMs?.[metric] != null) return prof.endpointMaxMs[metric];
  return Math.round(b * hm);
}
function budgetMs(prof, metric, kind) {
  if (kind === 'step') return prof.stepBudgetMs?.[metric] ?? prof.defaultBudgetMs;
  return prof.endpointBudgetMs?.[metric] ?? prof.defaultBudgetMs;
}

const PA_M = [
  'journey_create_client_duration',
  'journey_create_base_plan_duration',
  'POST /api/v1/Clients',
  'POST /api/v1/cashflows',
  'GET /api/v1/Reports/{cashflowId}',
];
const PB_M = [
  'journey_dashboard_load_duration',
  'full_journey_duration',
  'GET /api/v1/Clients/{advisorId}/all',
  'GET /api/v1/client/{clientId}/cashflows',
  'GET /api/v1/cashflows/{cashflowId}',
  'GET /api/v1/Reports/{cashflowId}',
];

function worstActual(shards, metric) {
  let worst = null;
  for (const sh of shards || []) {
    const row = (sh.rows || []).find((x) => x.metric === metric);
    if (row?.actualMs != null) worst = worst == null ? row.actualMs : Math.max(worst, row.actualMs);
  }
  return worst;
}

function top5Slowest(shards, prof) {
  const rows = [];
  for (const sh of shards || []) {
    for (const row of sh.rows || []) {
      if (row.actualMs == null) continue;
      const b = budgetMs(prof, row.metric, row.kind);
      rows.push({
        shard_id: sh.shardId,
        metric: row.metric,
        actual_ms: row.actualMs,
        budget_ms: b,
        margin_ms: row.marginMs,
      });
    }
  }
  rows.sort((a, b) => a.margin_ms - b.margin_ms);
  return rows.slice(0, 5);
}

const lines = [];

lines.push('### 1_run_metadata');
lines.push('| field | value |');
lines.push('|-------|-------|');
lines.push(`| scenario | ${SCENARIO} |`);
lines.push(`| phase_a_run_tag (requested) | ${REQ_A} |`);
lines.push(`| phase_b_run_tag (requested) | ${REQ_B} |`);
lines.push(`| phase_a_run_tag (resolved) | ${meta?.runTag || phaseAOnDisk} |`);
lines.push(`| phase_b_run_tag (resolved) | ${journey?.phaseBRunTag || phaseBOnDisk} |`);
lines.push(
  `| signoff_fleet_file (requested) | ${exists(`reports/phase-volume/${REQ_A}_signoff-fleet.json`) ? `reports/phase-volume/${REQ_A}_signoff-fleet.json` : 'n/a — not found'} |`,
);
lines.push(`| signoff_fleet_file (resolved) | ${fleetPath || 'n/a'} |`);
lines.push(
  `| run_metadata_file (requested) | ${exists(`reports/phase-a/${REQ_A}/run-metadata.json`) ? `reports/phase-a/${REQ_A}/run-metadata.json` : 'n/a — not found'} |`,
);
lines.push(`| run_metadata_file (resolved) | ${metaPath || 'n/a'} |`);
lines.push(
  `| slo_summary_fleet_a (requested) | ${exists(`reports/phase-a/${REQ_A}/slo-summary-fleet.json`) ? `reports/phase-a/${REQ_A}/slo-summary-fleet.json` : 'n/a — not found'} |`,
);
lines.push(`| slo_summary_fleet_a (resolved) | ${sloAFleetPath || 'n/a'} |`);
lines.push(
  `| slo_summary_fleet_b (requested) | ${exists(`reports/phase-b/${REQ_B}/slo-summary-fleet.json`) ? `reports/phase-b/${REQ_B}/slo-summary-fleet.json` : 'n/a — not found'} |`,
);
lines.push(`| slo_summary_fleet_b (resolved) | ${sloBFleetPath || 'n/a'} |`);
lines.push(`| slo_summary_b (resolved) | ${sloBPath || 'n/a'} |`);
lines.push(`| journey_summary (resolved) | ${journeyPath || 'n/a'} |`);
lines.push(`| profile_file (resolved) | ${profilePath || 'n/a'} |`);
if (profile?.seedSpecVersion != null) {
  lines.push(`| seed_spec_version | ${profile.seedSpecVersion} |`);
  lines.push(`| seed_spec_enriched_at | ${profile.seedSpecEnrichedAt || 'n/a'} |`);
  lines.push(`| seed_spec_source | deterministic (lib/k6-volume-realistic-data.js) — not live API GET |`);
}
if (profile?.runBinding?.runTag) {
  lines.push(`| profile_run_binding | ${profile.runBinding.runTag} |`);
}
if (meta) {
  lines.push(`| volumeScenario | ${meta.volumeScenario} |`);
  lines.push(`| userMode | ${meta.userMode} |`);
  lines.push(`| advisors | ${meta.advisors} |`);
  lines.push(`| concurrency | ${meta.concurrency} |`);
  lines.push(`| clientsPerAdvisor | ${meta.clientsPerAdvisor} |`);
  lines.push(`| plansPerClient | ${meta.plansPerClient} |`);
  lines.push(`| expectedClients | ${meta.expectedClients} |`);
  lines.push(`| expectedPlans | ${meta.expectedPlans} |`);
  lines.push(`| runElapsedSec | ${meta.runElapsedSec} |`);
  lines.push(`| manifestCollected | ${meta.manifestCollected} |`);
  lines.push(`| sloCollected | ${meta.sloCollected} |`);
}
lines.push(`| signoff_generatedAt | ${fleet?.generatedAt || 'n/a'} |`);
lines.push('| slo_config | config/volume-api-slo.json |');

lines.push('');
lines.push('### 2_data_gates');
lines.push('| gate | expected | actual | pass |');
lines.push('|------|----------|--------|------|');
const val = manifest?.validation;
if (val) {
  lines.push(`| clients (write) | ${val.expectedClients} | ${val.actualClients} | ${val.clientCountOk ? 'yes' : 'no'} |`);
  lines.push(`| plans (write) | ${val.expectedPlans} | ${val.actualPlans} | ${val.planCountOk ? 'yes' : 'no'} |`);
  lines.push(`| shards | ${val.expectedShards} | ${val.actualShards} | ${val.shardCountOk ? 'yes' : 'no'} |`);
  lines.push(`| manifest validation | n/a | passed=${val.passed} | ${val.passed ? 'yes' : 'no'} |`);
} else {
  lines.push('| clients (write) | n/a | n/a | n/a |');
  lines.push('| plans (write) | n/a | n/a | n/a |');
  lines.push('| shards | n/a | n/a | n/a |');
  lines.push(`| manifest validation | n/a | n/a — ${manifestPath || 'manifest not found'} | n/a |`);
}

function fleetTable(title, phase, includeReportsRow) {
  lines.push('');
  lines.push(title);
  lines.push('');
  lines.push('| metric | under_count | over_count | total_shards | failed_shard_ids | worst_margin_ms | worst_actual_ms |');
  lines.push('|--------|-------------|------------|--------------|------------------|-----------------|-----------------|');
  if (!phase?.byMetric) {
    lines.push('| n/a | n/a | n/a | n/a | n/a | n/a | n/a |');
    return;
  }
  for (const [m, v] of Object.entries(phase.byMetric)) {
    const ids = (v.failedShards || []).join(', ');
    const wa = worstActual(phase.shards, m);
    lines.push(
      `| ${m} | ${v.under} | ${v.over} | ${phase.actualShards} | ${ids} | ${v.worstMarginMs ?? 'n/a'} | ${wa ?? v.worstOverMs ?? 'n/a'} |`,
    );
  }
  if (includeReportsRow && !phase.byMetric['GET /api/v1/Reports/{cashflowId}']) {
    lines.push('| GET /api/v1/Reports/{cashflowId} | n/a | n/a | n/a | n/a | n/a | n/a |');
  }
}

fleetTable('### 3_phase_a_fleet', fleet?.phaseA, false);

lines.push('');
lines.push('### 4_phase_a_per_shard');
lines.push('| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |');
lines.push('|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|');
if (fleet?.phaseA?.shards) {
  for (const sh of [...fleet.phaseA.shards].sort((a, b) => a.shardId.localeCompare(b.shardId))) {
    for (const m of PA_M) {
      const row = (sh.rows || []).find((x) => x.metric === m);
      const kind = row?.kind || (m.startsWith('POST') || m.startsWith('GET') ? 'http' : 'step');
      const b = budgetMs(w, m, kind);
      const mx = maxMs(w, m, kind);
      if (!row) {
        lines.push(`| ${sh.shardId} | ${sh.advisorEmail || 'n/a'} | ${m} | ${b} | ${mx} | n/a | n/a | n/a | n/a |`);
        continue;
      }
      lines.push(
        `| ${sh.shardId} | ${sh.advisorEmail || 'n/a'} | ${m} | ${b} | ${mx} | ${row.actualMs ?? 'n/a'} | ${row.actualLabel || 'n/a'} | ${row.over ? 'yes' : 'no'} | ${row.marginMs ?? 'n/a'} |`,
      );
    }
  }
} else {
  lines.push('| n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |');
}

fleetTable('### 5_phase_b_fleet', fleet?.phaseB, true);

lines.push('');
lines.push('### 6_phase_b_per_shard');
lines.push('| shard_id | email | metric | budget_ms | max_ms | actual_ms | actual_type | over | margin_ms |');
lines.push('|----------|-------|--------|-----------|--------|-----------|-------------|------|-----------|');
if (fleet?.phaseB?.shards) {
  for (const sh of [...fleet.phaseB.shards].sort((a, b) => a.shardId.localeCompare(b.shardId))) {
    for (const m of PB_M) {
      const row = (sh.rows || []).find((x) => x.metric === m);
      const kind = row?.kind || (m.startsWith('GET') ? 'http' : 'step');
      const b = budgetMs(r, m, kind);
      const mx = maxMs(r, m, kind);
      if (!row) {
        lines.push(`| ${sh.shardId} | ${sh.advisorEmail || 'n/a'} | ${m} | ${b} | ${mx} | n/a | n/a | n/a | n/a |`);
        continue;
      }
      lines.push(
        `| ${sh.shardId} | ${sh.advisorEmail || 'n/a'} | ${m} | ${b} | ${mx} | ${row.actualMs ?? 'n/a'} | ${row.actualLabel || 'n/a'} | ${row.over ? 'yes' : 'no'} | ${row.marginMs ?? 'n/a'} |`,
      );
    }
  }
} else {
  lines.push('| n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |');
}

lines.push('');
lines.push('### 7_errors');
lines.push('| phase | auth_failure_rate | business_failure_rate | http_req_failed |');
lines.push('|-------|-------------------|----------------------|-----------------|');
lines.push('| A | n/a | n/a | n/a |');
const jRates = journey?.rates;
lines.push(
  `| B | ${jRates?.auth_failure_rate ?? 'n/a'} | ${jRates?.business_failure_rate ?? 'n/a'} | ${journey?.http_req_failed ?? 'n/a'} |`,
);

lines.push('');
lines.push('### 8_exits');
lines.push('| phase | runner_exit_code | k6_exit_0 | k6_exit_99 | failed_job_ids |');
lines.push('|-------|------------------|-----------|------------|----------------|');
const k6a0 = meta?.advisorRuns?.filter((x) => x.exitCode === 0).length ?? 'n/a';
const k6a99 = meta?.advisorRuns?.filter((x) => x.exitCode === 99).length ?? 'n/a';
const failed = (meta?.failedJobs || []).map((x) => x.advisorKey || x.shardId || x).join(', ') || '';
lines.push(`| A | n/a | ${k6a0} | ${k6a99} | ${failed} |`);
const bLog = exists(`reports/phase-b/${phaseBOnDisk}/k6.log`);
lines.push(`| B | ${bLog && journey?.phaseBRunTag === phaseBOnDisk ? 99 : 'n/a'} | 0 | 1 | |`);

lines.push('');
lines.push('### 9_fleet_slo_gate');
lines.push('| phase | passed | failed | failed_shard_ids |');
lines.push('|-------|--------|--------|------------------|');
const sloAFleet = sloAFleetPath ? readJson(sloAFleetPath) : null;
const paSignoff = fleet?.phaseA;
const pbSignoff = fleet?.phaseB;
lines.push(
  `| A | ${paSignoff?.shardsAllUnder ?? sloAFleet?.fleet?.gatePassed ?? 'n/a'} | ${paSignoff?.shardsAnyOver ?? sloAFleet?.fleet?.gateFailed ?? 'n/a'} | ${(paSignoff?.failedShardIds || []).join(', ') || 'n/a'} |`,
);
lines.push(
  `| B | ${pbSignoff?.shardsAllUnder ?? 'n/a'} | ${pbSignoff?.shardsAnyOver ?? 'n/a'} | ${(pbSignoff?.failedShardIds || []).join(', ') || 'n/a'} |`,
);

const quotaA = buildQuotaBreachSummary(fleet?.phaseA);
const quotaB = buildQuotaBreachSummary(fleet?.phaseB);

lines.push('');
lines.push('### 9a_quota_breach_phase_a');
lines.push(formatQuotaBreachSummaryMarkdown(quotaA, 'Phase A write'));

lines.push('');
lines.push('### 9b_quota_breach_phase_b');
lines.push(formatQuotaBreachSummaryMarkdown(quotaB, 'Phase B read'));

lines.push('');
lines.push('### 9c_quota_breach_table');
lines.push('| phase | advisors_over_quota | total_advisors | impacted_journey_steps |');
lines.push('|-------|---------------------|----------------|------------------------|');
const journeyStepsA =
  quotaA.byJourney.length > 0
    ? quotaA.byJourney.map((j) => `${j.journeyName} (${j.usersOverQuota})`).join('; ')
    : quotaA.totalAdvisors
      ? 'none'
      : 'n/a';
const journeyStepsB =
  quotaB.byJourney.length > 0
    ? quotaB.byJourney.map((j) => `${j.journeyName} (${j.usersOverQuota})`).join('; ')
    : quotaB.totalAdvisors
      ? 'none'
      : 'n/a';
lines.push(`| A (write) | ${quotaA.totalAdvisors ? quotaA.advisorsOverQuota : 'n/a'} | ${quotaA.totalAdvisors || 'n/a'} | ${journeyStepsA} |`);
lines.push(`| B (read) | ${quotaB.totalAdvisors ? quotaB.advisorsOverQuota : 'n/a'} | ${quotaB.totalAdvisors || 'n/a'} | ${journeyStepsB} |`);

lines.push('');
lines.push('### 10_top5_slowest_phase_a');
lines.push('| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |');
lines.push('|------|----------|--------|-----------|-----------|-----------|');
const t5a = top5Slowest(fleet?.phaseA?.shards, w);
if (t5a.length) t5a.forEach((row, i) => lines.push(`| ${i + 1} | ${row.shard_id} | ${row.metric} | ${row.actual_ms} | ${row.budget_ms} | ${row.margin_ms} |`));
else lines.push('| n/a | n/a | n/a | n/a | n/a | n/a |');

lines.push('');
lines.push('### 11_top5_slowest_phase_b');
lines.push('| rank | shard_id | metric | actual_ms | budget_ms | margin_ms |');
lines.push('|------|----------|--------|-----------|-----------|-----------|');
const t5b = top5Slowest(fleet?.phaseB?.shards, r);
if (t5b.length) t5b.forEach((row, i) => lines.push(`| ${i + 1} | ${row.shard_id} | ${row.metric} | ${row.actual_ms} | ${row.budget_ms} | ${row.margin_ms} |`));
else lines.push('| n/a | n/a | n/a | n/a | n/a | n/a |');

lines.push('');
lines.push('### 12_friendly_names_map');
lines.push('| api_metric | plain_name |');
lines.push('|------------|------------|');
const names = { ...SIGNOFF_JOURNEY_LABELS };
for (const [k, v] of Object.entries(names)) lines.push(`| ${k} | ${v} |`);

const planRows = iterProfilePlans(profile);
const seedRows = planRows.map(({ advisor, client, cashflow }) => seedSummaryRow(advisor, client, cashflow));
const withSeed = seedRows.filter((r) => r.has_seed).length;

lines.push('');
lines.push('### 13_seed_spec_expectations');
lines.push('| field | value |');
lines.push('|-------|-------|');
if (profile?.seedExpectations) {
  for (const [k, v] of Object.entries(profile.seedExpectations)) {
    lines.push(`| ${k} | ${v} |`);
  }
} else {
  lines.push('| n/a | profile not enriched — run tools/enrich-volume-profile-seed.mjs |');
}

lines.push('');
lines.push('### 14_seed_coverage');
lines.push('| metric | value |');
lines.push('|--------|-------|');
lines.push(`| advisors_in_profile | ${profile?.advisors?.length ?? 'n/a'} |`);
lines.push(`| plans_in_profile | ${planRows.length || 'n/a'} |`);
lines.push(`| plans_with_seed_block | ${withSeed || 'n/a'} |`);
lines.push(`| plans_missing_seed_block | ${planRows.length ? planRows.length - withSeed : 'n/a'} |`);
lines.push(`| seed_enriched | ${profile?.seedSpecEnrichedAt ? 'yes' : 'no'} |`);

lines.push('');
lines.push('### 15_seed_per_plan');
lines.push(
  '| shard_id | advisor_email | client_id | cashflow_id | plan_name | display_name | birth_year | occupation | salary | living_costs | housing | cash_balance | saving_pots | pot_values | contrib_rows | withdraw_rows | asset_value | liability_outstanding | timeline_chips | reports_module |',
);
lines.push(
  '|----------|---------------|-----------|-------------|-----------|--------------|------------|------------|--------|--------------|---------|--------------|-------------|------------|--------------|---------------|-------------|-----------------------|----------------|----------------|',
);
if (seedRows.length) {
  for (const r of seedRows) {
    lines.push(
      `| ${r.shard_id} | ${r.advisor_email} | ${r.client_id} | ${r.cashflow_id} | ${r.plan_name} | ${r.display_name} | ${r.birth_year} | ${r.occupation} | ${r.salary} | ${r.living_costs} | ${r.housing} | ${r.cash_balance} | ${r.saving_pots} | ${r.pot_values} | ${r.contrib_rows} | ${r.withdraw_rows} | ${r.asset_value} | ${r.liability_outstanding} | ${r.timeline_chips} | ${r.reports_module} |`,
    );
  }
} else {
  lines.push('| n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |');
}

lines.push('');
lines.push('### 16_seed_money_in_out_detail');
lines.push('| shard_id | cashflow_id | row_type | description | amount |');
lines.push('|----------|-------------|----------|-------------|--------|');
let mioCount = 0;
for (const { advisor, client, cashflow } of planRows) {
  const seed = cashflow.seed;
  if (!seed?.moneyInOut) continue;
  for (const row of seed.moneyInOut.incomes || []) {
    lines.push(`| ${advisor.shardId} | ${cashflow.cashflowId} | income | ${row.description} | ${row.amount} |`);
    mioCount++;
  }
  for (const row of seed.moneyInOut.expenses || []) {
    lines.push(`| ${advisor.shardId} | ${cashflow.cashflowId} | expense | ${row.description} | ${row.amount} |`);
    mioCount++;
  }
}
if (!mioCount) lines.push('| n/a | n/a | n/a | n/a | n/a |');

const concurrency = journey?.concurrency;
const breakingPoint = journey?.breakingPoint;
const capacity = journey?.capacity;
const endpointRows = journey?.endpoints || [];
const endpointSpeed = journey?.endpointSpeed;

lines.push('');
lines.push('### 17_concurrency');
lines.push('| metric | value |');
lines.push('|--------|-------|');
lines.push(`| peak_active_users | ${concurrency?.peakActiveUsers ?? 'n/a'} |`);
lines.push(`| avg_active_users | ${concurrency?.avgActiveUsers != null ? Math.round(concurrency.avgActiveUsers * 10) / 10 : 'n/a'} |`);
lines.push(`| peak_in_flight_requests | ${concurrency?.peakInFlightRequests ?? 'n/a'} |`);
lines.push(`| avg_in_flight_requests | ${concurrency?.avgInFlightRequests != null ? Math.round(concurrency.avgInFlightRequests * 10) / 10 : 'n/a'} |`);
lines.push(`| avg_calls_per_iteration | ${concurrency?.avgCallsPerIteration != null ? Math.round(concurrency.avgCallsPerIteration * 10) / 10 : 'n/a'} |`);
lines.push(`| max_calls_per_iteration | ${concurrency?.maxCallsPerIteration ?? 'n/a'} |`);

lines.push('');
lines.push('### 18_throughput');
lines.push('| metric | value |');
lines.push('|--------|-------|');
lines.push(`| avg_req_per_sec | ${concurrency?.avgReqPerSec != null ? Math.round(concurrency.avgReqPerSec * 100) / 100 : 'n/a'} |`);
lines.push(`| total_http_requests | ${concurrency?.totalHttpRequests ?? 'n/a'} |`);
lines.push(`| total_iterations | ${concurrency?.totalIterations ?? 'n/a'} |`);
lines.push(`| requests_per_user | ${concurrency?.requestsPerUser != null ? Math.round(concurrency.requestsPerUser) : 'n/a'} |`);
lines.push(`| vus_max | ${concurrency?.vusMax ?? journey?.vusMax ?? 'n/a'} |`);

lines.push('');
lines.push('### 19_breaking_point');
lines.push('| field | value |');
lines.push('|-------|-------|');
lines.push(`| reached | ${breakingPoint?.reached === true ? 'yes' : breakingPoint?.reached === false ? 'no' : 'n/a'} |`);
lines.push(`| status | ${breakingPoint?.status ?? 'n/a'} |`);
lines.push(`| reasons | ${breakingPoint?.reasons?.join('; ') ?? 'n/a'} |`);

lines.push('');
lines.push('### 20_capacity_assessment');
lines.push('| field | value |');
lines.push('|-------|-------|');
lines.push(`| status | ${capacity?.status ?? 'n/a'} |`);
lines.push(`| detail | ${capacity?.detail ?? 'n/a'} |`);

lines.push('');
lines.push('### 21_endpoint_slowest');
lines.push('| rank | endpoint | count | p95_ms | avg_ms | max_ms |');
lines.push('|------|----------|------:|-------:|-------:|-------:|');
const slowest = endpointSpeed?.slowest || endpointRows.slice().sort((a, b) => (b.p95Ms || 0) - (a.p95Ms || 0)).slice(0, 5);
if (slowest.length) {
  slowest.forEach((r, i) => {
    lines.push(
      `| ${i + 1} | ${r.method} ${r.endpoint} | ${r.count ?? 'n/a'} | ${r.p95Ms != null ? Math.round(r.p95Ms) : 'n/a'} | ${r.avgMs != null ? Math.round(r.avgMs) : 'n/a'} | ${r.maxMs != null ? Math.round(r.maxMs) : 'n/a'} |`,
    );
  });
} else {
  lines.push('| n/a | n/a | n/a | n/a | n/a | n/a |');
}

lines.push('');
lines.push('### 22_endpoint_fastest');
lines.push('| rank | endpoint | count | p95_ms | avg_ms | max_ms |');
lines.push('|------|----------|------:|-------:|-------:|-------:|');
const fastest = endpointSpeed?.fastest || [];
if (fastest.length) {
  fastest.forEach((r, i) => {
    lines.push(
      `| ${i + 1} | ${r.method} ${r.endpoint} | ${r.count ?? 'n/a'} | ${r.p95Ms != null ? Math.round(r.p95Ms) : 'n/a'} | ${r.avgMs != null ? Math.round(r.avgMs) : 'n/a'} | ${r.maxMs != null ? Math.round(r.maxMs) : 'n/a'} |`,
    );
  });
} else {
  lines.push('| n/a | n/a | n/a | n/a | n/a | n/a |');
}

const outPath = path.join(ROOT, OUT);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath} (${lines.length} lines)`);
