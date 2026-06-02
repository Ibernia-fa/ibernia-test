import encoding from 'k6/encoding';

function b64UrlToUtf8(segment) {
  if (!segment || typeof segment !== 'string') return '';
  const s = segment.trim();
  try {
    return encoding.b64decode(s, 'rawurl', 's');
  } catch {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return encoding.b64decode(b64, 'std', 's');
  }
}

/** Read JWT payload without verifying signature. */
export function parseJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null;
  const parts = accessToken.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(b64UrlToUtf8(parts[1]));
  } catch {
    return null;
  }
}

const NAME_ID_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

/** Best-effort user id from JWT payload. */
export function subjectFromJwtClaims(claims) {
  if (!claims || typeof claims !== 'object') return null;
  const pick = (k) => {
    const v = claims[k];
    return v != null && String(v).trim() !== '' ? String(v).trim() : null;
  };
  return (
    pick('sub') ||
    pick('Sub') ||
    pick('oid') ||
    pick('Oid') ||
    pick(NAME_ID_CLAIM)
  );
}
