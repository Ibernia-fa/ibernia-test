import https from 'https';

const secret =
  process.env.STS_SECRET ||
  'secret_cb99badd81dfecb88c6390d16839739f5c356e075210004e9cea67606d99776e';

function req(method, url, headers, postBody) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { method, hostname: u.hostname, path: u.pathname + u.search, headers };
    const r = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (postBody) r.write(postBody);
    r.end();
  });
}

function summarizeJson(body) {
  try {
    const j = JSON.parse(body);
    if (Array.isArray(j)) return `array len=${j.length}`;
    if (!j || typeof j !== 'object') return String(j).slice(0, 120);
    let s = `keys=${Object.keys(j).slice(0, 12).join(',')}`;
    for (const k of ['incomes', 'expenses', 'contributions', 'withdrawals', 'assets', 'liabilities', 'events']) {
      if (j[k] != null) s += ` ${k}=${Array.isArray(j[k]) ? j[k].length : 'obj'}`;
    }
    return s;
  } catch {
    return body.slice(0, 200);
  }
}

const tokenBody = new URLSearchParams({
  grant_type: 'password',
  client_id: 'k6-load-test-client',
  client_secret: secret,
  username: 'User01@gmail.com',
  password: 'User@01!',
  scope: 'openid profile email roles ibernia_api',
}).toString();

const tok = await req(
  'POST',
  'https://dev-identity.ibernia.it/connect/token',
  { 'Content-Type': 'application/x-www-form-urlencoded' },
  tokenBody,
);
if (tok.status !== 200) {
  console.log('token fail', tok.status, tok.body.slice(0, 300));
  process.exit(1);
}

const access = JSON.parse(tok.body).access_token;
const hdrs = { Authorization: `Bearer ${access}`, Accept: 'application/json' };
const base = 'https://dev-api.ibernia.it';
const newCf = '6a1ecd49221185e8396cdb8b';
const oldCf = '6a1eaaf0221185e8396afa49';

for (const [label, cf] of [
  ['NEW v2 plan', newCf],
  ['OLD 1505 plan', oldCf],
]) {
  console.log(`\n=== ${label} (${cf}) ===`);
  for (const [name, path] of [
    ['timelines', `/api/v1/cashflows/${cf}/timelines`],
    ['financial', `/api/v1/cashflows/${cf}/financial`],
    ['funds', `/api/v1/cashflows/${cf}/funds`],
    ['wealth', `/api/v1/wealth/${cf}`],
  ]) {
    const r = await req('GET', base + path, hdrs);
    console.log(name, r.status, summarizeJson(r.body));
  }
}

const payload = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString());
const sub = payload.sub;
const list = await req('GET', `${base}/api/v1/Clients/${sub}/all`, hdrs);
if (list.status === 200) {
  const clients = JSON.parse(list.body);
  console.log(`\n=== User01 clients (${clients.length}) ===`);
  for (const c of clients.slice(-8)) {
    const id = c.id || c.Id;
    const d = c.clientDetails || c.ClientDetails || {};
    const ln = d.lastName || d.LastName || '';
    const fn = d.firstName || d.FirstName || '';
    console.log(`- ${fn} ${ln} id=${id}`);
  }
}
