#!/usr/bin/env node
/**
 * Merge volume sign-off shards + attach to slo-summary-fleet.json.
 *
 * Usage:
 *   node tools/merge-volume-signoff-shards.mjs <signoffShardsDir> \
 *     --run-tag TAG --phase A --expected-shards 20 \
 *     [--out signoff-fleet.json] [--slo-fleet path]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mergeVolumeSignoffFleet,
  attachSignoffToSloFleet,
  buildSignoffFleetSection,
} from '../lib/volume-signoff-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function parseArgs(argv) {
  const args = {
    shardsDir: '',
    out: '',
    runTag: '',
    phase: 'A',
    expectedShards: null,
    sloFleetPath: '',
    pairRunTag: '',
    phaseARunTag: '',
    phaseBRunTag: '',
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (a === '--run-tag' && argv[i + 1]) args.runTag = argv[++i];
    else if (a === '--phase' && argv[i + 1]) args.phase = argv[++i];
    else if (a === '--expected-shards' && argv[i + 1]) args.expectedShards = parseInt(argv[++i], 10);
    else if (a === '--slo-fleet' && argv[i + 1]) args.sloFleetPath = argv[++i];
    else if (a === '--pair-run-tag' && argv[i + 1]) args.pairRunTag = argv[++i];
    else if (a === '--phase-a-run-tag' && argv[i + 1]) args.phaseARunTag = argv[++i];
    else if (a === '--phase-b-run-tag' && argv[i + 1]) args.phaseBRunTag = argv[++i];
    else if (!a.startsWith('-')) positional.push(a);
  }
  if (positional[0]) args.shardsDir = positional[0];
  return args;
}

function loadShards(dir) {
  const abs = resolve(dir);
  const files = readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((f) => JSON.parse(readFileSync(join(abs, f), 'utf8')));
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.shardsDir) {
    console.error('Usage: node tools/merge-volume-signoff-shards.mjs <signoffShardsDir> [options]');
    process.exit(1);
  }
  const shards = loadShards(args.shardsDir);
  const expected = args.expectedShards != null ? args.expectedShards : shards.length;
  const phaseKey = args.phase === 'B' ? 'phaseB' : 'phaseA';
  const fleetPartial = {
    [phaseKey]: { shards, expectedShards: expected },
    pairRunTag: args.pairRunTag || args.runTag || null,
    phaseARunTag: args.phaseARunTag || (args.phase === 'A' ? args.runTag : null),
    phaseBRunTag: args.phaseBRunTag || (args.phase === 'B' ? args.runTag : null),
  };

  let existing = null;
  const defaultSignoffFleet = join(
    repoRoot,
    'reports',
    args.phase === 'B' ? 'phase-b' : 'phase-a',
    (args.runTag || 'signoff').replace(/[^a-zA-Z0-9._-]/g, '_'),
    'signoff-fleet.json',
  );
  const outPath = args.out ? resolve(args.out) : defaultSignoffFleet;
  if (existsSync(outPath)) {
    try {
      existing = JSON.parse(readFileSync(outPath, 'utf8'));
    } catch {
      existing = null;
    }
  }

  const merged = mergeVolumeSignoffFleet({
    pairRunTag: fleetPartial.pairRunTag,
    phaseARunTag: fleetPartial.phaseARunTag || (existing && existing.phaseARunTag),
    phaseBRunTag: fleetPartial.phaseBRunTag || (existing && existing.phaseBRunTag),
    phaseA:
      phaseKey === 'phaseA'
        ? fleetPartial.phaseA
        : existing && existing.phaseA
          ? existing.phaseA
          : null,
    phaseB:
      phaseKey === 'phaseB'
        ? fleetPartial.phaseB
        : existing && existing.phaseB
          ? existing.phaseB
          : null,
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`Merged ${shards.length} sign-off shard(s) -> ${outPath}`);

  const sloPath = args.sloFleetPath
    ? resolve(args.sloFleetPath)
    : args.phase === 'A' && args.runTag
      ? join(repoRoot, 'reports', 'phase-a', args.runTag, 'slo-summary-fleet.json')
      : '';
  if (sloPath && existsSync(sloPath) && merged.phaseA) {
    const sloFleet = JSON.parse(readFileSync(sloPath, 'utf8'));
    const updated = attachSignoffToSloFleet(sloFleet, merged);
    writeFileSync(sloPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    console.log(`Attached signoff fleet to ${sloPath}`);
  }
}

main();
