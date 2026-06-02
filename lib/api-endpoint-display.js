/**
 * Resolve catalog endpoint templates to human-readable paths with real IDs.
 * Catalog keys stay as `/api/v1/Clients/{advisorId}/search`; reports show resolved paths.
 */

/**
 * @param {string} [url]
 * @returns {string|null}
 */
export function pathOnlyFromUrl(url) {
  if (!url) return null;
  try {
    const m = String(url).match(/https?:\/\/[^/]+(\/[^?#]*)/i);
    if (m) return m[1];
    const rel = String(url).trim();
    if (rel.startsWith('/api/')) return rel.split('?')[0].split('#')[0];
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {string} template
 * @param {object} hints
 * @returns {string}
 */
export function fillEndpointPlaceholders(template, hints = {}) {
  if (!template) return template || '';
  let out = String(template);
  const path = hints.path && typeof hints.path === 'object' ? hints.path : {};
  const map = Object.assign(
    {
      advisorId: hints.advisorId,
      clientId: hints.clientId,
      cashflowId: hints.cashflowId,
      id: hints.id || hints.clientId || hints.cashflowId,
      wealth: hints.wealth || hints.cashflowId,
    },
    path,
  );
  for (const [key, val] of Object.entries(map)) {
    if (val == null || String(val) === '') continue;
    const re = new RegExp(`\\{${key}\\}`, 'gi');
    out = out.replace(re, String(val));
  }
  return out;
}

/**
 * Prefer actual request URL path; else substitute path params into catalog template.
 * @param {string} catalogEndpoint
 * @param {object} [forensics] slowestRequest or slow record
 * @returns {string}
 */
export function resolveEndpointDisplay(catalogEndpoint, forensics = {}) {
  const template = catalogEndpoint || 'unknown';
  const pathFromUrl = pathOnlyFromUrl(forensics.actualUrl);
  if (pathFromUrl) return pathFromUrl;

  const rc = forensics.requestContext || {};
  const filled = fillEndpointPlaceholders(template, {
    advisorId: forensics.advisorId,
    clientId: forensics.clientId,
    cashflowId: forensics.cashflowId,
    path: rc.path,
  });
  if (filled && !/\{[a-zA-Z0-9_]+\}/.test(filled)) return filled;

  return template;
}

/**
 * @param {object} row api or summary row
 * @returns {string}
 */
export function displayEndpointCell(row) {
  if (!row) return 'unknown';
  return row.endpointDisplay || row.endpoint || 'unknown';
}
