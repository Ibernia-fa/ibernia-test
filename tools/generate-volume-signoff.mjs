#!/usr/bin/env node
/**
 * Generate unified volume sign-off markdown + signoff-fleet.json for a Phase A / B pair.
 *
 * Usage:
 *   node tools/generate-volume-signoff.mjs \
 *     --pair-run-tag S1-write-20260602-1505 \
 *     --phase-a-run-tag S1-write-20260602-1505 \
 *     [--phase-b-run-tag S1-write-20260602-1505-read] \
 *     [--retro-phase-a] [--expected-shards 20]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mergeVolumeSignoffFleet,
  formatSignoffSectionMarkdown,
  loadSignoffConfigFromObject,
  DEFAULT_SIGNOFF_CONFIG_PATH,
} from '../lib/volume-signoff-core.js';
import {
  buildSignoffShardFromLog,
  extractSignoffShardFromK6Log,
  buildPhaseBSignoffShardsFromLog,
  extractAllSignoffShardsFromK6Log,
} from './extract-volume-signoff-from-k6-log.mjs';
import { readK6LogText } from '../lib/consolidated-slow-capture.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function parseArgs(argv) {
  const args = {
    pairRunTag: '',
    phaseARunTag: '',
    phaseBRunTag: '',
    expectedShards: 20,
    retroPhaseA: false,
    out: '',
    configPath: DEFAULT_SIGNOFF_CONFIG_PATH,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pair-run-tag' && argv[i + 1]) args.pairRunTag = argv[++i];
    else if (a === '--phase-a-run-tag' && argv[i + 1]) args.phaseARunTag = argv[++i];
    else if (a === '--phase-b-run-tag' && argv[i + 1]) args.phaseBRunTag = argv[++i];
    else if (a === '--expected-shards' && argv[i + 1]) args.expectedShards = parseInt(argv[++i], 10);
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (a === '--config' && argv[i + 1]) args.configPath = argv[++i];
    else if (a === '--retro-phase-a') args.retroPhaseA = true;
  }
  if (!args.pairRunTag && args.phaseARunTag) args.pairRunTag = args.phaseARunTag;
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

function loadSignoffShardsFromDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

function collectPhaseAShards(args, config) {
  const runRoot = join(repoRoot, 'reports', 'phase-a', args.phaseARunTag);
  const shardDir = join(runRoot, 'signoff-shards');
  let shards = loadSignoffShardsFromDir(shardDir);
  if (shards.length >= args.expectedShards) return shards;

  const meta = readJson(join(runRoot, 'run-metadata.json'));
  const runs = meta && meta.advisorRuns ? meta.advisorRuns : [];
  if (!runs.length && !args.retroPhaseA) return shards;

  const built = [];
  for (const run of runs) {
    const existing = shards.find((s) => s.shardId === run.shardId);
    if (existing) {
      built.push(existing);
      continue;
    }
    const logPath = join(runRoot, 'logs', run.advisorKey, 'k6.log');
    if (!existsSync(logPath)) continue;
    const text = readK6LogText(logPath);
    const shard = buildSignoffShardFromLog(
      text,
      {
        phase: 'A',
        runTag: args.phaseARunTag,
        shardId: run.shardId,
        advisorEmail: run.advisorEmail,
        k6ExitCode: run.exitCode,
      },
      config,
      args.retroPhaseA || !extractSignoffShardFromK6Log(text),
    );
    if (shard) built.push(shard);
  }
  return built.length ? built : shards;
}

function collectPhaseBShards(args, config, manifest) {
  if (!args.phaseBRunTag) return [];
  const runRoot = join(repoRoot, 'reports', 'phase-b', args.phaseBRunTag);
  let shards = loadSignoffShardsFromDir(join(runRoot, 'signoff-shards'));
  if (shards.length >= args.expectedShards) return shards;

  const logPath = join(runRoot, 'k6.log');
  if (!existsSync(logPath) || !manifest || !manifest.advisors) return shards;

  const text = readK6LogText(logPath);
  const fromMarkers = extractAllSignoffShardsFromK6Log(text);
  if (fromMarkers.length) {
    const byShard = new Map();
    for (const s of fromMarkers) {
      if (s.shardId) byShard.set(s.shardId, s);
    }
    return Array.from(byShard.values());
  }

  const retro = buildPhaseBSignoffShardsFromLog(text, {
    config,
    runTag: args.phaseBRunTag,
    manifestAdvisors: manifest.advisors,
    k6ExitCode: 0,
  });
  return retro.length ? retro : shards;
}

function countK6Exit99(meta) {
  if (!meta || !meta.advisorRuns) return { exit0: 0, exit99: 0, other: 0 };
  let exit0 = 0;
  let exit99 = 0;
  let other = 0;
  for (const r of meta.advisorRuns) {
    if (r.exitCode === 0) exit0 += 1;
    else if (r.exitCode === 99) exit99 += 1;
    else other += 1;
  }
  return { exit0, exit99, other };
}

function buildUnifiedMarkdown(args, fleet, extras) {
  const lines = [];
  lines.push(`# Volume sign-off — ${args.pairRunTag}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Run pair');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Pair run tag | \`${args.pairRunTag}\` |`);
  lines.push(`| Phase A (write) | \`${args.phaseARunTag}\` |`);
  lines.push(
    `| Phase B (read) | ${args.phaseBRunTag ? `\`${args.phaseBRunTag}\`` : '_pending — run Phase B read_'} |`,
  );
  lines.push(`| SLO config | \`${args.configPath}\` |`);
  lines.push('');

  lines.push('## Data gates');
  lines.push('');
  const mv = extras.manifestValidation;
  if (mv) {
    lines.push(
      `| Gate | Expected | Actual | Result |`,
      `|------|----------|--------|--------|`,
      `| Clients (write) | ${mv.expectedClients} | ${mv.actualClients} | ${mv.clientCountOk ? 'PASS' : 'FAIL'} |`,
      `| Plans (write) | ${mv.expectedPlans} | ${mv.actualPlans} | ${mv.planCountOk ? 'PASS' : 'FAIL'} |`,
      `| Shards | ${mv.expectedShards} | ${mv.actualShards} | ${mv.shardCountOk ? 'PASS' : 'FAIL'} |`,
      `| Manifest validation | — | — | ${mv.passed ? 'PASS' : 'FAIL'} |`,
    );
  } else {
    lines.push('_Manifest validation not found._');
  }
  lines.push('');
  if (extras.profileFile) {
    lines.push(`Phase B profile/manifest binding: \`${extras.profileFile}\``);
    lines.push('');
  }

  lines.push(formatSignoffSectionMarkdown(fleet.phaseA, 'Phase A — write profile'));
  lines.push(formatSignoffSectionMarkdown(fleet.phaseB, 'Phase B — read profile'));

  lines.push('## Errors & runner');
  lines.push('');
  lines.push('| Category | Value |');
  lines.push('|----------|-------|');
  lines.push(`| Auth failure rate | ${extras.authRate != null ? extras.authRate : 'not measured'} |`);
  lines.push(`| Business failure rate | ${extras.businessRate != null ? extras.businessRate : 'not measured'} |`);
  lines.push(`| HTTP failure rate | ${extras.httpFailRate != null ? extras.httpFailRate : 'not measured'} |`);
  if (extras.phaseAMeta) {
    const ec = countK6Exit99(extras.phaseAMeta);
    lines.push(`| Phase A k6 exit 0 | ${ec.exit0} |`);
    lines.push(`| Phase A k6 exit 99 | ${ec.exit99} _(k6 thresholds, not functional fail)_ |`);
    if (ec.other) lines.push(`| Phase A k6 other exit | ${ec.other} |`);
  }
  lines.push('');

  lines.push('## Fleet custom SLO gate');
  lines.push('');
  const slo = extras.sloFleet;
  if (slo && slo.fleet) {
    lines.push(
      `- Phase A fleet gate: **${slo.fleet.gateFailed === 0 ? 'PASS' : 'FAIL'}** (passed ${slo.fleet.gatePassed}, failed ${slo.fleet.gateFailed})`,
    );
  } else {
    lines.push('- Phase A fleet gate: _not found_');
  }
  if (extras.phaseBSlo && extras.phaseBSlo.gate) {
    lines.push(`- Phase B gate: **${extras.phaseBSlo.gate.passed ? 'PASS' : 'FAIL'}**`);
  } else if (args.phaseBRunTag) {
    lines.push('- Phase B gate: _pending_');
  }
  lines.push('');

  lines.push('## Recommendation');
  lines.push('');
  const phaseAOk =
    fleet.phaseA &&
    fleet.phaseA.shardsAnyOver === 0 &&
    mv &&
    mv.passed &&
    (slo ? slo.fleet.gateFailed === 0 : true);
  const phaseBReady = !args.phaseBRunTag || (fleet.phaseB && fleet.phaseB.actualShards > 0);
  if (phaseAOk && phaseBReady && fleet.phaseB && fleet.phaseB.shardsAnyOver === 0) {
    lines.push('**GO** — S1 write + read sign-off complete. Proceed toward S2 after review.');
  } else if (phaseAOk && !args.phaseBRunTag) {
    lines.push(
      '**GO (Phase A only)** — Write seed and data gates pass. Run Phase B read, then re-generate this report before S2.',
    );
  } else {
    lines.push('**NO-GO (or incomplete)** — Review budget tables and data gates before S2.');
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`Machine output: \`reports/phase-volume/${args.pairRunTag}_signoff-fleet.json\``);
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.phaseARunTag) {
    console.error(
      'Usage: node tools/generate-volume-signoff.mjs --phase-a-run-tag TAG [--phase-b-run-tag TAG] [--retro-phase-a]',
    );
    process.exit(1);
  }

  const config = loadSignoffConfigFromObject(
    JSON.parse(readFileSync(resolve(repoRoot, args.configPath), 'utf8')),
  );

  const phaseARoot = join(repoRoot, 'reports', 'phase-a', args.phaseARunTag);
  const manifest = readJson(join(phaseARoot, 'manifest.json'));

  const phaseAShards = collectPhaseAShards(args, config);
  const phaseBShards = collectPhaseBShards(args, config, manifest);

  const fleet = mergeVolumeSignoffFleet({
    pairRunTag: args.pairRunTag,
    phaseARunTag: args.phaseARunTag,
    phaseBRunTag: args.phaseBRunTag || null,
    phaseA: phaseAShards.length ? { shards: phaseAShards, expectedShards: args.expectedShards } : null,
    phaseB: phaseBShards.length ? { shards: phaseBShards, expectedShards: args.expectedShards } : null,
  });

  const phaseAMeta = readJson(join(phaseARoot, 'run-metadata.json'));
  const sloFleet = readJson(join(phaseARoot, 'slo-summary-fleet.json'));
  const phaseBSlo = args.phaseBRunTag
    ? readJson(join(repoRoot, 'reports', 'phase-b', args.phaseBRunTag, 'slo-summary.json'))
    : null;

  const volDir = join(repoRoot, 'reports', 'phase-volume');
  mkdirSync(volDir, { recursive: true });
  const fleetOut = join(volDir, `${args.pairRunTag}_signoff-fleet.json`);
  writeFileSync(fleetOut, `${JSON.stringify(fleet, null, 2)}\n`, 'utf8');

  const mdOut =
    args.out || join(volDir, `${args.pairRunTag}_SIGNOFF.md`);
  const md = buildUnifiedMarkdown(args, fleet, {
    manifestValidation: manifest && manifest.validation ? manifest.validation : null,
    profileFile: manifest && manifest.manifestProfileFile ? manifest.manifestProfileFile : null,
    phaseAMeta,
    sloFleet,
    phaseBSlo,
    authRate: null,
    businessRate: null,
    httpFailRate: null,
  });
  writeFileSync(mdOut, md, 'utf8');

  if (sloFleet && fleet.phaseA) {
    const sloPath = join(phaseARoot, 'slo-summary-fleet.json');
    const updated = {
      ...sloFleet,
      signoff: { phase: 'A', fleet: fleet.phaseA },
    };
    writeFileSync(sloPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  }

  console.log(`Sign-off fleet -> ${fleetOut}`);
  console.log(`Sign-off report -> ${mdOut}`);
  console.log(`Phase A shards: ${phaseAShards.length}, Phase B shards: ${phaseBShards.length}`);
}

main();
