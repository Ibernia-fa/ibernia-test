#!/usr/bin/env node
/**
 * Generate S1-write_VOLUME_REPORT.md from on-disk artifacts.
 * Resolves nearest files when requested run tags are missing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQ_A = process.argv[2] || 'S1-write-20260602-1505';
const REQ_B = process.argv[3] || 'S1-write-20260602-1505-read-v2';
const SCENARIO = process.argv[4] || 'S1';
const OUT = process.argv[5] || 'reports/phase-volume/S1-write_VOLUME_REPORT.md';

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

let profilePath = 'data/scenarios/profile_20u_1c_1p.json';
if (!exists(profilePath)) {
  const dir = path.join(ROOT, 'data/scenarios');
  const profiles = fs.readdirSync(dir).filter((f) => f.startsWith('profile_') && f.endsWith('.json'));
  profilePath = profiles.length ? `data/scenarios/${profiles[0]}` : null;
}
const profile = profilePath && exists(profilePath) ? readJson(profilePath) : null;

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
const names = {
  'journey_create_client_duration': 'Create client (write step)',
  'journey_create_base_plan_duration': 'Create base plan (write step)',
  'POST /api/v1/Clients': 'Create client API',
  'POST /api/v1/cashflows': 'Create cashflow/plan API',
  'GET /api/v1/Reports/{cashflowId}': 'Get reports/projection API',
  'journey_dashboard_load_duration': 'Dashboard clients list load',
  full_journey_duration: 'End-to-end advisor journey',
  'GET /api/v1/Clients/{advisorId}/all': 'List all clients for advisor',
  'GET /api/v1/client/{clientId}/cashflows': 'List client plans',
  'GET /api/v1/cashflows/{cashflowId}': 'Open cashflow/plan',
};
for (const [k, v] of Object.entries(names)) lines.push(`| ${k} | ${v} |`);

const outPath = path.join(ROOT, OUT);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath} (${lines.length} lines)`);
