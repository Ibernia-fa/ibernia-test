import { openDb } from './db.js';
import { assertEnvironment } from './guards.js';

export function cmdRelease(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const runId = args.runId;
  if (!runId || !String(runId).trim()) throw new Error('--run-id is required');

  const db = openDb(args.env);
  const result = db
    .prepare(
      `UPDATE users SET lease_run_id = NULL, lease_expires_at = NULL
       WHERE environment = ? AND lease_run_id = ?`,
    )
    .run(args.env, runId);
  db.close();
  console.log(`release: run-id=${runId} cleared=${result.changes}`);
}
