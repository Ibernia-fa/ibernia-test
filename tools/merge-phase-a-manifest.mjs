#!/usr/bin/env node
/**
 * Merge Phase A manifest shards into a single phase-a-manifest JSON.
 *
 * Usage:
 *   node tools/merge-phase-a-manifest.mjs <shardsDir> [--out merged.json] [--run-tag TAG]
 *     [--expected-clients N] [--expected-plans N] [--expected-shards N]
 *     [--scenario-json '{...}'] [--scenario-json-file path]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergePhaseAManifestShards, parseManifestShard } from '../lib/volume-manifest-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {
    shardsDir: '',
    out: '',
    runTag: '',
    expectedClients: null,
    expectedPlans: null,
    expectedShards: null,
    iterations: 1,
    scenario: null,
    scenarioJsonFile: '',
    profileOut: '',
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) {
      args.out = argv[++i];
    } else if (a === '--run-tag' && argv[i + 1]) {
      args.runTag = argv[++i];
    } else if (a === '--profile-out' && argv[i + 1]) {
      args.profileOut = argv[++i];
    } else if (a === '--expected-clients' && argv[i + 1]) {
      args.expectedClients = parseInt(argv[++i], 10);
    } else if (a === '--expected-plans' && argv[i + 1]) {
      args.expectedPlans = parseInt(argv[++i], 10);
    } else if (a === '--expected-shards' && argv[i + 1]) {
      args.expectedShards = parseInt(argv[++i], 10);
    } else if (a === '--iterations' && argv[i + 1]) {
      args.iterations = parseInt(argv[++i], 10);
    } else if (a === '--scenario-json' && argv[i + 1]) {
      args.scenario = JSON.parse(argv[++i]);
    } else if (a === '--scenario-json-file' && argv[i + 1]) {
      args.scenarioJsonFile = argv[++i];
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  if (positional[0]) args.shardsDir = positional[0];
  return args;
}

function loadShards(dir) {
  const abs = resolve(dir);
  const files = readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const shards = [];
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(abs, f), 'utf8'));
    shards.push(parseManifestShard(raw));
  }
  return shards;
}

function printManifestValidationFailure(validation) {
  if (!validation) return;
  console.error('[merge-phase-a-manifest] validation FAILED:');
  console.error(`  expectedClients=${validation.expectedClients} actualClients=${validation.actualClients} clientCountOk=${validation.clientCountOk}`);
  console.error(`  expectedPlans=${validation.expectedPlans} actualPlans=${validation.actualPlans} planCountOk=${validation.planCountOk}`);
  console.error(`  expectedShards=${validation.expectedShards} actualShards=${validation.actualShards} shardCountOk=${validation.shardCountOk}`);
  console.error(`  duplicateAdvisorOk=${validation.duplicateAdvisorOk}`);
  if (validation.duplicateAdvisorSubs && validation.duplicateAdvisorSubs.length) {
    console.error(`  duplicateAdvisorSubs=${JSON.stringify(validation.duplicateAdvisorSubs)}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.scenarioJsonFile) {
    args.scenario = JSON.parse(readFileSync(resolve(args.scenarioJsonFile), 'utf8'));
  }
  if (!args.shardsDir) {
    console.error(
      'Usage: node tools/merge-phase-a-manifest.mjs <shardsDir> [--out path] [--run-tag TAG] ' +
        '[--expected-clients N] [--expected-plans N] [--expected-shards N] ' +
        '[--scenario-json {...}] [--scenario-json-file path]',
    );
    process.exit(1);
  }

  const shards = loadShards(args.shardsDir);
  if (!shards.length) {
    console.error(`No shard JSON files found in ${args.shardsDir}`);
    process.exit(1);
  }

  const merged = mergePhaseAManifestShards(shards, {
    runTag: args.runTag || undefined,
    expectedClients: args.expectedClients,
    expectedPlans: args.expectedPlans,
    expectedShards: args.expectedShards,
    iterations: args.iterations,
    scenario: args.scenario,
  });

  const runTag = merged.runTag || args.runTag || 'phase-a-merged';
  const defaultOut = join(
    __dirname,
    '..',
    'reports',
    'phase-a',
    runTag.replace(/[^a-zA-Z0-9._-]/g, '_'),
    'manifest.json',
  );
  const outPath = args.out ? resolve(args.out) : defaultOut;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  if (args.profileOut) {
    const profilePath = resolve(args.profileOut);
    mkdirSync(dirname(profilePath), { recursive: true });
    writeFileSync(profilePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`Profile copy -> ${profilePath}`);
  }

  console.log(`Merged ${shards.length} shard(s) -> ${outPath}`);
  console.log(
    `totals: clients=${merged.totals.clients} plans=${merged.totals.plans} ` +
      `validation.passed=${merged.validation.passed} ` +
      `duplicateAdvisorOk=${merged.validation.duplicateAdvisorOk}`,
  );
  if (!merged.validation.passed) {
    printManifestValidationFailure(merged.validation);
    process.exit(2);
  }
}

main();
