/**
 * Per **lifecycle user**: login → **create one client** → **create two plans** (`POST /api/v1/cashflows`) → delete plans → delete client.
 *
 * Uses the same **`lifecycle-users.json`**, ROPC/JWT, and **`lib/k6-client-lifecycle.js`** helpers as **`k6/clients/k6-client-full-lifecycle.js`**. Does **not** modify other scripts.
 *
 * ## Prerequisites
 *
 * - **`lifecycle-users.json`** (non-empty array): `email`, `password` and/or `token`; optional **`advisorId`** / **`identityUserId`**.
 * - **`SIGNUP_ROPC_CLIENT_ID`** (+ secret if confidential) when any row lacks **`token`**.
 * - Tenant needs **`client_profile`** (Clients) and **`cashflow`** (plans) modules or you will see **402** `module_not_active`.
 *
 * ## Env
 *
 * - **`TOTAL_REGISTRATIONS`**, **`VUS`**, **`IDENTITY_BASE`**, **`BASE_URL`**, **`HTTP_TIMEOUT`**, **`LIFECYCLE_USERS_FILE`**, **`SIGNUP_ROPC_*`**, **`CLIENT_API_EMAIL_DOMAIN`**, **`THINK_SEC`**, **`RELAX_CHECKS`**, **`RELAX_HTTP_REQ_FAILED`**, **`MAX_DURATION`**
 * - **`RELAX_CLIENT_PROFILE_MODULE`**, **`RELAX_CASHFLOW_MODULE`** — when **1**, a **402** on that module’s first failing request skips the rest of that iteration’s creates (checks stay lenient); cleanup still runs for anything created.
 * - **`SIGNUP_ROPC_TOKEN_AUTH=basic`** — same as lib (Duende **client_secret_basic**).
 *
 * ## HTTP tags (metrics)
 *
 * - **`client_plans_create_client`**, **`client_plans_cashflow_1`**, **`client_plans_cashflow_2`**
 * - **`client_plans_delete_cashflow`**, **`client_plans_delete_client`**
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" `
 *   -e TOTAL_REGISTRATIONS=20 -e VUS=5 k6/clients/k6-client-and-plans-per-user-load.js
 * ```
 */
import { wrapHandleSummaryWithConsolidatedPerf } from '../../lib/k6-perf-integration.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { SharedArray } from 'k6/data';
import {
  buildClientModel,
  lifecycleLoginAcquireToken,
  parseClientCreateResponse,
  parseJwtPayload,
  resolveAdvisorSub,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';

function resolvedRepoLifecycleUsersPath() {
  try {
    return String(import.meta.resolve('../../lifecycle-users.json'));
  } catch {
    return '';
  }
}

function loadLifecycleUsersFromDisk() {
  const arr = loadLifecycleUsers();
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`[k6-client-and-plans] lifecycle users / pool slice must be a non-empty array.`);
  }
  let anyRowNeedsRopc = false;
  for (let i = 0; i < arr.length; i++) {
    const r = arr[i];
    const em = r && String(r.email || '').trim();
    let tok = r && String(r.token || '').trim();
    if (tok && /^bearer\s+/i.test(tok)) {
      tok = tok.replace(/^bearer\s+/i, '').trim();
    }
    if (r) r.token = tok;
    const pw = r && String(r.password || '').trim();
    if (!em) throw new Error(`[k6-client-and-plans] Row ${i}: missing "email".`);
    if (!tok && !pw) throw new Error(`[k6-client-and-plans] Row ${i}: need "token" and/or "password".`);
    if (tok) {
      const parts = tok.split('.');
      if (parts.length !== 3 || parts.some((p) => !String(p).trim())) {
        throw new Error(`[k6-client-and-plans] Row ${i}: "token" must be a JWT (three segments).`);
      }
    }
    if (!tok) anyRowNeedsRopc = true;
  }
  if (anyRowNeedsRopc && !(__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim()) {
    throw new Error(
      `[k6-client-and-plans] Rows use ROPC but SIGNUP_ROPC_CLIENT_ID is not set. See k6/clients/k6-client-full-lifecycle.js README.`,
    );
  }
  return arr;
}

const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const TOTAL_REGISTRATIONS = Math.max(1, parseInt((__ENV.TOTAL_REGISTRATIONS || __ENV.USER_COUNT || '100').trim(), 10));
const VUS_RAW = parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10);
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxClientProfileModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CLIENT_PROFILE_MODULE || '').trim().toLowerCase(),
);
const relaxCashflowModule = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_CASHFLOW_MODULE || '').trim().toLowerCase(),
);
const effectiveRelaxHttpReqFailed =
  relaxHttpReqFailed || relaxClientProfileModule || relaxCashflowModule;

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[k6-client-and-plans] Refusing IDENTITY_BASE="${base}". Use dev-identity or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[k6-client-and-plans] Refusing BASE_URL="${base}". Use dev API or set ALLOW_NON_DEV=1.`);
}

assertDevIdentityHost(IDENTITY_BASE);
assertApiBase(API_BASE);

const lifecycleUsers = new SharedArray('lifecycle_users_client_plans', loadLifecycleUsersFromDisk);

const SCENARIO_ITERATIONS = Math.min(TOTAL_REGISTRATIONS, lifecycleUsers.length);
const SCENARIO_VUS = Math.max(1, Math.min(VUS_RAW, lifecycleUsers.length, SCENARIO_ITERATIONS));

const thresholds = {
  ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
  ...(effectiveRelaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.5'] }),
};

export const options = {
  scenarios: {
    client_and_plans_per_user: {
      executor: 'shared-iterations',
      vus: SCENARIO_VUS,
      iterations: SCENARIO_ITERATIONS,
      maxDuration: __ENV.MAX_DURATION || '30m',
    },
  },
  thresholds,
};

function globalIterationIndex() {
  try {
    return exec.scenario.iterationInTest;
  } catch {
    return typeof __ITER !== 'undefined' ? __ITER : 0;
  }
}

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

function createHttpAccepted(status, id) {
  if (status === 201) return true;
  if (status === 200) return !!id;
  return false;
}

function isModuleNotActive402(res, moduleKey) {
  if (!res || res.status !== 402) return false;
  try {
    const j = res.json();
    if (!j || typeof j !== 'object') return false;
    const code = j.code != null ? String(j.code) : '';
    const mod = j.module != null ? String(j.module) : '';
    return code === 'module_not_active' && (!moduleKey || mod === moduleKey);
  } catch {
    return false;
  }
}

function parseCashflowCreateResponse(res) {
  if (res.status !== 201 && res.status !== 200) return { id: null };
  try {
    const j = res.json();
    const id = j && (j.Id != null ? j.Id : j.id);
    return { id: typeof id === 'string' && id.length > 0 ? id : null };
  } catch {
    return { id: null };
  }
}

function clientDisplayNameFromModel(modelRaw) {
  const d = modelRaw && (modelRaw.clientDetails || modelRaw.ClientDetails);
  if (!d) return 'k6 client';
  const fn = d.firstName != null ? String(d.firstName) : d.FirstName != null ? String(d.FirstName) : '';
  const ln = d.lastName != null ? String(d.lastName) : d.LastName != null ? String(d.LastName) : '';
  const s = `${fn} ${ln}`.trim();
  return s || 'k6 client';
}

function clientBirthDateIsoFromModel(modelRaw) {
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

function buildCashflowBody({ clientId, clientName, advisorSub, advisorName, planName, clientBirthDateIso }) {
  return {
    name: planName,
    planDuration: 40,
    inflationRate: 2.5,
    description: `k6 client-and-plans ${planName}`,
    clientBirthDate: clientBirthDateIso,
    client: {
      id: clientId,
      name: clientName,
    },
    financialAdvisor: {
      advisorId: advisorSub,
      advisorName: advisorName || 'k6 advisor',
    },
  };
}

function loginUserContext({ email, password, preloadedAccessToken, timeout, advisorIdFromRow }) {
  const clientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
  const clientSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
  const scope = (
    __ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api'
  ).trim();

  const auth = lifecycleLoginAcquireToken({
    email,
    password,
    preloadedAccessToken,
    identityBase: IDENTITY_BASE,
    clientId,
    clientSecret,
    scope,
    timeout,
    advisorIdFromRow,
  });
  if (!auth) return null;

  const { accessToken, tokenSub } = auth;
  const advisorSub = resolveAdvisorSub(email, tokenSub);
  if (!advisorSub) {
    console.error(`[k6-client-and-plans] No advisor id for ${email}.`);
    return null;
  }
  const claims = parseJwtPayload(accessToken);
  const advisorName =
    (claims && (claims.name || claims.Name || claims.preferred_username)) || email;
  return { accessToken, advisorSub, advisorName };
}

function thinkSec() {
  const t = (__ENV.THINK_SEC || '').trim();
  return t ? parseFloat(t) : 0.2;
}

function pauseThink() {
  sleep(thinkSec());
}

function runClientAndTwoPlans({ base, hdrs, email, advisorSub, advisorName, uniqueTag, timeout }) {
  const domain = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
  const clientEmail = `k6pl.${uniqueTag}.${Date.now()}@${domain}`;
  let clientId = null;
  let cashflowId1 = null;
  let cashflowId2 = null;

  try {
    pauseThink();
    const createBody = buildClientModel({
      advisorSub,
      advisorName,
      uniqueTag,
      withPartner: false,
      clientEmail,
    });
    const resClient = http.post(`${base}/api/v1/Clients`, JSON.stringify(createBody), {
      headers: hdrs,
      tags: { name: 'client_plans_create_client' },
      timeout,
    });
    const { id: cid, model: clientModel } = parseClientCreateResponse(resClient);
    const skipClient =
      relaxClientProfileModule && isModuleNotActive402(resClient, 'client_profile');
    const okClient = createHttpAccepted(resClient.status, cid) || skipClient;
    check(resClient, {
      'client+plans: client create accepted': () => okClient,
    });
    if (skipClient) {
      console.warn(
        `[k6-client-and-plans] RELAX_CLIENT_PROFILE_MODULE=1: skipping iteration (402) user=${email}`,
      );
      return;
    }
    if (!cid || !clientModel) {
      console.error(
        `[k6-client-and-plans] client create failed user=${email} HTTP ${resClient.status}`,
      );
      return;
    }
    clientId = cid;

    const cname = clientDisplayNameFromModel(clientModel);
    const birthIso = clientBirthDateIsoFromModel(clientModel);

    pauseThink();
    const plan1Name = `k6-plan-1-${uniqueTag}`.slice(0, 120);
    const body1 = buildCashflowBody({
      clientId,
      clientName: cname,
      advisorSub,
      advisorName,
      planName: plan1Name,
      clientBirthDateIso: birthIso,
    });
    const resCf1 = http.post(`${base}/api/v1/cashflows`, JSON.stringify(body1), {
      headers: hdrs,
      tags: { name: 'client_plans_cashflow_1' },
      timeout,
    });
    const parsed1 = parseCashflowCreateResponse(resCf1);
    const skipCf =
      relaxCashflowModule && isModuleNotActive402(resCf1, 'cashflow');
    const okCf1 = createHttpAccepted(resCf1.status, parsed1.id) || skipCf;
    check(resCf1, {
      'client+plans: cashflow 1 created': () => okCf1,
    });
    if (skipCf) {
      console.warn(
        `[k6-client-and-plans] RELAX_CASHFLOW_MODULE=1: skipping plans (402) user=${email} clientId=${clientId}`,
      );
      return;
    }
    if (!parsed1.id) {
      console.error(
        `[k6-client-and-plans] cashflow 1 failed user=${email} HTTP ${resCf1.status}`,
      );
      return;
    }
    cashflowId1 = parsed1.id;

    pauseThink();
    const plan2Name = `k6-plan-2-${uniqueTag}`.slice(0, 120);
    const body2 = buildCashflowBody({
      clientId,
      clientName: cname,
      advisorSub,
      advisorName,
      planName: plan2Name,
      clientBirthDateIso: birthIso,
    });
    const resCf2 = http.post(`${base}/api/v1/cashflows`, JSON.stringify(body2), {
      headers: hdrs,
      tags: { name: 'client_plans_cashflow_2' },
      timeout,
    });
    const parsed2 = parseCashflowCreateResponse(resCf2);
    const okCf2 = createHttpAccepted(resCf2.status, parsed2.id);
    check(resCf2, {
      'client+plans: cashflow 2 created': () => okCf2,
    });
    if (!parsed2.id) {
      console.error(
        `[k6-client-and-plans] cashflow 2 failed user=${email} HTTP ${resCf2.status}`,
      );
      return;
    }
    cashflowId2 = parsed2.id;
  } finally {
    const pauseDel = thinkSec();
    if (cashflowId2) {
      http.del(`${base}/api/v1/cashflows/${encodeURIComponent(cashflowId2)}`, null, {
        headers: hdrs,
        tags: { name: 'client_plans_delete_cashflow' },
        timeout,
      });
      cashflowId2 = null;
    }
    if (pauseDel > 0) sleep(pauseDel);
    if (cashflowId1) {
      http.del(`${base}/api/v1/cashflows/${encodeURIComponent(cashflowId1)}`, null, {
        headers: hdrs,
        tags: { name: 'client_plans_delete_cashflow' },
        timeout,
      });
      cashflowId1 = null;
    }
    if (clientId) {
      http.del(`${base}/api/v1/Clients/${encodeURIComponent(clientId)}`, null, {
        headers: hdrs,
        tags: { name: 'client_plans_delete_client' },
        timeout,
      });
      clientId = null;
    }
  }
}

export function setup() {
  console.log(
    `[k6-client-and-plans] users=${lifecycleUsers.length} iterations=${SCENARIO_ITERATIONS} vus=${SCENARIO_VUS} API=${API_BASE}`,
  );
  return {};
}

export default function () {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  const gi = globalIterationIndex();
  const it = typeof __ITER !== 'undefined' ? __ITER : 0;
  const row = lifecycleUsers[gi % lifecycleUsers.length];
  const email = String(row.email).trim();
  const pwd = String(row.password || '').trim();
  const rowToken = row.token != null ? String(row.token).trim() : '';
  const rowAdvisorRaw =
    row.advisorId != null && String(row.advisorId).trim() !== ''
      ? String(row.advisorId).trim()
      : row.identityUserId != null && String(row.identityUserId).trim() !== ''
        ? String(row.identityUserId).trim()
        : '';
  const uniqueTag = `pl_vu${vu}_gi${gi}_i${it}_${Date.now()}`;

  const ctx = loginUserContext({
    email,
    password: pwd,
    preloadedAccessToken: rowToken || undefined,
    timeout: HTTP_TIMEOUT,
    advisorIdFromRow: rowAdvisorRaw || undefined,
  });
  if (!ctx) return;

  runClientAndTwoPlans({
    base: API_BASE,
    hdrs: apiHeaders(ctx.accessToken),
    email,
    advisorSub: ctx.advisorSub,
    advisorName: ctx.advisorName,
    uniqueTag,
    timeout: HTTP_TIMEOUT,
  });

  sleep(__ENV.THINK_SEC ? parseFloat(__ENV.THINK_SEC) : 0.3);
}

export const handleSummary = wrapHandleSummaryWithConsolidatedPerf(null, {
  moduleName: 'clients',
  sliceId: 'k6-client-and-plans-per-user-load',
});
