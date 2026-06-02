#!/usr/bin/env node
/**
 * Re-parse __K6_PERF_SLOW__ / __K6_PERF_WORST__ from all logs under a concurrent run.
 *
 * Usage:
 *   node tools/reparse-run-spills.mjs concurrent-20260521-154819
 *   node tools/reparse-run-spills.mjs --run-id concurrent-20260521-154819
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSpillsFromLogFile } from '../lib/consolidated-slow-capture.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let runId = '';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--run-id' && argv[i + 1]) runId = argv[++i];
    else if (!argv[i].startsWith('-')) runId = argv[i];
  }
  return { runId };
}

const { runId } = parseArgs(process.argv);
if (!runId) {
  console.error('Usage: node tools/reparse-run-spills.mjs <run-id>');
  process.exit(1);
}

const logsRoot = path.join(repoRoot, 'reports/consolidated/runs', runId, 'logs');
const spillRoot = path.join(repoRoot, 'reports/consolidated/runs', runId, 'spill');
if (!fs.existsSync(logsRoot)) {
  console.error(`No logs dir: ${logsRoot}`);
  process.exit(2);
}

let totalSlow = 0;
let totalWorst = 0;
let files = 0;

for (const ent of fs.readdirSync(logsRoot, { withFileTypes: true })) {
  if (!ent.isDirectory() || !ent.name.startsWith('user-')) continue;
  const logDir = path.join(logsRoot, ent.name);
  const spillDir = path.join(spillRoot, ent.name);
  for (const f of fs.readdirSync(logDir)) {
    if (!f.endsWith('.log')) continue;
    const sliceId = f.replace(/\.log$/, '');
    const logPath = path.join(logDir, f);
    const result = writeSpillsFromLogFile(logPath, sliceId, spillDir);
    totalSlow += result.slowCount || 0;
    totalWorst += result.worstCount || 0;
    files += 1;
  }
}

console.log(
  `reparse-run-spills: run=${runId} logs=${files} slowRecords=${totalSlow} worstEndpoints=${totalWorst} spillRoot=${spillRoot}`,
);
