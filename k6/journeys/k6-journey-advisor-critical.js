/**
 * Advisor critical user journey — login → clients list → open client → parallel plan load.
 *
 * One leased pool user per VU (sticky). Does not modify baseline *-load.js scripts.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * $env:STS_SECRET = '...'
 * node tools/pool-cli/bin/pool-cli.js lease --count 10 --run-id journey-adv --env dev --out data/user-pool/dev/pool-slice-journey-adv.json
 * k6 run k6/journeys/k6-journey-advisor-critical.js `
 *   -e USE_USER_POOL=1 -e POOL_SLICE_FILE=data/user-pool/dev/pool-slice-journey-adv.json `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET=$env:STS_SECRET `
 *   -e VUS=10 -e DURATION=5m
 * node tools/pool-cli/bin/pool-cli.js release --run-id journey-adv --env dev
 * ```
 */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  loadLifecycleUsers,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  validateLoadTesterClaim,
} from '../../lib/k6-client-lifecycle.js';
import { deleteClientsAndPlansByLastNameNeedle } from '../../lib/k6-load-cleanup.js';
import { scenarioVusForPool } from '../../lib/k6-default-vus.js';
import { userForVu } from '../../lib/user-pool/load-pool-slice.js';
import { teardownTimeoutOption } from '../../lib/k6-teardown-timeout.js';
import {
  journeyLoginDuration,
  journeyDashboardLoadDuration,
  journeyOpenClientDuration,
  journeyCashflowLoadDuration,
  journeyClientPlansLoadDuration,
  journeyOpenPlanDuration,
  journeyTimelineLoadDuration,
  journeyIncomeExpensesLoadDuration,
  journeySavingPotsLoadDuration,
  fullJourneyDuration,
  dashboardResponseSize,
  clientPlansResponseSize,
  cashflowResponseSize,
  startJourneyTimer,
  completeJourneyStep,
  failJourneyStep,
  recordJourneyDuration,
  recordAuthFailure,
  recordBusinessFailure,
  recordBreakingPoint,
  standardRequestTags,
  buildJourneySummaryReport,
  buildJourneyThresholdRows,
  formatJourneyThresholdMarkdown,
  buildBreakingPointAssessment,
  buildCapacityAssessment,
  freezeLagBudgetsAtInit,
  lagBudgetMs,
} from '../../lib/k6-journey-metrics.js';
import {
  recordJourneyEndpoint,
  buildEndpointStatsReport,
  buildDashboardMetaReport,
  recordDashboardMeta,
  formatEndpointStatsMarkdown,
  formatEndpointDistributionMarkdown,
  splitEndpointRowsBySpeed,
  journeyHeaders,
} from '../../lib/k6-journey-endpoint-stats.js';
import {
  beginJourneyIteration,
  endJourneyIteration,
  journeyHttpGet,
  journeyHttpPost,
  journeyHttpBatch,
  recordJourneyHttpCall,
  buildConcurrencyReport,
} from '../../lib/k6-journey-concurrency.js';
import {
  attachPhaseBSloToSummary,
  buildPhaseBThresholds,
  isVolumeSloEnabled,
  isVolumeSloGateEnabled,
  loadVolumeSloConfig,
  volumeSloConfigFromEnv,
} from '../../lib/volume-slo.js';
import {
  loadPhaseBManifest,
  selectManifestTargetForVu,
} from '../../lib/volume-phase-a-manifest.js';
import { emitVolumeSignoffShardMarker } from '../../lib/volume-signoff-k6.js';

const SCRIPT_TAG = 'k6-journey-advisor-critical';

const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const DURATION = (__ENV.DURATION || '5m').trim();
const THINK_MIN = parseFloat((__ENV.JOURNEY_THINK_SEC_MIN || '1').trim() || '1');
const THINK_MAX = parseFloat((__ENV.JOURNEY_THINK_SEC_MAX || '3').trim() || '3');
const REQUIRE_LOAD_TESTER = !['0', 'false', 'no'].includes(
  (__ENV.JOURNEY_REQUIRE_LOAD_TESTER_CLAIM || '1').trim().toLowerCase(),
);
const SUMMARY_JSON = (
  __ENV.JOURNEY_SUMMARY_JSON_PATH || 'reports/journeys/k6-journey-advisor-critical-summary.json'
).trim();
const NEEDLE_PREFIX = 'k6jadv';
const ADVISOR_CLIENT_WARN_ABOVE = parseInt(
  (__ENV.JOURNEY_ADVISOR_CLIENT_WARN_ABOVE || '200').trim(),
  10,
);
const PHASE_B_MANIFEST = loadPhaseBManifest();
const JOURNEY_USE_MANIFEST_IDS = ['1', 'true', 'yes'].includes(
  (__ENV.JOURNEY_USE_MANIFEST_IDS || '').trim().toLowerCase(),
);
if (JOURNEY_USE_MANIFEST_IDS && !PHASE_B_MANIFEST) {
  throw new Error(
    `[${SCRIPT_TAG}] JOURNEY_USE_MANIFEST_IDS=1 requires PHASE_B_MANIFEST_FILE / SCENARIO_MANIFEST_FILE`,
  );
}
const READ_ONLY_JOURNEY =
  ['1', 'true', 'yes'].includes((__ENV.PHASE_B_READ_ONLY || __ENV.VOLUME_READ_ONLY || '').trim().toLowerCase()) ||
  (PHASE_B_MANIFEST != null && PHASE_B_MANIFEST.reportType === 'phase-a-manifest');
const SKIP_JOURNEY_SEED = READ_ONLY_JOURNEY || PHASE_B_MANIFEST != null;
const PHASE_B_RUN_TAG_ENV = (
  (__ENV.PHASE_B_RUN_TAG || __ENV.VOLUME_SLO_RUN_ID || '').trim()
);
const SEED_KEY = '__k6JourneyAdvisorCriticalSeedByVu';
const PHASE_B_RUN_TAG_STORE = '__k6PhaseBRunTagResolved';

const ropcClientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
const ropcSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
const ropcScope = (__ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api').trim();

const POOL_USERS = new SharedArray('journey_advisor_pool', () => loadLifecycleUsers());
const SCENARIO_VUS = scenarioVusForPool(POOL_USERS.length, SCRIPT_TAG);

function assertDevHosts() {
  const idL = IDENTITY_BASE.toLowerCase();
  const apiL = API_BASE.toLowerCase();
  if (
    idL.includes('dev-identity.ibernia.it') ||
    idL.includes('localhost') ||
    idL.includes('127.0.0.1')
  ) {
    /* ok */
  } else if (__ENV.ALLOW_NON_DEV !== '1') {
    throw new Error(`[${SCRIPT_TAG}] Refusing IDENTITY_BASE="${IDENTITY_BASE}"`);
  }
  if (
    apiL.includes('dev-api.ibernia.it') ||
    apiL.includes('localhost') ||
    apiL.includes('127.0.0.1')
  ) {
    /* ok */
  } else if (__ENV.ALLOW_NON_DEV !== '1') {
    throw new Error(`[${SCRIPT_TAG}] Refusing BASE_URL="${API_BASE}"`);
  }
}

assertDevHosts();

const DURATION_METRICS = [
  'journey_login_duration',
  'journey_dashboard_load_duration',
  'journey_open_client_duration',
  'journey_client_plans_load_duration',
  'journey_open_plan_duration',
  'journey_timeline_load_duration',
  'journey_income_expenses_load_duration',
  'journey_saving_pots_load_duration',
  'journey_cashflow_load_duration',
  'full_journey_duration',
];

if (isVolumeSloEnabled()) {
  loadVolumeSloConfig();
  freezeLagBudgetsAtInit(DURATION_METRICS);
}

function journeyThresholds() {
  const base = {
    http_req_failed: ['rate<0.01'],
    journey_login_duration: ['p(95)<1500', 'p(99)<3000'],
    journey_dashboard_load_duration: ['p(95)<2500', 'p(99)<5000'],
    journey_open_client_duration: ['p(95)<2000', 'p(99)<4000'],
    journey_cashflow_load_duration: ['p(95)<3000', 'p(99)<6000'],
    user_lag_rate: ['rate<0.05'],
    business_failure_rate: ['rate<0.02'],
    auth_failure_rate: ['rate<0.01'],
  };
  if (isVolumeSloGateEnabled()) {
    return Object.assign(base, buildPhaseBThresholds());
  }
  return base;
}

export const options = {
  ...teardownTimeoutOption(SCENARIO_VUS),
  scenarios: {
    advisor_critical_journey: {
      executor: 'constant-vus',
      vus: SCENARIO_VUS,
      duration: DURATION,
      gracefulStop: '10s',
    },
  },
  thresholds: journeyThresholds(),
};

function thinkBetweenSteps() {
  const lo = Math.min(THINK_MIN, THINK_MAX);
  const hi = Math.max(THINK_MIN, THINK_MAX);
  sleep(lo + Math.random() * (hi - lo));
}

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

function enrichHeaders(hdrs, step, journeyName) {
  return Object.assign({}, hdrs, journeyHeaders(step, journeyName || 'advisor_critical'));
}

const EP = {
  clientsAll: '/api/v1/Clients/{advisorId}/all',
  clientById: '/api/v1/Clients/{id}',
  clientCashflows: '/api/v1/client/{clientId}/cashflows',
  cashflow: '/api/v1/cashflows/{cashflowId}',
  timelines: '/api/v1/cashflows/{cashflowId}/timelines',
  financial: '/api/v1/cashflows/{cashflowId}/financial',
  incomeExpenseFinancial: '/api/v1/cashflows/{cashflowId}/income-expense/financial',
  wealth: '/api/v1/wealth/{cashflowId}',
  eventsDefault: '/api/v1/Events/default',
  eventsCustom: '/api/v1/Events/custom',
};

function responseBodyBytes(res) {
  if (!res || res.body == null) return 0;
  if (typeof res.body === 'string') return res.body.length;
  if (res.body.byteLength != null) return res.body.byteLength;
  return 0;
}

function recordHttpStep(trend, res, ok) {
  const ms = res && res.timings && res.timings.duration != null ? Number(res.timings.duration) : 0;
  recordJourneyDuration(trend, ms);
  if (!ok) recordBusinessFailure(true);
  return ok;
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

function birthDateIsoFromModel(modelRaw) {
  const d = modelRaw && (modelRaw.clientDetails || modelRaw.ClientDetails);
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

function displayNameFromModel(modelRaw) {
  const d = modelRaw && (modelRaw.clientDetails || modelRaw.ClientDetails);
  if (!d) return 'k6 client';
  const fn = d.firstName != null ? String(d.firstName) : d.FirstName != null ? String(d.FirstName) : '';
  const ln = d.lastName != null ? String(d.lastName) : d.LastName != null ? String(d.LastName) : '';
  const s = `${fn} ${ln}`.trim();
  return s || 'k6 client';
}

function buildCashflowBody({ clientId, clientName, advisorSub, advisorName, planName, clientBirthDateIso }) {
  return {
    name: planName,
    planDuration: 40,
    inflationRate: 2.5,
    description: `k6 advisor journey ${planName}`,
    clientBirthDate: clientBirthDateIso,
    client: { id: clientId, name: clientName },
    financialAdvisor: { advisorId: advisorSub, advisorName: advisorName || 'k6 advisor' },
  };
}

function resolveManifestTarget(row) {
  if (!PHASE_B_MANIFEST) return null;
  const target = selectManifestTargetForVu(PHASE_B_MANIFEST, __VU);
  if (!target || !target.clientId || !target.cashflowId) return null;
  return {
    clientId: target.clientId,
    cashflowId: target.cashflowId,
    advisorSub: target.advisorSub || row.advisorIdFromRow,
    uniqueTag: target.uniqueTag,
    fromManifest: true,
  };
}

function getSeedStore() {
  if (!globalThis[SEED_KEY]) globalThis[SEED_KEY] = {};
  return globalThis[SEED_KEY];
}

function seedClientAndCashflow(base, row, runTag) {
  const vuKey = String(__VU);
  const store = getSeedStore();
  if (store[vuKey]) return store[vuKey];

  const manifestTarget = resolveManifestTarget(row);
  if (manifestTarget) {
    store[vuKey] = Object.assign({}, manifestTarget, {
      email: row.email,
      password: row.password,
      token: row.token,
      advisorIdFromRow: row.advisorIdFromRow,
    });
    return store[vuKey];
  }

  if (SKIP_JOURNEY_SEED || READ_ONLY_JOURNEY) {
    console.error(
      `[${SCRIPT_TAG}] VU ${vuKey}: no manifest target and seed disabled (PHASE_B_READ_ONLY / manifest mode).`,
    );
    return null;
  }

  const auth = lifecycleLoginAcquireToken({
    email: row.email,
    password: row.password,
    preloadedAccessToken: row.token,
    identityBase: IDENTITY_BASE,
    clientId: ropcClientId,
    clientSecret: ropcSecret,
    scope: ropcScope,
    timeout: HTTP_TIMEOUT,
    advisorIdFromRow: row.advisorIdFromRow,
  });
  if (!auth) {
    console.error(`[${SCRIPT_TAG}] VU ${vuKey}: seed login failed.`);
    return null;
  }
  const { accessToken, tokenSub } = auth;
  const claim = validateLoadTesterClaim(accessToken, { strict: REQUIRE_LOAD_TESTER });
  if (!claim.ok && REQUIRE_LOAD_TESTER) {
    console.error(`[${SCRIPT_TAG}] VU ${vuKey}: seed token missing load_tester claim.`);
    return null;
  }
  const advisorSub = resolveAdvisorSub(row.email, tokenSub);
  if (!advisorSub) {
    console.error(`[${SCRIPT_TAG}] VU ${vuKey}: seed could not resolve advisor id.`);
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email;

  const hdrs = apiHeaders(accessToken);
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const uniqueTag = `${NEEDLE_PREFIX}${runTag}vu${vuKey}`;
  const clientEmail = `journey.advisor.${uniqueTag}.${Date.now()}@${domain}`;
  const createBody = buildClientModel({
    advisorSub,
    advisorName,
    uniqueTag,
    withPartner: false,
    clientEmail,
  });

  const resCreate = journeyHttpPost(`${base}/api/v1/Clients`, JSON.stringify(createBody), {
    headers: enrichHeaders(hdrs, 'seed', 'seed'),
    tags: standardRequestTags({
      journey: 'seed',
      screen: 'clients',
      critical: true,
      name: 'journey_seed_post_clients',
    }),
    timeout: HTTP_TIMEOUT,
  });
  const { id: clientId, model: modelRaw } = parseClientCreateResponse(resCreate);
  const createOk = (resCreate.status === 201 || resCreate.status === 200) && !!clientId;
  if (!createOk) {
    recordBusinessFailure(true);
    return null;
  }

  const clientName = displayNameFromModel(modelRaw);
  const cfBody = buildCashflowBody({
    clientId,
    clientName,
    advisorSub,
    advisorName,
    planName: `Journey-${uniqueTag}`,
    clientBirthDateIso: birthDateIsoFromModel(modelRaw),
  });
  const resCf = journeyHttpPost(`${base}/api/v1/cashflows`, JSON.stringify(cfBody), {
    headers: enrichHeaders(hdrs, 'seed', 'seed'),
    tags: standardRequestTags({
      journey: 'seed',
      screen: 'cashflows',
      critical: true,
      name: 'journey_seed_post_cashflow',
    }),
    timeout: HTTP_TIMEOUT,
  });
  const cashflowId = parseCashflowId(resCf);
  if (!cashflowId) {
    recordBusinessFailure(true);
    return null;
  }

  store[vuKey] = {
    clientId,
    cashflowId,
    advisorSub,
    advisorName,
    email: row.email,
    password: row.password,
    token: row.token,
    advisorIdFromRow: row.advisorIdFromRow,
    uniqueTag,
  };
  return store[vuKey];
}

function runLogin(row) {
  const t0 = startJourneyTimer();
  recordJourneyHttpCall(1);
  const auth = lifecycleLoginAcquireToken({
    email: row.email,
    password: row.password,
    preloadedAccessToken: row.token,
    identityBase: IDENTITY_BASE,
    clientId: ropcClientId,
    clientSecret: ropcSecret,
    scope: ropcScope,
    timeout: HTTP_TIMEOUT,
    advisorIdFromRow: row.advisorIdFromRow,
  });
  if (!auth) {
    recordAuthFailure(true);
    failJourneyStep(journeyLoginDuration, t0, { ok: false });
    return null;
  }
  const claim = validateLoadTesterClaim(auth.accessToken, { strict: REQUIRE_LOAD_TESTER });
  if (!claim.ok && REQUIRE_LOAD_TESTER) {
    recordAuthFailure(true);
    failJourneyStep(journeyLoginDuration, t0, { ok: false });
    return null;
  }
  const advisorSub = resolveAdvisorSub(row.email, auth.tokenSub);
  if (!advisorSub) {
    recordAuthFailure(true);
    failJourneyStep(journeyLoginDuration, t0, { ok: false });
    return null;
  }
  recordAuthFailure(false);
  completeJourneyStep(journeyLoginDuration, t0, { ok: true });
  const claims = parseJwtPayload(auth.accessToken);
  return {
    accessToken: auth.accessToken,
    advisorSub,
    advisorName:
      (claims && (claims.name || claims.Name || claims.preferred_username)) || row.email,
  };
}

function runDashboard(base, accessToken, advisorSub) {
  const t0 = startJourneyTimer();
  const hdrs = apiHeaders(accessToken);
  const url = `${base}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`;
  const res = journeyHttpGet(url, {
    headers: enrichHeaders(hdrs, 'dashboard', 'dashboard'),
    tags: standardRequestTags({
      journey: 'dashboard',
      screen: 'clients',
      critical: true,
      name: 'journey_dashboard_clients_all',
    }),
    timeout: HTTP_TIMEOUT,
  });
  recordJourneyEndpoint(res, {
    endpoint: EP.clientsAll,
    method: 'GET',
    k6Name: 'journey_dashboard_clients_all',
  });
  let listOk = res.status === 200;
  if (listOk) {
    try {
      const arr = res.json();
      listOk = Array.isArray(arr);
      if (listOk) {
        const bodyLen =
          res.body != null
            ? typeof res.body === 'string'
              ? res.body.length
              : res.body.byteLength != null
                ? res.body.byteLength
                : 0
            : 0;
        recordDashboardMeta({ clientCount: arr.length, responseBytes: bodyLen });
        dashboardResponseSize.add(bodyLen);
        if (ADVISOR_CLIENT_WARN_ABOVE > 0 && arr.length > ADVISOR_CLIENT_WARN_ABOVE) {
          console.warn(
            `[${SCRIPT_TAG}] DATA_REALISM: FinancialAdvisorId=${advisorSub} VU=${__VU} ` +
              `clientCount=${arr.length} (warn above ${ADVISOR_CLIENT_WARN_ABOVE}). ` +
              `Likely historical k6 accumulation — run: node tools/pool-cli/bin/pool-cli.js audit-advisor-clients --env dev`,
          );
        }
      }
    } catch {
      listOk = false;
    }
  }
  check(res, { 'journey: dashboard list 200 array': () => listOk });
  if (!listOk) {
    failJourneyStep(journeyDashboardLoadDuration, t0, { ok: false });
    return false;
  }
  completeJourneyStep(journeyDashboardLoadDuration, t0, { ok: true });
  return true;
}

function runOpenClient(base, accessToken, clientId) {
  const t0 = startJourneyTimer();
  const hdrs = apiHeaders(accessToken);
  const url = `${base}/api/v1/Clients/${encodeURIComponent(clientId)}`;
  const res = journeyHttpGet(url, {
    headers: enrichHeaders(hdrs, 'open_client', 'open_client'),
    tags: standardRequestTags({
      journey: 'open_client',
      screen: 'clients',
      critical: true,
      name: 'journey_open_client_get',
    }),
    timeout: HTTP_TIMEOUT,
  });
  recordJourneyEndpoint(res, { endpoint: EP.clientById, method: 'GET', k6Name: 'journey_open_client_get' });
  let ok = res.status === 200;
  if (ok) {
    try {
      const j = res.json();
      const id = j && (j.Id != null ? j.Id : j.id);
      ok = id != null && String(id).trim() === String(clientId).trim();
    } catch {
      ok = false;
    }
  }
  check(res, { 'journey: open client id matches': () => ok });
  if (!ok) {
    failJourneyStep(journeyOpenClientDuration, t0, { ok: false });
    return false;
  }
  completeJourneyStep(journeyOpenClientDuration, t0, { ok: true });
  return true;
}

function runClientPlansLoad(base, accessToken, clientId) {
  const t0 = startJourneyTimer();
  const hdrs = apiHeaders(accessToken);
  const url = `${base}/api/v1/client/${encodeURIComponent(clientId)}/cashflows`;
  const res = journeyHttpGet(url, {
    headers: enrichHeaders(hdrs, 'client_plans', 'client_plans'),
    tags: standardRequestTags({
      journey: 'client_plans',
      screen: 'clients',
      critical: true,
      name: 'journey_client_plans_get',
    }),
    timeout: HTTP_TIMEOUT,
  });
  recordJourneyEndpoint(res, {
    endpoint: EP.clientCashflows,
    method: 'GET',
    k6Name: 'journey_client_plans_get',
  });
  const ok = res.status === 200 || res.status === 204;
  if (ok && res.status === 200) clientPlansResponseSize.add(responseBodyBytes(res));
  check(res, { 'journey: client cashflows ok': () => ok });
  if (!ok) {
    failJourneyStep(journeyClientPlansLoadDuration, t0, { ok: false });
    return false;
  }
  completeJourneyStep(journeyClientPlansLoadDuration, t0, { ok: true });
  return true;
}

/**
 * Parallel GET bundle when opening a cashflow plan (matches multi-tab API fan-out).
 */
function runCashflowLoadParallel(base, accessToken, cashflowId) {
  const t0 = startJourneyTimer();
  const hdrs = apiHeaders(accessToken);
  const cf = encodeURIComponent(cashflowId);

  const batch = journeyHttpBatch([
    {
      method: 'GET',
      url: `${base}/api/v1/cashflows/${cf}`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows',
          critical: true,
          name: 'journey_cf_get',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
    {
      method: 'GET',
      url: `${base}/api/v1/cashflows/${cf}/timelines`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows/timeline',
          critical: true,
          name: 'journey_cf_timelines',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
    {
      method: 'GET',
      url: `${base}/api/v1/cashflows/${cf}/financial`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows/finances',
          critical: true,
          name: 'journey_cf_financial',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
    {
      method: 'GET',
      url: `${base}/api/v1/cashflows/${cf}/income-expense/financial`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows/income',
          critical: true,
          name: 'journey_cf_income_expense_financial',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
    {
      method: 'GET',
      url: `${base}/api/v1/wealth/${cf}`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows/wealth',
          critical: false,
          name: 'journey_cf_wealth',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
    {
      method: 'GET',
      url: `${base}/api/v1/Events/default`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows/timeline',
          critical: false,
          name: 'journey_cf_events_default',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
    {
      method: 'GET',
      url: `${base}/api/v1/Events/custom`,
      params: {
        headers: enrichHeaders(hdrs, 'cashflow_load', 'cashflow_load'),
        tags: standardRequestTags({
          journey: 'cashflow_load',
          screen: 'cashflows/timeline',
          critical: false,
          name: 'journey_cf_events_custom',
        }),
        timeout: HTTP_TIMEOUT,
      },
    },
  ]);

  const rCf = batch[0];
  const rTl = batch[1];
  const rFin = batch[2];
  const rIe = batch[3];
  const rWd = batch[4];
  const rEvDef = batch[5];
  const rEvCust = batch[6];

  recordJourneyEndpoint(rCf, { endpoint: EP.cashflow, method: 'GET', k6Name: 'journey_cf_get' });
  recordJourneyEndpoint(rTl, { endpoint: EP.timelines, method: 'GET', k6Name: 'journey_cf_timelines' });
  recordJourneyEndpoint(rFin, { endpoint: EP.financial, method: 'GET', k6Name: 'journey_cf_financial' });
  recordJourneyEndpoint(rIe, {
    endpoint: EP.incomeExpenseFinancial,
    method: 'GET',
    k6Name: 'journey_cf_income_expense_financial',
  });
  recordJourneyEndpoint(rWd, { endpoint: EP.wealth, method: 'GET', k6Name: 'journey_cf_wealth' });
  recordJourneyEndpoint(rEvDef, { endpoint: EP.eventsDefault, method: 'GET', k6Name: 'journey_cf_events_default' });
  recordJourneyEndpoint(rEvCust, { endpoint: EP.eventsCustom, method: 'GET', k6Name: 'journey_cf_events_custom' });

  const cfOk = rCf.status === 200;
  const tlOk = rTl.status === 200;
  const finOk = rFin.status === 200;
  const ieOk = rIe.status === 200;
  const wdOk = rWd.status === 200;
  let evDefOk = rEvDef.status === 204;
  if (rEvDef.status === 200) {
    try {
      evDefOk = Array.isArray(rEvDef.json());
    } catch {
      evDefOk = false;
    }
  }
  const evCustOk = rEvCust.status === 200;

  recordHttpStep(journeyOpenPlanDuration, rCf, cfOk);
  recordHttpStep(journeyTimelineLoadDuration, rTl, tlOk);
  recordHttpStep(journeyIncomeExpensesLoadDuration, rIe, ieOk);
  recordHttpStep(journeySavingPotsLoadDuration, rWd, wdOk);
  if (cfOk) cashflowResponseSize.add(responseBodyBytes(rCf));

  const criticalOk = cfOk && tlOk && finOk && ieOk;
  check(batch[0], { 'journey: GET cashflow 200': () => cfOk });
  check(batch[1], { 'journey: GET timelines 200': () => tlOk });
  check(batch[2], { 'journey: GET financial 200': () => finOk });
  check(batch[3], { 'journey: GET income-expense/financial 200': () => ieOk });
  check(batch[4], { 'journey: GET wealth 200': () => wdOk });
  check(batch[5], { 'journey: GET Events/default ok': () => evDefOk });
  check(batch[6], { 'journey: GET Events/custom 200': () => evCustOk });

  if (!criticalOk) {
    failJourneyStep(journeyCashflowLoadDuration, t0, { ok: false });
    return false;
  }
  completeJourneyStep(journeyCashflowLoadDuration, t0, { ok: true });
  return true;
}

function resolvedPhaseBRunTag(fallbackData) {
  if (PHASE_B_RUN_TAG_ENV) return PHASE_B_RUN_TAG_ENV;
  if (globalThis[PHASE_B_RUN_TAG_STORE]) return globalThis[PHASE_B_RUN_TAG_STORE];
  if (fallbackData && fallbackData.phaseBRunTag) return fallbackData.phaseBRunTag;
  return `phase-b-${Date.now()}`;
}

export function setup() {
  if (!ropcClientId) {
    let needsRopc = false;
    for (let i = 0; i < POOL_USERS.length; i++) {
      const t = POOL_USERS[i] && String(POOL_USERS[i].token || '').trim();
      if (!t) needsRopc = true;
    }
    if (needsRopc) {
      throw new Error(`[${SCRIPT_TAG}] Set SIGNUP_ROPC_CLIENT_ID (and secret if needed).`);
    }
  }
  const runTag = (PHASE_B_RUN_TAG_ENV || `phase-b-${Date.now()}`).replace(/^phase-b-/, 'r') || `r${Date.now()}`;
  const phaseBRunTag =
    PHASE_B_RUN_TAG_ENV ||
    `phase-b-${Date.now()}-vus${SCENARIO_VUS}-pool${POOL_USERS.length}`;
  globalThis[PHASE_B_RUN_TAG_STORE] = phaseBRunTag;
  const slo = isVolumeSloEnabled() ? volumeSloConfigFromEnv() : null;
  console.log(
    `[${SCRIPT_TAG}] VUs=${SCENARIO_VUS} pool=${POOL_USERS.length} DURATION=${DURATION} ` +
      `think=${THINK_MIN}-${THINK_MAX}s readOnly=${READ_ONLY_JOURNEY} manifest=${PHASE_B_MANIFEST != null} ` +
      `phaseBRunTag=${phaseBRunTag} ` +
      `volumeSlo=${!!slo && slo.enabled} gate=${!!slo && slo.gateEnabled} ` +
      `budgets login=${lagBudgetMs('journey_login_duration')}ms ` +
      `dashboard=${lagBudgetMs('journey_dashboard_load_duration')}ms`,
  );
  return { base: API_BASE, runTag, phaseBRunTag, readOnly: READ_ONLY_JOURNEY };
}

export function teardown(data) {
  if (READ_ONLY_JOURNEY || SKIP_JOURNEY_SEED) {
    if (globalThis[SEED_KEY]) delete globalThis[SEED_KEY];
    return;
  }
  if (!data || !data.runTag) return;
  const needle = `${NEEDLE_PREFIX}${data.runTag}`;
  for (let i = 0; i < POOL_USERS.length; i++) {
    const row = POOL_USERS[i];
    const auth = lifecycleLoginAcquireToken({
      email: row.email,
      password: row.password,
      preloadedAccessToken: row.token,
      identityBase: IDENTITY_BASE,
      clientId: ropcClientId,
      clientSecret: ropcSecret,
      scope: ropcScope,
      timeout: HTTP_TIMEOUT,
      advisorIdFromRow: row.advisorIdFromRow,
    });
    if (!auth) continue;
    const advisorSub = resolveAdvisorSub(row.email, auth.tokenSub);
    if (!advisorSub) continue;
    deleteClientsAndPlansByLastNameNeedle(data.base, apiHeaders(auth.accessToken), advisorSub, needle, HTTP_TIMEOUT, {
      list: 'journey_teardown_clients_all',
      cfList: 'journey_teardown_cf_list',
      delCf: 'journey_teardown_del_cf',
      delClient: 'journey_teardown_del_client',
    });
  }
  if (globalThis[SEED_KEY]) delete globalThis[SEED_KEY];
}

export default function (data) {
  beginJourneyIteration();
  const fullT0 = startJourneyTimer();
  let journeyOk = false;
  let hardBusinessFail = false;

  try {
    const row = userForVu(POOL_USERS, __VU);
    if (!row) {
      console.error(`[${SCRIPT_TAG}] No pool user for VU ${__VU}`);
      hardBusinessFail = true;
      recordBusinessFailure(true);
      recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0);
      return;
    }

    const normalized = {
      email: String(row.email || '').trim(),
      password: String(row.password || '').trim(),
      token: row.token ? String(row.token).trim() : '',
      advisorIdFromRow:
        row.advisorId != null && String(row.advisorId).trim() !== ''
          ? String(row.advisorId).trim()
          : row.identityUserId != null && String(row.identityUserId).trim() !== ''
            ? String(row.identityUserId).trim()
            : '',
    };

    const seed = seedClientAndCashflow(data.base, normalized, data.runTag);
    if (!seed) {
      hardBusinessFail = true;
      recordBusinessFailure(true);
      recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0);
      return;
    }

    thinkBetweenSteps();

    const login = runLogin(normalized);
    if (!login) {
      recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0);
      return;
    }

    thinkBetweenSteps();

    const dashboardAdvisorSub =
      seed.fromManifest && seed.advisorSub ? seed.advisorSub : login.advisorSub;
    if (
      seed.fromManifest &&
      login.advisorSub &&
      seed.advisorSub &&
      login.advisorSub !== seed.advisorSub
    ) {
      console.warn(
        `[${SCRIPT_TAG}] ADVISOR_ALIGNMENT: pool advisorSub=${login.advisorSub} ` +
          `manifest advisorSub=${seed.advisorSub} VU=${__VU}`,
      );
    }

    if (!runDashboard(data.base, login.accessToken, dashboardAdvisorSub)) {
      recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0);
      return;
    }

    thinkBetweenSteps();

    if (!runOpenClient(data.base, login.accessToken, seed.clientId)) {
      recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0);
      return;
    }

    thinkBetweenSteps();

    if (!runClientPlansLoad(data.base, login.accessToken, seed.clientId)) {
      hardBusinessFail = true;
      recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0);
      return;
    }

    thinkBetweenSteps();

    journeyOk = runCashflowLoadParallel(data.base, login.accessToken, seed.cashflowId);
    recordJourneyDuration(fullJourneyDuration, Date.now() - fullT0, { recordLag: true });
    if (!journeyOk) {
      hardBusinessFail = true;
      recordBusinessFailure(true);
    }

    const mt = PHASE_B_MANIFEST ? selectManifestTargetForVu(PHASE_B_MANIFEST, __VU) : null;
    emitVolumeSignoffShardMarker('B', 'read', {
      runTag: data.phaseBRunTag || data.runTag,
      shardId: (mt && mt.shardId) || `advisor-${String(__VU - 1).padStart(2, '0')}`,
      advisorEmail: normalized.email,
    });
  } finally {
    recordBreakingPoint({
      fullJourneyMs: Math.max(0, Date.now() - fullT0),
      businessFailure: hardBusinessFail,
    });
    endJourneyIteration();
  }
}

const JOURNEY_METRICS = [
  'journey_login_duration',
  'journey_dashboard_load_duration',
  'journey_open_client_duration',
  'journey_client_plans_load_duration',
  'journey_open_plan_duration',
  'journey_timeline_load_duration',
  'journey_income_expenses_load_duration',
  'journey_saving_pots_load_duration',
  'journey_cashflow_load_duration',
  'full_journey_duration',
  'dashboard_response_size',
  'client_plans_response_size',
  'cashflow_response_size',
];

export function handleSummary(data) {
  freezeLagBudgetsAtInit(DURATION_METRICS);
  const endpointRows = buildEndpointStatsReport(data);
  const endpointSpeed = splitEndpointRowsBySpeed(endpointRows);
  const dashboardMeta = buildDashboardMetaReport(data);
  const concurrency = buildConcurrencyReport(data);
  const report = buildJourneySummaryReport(data, JOURNEY_METRICS, {
    endpoints: endpointRows,
    endpointSpeed,
    dashboardMeta,
    concurrency,
    breakingPoint: null,
    capacity: null,
    phase: READ_ONLY_JOURNEY ? 'B' : undefined,
    readOnly: READ_ONLY_JOURNEY,
    manifestDriven: PHASE_B_MANIFEST != null,
    phaseBRunTag: resolvedPhaseBRunTag(data),
  });
  report.breakingPoint = buildBreakingPointAssessment(data, report);
  report.capacity = buildCapacityAssessment(data, report, concurrency);
  const lines = [
    '',
    '=== Advisor critical journey summary ===',
    `user_lag_rate: ${report.rates.user_lag_rate != null ? (report.rates.user_lag_rate * 100).toFixed(2) + '%' : 'n/a'}`,
    `business_failure_rate: ${report.rates.business_failure_rate != null ? (report.rates.business_failure_rate * 100).toFixed(2) + '%' : 'n/a'}`,
    `auth_failure_rate: ${report.rates.auth_failure_rate != null ? (report.rates.auth_failure_rate * 100).toFixed(2) + '%' : 'n/a'}`,
    '',
    '=== BREAKING POINT ASSESSMENT ===',
    `Status: ${report.breakingPoint.status}`,
    `Reason: ${report.breakingPoint.reasons.join('; ')}`,
    '',
    '=== Capacity ===',
    `Status: ${report.capacity.status}`,
    `Detail: ${report.capacity.detail}`,
    '',
    '=== Concurrency ===',
    `Peak active users: ${concurrency.peakActiveUsers != null ? concurrency.peakActiveUsers : 'n/a'}`,
    `Avg active users: ${concurrency.avgActiveUsers != null ? Math.round(concurrency.avgActiveUsers * 10) / 10 : 'n/a'}`,
    `Peak in-flight requests: ${concurrency.peakInFlightRequests != null ? concurrency.peakInFlightRequests : 'n/a'}`,
    `Avg calls per iteration: ${concurrency.avgCallsPerIteration != null ? Math.round(concurrency.avgCallsPerIteration * 10) / 10 : 'n/a'}`,
    `Max calls per iteration: ${concurrency.maxCallsPerIteration != null ? concurrency.maxCallsPerIteration : 'n/a'}`,
    '',
    '=== Throughput ===',
    `Avg req/sec: ${concurrency.avgReqPerSec != null ? Math.round(concurrency.avgReqPerSec * 100) / 100 : 'n/a'}`,
    `Total HTTP requests: ${concurrency.totalHttpRequests != null ? concurrency.totalHttpRequests : 'n/a'}`,
    `Requests per user (approx): ${concurrency.requestsPerUser != null ? Math.round(concurrency.requestsPerUser) : 'n/a'}`,
    '',
    '=== Journey thresholds ===',
    formatJourneyThresholdMarkdown(report.journeyThresholdRows),
    '',
    '=== Per-endpoint timing ===',
    formatEndpointStatsMarkdown(endpointRows),
    '',
    formatEndpointDistributionMarkdown(endpointRows),
  ];
  if (dashboardMeta.samples > 0) {
    const c = dashboardMeta.clientsReturned;
    const b = dashboardMeta.responseBytes;
    lines.push(
      '',
      '=== Dashboard GET /Clients/{advisorId}/all payload ===',
      `samples=${dashboardMeta.samples} clients min/avg/max/p95=${c.min}/${Math.round(c.avg)}/${c.max}/${c.p95 != null ? Math.round(c.p95) : 'n/a'} responseBytes avg=${b.avg != null ? Math.round(b.avg) : 'n/a'} max=${b.max}`,
    );
  }
  for (let i = 0; i < JOURNEY_METRICS.length; i++) {
    const n = JOURNEY_METRICS[i];
    const j = report.journeys[n];
    if (j) {
      const unit = j.unit === 'bytes' ? 'B' : 'ms';
      const budget =
        j.lagBudgetMs != null
          ? `${j.lagBudgetMs}${unit}`
          : j.unit === 'bytes'
            ? 'n/a (bytes)'
            : `${j.lagBudgetMs}ms`;
      lines.push(
        `${n}: p95=${j.p95 != null ? Math.round(j.p95) : 'n/a'}${unit} p99=${j.p99 != null ? Math.round(j.p99) : 'n/a'}${unit} avg=${j.avg != null ? Math.round(j.avg) : 'n/a'}${unit} budget=${budget}`,
      );
    }
  }
  lines.push(`JSON: ${SUMMARY_JSON}`, '');

  const out = {
    stdout: textSummary(data, { indent: ' ', enableColors: true }) + lines.join('\n'),
  };
  if (SUMMARY_JSON) {
    out[SUMMARY_JSON] = JSON.stringify(report, null, 2);
  }
  const endpointMd = (
    __ENV.JOURNEY_ENDPOINT_STATS_MD_PATH || 'reports/journeys/k6-journey-advisor-critical-endpoints.md'
  ).trim();
  if (endpointMd) {
    const md = [
      '# Advisor critical journey — per-endpoint stats',
      '',
      `Generated: ${report.generatedAt}`,
      '',
      formatEndpointStatsMarkdown(endpointRows),
      '',
      '## Journey thresholds',
      '',
      formatJourneyThresholdMarkdown(report.journeyThresholdRows),
      '',
      '## Dashboard payload',
      '',
      '```json',
      JSON.stringify(dashboardMeta, null, 2),
      '```',
      '',
    ].join('\n');
    out[endpointMd] = md;
  }
  return attachPhaseBSloToSummary(out, {
    runId: resolvedPhaseBRunTag(data),
    readOnly: READ_ONLY_JOURNEY,
    manifestDriven: PHASE_B_MANIFEST != null,
    userLagRate: report.rates && report.rates.user_lag_rate != null ? report.rates.user_lag_rate : null,
  });
}
