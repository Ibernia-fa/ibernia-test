#!/usr/bin/env node
import { parseArgs } from '../src/config.js';
import { cmdImportJson } from '../src/import-json.js';
import { cmdLease } from '../src/lease.js';
import { cmdRelease } from '../src/release.js';
import { cmdExportJson } from '../src/export-json.js';
import { cmdStats } from '../src/stats.js';
import { cmdGc } from '../src/gc.js';
import { cmdVerifyRopc } from '../src/verify-ropc.js';
import { cmdDeactivate } from '../src/deactivate.js';
import { cmdPurge } from '../src/purge.js';
import { cmdPurgeK6Events } from '../src/purge-k6-events.js';
import { cmdAuditAdvisorClients } from '../src/audit-advisor-clients.js';
import { cmdVerifyAdvisorClientsIsolation } from '../src/verify-advisor-clients-isolation.js';

const USAGE = `pool-cli — Ibernia load-test user pool (non-production)

Commands:
  import-json <file>   Upsert users from lifecycle JSON
  lease                Lease N users (--count, --run-id, --user-num-min, --user-num-max, --order user-number)
  release              Release lease (--run-id)
  deactivate           Set active=0 (--email-glob and/or --email)
  purge                Delete all users for env (requires --yes)
  purge-k6-events      DELETE custom Events whose name looks like k6 load-test data
  export-json          Export pool to JSON (--out)
  stats                Print pool statistics
  gc                   Clear expired leases; optional --max-age-days
  verify-ropc          ROPC + load_tester check (--sample|--limit, --email, --email-glob)
  audit-advisor-clients  GET /Clients/{advisorId}/all per pool user (counts, k6-like estimate, --out)
  verify-advisor-clients-isolation  IDOR checks for GET /Clients/{advisorId}/all (exits 1 on failure)

Global options:
  --env dev|qa|staging   (default: dev)
  --allow-non-dev        Skip hostname guards
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(USAGE);
    process.exit(cmd ? 0 : 1);
  }

  switch (cmd) {
    case 'import-json':
      cmdImportJson(args);
      break;
    case 'lease':
      cmdLease(args);
      break;
    case 'release':
      cmdRelease(args);
      break;
    case 'deactivate':
      cmdDeactivate(args);
      break;
    case 'purge':
      cmdPurge(args);
      break;
    case 'purge-k6-events':
      await cmdPurgeK6Events(args);
      break;
    case 'export-json':
      cmdExportJson(args);
      break;
    case 'stats':
      cmdStats(args);
      break;
    case 'gc':
      cmdGc(args);
      break;
    case 'verify-ropc':
      await cmdVerifyRopc(args);
      break;
    case 'audit-advisor-clients':
      await cmdAuditAdvisorClients(args);
      break;
    case 'verify-advisor-clients-isolation':
      await cmdVerifyAdvisorClientsIsolation(args);
      break;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
