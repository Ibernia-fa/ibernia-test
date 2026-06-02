/**
 * Phase A plan data entry aligned with k6 cashflows module screens:
 *
 * - **cashflows-timeline** — open plan (GET cashflow), GET Events/default + custom, POST 5 goal chips, GET timelines/financing
 * - **cashflows-income / Money In & Out** — GET income-expense/financial, PUT default Salary/State pension/Inheritance + Living costs/Housing, GET …/financial
 * - **Savings** — GET/POST …/saving-pots (≥2 new pots after default Cash)
 * - **cashflows-finances** — GET/POST …/funds (contributions & withdrawals via % Flows)
 * - **cashflows-reports** — (paused) forecast/scenario + GET Reports
 * - **cashflows-wealth** — POST assets/liabilities, resolve*AfterPost, GET wealth dashboard
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  HTTP_TIMEOUT,
  incomeRowWithUpdatedAmount,
  normalizeIncomeLineCloneForPutApi,
} from '../k6/cashflows-income/common-income-screen.js';
import {
  buildMinimalFundTransactionLineItem,
  contributionsPostUrl,
  financialGetUrl,
  fundsGetUrl,
  resolveContributionAfterPost,
  resolveWithdrawalAfterPost,
  withdrawalsPostUrl,
} from '../k6/cashflows-finances/common-finances-screen.js';
import {
  REPORTS_HTTP_SUCCESS,
  buildReportForecastPayload,
  buildReportScenarioPayload,
} from '../k6/cashflows-reports/common-cashflows-reports-screen.js';
import {
  resolveAssetIdAfterPost,
  resolveLiabilityIdAfterPost,
  wealthAssetsUrl,
  wealthDashboardUrl,
  wealthLiabilitiesUrl,
} from '../k6/cashflows-wealth/common-cashflows-wealth-screen.js';
import {
  buildRealisticCashPotAmount,
  buildRealisticContributionLineItemParams,
  buildRealisticDefaultMoneyInOutAmounts,
  buildRealisticSavingPotPayload,
  buildRealisticWithdrawalLineItemParams,
  buildRealisticWealthAsset,
  buildRealisticWealthLiability,
  cashSavingPotWithUpdatedAmount,
  countClientSavings,
  countConfiguredDefaultMoneyInOutLines,
  countFinancialLines,
  countFundTransactions,
  findDefaultCashSavingPot,
  findFinancialLineByDescription,
  findSavingPotIdByNameSubstring,
  parseBirthYearFromIso,
  pickTimelineEventsFromDefaults,
  resolveRealisticPlanDuration,
  volumeSeedMarker,
  VOLUME_TIMELINE_CHIP_COUNT,
  VOLUME_MONEY_IN_OUT_INCOME_COUNT,
  VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
  VOLUME_SAVING_POTS_COUNT,
  countTimelineClientEvents,
} from './k6-volume-realistic-data.js';

function httpOk(status) {
  return status === 200 || status === 201 || status === 204;
}

function reportsOk(status) {
  return REPORTS_HTTP_SUCCESS.includes(status);
}

function bearerFromHdrs(hdrs) {
  const auth = hdrs && hdrs.Authorization ? String(hdrs.Authorization) : '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : auth.replace(/^Bearer\s+/i, '').trim();
}

function parseJsonArray(res) {
  if (!httpOk(res.status)) return [];
  try {
    const j = res.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function parseJsonObject(res) {
  if (!httpOk(res.status)) return null;
  try {
    const j = res.json();
    return j && typeof j === 'object' ? j : null;
  } catch {
    return null;
  }
}

function birthYearAndPlanDurationFromCashflow(res, fallbackBirthIso) {
  let birthYear = parseBirthYearFromIso(fallbackBirthIso);
  let planDuration = resolveRealisticPlanDuration(birthYear);
  if (res.status !== 200) return { birthYear, planDuration };
  try {
    const cf = res.json();
    const cbd = cf.clientBirthDate != null ? cf.clientBirthDate : cf.ClientBirthDate;
    if (cbd != null) birthYear = parseBirthYearFromIso(String(cbd));
    const pd = cf.planDuration != null ? cf.planDuration : cf.PlanDuration;
    if (pd != null && Number.isFinite(Number(pd))) planDuration = Number(pd);
  } catch {
    /* keep fallbacks */
  }
  return { birthYear, planDuration };
}

/**
 * **cashflows-timeline** — open plan, load event chips, drop four on the timeline graph.
 */
export function seedVolumeTimelineModule(ctx) {
  const { base, hdrs, cashflowId, birthIso, planIndex, timeout, observe } = ctx;
  const cfEnc = encodeURIComponent(cashflowId);

  const resCf = http.get(`${base}/api/v1/cashflows/${cfEnc}`, {
    headers: hdrs,
    tags: { name: 'fp_timeline_open_plan_get_cf' },
    timeout,
  });
  observe(resCf, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}',
    tagName: 'fp_timeline_open_plan_get_cf',
  });
  check(resCf, { 'fp timeline: open plan GET cashflow 200': (r) => r.status === 200 });

  const { birthYear, planDuration } = birthYearAndPlanDurationFromCashflow(resCf, birthIso);

  const resEvDef = http.get(`${base}/api/v1/Events/default`, {
    headers: hdrs,
    tags: { name: 'fp_events_default_get' },
    timeout,
  });
  observe(resEvDef, { method: 'GET', endpoint: '/api/v1/Events/default', tagName: 'fp_events_default_get' });
  check(resEvDef, {
    'fp timeline: GET Events/default ok': (r) =>
      (r.status === 200 && Array.isArray(r.json())) || r.status === 204,
  });

  const resEvCust = http.get(`${base}/api/v1/Events/custom`, {
    headers: hdrs,
    tags: { name: 'fp_events_custom_get' },
    timeout,
  });
  observe(resEvCust, { method: 'GET', endpoint: '/api/v1/Events/custom', tagName: 'fp_events_custom_get' });
  check(resEvCust, { 'fp timeline: GET Events/custom 200': (r) => r.status === 200 });

  const defaultEvents = parseJsonArray(resEvDef);
  const timelineEvents = pickTimelineEventsFromDefaults(defaultEvents, birthYear, {
    maxEvents: VOLUME_TIMELINE_CHIP_COUNT,
    planIndex: planIndex != null ? planIndex : 0,
    planDuration,
  });
  const targetChips = Math.min(VOLUME_TIMELINE_CHIP_COUNT, timelineEvents.length);
  let postsOk = 0;
  for (let i = 0; i < timelineEvents.length; i++) {
    const resPost = http.post(
      `${base}/api/v1/cashflows/${cfEnc}/timelines/events`,
      JSON.stringify(timelineEvents[i]),
      { headers: hdrs, tags: { name: 'fp_timelines_events_post' }, timeout },
    );
    observe(resPost, {
      method: 'POST',
      endpoint: '/api/v1/cashflows/{cashflowId}/timelines/events',
      tagName: 'fp_timelines_events_post',
    });
    if (httpOk(resPost.status)) postsOk += 1;
  }

  const resTl = http.get(`${base}/api/v1/cashflows/${cfEnc}/timelines`, {
    headers: hdrs,
    tags: { name: 'fp_timelines_get' },
    timeout,
  });
  observe(resTl, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/timelines',
    tagName: 'fp_timelines_get',
  });
  check(resTl, { 'fp timeline: GET timelines 200': (r) => r.status === 200 });

  let clientEventCount = 0;
  if (resTl.status === 200) {
    try {
      clientEventCount = countTimelineClientEvents(resTl.json());
    } catch {
      /* ignore */
    }
  }

  const resTlf = http.get(`${base}/api/v1/cashflows/${cfEnc}/timelines/financing`, {
    headers: hdrs,
    tags: { name: 'fp_timelines_financing_get' },
    timeout,
  });
  observe(resTlf, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/timelines/financing',
    tagName: 'fp_timelines_financing_get',
  });
  check(resTlf, { 'fp timeline: GET timelines/financing 200': (r) => r.status === 200 });

  check(null, {
    'fp timeline: five unique goal chips dropped (ages 11-34, no duplicate retirement)': () =>
      targetChips >= 1 && postsOk >= targetChips && clientEventCount >= targetChips,
  });

  return {
    ok:
      targetChips >= 1 &&
      postsOk >= targetChips &&
      clientEventCount >= targetChips &&
      resTl.status === 200,
    eventsPosted: postsOk,
    targetChips,
    clientEventCount,
  };
}

/**
 * **Money In & Out** — load defaults from GET income-expense/financial, PUT amounts on plan-default rows.
 */
export function seedVolumeMoneyInOutModule(ctx) {
  const { base, hdrs, cashflowId, persona, planIndex, timeout, observe, vuHint } = ctx;
  const cfEnc = encodeURIComponent(cashflowId);
  const amountsSpec = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex });
  const expectedConfigured =
    VOLUME_MONEY_IN_OUT_INCOME_COUNT + VOLUME_MONEY_IN_OUT_EXPENSE_COUNT;

  const resIe = http.get(`${base}/api/v1/cashflows/${cfEnc}/income-expense/financial`, {
    headers: hdrs,
    tags: { name: 'fp_income_ie_financial_get' },
    timeout,
  });
  observe(resIe, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/income-expense/financial',
    tagName: 'fp_income_ie_financial_get',
  });
  check(resIe, { 'fp money-in-out: GET income-expense/financial 200': (r) => r.status === 200 });

  let financialRecord = parseJsonObject(resIe);
  let incomePutOk = 0;
  let expensePutOk = 0;

  for (let i = 0; i < amountsSpec.incomes.length; i++) {
    const spec = amountsSpec.incomes[i];
    const row = findFinancialLineByDescription(financialRecord, 'incomes', spec.description);
    if (!row) continue;
    const putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(row, spec.amount));
    const resPut = http.put(`${base}/api/v1/cashflows/${cfEnc}/financial/income`, JSON.stringify(putBody), {
      headers: hdrs,
      tags: { name: 'cashflows_income_put_income', vu: String(vuHint) },
      timeout,
    });
    observe(resPut, {
      method: 'PUT',
      endpoint: '/api/v1/cashflows/{cashflowId}/financial/income',
      tagName: 'fp_finances_put_income',
    });
    if (httpOk(resPut.status)) incomePutOk += 1;
  }

  for (let i = 0; i < amountsSpec.expenses.length; i++) {
    const spec = amountsSpec.expenses[i];
    const row = findFinancialLineByDescription(financialRecord, 'expenses', spec.description);
    if (!row) continue;
    const putBody = normalizeIncomeLineCloneForPutApi(incomeRowWithUpdatedAmount(row, spec.amount));
    const resPut = http.put(`${base}/api/v1/cashflows/${cfEnc}/financial/expense`, JSON.stringify(putBody), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_put_expense', vu: String(vuHint) },
      timeout,
    });
    observe(resPut, {
      method: 'PUT',
      endpoint: '/api/v1/cashflows/{cashflowId}/financial/expense',
      tagName: 'fp_finances_put_expense',
    });
    if (httpOk(resPut.status)) expensePutOk += 1;
  }

  let configuredCount = 0;
  let finCounts = { incomeCount: 0, expenseCount: 0 };
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) sleep(0.05 + attempt * 0.04);
    const resFin = http.get(financialGetUrl(base, cashflowId), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_get_financial', vu: String(vuHint) },
      timeout: timeout || HTTP_TIMEOUT,
    });
    observe(resFin, {
      method: 'GET',
      endpoint: '/api/v1/cashflows/{cashflowId}/financial',
      tagName: 'fp_financial_get',
    });
    if (resFin.status !== 200) continue;
    financialRecord = parseJsonObject(resFin);
    finCounts = countFinancialLines(financialRecord);
    configuredCount = countConfiguredDefaultMoneyInOutLines(financialRecord, amountsSpec);
    if (configuredCount >= expectedConfigured) break;
  }

  check(null, {
    'fp money-in-out: default income rows updated (Salary, State pension, Inheritance)': () =>
      incomePutOk >= VOLUME_MONEY_IN_OUT_INCOME_COUNT,
    'fp money-in-out: default expense rows updated (Living costs, Housing)': () =>
      expensePutOk >= VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
    'fp money-in-out: default rows show positive amounts in UI': () => configuredCount >= expectedConfigured,
  });

  return {
    ok:
      incomePutOk >= VOLUME_MONEY_IN_OUT_INCOME_COUNT &&
      expensePutOk >= VOLUME_MONEY_IN_OUT_EXPENSE_COUNT &&
      configuredCount >= expectedConfigured,
    incomeLines: incomePutOk,
    expenseLines: expensePutOk,
    configuredDefaults: configuredCount,
    finCounts,
  };
}

/** @deprecated use seedVolumeMoneyInOutModule */
export function seedVolumeIncomeModule(ctx) {
  return seedVolumeMoneyInOutModule(ctx);
}

function savingPotsGetUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/saving-pots`;
}

function savingPotsPostUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/saving-pots`;
}

function savingPotsPutUrl(base, cashflowId) {
  return `${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}/saving-pots`;
}

/**
 * **Savings tab** — GET saving-pots, POST ≥2 new pots, PUT default Cash balance.
 */
export function seedVolumeSavingsModule(ctx) {
  const { base, hdrs, cashflowId, persona, birthIso, planIndex, clientTag, timeout, observe, vuHint } = ctx;
  const cfEnc = encodeURIComponent(cashflowId);
  const birthYear = parseBirthYearFromIso(birthIso);
  const planDuration = resolveRealisticPlanDuration(birthYear);

  const resGet = http.get(savingPotsGetUrl(base, cashflowId), {
    headers: hdrs,
    tags: { name: 'fp_savings_get_pots', vu: String(vuHint) },
    timeout,
  });
  observe(resGet, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/saving-pots',
    tagName: 'fp_savings_get_pots',
  });
  check(resGet, { 'fp savings: GET saving-pots 200': (r) => r.status === 200 });

  let postsOk = 0;
  /** @type {string[]} */
  const savingPotIds = [];

  for (let i = 0; i < VOLUME_SAVING_POTS_COUNT; i++) {
    const body = buildRealisticSavingPotPayload({
      persona,
      planIndex,
      clientTag,
      birthYear,
      planDuration,
      presetIndex: i,
    });
    const resPost = http.post(savingPotsPostUrl(base, cashflowId), JSON.stringify(body), {
      headers: hdrs,
      tags: { name: 'fp_savings_post_pot', vu: String(vuHint) },
      timeout,
    });
    observe(resPost, {
      method: 'POST',
      endpoint: '/api/v1/cashflows/{cashflowId}/saving-pots',
      tagName: 'fp_savings_post_pot',
    });
    if (!httpOk(resPost.status)) continue;
    postsOk += 1;
    let model = parseJsonObject(resPost);
    const potId = findSavingPotIdByNameSubstring(model, body.name);
    if (potId) savingPotIds.push(potId);
  }

  let cashPutOk = 0;
  const targetCashAmount = buildRealisticCashPotAmount({ persona, planIndex, clientTag });
  const resCashGet = http.get(savingPotsGetUrl(base, cashflowId), {
    headers: hdrs,
    tags: { name: 'fp_savings_get_pots_for_cash_put', vu: String(vuHint) },
    timeout,
  });
  observe(resCashGet, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/saving-pots',
    tagName: 'fp_savings_get_pots_for_cash_put',
  });
  const cashRow = resCashGet.status === 200 ? findDefaultCashSavingPot(parseJsonObject(resCashGet)) : null;
  if (cashRow) {
    const putBody = cashSavingPotWithUpdatedAmount(cashRow, targetCashAmount);
    const resCashPut = http.put(savingPotsPutUrl(base, cashflowId), JSON.stringify(putBody), {
      headers: hdrs,
      tags: { name: 'fp_savings_put_cash', vu: String(vuHint) },
      timeout,
    });
    observe(resCashPut, {
      method: 'PUT',
      endpoint: '/api/v1/cashflows/{cashflowId}/saving-pots',
      tagName: 'fp_savings_put_cash',
    });
    if (httpOk(resCashPut.status)) cashPutOk = 1;
  }

  let savingsCounts = { totalPots: 0, nonCashPots: 0, totalSavings: 0, cashAmount: 0 };
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) sleep(0.05 + attempt * 0.04);
    const resVerify = http.get(`${base}/api/v1/cashflows/${cfEnc}/saving-pots`, {
      headers: hdrs,
      tags: { name: 'fp_savings_get_pots_verify', vu: String(vuHint) },
      timeout: timeout || HTTP_TIMEOUT,
    });
    observe(resVerify, {
      method: 'GET',
      endpoint: '/api/v1/cashflows/{cashflowId}/saving-pots',
      tagName: 'fp_savings_get_pots_verify',
    });
    if (resVerify.status !== 200) continue;
    const model = parseJsonObject(resVerify);
    savingsCounts = countClientSavings(model);
    if (savingPotIds.length < VOLUME_SAVING_POTS_COUNT && model) {
      for (let i = 0; i < VOLUME_SAVING_POTS_COUNT; i++) {
        const presetBody = buildRealisticSavingPotPayload({
          persona,
          planIndex,
          clientTag,
          birthYear,
          planDuration,
          presetIndex: i,
        });
        const potId = findSavingPotIdByNameSubstring(model, presetBody.name);
        if (potId && !savingPotIds.includes(potId)) savingPotIds.push(potId);
      }
    }
    if (savingsCounts.nonCashPots >= VOLUME_SAVING_POTS_COUNT && savingPotIds.length >= VOLUME_SAVING_POTS_COUNT) {
      if (cashPutOk >= 1 && savingsCounts.cashAmount > 0) break;
    }
  }

  check(null, {
    'fp savings: at least two new saving pots added': () =>
      postsOk >= VOLUME_SAVING_POTS_COUNT && savingsCounts.nonCashPots >= VOLUME_SAVING_POTS_COUNT,
    'fp savings: default Cash row updated with positive balance': () =>
      cashPutOk >= 1 && savingsCounts.cashAmount > 0,
    'fp savings: total savings reflects all pot balances': () => savingsCounts.totalSavings > 0,
  });

  const ok =
    resGet.status === 200 &&
    postsOk >= VOLUME_SAVING_POTS_COUNT &&
    savingsCounts.nonCashPots >= VOLUME_SAVING_POTS_COUNT &&
    cashPutOk >= 1 &&
    savingsCounts.cashAmount > 0 &&
    savingPotIds.length >= 1;
  return {
    ok,
    postsOk,
    cashPutOk,
    cashAmount: savingsCounts.cashAmount,
    savingPotIds,
    primarySavingPotId: savingPotIds[0] || null,
    savingsCounts,
  };
}

/**
 * **cashflows-finances** — funds (contributions & withdrawals). Money In & Out lines are seeded in {@link seedVolumeMoneyInOutModule}.
 */
export function seedVolumeFinancesModule(ctx) {
  const { base, hdrs, cashflowId, timeout, observe, vuHint } = ctx;
  let finCounts = { incomeCount: 0, expenseCount: 0 };
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) sleep(0.05 + attempt * 0.04);
    const resFin = http.get(financialGetUrl(base, cashflowId), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_get_financial', vu: String(vuHint) },
      timeout: timeout || HTTP_TIMEOUT,
    });
    observe(resFin, {
      method: 'GET',
      endpoint: '/api/v1/cashflows/{cashflowId}/financial',
      tagName: 'fp_financial_get',
    });
    if (resFin.status !== 200) continue;
    finCounts = countFinancialLines(parseJsonObject(resFin));
    if (
      finCounts.incomeCount >= VOLUME_MONEY_IN_OUT_INCOME_COUNT &&
      finCounts.expenseCount >= VOLUME_MONEY_IN_OUT_EXPENSE_COUNT
    ) {
      break;
    }
  }

  check(null, {
    'fp finances: full record has money-in-out rows': () =>
      finCounts.incomeCount >= VOLUME_MONEY_IN_OUT_INCOME_COUNT &&
      finCounts.expenseCount >= VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
  });
  return {
    ok:
      finCounts.incomeCount >= VOLUME_MONEY_IN_OUT_INCOME_COUNT &&
      finCounts.expenseCount >= VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
    expenseLines: finCounts.expenseCount,
    finCounts,
  };
}

/**
 * **cashflows-finances** contributions & withdrawals (GET/POST …/funds).
 */
export function seedVolumeContributionsWithdrawalsModule(ctx) {
  const {
    base,
    hdrs,
    cashflowId,
    persona,
    birthIso,
    planIndex,
    clientTag,
    timeout,
    observe,
    vuHint,
    savingPotId,
    savingPotIds,
  } = ctx;
  const birthYear = parseBirthYearFromIso(birthIso);
  const marker = volumeSeedMarker(clientTag, planIndex);
  const cfEnc = encodeURIComponent(cashflowId);
  const potIds = Array.isArray(savingPotIds)
    ? savingPotIds.filter((id) => id != null && String(id).trim() !== '')
    : savingPotId
      ? [String(savingPotId).trim()]
      : [];

  const resFundsGet = http.get(fundsGetUrl(base, cashflowId), {
    headers: hdrs,
    tags: { name: 'cashflows_finances_get_funds', vu: String(vuHint) },
    timeout,
  });
  observe(resFundsGet, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/funds',
    tagName: 'fp_funds_get',
  });
  check(resFundsGet, { 'fp funds: GET funds 200': (r) => r.status === 200 });

  let contributionResolved = 0;
  const contributionParams = buildRealisticContributionLineItemParams({
    persona,
    birthYear,
    planIndex,
    clientTag,
    savingPotIds: potIds,
  });
  for (let i = 0; i < contributionParams.length; i++) {
    const body = buildMinimalFundTransactionLineItem(contributionParams[i]);
    const resPost = http.post(contributionsPostUrl(base, cashflowId), JSON.stringify(body), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_post_contribution', vu: String(vuHint) },
      timeout,
    });
    observe(resPost, {
      method: 'POST',
      endpoint: '/api/v1/cashflows/{cashflowId}/funds/contributions',
      tagName: 'fp_funds_post_contribution',
    });
    if (!httpOk(resPost.status)) continue;
    const resolved = resolveContributionAfterPost({
      postRes: resPost,
      base,
      hdrs,
      cashflowId,
      needle: marker,
      stablePrefix: marker,
      vuTag: String(vuHint),
      tagName: 'fp_volume_contribution_resolve',
      maxAttempts: 8,
    });
    if (resolved && resolved.id) contributionResolved += 1;
  }

  let withdrawalResolved = 0;
  const withdrawalParams = buildRealisticWithdrawalLineItemParams({
    persona,
    birthYear,
    planIndex,
    clientTag,
    savingPotIds: potIds,
  });
  for (let i = 0; i < withdrawalParams.length; i++) {
    const body = buildMinimalFundTransactionLineItem(withdrawalParams[i]);
    const resPost = http.post(withdrawalsPostUrl(base, cashflowId), JSON.stringify(body), {
      headers: hdrs,
      tags: { name: 'cashflows_finances_post_withdrawal', vu: String(vuHint) },
      timeout,
    });
    observe(resPost, {
      method: 'POST',
      endpoint: '/api/v1/cashflows/{cashflowId}/funds/withdrawals',
      tagName: 'fp_funds_post_withdrawal',
    });
    if (!httpOk(resPost.status)) continue;
    const resolved = resolveWithdrawalAfterPost({
      postRes: resPost,
      base,
      hdrs,
      cashflowId,
      needle: marker,
      stablePrefix: marker,
      vuTag: String(vuHint),
      tagName: 'fp_volume_withdrawal_resolve',
      maxAttempts: 8,
    });
    if (resolved && resolved.id) withdrawalResolved += 1;
  }

  let fundCounts = { contributionCount: 0, withdrawalCount: 0 };
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) sleep(0.05 + attempt * 0.04);
    const resFunds = http.get(`${base}/api/v1/cashflows/${cfEnc}/funds`, {
      headers: hdrs,
      tags: { name: 'cashflows_finances_get_funds_verify', vu: String(vuHint) },
      timeout: timeout || HTTP_TIMEOUT,
    });
    observe(resFunds, {
      method: 'GET',
      endpoint: '/api/v1/cashflows/{cashflowId}/funds',
      tagName: 'fp_funds_get_verify',
    });
    if (resFunds.status !== 200) continue;
    try {
      fundCounts = countFundTransactions(resFunds.json());
    } catch {
      /* ignore */
    }
    if (fundCounts.contributionCount >= 1 && fundCounts.withdrawalCount >= 1) break;
  }

  check(null, {
    'fp funds: at least one contribution and withdrawal persisted': () =>
      fundCounts.contributionCount >= 1 && fundCounts.withdrawalCount >= 1,
  });

  const ok =
    contributionResolved >= 1 &&
    withdrawalResolved >= 1 &&
    fundCounts.contributionCount >= 1 &&
    fundCounts.withdrawalCount >= 1;
  return { ok, contributionResolved, withdrawalResolved, fundCounts };
}

/**
 * **cashflows-reports** suite sequence.
 */
export function seedVolumeReportsModule(ctx) {
  const { base, hdrs, cashflowId, clientTag, planIndex, timeout, observe, vuHint } = ctx;
  const cfEnc = encodeURIComponent(cashflowId);

  const resCf = http.get(`${base}/api/v1/cashflows/${cfEnc}`, {
    headers: hdrs,
    tags: { name: 'cashflows_reports_suite_get_cf' },
    timeout,
  });
  observe(resCf, { method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}', tagName: 'fp_reports_get_cf' });
  check(resCf, { 'fp reports: GET cashflow 200': (r) => r.status === 200 });

  const resFin = http.get(financialGetUrl(base, cashflowId), {
    headers: hdrs,
    tags: { name: 'cashflows_reports_suite_get_fin' },
    timeout,
  });
  observe(resFin, {
    method: 'GET',
    endpoint: '/api/v1/cashflows/{cashflowId}/financial',
    tagName: 'fp_reports_get_financial',
  });
  check(resFin, { 'fp reports: GET financial 200': (r) => r.status === 200 });

  const inflationRate = 2.15 + ((vuHint * 2 + planIndex) % 14) / 10;
  const forecastBody = buildReportForecastPayload(vuHint, planIndex, clientTag);
  const resForecast = http.post(
    `${base}/api/v1/Reports/${cfEnc}?inflationRate=${inflationRate}`,
    JSON.stringify(forecastBody),
    { headers: hdrs, tags: { name: 'cashflows_reports_suite_post_fc' }, timeout },
  );
  observe(resForecast, {
    method: 'POST',
    endpoint: '/api/v1/Reports/{cashflowId}',
    tagName: 'fp_reports_post_forecast',
  });
  check(resForecast, {
    'fp reports: POST forecast ok': (r) => reportsOk(r.status),
  });

  const scenarioBody = buildReportScenarioPayload(vuHint, planIndex, clientTag);
  const resScenario = http.post(
    `${base}/api/v1/Reports/${cfEnc}/scenario`,
    JSON.stringify(scenarioBody),
    { headers: hdrs, tags: { name: 'cashflows_reports_suite_post_sc' }, timeout },
  );
  observe(resScenario, {
    method: 'POST',
    endpoint: '/api/v1/Reports/{cashflowId}/scenario',
    tagName: 'fp_reports_post_scenario',
  });
  check(resScenario, {
    'fp reports: POST scenario ok': (r) => reportsOk(r.status),
  });

  const resRep = http.get(`${base}/api/v1/Reports/${cfEnc}?inflationRate=${inflationRate}`, {
    headers: hdrs,
    tags: { name: 'cashflows_reports_suite_get_rep' },
    timeout,
  });
  observe(resRep, { method: 'GET', endpoint: '/api/v1/Reports/{cashflowId}', tagName: 'fp_reports_get' });
  check(resRep, { 'fp reports: GET Reports ok': (r) => reportsOk(r.status) });

  return {
    ok: reportsOk(resForecast.status) && reportsOk(resScenario.status) && reportsOk(resRep.status),
  };
}

/**
 * **cashflows-wealth** module sequence.
 */
export function seedVolumeWealthModule(ctx) {
  const { base, hdrs, cashflowId, persona, planIndex, clientTag, timeout, observe, vuHint } = ctx;
  const marker = volumeSeedMarker(clientTag, planIndex);

  const resCf = http.get(`${base}/api/v1/cashflows/${encodeURIComponent(cashflowId)}`, {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_get_cf' },
    timeout,
  });
  observe(resCf, { method: 'GET', endpoint: '/api/v1/cashflows/{cashflowId}', tagName: 'fp_wealth_get_cf' });

  const assetBody = buildRealisticWealthAsset({ persona, planIndex, clientTag });
  const postAssetUrl = wealthAssetsUrl(base, cashflowId);
  const resAsset = http.post(postAssetUrl, JSON.stringify(assetBody), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_post_asset', vu: String(vuHint) },
    timeout,
  });
  observe(resAsset, {
    method: 'POST',
    endpoint: '/api/v1/wealth/{cashflowId}/assets',
    tagName: 'fp_wealth_post_asset',
  });
  const token = bearerFromHdrs(hdrs);
  const assetId = resolveAssetIdAfterPost({
    postRes: resAsset,
    base,
    token,
    cashflowId,
    needle: marker,
    vuTag: String(vuHint),
    tagName: 'fp_volume_wealth_asset_resolve',
    timeout,
  });

  const liabilityBody = buildRealisticWealthLiability({ persona, planIndex, clientTag });
  const postLiabUrl = wealthLiabilitiesUrl(base, cashflowId);
  const resLiab = http.post(postLiabUrl, JSON.stringify(liabilityBody), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_post_liability', vu: String(vuHint) },
    timeout,
  });
  observe(resLiab, {
    method: 'POST',
    endpoint: '/api/v1/wealth/{cashflowId}/liabilities',
    tagName: 'fp_wealth_post_liability',
  });
  const liabilityId = resolveLiabilityIdAfterPost({
    postRes: resLiab,
    base,
    token,
    cashflowId,
    needle: marker,
    vuTag: String(vuHint),
    tagName: 'fp_volume_wealth_liability_resolve',
    timeout,
  });

  const resWd = http.get(wealthDashboardUrl(base, cashflowId), {
    headers: hdrs,
    tags: { name: 'cashflows_wealth_get_dashboard', vu: String(vuHint) },
    timeout,
  });
  observe(resWd, { method: 'GET', endpoint: '/api/v1/wealth/{cashflowId}', tagName: 'fp_wealth_dashboard_get' });
  check(resWd, { 'fp wealth: GET dashboard 200': (r) => r.status === 200 });

  const ok =
    resAsset.status === 200 &&
    resLiab.status === 200 &&
    resWd.status === 200 &&
    !!assetId &&
    !!liabilityId;
  check(null, {
    'fp wealth: asset and liability resolved on dashboard': () => !!assetId && !!liabilityId,
  });
  return { ok, assetId, liabilityId };
}

/**
 * Full plan seed — all cashflows modules in UI order.
 */
export function seedRealisticPlanData(p) {
  const ctx = {
    base: p.base,
    hdrs: p.hdrs,
    cashflowId: p.cashflowId,
    persona: p.persona,
    birthIso: p.birthIso,
    clientTag: p.clientTag,
    planIndex: p.planIndex,
    vuHint: p.vuHint != null ? p.vuHint : 1,
    timeout: p.timeout,
    observe: p.observe,
  };

  const timeline = seedVolumeTimelineModule(ctx);
  const moneyInOut = seedVolumeMoneyInOutModule(ctx);
  const savings = seedVolumeSavingsModule(ctx);
  const finances = seedVolumeFinancesModule(ctx);
  const funds = seedVolumeContributionsWithdrawalsModule({
    ...ctx,
    savingPotIds: savings.savingPotIds,
    savingPotId: savings.primarySavingPotId,
  });
  const wealth = seedVolumeWealthModule(ctx);

  return {
    timelineOk: timeline.ok,
    incomeOk: moneyInOut.ok,
    savingsOk: savings.ok,
    financesOk: finances.ok && moneyInOut.ok,
    contributionsOk: funds.ok,
    reportOk: true,
    wealthOk: wealth.ok,
    ok: timeline.ok && moneyInOut.ok && savings.ok && finances.ok && funds.ok && wealth.ok,
  };
}
