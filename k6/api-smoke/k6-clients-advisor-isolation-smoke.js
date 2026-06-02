/**
 * Security smoke: Advisor A must not read Advisor B's client list via route spoofing.
 *
 * GET /api/v1/Clients/{advisorId}/all with Advisor A token and Advisor B id in the path
 * must return 403/404 or a body that does not include a marker client created for B.
 *
 * ```powershell
 * cd C:\Users\gulle\source\repos\load-testing-k6
 * k6 run --vus 1 --iterations 1 k6/api-smoke/k6-clients-advisor-isolation-smoke.js `
 *   -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client `
 *   -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" `
 *   -e ADVISOR_A_EMAIL=User01@... `
 *   -e ADVISOR_A_PASSWORD=... `
 *   -e ADVISOR_B_EMAIL=User02@... `
 *   -e ADVISOR_B_PASSWORD=...
 * ```
 */
import http from 'k6/http';
import { check } from 'k6';
import {
  buildClientModel,
  parseClientCreateResponse,
  parseJwtPayload,
  subjectFromJwtClaims,
  fetchPasswordGrantToken,
} from '../../lib/k6-client-lifecycle.js';

function trim(v) {
  return typeof v === 'string' ? v.trim() : v;
}

const IDENTITY_BASE = trim(__ENV.IDENTITY_BASE || 'https://dev-identity.ibernia.it').replace(/\/$/, '');
const API_BASE = trim(__ENV.BASE_URL || 'https://dev-api.ibernia.it').replace(/\/$/, '');
const HTTP_TIMEOUT = trim(__ENV.HTTP_TIMEOUT || '60s');
const CLIENT_ID = trim(__ENV.SIGNUP_ROPC_CLIENT_ID);
const CLIENT_SECRET = trim(__ENV.SIGNUP_ROPC_CLIENT_SECRET || __ENV.STS_SECRET || '');
const SCOPE =
  trim(__ENV.SIGNUP_ROPC_SCOPE) || 'openid profile email roles ibernia_api';

function login(email, password) {
  const res = fetchPasswordGrantToken({
    identityBase: IDENTITY_BASE,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    scope: SCOPE,
    username: email,
    password,
    timeout: HTTP_TIMEOUT,
  });
  if (res.status !== 200) {
    console.error(`ROPC failed for ${email}: HTTP ${res.status} ${res.body}`);
    return null;
  }
  const token = JSON.parse(res.body).access_token;
  const sub = subjectFromJwtClaims(parseJwtPayload(token));
  return { token, sub };
}

function apiHeaders(bearer) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${bearer}`,
  };
}

function listAll(advisorSub, token) {
  return http.get(
    `${API_BASE}/api/v1/Clients/${encodeURIComponent(advisorSub)}/all`,
    { headers: apiHeaders(token), timeout: HTTP_TIMEOUT, tags: { name: 'Clients_advisor_all' } },
  );
}

function clientAdvisorId(row) {
  const fa = row && (row.FinancialAdvisor || row.financialAdvisor);
  if (!fa) return '';
  const id = fa.AdvisorId != null ? fa.AdvisorId : fa.advisorId;
  return id != null ? String(id).trim() : '';
}

function parseList(res) {
  if (res.status !== 200) return [];
  try {
    const arr = res.json();
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function containsClientId(list, id) {
  if (!id) return false;
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    const cid = row && (row.Id != null ? row.Id : row.id);
    if (cid != null && String(cid) === String(id)) return true;
  }
  return false;
}

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1'],
  },
};

export default function () {
  const emailA = trim(__ENV.ADVISOR_A_EMAIL);
  const passA = trim(__ENV.ADVISOR_A_PASSWORD);
  const emailB = trim(__ENV.ADVISOR_B_EMAIL);
  const passB = trim(__ENV.ADVISOR_B_PASSWORD);

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Set SIGNUP_ROPC_CLIENT_ID and SIGNUP_ROPC_CLIENT_SECRET (or STS_SECRET).');
  }
  if (!emailA || !passA || !emailB || !passB) {
    throw new Error('Set ADVISOR_A_EMAIL/PASSWORD and ADVISOR_B_EMAIL/PASSWORD.');
  }

  const authA = login(emailA, passA);
  const authB = login(emailB, passB);
  check(null, {
    'advisor A login': () => authA && authA.token && authA.sub,
    'advisor B login': () => authB && authB.token && authB.sub,
  });
  if (!authA?.token || !authB?.token || !authA.sub || !authB.sub) return;

  const tag = `isol${Date.now()}`;
  const markerBody = buildClientModel({
    advisorSub: authB.sub,
    advisorName: 'k6 isolation B',
    uniqueTag: tag,
    withPartner: false,
    clientFirstName: 'Isol',
    clientLastNameBase: 'SecTest',
    clientEmail: `isol.b.${tag}@example.com`,
  });

  const createRes = http.post(`${API_BASE}/api/v1/Clients`, JSON.stringify(markerBody), {
    headers: apiHeaders(authB.token),
    timeout: HTTP_TIMEOUT,
    tags: { name: 'Clients_create_marker' },
  });
  const markerId = parseClientCreateResponse(createRes);
  check(createRes, { 'marker client created for B': () => !!markerId });

  const crossRes = listAll(authB.sub, authA.token);
  const crossList = parseList(crossRes);
  check(crossRes, {
    'cross-advisor list returns 403 Forbidden': (r) => r.status === 403,
    'cross-advisor list has no B marker in body': () => !containsClientId(crossList, markerId),
  });

  const crossSearchUrl = `${API_BASE}/api/v1/Clients/${encodeURIComponent(authB.sub)}/search?searchTerm=SecTest`;
  const crossSearchRes = http.get(crossSearchUrl, {
    headers: apiHeaders(authA.token),
    timeout: HTTP_TIMEOUT,
    tags: { name: 'Clients_advisor_search_cross' },
  });
  check(crossSearchRes, {
    'cross-advisor search returns 403 Forbidden': (r) => r.status === 403,
  });

  const ownRes = listAll(authA.sub, authA.token);
  const ownList = parseList(ownRes);
  const ownOk = ownRes.status === 200 || ownRes.status === 204;
  let onlyOwnAdvisor = true;
  for (let i = 0; i < ownList.length; i++) {
    const aid = clientAdvisorId(ownList[i]);
    if (aid && aid !== authA.sub) {
      onlyOwnAdvisor = false;
      break;
    }
  }
  check(ownRes, {
    'own list succeeds': () => ownOk,
    'own list has no other advisor clients': () => onlyOwnAdvisor,
  });

  if (markerId) {
    http.del(`${API_BASE}/api/v1/Clients/${encodeURIComponent(markerId)}`, null, {
      headers: apiHeaders(authB.token),
      timeout: HTTP_TIMEOUT,
      tags: { name: 'Clients_delete_marker' },
    });
  }

  console.log(
    `isolation-smoke: A=${emailA} sub=${authA.sub} B=${emailB} sub=${authB.sub} crossStatus=${crossRes.status} crossCount=${crossList.length}`,
  );
}
