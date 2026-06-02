/**
 * k6 v2+ handleSummary spill parsing (worst + slow request forensics).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  PERF_WORST_LOG_MARKER,
  parseJsonLineMarker,
  loadAllSlowRequestSpills,
  writeSpillsFromLogFile,
} from './consolidated-slow-capture.js';
import { resolveEndpointDisplay, pathOnlyFromUrl } from './api-endpoint-display.js';

export { PERF_WORST_LOG_MARKER } from './consolidated-slow-capture.js';
export { PERF_SLOW_LOG_MARKER } from './consolidated-slow-capture.js';
export const CONSOLIDATED_SPILL_REL = 'reports/consolidated/spill';
export const CONSOLIDATED_LOGS_REL = 'reports/consolidated/logs';

function apiKey(module, method, endpoint) {
  return `${module}\0${method}\0${endpoint}`;
}

/**
 * @param {string} text log file or stdout capture
 * @returns {object[]}
 */
export function parsePerfWorstLines(text) {
  const byKey = {};
  if (!text) return [];
  for (const line of text.split(/\r?\n/)) {
    const obj = parseJsonLineMarker(line, PERF_WORST_LOG_MARKER);
    if (!obj || obj.ms == null) continue;
    const module = obj.module || 'unknown';
    const method = String(obj.method || 'HTTP').toUpperCase();
    const endpoint = obj.endpoint || 'unknown';
    const k = apiKey(module, method, endpoint);
    const prev = byKey[k];
    if (!prev || Number(obj.ms) > Number(prev.ms)) {
      byKey[k] = Object.assign({ module, method, endpoint, maxMs: obj.ms }, obj);
    }
  }
  return Object.values(byKey).sort((a, b) => (b.ms || 0) - (a.ms || 0));
}

/**
 * @param {string} logPath
 * @param {string} sliceId
 * @param {string} repoRoot
 * @returns {string|null} spill file path written
 */
export function writeSpillFromLogFile(logPath, sliceId, repoRoot) {
  if (!logPath || !sliceId || !fs.existsSync(logPath)) return null;
  const spillDir = path.join(repoRoot, ...CONSOLIDATED_SPILL_REL.split('/'));
  const result = writeSpillsFromLogFile(logPath, sliceId, spillDir);
  return result.worstPath;
}

/**
 * Merge spill files into slice objects before consolidated merge.
 * @param {object[]} slices
 * @param {string} repoRoot
 * @param {string} [spillDirRel] optional spill root (supports nested user-XX/ dirs)
 */
function spillInstanceMatchesApi(api, inst) {
  if (!api || !inst) return false;
  if (api.module !== inst.module) return false;
  if (String(api.method || '').toUpperCase() !== String(inst.method || '').toUpperCase()) {
    return false;
  }
  if (api.endpoint === inst.endpoint) return true;
  const instPath = pathOnlyFromUrl(inst.actualUrl) || inst.endpoint;
  return resolveEndpointDisplay(api.endpoint, inst) === instPath;
}

export function enrichSlicesWithSpill(slices, repoRoot, spillDirRel) {
  const rel = spillDirRel || CONSOLIDATED_SPILL_REL;
  const spillDir = path.isAbsolute(rel) ? rel : path.join(repoRoot, ...rel.split('/'));
  if (!fs.existsSync(spillDir)) return;
  for (const slice of slices) {
    const sid = slice.sliceId || slice.module;
    if (!sid) continue;
    const sub = (slice._perfSubdir || '').replace(/\\/g, '/');
    const spillPath = sub
      ? path.join(spillDir, sub, `${sid}.json`)
      : path.join(spillDir, `${sid}.json`);
    if (!fs.existsSync(spillPath)) continue;
    let spill;
    try {
      spill = JSON.parse(fs.readFileSync(spillPath, 'utf8'));
    } catch {
      continue;
    }
    const instances = spill.slowestInstances || [];
    if (!instances.length) continue;
    slice.slowestInstances = instances;
    slice.slowSampleCount = instances.length;
    if (!Array.isArray(slice.apis)) slice.apis = [];
    for (const inst of instances) {
      const api = slice.apis.find((a) => spillInstanceMatchesApi(a, inst));
      if (api) {
        if (!api.slowestRequest || inst.ms >= (api.slowestRequest.ms || 0)) {
          api.slowestRequest = inst;
        }
      }
    }
  }
}

export { loadAllSlowRequestSpills, writeSpillsFromLogFile };
