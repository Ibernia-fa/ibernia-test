/**

 * Smoke test: client_credentials token from Duende /connect/token.

 *

 * Post (default) — credentials in form body (client_secret_post):

 *   k6 run -e CLIENT_ID=k6-load-test-client -e CLIENT_SECRET="YOUR_SECRET" -e SCOPE=ibernia_api -e IDP_URL=https://identity.ibernia.it k6/identity/k6-client-credentials-token-smoke.js

 *

 * Basic (client_secret_basic) — id/secret in Authorization, body = grant + scope only:

 *   k6 run -e TOKEN_AUTH=basic ... (same other -e vars)

 */

import encoding from 'k6/encoding';

import http from 'k6/http';

import { check } from 'k6';



function trimEnv(name) {

  const v = __ENV[name];

  return typeof v === 'string' ? v.trim() : v;

}



const CLIENT_ID = trimEnv('CLIENT_ID');

const CLIENT_SECRET = trimEnv('CLIENT_SECRET');

const SCOPE = trimEnv('SCOPE');

const IDP_URL = trimEnv('IDP_URL');

const TOKEN_AUTH = (trimEnv('TOKEN_AUTH') || 'post').toLowerCase();



export default function () {

  const url = `${IDP_URL}/connect/token`;



  if (!CLIENT_ID || !CLIENT_SECRET || !SCOPE || !IDP_URL) {

    console.error(

      'Missing env: CLIENT_ID, CLIENT_SECRET, SCOPE, and IDP_URL are required.'

    );

  }

  console.log(

    `Debug: id_len=${CLIENT_ID ? CLIENT_ID.length : 0} secret_len=${CLIENT_SECRET ? CLIENT_SECRET.length : 0} auth=${TOKEN_AUTH}`

  );



  let res;

  if (TOKEN_AUTH === 'basic') {

    const token = encoding.b64encode(`${CLIENT_ID}:${CLIENT_SECRET}`);

    const body = `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`;

    res = http.post(url, body, {

      headers: {

        'Content-Type': 'application/x-www-form-urlencoded',

        Authorization: `Basic ${token}`,

      },

    });

  } else {

    // Let k6 encode the object as application/x-www-form-urlencoded (do not set Content-Type manually).

    res = http.post(url, {

      grant_type: 'client_credentials',

      client_id: CLIENT_ID,

      client_secret: CLIENT_SECRET,

      scope: SCOPE,

    });

  }



  if (res.status !== 200) {

    const preview =

      typeof res.body === 'string' && res.body.length > 800

        ? `${res.body.slice(0, 800)}…`

        : res.body;

    console.error(`Token request failed: status=${res.status} url=${url}`);

    console.error(`Body: ${preview}`);

    if (res.error) {

      console.error(`Transport: ${res.error}`);

    }

  }



  check(res, {

    'token status 200': (r) => r.status === 200,

    'has access_token': (r) => {

      try {

        const b = JSON.parse(r.body);

        return typeof b.access_token === 'string' && b.access_token.length > 0;

      } catch {

        return false;

      }

    },

  });

}


