/**
 * Unit tests for lib/k6-volume-realistic-data.js
 * Run: node --test tools/k6-volume-realistic-data.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VOLUME_CLIENT_PERSONAS,
  applyRealisticClientProfile,
  buildRealisticClientKeywords,
  buildRealisticContributionLineItemParams,
  buildRealisticCashflowBody,
  buildRealisticDefaultMoneyInOutAmounts,
  buildRealisticExpenseLineItemParams,
  buildRealisticIncomeLine,
  buildRealisticIncomeLineItemParams,
  buildRealisticSavingPotPayload,
  buildRealisticCashPotAmount,
  buildRealisticWealthAsset,
  buildRealisticWithdrawalLineItemParams,
  buildVolumeClientEmail,
  cashSavingPotWithUpdatedAmount,
  countClientSavings,
  countConfiguredDefaultMoneyInOutLines,
  countFinancialLines,
  countFundTransactions,
  findDefaultCashSavingPot,
  findFinancialLineByDescription,
  findSavingPotIdByNameSubstring,
  isTimelineSeedExcludedEvent,
  pickTimelineEventsFromDefaults,
  planTitleForPersona,
  planEndYearFromDuration,
  resolveRealisticPlanDuration,
  resolveTimelineGoalAges,
  selectPersonaForClient,
  volumeSeedMarker,
  countTimelineClientEvents,
  TIMELINE_GOAL_MAX_AGE,
  TIMELINE_GOAL_MIN_AGE,
  VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
  VOLUME_MONEY_IN_OUT_INCOME_COUNT,
  VOLUME_SAVING_POTS_COUNT,
  VOLUME_TIMELINE_CHIP_COUNT,
} from '../lib/k6-volume-realistic-data.js';

test('personas are distinct and amounts are realistic', () => {
  assert.ok(VOLUME_CLIENT_PERSONAS.length >= 20);
  const names = new Set(VOLUME_CLIENT_PERSONAS.map((p) => `${p.firstName} ${p.lastName}`));
  assert.equal(names.size, VOLUME_CLIENT_PERSONAS.length);
  for (const p of VOLUME_CLIENT_PERSONAS) {
    assert.ok(p.monthlySalary >= 2500 && p.monthlySalary <= 8000);
    assert.ok(p.monthlyHousehold >= 1500 && p.monthlyHousehold < p.monthlySalary);
    assert.ok(p.notes.length > 20);
  }
});

test('resolveRealisticPlanDuration extends plan past today and retirement', () => {
  const ref = 2026;
  // Francesca Gallo (1983) — fixed 40y put plan end in 2023 while client is 43 in 2026.
  assert.equal(resolveRealisticPlanDuration(1983, ref), 72);
  assert.ok(planEndYearFromDuration(1983, 72) > ref);
  // Young client still reaches retirement horizon.
  assert.equal(resolveRealisticPlanDuration(1995, ref), 72);
  assert.ok(planEndYearFromDuration(1995, 72) >= 1995 + 67);
});

test('buildRealisticCashflowBody uses dynamic planDuration from persona birth year', () => {
  const persona = VOLUME_CLIENT_PERSONAS.find((p) => p.birthYear === 1983);
  assert.ok(persona);
  const body = buildRealisticCashflowBody({
    clientId: 'c1',
    clientName: `${persona.firstName} ${persona.lastName}`,
    advisorSub: 'adv',
    advisorName: 'Advisor',
    planName: persona.planLabel,
    clientBirthDateIso: `${persona.birthYear}-06-15T00:00:00.000Z`,
    persona,
  });
  assert.equal(body.planDuration, resolveRealisticPlanDuration(persona.birthYear, 2026));
  assert.ok(body.planDuration > 40);
});

test('selectPersonaForClient is stable for a tag', () => {
  const a = selectPersonaForClient('fp1_g0_123', 0, 0);
  const b = selectPersonaForClient('fp1_g0_123', 0, 0);
  assert.equal(a.firstName, b.firstName);
});

test('selectPersonaForClient yields distinct personas for five clients on one advisor', () => {
  const base = 'fp1_g0_1780449247256';
  const names = new Set();
  for (let ci = 0; ci < 5; ci++) {
    const tag = `${base}c${ci + 1}`;
    const p = selectPersonaForClient(tag, ci, 0);
    names.add(`${p.firstName} ${p.lastName}`);
  }
  assert.equal(names.size, 5, `expected 5 distinct personas, got ${[...names].join(', ')}`);
});

test('selectPersonaForClient yields distinct personas for ten clients on one advisor', () => {
  const base = 'fp1_g0_1780458287487';
  const names = new Set();
  for (let ci = 0; ci < 10; ci++) {
    const tag = `${base}c${ci + 1}`;
    const p = selectPersonaForClient(tag, ci, 0);
    names.add(`${p.firstName} ${p.lastName}`);
  }
  assert.equal(names.size, 10, `expected 10 distinct personas, got ${[...names].join(', ')}`);
});

test('selectPersonaForClient yields distinct personas for twenty clients on one advisor (S4)', () => {
  const base = 'S4-advisor-09';
  const names = new Set();
  for (let ci = 0; ci < 20; ci++) {
    const tag = `${base}c${ci + 1}`;
    const p = selectPersonaForClient(tag, ci, 0);
    names.add(`${p.firstName} ${p.lastName}`);
  }
  assert.equal(names.size, 20, `expected 20 distinct personas, got ${[...names].join(', ')}`);
});

test('buildVolumeClientEmail embeds unique clientTag', () => {
  const persona = VOLUME_CLIENT_PERSONAS[0];
  const email = buildVolumeClientEmail(persona, 'fp1_g0_123c2', 'example.com');
  assert.equal(email, 'marco.rossi.fp1_g0_123c2@example.com');
});

test('applyRealisticClientProfile uses clean name and short keyword notes', () => {
  const persona = VOLUME_CLIENT_PERSONAS[0];
  const model = applyRealisticClientProfile(
    { ClientDetails: { FirstName: 'X', LastName: 'Y' } },
    { persona, uniqueTag: 'fp1_g0_999' },
  );
  assert.equal(model.ClientDetails.FirstName, persona.firstName);
  assert.equal(model.ClientDetails.LastName, persona.lastName);
  assert.doesNotMatch(model.ClientDetails.LastName, /fp1_g0/);
  assert.doesNotMatch(model.Notes, /volume-seed/);
  assert.doesNotMatch(model.Notes, /k6 lifecycle/);
  assert.equal(model.Notes, buildRealisticClientKeywords(persona));
});

test('applyRealisticClientProfile patches camelCase GET model (API PUT shape)', () => {
  const persona = VOLUME_CLIENT_PERSONAS[3];
  const model = applyRealisticClientProfile(
    {
      clientDetails: {
        firstName: 'Elena',
        lastName: 'Romano-fp1_g0_1780410485984',
        birthDate: '1985-06-15T00:00:00Z',
      },
      notes: 'k6 lifecycle fp1_g0_1780410485984 no-partner=1',
    },
    { persona, uniqueTag: 'fp1_g0_1780410485984' },
  );
  assert.equal(model.clientDetails.lastName, 'Romano');
  assert.doesNotMatch(model.clientDetails.lastName, /fp1_g0/);
  assert.equal(model.notes, buildRealisticClientKeywords(persona));
});

test('default Money In & Out amounts target plan-default UI rows', () => {
  const persona = VOLUME_CLIENT_PERSONAS[1];
  const amounts = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex: 0 });
  assert.equal(amounts.incomes.length, VOLUME_MONEY_IN_OUT_INCOME_COUNT);
  assert.equal(amounts.expenses.length, VOLUME_MONEY_IN_OUT_EXPENSE_COUNT);
  assert.equal(amounts.incomes[0].description, 'Salary');
  assert.equal(amounts.incomes[1].description, 'State pension');
  assert.equal(amounts.incomes[2].description, 'Inheritance');
  assert.equal(amounts.expenses[0].description, 'Living costs');
  assert.equal(amounts.expenses[1].description, 'Housing');
  assert.ok(amounts.incomes[0].amount >= 3000);
  assert.ok(amounts.expenses[0].amount >= 400);
  assert.ok(amounts.expenses[1].amount >= 600);

  const financialRecord = {
    incomes: [
      { description: 'Salary', amount: { amount: 0 } },
      { description: 'State pension', amount: { amount: 0 } },
      { description: 'Inheritance', amount: { amount: 0 } },
    ],
    expenses: [
      { description: 'Living costs', amount: { amount: 0 } },
      { description: 'Housing', amount: { amount: 0 } },
    ],
  };
  assert.ok(findFinancialLineByDescription(financialRecord, 'incomes', 'Salary'));
  assert.equal(countConfiguredDefaultMoneyInOutLines(financialRecord, amounts), 0);
  financialRecord.incomes[0].amount.amount = amounts.incomes[0].amount;
  financialRecord.expenses[1].amount.amount = amounts.expenses[1].amount;
  assert.equal(countConfiguredDefaultMoneyInOutLines(financialRecord, amounts), 2);

  const income = buildRealisticIncomeLine({ persona, birthYear: persona.birthYear, planIndex: 0, clientTag: 'tag' });
  assert.equal(income.description, 'Salary');
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

test('buildRealisticSavingPotPayload creates two distinct non-cash pots', () => {
  const persona = VOLUME_CLIENT_PERSONAS[1];
  const pot0 = buildRealisticSavingPotPayload({
    persona,
    planIndex: 0,
    clientTag: 'fp1_g0_88',
    birthYear: persona.birthYear,
    presetIndex: 0,
  });
  const pot1 = buildRealisticSavingPotPayload({
    persona,
    planIndex: 0,
    clientTag: 'fp1_g0_88',
    birthYear: persona.birthYear,
    presetIndex: 1,
  });
  assert.equal(VOLUME_SAVING_POTS_COUNT, 2);
  assert.equal(pot0.type, 2);
  assert.equal(pot1.type, 4);
  assert.ok(pot0.startingPotValue.amount >= 42000);
  assert.ok(pot1.startingPotValue.amount >= 8500);
  assert.notEqual(pot0.name, pot1.name);
  assert.doesNotMatch(pot0.name, /\[vol-/);
  assert.doesNotMatch(pot1.name, /\[vol-/);
});

test('countClientSavings and findSavingPotIdByNameSubstring', () => {
  const model = {
    totalSavings: 50500,
    clientSavings: [
      { id: 'cash-1', name: 'Cash', type: 1, startingPotValue: { amount: 8500 } },
      { id: 'inv-1', name: 'Investment portfolio — Giulia', type: 2 },
      { id: 'oth-1', name: 'Other savings — Giulia', type: 4 },
    ],
  };
  const counts = countClientSavings(model);
  assert.equal(counts.totalPots, 3);
  assert.equal(counts.nonCashPots, 2);
  assert.equal(counts.totalSavings, 50500);
  assert.equal(counts.cashAmount, 8500);
  assert.equal(findSavingPotIdByNameSubstring(model, 'Investment portfolio'), 'inv-1');
  assert.equal(findSavingPotIdByNameSubstring(model, 'missing'), null);
});

test('findDefaultCashSavingPot and cashSavingPotWithUpdatedAmount', () => {
  const model = {
    clientSavings: [
      {
        id: 'cash-1',
        name: 'Cash',
        type: 1,
        startingPotValue: { amount: 0, currencySymbol: '€', cycle: { id: '', description: '' } },
      },
    ],
  };
  const persona = VOLUME_CLIENT_PERSONAS[0];
  const cashRow = findDefaultCashSavingPot(model);
  assert.ok(cashRow);
  const amount = buildRealisticCashPotAmount({ persona, planIndex: 0, clientTag: 'fp1_g0_1' });
  assert.ok(amount >= 5000);
  const putBody = cashSavingPotWithUpdatedAmount(cashRow, amount);
  assert.equal(putBody.id, 'cash-1');
  assert.equal(putBody.startingPotValue.amount, amount);
});

test('contribution params link both flows to savingPotIds array', () => {
  const persona = VOLUME_CLIENT_PERSONAS[0];
  const contributions = buildRealisticContributionLineItemParams({
    persona,
    birthYear: persona.birthYear,
    planIndex: 0,
    clientTag: 'fp1_g0_77',
    savingPotIds: ['pot-a', 'pot-b'],
  });
  assert.equal(contributions[0].associatedSavingPotId, 'pot-a');
  assert.equal(contributions[1].associatedSavingPotId, 'pot-b');
});

test('countFundTransactions reads contributions and withdrawals', () => {
  const counts = countFundTransactions({
    contributions: [{ id: '1' }],
    withdrawals: [{ id: '2' }, { id: '3' }],
  });
  assert.equal(counts.contributionCount, 1);
  assert.equal(counts.withdrawalCount, 2);
});

test('resolveTimelineGoalAges uses young-life band 11-34 when client is under 35 and viewport allows', () => {
  const birthYear = 2010;
  const planDuration = 72;
  const ages = resolveTimelineGoalAges(birthYear, planDuration, VOLUME_TIMELINE_CHIP_COUNT, 2026);
  assert.equal(ages.length, VOLUME_TIMELINE_CHIP_COUNT);
  for (const age of ages) {
    assert.ok(age >= 38, `age ${age} must be on-screen (>= 38)`);
    assert.ok(age < planDuration - 1, `age ${age} must be within plan duration`);
  }
  assert.equal(new Set(ages).size, ages.length);
});

test('resolveTimelineGoalAges respects UI viewport floor (38+) for older clients', () => {
  const birthYear = 1983;
  const planDuration = 72;
  const refYear = 2026;
  const currentAge = refYear - birthYear;
  const ages = resolveTimelineGoalAges(birthYear, planDuration, VOLUME_TIMELINE_CHIP_COUNT, refYear);
  assert.equal(ages.length, VOLUME_TIMELINE_CHIP_COUNT);
  for (const age of ages) {
    assert.ok(age >= 38, `age ${age} must be on-screen (>= 38)`);
    assert.ok(age > currentAge, `age ${age} must be ahead of current age ${currentAge}`);
    assert.ok(age < planDuration - 1, `age ${age} must be within plan duration`);
  }
  assert.equal(new Set(ages).size, ages.length);
});

test('pickTimelineEventsFromDefaults seeds five goals at unique visible ages', () => {
  const defaults = [
    { name: 'Retirement age', behaviorKey: 'retirement_age', type: 1, isDefault: true },
    { name: 'Birth', behaviorKey: 'birth', type: 2, isDefault: true },
    { name: 'Education', behaviorKey: 'education', type: 2, isDefault: true },
    { name: 'Home', behaviorKey: 'home', type: 2, isDefault: true },
    { name: 'Wedding', behaviorKey: 'wedding', type: 2, isDefault: true },
    { name: 'Car', behaviorKey: 'car', type: 2, isDefault: true },
    { name: 'Travel', behaviorKey: 'travel', type: 2, isDefault: true },
  ];
  const birthYear = 1983;
  const planDuration = 72;
  const referenceYear = 2026;
  const currentAge = referenceYear - birthYear;
  const picked = pickTimelineEventsFromDefaults(defaults, birthYear, {
    maxEvents: VOLUME_TIMELINE_CHIP_COUNT,
    planDuration,
    referenceYear,
  });
  assert.equal(picked.length, VOLUME_TIMELINE_CHIP_COUNT);
  const keys = picked.map((p) => p.behaviorKey);
  assert.ok(!keys.some((k) => String(k).includes('retire')));
  assert.ok(keys.includes('education'));
  assert.ok(keys.includes('home'));
  assert.ok(keys.includes('wedding'));
  assert.ok(keys.includes('car'));
  assert.ok(keys.includes('travel'));
  const ages = picked.map((p) => p.start.age);
  assert.equal(new Set(ages).size, ages.length);
  for (const p of picked) {
    assert.ok(p.start.age >= 38, `goal age ${p.start.age} must be on-screen (>= 38)`);
    assert.ok(p.start.age > currentAge, `goal age ${p.start.age} must be ahead of today (${currentAge})`);
    assert.equal(p.start.year, birthYear + p.start.age);
    assert.equal(p.end.year, birthYear + p.end.age);
  }
});

test('countTimelineClientEvents reads clientEvents array', () => {
  assert.equal(countTimelineClientEvents({ clientEvents: [{ id: '1' }, { id: '2' }] }), 2);
  assert.equal(countTimelineClientEvents(null), 0);
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
