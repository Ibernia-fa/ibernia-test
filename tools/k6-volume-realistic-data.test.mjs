/**
 * Unit tests for lib/k6-volume-realistic-data.js
 * Run: node --test tools/k6-volume-realistic-data.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VOLUME_CLIENT_PERSONAS,
  applyRealisticClientProfile,
  buildRealisticContributionLineItemParams,
  buildRealisticExpenseLineItemParams,
  buildRealisticIncomeLine,
  buildRealisticIncomeLineItemParams,
  buildRealisticWealthAsset,
  buildRealisticWithdrawalLineItemParams,
  countFinancialLines,
  countFundTransactions,
  pickTimelineEventsFromDefaults,
  planTitleForPersona,
  selectPersonaForClient,
  volumeSeedMarker,
} from '../lib/k6-volume-realistic-data.js';

test('personas are distinct and amounts are realistic', () => {
  assert.ok(VOLUME_CLIENT_PERSONAS.length >= 5);
  const names = new Set(VOLUME_CLIENT_PERSONAS.map((p) => `${p.firstName} ${p.lastName}`));
  assert.equal(names.size, VOLUME_CLIENT_PERSONAS.length);
  for (const p of VOLUME_CLIENT_PERSONAS) {
    assert.ok(p.monthlySalary >= 2500 && p.monthlySalary <= 8000);
    assert.ok(p.monthlyHousehold >= 1500 && p.monthlyHousehold < p.monthlySalary);
    assert.ok(p.notes.length > 20);
  }
});

test('selectPersonaForClient is stable for a tag', () => {
  const a = selectPersonaForClient('fp1_g0_123', 0, 0);
  const b = selectPersonaForClient('fp1_g0_123', 0, 0);
  assert.equal(a.firstName, b.firstName);
});

test('applyRealisticClientProfile keeps cleanup needle in last name', () => {
  const persona = VOLUME_CLIENT_PERSONAS[0];
  const model = applyRealisticClientProfile(
    { ClientDetails: { FirstName: 'X', LastName: 'Y' } },
    { persona, uniqueTag: 'fp1_g0_999' },
  );
  assert.equal(model.ClientDetails.FirstName, persona.firstName);
  assert.match(model.ClientDetails.LastName, /fp1_g0_999/);
});

test('income and expense line params use occupation, marker, and multi-line sets', () => {
  const persona = VOLUME_CLIENT_PERSONAS[1];
  const tag = 'fp1_g0_42';
  const marker = volumeSeedMarker(tag, 0);
  const incomeParams = buildRealisticIncomeLineItemParams({
    persona,
    birthYear: persona.birthYear,
    planIndex: 0,
    clientTag: tag,
  });
  const expenseParams = buildRealisticExpenseLineItemParams({
    persona,
    birthYear: persona.birthYear,
    planIndex: 0,
    clientTag: tag,
  });
  assert.equal(incomeParams.length, 2);
  assert.equal(expenseParams.length, 2);
  assert.match(incomeParams[0].description, /Primary salary/);
  assert.match(incomeParams[0].description, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(expenseParams[0].description, /Household/);
  assert.ok(incomeParams[0].amount >= 3000);
  assert.ok(expenseParams[0].amount >= 1500);

  const income = buildRealisticIncomeLine({ persona, birthYear: persona.birthYear, planIndex: 0, clientTag: tag });
  assert.match(income.description, /Primary salary/);
});

test('wealth payloads embed volume marker for dashboard resolve', () => {
  const persona = VOLUME_CLIENT_PERSONAS[0];
  const tag = 'fp1_g0_99';
  const marker = volumeSeedMarker(tag, 1);
  const asset = buildRealisticWealthAsset({ persona, planIndex: 1, clientTag: tag });
  assert.match(asset.description, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(asset.value >= 50000);
});

test('contribution and withdrawal fund params include markers and realistic amounts', () => {
  const persona = VOLUME_CLIENT_PERSONAS[2];
  const tag = 'fp1_g0_77';
  const marker = volumeSeedMarker(tag, 0);
  const contributions = buildRealisticContributionLineItemParams({
    persona,
    birthYear: persona.birthYear,
    planIndex: 0,
    clientTag: tag,
    savingPotId: 'pot-abc',
  });
  const withdrawals = buildRealisticWithdrawalLineItemParams({
    persona,
    birthYear: persona.birthYear,
    planIndex: 0,
    clientTag: tag,
  });
  assert.equal(contributions.length, 2);
  assert.equal(withdrawals.length, 2);
  assert.match(contributions[0].description, /pension contribution/i);
  assert.match(contributions[0].description, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(contributions[0].associatedSavingPotId, 'pot-abc');
  assert.ok(contributions[0].amount >= 300);
  assert.match(withdrawals[0].description, /drawdown/i);
  assert.ok(withdrawals[1].amount >= 10000);
});

test('countFundTransactions reads contributions and withdrawals', () => {
  const counts = countFundTransactions({
    contributions: [{ id: '1' }],
    withdrawals: [{ id: '2' }, { id: '3' }],
  });
  assert.equal(counts.contributionCount, 1);
  assert.equal(counts.withdrawalCount, 2);
});

test('pickTimelineEventsFromDefaults chooses up to two goals', () => {
  const defaults = [
    { name: 'Retirement', behaviorKey: 'retirement', type: 2, isDefault: true },
    { name: 'Buy a home', behaviorKey: 'home_purchase', type: 2, isDefault: true },
    { name: 'Other', behaviorKey: 'other', type: 2, isDefault: true },
  ];
  const picked = pickTimelineEventsFromDefaults(defaults, 1985);
  assert.ok(picked.length >= 1 && picked.length <= 2);
  assert.ok(picked[0].name);
  assert.ok(picked[0].start.age >= 18);
});

test('countFinancialLines reads incomes and expenses', () => {
  const counts = countFinancialLines({
    incomes: [{ id: '1' }],
    expenses: [{ id: '2' }, { id: '3' }],
  });
  assert.equal(counts.incomeCount, 1);
  assert.equal(counts.expenseCount, 2);
});

test('planTitleForPersona varies with multi-plan clients', () => {
  const persona = VOLUME_CLIENT_PERSONAS[0];
  assert.equal(planTitleForPersona(persona, 0, 1), persona.planLabel);
  assert.notEqual(planTitleForPersona(persona, 0, 2), planTitleForPersona(persona, 1, 2));
});
