/**
 * Dev integration checks for GET /api/v1/Clients/{advisorId}/all isolation.
 * Exits 1 when any check fails.
 */
import { openDb } from './db.js';
import {
  DEFAULT_API_BASE,
  DEFAULT_IDENTITY_BASE,
  DEFAULT_ROPC_CLIENT_ID,
} from './config.js';
import { assertEnvironment, assertNonProdUrl } from './guards.js';

function parseJwtPayload(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
  } catch {
    return null;
  }
}

function advisorSubFromToken(token) {
  const c = parseJwtPayload(token);
  if (!c) return null;
  return (
    (c.sub != null && String(c.sub).trim()) ||
    (c.Sub != null && String(c.Sub).trim()) ||
    null
  );
}

async function ropcToken(identityBase, row, clientId, clientSecret, scope) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: row.email,
    password: row.password,
    scope,
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  const res = await fetch(`${identityBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return j.access_token ? String(j.access_token) : null;
}

function clientAdvisorId(row) {
  const fa = row && (row.FinancialAdvisor || row.financialAdvisor);
  if (!fa) return '';
  const id = fa.AdvisorId != null ? fa.AdvisorId : fa.advisorId;
  return id != null ? String(id).trim() : '';
}

function clientRowId(row) {
  const id = row && (row.Id != null ? row.Id : row.id);
  return id != null ? String(id).trim() : '';
}

function clientLastName(row) {
  const d = row && (row.clientDetails || row.ClientDetails);
  if (!d) return '';
  const ln = d.lastName != null ? d.lastName : d.LastName;
  return ln != null ? String(ln) : '';
}

async function fetchJson(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  return { res, text, json };
}

function buildClientBody(advisorSub, needle) {
  return {
    ClientDetails: {
      FirstName: 'Isol',
      LastName: `SecTest-${needle}`,
      BirthDate: '1985-06-15T00:00:00.000Z',
      PreferredCurrency: 'EUR',
      Country: 'IT',
      InflationRate: 2.5,
      Email: `isol.${needle}@example.com`,
      Phone: '+39000000000',
    },
    PartnerDetail: null,
    FinancialAdvisor: {
      AdvisorId: advisorSub,
      AdvisorName: 'pool-cli isolation',
    },
    LastUpdated: new Date().toISOString(),
    Notes: `pool-cli isolation ${needle}`,
  };
}

function pickUser(db, env, email) {
  if (email) {
    return db
      .prepare(
        `SELECT email, password FROM users WHERE environment = ? AND active = 1 AND email = ? COLLATE NOCASE`,
      )
      .get(env, email);
  }
  return db
    .prepare(
      `SELECT email, password FROM users WHERE environment = ? AND active = 1 ORDER BY email LIMIT 1`,
    )
    .get(env);
}

function pickSecondUser(db, env, excludeEmail) {
  return db
    .prepare(
      `SELECT email, password FROM users WHERE environment = ? AND active = 1 AND email != ? COLLATE NOCASE ORDER BY email LIMIT 1`,
    )
    .get(env, excludeEmail);
}

export async function cmdVerifyAdvisorClientsIsolation(args) {
  assertEnvironment(args.env, args.allowNonDev);
  const identityBase = (args.identityBase || process.env.IDENTITY_BASE || DEFAULT_IDENTITY_BASE).replace(
    /\/$/,
    '',
  );
  const apiBase = (args.apiBase || process.env.BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');
  assertNonProdUrl(identityBase, 'identity-base', args.allowNonDev);
  assertNonProdUrl(apiBase, 'api-base', args.allowNonDev);

  const ropcClientId =
    args.clientId || process.env.SIGNUP_ROPC_CLIENT_ID || DEFAULT_ROPC_CLIENT_ID;
  const clientSecret =
    args.clientSecret || process.env.SIGNUP_ROPC_CLIENT_SECRET || process.env.STS_SECRET || '';
  const scope =
    args.scope || process.env.SIGNUP_ROPC_SCOPE || 'openid profile email roles ibernia_api';
  if (!clientSecret) {
    throw new Error('Set SIGNUP_ROPC_CLIENT_SECRET or STS_SECRET for ROPC.');
  }

  const db = openDb(args.env);
  const rowA = pickUser(db, args.env, args.emailA);
  const rowB = args.emailB
    ? pickUser(db, args.env, args.emailB)
    : pickSecondUser(db, args.env, rowA?.email);
  db.close();

  if (!rowA || !rowB) {
    const hints = [];
    if (args.emailA && !rowA) hints.push(`--email-a "${args.emailA}" not in pool (use full address, e.g. User01@gmail.com)`);
    if (args.emailB && !rowB) hints.push(`--email-b "${args.emailB}" not in pool`);
    if (!args.emailA && !args.emailB) hints.push('pool has no active users for this env');
    throw new Error(
      `Need two pool users. ${hints.join('; ') || 'set --email-a / --email-b or omit for first two in pool.'}`,
    );
  }

  const tokenA = await ropcToken(identityBase, rowA, ropcClientId, clientSecret, scope);
  const tokenB = await ropcToken(identityBase, rowB, ropcClientId, clientSecret, scope);
  const subA = advisorSubFromToken(tokenA);
  const subB = advisorSubFromToken(tokenB);
  if (!tokenA || !tokenB || !subA || !subB) {
    throw new Error('ROPC or JWT sub missing for advisor A or B.');
  }

  const needle = `isol${Date.now()}`;
  const failures = [];

  const headers = (token) => ({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  const listUrl = (sub) => `${apiBase}/api/v1/Clients/${encodeURIComponent(sub)}/all`;

  // Test 1: Advisor A — own clients list
  const ownA = await fetchJson(listUrl(subA), { headers: headers(tokenA) });
  if (ownA.res.status !== 200 && ownA.res.status !== 204) {
    failures.push(`Test1: own list HTTP ${ownA.res.status} (expected 200/204)`);
  }

  // Test 2 & marker: create client on B, A calls B route
  const createB = await fetchJson(`${apiBase}/api/v1/Clients`, {
    method: 'POST',
    headers: headers(tokenB),
    body: JSON.stringify(buildClientBody(subB, needle)),
  });
  let markerBId = null;
  if (createB.res.status !== 200 && createB.res.status !== 201) {
    failures.push(`Test2 setup: create B client HTTP ${createB.res.status}`);
  } else if (createB.json) {
    markerBId = clientRowId(createB.json);
  }

  const cross = await fetchJson(listUrl(subB), { headers: headers(tokenA) });
  const crossList = Array.isArray(cross.json) ? cross.json : [];
  const crossBlocked = cross.res.status === 403;
  const crossHasMarker =
    markerBId && crossList.some((r) => clientRowId(r) === markerBId);
  if (cross.res.status !== 403) {
    failures.push(
      `Test2: expected 403 Forbidden for cross-advisor GET …/all, got HTTP ${cross.res.status}`,
    );
  }
  if (crossHasMarker) {
    failures.push(
      `Test2: IDOR — Advisor A response included B's marker client (HTTP ${cross.res.status})`,
    );
  }

  const crossSearch = await fetchJson(
    `${apiBase}/api/v1/Clients/${encodeURIComponent(subB)}/search?searchTerm=SecTest`,
    { headers: headers(tokenA) },
  );
  if (crossSearch.res.status !== 403) {
    failures.push(
      `Test3 search: expected 403 for cross-advisor search, got HTTP ${crossSearch.res.status}`,
    );
  }

  // Test 4: mixed isolation on A's own route
  const ownList = Array.isArray(ownA.json) ? ownA.json : [];
  for (const row of ownList) {
    const aid = clientAdvisorId(row);
    if (aid && aid !== subA) {
      failures.push(`Test4 mixed: own list contains client for advisor ${aid} (caller ${subA})`);
      break;
    }
  }

  // Test 5: deleted client excluded for A
  const createA = await fetchJson(`${apiBase}/api/v1/Clients`, {
    method: 'POST',
    headers: headers(tokenA),
    body: JSON.stringify(buildClientBody(subA, `${needle}del`)),
  });
  let deletedId = null;
  if (createA.res.status !== 200 && createA.res.status !== 201) {
    failures.push(`Test5 setup: create A client HTTP ${createA.res.status}`);
  } else if (createA.json) {
    deletedId = clientRowId(createA.json);
    const del = await fetch(`${apiBase}/api/v1/Clients/${encodeURIComponent(deletedId)}`, {
      method: 'DELETE',
      headers: headers(tokenA),
    });
    if (!del.ok) failures.push(`Test5 setup: delete HTTP ${del.status}`);
    const after = await fetchJson(listUrl(subA), { headers: headers(tokenA) });
    const afterList = Array.isArray(after.json) ? after.json : [];
    if (deletedId && afterList.some((r) => clientRowId(r) === deletedId)) {
      failures.push(`Test5: deleted client ${deletedId} still in GET …/all`);
    }
  }

  if (markerBId) {
    await fetch(`${apiBase}/api/v1/Clients/${encodeURIComponent(markerBId)}`, {
      method: 'DELETE',
      headers: headers(tokenB),
    });
  }

  console.log('\nverify-advisor-clients-isolation');
  console.log(`  A: ${rowA.email} sub=${subA}`);
  console.log(`  B: ${rowB.email} sub=${subB}`);
  console.log(`  cross-advisor list HTTP: ${cross.res.status} clients=${crossList.length}`);
  console.log(`  cross-advisor search HTTP: ${crossSearch.res.status}`);
  if (markerBId) console.log(`  B marker id: ${markerBId} lastName contains ${needle}`);

  if (failures.length) {
    console.error('\nFAILED:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nAll isolation checks passed.\n');
}
