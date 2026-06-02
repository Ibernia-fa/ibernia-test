import http from 'k6/http';
import { sleep } from 'k6';
import exec from 'k6/execution';

/**
 * Shared helpers for /cashflows/{cashflowId}/wealth (Wealth tab).
 *
 * OpenAPI Wealth tag (dev-api):
 * - GET /api/v1/wealth/{cashflowId}
 * - POST /api/v1/wealth/{cashflowId}/assets
 * - PUT /api/v1/wealth/{cashflowId}/assets
 * - DELETE /api/v1/wealth/{cashflowId}/assets/{assetId} -> 204
 * - POST /api/v1/wealth/{cashflowId}/liabilities
 * - PUT /api/v1/wealth/{cashflowId}/liabilities
 * - DELETE /api/v1/wealth/{cashflowId}/liabilities/{liabilityId} -> 204
 *
 * Also uses GET cashflow + GET financial like other cashflow tabs.
 */

export function wealthDashboardUrl(base, cashflowId) {
  return `${base}/api/v1/wealth/${encodeURIComponent(cashflowId)}`;
}

export function wealthAssetsUrl(base, cashflowId) {
  return `${base}/api/v1/wealth/${encodeURIComponent(cashflowId)}/assets`;
}

export function wealthAssetByIdUrl(base, cashflowId, assetId) {
  return `${base}/api/v1/wealth/${encodeURIComponent(cashflowId)}/assets/${encodeURIComponent(assetId)}`;
}

export function wealthLiabilitiesUrl(base, cashflowId) {
  return `${base}/api/v1/wealth/${encodeURIComponent(cashflowId)}/liabilities`;
}

export function wealthLiabilityByIdUrl(base, cashflowId, liabilityId) {
  return `${base}/api/v1/wealth/${encodeURIComponent(cashflowId)}/liabilities/${encodeURIComponent(liabilityId)}`;
}

function vuSlotSuffix() {
  try {
    if (exec && exec.vu && exec.vu.idInTest != null) {
      return `-vid${exec.vu.idInTest}`;
    }
  } catch {
    /* init or unsupported */
  }
  return '';
}

/**
 * @param {string} [scenarioSalt] Disambiguate when several k6 scenarios share one cashflow (suite);
 *   each scenario should pass a stable unique string so `__VU`/`__ITER` collisions across scenarios do not reuse needles.
 *   Also appends `exec.vu.idInTest` so concurrent VUs never reuse the same needle string.
 */
function stableNeedle(prefix, vu, iter, runTag, scenarioSalt) {
  const s =
    scenarioSalt != null && String(scenarioSalt).trim() !== '' ? `-${String(scenarioSalt).trim()}` : '';
  return `${prefix}-${runTag || 'rt'}-vu${vu}-it${iter}${s}${vuSlotSuffix()}-${Date.now()}`;
}

function pickIdFromEntity(obj) {
  if (!obj) return null;
  const id = obj.id != null ? obj.id : obj.Id;
  return id != null && String(id).trim() !== '' ? String(id).trim() : null;
}

/**
 * Prefer id from POST JSON when the body embeds this run's `needle` (avoids cross-scenario races on GET dashboard).
 */
function tryParseWealthAssetIdFromPost(postRes, needle) {
  if (!postRes || postRes.status !== 200 || !postRes.body || !needle) return null;
  let j;
  try {
    j = JSON.parse(String(postRes.body));
  } catch {
    return null;
  }
  const n = String(needle);
  const blob = JSON.stringify(j);
  if (!blob.includes(n)) return null;

  const assets = j.assets || j.Assets;
  if (Array.isArray(assets)) {
    for (let i = assets.length - 1; i >= 0; i--) {
      const row = assets[i];
      const desc = row && (row.description != null ? row.description : row.Description);
      if (desc == null || !String(desc).includes(n)) continue;
      const id = pickIdFromEntity(row);
      if (id) return id;
    }
  }

  const wrapKeys = ['asset', 'Asset', 'data', 'Data', 'result', 'Result'];
  for (let k = 0; k < wrapKeys.length; k++) {
    const w = j[wrapKeys[k]];
    const wid = pickIdFromEntity(w);
    if (!wid) continue;
    const wd = w && (w.description != null ? w.description : w.Description);
    if (wd != null && String(wd).includes(n)) return wid;
  }

  const rootDesc = j.description != null ? j.description : j.Description;
  if (rootDesc != null && String(rootDesc).includes(n)) {
    const rid = pickIdFromEntity(j);
    if (rid) return rid;
  }
  return null;
}

function tryParseWealthLiabilityIdFromPost(postRes, needle) {
  if (!postRes || postRes.status !== 200 || !postRes.body || !needle) return null;
  let j;
  try {
    j = JSON.parse(String(postRes.body));
  } catch {
    return null;
  }
  const n = String(needle);
  const blob = JSON.stringify(j);
  if (!blob.includes(n)) return null;

  const rows = j.liabilities || j.Liabilities;
  if (Array.isArray(rows)) {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      const desc = row && (row.description != null ? row.description : row.Description);
      if (desc == null || !String(desc).includes(n)) continue;
      const id = pickIdFromEntity(row);
      if (id) return id;
    }
  }

  const wrapKeys = ['liability', 'Liability', 'data', 'Data', 'result', 'Result'];
  for (let k = 0; k < wrapKeys.length; k++) {
    const w = j[wrapKeys[k]];
    const wid = pickIdFromEntity(w);
    if (!wid) continue;
    const wd = w && (w.description != null ? w.description : w.Description);
    if (wd != null && String(wd).includes(n)) return wid;
  }

  const rootDesc = j.description != null ? j.description : j.Description;
  if (rootDesc != null && String(rootDesc).includes(n)) {
    const rid = pickIdFromEntity(j);
    if (rid) return rid;
  }
  return null;
}

/**
 * AssetCategory enum in API: 1, 2, or 3.
 * @param {string} [scenarioSalt] Optional; use in multi-scenario suite runs (see `stableNeedle`).
 * @returns {{ needle: string, body: object }}
 */
export function buildAddWealthAssetPayloadWithNeedle(vu, iter, runTag, scenarioSalt = '') {
  const category = 1 + (vu % 3);
  const needle = stableNeedle('k6w-ast', vu, iter, runTag, scenarioSalt);
  return {
    needle,
    body: {
      category,
      name: 'Investment portfolio (automated test)',
      description: `Wealth asset created during automated API load testing (${needle})`,
      value: 12500 + vu * 800 + (iter % 50) * 100,
      ownership: vu % 2,
    },
  };
}

export function buildUpdateWealthAssetPayload(assetId, vu, iter, runTag, scenarioSalt = '') {
  const category = 1 + ((vu + 1) % 3);
  const needle = stableNeedle('k6w-ast-upd', vu, iter, runTag, scenarioSalt);
  return {
    id: String(assetId).trim(),
    category,
    name: 'Investment portfolio (revised)',
    description: `Wealth asset revised during automated API load testing (${needle})`,
    value: 22000 + vu * 500 + (iter % 40) * 50,
    ownership: (vu + 1) % 2,
  };
}

/**
 * @param {string} [scenarioSalt] Optional; use in multi-scenario suite runs.
 * @returns {{ needle: string, body: object }}
 */
export function buildAddWealthLiabilityPayloadWithNeedle(vu, iter, runTag, scenarioSalt = '') {
  const needle = stableNeedle('k6w-lia', vu, iter, runTag, scenarioSalt);
  return {
    needle,
    body: {
      type: 'Loan',
      name: 'Home mortgage (automated test)',
      description: `Wealth liability created during automated API load testing (${needle})`,
      outstanding: 8000 + vu * 300 + (iter % 30) * 25,
      ownership: vu % 2,
    },
  };
}

export function buildUpdateWealthLiabilityPayload(liabilityId, vu, iter, runTag, scenarioSalt = '') {
  const needle = stableNeedle('k6w-lia-upd', vu, iter, runTag, scenarioSalt);
  return {
    id: String(liabilityId).trim(),
    type: 'Loan',
    name: 'Home mortgage (revised)',
    description: `Wealth liability revised during automated API load testing (${needle})`,
    outstanding: 6500 + vu * 200 + (iter % 20) * 40,
    ownership: (vu + 1) % 2,
  };
}

export function findAssetIdInDashboardByNeedle(res, needle) {
  if (res.status !== 200 || !needle) return null;
  const n = String(needle);
  const marker = `(${n})`;
  try {
    const j = res.json();
    const assets = j && (j.assets != null ? j.assets : j.Assets);
    if (!Array.isArray(assets)) return null;
    for (let i = assets.length - 1; i >= 0; i--) {
      const a = assets[i];
      const desc = a && (a.description != null ? a.description : a.Description);
      const id = a && (a.id != null ? a.id : a.Id);
      if (id == null || String(id).trim() === '') continue;
      const ds = desc != null ? String(desc) : '';
      if (ds.includes(marker) || ds.includes(n)) return String(id).trim();
    }
  } catch {
    return null;
  }
  return null;
}

export function findLiabilityIdInDashboardByNeedle(res, needle) {
  if (res.status !== 200 || !needle) return null;
  const n = String(needle);
  const marker = `(${n})`;
  try {
    const j = res.json();
    const rows = j && (j.liabilities != null ? j.liabilities : j.Liabilities);
    if (!Array.isArray(rows)) return null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      const desc = row && (row.description != null ? row.description : row.Description);
      const id = row && (row.id != null ? row.id : row.Id);
      if (id == null || String(id).trim() === '') continue;
      const ds = desc != null ? String(desc) : '';
      if (ds.includes(marker) || ds.includes(n)) return String(id).trim();
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * True iff dashboard JSON lists an asset with this id and description contains the run needle.
 * Stops mis-resolving another VU's row when POST/GET bodies include many assets (parallel suite).
 */
function verifyAssetRowNeedleOnDashboard(res, id, needle) {
  if (!res || res.status !== 200 || !id || !needle) return false;
  const want = String(id).trim();
  const n = String(needle);
  const marker = `(${n})`;
  try {
    const j = res.json();
    const assets = j && (j.assets != null ? j.assets : j.Assets);
    if (!Array.isArray(assets)) return false;
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      const rid = a && (a.id != null ? a.id : a.Id);
      if (rid == null || String(rid).trim() !== want) continue;
      const desc = a && (a.description != null ? a.description : a.Description);
      const ds = desc != null ? String(desc) : '';
      return ds.includes(marker) || ds.includes(n);
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Brief pause after a resolved id so PUT/DELETE are less likely to hit read-after-write / commit lag (400 not found).
 * Override with `WEALTH_RESOLVE_SETTLE_MS` (milliseconds, 0 to disable). Default **150**.
 */
function sleepAfterWealthResolve() {
  const ms = Math.max(0, parseInt((__ENV.WEALTH_RESOLVE_SETTLE_MS || '150').trim(), 10) || 0);
  if (ms > 0) sleep(ms / 1000);
}

function verifyLiabilityRowNeedleOnDashboard(res, id, needle) {
  if (!res || res.status !== 200 || !id || !needle) return false;
  const want = String(id).trim();
  const n = String(needle);
  const marker = `(${n})`;
  try {
    const j = res.json();
    const rows = j && (j.liabilities != null ? j.liabilities : j.Liabilities);
    if (!Array.isArray(rows)) return false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rid = row && (row.id != null ? row.id : row.Id);
      if (rid == null || String(rid).trim() !== want) continue;
      const desc = row && (row.description != null ? row.description : row.Description);
      const ds = desc != null ? String(desc) : '';
      return ds.includes(marker) || ds.includes(n);
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Resolve new asset id from POST body or polling GET dashboard (eventual consistency).
 */
export function resolveAssetIdAfterPost(p) {
  const {
    postRes,
    base,
    token,
    cashflowId,
    needle,
    maxAttempts = 16,
    tagName = 'cf_wealth_resolve_asset_get',
    vuTag = '',
  } = p;
  const hdr = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  const url = wealthDashboardUrl(base, cashflowId);
  const timeout = p.timeout != null ? p.timeout : (__ENV.HTTP_TIMEOUT || '120s').trim();

  const confirmMax = Math.min(6, maxAttempts);

  function confirmIdOnDashboard(candidateId, dashResMaybe) {
    if (!candidateId) return null;
    if (dashResMaybe && verifyAssetRowNeedleOnDashboard(dashResMaybe, candidateId, needle)) {
      return candidateId;
    }
    for (let r = 0; r < confirmMax; r++) {
      if (r > 0) sleep(0.05 + r * 0.035);
      const g = http.get(url, {
        headers: hdr,
        tags: { name: `${tagName}_cf`, vu: vuTag },
        timeout,
      });
      if (verifyAssetRowNeedleOnDashboard(g, candidateId, needle)) return candidateId;
    }
    return null;
  }

  let cand = tryParseWealthAssetIdFromPost(postRes, needle);
  cand = confirmIdOnDashboard(cand, postRes);
  if (cand) {
    sleepAfterWealthResolve();
    return cand;
  }

  cand = findAssetIdInDashboardByNeedle(postRes, needle);
  cand = confirmIdOnDashboard(cand, postRes);
  if (cand) {
    sleepAfterWealthResolve();
    return cand;
  }

  for (let a = 0; a < maxAttempts; a++) {
    sleep(0.04 + a * 0.03);
    const g = http.get(url, {
      headers: hdr,
      tags: { name: tagName, vu: vuTag },
      timeout,
    });
    const id = findAssetIdInDashboardByNeedle(g, needle);
    if (id && verifyAssetRowNeedleOnDashboard(g, id, needle)) {
      sleepAfterWealthResolve();
      return id;
    }
  }
  return null;
}

/**
 * Resolve new liability id from POST body or polling GET dashboard.
 */
export function resolveLiabilityIdAfterPost(p) {
  const {
    postRes,
    base,
    token,
    cashflowId,
    needle,
    maxAttempts = 16,
    tagName = 'cf_wealth_resolve_lia_get',
    vuTag = '',
  } = p;
  const hdr = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  const url = wealthDashboardUrl(base, cashflowId);
  const timeout = p.timeout != null ? p.timeout : (__ENV.HTTP_TIMEOUT || '120s').trim();

  const confirmMax = Math.min(6, maxAttempts);

  function confirmIdOnDashboard(candidateId, dashResMaybe) {
    if (!candidateId) return null;
    if (dashResMaybe && verifyLiabilityRowNeedleOnDashboard(dashResMaybe, candidateId, needle)) {
      return candidateId;
    }
    for (let r = 0; r < confirmMax; r++) {
      if (r > 0) sleep(0.05 + r * 0.035);
      const g = http.get(url, {
        headers: hdr,
        tags: { name: `${tagName}_cf`, vu: vuTag },
        timeout,
      });
      if (verifyLiabilityRowNeedleOnDashboard(g, candidateId, needle)) return candidateId;
    }
    return null;
  }

  let cand = tryParseWealthLiabilityIdFromPost(postRes, needle);
  cand = confirmIdOnDashboard(cand, postRes);
  if (cand) {
    sleepAfterWealthResolve();
    return cand;
  }

  cand = findLiabilityIdInDashboardByNeedle(postRes, needle);
  cand = confirmIdOnDashboard(cand, postRes);
  if (cand) {
    sleepAfterWealthResolve();
    return cand;
  }

  for (let a = 0; a < maxAttempts; a++) {
    sleep(0.04 + a * 0.03);
    const g = http.get(url, {
      headers: hdr,
      tags: { name: tagName, vu: vuTag },
      timeout,
    });
    const id = findLiabilityIdInDashboardByNeedle(g, needle);
    if (id && verifyLiabilityRowNeedleOnDashboard(g, id, needle)) {
      sleepAfterWealthResolve();
      return id;
    }
  }
  return null;
}

export {
  API_BASE,
  apiHeaders,
  assertApiBase,
  assertDevIdentityHost,
  collectErrorBucketBreakdown,
  createHttpErrorBuckets,
  DURATION,
  deleteGlobalSeed,
  getVuEntry,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  metricCount,
  metricValuesForTrend,
  readAllLifecycleUsersAtInit,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  SHARED_CASHFLOW_ID,
  seedCashflowForVu,
  sharedCashflowContext,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  THINK_SEC,
  trimResBody,
} from '../cashflows-income/common-income-screen.js';
