import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { dbPathForEnv } from './config.js';

const SCHEMA_VERSION = 1;

export function openDb(env) {
  const dbPath = dbPathForEnv(env);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  } catch {
    /* optional pragmas */
  }
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const row = db.prepare(`SELECT value FROM schema_meta WHERE key = 'version'`).get();
  const ver = row ? parseInt(row.value, 10) : 0;
  if (ver < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL COLLATE NOCASE,
        password TEXT NOT NULL,
        environment TEXT NOT NULL,
        identity_base TEXT NOT NULL,
        api_base TEXT NOT NULL,
        ropc_client_id TEXT NOT NULL,
        identity_subject TEXT,
        load_tester_verified INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        last_used_at TEXT,
        lease_run_id TEXT,
        lease_expires_at TEXT,
        tags TEXT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_env ON users(environment, email);
      CREATE INDEX IF NOT EXISTS idx_users_lease ON users(environment, active, lease_run_id);
      CREATE INDEX IF NOT EXISTS idx_users_lease_expires ON users(lease_expires_at);
    `);
    db.prepare(`INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', ?)`).run(
      String(SCHEMA_VERSION),
    );
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function newUserId() {
  return randomUUID();
}
