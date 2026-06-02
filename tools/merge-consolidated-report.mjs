#!/usr/bin/env node
/**
 * Merge per-script API perf slices into the single consolidated report (updated in place).
 *
 * Usage:
 *   node tools/merge-consolidated-report.mjs
 *   node tools/merge-consolidated-report.mjs --run-id baseline-20260520-123247 --threshold-ms 100
 *   node tools/merge-consolidated-report.mjs --slices-dir reports/consolidated/runs/my-run/slices
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONSOLIDATED_JSON_REL,
  CONSOLIDATED_MD_REL,
  CONSOLIDATED_PDF_REL,
  CONSOLIDATED_SLICES_REL,
} from '../lib/consolidated-perf-paths.js';
import { renderConsolidatedReportPdf } from '../lib/render-consolidated-report-pdf.js';
import {
  buildConsolidatedReport,
  formatConsolidatedMarkdown,
} from '../lib/consolidated-report-generator.js';
import { enrichSlicesWithSpill } from '../lib/consolidated-perf-spill.js';
import {
  loadAllSlowRequestSpills,
  loadSlowRequestsFromSlices,
} from '../lib/consolidated-slow-capture.js';
import { CONSOLIDATED_SPILL_REL } from '../lib/consolidated-perf-spill.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const out = {
    runId: '',
    thresholdMs: 100,
    slowCaptureThresholdMs: 300,
    slicesDir: '',
    spillDir: '',
    outDir: '',
    environment: '',
    noPdf: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--run-id' && argv[i + 1]) {
      out.runId = argv[++i];
    } else if (a === '--threshold-ms' && argv[i + 1]) {
      out.thresholdMs = parseInt(argv[++i], 10) || 100;
    } else if (a === '--slow-capture-ms' && argv[i + 1]) {
      out.slowCaptureThresholdMs = parseInt(argv[++i], 10) || 300;
    } else if (a === '--slices-dir' && argv[i + 1]) {
      out.slicesDir = argv[++i];
    } else if (a === '--spill-dir' && argv[i + 1]) {
      out.spillDir = argv[++i];
    } else if (a === '--out-dir' && argv[i + 1]) {
      out.outDir = argv[++i];
    } else if (a === '--environment' && argv[i + 1]) {
      out.environment = argv[++i];
    } else if (a === '--no-pdf') {
      out.noPdf = true;
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    }
  }
  return out;
}

/**
 * @param {string} rootDir
 * @returns {object[]}
 */
function loadSlicesFromDir(rootDir) {
  if (!fs.existsSync(rootDir)) {
    console.error(`No slice directory: ${rootDir}`);
    process.exit(2);
  }
  const slices = [];

  function walk(dir, subdirRel = '') {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const nextRel = subdirRel ? `${subdirRel}/${ent.name}` : ent.name;
        walk(p, nextRel);
        continue;
      }
      if (!ent.name.endsWith('.json')) continue;
      if (ent.name.endsWith('-slow.json')) continue;
      const raw = fs.readFileSync(p, 'utf8');
      try {
        const obj = JSON.parse(raw);
        if (obj && Array.isArray(obj.apis)) {
          if (subdirRel) obj._perfSubdir = subdirRel;
          slices.push(obj);
        }
      } catch (e) {
        console.warn(`Skip invalid JSON ${p}: ${e.message}`);
      }
    }
  }
  walk(rootDir);
  return slices;
}

function runIdFromSlices(slices, args) {
  return (
    args.runId ||
    (slices[0] && slices[0].runId) ||
    process.env.PERF_RUN_ID ||
    ''
  );
}

/**
 * Map user-XX subdirs to leased emails from concurrent run pool slice files.
 * @param {object[]} slices
 * @param {string} repoRoot
 * @param {string} runId
 */
function enrichSlicesWithPoolUserLabels(slices, repoRoot, runId) {
  if (!runId) return;
  const map = {};
  const sliceDirs = [path.join(repoRoot, 'data/user-pool', 'dev', `user-slices-${runId}`)];
  for (const dir of sliceDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.startsWith('pool-slice-user-')) continue;
      const userKey = ent.name.replace(/^pool-slice-/, '').replace(/\.json$/, '');
      try {
        const rows = JSON.parse(fs.readFileSync(path.join(dir, ent.name), 'utf8'));
        const email = rows[0] && rows[0].email;
        if (email) map[userKey] = String(email);
      } catch {
        /* skip */
      }
    }
  }
  if (!Object.keys(map).length) return;
  for (const slice of slices) {
    const sub = (slice._perfSubdir || '').replace(/\\/g, '/');
    if (!slice.userEmail && sub && map[sub]) slice.userEmail = map[sub];
  }
}

function loadSlices(args) {
  const rel = args.slicesDir || CONSOLIDATED_SLICES_REL;
  const dir = path.isAbsolute(rel) ? rel : path.join(repoRoot, rel);
  const slices = loadSlicesFromDir(dir);
  if (slices.length === 0) {
    console.error(`No slice JSON files in ${dir}`);
    process.exit(2);
  }
  return slices;
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log(
    'Usage: node tools/merge-consolidated-report.mjs [--run-id <id>] [--threshold-ms 100] [--slow-capture-ms 300] [--slices-dir path] [--spill-dir path] [--out-dir path] [--environment dev-non-production] [--no-pdf]',
  );
  process.exit(0);
}

const slices = loadSlices(args);
enrichSlicesWithPoolUserLabels(slices, repoRoot, runIdFromSlices(slices, args));
const spillRel = args.spillDir || CONSOLIDATED_SPILL_REL;
enrichSlicesWithSpill(slices, repoRoot, spillRel);
const spillDir = path.isAbsolute(spillRel) ? spillRel : path.join(repoRoot, spillRel);
const slowFromSpill = loadAllSlowRequestSpills(spillDir);
const slowFromSlices = loadSlowRequestsFromSlices(slices);
const slowRequests = slowFromSpill.length
  ? slowFromSpill
  : slowFromSlices.length
    ? slowFromSlices
    : [];

const runId =
  args.runId ||
  (slices[0] && slices[0].runId) ||
  process.env.PERF_RUN_ID ||
  'unknown';

const report = buildConsolidatedReport(slices, {
  runId,
  thresholdMs: args.thresholdMs,
  slowCaptureThresholdMs: args.slowCaptureThresholdMs,
  slowRequests,
  environment: args.environment || undefined,
});

const outDir = args.outDir
  ? path.isAbsolute(args.outDir)
    ? args.outDir
    : path.join(repoRoot, args.outDir)
  : path.join(repoRoot, 'reports', 'consolidated');
fs.mkdirSync(outDir, { recursive: true });
if (!args.outDir) {
  fs.mkdirSync(path.join(repoRoot, ...CONSOLIDATED_SLICES_REL.split('/')), { recursive: true });
}

const jsonPath = args.outDir
  ? path.join(outDir, 'consolidated-api-performance.json')
  : path.join(repoRoot, ...CONSOLIDATED_JSON_REL.split('/'));
const mdPath = args.outDir
  ? path.join(outDir, 'consolidated-api-performance.md')
  : path.join(repoRoot, ...CONSOLIDATED_MD_REL.split('/'));
const pdfPath = args.outDir
  ? path.join(outDir, 'consolidated-api-performance.pdf')
  : path.join(repoRoot, ...CONSOLIDATED_PDF_REL.split('/'));

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
fs.writeFileSync(mdPath, formatConsolidatedMarkdown(report), 'utf8');

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);

if (!args.noPdf) {
  try {
    await renderConsolidatedReportPdf({ mdPath, pdfPath });
    console.log(`Wrote ${pdfPath}`);
  } catch (err) {
    console.warn(
      `PDF generation failed (md/json still written). Install deps: npm install. Error: ${err.message}`,
    );
  }
}

console.log(
  `Summary: ${report.summary.totalApiKeys} APIs, ${report.summary.apisExceedingThresholdMs} over ${report.thresholdMs}ms, ${report.summary.apisWithinThresholdMs} within, ${report.summary.apisNotMeasured || 0} not measured (run-id=${runId}, slices=${slices.length}, slowRequests=${report.slowForensicsSummary?.totalSlowRequests || 0})`,
);
if ((report.summary.totalCalls || 0) === 0) {
  console.warn(
    'WARNING: 0 HTTP calls in merged report — set STS_SECRET / SIGNUP_ROPC_CLIENT_SECRET and re-run baseline.',
  );
}
if (report.summary.slowestApi) {
  const s = report.summary.slowestApi;
  console.log(`Slowest: ${s.method} ${s.endpoint} max=${s.maxMs}ms (${s.module})`);
}
