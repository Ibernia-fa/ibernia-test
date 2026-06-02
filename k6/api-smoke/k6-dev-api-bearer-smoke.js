/**
 * 1) client_credentials token from IDP_URL
 * 2) GET with Authorization: Bearer
 *
 * Option A — fixed path (e.g. Swagger JSON):
 *   -e API_PATH=/swagger/v1/swagger.json
 *
 * Option B — Clients by advisor (Swagger: GET /api/v1/Clients/{advisorId}/all):
 *   -e ADVISOR_ID=<guid-or-string-from-dev-data>
 *   (API_PATH is ignored when ADVISOR_ID is set)
 *
 *   k6 run -e CLIENT_ID=... -e CLIENT_SECRET=... -e SCOPE=ibernia_api ^
 *     -e IDP_URL=https://dev-identity.ibernia.it ^
 *     -e API_URL=https://dev-api.ibernia.it ^
 *     -e ADVISOR_ID=YOUR_ADVISOR_ID ^
 *     k6/api-smoke/k6-dev-api-bearer-smoke.js
 */
import http from 'k6/http';
import { check } from 'k6';

function trim(v) {
  return typeof v === 'string' ? v.trim() : v;
}

function token() {
  const idp = trim(__ENV.IDP_URL);
  const res = http.post(`${idp}/connect/token`, {
    grant_type: 'client_credentials',
    client_id: trim(__ENV.CLIENT_ID),
    client_secret: trim(__ENV.CLIENT_SECRET),
    scope: trim(__ENV.SCOPE) || 'ibernia_api',
  });
  if (res.status !== 200) {
    console.error(`Token failed: ${res.status} ${res.body}`);
    return null;
  }
  return JSON.parse(res.body).access_token;
}

export default function () {
  const t = token();
  const okToken = check(t, { 'got access_token': (x) => typeof x === 'string' && x.length > 0 });
  if (!okToken) return;

  const base = trim(__ENV.API_URL).replace(/\/$/, '');
  const advisorId = trim(__ENV.ADVISOR_ID);
  let url;
  if (advisorId) {
    url = `${base}/api/v1/Clients/${encodeURIComponent(advisorId)}/all`;
  } else {
    const path = trim(__ENV.API_PATH) || '/';
    url = path.startsWith('http')
      ? path
      : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  const res = http.get(url, {
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: 'application/json, text/plain, */*',
    },
  });

  if (res.status >= 400) {
    console.error(`API GET failed: status=${res.status} url=${url}`);
    const prev =
      typeof res.body === 'string' && res.body.length > 500
        ? `${res.body.slice(0, 500)}…`
        : res.body;
    console.error(`Body: ${prev}`);
  }

  check(res, {
    'api status < 500': (r) => r.status < 500,
  });
}
