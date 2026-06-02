#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PERF_MARKERS = [
  /\bexport\s+const\s+handleSummary\b/,
  /\bexport\s+function\s+handleSummary\b/,
  /\bsingleApiHandleSummaryFactory\b/,
  /\bwrapHandleSummaryWithConsolidatedPerf\b/,
  /\battachSuitePerfSlice\b/,
];
const OBSERVE_MARKERS = ['observeHttp', 'recordApiPerformance', 'recordOutcome'];

const domains = [
  { module: 'clients', dir: 'k6/clients' },
  { module: 'clients-profile', dir: 'k6/clients-profile' },
  { module: 'timeline', dir: 'k6/cashflows-timeline' },
  { module: 'income', dir: 'k6/cashflows-income' },
  { module: 'finances', dir: 'k6/cashflows-finances' },
  { module: 'reports', dir: 'k6/cashflows-reports' },
  { module: 'wealth', dir: 'k6/cashflows-wealth' },
];

const plan = [];
for (const d of domains) {
  const dir = path.join(repoRoot, d.dir);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith('k6') || !name.endsWith('.js')) continue;
    if (!name.endsWith('-load.js') && name !== 'k6-client-full-lifecycle.js') continue;
    const rel = `${d.dir}/${name}`.replace(/\\/g, '/');
    const content = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
    const hasSummary = PERF_MARKERS.some((m) =>
      m instanceof RegExp ? m.test(content) : content.includes(m),
    );
    const hasObserve = OBSERVE_MARKERS.some((m) => content.includes(m));
    plan.push({ rel, hasSummary, hasObserve });
  }
}

const missingSummary = plan.filter((p) => !p.hasSummary);
const missingObserve = plan.filter((p) => !p.hasObserve);
console.log(`Baseline scripts: ${plan.length}`);
console.log(`Missing perf summary hook: ${missingSummary.length}`);
for (const p of missingSummary) console.log(`  ${p.rel}`);
console.log(`Missing observe/record: ${missingObserve.length}`);
for (const p of missingObserve) console.log(`  ${p.rel} (summary=${p.hasSummary})`);
