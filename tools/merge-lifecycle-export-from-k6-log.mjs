#!/usr/bin/env node
/**
 * Extract K6_LIFECYCLE_EXPORT_ROW lines from k6 console output and merge into lifecycle-users JSON.
 * k6 v2 isolates VU state from handleSummary, so signup exports rows via stdout markers.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MARKER = 'K6_LIFECYCLE_EXPORT_ROW:';

/** PowerShell Start-Process / native redirects on Windows often write UTF-16 LE. */
function readLogText(logPath) {
  const buf = readFileSync(logPath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString('utf16le');
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return buf.slice(2).toString('utf16le');
  }
  return buf.toString('utf8');
}

function mergeLifecycleUserRowsByEmail(baseline, additions) {
  const out = Array.isArray(baseline) ? baseline.map((r) => ({ ...r })) : [];
  const indexByLower = new Map();
  for (let i = 0; i < out.length; i++) {
    const lo = String(out[i].email || '').trim().toLowerCase();
    if (lo) indexByLower.set(lo, i);
  }
  const addList = Array.isArray(additions) ? additions : [];
  for (const row of addList) {
    if (!row || typeof row !== 'object') continue;
    const lo = String(row.email || '').trim().toLowerCase();
    if (!lo) continue;
    const idx = indexByLower.get(lo);
    const patch = { ...row };
    if (idx !== undefined) {
      const prev = { ...out[idx] };
      for (const k of Object.keys(patch)) {
        if (patch[k] === undefined) continue;
        prev[k] = patch[k];
      }
      if (
        Object.prototype.hasOwnProperty.call(patch, 'password') &&
        !Object.prototype.hasOwnProperty.call(patch, 'token')
      ) {
        delete prev.token;
      }
      out[idx] = { ...prev, email: String(row.email).trim() };
    } else {
      out.push({ ...patch, email: String(row.email).trim() });
      indexByLower.set(lo, out.length - 1);
    }
  }
  return out;
}

function parseJsonObjectAfterMarker(text, markerIndex) {
  const from = markerIndex + MARKER.length;
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

export function extractLifecycleRowsFromK6Log(text) {
  const rows = [];
  const blocks = text.split(MARKER);
  for (let b = 1; b < blocks.length; b++) {
    const block = blocks[b];
    const emailM = block.match(/[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    const passM = block.match(/\\"password\\":\\"([^"\\]+)\\"/) || block.match(/"password":"([^"]+)"/);
    if (emailM && passM) {
      const row = {
        email: emailM[0].replace(/\r?\n/g, '').trim(),
        password: passM[1].replace(/\r?\n/g, '').trim(),
      };
      const createdM =
        block.match(/\\"createdAt\\":\\"([^"\\]+)\\"/) || block.match(/"createdAt":"([^"]+)"/);
      if (createdM) row.createdAt = createdM[1].replace(/\r?\n/g, '').trim();
      if (row.email && row.password) rows.push(row);
    }
  }
  if (rows.length > 0) return rows;

  let from = 0;
  while (from < text.length) {
    const idx = text.indexOf(MARKER, from);
    if (idx === -1) break;
    const row = parseJsonObjectAfterMarker(text, idx);
    if (row && String(row.email || '').trim() && String(row.password ?? '').length > 0) {
      rows.push(row);
    }
    from = idx + MARKER.length;
  }
  return rows;
}

function loadBaseline(path) {
  if (!path || !existsSync(path)) return [];
  try {
    const arr = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(arr) ? arr.filter((r) => r && String(r.email || '').trim()) : [];
  } catch {
    return [];
  }
}

function parseArgs(argv) {
  const out = { log: '', out: '', baseline: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--log') out.log = argv[++i] || '';
    else if (a === '--out') out.out = argv[++i] || '';
    else if (a === '--baseline') out.baseline = argv[++i] || '';
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.log || !args.out) {
    console.error(
      'Usage: node tools/merge-lifecycle-export-from-k6-log.mjs --log <k6.log> --out <lifecycle.json> [--baseline <existing.json>]',
    );
    process.exit(args.help ? 0 : 1);
  }
  const logPath = resolve(args.log);
  const outPath = resolve(args.out);
  const baselinePath = args.baseline ? resolve(args.baseline) : outPath;
  const text = readLogText(logPath);
  const additions = extractLifecycleRowsFromK6Log(text);
  if (additions.length === 0) {
    console.error(`No ${MARKER} rows found in ${logPath}`);
    process.exit(1);
  }
  const baseline = loadBaseline(baselinePath);
  const merged = mergeLifecycleUserRowsByEmail(baseline, additions);
  writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(
    `Wrote ${outPath}: ${merged.length} row(s) (${additions.length} from log, ${baseline.length} baseline).`,
  );
}

import { pathToFileURL } from 'node:url';
const isCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) main();
