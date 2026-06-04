#!/usr/bin/env node
/**
 * Generate Phase A human-readable summary.md from run artifacts.
 *
 * Usage:
 *   node tools/generate-phase-a-summary.mjs --run-tag TAG [--run-root path]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildQuotaBreachSummary,
  formatQuotaBreachSummaryMarkdown,
  buildSignoffFleetSection,
} from '../lib/volume-signoff-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function parseArgs(argv) {
  const args = { runTag: '', runRoot: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--run-tag' && argv[i + 1]) args.runTag = argv[++i];
    else if (a === '--run-root' && argv[i + 1]) args.runRoot = argv[++i];
  }
  return args;
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function fmtBool(v) {
  return v ? 'PASS' : 'FAIL';
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.runTag && !args.runRoot) {
    console.error('Usage: node tools/generate-phase-a-summary.mjs --run-tag TAG [--run-root path]');
    process.exit(1);
  }
  const runRoot = args.runRoot
    ? resolve(args.runRoot)
    : join(repoRoot, 'reports', 'phase-a', args.runTag);
  const runTag = args.runTag || runRoot.split(/[/\\]/).pop();

  const manifest = readJson(join(runRoot, 'manifest.json'));
  const runMeta = readJson(join(runRoot, 'run-metadata.json'));
  const sloFleet = readJson(join(runRoot, 'slo-summary-fleet.json'));
  const signoffFleet = readJson(join(runRoot, 'signoff-fleet.json'));

  const validation = manifest && manifest.validation ? manifest.validation : null;
  const totals = manifest && manifest.totals ? manifest.totals : { clients: 0, plans: 0 };
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

  const failedJobs =
    runMeta && runMeta.failedJobs && runMeta.failedJobs.length
      ? runMeta.failedJobs
      : runMeta && runMeta.advisorRuns
        ? runMeta.advisorRuns.filter((r) => r.jobFailed).map((r) => r.advisorKey || r.workerName)
        : [];

  const sloGate =
    sloFleet && sloFleet.gate
      ? sloFleet.gate
      : sloFleet && sloFleet.validation
        ? { passed: sloFleet.validation.passed }
        : null;

  const elapsedSec = runMeta && runMeta.runElapsedSec != null ? runMeta.runElapsedSec : 'n/a';
  const scenario = runMeta && runMeta.volumeScenario ? runMeta.volumeScenario : 'n/a';
  const profilePath = runMeta && runMeta.manifestProfileFile ? runMeta.manifestProfileFile : 'n/a';

  const lines = [
    `# Phase A volume summary — ${runTag}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Scenario',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Scenario | ${scenario} |`,
    `| Advisors | ${runMeta && runMeta.advisors != null ? runMeta.advisors : 'n/a'} |`,
    `| Parallel advisor jobs | ${runMeta && runMeta.concurrency != null ? runMeta.concurrency : 'n/a'} |`,
    `| Top-up parallel jobs | ${runMeta && runMeta.topUpConcurrency != null ? runMeta.topUpConcurrency : runMeta && runMeta.concurrency != null ? runMeta.concurrency : 'n/a'} |`,
    `| Clients/advisor | ${runMeta && runMeta.clientsPerAdvisor != null ? runMeta.clientsPerAdvisor : 'n/a'} |`,
    `| Plans/client | ${runMeta && runMeta.plansPerClient != null ? runMeta.plansPerClient : 'n/a'} |`,
    `| Profile file | ${profilePath} |`,
    `| Elapsed (s) | ${elapsedSec} |`,
    '',
    '## Data gates',
    '',
    `| Gate | Expected | Actual | Result |`,
    `|------|----------|--------|--------|`,
    `| Clients | ${expectedClients} | ${totals.clients} | ${validation ? fmtBool(validation.clientCountOk) : 'n/a'} |`,
    `| Plans | ${expectedPlans} | ${totals.plans} | ${validation ? fmtBool(validation.planCountOk) : 'n/a'} |`,
    `| Shards | ${validation && validation.expectedShards != null ? validation.expectedShards : 'n/a'} | ${validation && validation.actualShards != null ? validation.actualShards : 'n/a'} | ${validation ? fmtBool(validation.shardCountOk) : 'n/a'} |`,
    `| Manifest validation | — | — | ${validation ? fmtBool(validation.passed) : 'n/a'} |`,
    '',
    '## SLO gates',
    '',
    sloGate
      ? `- Fleet SLO gate: **${fmtBool(sloGate.passed)}**`
      : '- Fleet SLO summary not found (slo-summary-fleet.json missing)',
    sloFleet && sloFleet.rates
      ? `- Endpoint violation rate: ${sloFleet.rates.endpointViolationRate != null ? (sloFleet.rates.endpointViolationRate * 100).toFixed(2) + '%' : 'n/a'}`
      : '',
    sloFleet && sloFleet.rates
      ? `- Step violation rate: ${sloFleet.rates.stepViolationRate != null ? (sloFleet.rates.stepViolationRate * 100).toFixed(2) + '%' : 'n/a'}`
      : '',
    sloFleet && sloFleet.rates
      ? `- Hard max violation rate: ${sloFleet.rates.hardMaxViolationRate != null ? (sloFleet.rates.hardMaxViolationRate * 100).toFixed(2) + '%' : 'n/a'}`
      : '',
    '',
    '## Failed advisor jobs',
    '',
    failedJobs.length ? failedJobs.map((f) => `- ${f}`).join('\n') : '- (none)',
    '',
  ];

  const signoffSection =
    signoffFleet?.phaseA ||
    (signoffFleet?.shards ? buildSignoffFleetSection(signoffFleet.shards, signoffFleet.expectedShards) : null);
  if (signoffSection?.shards?.length) {
    lines.push('## Latency budget (sign-off)');
    lines.push('');
    lines.push(formatQuotaBreachSummaryMarkdown(buildQuotaBreachSummary(signoffSection), 'Phase A write'));
  } else {
    lines.push('## Latency budget (sign-off)');
    lines.push('');
    lines.push('_Sign-off fleet not found (signoff-fleet.json missing or empty)._');
    lines.push('');
  }

  const outPath = join(runRoot, 'summary.md');
  writeFileSync(outPath, `${lines.filter(Boolean).join('\n')}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();
