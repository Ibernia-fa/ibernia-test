import { openDb, nowIso } from './db.js';
import { assertEnvironment } from './guards.js';

export function cmdGc(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const now = nowIso();
  const maxAgeDays = args.maxAgeDays != null && Number.isFinite(args.maxAgeDays) ? args.maxAgeDays : null;

  const db = openDb(args.env);
  let clearedLeases = 0;
  if (args.clearExpiredLeases !== false) {
    const r = db
      .prepare(
        `UPDATE users SET lease_run_id = NULL, lease_expires_at = NULL
         WHERE environment = ? AND lease_expires_at IS NOT NULL AND lease_expires_at < ?`,
      )
      .run(args.env, now);
    clearedLeases = r.changes;
  }

  let deactivated = 0;
  if (maxAgeDays != null && maxAgeDays > 0) {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
    const r = db
      .prepare(
        `UPDATE users SET active = 0
         WHERE environment = ? AND created_at < ? AND (lease_run_id IS NULL OR lease_expires_at < ?)`,
      )
      .run(args.env, cutoff, now);
    deactivated = r.changes;
  }
  db.close();
  console.log(`gc: env=${args.env} cleared_expired_leases=${clearedLeases} deactivated=${deactivated}`);
}
