#!/usr/bin/env node
/**
 * Pre-flight ROPC check for lifecycle JSON (dev Identity).
 *
 * Usage:
 *   node tools/verify-lifecycle-ropc.mjs --file lifecycle-users.json --sample 3
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const out = {
    file: 'lifecycle-users.json',
    requireLoadTester: false,
    sample: 0,
    identityBase: '',
    clientId: '',
    clientSecret: '',
    scope: 'openid profile email roles ibernia_api',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' && argv[i + 1]) out.file = argv[++i];
    else if (a === '--require-load-tester') out.requireLoadTester = true;
    else if (a === '--sample' && argv[i + 1]) out.sample = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (a === '--identity-base' && argv[i + 1]) out.identityBase = argv[++i];
    else if (a === '--client-id' && argv[i + 1]) out.clientId = argv[++i];
    else if (a === '--help' || a === '-h') {
      out.help = true;
    }
  }
  return out;
}

function assertDevIdentityHost(url) {
  const l = String(url || '').toLowerCase();
  const ok =
    l.includes('dev-identity.ibernia.it') ||
    l.includes('localhost') ||
    l.includes('127.0.0.1') ||
    l.includes('-qa.') ||
    l.includes('-staging.');
  if (!ok) {
    throw new Error(
      `Refusing identity-base="${url}". Use dev-identity.ibernia.it (or localhost / qa / staging).`,
    );
  }
}

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

const args = parseArgs(process.argv);
if (args.help) {
  console.log(`Usage: node tools/verify-lifecycle-ropc.mjs [--file <json>] [--sample N] [--require-load-tester]

Env: IDENTITY_BASE (default dev-identity), SIGNUP_ROPC_CLIENT_ID, SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET`);
  process.exit(0);
}

const absFile = path.isAbsolute(args.file) ? args.file : path.join(repoRoot, args.file);
if (!fs.existsSync(absFile)) {
  console.error(`File not found: ${absFile}`);
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(absFile, 'utf8'));
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('Expected non-empty JSON array of { email, password } rows.');
  process.exit(1);
}

const identityBase = (
  args.identityBase ||
  process.env.IDENTITY_BASE ||
  'https://dev-identity.ibernia.it'
).replace(/\/$/, '');
assertDevIdentityHost(identityBase);

const clientId =
  args.clientId || process.env.SIGNUP_ROPC_CLIENT_ID || 'k6-load-test-client';
const clientSecret =
  process.env.SIGNUP_ROPC_CLIENT_SECRET || process.env.STS_SECRET || '';
const scope = process.env.SIGNUP_ROPC_SCOPE || args.scope;

if (!clientSecret) {
  console.warn(
    'verify-lifecycle-ropc: SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET not set — confidential clients may return invalid_client.',
  );
}

let toCheck = rows.filter((r) => r && String(r.email || '').trim() && String(r.password ?? '') !== '');
if (args.sample > 0 && toCheck.length > args.sample) {
  toCheck = toCheck.slice(0, args.sample);
}

if (toCheck.length === 0) {
  console.error('No rows with email + password to verify.');
  process.exit(1);
}

let ok = 0;
let fail = 0;

for (const row of toCheck) {
  const email = String(row.email).trim();
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: email,
    password: String(row.password),
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
    const hint = detail.includes('invalid_username_or_password')
      ? ' — confirm email in inbox / Identity Admin'
      : '';
    console.error(`verify-lifecycle-ropc FAIL ${email}: HTTP ${res.status}${detail}${hint}`);
    fail += 1;
    continue;
  }

  const j = await res.json();
  const claims = parseJwtPayload(j.access_token);
  if (args.requireLoadTester && !hasLoadTester(claims)) {
    console.error(`verify-lifecycle-ropc FAIL ${email}: missing load_tester claim`);
    fail += 1;
    continue;
  }

  console.log(`verify-lifecycle-ropc OK ${email}`);
  ok += 1;
}

console.log(`verify-lifecycle-ropc: ok=${ok} fail=${fail} (file=${path.basename(absFile)}, identity=${identityBase})`);
if (fail > 0) process.exit(1);
