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
import { buildSignoffFleetSection } from '../lib/volume-signoff-core.js';
import { buildPhaseASummaryMarkdown } from '../lib/phase-a-summary-core.js';

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

  const sloGate =
    sloFleet && sloFleet.gate
      ? sloFleet.gate
      : sloFleet && sloFleet.validation
        ? { passed: sloFleet.validation.passed }
        : null;

  const signoffSection =
    signoffFleet?.phaseA ||
    (signoffFleet?.shards
      ? buildSignoffFleetSection(signoffFleet.shards, signoffFleet.expectedShards)
      : null);

  const markdown = buildPhaseASummaryMarkdown({
    runTag,
    runMeta,
    manifest,
    signoffSection,
    sloGate,
    sloFleet,
    generatedAt: new Date().toISOString(),
  });

  const outPath = join(runRoot, 'summary.md');
  writeFileSync(outPath, markdown, 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();
