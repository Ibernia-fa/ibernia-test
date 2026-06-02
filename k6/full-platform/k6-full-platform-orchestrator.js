/**
 * **DEV / non-production** — sequential journey across Ibernia API surfaces (Clients → … → Wealth) + cleanup.
 *
 * **Prerequisites:** `SIGNUP_ROPC_CLIENT_ID` (recommended: **`k6-load-test-client`**) + **`SIGNUP_ROPC_CLIENT_SECRET`**
 * when the client is confidential, **`IDENTITY_BASE`**, **`BASE_URL`**.
 *
 * **User sources**
 * - **Default:** rows from **`lifecycle-users.json`** (password and/or token), same as other lifecycle scripts.
 * - **`USE_USER_POOL=1` + `POOL_SLICE_FILE`:** leased slice from **pool-cli** (sticky one user per VU).
 * - **`FULL_PLATFORM_HTML_SIGNUP=1`:** each iteration registers via HTML first, then ROPC for a **`load_tester`** token.
 *
 * **Executors (`LOAD_MODE`):** **`vus`** → `constant-vus`; **`shared`** → `shared-iterations`; **`ramp`** → `ramping-vus`
 * (override stages with **`RAMP_STAGES`** e.g. `30s:5,2m:20,1m:0`).
 *
 * **Phase A volume SLO (opt-in):** **`VOLUME_SLO=1`** **`VOLUME_SLO_PROFILE=write`** optional **`VOLUME_SLO_FILE`**
 * **`VOLUME_SLO_GATE=1`**. Writes **`reports/phase-a/{RunId}/slo-summary.json`** via handleSummary.
 *
 * **Pre-run cleanup (write):** before creating clients, deletes prior k6 clients/plans when
 * **`FULL_PLATFORM_PRE_RUN_CLEANUP=1`** (default on for write profile / skip-teardown). Fixed-advisor
 * Phase A sets **`FULL_PLATFORM_PRE_RUN_CLEANUP_ALL=1`** to remove every client on the advisor.
 *
 * @example PowerShell
 * cd $env:USERPROFILE\source\repos\load-testing-k6
 * k6 run k6/full-platform/k6-full-platform-orchestrator.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET="$env:STS_SECRET" `
 *   -e VUS=5 -e DURATION=3m
 */
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import {
  acquireLoadTesterToken,
  lifecycleLoginAcquireToken,
  mergeLifecycleUserRowsByEmail,
  parseJwtPayload,
  persistLifecycleUser,
  flattenLifecyclePersistBuckets,
  subjectFromJwtClaims,
  validateLoadTesterClaim,
  refreshTokenIfNeeded,
  loadLifecycleUsers,
} from '../../lib/k6-client-lifecycle.js';
import { useUserPool, userForVu, userForIteration } from '../../lib/user-pool/load-pool-slice.js';
import { performHtmlSignup } from '../../lib/k6-identity-html-register.js';
import {
  advisorNameFromToken,
  executeFullPlatformSequence,
  probeModulesAccess,
} from '../../lib/k6-full-platform-phases.js';
import {
  isPreRunCleanupDeleteAllClients,
  isPreRunCleanupEnabled,
} from '../../lib/k6-load-cleanup.js';
import { metricCount } from '../cashflows-income/common-income-screen.js';
import {
  attachPhaseASloToSummary,
  buildPhaseAThresholds,
  isVolumeSloEnabled,
  volumeSloConfigFromEnv,
  resolvePhaseAVolumeCounts,
} from '../../lib/volume-slo.js';
import {
  initPhaseAManifestShard,
  attachPhaseAManifestShardToSummary,
  emitPhaseAManifestShardMarker,
  isPhaseAManifestExportEnabled,
  phaseARunTag,
} from '../../lib/volume-phase-a-manifest.js';
import { emitVolumeSignoffShardMarker } from '../../lib/volume-signoff-k6.js';

const SCRIPT_TAG = 'k6-full-platform-orchestrator';

const IDENTITY_BASE = (__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = (__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = (__ENV.HTTP_TIMEOUT || '120s').trim();
const DURATION = (__ENV.DURATION || '5m').trim();
const VUS = Math.max(1, parseInt((__ENV.VUS || __ENV.K6_DEFAULT_VUS || '100').trim(), 10));
const USER_COUNT = Math.max(1, parseInt((__ENV.USER_COUNT || __ENV.TOTAL_REGISTRATIONS || '20').trim(), 10));
const LOAD_MODE = (__ENV.LOAD_MODE || 'vus').trim().toLowerCase();
const relaxChecks = ['1', 'true', 'yes'].includes((__ENV.RELAX_CHECKS || '').trim().toLowerCase());
const relaxHttpReqFailed = ['1', 'true', 'yes'].includes(
  (__ENV.RELAX_HTTP_REQ_FAILED || '').trim().toLowerCase(),
);
const relaxModule402 = ['1', 'true', 'yes'].includes((__ENV.RELAX_MODULE_402 || '').trim().toLowerCase());
const moduleProbe = ['1', 'true', 'yes'].includes((__ENV.FULL_PLATFORM_MODULE_PROBE || '').trim().toLowerCase());
const htmlSignupFirst = ['1', 'true', 'yes'].includes(
  (__ENV.FULL_PLATFORM_HTML_SIGNUP || '').trim().toLowerCase(),
);
const skipCleanup = ['1', 'true', 'yes'].includes((__ENV.FULL_PLATFORM_SKIP_CLEANUP || '').trim().toLowerCase());
const skipTeardown = ['1', 'true', 'yes'].includes(
  (__ENV.FULL_PLATFORM_SKIP_TEARDOWN || '').trim().toLowerCase(),
);
const skipDelete = skipCleanup || skipTeardown;
const preRunCleanup = isPreRunCleanupEnabled();
const preRunCleanupDeleteAll = isPreRunCleanupDeleteAllClients();
const appendLifecycle = ['1', 'true', 'yes'].includes(
  (__ENV.FULL_PLATFORM_APPEND_LIFECYCLE_EXPORT || '').trim().toLowerCase(),
);
const LIFECYCLE_EXPORT_FILE = (__ENV.LIFECYCLE_EXPORT_FILE || __ENV.LIFECYCLE_USERS_FILE || 'lifecycle-users.json').trim();
const FP_RUN_TAG = (
  (__ENV.PHASE_A_RUN_TAG || __ENV.SIGNUP_RUN_TAG || __ENV.FULL_PLATFORM_RUN_TAG || `r${Date.now()}`).trim()
);
const FP_EMAIL_DOMAIN = (__ENV.EMAIL_DOMAIN || 'example.test').trim();
const FP_SIGNUP_OFFSET = Math.max(0, parseInt((__ENV.FULL_PLATFORM_SIGNUP_INDEX_OFFSET || '0').trim(), 10));
const CLIENT_DOMAIN = (__ENV.CLIENT_API_EMAIL_DOMAIN || 'example.com').trim();
const ropcClientId = (__ENV.SIGNUP_ROPC_CLIENT_ID || '').trim();
const ropcSecret = (__ENV.SIGNUP_ROPC_CLIENT_SECRET || '').trim();
const ropcScope = (__ENV.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api').trim();
const thinkSec = parseFloat((__ENV.THINK_SEC || '0.2').trim() || '0.2');
const tokenSkewSec = Math.max(30, parseInt((__ENV.TOKEN_REFRESH_SKEW_SEC || '120').trim(), 10) || 120);
const requireLoadTesterClaim = !['0', 'false', 'no'].includes(
  (__ENV.FULL_PLATFORM_REQUIRE_LOAD_TESTER_CLAIM || '1').trim().toLowerCase(),
);
const usePool = useUserPool();
const poolStickyVu = !['0', 'false', 'no'].includes(
  (__ENV.USER_POOL_STICKY_VU || '1').trim().toLowerCase(),
);

function assertDevIdentityHost(base) {
  const l = base.toLowerCase();
  if (l.includes('dev-identity.ibernia.it') || l.includes('localhost') || l.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(
    `[${SCRIPT_TAG}] Refusing IDENTITY_BASE="${base}". Use dev-identity.ibernia.it or set ALLOW_NON_DEV=1.`,
  );
}

function assertApiBase(base) {
  const lower = base.toLowerCase();
  if (lower.includes('dev-api.ibernia.it') || lower.includes('localhost') || lower.includes('127.0.0.1')) return;
  if (__ENV.ALLOW_NON_DEV === '1') return;
  throw new Error(`[${SCRIPT_TAG}] Refusing BASE_URL="${base}". Use dev-api or set ALLOW_NON_DEV=1.`);
}

assertDevIdentityHost(IDENTITY_BASE);
assertApiBase(API_BASE);

const lifecycleUsers = htmlSignupFirst
  ? null
  : new SharedArray(usePool ? 'fp_pool_slice' : 'fp_lifecycle_users', () => loadLifecycleUsers());

export function setup() {
  if (!htmlSignupFirst && (!lifecycleUsers || lifecycleUsers.length === 0)) {
    throw new Error(`[${SCRIPT_TAG}] lifecycle-users file produced an empty pool.`);
  }
  if (!ropcClientId) {
    if (htmlSignupFirst) {
      throw new Error(`[${SCRIPT_TAG}] FULL_PLATFORM_HTML_SIGNUP=1 requires SIGNUP_ROPC_CLIENT_ID.`);
    }
    let anyNeedsRopc = false;
    for (let i = 0; i < lifecycleUsers.length; i++) {
      const t = lifecycleUsers[i] && String(lifecycleUsers[i].token || '').trim();
      if (!t) anyNeedsRopc = true;
    }
    if (anyNeedsRopc) {
      throw new Error(
        `[${SCRIPT_TAG}] Some lifecycle rows lack "token". Set SIGNUP_ROPC_CLIENT_ID (and secret if needed) for ROPC.`,
      );
    }
  }
  console.log(
    `[${SCRIPT_TAG}] API=${API_BASE} IDENTITY=${IDENTITY_BASE} HTML_SIGNUP=${htmlSignupFirst} VUS=${VUS} USER_COUNT=${USER_COUNT}`,
  );
  const singleExec = phaseASingleExecution();
  const execInfo = describeActiveExecutor();
  const shardIdEnv = (__ENV.PHASE_A_SHARD_ID || '').trim();
  if (singleExec) {
    console.log(
      `[${SCRIPT_TAG}] PHASE_A_SINGLE_EXECUTION=1 loadModeEnv=${LOAD_MODE} (env ignored) ` +
        `effective_executor=${execInfo.executor} vus=${execInfo.vus} iterations=${execInfo.iterations} ` +
        `maxDuration=${execInfo.maxDuration || 'n/a'}`,
    );
  } else {
    console.log(
      `[${SCRIPT_TAG}] PHASE_A_SINGLE_EXECUTION=0 LOAD_MODE=${LOAD_MODE} ` +
        `effective_executor=${execInfo.executor} vus=${execInfo.vus != null ? execInfo.vus : 'n/a'} ` +
        `iterations=${execInfo.iterations != null ? execInfo.iterations : 'n/a'} ` +
        `duration=${execInfo.duration || 'n/a'} maxDuration=${execInfo.maxDuration || 'n/a'}`,
    );
  }
  if (shardIdEnv) {
    console.log(`[${SCRIPT_TAG}] PHASE_A_SHARD_ID=${shardIdEnv}`);
  }
  if (isVolumeSloEnabled()) {
    const slo = volumeSloConfigFromEnv();
    const counts = resolvePhaseAVolumeCounts();
    console.log(
      `[${SCRIPT_TAG}] VOLUME_SLO=1 profile=${slo.profileOverride || 'auto/write'} gate=${slo.gateEnabled} ` +
        `scenario=${slo.scenarioName || 'default'} runId=${slo.runId || FP_RUN_TAG} config=${slo.configPath} ` +
        `clientsPerAdvisor=${counts.clientsPerAdvisor} plansPerClient=${counts.plansPerClient} ` +
        `manifest=${isPhaseAManifestExportEnabled()} skipTeardown=${skipDelete} ` +
        `preRunCleanup=${preRunCleanup} preRunCleanupAll=${preRunCleanupDeleteAll}`,
    );
  }
  if (!htmlSignupFirst) {
    console.log(
      `[${SCRIPT_TAG}] user pool=${lifecycleUsers.length} rows (USE_USER_POOL=${usePool} sticky_vu=${poolStickyVu})`,
    );
    if (usePool) {
      const mode = (LOAD_MODE || 'vus').toLowerCase();
      const needsVuCap =
        mode === 'vus' ||
        mode === 'constant-vus' ||
        mode === 'ramp' ||
        mode === 'ramping' ||
        mode === 'ramping-vus';
      if (needsVuCap && VUS > lifecycleUsers.length) {
        throw new Error(
          `[${SCRIPT_TAG}] VUS=${VUS} exceeds leased pool size=${lifecycleUsers.length}. ` +
            `Lease more users: pool-cli lease --count ${VUS} ...`,
        );
      }
    }
  }
  return { startedAt: Date.now() };
}

function globalIterationIndex() {
  try {
    return exec.scenario.iterationInTest;
  } catch {
    return typeof __ITER !== 'undefined' ? __ITER : 0;
  }
}

function iterationUserIndex() {
  return globalIterationIndex() + FP_SIGNUP_OFFSET;
}

function orchestratorEmailForHtmlSignup() {
  const n = String(iterationUserIndex() + 1);
  return `k6user-${FP_RUN_TAG}-${n}@${FP_EMAIL_DOMAIN}`;
}

function passwordForOrchestratorSignup() {
  const raw = (__ENV.AUTO_PASSWORD || 'indexed').trim().toLowerCase();
  if (raw === '1' || raw === 'true' || raw === 'yes') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@';
    let s = '';
    for (let i = 0; i < 20; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  const idx = String(iterationUserIndex() + 1).padStart(2, '0');
  let s = `k6u@${idx}`;
  while (s.length < 12) s += '!';
  return s;
}

function thresholds() {
  const base = {
    ...(relaxChecks ? {} : { checks: ['rate>0.9'] }),
    ...(relaxHttpReqFailed ? { http_req_failed: ['rate<1'] } : { http_req_failed: ['rate<0.15'] }),
  };
  if (isVolumeSloEnabled()) {
    return Object.assign(base, buildPhaseAThresholds());
  }
  return base;
}

function parseRampStages(raw) {
  return raw.split(',').map((seg) => {
    const parts = seg.split(':').map((s) => s.trim());
    return { duration: parts[0], target: parseInt(parts[1], 10) };
  });
}

function phaseASingleExecution() {
  return ['1', 'true', 'yes', 'on'].includes(
    (__ENV.PHASE_A_SINGLE_EXECUTION || '').trim().toLowerCase(),
  );
}

function scenarioOptions() {
  const thr = thresholds();
  const rampStages = parseRampStages((__ENV.RAMP_STAGES || '30s:5,2m:20,1m:0').trim());

  if (phaseASingleExecution()) {
    return {
      scenarios: {
        fp_orchestrator: {
          executor: 'shared-iterations',
          vus: 1,
          iterations: 1,
          maxDuration: (__ENV.MAX_DURATION || '30m').trim(),
        },
      },
      thresholds: thr,
    };
  }

  if (htmlSignupFirst) {
    if (LOAD_MODE === 'shared' || LOAD_MODE === 'shared-iterations') {
      return {
        scenarios: {
          fp_orchestrator: {
            executor: 'shared-iterations',
            vus: Math.min(VUS, USER_COUNT),
            iterations: USER_COUNT,
            maxDuration: __ENV.MAX_DURATION || '45m',
          },
        },
        thresholds: thr,
      };
    }
    if (LOAD_MODE === 'ramp' || LOAD_MODE === 'ramping' || LOAD_MODE === 'ramping-vus') {
      return {
        scenarios: {
          fp_orchestrator: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: rampStages,
            gracefulRampDown: '30s',
          },
        },
        thresholds: thr,
      };
    }
    return {
      scenarios: {
        fp_orchestrator: {
          executor: 'constant-vus',
          vus: VUS,
          duration: DURATION,
          gracefulStop: '30s',
        },
      },
      thresholds: thr,
    };
  }

  const pool = lifecycleUsers.length;
  const iters = Math.min(USER_COUNT, pool);
  if (LOAD_MODE === 'shared' || LOAD_MODE === 'shared-iterations') {
    return {
      scenarios: {
        fp_orchestrator: {
          executor: 'shared-iterations',
          vus: Math.min(VUS, iters, pool),
          iterations: iters,
          maxDuration: __ENV.MAX_DURATION || '45m',
        },
      },
      thresholds: thr,
    };
  }
  if (LOAD_MODE === 'ramp' || LOAD_MODE === 'ramping' || LOAD_MODE === 'ramping-vus') {
    return {
      scenarios: {
        fp_orchestrator: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: rampStages,
          gracefulRampDown: '30s',
        },
      },
      thresholds: thr,
    };
  }
  const vuCount = Math.min(VUS, pool);
  return {
    scenarios: {
      fp_orchestrator: {
        executor: 'constant-vus',
        vus: vuCount,
        duration: DURATION,
        gracefulStop: '30s',
      },
    },
    thresholds: thr,
  };
}

export const options = scenarioOptions();

/** Describe active k6 scenario for diagnostics (matches export options). */
function describeActiveExecutor() {
  const sc = options.scenarios && options.scenarios.fp_orchestrator;
  if (!sc) return { executor: 'unknown' };
  return {
    executor: sc.executor,
    vus: sc.vus != null ? sc.vus : null,
    iterations: sc.iterations != null ? sc.iterations : null,
    maxDuration: sc.maxDuration != null ? sc.maxDuration : null,
    duration: sc.duration != null ? sc.duration : null,
  };
}

function resolveUserRow() {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  const gi = globalIterationIndex();
  if (usePool && poolStickyVu) {
    return userForVu(lifecycleUsers, vu);
  }
  if (usePool) {
    return userForIteration(lifecycleUsers, gi);
  }
  return lifecycleUsers[gi % lifecycleUsers.length];
}

function getCachedTokenBundle(email, password, row) {
  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  if (!globalThis.__k6FpTokenCache) globalThis.__k6FpTokenCache = {};
  const key = `${vu}:${String(email).toLowerCase()}`;
  const cached = globalThis.__k6FpTokenCache[key];
  if (cached && cached.accessToken && !refreshTokenIfNeeded(cached.accessToken, tokenSkewSec)) {
    return cached;
  }
  const bundle = obtainAccessTokenAndAdvisor(email, password, row);
  if (bundle) globalThis.__k6FpTokenCache[key] = bundle;
  return bundle;
}

function advisorIdFromRow(row) {
  if (!row) return undefined;
  if (row.advisorId != null && String(row.advisorId).trim() !== '') return String(row.advisorId).trim();
  if (row.identityUserId != null && String(row.identityUserId).trim() !== '') return String(row.identityUserId).trim();
  return undefined;
}

/**
 * @returns {{ accessToken: string, advisorSub: string, email: string }|null}
 */
function obtainAccessTokenAndAdvisor(email, password, row) {
  const preRaw = row && String(row.token || '').trim();
  let usePreloaded = preRaw;
  if (preRaw && refreshTokenIfNeeded(preRaw, tokenSkewSec)) {
    usePreloaded = '';
  }

  const auth = lifecycleLoginAcquireToken({
    email,
    password: password || '',
    preloadedAccessToken: usePreloaded || undefined,
    identityBase: IDENTITY_BASE,
    clientId: ropcClientId,
    clientSecret: ropcSecret,
    scope: ropcScope,
    timeout: HTTP_TIMEOUT,
    advisorIdFromRow: advisorIdFromRow(row),
  });
  if (!auth) return null;

  if (requireLoadTesterClaim) {
    const v = validateLoadTesterClaim(auth.accessToken, { strict: true });
    check({ ok: v.ok }, { 'full-platform: JWT has load_tester': (o) => o.ok });
    if (!v.ok) {
      console.error(`[${SCRIPT_TAG}] Token for ${email} missing load_tester (${v.reason})`);
      return null;
    }
  }

  return { accessToken: auth.accessToken, advisorSub: auth.tokenSub, email };
}

export default function () {
  let email = '';
  let password = '';
  let row = null;
  let tokenBundle = null;

  if (htmlSignupFirst) {
    email = orchestratorEmailForHtmlSignup();
    password = passwordForOrchestratorSignup();
    const first = `${(__ENV.FIRST_NAME_PREFIX || 'LoadFirst').trim()}${iterationUserIndex() + 1}`;
    const last = `${(__ENV.LAST_NAME_PREFIX || 'LoadLast').trim()}${iterationUserIndex() + 1}`;
    const up = performHtmlSignup({
      identityBase: IDENTITY_BASE,
      email,
      password,
      firstName: first,
      lastName: last,
      httpTimeout: HTTP_TIMEOUT,
      postRetryMax: Math.max(0, Math.min(3, parseInt((__ENV.POST_RETRY_MAX || '0').trim(), 10))),
      postRetrySleepSec: parseFloat((__ENV.POST_RETRY_SLEEP_SEC || '1.5').trim()),
    });
    if (!up.ok) {
      sleep(thinkSec);
      return;
    }
    const lt = acquireLoadTesterToken({
      identityBase: IDENTITY_BASE,
      email,
      password,
      clientId: ropcClientId,
      clientSecret: ropcSecret,
      scope: ropcScope,
      timeout: HTTP_TIMEOUT,
      validateOptions: { strict: requireLoadTesterClaim },
    });
    check({ ok: lt.ok }, { 'full-platform: load_tester ROPC after HTML signup': (o) => o.ok });
    if (!lt.ok) {
      sleep(thinkSec);
      return;
    }
    const sub = subjectFromJwtClaims(lt.validation && lt.validation.claims);
    tokenBundle = { accessToken: lt.accessToken, advisorSub: sub || email, email };
  } else {
    row = resolveUserRow();
    email = String(row.email).trim();
    password = String(row.password || '').trim();
    tokenBundle = getCachedTokenBundle(email, password, row);
  }

  if (!tokenBundle || !tokenBundle.accessToken || !tokenBundle.advisorSub) {
    console.error(`[${SCRIPT_TAG}] Could not resolve token/advisor for ${email}`);
    sleep(thinkSec);
    return;
  }

  const { accessToken, advisorSub } = tokenBundle;
  const advisorName = advisorNameFromToken(accessToken, email);

  if (moduleProbe) {
    const probe = probeModulesAccess({
      base: API_BASE,
      hdrs: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      advisorSub,
      timeout: HTTP_TIMEOUT,
      relax402: relaxModule402,
    });
    if (probe.hardFail) {
      console.error(`[${SCRIPT_TAG}] module probe saw 402 — set RELAX_MODULE_402=1 to continue (dev only).`);
      sleep(thinkSec);
      return;
    }
  }

  const vu = typeof __VU !== 'undefined' ? __VU : 1;
  const gi = globalIterationIndex();
  const uniqueTag = `fp${vu}_g${gi}_${Date.now()}`;

  initPhaseAManifestShard({
    advisorSub,
    advisorEmail: email,
    vu,
    iteration: gi,
    shardId: (__ENV.PHASE_A_SHARD_ID || '').trim() || undefined,
  });

  executeFullPlatformSequence({
    base: API_BASE,
    accessToken,
    advisorSub,
    advisorName,
    uniqueTag,
    timeout: HTTP_TIMEOUT,
    domain: CLIENT_DOMAIN,
    skipCleanup: skipDelete,
    skipTeardown: skipDelete,
    preRunCleanup,
    preRunCleanupDeleteAll,
  });

  emitPhaseAManifestShardMarker();

  emitVolumeSignoffShardMarker('A', 'write', {
    runTag: phaseARunTag() || FP_RUN_TAG,
    shardId: (__ENV.PHASE_A_SHARD_ID || '').trim() || `advisor-${String(vu - 1).padStart(2, '0')}`,
    advisorEmail: email,
  });

  if (appendLifecycle && htmlSignupFirst && password) {
    const claims = parseJwtPayload(accessToken);
    const subj = subjectFromJwtClaims(claims);
    persistLifecycleUser({
      email,
      password,
      token: accessToken,
      advisorId: subj || advisorSub,
      identityUserId: subj || advisorSub,
      createdAt: new Date().toISOString(),
    });
  }

  sleep(thinkSec);
}

export function handleSummary(data) {
  const out = {};
  const reportPath =
    (__ENV.FULL_PLATFORM_SUMMARY_JSON || 'k6/full-platform/reports/full-platform-orchestrator-report.json').trim();
  const durationMs =
    data.state && data.state.testRunDurationMs != null ? data.state.testRunDurationMs : null;
  const checksPass = metricCount(data, 'checks');
  const checksFail =
    data.metrics.checks && data.metrics.checks.values && data.metrics.checks.values.fails != null
      ? data.metrics.checks.values.fails
      : null;
  const httpFailRate =
    data.metrics.http_req_failed && data.metrics.http_req_failed.values
      ? data.metrics.http_req_failed.values.rate
      : null;

  out[reportPath] = JSON.stringify(
    {
      script: SCRIPT_TAG,
      generatedAt: new Date().toISOString(),
      durationMs,
      http_req_failed_rate: httpFailRate,
      checks: { passes: checksPass, fails: checksFail },
      loadMode: LOAD_MODE,
      htmlSignup: htmlSignupFirst,
    },
    null,
    2,
  );

  if (appendLifecycle && htmlSignupFirst) {
    let existing = [];
    try {
      const raw = open(LIFECYCLE_EXPORT_FILE);
      const parsed = JSON.parse(raw);
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {
      existing = [];
    }
    const merged = mergeLifecycleUserRowsByEmail(existing, flattenLifecyclePersistBuckets());
    out[LIFECYCLE_EXPORT_FILE] = JSON.stringify(merged, null, 2);
  }

  let summaryOut = attachPhaseASloToSummary(out, {
    script: SCRIPT_TAG,
    runId: FP_RUN_TAG,
    loadMode: LOAD_MODE,
    htmlSignup: htmlSignupFirst,
    phaseARunTag: phaseARunTag(),
  });

  return attachPhaseAManifestShardToSummary(summaryOut, {
    runTag: phaseARunTag() || FP_RUN_TAG,
  }, data);
}
