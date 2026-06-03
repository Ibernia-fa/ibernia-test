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

function isRetryableClientCreateStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504 || status >= 500;
}

function createClientWithRetry({ base, hdrs, createBody, timeout, clientTag, maxAttempts = 8 }) {
  let lastRes = null;
  let parsed = { id: null, model: null };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastRes = http.post(`${base}/api/v1/Clients`, JSON.stringify(createBody), {
      headers: hdrs,
      tags: { name: 'fp_clients_post' },
      timeout,
    });
    fpObserve(lastRes, { method: 'POST', endpoint: '/api/v1/Clients', tagName: 'fp_clients_post' });
    parsed = parseClientCreateResponse(lastRes);
    if (parsed.id && parsed.model) {
      return { resCreate: lastRes, clientId: parsed.id, modelRaw: parsed.model };
    }
    if (attempt < maxAttempts && isRetryableClientCreateStatus(lastRes.status)) {
      console.warn(
        `[volume-client] create retry clientTag=${clientTag} attempt=${attempt} status=${lastRes.status}`,
      );
      sleep(Math.min(30, Math.pow(2, attempt)));
      continue;
    }
    break;
  }
  return { resCreate: lastRes, clientId: parsed.id, modelRaw: parsed.model };
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
  hdrs,
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
  const resCf = http.post(`${base}/api/v1/cashflows`, JSON.stringify(cfBody), {
    headers: hdrs,
    tags: { name: 'fp_cashflows_post' },
    timeout,
  });
  fpObserve(resCf, { method: 'POST', endpoint: '/api/v1/cashflows', tagName: 'fp_cashflows_post' });
  const cashflowId = parseCashflowId(resCf);
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

/**
 * Full sequential journey for one user. **`uniqueTag`** is stored in Notes for cleanup; display names stay clean.
 * Supports **`clientsPerAdvisor`** / **`plansPerClient`** (env or scenario) and manifest export via **`appendPhaseAManifestClient`**.
 * @returns {{ clientId: string|null, cashflowId: string|null, uniqueTag: string, advisorSub: string, clients?: object[], error?: string|null }}
 */
export function executeFullPlatformSequence({
  base,
  accessToken,
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
  const hdrs = apiHeaders(accessToken);
  const shouldPreRunCleanup =
    preRunCleanup != null ? preRunCleanup !== false : isPreRunCleanupEnabled();
  const deleteAllBeforeWrite =
    preRunCleanupDeleteAll != null ? preRunCleanupDeleteAll === true : isPreRunCleanupDeleteAllClients();

  /** Client IDs created in this VU iteration — never deleted until an explicit post-run teardown. */
  const createdClientIdsThisRun = [];

  if (shouldPreRunCleanup) {
    const purge = purgeK6ClientsAndPlansForAdvisor(
      base,
      hdrs,
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

  const advisorClientList = listAdvisorClients(base, hdrs, advisorSub, timeout, {
    list: 'fp_prerun_list_clients',
  });
  let existingClients = advisorClientList.ok ? advisorClientList.clients : [];

  const manifestClients = [];
  let lastClientId = null;
  let lastCashflowId = null;
  let lastTag = uniqueTag;
  let anyOk = false;

  for (let ci = 0; ci < clientCount; ci++) {
    const clientTag = clientCount > 1 ? `${uniqueTag}c${ci + 1}` : uniqueTag;
    lastTag = clientTag;
    const persona = selectPersonaForClient(clientTag, ci, 0);
    const fullPlanStart = sloOn ? startPhaseAStep() : null;
    const clientEmail = buildVolumeClientEmail(persona, clientTag, domain);
    const existingClientId = findClientIdByVolumeClientTag(existingClients, clientTag);
    const createClientStart = sloOn ? startPhaseAStep() : null;
    let clientId = existingClientId;
    let modelRaw = null;

    if (existingClientId) {
      console.log(
        `[volume-client] skip create — existing client clientTag=${clientTag} clientId=${existingClientId}`,
      );
      const getExisting = http.get(`${base}/api/v1/Clients/${encodeURIComponent(existingClientId)}`, {
        headers: hdrs,
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

      const created = createClientWithRetry({
        base,
        hdrs,
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
        appendPhaseAManifestClient({
          clientId: '',
          uniqueTag: clientTag,
          cashflows: [],
          error: 'client_create_failed',
        });
        continue;
      }

      createdClientIdsThisRun.push(clientId);

      const getOne = http.get(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, {
        headers: hdrs,
        tags: { name: 'fp_clients_get_by_id' },
        timeout,
      });
      fpObserve(getOne, { method: 'GET', endpoint: '/api/v1/Clients/{id}', tagName: 'fp_clients_get_by_id' });
      check(getOne, { 'fp: GET client 200': (r) => r.status === 200 });

      const profileModel = applyRealisticClientProfile(modelRaw, { persona, uniqueTag: clientTag, clientIndex: ci });
      profileModel.Id = clientId;
      const resPut = http.put(`${base}/api/v1/Clients`, JSON.stringify(profileModel), {
        headers: hdrs,
        tags: { name: 'fp_profile_put_client' },
        timeout,
      });
      fpObserve(resPut, { method: 'PUT', endpoint: '/api/v1/Clients', tagName: 'fp_profile_put_client' });
      check(resPut, { 'fp: PUT Clients 200': (r) => r.status === 200 });
      if (sloOn) completePhaseAStep(PHASE_A.CREATE_CLIENT, createClientStart, { ok: true });
      modelRaw = profileModel;

      const refreshed = listAdvisorClients(base, hdrs, advisorSub, timeout, {
        list: 'fp_prerun_list_clients',
      });
      if (refreshed.ok) existingClients = refreshed.clients;
    }

    if (!clientId || !modelRaw) {
      finishFullPlanBuild(fullPlanStart, false);
      appendPhaseAManifestClient({
        clientId: '',
        uniqueTag: clientTag,
        cashflows: [],
        error: 'client_resolve_failed',
      });
      continue;
    }

    const model = applyRealisticClientProfile(modelRaw, { persona, uniqueTag: clientTag, clientIndex: ci });

    const clientName = displayNameFromModel(model);
    const birthIso = birthDateFromClientModel(model) || birthDateIsoFromYear(persona.birthYear);
    const cashflows = [];
    let clientOk = false;
    const vuHint = parseInt(String(uniqueTag).replace(/^fp(\d+).*/, '$1'), 10) || ci + 1;

    for (let pi = 0; pi < planCount; pi++) {
      const planResult = buildPlanPhases({
        base,
        hdrs,
        clientId,
        clientName,
        advisorSub,
        advisorName,
        birthIso,
        uniqueTag: clientTag,
        clientIndex: ci,
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
        anyOk = true;
      } else if (planResult.cashflowId) {
        cashflows.push({ cashflowId: planResult.cashflowId, planName: planResult.planName });
        lastCashflowId = planResult.cashflowId;
      }
    }

    lastClientId = clientId;
    finishFullPlanBuild(fullPlanStart, clientOk);

    if (clientId && cashflows.length) {
      const manifestRow = { clientId, uniqueTag: clientTag, cashflows };
      manifestClients.push(manifestRow);
      appendPhaseAManifestClient(manifestRow);
    }

    // Pre-run cleanup already removed prior runs; never delete siblings from this run (5/10 client scenarios).
    const allowPerIterationDelete = !skipDelete && !shouldPreRunCleanup;
    if (allowPerIterationDelete && clientId) {
      deleteClientsAndPlansForClientIds(base, hdrs, [clientId], timeout, {
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
