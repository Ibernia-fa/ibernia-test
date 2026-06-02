import fs from 'node:fs';
import path from 'node:path';
import { openDb, nowIso } from './db.js';
import { REPO_ROOT, ttlToMs } from './config.js';
import { assertEnvironment } from './guards.js';

/**
 * @param {string} email
 * @returns {number|null}
 */
function parseUserNumberFromEmail(email) {
  const m = String(email || '').match(/^User(\d+)@/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * @param {{ email: string }[]} rows
 */
function sortUsersByNumber(rows) {
  return [...rows].sort((a, b) => {
    const na = parseUserNumberFromEmail(a.email);
    const nb = parseUserNumberFromEmail(b.email);
    if (na != null && nb != null) return na - nb;
    return String(a.email).localeCompare(String(b.email));
  });
}

/**
 * @param {{ email: string }[]} rows
 * @param {number|undefined} min
 * @param {number|undefined} max
 */
function filterByUserNumberRange(rows, min, max) {
  return rows.filter((row) => {
    const n = parseUserNumberFromEmail(row.email);
    if (n == null) return false;
    if (min != null && n < min) return false;
    if (max != null && n > max) return false;
    return true;
  });
}

export function cmdLease(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const count = args.count;
  const runId = args.runId;
  if (!Number.isFinite(count) || count < 1) throw new Error('--count must be >= 1');
  if (!runId || !String(runId).trim()) throw new Error('--run-id is required');

  const userNumMin = args.userNumMin;
  const userNumMax = args.userNumMax;
  if (userNumMin != null && userNumMax != null && userNumMin > userNumMax) {
    throw new Error(`--user-num-min (${userNumMin}) must be <= --user-num-max (${userNumMax})`);
  }

  const ttlMs = ttlToMs(args.ttl || '2h');
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const now = nowIso();

  const db = openDb(args.env);

  const already = db
    .prepare(
      `SELECT COUNT(*) AS c FROM users WHERE environment = ? AND lease_run_id = ? AND lease_expires_at > ?`,
    )
    .get(args.env, runId, now);
  if (already.c > 0) {
    db.close();
    throw new Error(
      `run-id "${runId}" already has ${already.c} active lease(s). Use a new run-id or release first.`,
    );
  }

  const globClause = args.emailGlob ? ' AND email GLOB ?' : '';
  const verifiedClause = args.verifiedOnly ? ' AND load_tester_verified = 1' : '';
  const useNumericOrder = userNumMin != null || userNumMax != null || args.order === 'user-number';
  const orderClause = useNumericOrder
    ? 'ORDER BY email ASC'
    : 'ORDER BY load_tester_verified DESC, created_at DESC';
  const fetchLimit =
    userNumMin != null || userNumMax != null ? Math.max(count * 30, 500) : count;

  const selectAvailable = db.prepare(`
    SELECT id, email, password, identity_subject
    FROM users
    WHERE environment = ?
      AND active = 1
      ${globClause}
      ${verifiedClause}
      AND (lease_run_id IS NULL OR lease_expires_at IS NULL OR lease_expires_at < ?)
    ${orderClause}
    LIMIT ?
  `);

  const updateLease = db.prepare(`
    UPDATE users SET lease_run_id = ?, lease_expires_at = ?, last_used_at = ?
    WHERE id = ?
  `);

  const leased = [];
  db.exec('BEGIN IMMEDIATE');
  try {
    const selectParams = [args.env];
    if (args.emailGlob) selectParams.push(args.emailGlob);
    selectParams.push(now, fetchLimit);
    let rows = selectAvailable.all(...selectParams);
    if (userNumMin != null || userNumMax != null) {
      rows = filterByUserNumberRange(rows, userNumMin, userNumMax);
    }
    if (useNumericOrder) {
      rows = sortUsersByNumber(rows);
    }
    if (rows.length < count) {
      const rangeHint =
        userNumMin != null || userNumMax != null
          ? ` in User${userNumMin ?? '?'}-User${userNumMax ?? '?'} range`
          : '';
      throw new Error(
        `Only ${rows.length} user(s) available${rangeHint}; requested ${count}. Import more users, release leases, or widen --user-num-min/--user-num-max.`,
      );
    }
    rows = rows.slice(0, count);
    for (const row of rows) {
      updateLease.run(runId, expiresAt, now, row.id);
      leased.push({
        email: row.email,
        password: row.password,
        advisorId: row.identity_subject || undefined,
        identityUserId: row.identity_subject || undefined,
      });
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    db.close();
    throw e;
  }
  db.close();

  const outPath = args.out
    ? path.isAbsolute(args.out)
      ? args.out
      : path.join(REPO_ROOT, args.out)
    : path.join(REPO_ROOT, 'data', 'user-pool', args.env, `pool-slice-${runId}.json`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(leased, null, 2), 'utf8');
  const nums = leased.map((u) => parseUserNumberFromEmail(u.email)).filter((n) => n != null);
  const rangeLabel =
    nums.length >= 2 ? ` users User${nums[0]}-User${nums[nums.length - 1]}` : '';
  console.log(
    `lease: run-id=${runId} count=${leased.length}${rangeLabel} expires=${expiresAt} → ${outPath}`,
  );
}
