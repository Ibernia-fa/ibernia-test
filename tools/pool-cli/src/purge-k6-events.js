import { openDb } from './db.js';
import {
  DEFAULT_API_BASE,
  DEFAULT_IDENTITY_BASE,
  DEFAULT_ROPC_CLIENT_ID,
} from './config.js';
import { assertEnvironment, assertNonProdUrl } from './guards.js';

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

/** Names created by k6 timeline / full-platform load tests. */
export function isK6LoadTestEventName(name) {
  const s = String(name || '').trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower.startsWith('k6-')) return true;
  if (lower.startsWith('k6tlsuite')) return true;
  return false;
}

function selectUsers(db, env, args) {
  const base = `SELECT email, password FROM users WHERE environment = ? AND active = 1`;
  if (args.emails?.length) {
    const sel = db.prepare(`${base} AND email = ? COLLATE NOCASE`);
    const rows = [];
    for (const email of args.emails) {
      const row = sel.get(env, email);
      if (row) rows.push(row);
      else console.warn(`purge-k6-events: not in pool: ${email}`);
    }
    return rows;
  }
  if (args.emailGlob) {
    return db.prepare(`${base} AND email GLOB ? ORDER BY email ASC`).all(env, args.emailGlob);
  }
  let sql = `${base} ORDER BY email ASC`;
  if (args.verifiedOnly) sql = `${base} AND load_tester_verified = 1 ORDER BY email ASC`;
  if (args.limit != null && args.limit > 0) sql += ` LIMIT ${Math.floor(args.limit)}`;
  return db.prepare(sql).all(env);
}

async function ropcToken({ identityBase, clientId, clientSecret, scope, email, password }) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: email,
    password,
    scope,
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  const res = await fetch(`${identityBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      const parts = [errBody.error, errBody.error_description].filter(Boolean);
      if (parts.length) detail = ` (${parts.join(': ')})`;
    } catch {
      /* ignore */
    }
    throw new Error(`ROPC HTTP ${res.status}${detail}`);
  }
  const j = await res.json();
  return j.access_token;
}

async function purgeForUser({
  apiBase,
  identityBase,
  clientId,
  clientSecret,
  scope,
  email,
  password,
  dryRun,
}) {
  const token = await ropcToken({
    identityBase,
    clientId,
    clientSecret,
    scope,
    email,
    password,
  });
  parseJwtPayload(token);

  const listUrl = `${apiBase}/api/v1/Events/custom`;
  const res = await fetch(listUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 402) {
    return { email, skipped: 'goals_module_402', listed: 0, deleted: 0, failed: 0 };
  }
  if (res.status !== 200) {
    return { email, skipped: `list_http_${res.status}`, listed: 0, deleted: 0, failed: 0 };
  }
  let arr;
  try {
    arr = await res.json();
  } catch {
    return { email, skipped: 'list_invalid_json', listed: 0, deleted: 0, failed: 0 };
  }
  if (!Array.isArray(arr)) {
    return { email, skipped: 'list_not_array', listed: 0, deleted: 0, failed: 0 };
  }

  const targets = [];
  for (const row of arr) {
    if (!row || typeof row !== 'object') continue;
    const name = row.name != null ? row.name : row.Name;
    if (!isK6LoadTestEventName(name)) continue;
    const id = row.id != null ? row.id : row.Id;
    if (id == null || String(id).trim() === '') continue;
    targets.push({ id: String(id).trim(), name: String(name) });
  }

  if (dryRun) {
    for (const t of targets) console.log(`  [dry-run] would delete: ${t.name} (${t.id})`);
    return { email, listed: arr.length, deleted: 0, wouldDelete: targets.length, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;
  for (const t of targets) {
    const delRes = await fetch(`${apiBase}/api/v1/Events/${encodeURIComponent(t.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (delRes.status === 200 || delRes.status === 204 || delRes.status === 404) {
      console.log(`  deleted: ${t.name}`);
      deleted += 1;
    } else {
      console.error(`  FAIL delete ${t.name}: HTTP ${delRes.status}`);
      failed += 1;
    }
  }
  return { email, listed: arr.length, deleted, failed };
}

export async function cmdPurgeK6Events(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const identityBase = (args.identityBase || process.env.IDENTITY_BASE || DEFAULT_IDENTITY_BASE).replace(
    /\/$/,
    '',
  );
  const apiBase = (args.apiBase || process.env.API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
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

  const dryRun = args.dryRun === true;
  const db = openDb(args.env);
  const rows = selectUsers(db, args.env, args);
  db.close();

  if (rows.length === 0) {
    throw new Error('No pool users matched (check --email / --email-glob).');
  }

  console.log(
    `purge-k6-events: env=${args.env} users=${rows.length} api=${apiBase} dryRun=${dryRun}`,
  );

  let totalDeleted = 0;
  let totalFailed = 0;
  let usersWithDeletes = 0;

  for (const row of rows) {
    console.log(`\n${row.email}:`);
    try {
      const r = await purgeForUser({
        apiBase,
        identityBase,
        clientId,
        clientSecret,
        scope,
        email: row.email,
        password: row.password,
        dryRun,
      });
      if (r.skipped) {
        console.log(`  skipped (${r.skipped})`);
        continue;
      }
      const n = dryRun ? r.wouldDelete || 0 : r.deleted || 0;
      if (n > 0) usersWithDeletes += 1;
      totalDeleted += n;
      totalFailed += r.failed || 0;
      console.log(
        `  custom events listed=${r.listed} ${dryRun ? 'wouldDelete' : 'deleted'}=${n} failed=${r.failed || 0}`,
      );
    } catch (e) {
      console.error(`  ERROR: ${e.message || e}`);
      totalFailed += 1;
    }
  }

  console.log(
    `\npurge-k6-events: users=${rows.length} withDeletes=${usersWithDeletes} ${dryRun ? 'wouldDelete' : 'deleted'}=${totalDeleted} failed=${totalFailed}`,
  );
  if (totalFailed > 0) process.exitCode = 1;
}
