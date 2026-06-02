/**
 * Canonical domain / module run and report order for consolidated performance.
 * Matches folder sequence: clients → clients-profile → timeline → income → finances → reports → wealth.
 */

/** Module tags in run/report order (timeline sub-modules follow timeline folder scripts). */
export const MODULE_RUN_ORDER = [
  'clients',
  'clients-profile',
  'timeline',
  'timeline-financing',
  'events-default',
  'events-custom',
  'events-post',
  'events-goals-read',
  'income',
  'finances',
  'reports',
  'wealth',
  'auth',
  'cashflows',
];

const moduleRank = new Map(MODULE_RUN_ORDER.map((m, i) => [m, i]));

/**
 * @param {string} module
 * @returns {number}
 */
export function moduleOrderRank(module) {
  const m = String(module || '').toLowerCase();
  if (moduleRank.has(m)) return moduleRank.get(m);
  if (m.startsWith('events-')) {
    const tail = m.slice('events-'.length);
    const idx = MODULE_RUN_ORDER.indexOf(`events-${tail}`);
    if (idx >= 0) return idx;
    return moduleRank.get('events-custom') ?? 99;
  }
  return MODULE_RUN_ORDER.length + 1;
}

/**
 * @param {object} a
 * @param {object} b
 */
export function compareApisByModuleOrder(a, b) {
  const ra = moduleOrderRank(a.module);
  const rb = moduleOrderRank(b.module);
  if (ra !== rb) return ra - rb;
  const ep = String(a.endpoint || '').localeCompare(String(b.endpoint || ''));
  if (ep !== 0) return ep;
  return String(a.method || '').localeCompare(String(b.method || ''));
}

/**
 * @param {string[]} modules
 * @returns {string[]}
 */
export function sortModules(modules) {
  return [...new Set(modules.filter(Boolean))].sort(
    (a, b) => moduleOrderRank(a) - moduleOrderRank(b),
  );
}

/** PowerShell / runner domain folders in execution order. */
export const DOMAIN_RUN_ORDER = [
  { module: 'clients', path: 'k6/clients' },
  { module: 'clients-profile', path: 'k6/clients-profile' },
  { module: 'timeline', path: 'k6/cashflows-timeline' },
  { module: 'income', path: 'k6/cashflows-income' },
  { module: 'finances', path: 'k6/cashflows-finances' },
  { module: 'reports', path: 'k6/cashflows-reports' },
  { module: 'wealth', path: 'k6/cashflows-wealth' },
];
