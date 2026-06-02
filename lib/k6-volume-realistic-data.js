/**
 * Realistic client / plan seed payloads for Phase A volume writes.
 * Pure helpers (no k6 imports) — unit-testable in Node.
 */

/** @typedef {{ firstName: string, lastName: string, birthYear: number, occupation: string, planLabel: string, monthlySalary: number, monthlyHousehold: number, notes: string }} VolumePersona */

export const VOLUME_CLIENT_PERSONAS = Object.freeze([
  {
    firstName: 'Marco',
    lastName: 'Rossi',
    birthYear: 1985,
    occupation: 'Engineering manager',
    planLabel: 'Long-term retirement plan',
    monthlySalary: 5200,
    monthlyHousehold: 2900,
    notes: 'Dual income household; target retirement at 67 with €1.2M pension pot.',
  },
  {
    firstName: 'Giulia',
    lastName: 'Bianchi',
    birthYear: 1990,
    occupation: 'Management consultant',
    planLabel: 'Wealth accumulation plan',
    monthlySalary: 4800,
    monthlyHousehold: 2600,
    notes: 'Planning first home purchase within 3 years; moderate risk tolerance.',
  },
  {
    firstName: 'Luca',
    lastName: 'Ferrero',
    birthYear: 1978,
    occupation: 'Finance director',
    planLabel: 'Pre-retirement transition plan',
    monthlySalary: 6800,
    monthlyHousehold: 3400,
    notes: 'Children in university; mortgage ends 2032; ISA and pension top-ups.',
  },
  {
    firstName: 'Elena',
    lastName: 'Romano',
    birthYear: 1992,
    occupation: 'Secondary school teacher',
    planLabel: 'Family security plan',
    monthlySalary: 3100,
    monthlyHousehold: 2100,
    notes: 'Stable public-sector income; building emergency fund and pension contributions.',
  },
  {
    firstName: 'Alessandro',
    lastName: 'Conti',
    birthYear: 1988,
    occupation: 'Product designer',
    planLabel: 'Flexible career plan',
    monthlySalary: 4200,
    monthlyHousehold: 2450,
    notes: 'Freelance side income ~€800/mo; saving for sabbatical at age 45.',
  },
  {
    firstName: 'Francesca',
    lastName: 'Gallo',
    birthYear: 1983,
    occupation: 'Pharmacist (own practice)',
    planLabel: 'Business owner succession plan',
    monthlySalary: 5600,
    monthlyHousehold: 3200,
    notes: 'Practice valuation and partner buy-out scenario under review.',
  },
  {
    firstName: 'Matteo',
    lastName: 'Russo',
    birthYear: 1995,
    occupation: 'Software developer',
    planLabel: 'Early career wealth plan',
    monthlySalary: 3800,
    monthlyHousehold: 1900,
    notes: 'Renting in Milan; monthly ETF savings €600; no dependants.',
  },
  {
    firstName: 'Chiara',
    lastName: 'Marini',
    birthYear: 1980,
    occupation: 'HR director',
    planLabel: 'Mid-life financial review',
    monthlySalary: 5900,
    monthlyHousehold: 3100,
    notes: 'Recently divorced; revising retirement age and property downsizing options.',
  },
]);

const PLAN_LABELS_MULTI = Object.freeze([
  'Primary financial plan',
  'Retirement income scenario',
  'Property & mortgage plan',
  'Education funding plan',
]);

const TIMELINE_GOAL_MATCHERS = Object.freeze([
  { keywords: ['retire', 'pension', 'retirement'], targetAge: 67, oneOff: true },
  { keywords: ['university', 'education', 'college', 'study'], targetAge: 52, oneOff: true },
  { keywords: ['home', 'house', 'property', 'mortgage', 'purchase'], targetAge: 38, oneOff: true },
  { keywords: ['wedding', 'marriage'], targetAge: 32, oneOff: true },
]);

const ASSET_PRESETS = Object.freeze([
  {
    category: 2,
    name: 'Global equity ETF portfolio',
    description: 'Diversified MSCI World tracker in tax-advantaged wrapper',
    valueBase: 85000,
  },
  {
    category: 1,
    name: 'Primary residence (net equity)',
    description: 'Estimated net equity after mortgage on main home',
    valueBase: 320000,
  },
  {
    category: 3,
    name: 'Employer pension fund',
    description: 'Defined-contribution workplace pension pot',
    valueBase: 145000,
  },
]);

const LIABILITY_PRESETS = Object.freeze([
  {
    type: 'Mortgage',
    name: 'Primary residence mortgage',
    description: 'Fixed-rate home loan on main residence',
    outstandingBase: 145000,
  },
  {
    type: 'Loan',
    name: 'Car finance agreement',
    description: 'Personal contract purchase on family vehicle',
    outstandingBase: 12000,
  },
]);

function hashTag(tag) {
  let h = 0;
  const s = String(tag || '');
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * @param {string} clientTag
 * @param {number} clientIndex
 * @param {number} [planIndex]
 * @returns {VolumePersona}
 */
export function selectPersonaForClient(clientTag, clientIndex, planIndex = 0) {
  const personas = VOLUME_CLIENT_PERSONAS;
  const idx = (hashTag(clientTag) + clientIndex * 7 + planIndex * 3) % personas.length;
  return personas[idx];
}

/**
 * @param {VolumePersona} persona
 * @param {number} planIndex
 * @param {number} planCount
 */
export function planTitleForPersona(persona, planIndex, planCount) {
  if (planCount <= 1) return persona.planLabel;
  const label = PLAN_LABELS_MULTI[planIndex % PLAN_LABELS_MULTI.length];
  return `${label} — ${persona.firstName} ${persona.lastName}`;
}

/**
 * @param {number} birthYear
 * @returns {string}
 */
export function birthDateIsoFromYear(birthYear) {
  const y = Number(birthYear) || 1985;
  return `${y}-06-15T00:00:00.000Z`;
}

export function parseBirthYearFromIso(birthIso) {
  if (!birthIso) return 1985;
  const m = String(birthIso).match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : 1985;
}

export function ageYearAtAge(birthYear, age) {
  const a = Math.max(0, Math.floor(Number(age) || 0));
  return { age: a, year: birthYear + a };
}

/**
 * Patch client model fields for a realistic profile while keeping uniqueTag in last name for cleanup.
 * @param {object} model
 * @param {{ persona: VolumePersona, uniqueTag: string }} ctx
 */
export function applyRealisticClientProfile(model, ctx) {
  const { persona, uniqueTag } = ctx;
  const tag = String(uniqueTag).replace(/\s+/g, '');
  const out = JSON.parse(JSON.stringify(model || {}));
  out.ClientDetails = out.ClientDetails || {};
  out.ClientDetails.FirstName = persona.firstName;
  out.ClientDetails.LastName = `${persona.lastName}-${tag}`;
  out.ClientDetails.BirthDate = birthDateIsoFromYear(persona.birthYear);
  out.ClientDetails.PreferredCurrency = out.ClientDetails.PreferredCurrency || 'EUR';
  out.ClientDetails.Country = out.ClientDetails.Country || 'IT';
  out.ClientDetails.InflationRate = out.ClientDetails.InflationRate ?? 2.5;
  out.Notes = `${persona.notes} | volume-seed ${tag}`.slice(0, 500);
  return out;
}

export function buildRealisticCashflowBody({
  clientId,
  clientName,
  advisorSub,
  advisorName,
  planName,
  clientBirthDateIso,
  persona,
}) {
  return {
    name: planName,
    planDuration: 40,
    inflationRate: 2.5,
    description: `${persona.planLabel} for ${persona.occupation} (${persona.firstName} ${persona.lastName}).`,
    clientBirthDate: clientBirthDateIso,
    client: { id: clientId, name: clientName },
    financialAdvisor: { advisorId: advisorSub, advisorName: advisorName || 'Financial advisor' },
  };
}

export function volumeSeedMarker(clientTag, planIndex = 0) {
  const tag = String(clientTag || 'seed').replace(/\s+/g, '');
  return `vol-${tag}-p${planIndex}`;
}

function lineDescription(label, marker) {
  return `${label} [${marker}]`;
}

/**
 * Params for **`buildMinimalIncomeLineItem`** (cashflows-income screen).
 * @returns {object[]}
 */
export function buildRealisticIncomeLineItemParams({ persona, birthYear, planIndex, clientTag }) {
  const marker = volumeSeedMarker(clientTag, planIndex);
  const bump = (planIndex % 3) * 150;
  const salary = persona.monthlySalary + bump;
  const startAge = Math.max(22, new Date().getFullYear() - birthYear - 5);
  const startYear = birthYear + startAge;
  const bonus = Math.round(salary * 0.08);
  return [
    {
      description: lineDescription(`Primary salary — ${persona.occupation}`, marker),
      amount: salary,
      startAge,
      startYear,
      endAge: 65,
      endYear: birthYear + 65,
    },
    {
      description: lineDescription(`Annual performance bonus (${persona.firstName} ${persona.lastName})`, marker),
      amount: bonus,
      startAge: Math.max(startAge, 28),
      startYear: birthYear + Math.max(startAge, 28),
      endAge: 65,
      endYear: birthYear + 65,
    },
  ];
}

/**
 * Params for **`buildMinimalExpenseLineItem`** (cashflows-finances screen).
 * @returns {object[]}
 */
export function buildRealisticExpenseLineItemParams({ persona, birthYear, planIndex, clientTag }) {
  const marker = volumeSeedMarker(clientTag, planIndex);
  const bump = (planIndex % 4) * 80;
  const household = persona.monthlyHousehold + bump;
  const startAge = Math.max(22, new Date().getFullYear() - birthYear - 3);
  const startYear = birthYear + startAge;
  const insurance = Math.round(household * 0.12);
  return [
    {
      description: lineDescription('Household living costs (housing, utilities, food)', marker),
      amount: household,
      startAge,
      startYear,
      endAge: 90,
      endYear: birthYear + 90,
    },
    {
      description: lineDescription('Home insurance and property maintenance', marker),
      amount: insurance,
      startAge,
      startYear,
      endAge: 90,
      endYear: birthYear + 90,
    },
  ];
}

/** @deprecated use buildRealisticIncomeLineItemParams + buildMinimalIncomeLineItem */
export function buildRealisticIncomeLine({ persona, birthYear, planIndex, clientTag = 'seed' }) {
  const p = buildRealisticIncomeLineItemParams({ persona, birthYear, planIndex, clientTag })[0];
  const start = ageYearAtAge(birthYear, p.startAge);
  const end = ageYearAtAge(birthYear, p.endAge);
  return {
    description: p.description,
    amount: { amount: p.amount, currencySymbol: '€' },
    start,
    end,
    isCash: false,
    isFinance: false,
    isDefault: false,
    isIncomeExpenseSource: false,
    isDisplayOnly: false,
  };
}

/** @deprecated use buildRealisticExpenseLineItemParams + buildMinimalExpenseLineItem */
export function buildRealisticExpenseLine({ persona, birthYear, planIndex, clientTag = 'seed' }) {
  const p = buildRealisticExpenseLineItemParams({ persona, birthYear, planIndex, clientTag })[0];
  const start = ageYearAtAge(birthYear, p.startAge);
  const end = ageYearAtAge(birthYear, p.endAge);
  return {
    description: p.description,
    amount: { amount: p.amount, currencySymbol: '€' },
    start,
    end,
    isCash: false,
    isFinance: false,
    isDefault: false,
    isIncomeExpenseSource: false,
    isDisplayOnly: false,
  };
}

export function buildRealisticWealthAsset({ persona, planIndex, clientTag }) {
  const preset = ASSET_PRESETS[planIndex % ASSET_PRESETS.length];
  const skew = (hashTag(clientTag) % 5000) + planIndex * 2500;
  const marker = volumeSeedMarker(clientTag, planIndex);
  return {
    category: preset.category,
    name: preset.name,
    description: `${preset.description} — ${persona.firstName} ${persona.lastName} [${marker}]`,
    value: preset.valueBase + skew,
    ownership: planIndex % 2,
  };
}

export function buildRealisticWealthLiability({ persona, planIndex, clientTag }) {
  const preset = LIABILITY_PRESETS[planIndex % LIABILITY_PRESETS.length];
  const skew = (hashTag(clientTag) % 3000) + planIndex * 1000;
  const marker = volumeSeedMarker(clientTag, planIndex);
  return {
    type: preset.type,
    name: preset.name,
    description: `${preset.description} — ${persona.firstName} ${persona.lastName} [${marker}]`,
    outstanding: preset.outstandingBase + skew,
    ownership: planIndex % 2,
  };
}

/**
 * @param {object[]} defaultEvents
 * @param {number} birthYear
 * @returns {object[]}
 */
export function pickTimelineEventsFromDefaults(defaultEvents, birthYear) {
  if (!Array.isArray(defaultEvents) || defaultEvents.length === 0) return [];

  function norm(row) {
    if (!row || typeof row !== 'object') return null;
    const name = row.name != null ? String(row.name) : row.Name != null ? String(row.Name) : '';
    const behaviorKey =
      row.behaviorKey != null
        ? String(row.behaviorKey)
        : row.BehaviorKey != null
          ? String(row.BehaviorKey)
          : '';
    const type = row.type != null ? row.type : row.Type != null ? row.Type : 2;
    return { name, behaviorKey, type, raw: row };
  }

  const rows = defaultEvents.map(norm).filter(Boolean);
  const picked = [];
  const used = new Set();

  for (let mi = 0; mi < TIMELINE_GOAL_MATCHERS.length && picked.length < 2; mi++) {
    const matcher = TIMELINE_GOAL_MATCHERS[mi];
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const blob = `${row.name} ${row.behaviorKey}`.toLowerCase();
      const key = row.behaviorKey || row.name;
      if (used.has(key)) continue;
      const hit = matcher.keywords.some((kw) => blob.includes(kw));
      if (!hit) continue;
      used.add(key);
      picked.push(
        buildTimelineClientEventFromTemplate(row.raw, {
          birthYear,
          targetAge: matcher.targetAge,
          oneOff: matcher.oneOff,
        }),
      );
      break;
    }
  }

  if (picked.length < 2) {
    for (let ri = 0; ri < rows.length && picked.length < 2; ri++) {
      const row = rows[ri];
      const key = row.behaviorKey || row.name;
      if (!key || used.has(key)) continue;
      used.add(key);
      picked.push(
        buildTimelineClientEventFromTemplate(row.raw, {
          birthYear,
          targetAge: 40 + picked.length * 12,
          oneOff: true,
        }),
      );
    }
  }

  return picked;
}

/**
 * @param {object} template
 * @param {{ birthYear: number, targetAge: number, oneOff?: boolean }} opts
 */
export function buildTimelineClientEventFromTemplate(template, opts) {
  const birthYear = Number(opts.birthYear) || 1985;
  const targetAge = Math.max(18, Math.min(90, Number(opts.targetAge) || 65));
  const start = ageYearAtAge(birthYear, targetAge);
  const end = opts.oneOff ? start : ageYearAtAge(birthYear, Math.min(90, targetAge + 5));
  const name = template.name != null ? template.name : template.Name;
  const behaviorKey =
    template.behaviorKey != null ? template.behaviorKey : template.BehaviorKey;
  const type = template.type != null ? template.type : template.Type != null ? template.Type : 2;
  const isDefault = template.isDefault != null ? template.isDefault : template.IsDefault;
  const isCash = template.isCash != null ? template.isCash : template.IsCash;
  const isFinance = template.isFinance != null ? template.isFinance : template.IsFinance;

  const body = {
    behaviorKey: behaviorKey != null ? String(behaviorKey) : undefined,
    name: name != null ? String(name) : 'Life event',
    type,
    isDefault: isDefault === true,
    isOneOff: opts.oneOff !== false,
    isPlaceHolder: false,
    isCash: isCash === true,
    isFinance: isFinance !== false,
    start,
    end,
  };

  if (type === 1 || type === 2) {
    body.netAmount = { amount: type === 1 ? 15000 : 8000, currencySymbol: '€' };
  }

  return body;
}

/**
 * @param {object} financialJson
 * @returns {{ incomeCount: number, expenseCount: number }}
 */
export function countFinancialLines(financialJson) {
  if (!financialJson || typeof financialJson !== 'object') {
    return { incomeCount: 0, expenseCount: 0 };
  }
  const incomes = financialJson.incomes != null ? financialJson.incomes : financialJson.Incomes;
  const expenses = financialJson.expenses != null ? financialJson.expenses : financialJson.Expenses;
  return {
    incomeCount: Array.isArray(incomes) ? incomes.length : 0,
    expenseCount: Array.isArray(expenses) ? expenses.length : 0,
  };
}

/**
 * @param {object} fundsJson FundTransactionModel from GET …/funds
 * @returns {{ contributionCount: number, withdrawalCount: number }}
 */
export function countFundTransactions(fundsJson) {
  if (!fundsJson || typeof fundsJson !== 'object') {
    return { contributionCount: 0, withdrawalCount: 0 };
  }
  const contributions =
    fundsJson.contributions != null ? fundsJson.contributions : fundsJson.Contributions;
  const withdrawals = fundsJson.withdrawals != null ? fundsJson.withdrawals : fundsJson.Withdrawals;
  return {
    contributionCount: Array.isArray(contributions) ? contributions.length : 0,
    withdrawalCount: Array.isArray(withdrawals) ? withdrawals.length : 0,
  };
}

/**
 * Params for **`buildMinimalFundTransactionLineItem`** (contributions).
 * @returns {object[]}
 */
export function buildRealisticContributionLineItemParams({
  persona,
  birthYear,
  planIndex,
  clientTag,
  savingPotId,
}) {
  const marker = volumeSeedMarker(clientTag, planIndex);
  const startAge = Math.max(25, new Date().getFullYear() - birthYear - 4);
  const startYear = birthYear + startAge;
  const monthly = Math.round(persona.monthlySalary * 0.12 + planIndex * 25);
  const lumpSum = Math.round(persona.monthlySalary * 2.5);
  const rows = [
    {
      description: lineDescription(`Monthly pension contribution — ${persona.firstName} ${persona.lastName}`, marker),
      amount: monthly,
      startAge,
      startYear,
      endAge: 65,
      endYear: birthYear + 65,
      contributionType: 1,
      associatedSavingPotId: savingPotId || undefined,
    },
    {
      description: lineDescription('Annual ISA top-up (lump sum)', marker),
      amount: lumpSum,
      startAge: Math.max(startAge, 30),
      startYear: birthYear + Math.max(startAge, 30),
      endAge: 65,
      endYear: birthYear + 65,
      contributionType: 2,
    },
  ];
  return rows;
}

/**
 * Params for **`buildMinimalFundTransactionLineItem`** (withdrawals).
 * @returns {object[]}
 */
export function buildRealisticWithdrawalLineItemParams({ persona, birthYear, planIndex, clientTag, savingPotId }) {
  const marker = volumeSeedMarker(clientTag, planIndex);
  const drawdownAge = 67;
  const drawdownYear = birthYear + drawdownAge;
  const monthlyDraw = Math.round(persona.monthlySalary * 0.45 + planIndex * 40);
  const oneOff = Math.round(persona.monthlyHousehold * 6);
  return [
    {
      description: lineDescription(`Retirement income drawdown from age ${drawdownAge}`, marker),
      amount: monthlyDraw,
      startAge: drawdownAge,
      startYear: drawdownYear,
      endAge: 90,
      endYear: birthYear + 90,
      contributionType: 1,
      associatedSavingPotId: savingPotId || undefined,
    },
    {
      description: lineDescription('One-off capital withdrawal (home improvement)', marker),
      amount: oneOff,
      startAge: Math.max(55, drawdownAge - 5),
      startYear: birthYear + Math.max(55, drawdownAge - 5),
      endAge: Math.max(55, drawdownAge - 5),
      endYear: birthYear + Math.max(55, drawdownAge - 5),
      contributionType: 3,
    },
  ];
}
