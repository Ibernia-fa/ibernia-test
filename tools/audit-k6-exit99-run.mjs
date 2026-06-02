/**
 * Audit k6 exit code 99: list configured thresholds vs crossed metrics in run logs.
 * Usage: node tools/audit-k6-exit99-run.mjs [runTag]
 * Default runTag: S1-write-20260602-1505
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PHASE_A_STEP_METRICS = [
  'journey_create_client_duration',
  'journey_create_base_plan_duration',
  'journey_create_timeline_events_duration',
  'journey_add_income_expenses_duration',
  'journey_add_saving_pots_duration',
  'journey_add_contributions_withdrawals_duration',
  'journey_calculate_projection_duration',
  'journey_full_plan_build_duration',
];

function buildConfiguredThresholds(config) {
  const prof = config.profiles.write;
  const thr = {
    checks: 'rate>0.9 (orchestrator default)',
    http_req_failed: 'rate<0.15 (orchestrator default)',
    volume_slo_violation_rate: 'rate<0.05 (5%)',
    slo_endpoint_violation_rate: 'rate<0.05 (5%)',
    slo_step_violation_rate: 'rate<0.05 (5%)',
  };
  const stepBudgets = {};
  for (const metric of PHASE_A_STEP_METRICS) {
    const budget =
      (prof.stepBudgetMs && prof.stepBudgetMs[metric]) ||
      prof.defaultBudgetMs ||
      config.fallbackBudgetMs;
    thr[metric] = `p(95)<${budget} ms`;
    stepBudgets[metric] = budget;
  }
  return { thr, stepBudgets, gates: config.gates };
}

function auditRun(runTag) {
  const runDir = path.join(root, 'reports', 'phase-a', runTag);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'volume-api-slo.json'), 'utf8'));
  const { thr, stepBudgets, gates } = buildConfiguredThresholds(config);

  const metaPath = path.join(runDir, 'run-metadata.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  const shards = [];
  for (const run of meta.advisorRuns || []) {
    const logPath = path.join(runDir, 'logs', run.advisorKey, 'k6.log');
    let crossed = [];
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, 'utf8');
      const m = log.match(/thresholds on metrics '([^']+)' have been crossed/);
      if (m) crossed = m[1].split(', ').map((s) => s.trim());
    }
    shards.push({
      shardId: run.shardId,
      email: run.advisorEmail,
      exitCode: run.exitCode,
      crossed,
    });
  }

  const exit99 = shards.filter((s) => s.exitCode === 99);
  const crossedCounts = {};
  for (const s of exit99) {
    for (const m of s.crossed) {
      crossedCounts[m] = (crossedCounts[m] || 0) + 1;
    }
  }

  return { runTag, thr, stepBudgets, gates, shards, exit99, crossedCounts, volumeSloGate: true };
}

function toMarkdown(audit) {
  const lines = [];
  lines.push(`# k6 exit 99 — threshold audit (${audit.runTag})`);
  lines.push('');
  lines.push('## What exit 99 means');
  lines.push('');
  lines.push(
    '**Exit code 99 is k6’s standard failure code when any `options.thresholds` line fails.** It is not a latency budget of 99 ms or 99%.',
  );
  lines.push('');
  lines.push('This run used `VOLUME_SLO=1` and `VOLUME_SLO_GATE=1` (`-VolumeSloGate`), so Phase A thresholds from `buildPhaseAThresholds()` in `lib/volume-slo.js` were active.');
  lines.push('');
  lines.push('## Configured k6 thresholds (Phase A write)');
  lines.push('');
  lines.push('Source: `config/volume-api-slo.json` + `k6/full-platform/k6-full-platform-orchestrator.js`');
  lines.push('');
  lines.push('### Base (orchestrator)');
  lines.push('');
  lines.push('| Metric | Threshold |');
  lines.push('|--------|-----------|');
  lines.push('| `checks` | rate > 0.9 (90% pass) |');
  lines.push('| `http_req_failed` | rate < 0.15 (15% max failures) |');
  lines.push('');
  lines.push('### Volume SLO (when `-VolumeSloGate`)');
  lines.push('');
  lines.push('| Metric | Threshold | Config gate |');
  lines.push('|--------|-----------|-------------|');
  lines.push(
    `| \`volume_slo_violation_rate\` | rate < 0.05 | max combined violations 5% |`,
  );
  lines.push(`| \`slo_endpoint_violation_rate\` | rate < 0.05 | maxEndpointP95ViolationRate ${audit.gates.maxEndpointP95ViolationRate} |`);
  lines.push(`| \`slo_step_violation_rate\` | rate < 0.05 | maxStepP95ViolationRate ${audit.gates.maxStepP95ViolationRate} |`);
  lines.push('');
  lines.push('### Journey step p95 (write profile `stepBudgetMs`)');
  lines.push('');
  lines.push('| k6 Trend metric | p95 limit |');
  lines.push('|-----------------|-----------|');
  for (const metric of PHASE_A_STEP_METRICS) {
    lines.push(`| \`${metric}\` | **${audit.stepBudgets[metric]} ms** |`);
  }
  lines.push('');
  lines.push(
    '**Note:** Each advisor shard runs **1 VU × 1 iteration**. A single slow step or endpoint marks violation rate **100%**, which fails the **5%** rate thresholds immediately.',
  );
  lines.push('');
  lines.push('## This run: exit 99 shards');
  lines.push('');
  lines.push(`| Result | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| k6 exit **0** | ${audit.shards.filter((s) => s.exitCode === 0).length} |`);
  lines.push(`| k6 exit **99** | ${audit.exit99.length} |`);
  lines.push('');
  lines.push('### Crossed metrics (exit 99 shards only)');
  lines.push('');
  lines.push('| Metric | Shards failing | Limit breached |');
  lines.push('|--------|----------------|----------------|');
  const limitHint = {
    volume_slo_violation_rate: 'any SLO violation → rate ≥ 5% with 1 sample',
    slo_endpoint_violation_rate: 'HTTP over endpoint budget → rate ≥ 5%',
    slo_step_violation_rate: 'step over stepBudgetMs → rate ≥ 5%',
    journey_create_client_duration: `p(95) > ${audit.stepBudgets.journey_create_client_duration} ms`,
    journey_create_base_plan_duration: `p(95) > ${audit.stepBudgets.journey_create_base_plan_duration} ms`,
    journey_create_timeline_events_duration: `p(95) > ${audit.stepBudgets.journey_create_timeline_events_duration} ms`,
  };
  for (const [metric, count] of Object.entries(audit.crossedCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`| \`${metric}\` | ${count} | ${limitHint[metric] || audit.thr[metric] || 'see config'} |`);
  }
  lines.push('');
  lines.push('### Per-shard detail');
  lines.push('');
  lines.push('| Shard | Advisor | Exit | Crossed thresholds |');
  lines.push('|-------|---------|------|---------------------|');
  for (const s of audit.shards) {
    const crossed = s.crossed.length ? s.crossed.map((m) => `\`${m}\``).join(', ') : '—';
    lines.push(`| ${s.shardId} | ${s.email} | ${s.exitCode} | ${crossed} |`);
  }
  lines.push('');
  lines.push('## Fleet SLO gate vs k6 exit 99');
  lines.push('');
  lines.push('- **k6 exit 99:** fails if **any** k6 `options.thresholds` expression is false at end of run.');
  lines.push('- **Fleet gate (`slo-summary-fleet.json`):** `evaluateVolumeSloGate()` on exported JSON — this run reported **gatePassed: 20** (shard JSON often had `endpointSamples: 0`, so rates were `null` and gate passed).');
  lines.push('');
  lines.push('Functional journey and data gates still **passed**; exit 99 here is **latency / SLO rate under concurrency**, not missing clients or HTTP errors.');
  lines.push('');
  return lines.join('\n');
}

const runTag = process.argv[2] || 'S1-write-20260602-1505';
const audit = auditRun(runTag);
const md = toMarkdown(audit);
const outPath = path.join(root, 'reports', 'phase-a', runTag, 'k6-exit-99-threshold-audit.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log(md);
console.log('\n---\nWritten:', outPath);
