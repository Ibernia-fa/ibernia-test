#!/usr/bin/env node
/**
 * Extract PHASE_A_MANIFEST_SHARD markers from k6 stdout (VU-isolated state).
 * k6 v2 handleSummary cannot read VU globalThis or tagged Counter tag values.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseManifestShard } from '../lib/volume-manifest-core.js';

export const PHASE_A_MANIFEST_SHARD_MARKER = 'PHASE_A_MANIFEST_SHARD:';

/** PowerShell job logs may be UTF-16 LE. */
export function readK6LogText(logPath) {
  const buf = readFileSync(logPath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString('utf16le');
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return buf.slice(2).toString('utf16le');
  }
  return buf.toString('utf8');
}

export function parseJsonObjectAfterMarker(text, markerIndex, marker = PHASE_A_MANIFEST_SHARD_MARKER) {
  const from = markerIndex + marker.length;
  const braceStart = text.indexOf('{', from);
  if (braceStart < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let j = braceStart; j < text.length; j++) {
    const c = text[j];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        let raw = text.slice(braceStart, j + 1);
        if (raw.includes('\\"')) raw = raw.replace(/\\"/g, '"');
        raw = raw.replace(/\r?\n/g, '');
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * @param {string} text
 * @returns {object[]}
 */
export function extractPhaseAManifestShardsFromK6Log(text) {
  const shards = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const markerIdx = line.indexOf(PHASE_A_MANIFEST_SHARD_MARKER);
    if (markerIdx < 0) continue;
    const shard = parseManifestShardFromK6LogLine(line, markerIdx);
    if (shard) shards.push(parseManifestShard(shard));
  }

  if (shards.length > 0) return shards;

  let from = 0;
  while (from < text.length) {
    const idx = text.indexOf(PHASE_A_MANIFEST_SHARD_MARKER, from);
    if (idx === -1) break;
    const shard = parseJsonObjectAfterMarker(text, idx);
    if (shard && shard.reportType === 'phase-a-manifest-shard') {
      shards.push(parseManifestShard(shard));
    }
    from = idx + PHASE_A_MANIFEST_SHARD_MARKER.length;
  }
  return shards;
}

/**
 * k6 log lines wrap console output: msg="PHASE_A_MANIFEST_SHARD:{\"...\"}" source=console
 * @param {string} line
 * @param {number} markerIdx
 */
export function parseManifestShardFromK6LogLine(line, markerIdx) {
  const braceStart = line.indexOf('{', markerIdx + PHASE_A_MANIFEST_SHARD_MARKER.length);
  if (braceStart < 0) return null;
  let braceEnd = line.indexOf('" source=console', braceStart);
  if (braceEnd < 0) braceEnd = line.length;
  let raw = line.slice(braceStart, braceEnd).trim();
  if (raw.endsWith('"')) raw = raw.slice(0, -1);
  raw = raw.replace(/\\"/g, '"');
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.reportType === 'phase-a-manifest-shard' ? parsed : null;
  } catch {
    return null;
  }
}

export function resolveManifestShardOutputPath(repoRoot, shard) {
  const tag = String(shard.runTag || shard.runId || 'phase-a').replace(/[^a-zA-Z0-9._-]/g, '_');
  const sid = String(shard.shardId || 'shard').replace(/[^a-zA-Z0-9._-]/g, '_');
  return join(repoRoot, 'reports', 'phase-a', tag, 'manifests', `shard-${tag}-${sid}.json`);
}

function parseArgs(argv) {
  const args = { log: '', repoRoot: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--log' && argv[i + 1]) args.log = argv[++i];
    else if (a === '--repo-root' && argv[i + 1]) args.repoRoot = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.log) {
    console.error(
      'Usage: node tools/extract-phase-a-manifest-from-k6-log.mjs --log <k6.log> [--repo-root <repo>]',
    );
    process.exit(args.help ? 0 : 1);
  }
  const repoRoot = resolve(args.repoRoot || join(dirname(fileURLToPath(import.meta.url)), '..'));
  const text = readK6LogText(resolve(args.log));
  const shards = extractPhaseAManifestShardsFromK6Log(text);
  if (!shards.length) {
    console.error(`No ${PHASE_A_MANIFEST_SHARD_MARKER} markers found in ${args.log}`);
    process.exit(1);
  }
  for (const shard of shards) {
    const outPath = resolveManifestShardOutputPath(repoRoot, shard);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(shard, null, 2)}\n`, 'utf8');
    console.log(
      `[extract-phase-a-manifest] wrote shardId=${shard.shardId} clients=${shard.counts?.clients ?? 0} ` +
        `plans=${shard.counts?.plans ?? 0} -> ${outPath}`,
    );
  }
}

const isCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) main();
