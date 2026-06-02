import { openDb } from './db.js';
import { assertEnvironment } from './guards.js';

export function cmdDeactivate(args) {
  assertEnvironment(args.env, args.allowNonDev);
  if (!args.emailGlob && !args.emails?.length) {
    throw new Error('deactivate requires --email-glob and/or --email');
  }

  const db = openDb(args.env);
  let deactivated = 0;

  if (args.emailGlob) {
    const r = db
      .prepare(
        `UPDATE users SET active = 0
         WHERE environment = ? AND active = 1 AND email GLOB ?`,
      )
      .run(args.env, args.emailGlob);
    deactivated += r.changes;
  }

  if (args.emails?.length) {
    const stmt = db.prepare(
      `UPDATE users SET active = 0
       WHERE environment = ? AND active = 1 AND email = ? COLLATE NOCASE`,
    );
    for (const email of args.emails) {
      const r = stmt.run(args.env, email);
      deactivated += r.changes;
    }
  }

  db.close();
  console.log(`deactivate: env=${args.env} deactivated=${deactivated}`);
}
