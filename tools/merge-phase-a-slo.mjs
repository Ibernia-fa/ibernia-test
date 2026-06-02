#!/usr/bin/env node
/**
 * Merge Phase A per-shard SLO summaries into a fleet rollup.
 *
 * Usage:
 *   node tools/merge-phase-a-slo.mjs <sloShardsDir> [--out path] [--run-tag TAG] [--expected-shards N]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergePhaseASloShards } from '../lib/volume-manifest-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { sloShardsDir: '', out: '', runTag: '', expectedShards: null };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (a === '--run-tag' && argv[i + 1]) args.runTag = argv[++i];
    else if (a === '--expected-shards' && argv[i + 1]) {
      args.expectedShards = parseInt(argv[++i], 10);
    } else if (!a.startsWith('-')) positional.push(a);
  }
  if (positional[0]) args.sloShardsDir = positional[0];
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.sloShardsDir) {
    console.error('Usage: node tools/merge-phase-a-slo.mjs <sloShardsDir> [--out path] [--run-tag TAG]');
    process.exit(1);
  }
  const abs = resolve(args.sloShardsDir);
  const files = readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .sort();
  console.log(
    `[merge-phase-a-slo] sloShardsDir=${abs} expectedShards=${args.expectedShards != null ? args.expectedShards : 'n/a'} discovered=${files.length}`,
  );
  if (files.length) {
    console.log(`[merge-phase-a-slo] discovered files: ${files.join(', ')}`);
  }
  if (!files.length) {
    console.error(`No SLO shard JSON files in ${args.sloShardsDir}`);
    process.exit(1);
  }
  const shards = files.map((f) => JSON.parse(readFileSync(join(abs, f), 'utf8')));
  const merged = mergePhaseASloShards(shards, {
    runTag: args.runTag || undefined,
    expectedShards: args.expectedShards,
  });
  const runTag = merged.runTag || args.runTag || 'phase-a-slo-fleet';
  const defaultOut = join(
    __dirname,
    '..',
    'reports',
    'phase-a',
    runTag.replace(/[^a-zA-Z0-9._-]/g, '_'),
    'slo-summary-fleet.json',
  );
  const outPath = args.out ? resolve(args.out) : defaultOut;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`Merged ${shards.length} SLO shard(s) -> ${outPath}`);
  if (!merged.validation.passed) {
    console.error(
      `[merge-phase-a-slo] validation FAILED: expectedShards=${merged.validation.expectedShards} actualShards=${merged.validation.actualShards} shardCountOk=${merged.validation.shardCountOk}`,
    );
    process.exit(2);
  }
}

main();
