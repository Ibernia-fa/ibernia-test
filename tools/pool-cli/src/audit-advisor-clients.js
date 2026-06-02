/**
 * Audit GET /Clients/{advisorId}/all per pool user — client counts, payload size, k6 needle breakdown.
 * Investigation only; does not delete data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { openDb } from './db.js';
import {
  DEFAULT_API_BASE,
  DEFAULT_IDENTITY_BASE,
  DEFAULT_ROPC_CLIENT_ID,
  REPO_ROOT,
} from './config.js';
import { assertEnvironment, assertNonProdUrl } from './guards.js';

const K6_LAST_NAME_HINTS = [
  'k6jadv',
  'k6cl',
  'listseed',
  'k6srch',
  'k6getcf',
  'k6epd',
  'k6tl',
  'k6tlf',
  'Clik6',
  'suite',
  'lifecycle',
  'journey.advisor',
];

function parseJwtPayload(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
  } catch {
    return null;
  }
}

function advisorSubFromToken(token) {
  const c = parseJwtPayload(token);
  if (!c) return null;
  return (
    (c.sub != null && String(c.sub).trim()) ||
    (c.Sub != null && String(c.Sub).trim()) ||
    null
  );
}

function clientLastName(row) {
  const d = row && (row.clientDetails || row.ClientDetails);
  if (!d) return '';
  const ln = d.lastName != null ? d.lastName : d.LastName;
  return ln != null ? String(ln) : '';
}

function classifyK6Client(row) {
  const ln = clientLastName(row).toLowerCase();
  const em =
    row &&
    (row.clientDetails || row.ClientDetails) &&
    ((row.clientDetails.email || row.clientDetails.Email || '') + '');
  const hay = `${ln} ${String(em).toLowerCase()}`;
  for (let i = 0; i < K6_LAST_NAME_HINTS.length; i++) {
    if (hay.includes(K6_LAST_NAME_HINTS[i].toLowerCase())) return true;
  }
  return /k6|loadtest|load.test/i.test(hay);
}

function parseUserNumberFromEmail(email) {
  const m = String(email || '').match(/^User(\d+)@/i);
  return m ? parseInt(m[1], 10) : null;
}

function selectUsers(db, env, args) {
  let sql = `SELECT email, password FROM users WHERE environment = ? AND active = 1`;
  const params = [env];
  if (args.verifiedOnly) sql += ` AND load_tester_verified = 1`;
  if (args.emailGlob) {
    sql += ` AND email GLOB ?`;
    params.push(args.emailGlob);
  }
  let rows = db.prepare(sql).all(...params);
  if (args.userNumMin != null || args.userNumMax != null) {
    rows = rows.filter((row) => {
      const n = parseUserNumberFromEmail(row.email);
      if (n == null) return false;
      if (args.userNumMin != null && n < args.userNumMin) return false;
      if (args.userNumMax != null && n > args.userNumMax) return false;
      return true;
    });
  }
  rows.sort(
    (a, b) =>
      (parseUserNumberFromEmail(a.email) || 0) - (parseUserNumberFromEmail(b.email) || 0),
  );
  if (args.limit != null) rows = rows.slice(0, args.limit);
  return rows;
}

async function ropcToken(identityBase, row, clientId, clientSecret, scope) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: row.email,
    password: row.password,
    scope,
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  const res = await fetch(`${identityBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return j.access_token ? String(j.access_token) : null;
}

export async function cmdAuditAdvisorClients(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const identityBase = (args.identityBase || process.env.IDENTITY_BASE || DEFAULT_IDENTITY_BASE).replace(
    /\/$/,
    '',
  );
  const apiBase = (args.apiBase || process.env.BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  assertNonProdUrl(identityBase, 'identity-base', args.allowNonDev);
  assertNonProdUrl(apiBase, 'api-base', args.allowNonDev);

  const clientId = args.clientId || process.env.SIGNUP_ROPC_CLIENT_ID || DEFAULT_ROPC_CLIENT_ID;
  const clientSecret =
    args.clientSecret || process.env.SIGNUP_ROPC_CLIENT_SECRET || process.env.STS_SECRET || '';
  const scope =
    args.scope || process.env.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api';
  if (!clientSecret) {
    throw new Error('Set SIGNUP_ROPC_CLIENT_SECRET or STS_SECRET for ROPC.');
  }

  const db = openDb(args.env);
  const rows = selectUsers(db, args.env, args);
  db.close();

  if (rows.length === 0) {
    throw new Error('No pool users matched audit selection.');
  }

  const warnAbove = parseInt(
    String(args.warnAbove || process.env.K6_ADVISOR_CLIENT_WARN_ABOVE || '200').trim(),
    10,
  );

  const results = [];
  for (const row of rows) {
    const token = await ropcToken(identityBase, row, clientId, clientSecret, scope);
    if (!token) {
      results.push({
        email: row.email,
        userNumber: parseUserNumberFromEmail(row.email),
        error: 'ropc_failed',
      });
      continue;
    }
    const advisorSub = advisorSubFromToken(token);
    if (!advisorSub) {
      results.push({
        email: row.email,
        userNumber: parseUserNumberFromEmail(row.email),
        error: 'no_sub',
      });
      continue;
    }
    const url = `${apiBase}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`;
    const t0 = Date.now();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const elapsedMs = Date.now() - t0;
    const text = await res.text();
    let clientCount = 0;
    let k6LikeCount = 0;
    if (res.status === 200) {
      try {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) {
          clientCount = arr.length;
          for (let i = 0; i < arr.length; i++) {
            if (classifyK6Client(arr[i])) k6LikeCount += 1;
          }
        }
      } catch {
        /* ignore */
      }
    }
    results.push({
      email: row.email,
      userNumber: parseUserNumberFromEmail(row.email),
      financialAdvisorId: advisorSub,
      httpStatus: res.status,
      clientCount,
      k6LikeCount,
      nonK6Estimate: Math.max(0, clientCount - k6LikeCount),
      responseBytes: Buffer.byteLength(text, 'utf8'),
      elapsedMs,
      overWarnThreshold: clientCount > warnAbove,
    });
  }

  results.sort((a, b) => (b.clientCount || 0) - (a.clientCount || 0));

  console.log(
    `\naudit-advisor-clients: env=${args.env} users=${results.length} warnAbove=${warnAbove}\n`,
  );
  console.log(
    'email | user# | clients | k6-like | bytes | ms | status',
  );
  for (const r of results) {
    if (r.error) {
      console.log(`${r.email} | ${r.userNumber ?? ''} | ERROR ${r.error}`);
      continue;
    }
    const flag = r.overWarnThreshold ? ' ⚠' : '';
    console.log(
      `${r.email} | ${r.userNumber ?? ''} | ${r.clientCount} | ${r.k6LikeCount} | ${r.responseBytes} | ${r.elapsedMs} | ${r.httpStatus}${flag}`,
    );
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    environment: args.env,
    warnAbove,
    userCount: results.length,
    maxClientCount: Math.max(0, ...results.map((r) => r.clientCount || 0)),
    minClientCount: Math.min(...results.filter((r) => r.clientCount != null).map((r) => r.clientCount)),
    avgClientCount:
      results.filter((r) => r.clientCount != null).reduce((a, r) => a + r.clientCount, 0) /
      Math.max(1, results.filter((r) => r.clientCount != null).length),
    overThresholdCount: results.filter((r) => r.overWarnThreshold).length,
    findings: [
      'Client counts are per advisor Identity sub (FinancialAdvisor.AdvisorId).',
      'k6-like count uses last-name/email heuristics (k6jadv, listseed, Clik6, etc.) — not exact.',
      'Teardown only deletes clients matching each run needle; other k6 clients accumulate.',
    ],
    advisors: results,
  };

  const outPath =
    args.out ||
    path.join(REPO_ROOT, 'reports', 'journeys', `advisor-client-audit-${args.env}-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}\n`);
}
