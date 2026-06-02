import http from 'k6/http';
import encoding from 'k6/encoding';
import { validateLoadTesterClaim } from './load-tester.js';
import { observeHttp } from '../k6-http-observe.js';

export function fetchPasswordGrantToken({
  identityBase,
  clientId,
  clientSecret,
  scope,
  username,
  password,
  timeout,
}) {
  const url = `${identityBase.replace(/\/$/, '')}/connect/token`;
  const secretTrim = clientSecret && String(clientSecret).trim() !== '' ? String(clientSecret).trim() : '';
  const tokenAuth = (__ENV.SIGNUP_ROPC_TOKEN_AUTH || 'post').trim().toLowerCase();

  if (tokenAuth === 'basic' && secretTrim && clientId) {
    const basic = encoding.b64encode(`${clientId}:${secretTrim}`);
    const body = [
      'grant_type=password',
      `username=${encodeURIComponent(username)}`,
      `password=${encodeURIComponent(password)}`,
      `scope=${encodeURIComponent(scope)}`,
    ].join('&');
    return http.post(url, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      tags: { name: 'Identity_login_ROPC' },
      timeout,
    });
  }

  const form = {
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
    scope,
  };
  if (secretTrim) {
    form.client_secret = secretTrim;
  }
  return http.post(url, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    tags: { name: 'Identity_login_ROPC' },
    timeout,
  });
}

export function acquireLoadTesterToken({
  identityBase,
  email,
  password,
  clientId,
  clientSecret,
  scope,
  timeout,
  validateOptions,
}) {
  const res = fetchPasswordGrantToken({
    identityBase,
    clientId,
    clientSecret,
    scope,
    username: email,
    password,
    timeout,
  });
  observeHttp(res, {
    endpoint: '/connect/token',
    method: 'POST',
    tagName: 'Identity_login_ROPC',
  });
  if (res.status !== 200) {
    return {
      ok: false,
      accessToken: null,
      validation: { ok: false, reason: 'ropc_http_not_200', claims: null },
      httpStatus: res.status,
    };
  }
  let j;
  try {
    j = res.json();
  } catch {
    return {
      ok: false,
      accessToken: null,
      validation: { ok: false, reason: 'ropc_body_not_json', claims: null },
      httpStatus: res.status,
    };
  }
  const at = j && (j.access_token || j.accessToken);
  if (!at || typeof at !== 'string') {
    return {
      ok: false,
      accessToken: null,
      validation: { ok: false, reason: 'no_access_token', claims: null },
      httpStatus: res.status,
    };
  }
  const validation = validateLoadTesterClaim(at, validateOptions || { strict: true });
  const idTok = j && (j.id_token || j.idToken);
  return {
    ok: validation.ok,
    accessToken: at,
    idToken: idTok && typeof idTok === 'string' ? idTok : null,
    validation,
    httpStatus: res.status,
  };
}
