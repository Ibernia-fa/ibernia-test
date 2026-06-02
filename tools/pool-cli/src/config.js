import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../..');

export const DEFAULT_IDENTITY_BASE = 'https://dev-identity.ibernia.it';
export const DEFAULT_API_BASE = 'https://dev-api.ibernia.it';
export const DEFAULT_ROPC_CLIENT_ID = 'k6-load-test-client';

export const ALLOWED_ENVS = new Set(['dev', 'qa', 'staging']);

export function dbPathForEnv(env) {
  return path.join(REPO_ROOT, 'data', 'user-pool', env, 'pool.db');
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--env') args.env = argv[++i];
    else if (a === '--count') args.count = parseInt(argv[++i], 10);
    else if (a === '--run-id') args.runId = argv[++i];
    else if (a === '--ttl') args.ttl = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--identity-base') args.identityBase = argv[++i];
    else if (a === '--api-base') args.apiBase = argv[++i];
    else if (a === '--allow-non-dev') args.allowNonDev = true;
    else if (a === '--max-age-days') args.maxAgeDays = parseInt(argv[++i], 10);
    else if (a === '--clear-expired-leases') args.clearExpiredLeases = true;
    else if (a === '--sample' || a === '--limit') args.sample = parseInt(argv[++i], 10);
    else if (a === '--email') {
      if (!args.emails) args.emails = [];
      for (const part of String(argv[++i]).split(',')) {
        const e = part.trim();
        if (e) args.emails.push(e);
      }
    }     else if (a === '--email-glob') args.emailGlob = argv[++i];
    else if (a === '--email-a') args.emailA = argv[++i];
    else if (a === '--email-b') args.emailB = argv[++i];
    else if (a === '--user-num-min') args.userNumMin = parseInt(argv[++i], 10);
    else if (a === '--user-num-max') args.userNumMax = parseInt(argv[++i], 10);
    else if (a === '--order') args.order = argv[++i];
    else if (a === '--verified-only') args.verifiedOnly = true;
    else if (a === '--warn-above') args.warnAbove = parseInt(argv[++i], 10);
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--yes') args.yes = true;
    else if (a === '--client-id') args.clientId = argv[++i];
    else if (a === '--client-secret') args.clientSecret = argv[++i];
    else if (a === '--scope') args.scope = argv[++i];
    else if (a.startsWith('-')) throw new Error(`Unknown option: ${a}`);
    else args._.push(a);
  }
  args.env = (args.env || 'dev').toLowerCase();
  return args;
}

export function ttlToMs(ttl) {
  const s = String(ttl || '2h').trim();
  const m = s.match(/^(\d+)([smhd])$/i);
  if (!m) throw new Error(`Invalid --ttl "${ttl}" (use e.g. 2h, 30m, 3600s)`);
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u === 's') return n * 1000;
  if (u === 'm') return n * 60 * 1000;
  if (u === 'h') return n * 60 * 60 * 1000;
  if (u === 'd') return n * 24 * 60 * 60 * 1000;
  throw new Error(`Invalid --ttl unit: ${u}`);
}
