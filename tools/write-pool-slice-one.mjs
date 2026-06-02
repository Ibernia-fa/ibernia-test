#!/usr/bin/env node
/**
 * Write one user's pool slice as a JSON array (k6-compatible).
 *
 * Usage: node tools/write-pool-slice-one.mjs <leasedSlice.json> <userIndex> <outPath>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const inPath = process.argv[2];
const index = parseInt(process.argv[3], 10);
const outPath = process.argv[4];

if (!inPath || !Number.isFinite(index) || !outPath) {
  console.error('Usage: node tools/write-pool-slice-one.mjs <leasedSlice.json> <userIndex> <outPath>');
  process.exit(1);
}

const absIn = path.isAbsolute(inPath) ? inPath : path.join(repoRoot, inPath);
const absOut = path.isAbsolute(outPath) ? outPath : path.join(repoRoot, outPath);

const users = JSON.parse(fs.readFileSync(absIn, 'utf8'));
if (!Array.isArray(users) || users.length === 0) {
  console.error(`Invalid lease file (expected non-empty array): ${absIn}`);
  process.exit(1);
}
if (index < 0 || index >= users.length) {
  console.error(`userIndex ${index} out of range (0..${users.length - 1})`);
  process.exit(1);
}

const row = users[index];
if (!row || !String(row.email || '').trim() || String(row.password ?? '') === '') {
  console.error(`User at index ${index} missing email/password`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, JSON.stringify([row], null, 2), 'utf8');
console.log(`wrote pool slice [1] → ${absOut} (${row.email})`);
