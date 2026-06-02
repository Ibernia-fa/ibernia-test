/**
 * Canonical API catalog for consolidated baseline reporting (dev k6 modules).
 * Used to verify coverage and label modules in merged reports.
 */

/** @typedef {{ module: string, method: string, endpoint: string, script?: string }} PlatformApiEntry */

/** @type {PlatformApiEntry[]} */
export const PLATFORM_API_CATALOG = [
  // Identity (all scripts)
  { module: 'auth', method: 'POST', endpoint: '/connect/token' },

  // clients
  { module: 'clients', method: 'POST', endpoint: '/api/v1/Clients' },
  { module: 'clients', method: 'PUT', endpoint: '/api/v1/Clients' },
  { module: 'clients', method: 'DELETE', endpoint: '/api/v1/Clients/{id}' },
  { module: 'clients', method: 'GET', endpoint: '/api/v1/Clients/{id}' },
  { module: 'clients', method: 'GET', endpoint: '/api/v1/Clients/{advisorId}/all' },
  { module: 'clients', method: 'GET', endpoint: '/api/v1/Clients/{advisorId}/search' },
  { module: 'clients', method: 'GET', endpoint: '/api/v1/Clients/by-cashflow/{cashflowId}' },
  { module: 'clients', method: 'POST', endpoint: '/api/v1/cashflows' },

  // clients-profile
  { module: 'clients-profile', method: 'GET', endpoint: '/api/v1/Clients/{id}' },
  { module: 'clients-profile', method: 'PUT', endpoint: '/api/v1/Clients' },
  { module: 'clients-profile', method: 'GET', endpoint: '/api/v1/Clients/{advisorId}/all' },
  { module: 'clients-profile', method: 'GET', endpoint: '/api/v1/client/{clientId}/cashflows' },

  // cashflows shared
  { module: 'cashflows', method: 'POST', endpoint: '/api/v1/cashflows' },
  { module: 'cashflows', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}' },
  { module: 'cashflows', method: 'DELETE', endpoint: '/api/v1/cashflows/{cashflowId}' },

  // timeline
  { module: 'timeline', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/timelines' },
  { module: 'timeline-financing', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/timelines/financing' },

  // events
  { module: 'events-default', method: 'GET', endpoint: '/api/v1/Events/default' },
  { module: 'events-custom', method: 'GET', endpoint: '/api/v1/Events/custom' },
  { module: 'events-custom', method: 'POST', endpoint: '/api/v1/Events/custom' },
  { module: 'events-goals-read', method: 'GET', endpoint: '/api/v1/Events/default' },
  { module: 'events-goals-read', method: 'GET', endpoint: '/api/v1/Events/custom' },

  // income
  { module: 'income', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}' },
  { module: 'income', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/financial' },
  { module: 'income', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/income-expense/financial' },
  { module: 'income', method: 'POST', endpoint: '/api/v1/cashflows/{cashflowId}/financial/income' },
  { module: 'income', method: 'PUT', endpoint: '/api/v1/cashflows/{cashflowId}/financial/income' },
  { module: 'income', method: 'DELETE', endpoint: '/api/v1/cashflows/{cashflowId}/financial/income' },

  // finances
  { module: 'finances', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}' },
  { module: 'finances', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/financial' },
  { module: 'finances', method: 'POST', endpoint: '/api/v1/cashflows/{cashflowId}/financial/income' },
  { module: 'finances', method: 'PUT', endpoint: '/api/v1/cashflows/{cashflowId}/financial/income' },
  { module: 'finances', method: 'DELETE', endpoint: '/api/v1/cashflows/{cashflowId}/financial/income' },
  { module: 'finances', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/funds' },
  { module: 'finances', method: 'POST', endpoint: '/api/v1/cashflows/{cashflowId}/funds/contributions' },
  { module: 'finances', method: 'POST', endpoint: '/api/v1/cashflows/{cashflowId}/funds/withdrawals' },
  { module: 'finances', method: 'POST', endpoint: '/api/v1/cashflows/{cashflowId}/financial/expense' },
  { module: 'finances', method: 'PUT', endpoint: '/api/v1/cashflows/{cashflowId}/financial/expense' },
  { module: 'finances', method: 'DELETE', endpoint: '/api/v1/cashflows/{cashflowId}/financial/expense' },

  // reports
  { module: 'reports', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}' },
  { module: 'reports', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/financial' },
  { module: 'reports', method: 'GET', endpoint: '/api/v1/Reports/{cashflowId}' },
  { module: 'reports', method: 'POST', endpoint: '/api/v1/Reports/{cashflowId}' },
  { module: 'reports', method: 'POST', endpoint: '/api/v1/Reports/{cashflowId}/scenario' },

  // wealth
  { module: 'wealth', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}' },
  { module: 'wealth', method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}/financial' },
  { module: 'wealth', method: 'GET', endpoint: '/api/v1/wealth/{cashflowId}' },
  { module: 'wealth', method: 'POST', endpoint: '/api/v1/wealth/{cashflowId}/assets' },
  { module: 'wealth', method: 'PUT', endpoint: '/api/v1/wealth/{cashflowId}/assets' },
  { module: 'wealth', method: 'DELETE', endpoint: '/api/v1/wealth/{cashflowId}/assets/{assetId}' },
  { module: 'wealth', method: 'POST', endpoint: '/api/v1/wealth/{cashflowId}/liabilities' },
  { module: 'wealth', method: 'PUT', endpoint: '/api/v1/wealth/{cashflowId}/liabilities' },
  { module: 'wealth', method: 'DELETE', endpoint: '/api/v1/wealth/{cashflowId}/liabilities/{liabilityId}' },
];

/** k6 domain folders included in full baseline discovery */
export const BASELINE_DOMAIN_DIRS = [
  { module: 'clients', path: 'k6/clients' },
  { module: 'clients-profile', path: 'k6/clients-profile' },
  { module: 'finances', path: 'k6/cashflows-finances' },
  { module: 'income', path: 'k6/cashflows-income' },
  { module: 'reports', path: 'k6/cashflows-reports' },
  { module: 'timeline', path: 'k6/cashflows-timeline' },
  { module: 'wealth', path: 'k6/cashflows-wealth' },
];

/**
 * @param {string} fileName e.g. k6-events-custom-load.js
 * @param {string} defaultModule
 */
export function moduleTagFromScriptName(fileName, defaultModule) {
  const base = fileName.replace(/\.js$/i, '');
  if (base === 'k6-client-full-lifecycle') return 'clients';
  if (base.startsWith('k6-events-')) {
    const tail = base.replace(/^k6-events-/, '').replace(/-load$/, '');
    return `events-${tail}`;
  }
  if (base.includes('timelines-financing')) return 'timeline-financing';
  if (base.includes('timelines') || base.includes('timeline')) return 'timeline';
  if (base.startsWith('k6-clients-profile-')) return 'clients-profile';
  if (base.startsWith('k6-clients-')) return 'clients';
  if (base.startsWith('k6-cashflows-finances-')) return 'finances';
  if (base.startsWith('k6-cashflows-income-')) return 'income';
  if (base.startsWith('k6-cashflows-reports-')) return 'reports';
  if (base.startsWith('k6-cashflows-wealth-')) return 'wealth';
  return defaultModule;
}

export function catalogApiKey(entry) {
  return `${entry.module}\0${entry.method}\0${entry.endpoint}`;
}
