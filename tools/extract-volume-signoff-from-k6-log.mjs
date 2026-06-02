#!/usr/bin/env node
/**
 * Extract VOLUME_SIGNOFF_SHARD from k6 log, or retrofill Phase A write from __K6_PERF_WORST__.
 *
 * Usage:
 *   node tools/extract-volume-signoff-from-k6-log.mjs --log path --shard-id advisor-00 \
 *     --email user@x.com [--out path] [--run-tag TAG] [--exit-code N] [--retro]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PERF_WORST_LOG_MARKER,
  extractJsonRecordsAfterMarker,
  readK6LogText,
} from '../lib/consolidated-slow-capture.js';
import {
  VOLUME_SIGNOFF_SHARD_MARKER,
  PHASE_A_SIGNOFF_SPECS,
  PHASE_B_SIGNOFF_SPECS,
  buildSignoffRowTemplates,
  applySamplesToRows,
  buildSignoffShard,
  loadSignoffConfigFromObject,
  DEFAULT_SIGNOFF_CONFIG_PATH,
} from '../lib/volume-signoff-core.js';
import { endpointBudgetKey } from '../lib/volume-slo-core.js';
import {
  parseJsonObjectAfterMarker,
  readK6LogText as readLogAlt,
} from './extract-phase-a-manifest-from-k6-log.mjs';

/**
 * k6 log lines wrap console output: msg="VOLUME_SIGNOFF_SHARD:{\"...\"}" source=console
 * @param {string} line
 * @param {number} markerIdx
 */
export function parseSignoffShardFromK6LogLine(line, markerIdx) {
  const braceStart = line.indexOf('{', markerIdx + VOLUME_SIGNOFF_SHARD_MARKER.length);
  if (braceStart < 0) return null;
  let braceEnd = line.indexOf('" source=console', braceStart);
  if (braceEnd < 0) braceEnd = line.length;
  let raw = line.slice(braceStart, braceEnd).trim();
  if (raw.endsWith('"')) raw = raw.slice(0, -1);
  raw = raw.replace(/\\"/g, '"');
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.reportType === 'volume-signoff-shard' ? parsed : null;
  } catch {
    return null;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function parseArgs(argv) {
  const args = {
    log: '',
    out: '',
    shardId: '',
    email: '',
    runTag: '',
    exitCode: null,
    retro: true,
    phase: 'A',
    configPath: DEFAULT_SIGNOFF_CONFIG_PATH,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--log' && argv[i + 1]) args.log = argv[++i];
    else if (a === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (a === '--shard-id' && argv[i + 1]) args.shardId = argv[++i];
    else if (a === '--email' && argv[i + 1]) args.email = argv[++i];
    else if (a === '--run-tag' && argv[i + 1]) args.runTag = argv[++i];
    else if (a === '--exit-code' && argv[i + 1]) args.exitCode = parseInt(argv[++i], 10);
    else if (a === '--config' && argv[i + 1]) args.configPath = argv[++i];
    else if (a === '--no-retro') args.retro = false;
    else if (a === '--phase' && argv[i + 1]) args.phase = argv[++i];
  }
  return args;
}

function parseLogTime(line) {
  const m = line.match(/time="([^"]+)"/);
  if (!m) return null;
  const t = Date.parse(m[1]);
  return Number.isFinite(t) ? t : null;
}

function extractHttpMaxFromPerfWorst(text) {
  const records = extractJsonRecordsAfterMarker(text, PERF_WORST_LOG_MARKER);
  const maxByKey = new Map();
  for (const rec of records) {
    if (!rec || rec.ms == null || !rec.method || !rec.endpoint) continue;
    const key = endpointBudgetKey(rec.method, rec.endpoint);
    const ms = Number(rec.ms);
    const prev = maxByKey.get(key);
    if (prev == null || ms > prev) maxByKey.set(key, ms);
  }
  return maxByKey;
}

function extractPerfWorstRecords(text) {
  return extractJsonRecordsAfterMarker(text, PERF_WORST_LOG_MARKER);
}

/** @returns {Map<string, Map<string, number>>} email -> endpointKey -> maxMs */
function extractHttpMaxByEmailFromPerfWorst(text) {
  const byUser = new Map();
  for (const rec of extractPerfWorstRecords(text)) {
    if (!rec || rec.ms == null || !rec.method || !rec.endpoint) continue;
    const email = String(rec.userEmail || '').trim().toLowerCase();
    if (!email) continue;
    const key = endpointBudgetKey(rec.method, rec.endpoint);
    const ms = Number(rec.ms);
    if (!byUser.has(email)) byUser.set(email, new Map());
    const http = byUser.get(email);
    const prev = http.get(key);
    if (prev == null || ms > prev) http.set(key, ms);
  }
  return byUser;
}

function parseRecordTimestamp(rec) {
  if (rec && rec.timestamp) {
    const t = Date.parse(String(rec.timestamp));
    if (Number.isFinite(t)) return t;
  }
  return null;
}

/** @returns {Map<string, { dashboardMs: number, fullJourneyMs: number }>} */
function retroPhaseBStepsByEmail(text) {
  const groups = new Map();
  for (const rec of extractPerfWorstRecords(text)) {
    const email = String(rec.userEmail || '').trim().toLowerCase();
    if (!email) continue;
    const gk = `${email}\0${rec.vu}\0${rec.iteration}`;
    if (!groups.has(gk)) groups.set(gk, []);
    groups.get(gk).push(rec);
  }

  const out = new Map();
  for (const recs of groups.values()) {
    const email = String(recs[0].userEmail || '').trim().toLowerCase();
    let dashMs = 0;
    let spanMs = 0;
    let tMin = null;
    let tMax = null;
    for (const rec of recs) {
      const ms = Number(rec.ms) || 0;
      if (
        rec.method === 'GET' &&
        String(rec.endpoint || '').includes('/api/v1/Clients/{advisorId}/all')
      ) {
        dashMs = Math.max(dashMs, ms);
      }
      const ts = parseRecordTimestamp(rec);
      if (ts != null) {
        tMin = tMin == null ? ts : Math.min(tMin, ts);
        tMax = tMax == null ? ts : Math.max(tMax, ts);
      }
    }
    if (tMin != null && tMax != null && tMax >= tMin) spanMs = tMax - tMin;

    const prev = out.get(email) || { dashboardMs: 0, fullJourneyMs: 0 };
    prev.dashboardMs = Math.max(prev.dashboardMs, dashMs);
    prev.fullJourneyMs = Math.max(prev.fullJourneyMs, spanMs);
    out.set(email, prev);
  }
  return out;
}

/**
 * Build Phase B sign-off shards from a combined multi-VU k6 log (retro).
 * @param {string} text
 * @param {object} opts
 * @param {object} opts.config
 * @param {string} [opts.runTag]
 * @param {object[]} opts.manifestAdvisors
 * @param {number|null} [opts.k6ExitCode]
 */
export function buildPhaseBSignoffShardsFromLog(text, opts) {
  const { config, runTag, manifestAdvisors = [], k6ExitCode = null } = opts;
  const httpByEmail = extractHttpMaxByEmailFromPerfWorst(text);
  const stepsByEmail = retroPhaseBStepsByEmail(text);
  const templates = buildSignoffRowTemplates(PHASE_B_SIGNOFF_SPECS, 'read', config);
  const shards = [];

  for (const adv of manifestAdvisors) {
    const email = String(adv.advisorEmail || '').trim().toLowerCase();
    const httpMap = httpByEmail.get(email);
    if (!httpMap && !stepsByEmail.has(email)) continue;
    const http = httpMap ? Object.fromEntries(httpMap.entries()) : {};
    const stepsRaw = stepsByEmail.get(email) || { dashboardMs: 0, fullJourneyMs: 0 };
    const steps = {
      journey_dashboard_load_duration: stepsRaw.dashboardMs,
      full_journey_duration: stepsRaw.fullJourneyMs,
    };
    const rows = applySamplesToRows(templates, { steps, http }, { actualLabel: 'max (retro)' });
    shards.push(
      buildSignoffShard({
        phase: 'B',
        profile: 'read',
        runTag: runTag || null,
        shardId: adv.shardId,
        advisorEmail: adv.advisorEmail,
        k6ExitCode,
        source: 'retro-k6-log',
        rows,
      }),
    );
  }
  return shards;
}

function lineHasEndpoint(line, method, fragment) {
  return (
    line.includes(PERF_WORST_LOG_MARKER) &&
    line.includes(`\\"method\\":\\"${method}\\"`) &&
    line.includes(fragment)
  );
}

function retroStepDurationsFromLog(text) {
  const lines = text.split(/\r?\n/);
  const steps = {};
  const first = (match) => {
    for (const line of lines) if (match(line)) return parseLogTime(line);
    return null;
  };
  const last = (match) => {
    for (let i = lines.length - 1; i >= 0; i--) if (match(lines[i])) return parseLogTime(lines[i]);
    return null;
  };
  const tClientStart = first((l) => lineHasEndpoint(l, 'POST', '/api/v1/Clients'));
  const tClientEnd = last((l) => lineHasEndpoint(l, 'PUT', '/api/v1/Clients'));
  if (tClientStart != null && tClientEnd != null && tClientEnd >= tClientStart) {
    steps.journey_create_client_duration = tClientEnd - tClientStart;
  }
  const tPlanStart = first((l) => lineHasEndpoint(l, 'POST', '/api/v1/cashflows'));
  const tPlanEnd = last((l) => lineHasEndpoint(l, 'GET', '/api/v1/Events/custom'));
  if (tPlanStart != null && tPlanEnd != null && tPlanEnd >= tPlanStart) {
    steps.journey_create_base_plan_duration = tPlanEnd - tPlanStart;
  }
  const tProjStart = first((l) => lineHasEndpoint(l, 'GET', '/api/v1/Reports/'));
  const tProjEnd = last((l) => lineHasEndpoint(l, 'GET', '/api/v1/Reports/'));
  if (tProjStart != null && tProjEnd != null && tProjEnd >= tProjStart) {
    steps.journey_calculate_projection_duration = tProjEnd - tProjStart;
  }
  return steps;
}

export function extractSignoffShardFromK6Log(text) {
  const all = extractAllSignoffShardsFromK6Log(text);
  return all.length ? all[all.length - 1] : null;
}

export function extractAllSignoffShardsFromK6Log(text) {
  const shards = [];
  const seen = new Set();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].indexOf(VOLUME_SIGNOFF_SHARD_MARKER);
    if (idx < 0) continue;
    const shard =
      parseSignoffShardFromK6LogLine(lines[i], idx) ||
      parseJsonObjectAfterMarker(lines[i], idx, VOLUME_SIGNOFF_SHARD_MARKER);
    if (shard && shard.reportType === 'volume-signoff-shard') {
      const key = `${shard.shardId || ''}|${shard.generatedAt || ''}|${shard.advisorEmail || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        shards.push(shard);
      }
    }
  }
  if (shards.length) return shards;

  let from = 0;
  while (from < text.length) {
    const idx = text.indexOf(VOLUME_SIGNOFF_SHARD_MARKER, from);
    if (idx < 0) break;
    const shard = parseJsonObjectAfterMarker(text, idx, VOLUME_SIGNOFF_SHARD_MARKER);
    if (shard && shard.reportType === 'volume-signoff-shard') shards.push(shard);
    from = idx + VOLUME_SIGNOFF_SHARD_MARKER.length;
  }
  return shards;
}

export function buildSignoffShardFromLog(text, meta, config, retro = true) {
  const marker = extractSignoffShardFromK6Log(text);
  if (marker) return marker;
  if (!retro || meta.phase !== 'A') return null;

  const templates = buildSignoffRowTemplates(PHASE_A_SIGNOFF_SPECS, 'write', config);
  const http = Object.fromEntries(extractHttpMaxFromPerfWorst(text).entries());
  const steps = retroStepDurationsFromLog(text);
  const rows = applySamplesToRows(templates, { steps, http }, { actualLabel: 'max (retro)' });
  return buildSignoffShard({
    phase: 'A',
    profile: 'write',
    runTag: meta.runTag || null,
    shardId: meta.shardId,
    advisorEmail: meta.advisorEmail || null,
    k6ExitCode: meta.k6ExitCode != null ? meta.k6ExitCode : null,
    source: 'retro-k6-log',
    rows,
  });
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.log || !args.shardId) {
    console.error(
      'Usage: node tools/extract-volume-signoff-from-k6-log.mjs --log path --shard-id advisor-00 [--email] [--out] [--run-tag] [--exit-code]',
    );
    process.exit(1);
  }
  const logPath = resolve(args.log);
  let text;
  try {
    text = readK6LogText(logPath);
  } catch {
    text = readLogAlt(logPath);
  }
  const config = loadSignoffConfigFromObject(
    JSON.parse(readFileSync(resolve(repoRoot, args.configPath), 'utf8')),
  );
  const shard = buildSignoffShardFromLog(
    text,
    {
      phase: args.phase,
      runTag: args.runTag,
      shardId: args.shardId,
      advisorEmail: args.email,
      k6ExitCode: args.exitCode,
    },
    config,
    args.retro,
  );
  if (!shard) {
    console.error(`No sign-off data in ${logPath}`);
    process.exit(1);
  }
  if (args.out) {
    mkdirSync(dirname(resolve(args.out)), { recursive: true });
    writeFileSync(resolve(args.out), `${JSON.stringify(shard, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${args.out}`);
  } else {
    console.log(JSON.stringify(shard, null, 2));
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main();
}
