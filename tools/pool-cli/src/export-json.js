import fs from 'node:fs';
import path from 'node:path';
import { openDb } from './db.js';
import { REPO_ROOT } from './config.js';
import { assertEnvironment } from './guards.js';

export function cmdExportJson(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const out = args.out || args._[1];
  if (!out) throw new Error('--out <file> is required');

  const outPath = path.isAbsolute(out) ? out : path.join(REPO_ROOT, out);
  const db = openDb(args.env);
  const rows = db
    .prepare(
      `SELECT email, password, identity_subject, created_at, load_tester_verified, tags
       FROM users WHERE environment = ? AND active = 1 ORDER BY created_at ASC`,
    )
    .all(args.env);
  db.close();

  const exported = rows.map((r) => {
    const o = {
      email: r.email,
      password: r.password,
      createdAt: r.created_at,
    };
    if (r.identity_subject) {
      o.advisorId = r.identity_subject;
      o.identityUserId = r.identity_subject;
    }
    if (r.load_tester_verified) o.load_tester_verified = true;
    if (r.tags) {
      try {
        o.tags = JSON.parse(r.tags);
      } catch {
        o.tags = r.tags;
      }
    }
    return o;
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(exported, null, 2), 'utf8');
  console.log(`export-json: env=${args.env} rows=${exported.length} → ${outPath}`);
}
