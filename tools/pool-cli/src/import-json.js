import fs from 'node:fs';
import path from 'node:path';
import { openDb, newUserId, nowIso } from './db.js';
import {
  DEFAULT_API_BASE,
  DEFAULT_IDENTITY_BASE,
  DEFAULT_ROPC_CLIENT_ID,
  REPO_ROOT,
} from './config.js';
import { assertEnvironment, assertNonProdUrl } from './guards.js';

function isTruthyLoadTester(row) {
  if (row.load_tester_verified === true || row.load_tester_verified === 1) return true;
  if (row.token && String(row.token).trim()) {
    try {
      const parts = String(row.token).trim().split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        const v = payload.load_tester;
        if (v === true || v === 1) return true;
        if (typeof v === 'string' && ['true', '1', 'yes'].includes(v.trim().toLowerCase())) return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

function resolveJsonPath(fileArg) {
  const p = path.isAbsolute(fileArg) ? fileArg : path.join(REPO_ROOT, fileArg);
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
  return p;
}

export function cmdImportJson(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const identityBase = args.identityBase || DEFAULT_IDENTITY_BASE;
  const apiBase = args.apiBase || DEFAULT_API_BASE;
  assertNonProdUrl(identityBase, 'identity-base', args.allowNonDev);
  assertNonProdUrl(apiBase, 'api-base', args.allowNonDev);

  const jsonPath = resolveJsonPath(args._[1]);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error('JSON root must be an array');

  const db = openDb(args.env);
  const selectByEmail = db.prepare(
    `SELECT id, email FROM users WHERE environment = ? AND email = ? COLLATE NOCASE`,
  );
  const insert = db.prepare(`
    INSERT INTO users (
      id, email, password, environment, identity_base, api_base, ropc_client_id,
      identity_subject, load_tester_verified, active, created_at, last_used_at,
      lease_run_id, lease_expires_at, tags
    ) VALUES (
      @id, @email, @password, @environment, @identity_base, @api_base, @ropc_client_id,
      @identity_subject, @load_tester_verified, @active, @created_at, @last_used_at,
      @lease_run_id, @lease_expires_at, @tags
    )
  `);
  const update = db.prepare(`
    UPDATE users SET
      password = @password,
      identity_base = @identity_base,
      api_base = @api_base,
      ropc_client_id = @ropc_client_id,
      identity_subject = COALESCE(@identity_subject, identity_subject),
      load_tester_verified = MAX(load_tester_verified, @load_tester_verified),
      active = 1,
      created_at = COALESCE(@created_at, created_at)
    WHERE id = @id
  `);

  let inserted = 0;
  let updated = 0;
  const applyRows = (rows) => {
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const email = String(row.email || '').trim();
      const password = String(row.password ?? '');
      if (!email || !password) continue;

      const identitySubject =
        row.advisorId != null && String(row.advisorId).trim()
          ? String(row.advisorId).trim()
          : row.identityUserId != null && String(row.identityUserId).trim()
            ? String(row.identityUserId).trim()
            : null;
      const verified = isTruthyLoadTester(row) ? 1 : 0;
      const createdAt = row.createdAt || row.created_at || nowIso();
      const tags = row.tags != null ? JSON.stringify(row.tags) : null;

      const existing = selectByEmail.get(args.env, email);
      if (existing) {
        update.run({
          id: existing.id,
          password,
          identity_base: identityBase,
          api_base: apiBase,
          ropc_client_id: DEFAULT_ROPC_CLIENT_ID,
          identity_subject: identitySubject,
          load_tester_verified: verified,
          created_at: createdAt,
        });
        updated += 1;
      } else {
        insert.run({
          id: newUserId(),
          email,
          password,
          environment: args.env,
          identity_base: identityBase,
          api_base: apiBase,
          ropc_client_id: DEFAULT_ROPC_CLIENT_ID,
          identity_subject: identitySubject,
          load_tester_verified: verified,
          active: 1,
          created_at: createdAt,
          last_used_at: null,
          lease_run_id: null,
          lease_expires_at: null,
          tags,
        });
        inserted += 1;
      }
    }
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    applyRows(arr);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  db.close();
  console.log(`import-json: ${jsonPath} → env=${args.env} inserted=${inserted} updated=${updated}`);
}
