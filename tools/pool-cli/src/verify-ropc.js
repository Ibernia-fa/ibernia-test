import { openDb } from './db.js';
import { DEFAULT_IDENTITY_BASE, DEFAULT_ROPC_CLIENT_ID } from './config.js';
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

function hasLoadTester(claims) {
  if (!claims) return false;
  const v = claims.load_tester;
  if (v === true || v === 1) return true;
  if (typeof v === 'string' && ['true', '1', 'yes'].includes(v.trim().toLowerCase())) return true;
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
      else console.warn(`verify-ropc: not in pool: ${email}`);
    }
    return rows;
  }
  if (args.emailGlob) {
    const limit = Math.max(1, args.sample || 5);
    return db
      .prepare(`${base} AND email GLOB ? ORDER BY RANDOM() LIMIT ?`)
      .all(env, args.emailGlob, limit);
  }
  const limit = Math.max(1, args.sample || 5);
  return db.prepare(`${base} ORDER BY RANDOM() LIMIT ?`).all(env, limit);
}

export async function cmdVerifyRopc(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const identityBase = (args.identityBase || process.env.IDENTITY_BASE || DEFAULT_IDENTITY_BASE).replace(
    /\/$/,
    '',
  );
  assertNonProdUrl(identityBase, 'identity-base', args.allowNonDev);

  const clientId = args.clientId || process.env.SIGNUP_ROPC_CLIENT_ID || DEFAULT_ROPC_CLIENT_ID;
  const clientSecret =
    args.clientSecret || process.env.SIGNUP_ROPC_CLIENT_SECRET || process.env.STS_SECRET || '';
  const scope =
    args.scope || process.env.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api';
  if (!clientSecret) {
    console.warn(
      'verify-ropc: SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET not set — confidential client will return invalid_client (HTTP 400).',
    );
  }

  const db = openDb(args.env);
  const rows = selectUsers(db, args.env, args);
  const markVerified = db.prepare(
    `UPDATE users SET load_tester_verified = 1
     WHERE environment = ? AND email = ? COLLATE NOCASE`,
  );

  if (rows.length === 0) {
    db.close();
    throw new Error('No users in pool to verify (check --email / --email-glob).');
  }

  let ok = 0;
  let fail = 0;
  for (const row of rows) {
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
    if (!res.ok) {
      let detail = '';
      try {
        const errBody = await res.json();
        const parts = [errBody.error, errBody.error_description].filter(Boolean);
        if (parts.length) detail = ` (${parts.join(': ')})`;
      } catch {
        /* non-JSON body */
      }
      const hint =
        detail.includes('invalid_username_or_password')
          ? ' — set User Email Confirmed ON in Identity Admin (lockout can stay ON)'
          : '';
      console.error(`verify-ropc FAIL ${row.email}: HTTP ${res.status}${detail}${hint}`);
      fail += 1;
      continue;
    }
    const j = await res.json();
    const at = j.access_token;
    const claims = parseJwtPayload(at);
    if (!hasLoadTester(claims)) {
      console.error(`verify-ropc FAIL ${row.email}: missing load_tester claim`);
      fail += 1;
      continue;
    }
    markVerified.run(args.env, row.email);
    console.log(`verify-ropc OK ${row.email}`);
    ok += 1;
  }
  db.close();
  console.log(`verify-ropc: ok=${ok} fail=${fail}`);
  if (fail > 0) process.exitCode = 1;
}
