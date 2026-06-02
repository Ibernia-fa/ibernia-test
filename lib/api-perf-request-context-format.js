/**
 * Node-safe formatters for request context (merge report; no k6 imports).
 */

/**
 * @param {object|null} ctx
 */
export function formatRequestContextSummary(ctx) {
  if (!ctx || !ctx.requestContext) return '—';
  const parts = [];
  const p = ctx.requestContext.path || {};
  const q = ctx.requestContext.query || {};
  const pathKeys = Object.keys(p);
  if (pathKeys.length) parts.push(`path: ${pathKeys.map((k) => `${k}=${p[k]}`).join(', ')}`);
  const queryKeys = Object.keys(q);
  if (queryKeys.length) parts.push(`query: ${queryKeys.map((k) => `${k}=${q[k]}`).join(', ')}`);
  if (ctx.cashflowId) parts.push(`cashflowId=${ctx.cashflowId}`);
  if (ctx.clientId) parts.push(`clientId=${ctx.clientId}`);
  if (ctx.requestContext.payloadPreview) {
    const prev = String(ctx.requestContext.payloadPreview).replace(/\|/g, '/').replace(/\n/g, ' ');
    parts.push(`body: ${prev.length > 80 ? prev.slice(0, 80) + '…' : prev}`);
  }
  return parts.length ? parts.join('; ') : '—';
}
