import { openDb } from './db.js';
import { assertEnvironment } from './guards.js';

export function cmdPurge(args) {
  assertEnvironment(args.env, args.allowNonDev);
  if (!args.yes) {
    throw new Error('purge is destructive. Re-run with --yes to delete all users for this env.');
  }

  const db = openDb(args.env);
  const before = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE environment = ?`).get(args.env).c;
  db.prepare(`DELETE FROM users WHERE environment = ?`).run(args.env);
  db.close();

  console.log(`purge: env=${args.env} removed=${before} users`);
}
