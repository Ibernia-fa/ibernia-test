import { openDb, nowIso } from './db.js';
import { assertEnvironment } from './guards.js';

export function cmdStats(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const now = nowIso();
  const db = openDb(args.env);
  const total = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE environment = ?`).get(args.env).c;
  const active = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE environment = ? AND active = 1`)
    .get(args.env).c;
  const leased = db
    .prepare(
      `SELECT COUNT(*) AS c FROM users WHERE environment = ? AND lease_run_id IS NOT NULL AND lease_expires_at > ?`,
    )
    .get(args.env, now).c;
  const available = db
    .prepare(
      `SELECT COUNT(*) AS c FROM users WHERE environment = ? AND active = 1
       AND (lease_run_id IS NULL OR lease_expires_at IS NULL OR lease_expires_at < ?)`,
    )
    .get(args.env, now).c;
  const verified = db
    .prepare(
      `SELECT COUNT(*) AS c FROM users WHERE environment = ? AND load_tester_verified = 1`,
    )
    .get(args.env).c;
  db.close();

  console.log(JSON.stringify({ env: args.env, total, active, leased, available, load_tester_verified: verified }, null, 2));
}
