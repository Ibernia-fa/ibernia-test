/**
 * Sequential **DEV** API probes for **`k6/full-platform/k6-full-platform-orchestrator.js`**.
 * Reuses **`lib/k6-client-lifecycle.js`** / **`lib/k6-load-cleanup.js`**; does not replace dedicated load tests.
 *
 * Phase A volume writes seed **realistic** client profiles and plan data: timeline milestones,
 * income & expense lines, saving pots, contributions & withdrawals, report forecast, and wealth assets/liabilities.
 *
 * **Phase A volume SLO (opt-in):** set **`VOLUME_SLO=1`** + **`VOLUME_SLO_PROFILE=write`**. Emits eight
 * **`journey_*_duration`** step metrics and write-profile endpoint samples via **`observeHttp`**.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { observeHttp } from './k6-http-observe.js';
import {
  buildClientModel,
  parseClientCreateResponse,
  parseJwtPayload,
} from './k6-client-lifecycle.js';
import {
  deleteClientsAndPlansForClientIds,
  findClientIdByVolumeClientTag,
  isPreRunCleanupDeleteAllClients,
  isPreRunCleanupEnabled,
  listAdvisorClients,
  purgeK6ClientsAndPlansForAdvisor,
} from './k6-load-cleanup.js';
import {
  applyRealisticClientProfile,
  birthDateIsoFromYear,
  buildRealisticCashflowBody,
  buildVolumeClientEmail,
  planTitleForPersona,
  selectPersonaForClient,
} from './k6-volume-realistic-data.js';
import { seedRealisticPlanData } from './k6-volume-plan-seed.js';
import {
  isVolumeSloEnabled,
  startPhaseAStep,
  completePhaseAStep,
  fullPlatformSloMeta,
  resolvePhaseAVolumeCounts,
  recordPhaseACreationCounts,
} from './volume-slo.js';
import { appendPhaseAManifestClient } from './volume-phase-a-manifest.js';
import {
  isTransientHttpStatus,
  transientRetryBackoffSec,
  parseVolumeMaxAttemptsEnv,
} from './volume-http-retry.js';

const PHASE_A = {
  CREATE_CLIENT: 'journey_create_client_duration',
  CREATE_BASE_PLAN: 'journey_create_base_plan_duration',
  CREATE_TIMELINE_EVENTS: 'journey_create_timeline_events_duration',
  ADD_INCOME_EXPENSES: 'journey_add_income_expenses_duration',
  ADD_SAVING_POTS: 'journey_add_saving_pots_duration',
  ADD_CONTRIBUTIONS: 'journey_add_contributions_withdrawals_duration',
  CALCULATE_PROJECTION: 'journey_calculate_projection_duration',
  FULL_PLAN_BUILD: 'journey_full_plan_build_duration',
};

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

/** Mutable bearer + headers; optional ROPC refresh during long Phase A writes. */
function createVolumeAuthContext(initialAccessToken, refreshAccessToken) {
  const ctx = {
    accessToken: initialAccessToken,
    hdrs: apiHeaders(initialAccessToken),
    refreshAccessToken: typeof refreshAccessToken === 'function' ? refreshAccessToken : null,
  };
  ctx.ensureFresh = function ensureFresh(force = false) {
    if (!ctx.refreshAccessToken) return ctx.accessToken;
    const next = ctx.refreshAccessToken(force);
    if (next && String(next).trim() !== '') {
      if (next !== ctx.accessToken) {
        console.log('[volume-auth] access token refreshed');
      }
      ctx.accessToken = next;
      ctx.hdrs = apiHeaders(next);
    }
    return ctx.accessToken;
  };
  return ctx;
}

function fpObserve(res, meta) {
  observeHttp(res, fullPlatformSloMeta(meta));
}

function createHttpAccepted(status, id) {
  if (status === 201) return true;
  if (status === 200) return !!id;
  return false;
}

function parseCashflowId(res) {
  if (res.status !== 201 && res.status !== 200) return null;
  try {
    const j = res.json();
    const id = j && (j.Id != null ? j.Id : j.id);
    return id != null && String(id).trim() !== '' ? String(id).trim() : null;
  } catch {
    return null;
  }
}

function birthDateFromClientModel(model) {
  const d = model && (model.clientDetails || model.ClientDetails);
  if (!d) return '1985-06-15T00:00:00.000Z';
  const bd = d.birthDate != null ? d.birthDate : d.BirthDate;
  if (bd == null) return '1985-06-15T00:00:00.000Z';
  if (typeof bd === 'string') return bd;
  try {
    return new Date(bd).toISOString();
  } catch {
    return '1985-06-15T00:00:00.000Z';
  }
}

function displayNameFromModel(model) {
  const d = model && (model.clientDetails || model.ClientDetails);
  if (!d) return 'k6 client';
  const fn = d.firstName != null ? String(d.firstName) : d.FirstName != null ? String(d.FirstName) : '';
  const ln = d.lastName != null ? String(d.lastName) : d.LastName != null ? String(d.LastName) : '';
  const s = `${fn} ${ln}`.trim();
  return s || 'k6 client';
}

function is402Module(res) {
  return res && res.status === 402;
}

function finishFullPlanBuild(fullPlanStart, ok) {
  if (isVolumeSloEnabled() && fullPlanStart != null) {
    completePhaseAStep(PHASE_A.FULL_PLAN_BUILD, fullPlanStart, { ok: ok !== false });
  }
}

function parseVolumeMaxAttemptsFromEnv(name, defaultVal) {
  return parseVolumeMaxAttemptsEnv(__ENV[name], defaultVal);
}

function createClientWithTransientRetry({ base, authCtx, createBody, timeout, clientTag, maxAttempts }) {
  const attempts =
    maxAttempts != null ? maxAttempts : parseVolumeMaxAttemptsFromEnv('VOLUME_CLIENT_CREATE_MAX_ATTEMPTS', 6);
  let lastRes = null;
  let parsed = { id: null, model: null };
  let refreshed401 = false;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    lastRes = http.post(`${base}/api/v1/Clients`, JSON.stringify(createBody), {
      headers: authCtx.hdrs,
      tags: { name: 'fp_clients_post' },
      timeout,
    });
    fpObserve(lastRes, { method: 'POST', endpoint: '/api/v1/Clients', tagName: 'fp_clients_post' });
    parsed = parseClientCreateResponse(lastRes);
    if (parsed.id && parsed.model) {
      return { resCreate: lastRes, clientId: parsed.id, modelRaw: parsed.model };
    }
    if (lastRes.status === 401 && authCtx.refreshAccessToken && !refreshed401) {
      console.warn(`[volume-client] 401 on create — refreshing token clientTag=${clientTag}`);
      authCtx.ensureFresh(true);
      refreshed401 = true;
      continue;
    }
    if (attempt < attempts && isTransientHttpStatus(lastRes.status)) {
      const backoff = transientRetryBackoffSec(attempt);
      console.warn(
        `[volume-client] create retry clientTag=${clientTag} attempt=${attempt} status=${lastRes.status} backoff=${backoff}s`,
      );
      sleep(backoff);
      if (authCtx.refreshAccessToken && attempt >= 2) authCtx.ensureFresh(false);
      continue;
    }
    break;
  }
  if (!parsed.id) {
    console.error(
      `[volume-client] create failed clientTag=${clientTag} status=${lastRes ? lastRes.status : 'n/a'} attempts=${attempts}`,
    );
  }
  return { resCreate: lastRes, clientId: parsed.id, modelRaw: parsed.model };
}

function postCashflowWithTransientRetry({ base, authCtx, body, timeout, clientTag, planIndex }) {
  const attempts = parseVolumeMaxAttemptsFromEnv('VOLUME_PLAN_CREATE_MAX_ATTEMPTS', 5);
  let lastRes = null;
  let cashflowId = null;
  let refreshed401 = false;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    lastRes = http.post(`${base}/api/v1/cashflows`, JSON.stringify(body), {
      headers: authCtx.hdrs,
      tags: { name: 'fp_cashflows_post' },
      timeout,
    });
    fpObserve(lastRes, { method: 'POST', endpoint: '/api/v1/cashflows', tagName: 'fp_cashflows_post' });
    cashflowId = parseCashflowId(lastRes);
    if (cashflowId) return { res: lastRes, cashflowId };
    if (lastRes.status === 401 && authCtx.refreshAccessToken && !refreshed401) {
      authCtx.ensureFresh(true);
      refreshed401 = true;
      continue;
    }
    if (attempt < attempts && isTransientHttpStatus(lastRes.status)) {
      const backoff = transientRetryBackoffSec(attempt);
      console.warn(
        `[volume-client] cashflow retry clientTag=${clientTag} planIndex=${planIndex} attempt=${attempt} status=${lastRes.status} backoff=${backoff}s`,
      );
      sleep(backoff);
      if (authCtx.refreshAccessToken && attempt >= 2) authCtx.ensureFresh(false);
      continue;
    }
    break;
  }
  return { res: lastRes, cashflowId: null };
}

function planNameKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase();
}

function listClientPlanRows(base, hdrs, clientId, timeout) {
  const res = http.get(`${base}/api/v1/client/${encodeURIComponent(clientId)}/cashflows`, {
    headers: hdrs,
    tags: { name: 'fp_client_cashflows_list' },
    timeout,
  });
  fpObserve(res, { method: 'GET', endpoint: '/api/v1/client/{clientId}/cashflows', tagName: 'fp_client_cashflows_list' });
  if (res.status !== 200) return [];
  try {
    const arr = res.json();
    if (!Array.isArray(arr)) return [];
    const rows = [];
    for (let i = 0; i < arr.length; i++) {
      const row = arr[i];
      const id = row && (row.id != null ? row.id : row.Id);
      const name = row && (row.name != null ? row.name : row.Name);
      if (id != null && String(id).trim() !== '') {
        rows.push({ id: String(id).trim(), name: name != null ? String(name) : '' });
      }
    }
    return rows;
  } catch {
    return [];
  }
}

function advisorStaggerSeconds() {
  const advisorIndex = parseInt(String(__ENV.PHASE_A_ADVISOR_INDEX || '0'), 10);
  if (!Number.isFinite(advisorIndex) || advisorIndex <= 0) return 0;
  return Math.min(120, advisorIndex * 6);
}

function clientSlotStaggerSeconds(clientIndex, advisorIndex) {
  const ai = Number.isFinite(advisorIndex) ? advisorIndex : 0;
  if (clientIndex < 3) return 0;
  if (clientIndex < 10) {
    return Math.min(25, (clientIndex - 2) * 3 + (ai % 7));
  }
  if (clientIndex < 14) {
    return Math.min(30, (clientIndex - 9) * 2 + (ai % 5) + 8);
  }
  const slotFrom15 = clientIndex - 13;
  return Math.min(90, 15 + slotFrom15 * 12 + ai * 3);
}

function midFleetClientSlotPauseSeconds(clientIndex, clientCount, advisorIndex) {
  if (clientCount < 10) return 0;
  const ai = Number.isFinite(advisorIndex) ? advisorIndex : 0;
  if (clientIndex === 4) return Math.min(60, 20 + ai * 2);
  if (clientIndex === 9) return Math.min(90, 30 + ai * 3);
  return 0;
}

function preHighClientSlotPauseSeconds(clientIndex, clientCount, advisorIndex) {
  if (clientCount < 15 || clientIndex !== 14) return 0;
  const ai = Number.isFinite(advisorIndex) ? advisorIndex : 0;
  return Math.min(240, 45 + ai * 10);
}

/**
 * Lightweight GETs to detect **`402 module_not_active`** (DEV diagnostics only).
 */
export function probeModulesAccess({ base, hdrs, advisorSub, timeout, relax402 }) {
  const out = { steps: [] };
  const push = (name, res) => {
    out.steps.push({ name, status: res ? res.status : 0, module402: is402Module(res) });
  };
  const listUrl = `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`;
  const rList = http.get(listUrl, { headers: hdrs, tags: { name: 'fp_probe_clients_all' }, timeout });
  fpObserve(rList, { method: 'GET', endpoint: '/api/v1/Clients/{advisorId}/all', tagName: 'fp_probe_clients_all' });
  push('clients_all', rList);
  const ev = http.get(`${base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'fp_probe_events_default' },
    timeout,
  });
  fpObserve(ev, { method: 'GET', endpoint: '/api/v1/Events/default', tagName: 'fp_probe_events_default' });
  push('events_default', ev);
  if (!relax402 && (is402Module(rList) || is402Module(ev))) {
    out.hardFail = true;
  }
  return out;
}

/**
 * Build timeline, income, projection, and wealth steps for one cashflow plan.
 * @returns {{ cashflowId: string, planName: string, ok: boolean }}
 */
function buildPlanPhases({
  base,
  authCtx,
  clientId,
  clientName,
  advisorSub,
  advisorName,
  birthIso,
  uniqueTag,
  clientIndex,
  planIndex,
  planCount,
  vuHint,
  timeout,
  sloOn,
}) {
  const hdrs = authCtx.hdrs;
  const clientPersona = selectPersonaForClient(uniqueTag, clientIndex, 0);
  const planName = planTitleForPersona(clientPersona, planIndex, planCount);
  const cfBody = buildRealisticCashflowBody({
    clientId,
    clientName,
    advisorSub,
    advisorName,
    planName,
    clientBirthDateIso: birthIso,
    persona: clientPersona,
    planIndex,
    planCount,
  });

  const createPlanStart = sloOn ? startPhaseAStep() : null;
  const cfPost = postCashflowWithTransientRetry({
    base,
    authCtx,
    body: cfBody,
    timeout,
    clientTag: uniqueTag,
    planIndex,
  });
  const resCf = cfPost.res;
  const cashflowId = cfPost.cashflowId;
  check(resCf, { 'fp: POST cashflows accepted': () => createHttpAccepted(resCf.status, cashflowId) });
  if (sloOn) completePhaseAStep(PHASE_A.CREATE_BASE_PLAN, createPlanStart, { ok: !!cashflowId });
  if (!cashflowId) {
    return { cashflowId: null, planName, ok: false };
  }

  const timelineStart = sloOn ? startPhaseAStep() : null;
  const incomeStart = sloOn ? startPhaseAStep() : null;
  const contributionsStart = sloOn ? startPhaseAStep() : null;
  const projectionStart = sloOn ? startPhaseAStep() : null;
  const savingPotsStart = sloOn ? startPhaseAStep() : null;

  const seedResult = seedRealisticPlanData({
    base,
    hdrs,
    cashflowId,
    persona: clientPersona,
    birthIso,
    clientTag: uniqueTag,
    planIndex,
    vuHint: vuHint != null ? vuHint : clientIndex + 1,
    timeout,
    observe: fpObserve,
  });

  if (sloOn) {
    completePhaseAStep(PHASE_A.CREATE_TIMELINE_EVENTS, timelineStart, { ok: seedResult.timelineOk });
    completePhaseAStep(PHASE_A.ADD_INCOME_EXPENSES, incomeStart, {
      ok: seedResult.incomeOk !== false && seedResult.financesOk,
    });
    completePhaseAStep(PHASE_A.ADD_CONTRIBUTIONS, contributionsStart, {
      ok: seedResult.contributionsOk !== false,
    });
    completePhaseAStep(PHASE_A.CALCULATE_PROJECTION, projectionStart, { ok: seedResult.reportOk });
    completePhaseAStep(PHASE_A.ADD_SAVING_POTS, savingPotsStart, { ok: seedResult.savingsOk });
  }

  return { cashflowId, planName, ok: seedResult.ok };
}

function seedAllPlansForClient({
  base,
  authCtx,
  clientId,
  clientName,
  advisorSub,
  advisorName,
  birthIso,
  clientTag,
  clientIndex,
  planCount,
  vuHint,
  timeout,
  sloOn,
}) {
  const clientPersona = selectPersonaForClient(clientTag, clientIndex, 0);
  const existingRows = listClientPlanRows(base, authCtx.hdrs, clientId, timeout);
  const existingByName = {};
  for (let i = 0; i < existingRows.length; i++) {
    const key = planNameKey(existingRows[i].name);
    if (key && !existingByName[key]) existingByName[key] = existingRows[i].id;
  }

  const cashflows = [];
  let clientOk = false;
  let lastCashflowId = null;

  for (let pi = 0; pi < planCount; pi++) {
    if (authCtx.refreshAccessToken && (pi === 0 || pi % 2 === 0)) {
      authCtx.ensureFresh(false);
    }
    const planName = planTitleForPersona(clientPersona, pi, planCount);
    const existingId = existingByName[planNameKey(planName)];
    if (existingId) {
      cashflows.push({ cashflowId: existingId, planName });
      lastCashflowId = existingId;
      clientOk = true;
      continue;
    }

    const planResult = buildPlanPhases({
      base,
      authCtx,
      clientId,
      clientName,
      advisorSub,
      advisorName,
      birthIso,
      uniqueTag: clientTag,
      clientIndex,
      planIndex: pi,
      planCount,
      vuHint,
      timeout,
      sloOn,
    });
    if (planResult.cashflowId && planResult.ok) {
      cashflows.push({ cashflowId: planResult.cashflowId, planName: planResult.planName });
      lastCashflowId = planResult.cashflowId;
      clientOk = true;
    } else if (planResult.cashflowId) {
      cashflows.push({ cashflowId: planResult.cashflowId, planName: planResult.planName });
      lastCashflowId = planResult.cashflowId;
    }
  }

  return { cashflows, clientOk, lastCashflowId };
}

/**
 * Create or resolve one client slot and seed all plans. Returns manifest-ready outcome.
 */
function processClientSlot({
  ci,
  uniqueTag,
  clientCount,
  planCount,
  base,
  authCtx,
  advisorSub,
  advisorName,
  domain,
  timeout,
  sloOn,
  existingClients,
  createdClientIdsThisRun,
  advisorIndex,
  skipSlotStagger,
}) {
  if (!skipSlotStagger) {
    const slotStagger = clientSlotStaggerSeconds(ci, advisorIndex);
    if (slotStagger > 0) sleep(slotStagger);
  }

  const clientTag = clientCount > 1 ? `${uniqueTag}c${ci + 1}` : uniqueTag;
  const persona = selectPersonaForClient(clientTag, ci, 0);
  const fullPlanStart = sloOn ? startPhaseAStep() : null;
  const clientEmail = buildVolumeClientEmail(persona, clientTag, domain);
  const existingClientId = findClientIdByVolumeClientTag(existingClients, clientTag);
  const createClientStart = sloOn ? startPhaseAStep() : null;
  let clientId = existingClientId;
  let modelRaw = null;
  let updatedClients = existingClients;

  if (existingClientId) {
    console.log(
      `[volume-client] skip create — existing client clientTag=${clientTag} clientId=${existingClientId}`,
    );
    const getExisting = http.get(`${base}/api/v1/Clients/${encodeURIComponent(existingClientId)}`, {
      headers: authCtx.hdrs,
      tags: { name: 'fp_clients_get_by_id' },
      timeout,
    });
    fpObserve(getExisting, { method: 'GET', endpoint: '/api/v1/Clients/{id}', tagName: 'fp_clients_get_by_id' });
    if (getExisting.status === 200) {
      try {
        modelRaw = getExisting.json();
      } catch {
        modelRaw = null;
      }
    }
    if (sloOn) completePhaseAStep(PHASE_A.CREATE_CLIENT, createClientStart, { ok: !!modelRaw });
  } else {
    const createBody = buildClientModel({
      advisorSub,
      advisorName,
      uniqueTag: clientTag,
      withPartner: false,
      clientEmail,
      clientFirstName: persona.firstName,
      clientLastNameBase: persona.lastName,
    });

    const created = createClientWithTransientRetry({
      base,
      authCtx,
      createBody,
      timeout,
      clientTag,
    });
    clientId = created.clientId;
    modelRaw = created.modelRaw;
    check(created.resCreate, {
      'fp: POST Clients accepted': () => createHttpAccepted(created.resCreate.status, clientId),
    });
    if (!clientId || !modelRaw) {
      if (sloOn) completePhaseAStep(PHASE_A.CREATE_CLIENT, createClientStart, { ok: false });
      finishFullPlanBuild(fullPlanStart, false);
      return {
        clientTag,
        clientId: null,
        fullPlanStart,
        existingClients: updatedClients,
        deferRetry: false,
        error: 'client_create_failed',
      };
    }

    createdClientIdsThisRun.push(clientId);

    const getOne = http.get(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, {
      headers: authCtx.hdrs,
      tags: { name: 'fp_clients_get_by_id' },
      timeout,
    });
    fpObserve(getOne, { method: 'GET', endpoint: '/api/v1/Clients/{id}', tagName: 'fp_clients_get_by_id' });
    check(getOne, { 'fp: GET client 200': (r) => r.status === 200 });

    const profileModel = applyRealisticClientProfile(modelRaw, { persona, uniqueTag: clientTag, clientIndex: ci });
    profileModel.Id = clientId;
    const resPut = http.put(`${base}/api/v1/Clients`, JSON.stringify(profileModel), {
      headers: authCtx.hdrs,
      tags: { name: 'fp_profile_put_client' },
      timeout,
    });
    fpObserve(resPut, { method: 'PUT', endpoint: '/api/v1/Clients', tagName: 'fp_profile_put_client' });
    check(resPut, { 'fp: PUT Clients 200': (r) => r.status === 200 });
    if (sloOn) completePhaseAStep(PHASE_A.CREATE_CLIENT, createClientStart, { ok: true });
    modelRaw = profileModel;

    const refreshed = listAdvisorClients(base, authCtx.hdrs, advisorSub, timeout, {
      list: 'fp_prerun_list_clients',
    });
    if (refreshed.ok) updatedClients = refreshed.clients;
  }

  if (!clientId || !modelRaw) {
    finishFullPlanBuild(fullPlanStart, false);
    return {
      clientTag,
      clientId: null,
      fullPlanStart,
      existingClients: updatedClients,
      deferRetry: false,
      error: 'client_resolve_failed',
    };
  }

  const model = applyRealisticClientProfile(modelRaw, { persona, uniqueTag: clientTag, clientIndex: ci });
  const clientName = displayNameFromModel(model);
  const birthIso = birthDateFromClientModel(model) || birthDateIsoFromYear(persona.birthYear);
  const vuHint = parseInt(String(uniqueTag).replace(/^fp(\d+).*/, '$1'), 10) || ci + 1;

  const { cashflows, clientOk, lastCashflowId } = seedAllPlansForClient({
    base,
    authCtx,
    clientId,
    clientName,
    advisorSub,
    advisorName,
    birthIso,
    clientTag,
    clientIndex: ci,
    planCount,
    vuHint,
    timeout,
    sloOn,
  });

  finishFullPlanBuild(fullPlanStart, clientOk && cashflows.length >= planCount);

  if (clientId && cashflows.length >= planCount) {
    return {
      clientTag,
      clientId,
      lastCashflowId,
      fullPlanStart,
      existingClients: updatedClients,
      deferRetry: false,
      manifestRow: { clientId, uniqueTag: clientTag, cashflows },
      clientOk,
    };
  }

  if (clientId && cashflows.length > 0) {
    return {
      clientTag,
      clientId,
      lastCashflowId,
      fullPlanStart,
      existingClients: updatedClients,
      deferRetry: false,
      error: 'plan_seed_failed',
      clientOk: false,
    };
  }

  return {
    clientTag,
    clientId,
    fullPlanStart,
    existingClients: updatedClients,
    deferRetry: false,
    error: 'plan_seed_failed',
    clientOk: false,
  };
}

/**
 * Full sequential journey for one user. **`uniqueTag`** is stored in Notes for cleanup; display names stay clean.
 * Supports **`clientsPerAdvisor`** / **`plansPerClient`** (env or scenario) and manifest export via **`appendPhaseAManifestClient`**.
 * @returns {{ clientId: string|null, cashflowId: string|null, uniqueTag: string, advisorSub: string, clients?: object[], error?: string|null }}
 */
export function executeFullPlatformSequence({
  base,
  accessToken,
  refreshAccessToken,
  advisorSub,
  advisorName,
  uniqueTag,
  timeout,
  domain,
  skipCleanup,
  skipTeardown,
  preRunCleanup,
  preRunCleanupDeleteAll,
  clientsPerAdvisor,
  plansPerClient,
}) {
  const sloOn = isVolumeSloEnabled();
  const counts = resolvePhaseAVolumeCounts();
  const clientCount = clientsPerAdvisor != null ? Math.max(1, Number(clientsPerAdvisor)) : counts.clientsPerAdvisor;
  const planCount = plansPerClient != null ? Math.max(1, Number(plansPerClient)) : counts.plansPerClient;
  const skipDelete = skipCleanup || skipTeardown;
  const authCtx = createVolumeAuthContext(accessToken, refreshAccessToken);
  const shouldPreRunCleanup =
    preRunCleanup != null ? preRunCleanup !== false : isPreRunCleanupEnabled();
  const deleteAllBeforeWrite =
    preRunCleanupDeleteAll != null ? preRunCleanupDeleteAll === true : isPreRunCleanupDeleteAllClients();

  /** Client IDs created in this VU iteration — never deleted until an explicit post-run teardown. */
  const createdClientIdsThisRun = [];

  if (shouldPreRunCleanup) {
    const purge = purgeK6ClientsAndPlansForAdvisor(
      base,
      authCtx.hdrs,
      advisorSub,
      timeout,
      {
        list: 'fp_prerun_cleanup_clients_all',
        cfList: 'fp_prerun_cleanup_cf_list',
        delCf: 'fp_prerun_cleanup_del_cf',
        delClient: 'fp_prerun_cleanup_del_client',
      },
      { deleteAllClients: deleteAllBeforeWrite, excludeClientIds: createdClientIdsThisRun },
    );
    console.log(
      `[volume-cleanup] pre-run purge advisorSub=${advisorSub} mode=${purge.mode} ` +
        `matched=${purge.matchedClients != null ? purge.matchedClients : 'n/a'} ` +
        `deletedClients=${purge.deletedClients} deletedPlans=${purge.deletedPlans} listOk=${purge.listOk}`,
    );
    if (deleteAllBeforeWrite && !purge.listOk) {
      console.error('[volume-cleanup] pre-run delete-all failed: could not list advisor clients');
      return { clientId: null, cashflowId: null, uniqueTag, advisorSub, error: 'pre_run_cleanup_failed' };
    }
  }

  const advisorClientList = listAdvisorClients(base, authCtx.hdrs, advisorSub, timeout, {
    list: 'fp_prerun_list_clients',
  });
  let existingClients = advisorClientList.ok ? advisorClientList.clients : [];

  const manifestClients = [];
  let lastClientId = null;
  let lastCashflowId = null;
  let lastTag = uniqueTag;
  let anyOk = false;

  const advisorIndex = parseInt(String(__ENV.PHASE_A_ADVISOR_INDEX || '0'), 10);
  const staggerStart = advisorStaggerSeconds();
  if (staggerStart > 0) {
    console.log(`[volume-client] advisor stagger ${staggerStart}s advisorIndex=${advisorIndex}`);
    sleep(staggerStart);
  }

  for (let ci = 0; ci < clientCount; ci++) {
    lastTag = clientCount > 1 ? `${uniqueTag}c${ci + 1}` : uniqueTag;
    if (authCtx.refreshAccessToken) {
      if (ci >= 14) {
        authCtx.ensureFresh(true);
      } else if (ci >= 5) {
        authCtx.ensureFresh(false);
      }
    }
    const midFleetPause = midFleetClientSlotPauseSeconds(ci, clientCount, advisorIndex);
    if (midFleetPause > 0) {
      console.log(
        `[volume-client] mid-fleet pause ${midFleetPause}s advisorIndex=${advisorIndex} clientTag=${lastTag}`,
      );
      sleep(midFleetPause);
    }
    const highSlotPause = preHighClientSlotPauseSeconds(ci, clientCount, advisorIndex);
    if (highSlotPause > 0) {
      console.log(
        `[volume-client] pre-c15 wave pause ${highSlotPause}s advisorIndex=${advisorIndex} clientTag=${lastTag}`,
      );
      sleep(highSlotPause);
    }
    const slotResult = processClientSlot({
      ci,
      uniqueTag,
      clientCount,
      planCount,
      base,
      authCtx,
      advisorSub,
      advisorName,
      domain,
      timeout,
      sloOn,
      existingClients,
      createdClientIdsThisRun,
      advisorIndex,
      skipSlotStagger: false,
    });
    existingClients = slotResult.existingClients;

    if (slotResult.manifestRow) {
      manifestClients.push(slotResult.manifestRow);
      appendPhaseAManifestClient(slotResult.manifestRow);
      lastClientId = slotResult.clientId;
      if (slotResult.lastCashflowId) lastCashflowId = slotResult.lastCashflowId;
      if (slotResult.clientOk) anyOk = true;
    } else if (slotResult.error) {
      appendPhaseAManifestClient({
        clientId: slotResult.clientId || '',
        uniqueTag: slotResult.clientTag,
        cashflows: [],
        error: slotResult.error,
      });
    }

    const allowPerIterationDelete = !skipDelete && !shouldPreRunCleanup;
    if (allowPerIterationDelete && slotResult.clientId) {
      deleteClientsAndPlansForClientIds(base, authCtx.hdrs, [slotResult.clientId], timeout, {
        list: 'fp_cleanup_clients_all',
        cfList: 'fp_cleanup_cf_list',
        delCf: 'fp_cleanup_del_cf',
        delClient: 'fp_cleanup_del_client',
      });
    }
  }

  if (!anyOk && !lastClientId) {
    recordPhaseACreationCounts(null, { clients: 0, plans: 0 });
    return {
      clientId: null,
      cashflowId: null,
      uniqueTag: lastTag,
      advisorSub,
      clients: manifestClients,
      error: 'client_create_failed',
    };
  }

  let planTotal = 0;
  for (let mi = 0; mi < manifestClients.length; mi++) {
    const mc = manifestClients[mi];
    if (mc && mc.error) continue;
    planTotal += (mc.cashflows || []).length;
  }
  recordPhaseACreationCounts(null, {
    clients: manifestClients.filter((c) => c && !c.error && c.clientId).length,
    plans: planTotal,
  });

  return {
    clientId: lastClientId,
    cashflowId: lastCashflowId,
    uniqueTag: lastTag,
    advisorSub,
    clients: manifestClients,
    error: anyOk ? null : 'partial_failure',
  };
}

export function advisorNameFromToken(accessToken, fallbackEmail) {
  const c = parseJwtPayload(accessToken);
  return (c && (c.name || c.Name || c.preferred_username)) || fallbackEmail;
}

export { PHASE_A as FULL_PLATFORM_PHASE_A_METRICS };
