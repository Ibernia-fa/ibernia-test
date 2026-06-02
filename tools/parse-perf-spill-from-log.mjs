#!/usr/bin/env node
/**
 * Parse __K6_PERF_WORST__ and __K6_PERF_SLOW__ lines from a k6 log into spill JSON files.
 *
 * Usage: node tools/parse-perf-spill-from-log.mjs <logFile> <sliceId> [spillDir]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSpillsFromLogFile } from '../lib/consolidated-slow-capture.js';
import { CONSOLIDATED_SPILL_REL } from '../lib/consolidated-perf-spill.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const logPath = process.argv[2];
const sliceId = process.argv[3];
const spillDirArg = process.argv[4];

if (!logPath || !sliceId) {
  console.error('Usage: node tools/parse-perf-spill-from-log.mjs <logFile> <sliceId> [spillDir]');
  process.exit(1);
}

const spillDir = spillDirArg
  ? path.isAbsolute(spillDirArg)
    ? spillDirArg
    : path.join(repoRoot, spillDirArg)
  : path.join(repoRoot, ...CONSOLIDATED_SPILL_REL.split('/'));

const result = writeSpillsFromLogFile(logPath, sliceId, spillDir);
if (result.slowCount || result.worstCount) {
  console.log(
    `spill: slow=${result.slowCount} worst=${result.worstCount} slowPath=${result.slowPath || 'n/a'} worstPath=${result.worstPath || 'n/a'}`,
  );
} else {
  console.log(`spill: (none) slice=${sliceId}`);
}
