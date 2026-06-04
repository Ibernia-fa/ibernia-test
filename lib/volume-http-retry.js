/**
 * k6 path helpers (Node-testable).
 */

/** Normalize absolute filesystem paths to repo-relative `config/...` for k6 open(). */
export function normalizeVolumeConfigOpenPath(preferred) {
  const p = String(preferred || '').trim().replace(/\\/g, '/');
  if (!p) return p;
  const configIdx = p.toLowerCase().lastIndexOf('/config/');
  if (configIdx >= 0) return p.slice(configIdx + 1);
  return p;
}
