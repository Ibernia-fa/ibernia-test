#!/usr/bin/env node
/**
 * Extract all VOLUME_SIGNOFF_SHARD markers from a Phase B k6 log into signoff-shards/.
 *
 * Usage: node tools/extract-phase-b-signoff-from-k6-log.mjs --log path --run-tag TAG [--out-dir path]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readK6LogText } from '../lib/consolidated-slow-capture.js';
import {
  extractAllSignoffShardsFromK6Log,
  buildPhaseBSignoffShardsFromLog,
} from './extract-volume-signoff-from-k6-log.mjs';
import {
  loadSignoffConfigFromObject,
  DEFAULT_SIGNOFF_CONFIG_PATH,
} from '../lib/volume-signoff-core.js';
import { readFileSync, existsSync } from 'node:fs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { log: '', runTag: '', outDir: '', manifest: '', phaseARunTag: '', retro: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--log' && argv[i + 1]) args.log = argv[++i];
    else if (a === '--run-tag' && argv[i + 1]) args.runTag = argv[++i];
    else if (a === '--out-dir' && argv[i + 1]) args.outDir = argv[++i];
    else if (a === '--manifest' && argv[i + 1]) args.manifest = argv[++i];
    else if (a === '--phase-a-run-tag' && argv[i + 1]) args.phaseARunTag = argv[++i];
    else if (a === '--no-retro') args.retro = false;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.log || !args.runTag) {
    console.error('Usage: node tools/extract-phase-b-signoff-from-k6-log.mjs --log path --run-tag TAG');
    process.exit(1);
  }
  const text = readK6LogText(resolve(args.log));
  const config = loadSignoffConfigFromObject(
    JSON.parse(readFileSync(join(repoRoot, DEFAULT_SIGNOFF_CONFIG_PATH), 'utf8')),
  );
  const phaseATag = args.phaseARunTag || args.runTag.replace(/-read$/, '');
  const manifestPath = args.manifest
    ? resolve(args.manifest)
    : join(repoRoot, 'reports', 'phase-a', phaseATag, 'manifest.json');
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : null;

  let shards = extractAllSignoffShardsFromK6Log(text);
  const uniqueMarkerShards = new Set(shards.map((s) => s.shardId).filter(Boolean));
  const expectedShards = manifest?.advisors?.length || 0;

  if (args.retro && manifest?.advisors?.length) {
    const retroShards = buildPhaseBSignoffShardsFromLog(text, {
      config,
      runTag: args.runTag,
      manifestAdvisors: manifest.advisors,
      k6ExitCode: 0,
    });
    if (!shards.length || uniqueMarkerShards.size < expectedShards) {
      if (retroShards.length) {
        if (shards.length && uniqueMarkerShards.size < expectedShards) {
          console.warn(
            `Markers cover ${uniqueMarkerShards.size}/${expectedShards} shard(s); using retro __K6_PERF_WORST__ for Phase B signoff`,
          );
        }
        shards = retroShards;
      }
    }
  }

  if (!shards.length && args.retro) {
    if (!existsSync(manifestPath)) {
      console.error(`No markers and manifest not found: ${manifestPath}`);
      process.exit(1);
    }
    shards = buildPhaseBSignoffShardsFromLog(text, {
      config,
      runTag: args.runTag,
      manifestAdvisors: manifest.advisors || [],
      k6ExitCode: 0,
    });
    if (shards.length) {
      console.warn(`Retrofilled ${shards.length} Phase B shard(s) from __K6_PERF_WORST__`);
    }
  }
  if (!shards.length) {
    console.error('No VOLUME_SIGNOFF_SHARD markers found');
    process.exit(1);
  }
  const outDir = args.outDir
    ? resolve(args.outDir)
    : join(repoRoot, 'reports', 'phase-b', args.runTag, 'signoff-shards');
  mkdirSync(outDir, { recursive: true });
  for (const shard of shards) {
    const sid = (shard.shardId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
    writeFileSync(join(outDir, `signoff-${sid}.json`), `${JSON.stringify(shard, null, 2)}\n`, 'utf8');
  }
  console.log(`Wrote ${shards.length} sign-off shard(s) -> ${outDir}`);
}

main();
