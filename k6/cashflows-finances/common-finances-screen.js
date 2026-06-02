/**
 * Shared helpers for **`/cashflows/{cashflowId}/finances`** (Money / financial overview).
 *
 * **Backend (FinancialsController):**
 * - **GET** `/api/v1/cashflows/{cashflowId}` — cashflow shell
 * - **GET** `/api/v1/cashflows/{cashflowId}/financial` — full financial record (incomes + expenses)
 * - **POST/PUT/DELETE** `/api/v1/cashflows/{cashflowId}/financial/income`
 * - **POST/PUT/DELETE** `/api/v1/cashflows/{cashflowId}/financial/expense`
 * - **GET** `/api/v1/cashflows/{cashflowId}/funds` — contributions & withdrawals record
 * - **POST/PUT/DELETE** `/api/v1/cashflows/{cashflowId}/funds/contributions`
 * - **POST/PUT/DELETE** `/api/v1/cashflows/{cashflowId}/funds/withdrawals`
 */
import http from 'k6/http';
import { sleep } from 'k6';
import { HTTP_TIMEOUT, buildMinimalIncomeLineItem } from '../cashflows-income/common-income-screen.js';

const DEFAULT_RESOLVE_ATTEMPTS = Math.max(
  1,
  parseInt((__ENV.INCOME_LINE_RESOLVE_MAX_ATTEMPTS || '10').trim(), 10) || 10,
);

/** Same DTO as income; used for **expense** POST/PUT/DELETE bodies. */
export function buildMinimalExpenseLineItem(p) {
  return buildMinimalIncomeLineItem(p);
}

export function findLastExpenseRowById(res, expenseId) {
  if (res.status !== 200 || expenseId == null || String(expenseId).trim() === '') return null;
  const want = String(expenseId).trim();
  try {
    const j = res.json();
    const expenses = j && (j.expenses != null ? j.expenses : j.Expenses);
    if (!Array.isArray(expenses)) return null;
    for (let i = expenses.length - 1; i >= 0; i--) {
      const row = expenses[i];
      const rid = row && (row.id != null ? row.id : row.Id);
      if (rid != null && String(rid).trim() === want) {
        try {
          return JSON.parse(JSON.stringify(row));
        } catch {
          return Object.assign({}, row);
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function findLastExpenseRowMatchingAnySubstring(res, matchers) {
  if (res.status !== 200) return null;
  const ms = (matchers || []).filter((x) => x != null && String(x).trim() !== '');
  if (ms.length === 0) return null;
  try {
    const j = res.json();
    const expenses = j && (j.expenses != null ? j.expenses : j.Expenses);
    if (!Array.isArray(expenses)) return null;
    for (let mi = 0; mi < ms.length; mi++) {
      const sub = String(ms[mi]);
      for (let i = expenses.length - 1; i >= 0; i--) {
        const row = expenses[i];
        const d = row && (row.description != null ? row.description : row.Description);
        const id = row && (row.id != null ? row.id : row.Id);
        if (id == null || !String(id).trim()) continue;
        if (d == null) continue;
        const ds = String(d);
        if (ds.includes(sub)) {
          try {
            return JSON.parse(JSON.stringify(row));
          } catch {
            return Object.assign({}, row);
          }
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function parseLastExpenseMatchingAnySubstring(res, matchers) {
  const full = findLastExpenseRowMatchingAnySubstring(res, matchers);
  if (!full) return null;
  const d = full.description != null ? full.description : full.Description;
  const id = full.id != null ? full.id : full.Id;
  if (id == null || d == null) return null;
  return { id: String(id).trim(), description: String(d) };
}

/**
 * After **POST** expense, resolve line from **POST** body and/or **GET …/financial** (full record).
 */
export function resolveExpenseLineAfterPost(p) {
  const {
    postRes,
    base,
    hdrs,
    cashflowId,
    needle,
    stablePrefix,
    maxAttempts = DEFAULT_RESOLVE_ATTEMPTS,
    tagName = 'cf_finances_resolve_exp_get',
    vuTag = '',
  } = p;
  const matchers = [];
  if (needle && String(needle).trim()) matchers.push(String(needle).trim());
  if (stablePrefix && String(stablePrefix).trim() && String(stablePrefix).trim() !== String(needle).trim()) {
    matchers.push(String(stablePrefix).trim());
  }

  function packFromRes(res) {
    if (res.status !== 200) return null;
    let fullRow = findLastExpenseRowMatchingAnySubstring(res, matchers);
    const summary = parseLastExpenseMatchingAnySubstring(res, matchers);
    if (summary && !fullRow) {
      fullRow = findLastExpenseRowById(res, summary.id);
    }
    if (summary) {
      return { id: summary.id, description: summary.description, fullRow: fullRow || null };
    }
    try {
      const j = res.json();
      const rid = j && (j.id != null ? j.id : j.expenseId != null ? j.expenseId : j.Id);
      const sid = rid != null ? String(rid).trim() : '';
      if (sid) {
        const byId = findLastExpenseRowById(res, sid);
        const d0 = byId ? (byId.description != null ? byId.description : byId.Description) : null;
        const nd = matchers[0] || matchers[1] || '';
        return {
          id: sid,
          description: d0 != null ? String(d0) : String(nd || ''),
          fullRow: byId || null,
        };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  const fromPost = packFromRes(postRes);
  if (fromPost) return fromPost;

  const getUrl = `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial`;
  for (let a = 0; a < maxAttempts; a++) {
    sleep(0.04 + a * 0.035);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: tagName, vu: vuTag },
      timeout: HTTP_TIMEOUT,
    });
    const packed = packFromRes(g);
    if (packed) return packed;
  }
  return null;
}

export function financialGetUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial`;
}

export function fundsGetUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/funds`;
}

export function contributionsPostUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/funds/contributions`;
}

export function withdrawalsPostUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/funds/withdrawals`;
}

/**
 * Minimal **FundTransactionLineItem** for POST/PUT/DELETE on funds contributions/withdrawals.
 */
export function buildMinimalFundTransactionLineItem(p) {
  const desc = p.description;
  const amountVal = p.amount != null ? p.amount : 500;
  const startAge = p.startAge != null ? p.startAge : 30;
  const startYear = p.startYear != null ? p.startYear : new Date().getFullYear();
  const endAge = p.endAge != null ? p.endAge : 65;
  const endYear = p.endYear != null ? p.endYear : startYear + 35;
  const line = {
    description: desc,
    amount: { amount: amountVal, currencySymbol: '€' },
    start: { age: startAge, year: startYear },
    end: { age: endAge, year: endYear },
    contributionType: p.contributionType != null ? p.contributionType : 1,
  };
  if (p.id != null && String(p.id).trim() !== '') {
    line.id = String(p.id).trim();
  }
  if (p.associatedSavingPotId != null && String(p.associatedSavingPotId).trim() !== '') {
    line.associatedSavingPotId = String(p.associatedSavingPotId).trim();
  }
  return line;
}

function fundRowsFromGet(res, arrayKey) {
  if (res.status !== 200) return [];
  try {
    const j = res.json();
    const rows = j && (j[arrayKey] != null ? j[arrayKey] : j[arrayKey[0].toUpperCase() + arrayKey.slice(1)]);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function findLastFundRowMatchingAnySubstring(res, arrayKey, matchers) {
  if (res.status !== 200) return null;
  const ms = (matchers || []).filter((x) => x != null && String(x).trim() !== '');
  if (ms.length === 0) return null;
  const rows = fundRowsFromGet(res, arrayKey);
  for (let mi = 0; mi < ms.length; mi++) {
    const sub = String(ms[mi]);
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      const d = row && (row.description != null ? row.description : row.Description);
      const id = row && (row.id != null ? row.id : row.Id);
      if (id == null || !String(id).trim()) continue;
      if (d == null) continue;
      if (String(d).includes(sub)) {
        try {
          return JSON.parse(JSON.stringify(row));
        } catch {
          return Object.assign({}, row);
        }
      }
    }
  }
  return null;
}

function resolveFundLineAfterPost(p) {
  const {
    postRes,
    base,
    hdrs,
    cashflowId,
    arrayKey,
    needle,
    stablePrefix,
    maxAttempts = DEFAULT_RESOLVE_ATTEMPTS,
    tagName = 'cf_finances_resolve_fund_get',
    vuTag = '',
  } = p;
  const matchers = [];
  if (needle && String(needle).trim()) matchers.push(String(needle).trim());
  if (stablePrefix && String(stablePrefix).trim() && String(stablePrefix).trim() !== String(needle).trim()) {
    matchers.push(String(stablePrefix).trim());
  }

  function packFromRes(res) {
    const fullRow = findLastFundRowMatchingAnySubstring(res, arrayKey, matchers);
    if (fullRow) {
      const d = fullRow.description != null ? fullRow.description : fullRow.Description;
      const id = fullRow.id != null ? fullRow.id : fullRow.Id;
      if (id != null && d != null) {
        return { id: String(id).trim(), description: String(d), fullRow };
      }
    }
    if (res.status !== 200) return null;
    try {
      const j = res.json();
      const rid = j && (j.id != null ? j.id : j.Id);
      const sid = rid != null ? String(rid).trim() : '';
      if (sid) {
        const d0 = j.description != null ? j.description : j.Description;
        const nd = matchers[0] || matchers[1] || '';
        return {
          id: sid,
          description: d0 != null ? String(d0) : String(nd || ''),
          fullRow: j,
        };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  const fromPost = packFromRes(postRes);
  if (fromPost) return fromPost;

  const getUrl = fundsGetUrl(base, cashflowId);
  for (let a = 0; a < maxAttempts; a++) {
    sleep(0.04 + a * 0.035);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: tagName, vu: vuTag },
      timeout: HTTP_TIMEOUT,
    });
    const packed = packFromRes(g);
    if (packed) return packed;
  }
  return null;
}

/** After **POST** contribution, resolve from POST body and/or **GET …/funds**. */
export function resolveContributionAfterPost(p) {
  return resolveFundLineAfterPost({ ...p, arrayKey: 'contributions' });
}

/** After **POST** withdrawal, resolve from POST body and/or **GET …/funds**. */
export function resolveWithdrawalAfterPost(p) {
  return resolveFundLineAfterPost({ ...p, arrayKey: 'withdrawals' });
}

export function deleteExpenseLineQuiet(base, hdrs, cashflowId, matchers) {
  const getUrl = financialGetUrl(base, cashflowId);
  for (let a = 0; a < 5; a++) {
    sleep(0.025 + a * 0.02);
    const g = http.get(getUrl, {
      headers: { Accept: 'application/json', Authorization: hdrs.Authorization },
      tags: { name: 'cf_finances_cleanup_exp_get', vu: String(__VU) },
      timeout: HTTP_TIMEOUT,
    });
    const row = findLastExpenseRowMatchingAnySubstring(g, matchers);
    if (row) {
      http.del(
        `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/financial/expense`,
        JSON.stringify(row),
        {
          headers: hdrs,
          tags: { name: 'cf_finances_cleanup_exp_del', vu: String(__VU) },
          timeout: HTTP_TIMEOUT,
        },
      );
      return;
    }
  }
}

// Re-export commonly used income-screen utilities for callers that import only this module.
export {
  API_BASE,
  assertApiBase,
  assertDevIdentityHost,
  buildLoadTestLineNeedles,
  collectErrorBucketBreakdown,
  DURATION,
  HTTP_TIMEOUT,
  IDENTITY_BASE,
  SHARED_CASHFLOW_ID,
  THINK_SEC,
  apiHeaders,
  buildMinimalIncomeLineItem,
  createHttpErrorBuckets,
  deleteGlobalSeed,
  getVuEntry,
  incomeRowWithUpdatedAmount,
  metricCount,
  metricValuesForTrend,
  normalizeIncomeLineCloneForPutApi,
  buildMinimalIncomeLineItemFromIeRow,
  parseLastIncomeMatchingAnySubstring,
  readAllLifecycleUsersAtInit,
  recordErrorInStatusBuckets,
  recordOutcomeWithBuckets,
  resolveIncomeLineAfterPost,
  findLastIncomeRowById,
  findLastIncomeRowMatchingAnySubstring,
  seedCashflowForVu,
  sharedCashflowContext,
  singleApiHandleSummaryFactory,
  teardownByNeedle,
  trimResBody,
} from '../cashflows-income/common-income-screen.js';
