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
  {
    firstName: 'Sofia',
    lastName: 'Valenti',
    birthYear: 1993,
    occupation: 'Marketing manager',
    planLabel: 'Career growth savings plan',
    monthlySalary: 4100,
    monthlyHousehold: 2300,
    notes: 'Saving for property deposit; employer pension match 5%.',
  },
  {
    firstName: 'Andrea',
    lastName: 'Moretti',
    birthYear: 1976,
    occupation: 'Architect',
    planLabel: 'Studio succession plan',
    monthlySalary: 6200,
    monthlyHousehold: 3500,
    notes: 'Owns practice with two associates; reviewing buy-sell agreement funding.',
  },
  {
    firstName: 'Federica',
    lastName: 'Ricci',
    birthYear: 1986,
    occupation: 'Operations manager',
    planLabel: 'Dual-income growth plan',
    monthlySalary: 5100,
    monthlyHousehold: 2800,
    notes: 'Combining household finances; targeting €400k net worth by age 50.',
  },
  {
    firstName: 'Monica',
    lastName: 'Vitale',
    birthYear: 1981,
    occupation: 'Legal counsel',
    planLabel: 'Executive wealth plan',
    monthlySalary: 6400,
    monthlyHousehold: 3300,
    notes: 'Equity compensation and bonus planning; private school fees from 2028.',
  },
  {
    firstName: 'Paolo',
    lastName: 'Neri',
    birthYear: 1974,
    occupation: 'Manufacturing director',
    planLabel: 'Late-career consolidation plan',
    monthlySalary: 7100,
    monthlyHousehold: 3600,
    notes: 'Approaching retirement; evaluating lump-sum pension vs annuity.',
  },
  {
    firstName: 'Claudia',
    lastName: 'Fontana',
    birthYear: 1991,
    occupation: 'UX researcher',
    planLabel: 'Remote work lifestyle plan',
    monthlySalary: 3900,
    monthlyHousehold: 2200,
    notes: 'Location-independent income; building ISA and emergency fund.',
  },
  {
    firstName: 'Roberto',
    lastName: 'Barbieri',
    birthYear: 1984,
    occupation: 'Sales director',
    planLabel: 'Variable income plan',
    monthlySalary: 5500,
    monthlyHousehold: 3000,
    notes: 'Commission-heavy role; smoothing income with monthly savings discipline.',
  },
  {
    firstName: 'Laura',
    lastName: 'Colombo',
    birthYear: 1987,
    occupation: 'Nurse practitioner',
    planLabel: 'Healthcare career plan',
    monthlySalary: 3600,
    monthlyHousehold: 2000,
    notes: 'NHS pension track; additional AVC contributions and mortgage payoff.',
  },
  {
    firstName: 'Davide',
    lastName: 'Greco',
    birthYear: 1994,
    occupation: 'Data analyst',
    planLabel: 'First-time investor plan',
    monthlySalary: 3400,
    monthlyHousehold: 1850,
    notes: 'New to investing; monthly ETF contributions and learning pension basics.',
  },
  {
    firstName: 'Simona',
    lastName: 'Costa',
    birthYear: 1979,
    occupation: 'Restaurant owner',
    planLabel: 'Hospitality business plan',
    monthlySalary: 5800,
    monthlyHousehold: 3100,
    notes: 'Seasonal cash flow; separating business and personal retirement pots.',
  },
  {
    firstName: 'Giuseppe',
    lastName: 'Lombardi',
    birthYear: 1982,
    occupation: 'Civil engineer',
    planLabel: 'Infrastructure career plan',
    monthlySalary: 5300,
    monthlyHousehold: 2750,
    notes: 'Project-based contracts; building buffer for gaps between assignments.',
  },
  {
    firstName: 'Valentina',
    lastName: 'Caruso',
    birthYear: 1996,
    occupation: 'Junior accountant',
    planLabel: 'Qualification pathway plan',
    monthlySalary: 2900,
    monthlyHousehold: 1600,
    notes: 'Studying for chartered status; modest savings while qualification completes.',
  },
]);

const PLAN_LABELS_MULTI = Object.freeze([
  'Primary financial plan',
  'Retirement income scenario',
  'Property & mortgage plan',
  'Education funding plan',
  'Inheritance & legacy plan',
  'Business exit scenario',
  'Career transition plan',
  'Tax optimisation review',
]);

/** Goal types seeded onto the timeline graph — excludes retirement (plan already has one). */
const TIMELINE_SEED_GOAL_MATCHERS = Object.freeze([
  { keywords: ['university', 'education', 'college', 'study'], targetAge: 52, oneOff: true },
  { keywords: ['home', 'house', 'property', 'mortgage', 'purchase'], targetAge: 38, oneOff: true },
  { keywords: ['wedding', 'marriage'], targetAge: 32, oneOff: true },
  { keywords: ['car', 'vehicle', 'auto'], targetAge: 42, oneOff: true },
  { keywords: ['holiday', 'vacation', 'travel', 'sabbatical'], targetAge: 48, oneOff: true },
  { keywords: ['new business', 'business', 'boat'], targetAge: 45, oneOff: true },
  { keywords: ['inherit', 'windfall', 'bonus'], targetAge: 55, oneOff: true },
  { keywords: ['career', 'promotion', 'job'], targetAge: 44, oneOff: false },
]);

/** Default events the platform places automatically — do not POST again during seed. */
export const TIMELINE_SEED_EXCLUDED_BEHAVIOR_KEYS = Object.freeze([
  'retirement_age',
  'birth',
]);

/**
 * @param {{ behaviorKey?: string, name?: string, BehaviorKey?: string, Name?: string }} row
 */
export function isTimelineSeedExcludedEvent(row) {
  if (!row || typeof row !== 'object') return true;
  const key = String(row.behaviorKey ?? row.BehaviorKey ?? '').toLowerCase();
  const name = String(row.name ?? row.Name ?? '').toLowerCase();
  if (TIMELINE_SEED_EXCLUDED_BEHAVIOR_KEYS.some((k) => key === k)) return true;
  if (key.includes('retire') || name.includes('retirement age')) return true;
  if (key === 'birth' || name === 'birth') return true;
  return false;
}

/** Default count of timeline event chips dropped on the plan graph (UI drag from Events palette). */
export const VOLUME_TIMELINE_CHIP_COUNT = 5;

/** Money In & Out — default income rows filled via PUT (Salary, State pension, Inheritance). */
export const VOLUME_MONEY_IN_OUT_INCOME_COUNT = 3;

/** Money In & Out — default expense rows filled via PUT (Living costs, Housing). */
export const VOLUME_MONEY_IN_OUT_EXPENSE_COUNT = 2;

/** API descriptions for plan-default income rows (see Ibernia DefaultIncomes). */
export const VOLUME_DEFAULT_INCOME_LABELS = Object.freeze(['Salary', 'State pension', 'Inheritance']);

/** API descriptions for plan-default expense rows (see Ibernia DefaultExpenses). */
export const VOLUME_DEFAULT_EXPENSE_LABELS = Object.freeze(['Living costs', 'Housing']);

/** Savings tab — new pots added via POST …/saving-pots (excludes default Cash row). */
export const VOLUME_SAVING_POTS_COUNT = 2;

/** Plan-default Cash row label (see Ibernia CreateSavingPotAsync). */
export const VOLUME_DEFAULT_CASH_POT_LABEL = 'Cash';

/** Goal chip ages must be strictly between 10 and 35 (life-goal band on the timeline). */
export const TIMELINE_GOAL_MIN_AGE = 11;

export const TIMELINE_GOAL_MAX_AGE = 34;

/** Ibernia timeline graph default viewport starts around this age (chips below are off-screen). */
export const TIMELINE_UI_VIEWPORT_MIN_AGE = 38;

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

/** SavingPotType.Investment / Other — iconUrl must match a file under /assets/images/svgs/*.svg on dev. */
const SAVING_POT_PRESETS = Object.freeze([
  {
    label: 'Investment portfolio',
    type: 2,
    iconUrl: 'cashflow-investment-icon',
    returnRate: 5.5,
    valueBase: 42000,
  },
  {
    label: 'Other savings',
    type: 4,
    iconUrl: 'wallet-icon',
    returnRate: 2.5,
    valueBase: 8500,
  },
]);

function emptySavingPotCommission() {
  return {
    type: 0,
    amount: { amount: 0, currencySymbol: '€', cycle: { id: '', description: '' } },
    percentage: { amount: 0, currencySymbol: '', cycle: { id: '', description: '' } },
    escalationRate: { description: '', value: 0 },
  };
}

function hashTag(tag) {
  let h = 0;
  const s = String(tag || '');
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Stable volume-seed client email — includes unique clientTag so re-runs can skip duplicates.
 * @param {VolumePersona} persona
 * @param {string} clientTag
 * @param {string} [domain]
 */
export function buildVolumeClientEmail(persona, clientTag, domain) {
  const d = (domain || 'example.com').trim();
  return `${persona.firstName.toLowerCase()}.${persona.lastName.toLowerCase()}.${clientTag}@${d}`.replace(
    /\s+/g,
    '',
  );
}

/**
 * @param {string} clientTag
 * @param {number} clientIndex
 * @param {number} [planIndex]
 * @returns {VolumePersona}
 */
export function selectPersonaForClient(clientTag, clientIndex, planIndex = 0) {
  const personas = VOLUME_CLIENT_PERSONAS;
  // Strip per-client suffix (e.g. fp1_g0_123c2) so advisor-level hash is stable.
  const advisorTag = String(clientTag || '').replace(/c\d+$/, '');
  const base = hashTag(advisorTag);
  // Client identity (planIndex 0): one persona per client slot; avoids period-8 repeats from *3.
  if (planIndex === 0) {
    return personas[(base + clientIndex) % personas.length];
  }
  const idx = (base + clientIndex * 3 + planIndex * 5) % personas.length;
  return personas[idx];
}

/**
 * @param {number} planIndex
 * @param {number} planCount
 * @returns {string|null}
 */
function resolveMultiPlanLabel(planIndex, planCount) {
  if (planCount <= 1) return null;
  const idx = Math.max(0, Math.floor(planIndex));
  return idx < planCount && idx < PLAN_LABELS_MULTI.length
    ? PLAN_LABELS_MULTI[idx]
    : PLAN_LABELS_MULTI[idx % PLAN_LABELS_MULTI.length];
}

/**
 * @param {VolumePersona} persona
 * @param {number} planIndex
 * @param {number} planCount
 */
export function planTitleForPersona(persona, planIndex, planCount) {
  if (planCount <= 1) return persona.planLabel;
  return resolveMultiPlanLabel(planIndex, planCount);
}

/**
 * User-visible plan description — one distinct sentence per plan slot on the same client.
 * @param {VolumePersona} persona
 * @param {number} planIndex
 * @param {number} planCount
 */
export function planDescriptionForPersona(persona, planIndex, planCount) {
  if (planCount <= 1) {
    return `${persona.planLabel} for ${persona.occupation} (${persona.firstName} ${persona.lastName}).`;
  }
  const label = resolveMultiPlanLabel(planIndex, planCount);
  return `${label} for ${persona.occupation} (${persona.firstName} ${persona.lastName}).`;
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

/** Default retirement anchor age used for timeline events and plan horizon. */
export const DEFAULT_RETIREMENT_AGE = 67;

/** Years beyond retirement (or today) the plan must still run — keeps timeline forecastEnd > forecastStart. */
export const PLAN_DURATION_BUFFER_YEARS = 5;

/**
 * Plan duration is years from client birth. Must reach retirement and extend past the reference year
 * so the timeline UI has a valid forecast window (forecastStartDate before forecastEndDate).
 * @param {number} birthYear
 * @param {number} [referenceYear] — defaults to current UTC year (override in tests)
 */
export function resolveRealisticPlanDuration(birthYear, referenceYear) {
  const birth = Number(birthYear) || 1985;
  const ref =
    referenceYear != null && Number.isFinite(Number(referenceYear))
      ? Number(referenceYear)
      : new Date().getUTCFullYear();
  const currentAge = Math.max(0, ref - birth);
  const toRetirementPlusBuffer = DEFAULT_RETIREMENT_AGE + PLAN_DURATION_BUFFER_YEARS;
  const pastReferenceAge = currentAge + PLAN_DURATION_BUFFER_YEARS;
  return Math.max(40, toRetirementPlusBuffer, pastReferenceAge);
}

/**
 * @param {number} birthYear
 * @param {number} planDuration
 * @param {number} [referenceYear]
 */
export function planEndYearFromDuration(birthYear, planDuration, referenceYear) {
  return Number(birthYear) + Number(planDuration);
}

export function ageYearAtAge(birthYear, age) {
  const a = Math.max(0, Math.floor(Number(age) || 0));
  return { age: a, year: birthYear + a };
}

/**
 * Short comma-separated keywords for the client Notes field (UI list column).
 * @param {VolumePersona} persona
 */
export function buildRealisticClientKeywords(persona) {
  const planTopic = String(persona.planLabel || 'Financial plan')
    .replace(/\s+plan$/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
  const role = String(persona.occupation || 'Professional')
    .split(/\s+/)
    .slice(-2)
    .join(' ');
  return `${planTopic}, ${role}, Italy, EUR`;
}

/**
 * Patch client model for a realistic profile — clean display name and short keyword Notes.
 * API GET/PUT use camelCase (`clientDetails`); POST create uses PascalCase — patch both.
 * @param {object} model
 * @param {{ persona: VolumePersona, uniqueTag?: string }} ctx
 */
export function applyRealisticClientProfile(model, ctx) {
  const { persona } = ctx;
  const out = JSON.parse(JSON.stringify(model || {}));
  const birth = birthDateIsoFromYear(persona.birthYear);
  const keywords = buildRealisticClientKeywords(persona);

  const patchDetails = (d) => {
    if (!d || typeof d !== 'object') return;
    d.firstName = persona.firstName;
    d.lastName = persona.lastName;
    d.FirstName = persona.firstName;
    d.LastName = persona.lastName;
    d.birthDate = birth;
    d.BirthDate = birth;
    d.preferredCurrency = d.preferredCurrency || d.PreferredCurrency || 'EUR';
    d.PreferredCurrency = d.preferredCurrency;
    d.country = d.country || d.Country || 'IT';
    d.Country = d.country;
    d.inflationRate = d.inflationRate ?? d.InflationRate ?? 2.5;
    d.InflationRate = d.inflationRate;
  };

  if (out.clientDetails) patchDetails(out.clientDetails);
  if (out.ClientDetails) patchDetails(out.ClientDetails);
  if (!out.clientDetails && !out.ClientDetails) {
    out.clientDetails = {
      firstName: persona.firstName,
      lastName: persona.lastName,
      birthDate: birth,
      preferredCurrency: 'EUR',
      country: 'IT',
      inflationRate: 2.5,
    };
  }

  out.notes = keywords.slice(0, 500);
  out.Notes = out.notes;
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
  planIndex = 0,
  planCount = 1,
}) {
  const birthYear = persona?.birthYear ?? parseBirthYearFromIso(clientBirthDateIso);
  const planDuration = resolveRealisticPlanDuration(birthYear);
  return {
    name: planName,
    planDuration,
    inflationRate: 2.5,
    description: planDescriptionForPersona(persona, planIndex, planCount),
    clientBirthDate: clientBirthDateIso,
    client: { id: clientId, name: clientName },
    financialAdvisor: { advisorId: advisorSub, advisorName: advisorName || 'Financial advisor' },
  };
}

export function volumeSeedMarker(clientTag, planIndex = 0) {
  const tag = String(clientTag || 'seed').replace(/\s+/g, '');
  return `vol-${tag}-p${planIndex}`;
}

/** User-visible flow line label (no k6 volume tag suffix). */
function lineDescription(label) {
  return String(label).trim();
}

function lineAmount(row) {
  if (!row || typeof row !== 'object') return 0;
  const amt = row.amount != null ? row.amount : row.Amount;
  if (!amt || typeof amt !== 'object') return 0;
  const val = amt.amount != null ? amt.amount : amt.Amount;
  return Number(val) || 0;
}

/**
 * Find a financial line on a parsed income-expense/financial record by exact description.
 * @param {object|null} financialRecord
 * @param {'incomes'|'expenses'} kind
 * @param {string} description
 */
export function findFinancialLineByDescription(financialRecord, kind, description) {
  if (!financialRecord || typeof financialRecord !== 'object') return null;
  const key = kind === 'expenses' ? 'expenses' : 'incomes';
  const altKey = key === 'expenses' ? 'Expenses' : 'Incomes';
  const lines = financialRecord[key] != null ? financialRecord[key] : financialRecord[altKey];
  if (!Array.isArray(lines)) return null;
  const want = String(description).trim().toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i];
    const label = row?.description ?? row?.Description;
    if (label != null && String(label).trim().toLowerCase() === want) return row;
  }
  return null;
}

/**
 * Amounts for default Money In & Out rows (PUT existing plan defaults — not POST custom lines).
 * @returns {{ incomes: { description: string, amount: number }[], expenses: { description: string, amount: number }[] }}
 */
export function buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex }) {
  const bump = (planIndex % 3) * 150;
  const salary = persona.monthlySalary + bump;
  const household = persona.monthlyHousehold + (planIndex % 4) * 80;
  return {
    incomes: [
      { description: 'Salary', amount: salary },
      { description: 'State pension', amount: Math.round(salary * 0.38) },
      { description: 'Inheritance', amount: 65000 + planIndex * 5000 },
    ],
    expenses: [
      { description: 'Living costs', amount: Math.round(household * 0.33) },
      { description: 'Housing', amount: Math.round(household * 0.52) },
    ],
  };
}

/** @deprecated use buildRealisticDefaultMoneyInOutAmounts */
export function buildRealisticIncomeLineItemParams({ persona, birthYear, planIndex, clientTag }) {
  const amounts = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex });
  return amounts.incomes.map((row, index) => ({
    lineKey: ['salary', 'state-pension', 'inheritance'][index],
    description: row.description,
    amount: row.amount,
    startAge: 30,
    startYear: birthYear + 30,
    endAge: 65,
    endYear: birthYear + 65,
  }));
}

/** @deprecated use buildRealisticDefaultMoneyInOutAmounts */
export function buildRealisticExpenseLineItemParams({ persona, birthYear, planIndex, clientTag }) {
  const amounts = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex });
  return amounts.expenses.map((row, index) => ({
    lineKey: ['living-cost', 'housing'][index],
    description: row.description,
    amount: row.amount,
    startAge: 30,
    startYear: birthYear + 30,
    endAge: 90,
    endYear: birthYear + 90,
  }));
}

/**
 * Count default income/expense rows with a positive amount on the financial record.
 */
export function countConfiguredDefaultMoneyInOutLines(financialRecord, amountsSpec) {
  const spec = amountsSpec || { incomes: [], expenses: [] };
  let count = 0;
  for (const row of spec.incomes || []) {
    const found = findFinancialLineByDescription(financialRecord, 'incomes', row.description);
    if (found && lineAmount(found) > 0) count += 1;
  }
  for (const row of spec.expenses || []) {
    const found = findFinancialLineByDescription(financialRecord, 'expenses', row.description);
    if (found && lineAmount(found) > 0) count += 1;
  }
  return count;
}

/** @deprecated use buildRealisticDefaultMoneyInOutAmounts + default row PUT */
export function buildRealisticIncomeLine({ persona, birthYear, planIndex, clientTag = 'seed' }) {
  const salary = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex }).incomes[0];
  const start = ageYearAtAge(birthYear, 30);
  const end = ageYearAtAge(birthYear, 65);
  return {
    description: salary.description,
    amount: { amount: salary.amount, currencySymbol: '€' },
    start,
    end,
    isCash: false,
    isFinance: false,
    isDefault: false,
    isIncomeExpenseSource: false,
    isDisplayOnly: false,
  };
}

/** @deprecated use buildRealisticDefaultMoneyInOutAmounts + default row PUT */
export function buildRealisticExpenseLine({ persona, birthYear, planIndex, clientTag = 'seed' }) {
  const living = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex }).expenses[0];
  const start = ageYearAtAge(birthYear, 30);
  const end = ageYearAtAge(birthYear, 90);
  return {
    description: living.description,
    amount: { amount: living.amount, currencySymbol: '€' },
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
 * @returns {{ minAge: number, maxAge: number }}
 */
function resolveTimelineGoalAgeBand(birthYear, planDuration, referenceYear, planSkew = 0, goalCount = 5) {
  const birth = Number(birthYear) || 1985;
  const duration = Math.max(
    40,
    Number(planDuration) || resolveRealisticPlanDuration(birth, referenceYear),
  );
  const ref =
    referenceYear != null && Number.isFinite(Number(referenceYear))
      ? Number(referenceYear)
      : new Date().getUTCFullYear();
  const currentAge = Math.max(0, ref - birth);
  const skew = Math.max(0, Math.floor(Number(planSkew) || 0)) % 3;
  const n = Math.max(1, Math.floor(Number(goalCount) || 1));

  let minAge;
  let maxAge;
  const viewportMin = Math.max(TIMELINE_UI_VIEWPORT_MIN_AGE, currentAge + 1 + skew);
  if (viewportMin <= TIMELINE_GOAL_MAX_AGE && currentAge < TIMELINE_GOAL_MAX_AGE) {
    minAge = Math.max(TIMELINE_GOAL_MIN_AGE, Math.min(currentAge + 1, TIMELINE_GOAL_MAX_AGE - n));
    maxAge = TIMELINE_GOAL_MAX_AGE;
  } else {
    minAge = Math.max(TIMELINE_GOAL_MIN_AGE, viewportMin);
    maxAge = Math.min(duration - 2, minAge + Math.max(12, n * 3));
  }

  maxAge = Math.min(maxAge, duration - 2);
  minAge = Math.max(TIMELINE_GOAL_MIN_AGE, Math.min(minAge, maxAge - 1));
  return { minAge, maxAge };
}

/**
 * Spread goal ages on the visible timeline band (young-life 11–34 when client is under 35,
 * otherwise ahead of today's age), each at a distinct age/year.
 * @param {number} birthYear
 * @param {number} planDuration years from birth to projection end
 * @param {number} count goal chips to place
 * @param {number} [referenceYear] defaults to current UTC year
 * @param {number} [planSkew] optional small offset per plan index
 * @returns {number[]}
 */
export function resolveTimelineGoalAges(birthYear, planDuration, count, referenceYear, planSkew = 0) {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const { minAge, maxAge } = resolveTimelineGoalAgeBand(
    birthYear,
    planDuration,
    referenceYear,
    planSkew,
    n,
  );

  const span = Math.max(1, maxAge - minAge);
  const ages = [];
  for (let i = 0; i < n; i++) {
    let age = minAge + Math.round(((i + 1) * span) / (n + 1));
    age = Math.max(minAge, Math.min(maxAge, age));
    if (ages.includes(age)) {
      let placed = false;
      for (let delta = 1; delta <= span && !placed; delta++) {
        if (age + delta <= maxAge && !ages.includes(age + delta)) {
          age += delta;
          placed = true;
        } else if (age - delta >= minAge && !ages.includes(age - delta)) {
          age -= delta;
          placed = true;
        }
      }
      if (!placed) {
        for (let a = minAge; a <= maxAge; a++) {
          if (!ages.includes(a)) {
            age = a;
            break;
          }
        }
      }
    }
    ages.push(age);
  }
  return ages;
}

/**
 * @param {number} targetAge
 * @param {number} birthYear
 * @param {number} planDuration
 * @param {number} [referenceYear]
 */
export function clampTimelineGoalAge(targetAge, birthYear, planDuration, referenceYear) {
  const { minAge, maxAge } = resolveTimelineGoalAgeBand(
    birthYear,
    planDuration,
    referenceYear,
    0,
    VOLUME_TIMELINE_CHIP_COUNT,
  );
  const age = Math.floor(Number(targetAge) || minAge);
  return Math.max(minAge, Math.min(maxAge, age));
}

/**
 * @param {object[]} defaultEvents
 * @param {number} birthYear client birth year (must match cashflow clientBirthDate)
 * @param {{ maxEvents?: number, planIndex?: number, planDuration?: number, referenceYear?: number }} [options]
 * @returns {object[]}
 */
export function pickTimelineEventsFromDefaults(defaultEvents, birthYear, options) {
  if (!Array.isArray(defaultEvents) || defaultEvents.length === 0) return [];

  const opts = options || {};
  const maxEvents = Math.max(
    1,
    Math.min(8, opts.maxEvents != null ? Number(opts.maxEvents) : VOLUME_TIMELINE_CHIP_COUNT),
  );
  const planSkew = opts.planIndex != null ? Number(opts.planIndex) : 0;
  const planDuration =
    opts.planDuration != null
      ? Number(opts.planDuration)
      : resolveRealisticPlanDuration(birthYear, opts.referenceYear);
  const goalAges = resolveTimelineGoalAges(
    birthYear,
    planDuration,
    maxEvents,
    opts.referenceYear,
    planSkew,
  );

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

  const rows = defaultEvents.map(norm).filter((row) => row && !isTimelineSeedExcludedEvent(row.raw));
  /** @type {{ raw: object, oneOff: boolean }[]} */
  const templates = [];
  const used = new Set();

  for (let mi = 0; mi < TIMELINE_SEED_GOAL_MATCHERS.length && templates.length < maxEvents; mi++) {
    const matcher = TIMELINE_SEED_GOAL_MATCHERS[mi];
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const blob = `${row.name} ${row.behaviorKey}`.toLowerCase();
      const key = row.behaviorKey || row.name;
      if (used.has(key)) continue;
      const hit = matcher.keywords.some((kw) => blob.includes(kw));
      if (!hit) continue;
      used.add(key);
      templates.push({ raw: row.raw, oneOff: matcher.oneOff });
      break;
    }
  }

  for (let ri = 0; ri < rows.length && templates.length < maxEvents; ri++) {
    const row = rows[ri];
    const key = row.behaviorKey || row.name;
    if (!key || used.has(key) || isTimelineSeedExcludedEvent(row.raw)) continue;
    used.add(key);
    templates.push({ raw: row.raw, oneOff: templates.length % 3 !== 2 });
  }

  return templates.map((item, index) =>
    buildTimelineClientEventFromTemplate(item.raw, {
      birthYear,
      targetAge: goalAges[index] ?? goalAges[goalAges.length - 1],
      planDuration,
      referenceYear: opts.referenceYear,
      oneOff: item.oneOff,
    }),
  );
}

/**
 * @param {object|null} timelineJson — GET …/timelines response
 */
export function countTimelineClientEvents(timelineJson) {
  if (!timelineJson || typeof timelineJson !== 'object') return 0;
  const ev = timelineJson.clientEvents != null ? timelineJson.clientEvents : timelineJson.ClientEvents;
  return Array.isArray(ev) ? ev.length : 0;
}

/**
 * @param {object} template
 * @param {{ birthYear: number, targetAge: number, planDuration?: number, referenceYear?: number, oneOff?: boolean }} opts
 */
export function buildTimelineClientEventFromTemplate(template, opts) {
  const birthYear = Number(opts.birthYear) || 1985;
  const planDuration =
    opts.planDuration != null
      ? Number(opts.planDuration)
      : resolveRealisticPlanDuration(birthYear, opts.referenceYear);
  const targetAge =
    opts.planDuration != null || opts.referenceYear != null
      ? clampTimelineGoalAge(opts.targetAge, birthYear, planDuration, opts.referenceYear)
      : Math.max(1, Math.min(planDuration - 2, Math.floor(Number(opts.targetAge) || 1)));
  const start = ageYearAtAge(birthYear, targetAge);
  const end = opts.oneOff ? start : ageYearAtAge(birthYear, Math.min(planDuration - 1, targetAge + 5));
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
 * @param {object|null} savingPotsJson — GET …/saving-pots response
 * @returns {{ totalPots: number, nonCashPots: number, totalSavings: number, cashAmount: number }}
 */
export function countClientSavings(savingPotsJson) {
  if (!savingPotsJson || typeof savingPotsJson !== 'object') {
    return { totalPots: 0, nonCashPots: 0, totalSavings: 0, cashAmount: 0 };
  }
  const rows =
    savingPotsJson.clientSavings != null
      ? savingPotsJson.clientSavings
      : savingPotsJson.ClientSavings;
  const list = Array.isArray(rows) ? rows : [];
  let nonCashPots = 0;
  let cashAmount = 0;
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    const type = row && (row.type != null ? row.type : row.Type);
    if (type != null && Number(type) !== 1) {
      nonCashPots += 1;
      continue;
    }
    const name = row && (row.name != null ? row.name : row.Name);
    if (name != null && String(name).trim() === VOLUME_DEFAULT_CASH_POT_LABEL) {
      cashAmount = readSavingPotStartingAmount(row);
    }
  }
  const totalSavingsRaw =
    savingPotsJson.totalSavings != null ? savingPotsJson.totalSavings : savingPotsJson.TotalSavings;
  return {
    totalPots: list.length,
    nonCashPots,
    totalSavings: Number(totalSavingsRaw) || 0,
    cashAmount,
  };
}

function readSavingPotStartingAmount(row) {
  if (!row || typeof row !== 'object') return 0;
  const spv = row.startingPotValue != null ? row.startingPotValue : row.StartingPotValue;
  if (!spv || typeof spv !== 'object') return 0;
  const val = spv.amount != null ? spv.amount : spv.Amount;
  return Number(val) || 0;
}

/**
 * Clone the plan-default **Cash** row from GET …/saving-pots (for PUT).
 * @param {object|null} savingPotsJson
 * @returns {object|null}
 */
export function findDefaultCashSavingPot(savingPotsJson) {
  if (!savingPotsJson || typeof savingPotsJson !== 'object') return null;
  const rows =
    savingPotsJson.clientSavings != null
      ? savingPotsJson.clientSavings
      : savingPotsJson.ClientSavings;
  if (!Array.isArray(rows)) return null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const type = row && (row.type != null ? row.type : row.Type);
    const name = row && (row.name != null ? row.name : row.Name);
    if (Number(type) === 1 && name != null && String(name).trim() === VOLUME_DEFAULT_CASH_POT_LABEL) {
      try {
        return JSON.parse(JSON.stringify(row));
      } catch {
        return Object.assign({}, row);
      }
    }
  }
  return null;
}

/**
 * Realistic emergency-cash balance for the default Cash pot.
 * @param {{ persona: VolumePersona, planIndex: number, clientTag: string }} p
 */
export function buildRealisticCashPotAmount(p) {
  const skew = hashTag(p.clientTag) % 2500;
  return Math.round(p.persona.monthlyHousehold * 2.5 + p.planIndex * 400 + skew + 2500);
}

/**
 * PUT body for default Cash — updates `startingPotValue.amount` only.
 * @param {object} cashRow clone from {@link findDefaultCashSavingPot}
 * @param {number} amount
 */
export function cashSavingPotWithUpdatedAmount(cashRow, amount) {
  const clone =
    cashRow && typeof cashRow === 'object'
      ? (() => {
          try {
            return JSON.parse(JSON.stringify(cashRow));
          } catch {
            return Object.assign({}, cashRow);
          }
        })()
      : {};
  const spv =
    clone.startingPotValue != null
      ? clone.startingPotValue
      : clone.StartingPotValue != null
        ? clone.StartingPotValue
        : {};
  const currency =
    spv.currencySymbol != null
      ? spv.currencySymbol
      : spv.CurrencySymbol != null
        ? spv.CurrencySymbol
        : '€';
  const cycle = spv.cycle != null ? spv.cycle : spv.Cycle != null ? spv.Cycle : { id: '', description: '' };
  clone.startingPotValue = {
    amount: Number(amount) || 0,
    currencySymbol: String(currency),
    cycle,
  };
  delete clone.StartingPotValue;
  return clone;
}

/**
 * Find a saving pot id by matching `name` substring (most recent match wins).
 * @param {object|null} savingPotsJson
 * @param {string} nameSubstring
 * @returns {string|null}
 */
export function findSavingPotIdByNameSubstring(savingPotsJson, nameSubstring) {
  if (!savingPotsJson || !nameSubstring) return null;
  const sub = String(nameSubstring).trim();
  if (!sub) return null;
  const rows =
    savingPotsJson.clientSavings != null
      ? savingPotsJson.clientSavings
      : savingPotsJson.ClientSavings;
  if (!Array.isArray(rows)) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const name = row && (row.name != null ? row.name : row.Name);
    const id = row && (row.id != null ? row.id : row.Id);
    if (name == null || id == null) continue;
    if (String(name).includes(sub)) return String(id).trim();
  }
  return null;
}

/**
 * UI-facing saving pot name (no volume seed marker suffix).
 * @param {VolumePersona} persona
 * @param {number} presetIndex
 */
export function savingPotDisplayName(persona, presetIndex) {
  const preset = SAVING_POT_PRESETS[presetIndex % SAVING_POT_PRESETS.length];
  return `${preset.label} — ${persona.firstName}`;
}

/**
 * Minimal **ClientSaving** body for POST `/api/v1/cashflows/{cashflowId}/saving-pots`.
 * @param {{ persona: VolumePersona, planIndex: number, clientTag: string, birthYear: number, planDuration?: number, presetIndex: number }} p
 */
export function buildRealisticSavingPotPayload(p) {
  const preset = SAVING_POT_PRESETS[p.presetIndex % SAVING_POT_PRESETS.length];
  const skew = (hashTag(p.clientTag) % 4000) + p.planIndex * 1500 + p.presetIndex * 800;
  const birthYear = Number(p.birthYear) || 1985;
  const planDuration =
    p.planDuration != null ? Number(p.planDuration) : resolveRealisticPlanDuration(birthYear);
  const refYear = new Date().getUTCFullYear();
  const startAge = Math.max(18, refYear - birthYear);
  const endAge = Math.min(planDuration - 1, DEFAULT_RETIREMENT_AGE + 23);
  const inflation = 2.1;
  const returnRate = preset.returnRate;
  const realReturn = Math.round((returnRate - inflation) * 100) / 100;
  const amount = preset.valueBase + skew;

  return {
    id: null,
    name: savingPotDisplayName(p.persona, p.presetIndex),
    type: preset.type,
    iconUrl: preset.iconUrl,
    startingPotValue: {
      amount,
      currencySymbol: '€',
      cycle: { id: '', description: '' },
    },
    nominalValue: 0,
    realValue: 0,
    realGrowthRate: 0,
    inflationRate: inflation,
    returnRate: preset.type === 1 ? 0 : returnRate,
    realReturn: preset.type === 1 ? 0 : realReturn,
    accumulationReturnRate: 0,
    payoutReturnRate: 0,
    hasPotLocked: false,
    start: ageYearAtAge(birthYear, startAge),
    end: ageYearAtAge(birthYear, endAge),
    lockedFrom: { age: 0, year: 0 },
    lockedTill: { age: 0, year: 0 },
    hasCommission: false,
    comission: emptySavingPotCommission(),
    orderNumber: 0,
    isGrowing: false,
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
  savingPotIds,
}) {
  const potIds = Array.isArray(savingPotIds)
    ? savingPotIds.filter((id) => id != null && String(id).trim() !== '')
    : savingPotId
      ? [String(savingPotId).trim()]
      : [];
  const startAge = Math.max(25, new Date().getFullYear() - birthYear - 4);
  const startYear = birthYear + startAge;
  const monthly = Math.round(persona.monthlySalary * 0.12 + planIndex * 25);
  const lumpSum = Math.round(persona.monthlySalary * 2.5);
  const rows = [
    {
      description: lineDescription('Monthly pension contribution'),
      amount: monthly,
      startAge,
      startYear,
      endAge: 65,
      endYear: birthYear + 65,
      contributionType: 1,
      cycleDescription: 'Every month',
      associatedSavingPotId: potIds[0] || undefined,
    },
    {
      description: lineDescription('Annual ISA top-up (lump sum)'),
      amount: lumpSum,
      startAge: Math.max(startAge, 30),
      startYear: birthYear + Math.max(startAge, 30),
      endAge: 65,
      endYear: birthYear + 65,
      contributionType: 2,
      cycleDescription: 'Every year',
      associatedSavingPotId: potIds[1] || potIds[0] || undefined,
    },
  ];
  return rows;
}

/**
 * Params for **`buildMinimalFundTransactionLineItem`** (withdrawals).
 * @returns {object[]}
 */
export function buildRealisticWithdrawalLineItemParams({
  persona,
  birthYear,
  planIndex,
  clientTag,
  savingPotId,
  savingPotIds,
}) {
  const potIds = Array.isArray(savingPotIds)
    ? savingPotIds.filter((id) => id != null && String(id).trim() !== '')
    : savingPotId
      ? [String(savingPotId).trim()]
      : [];
  const drawdownAge = 67;
  const drawdownYear = birthYear + drawdownAge;
  const monthlyDraw = Math.round(persona.monthlySalary * 0.45 + planIndex * 40);
  const oneOff = Math.round(persona.monthlyHousehold * 6);
  return [
    {
      description: lineDescription(`Retirement income drawdown from age ${drawdownAge}`),
      amount: monthlyDraw,
      startAge: drawdownAge,
      startYear: drawdownYear,
      endAge: 90,
      endYear: birthYear + 90,
      isWithdrawal: true,
      contributionType: 0,
      cycleDescription: 'Every month',
      associatedSavingPotId: potIds[0] || undefined,
    },
    {
      description: lineDescription('One-off capital withdrawal (home improvement)'),
      amount: oneOff,
      startAge: Math.max(55, drawdownAge - 5),
      startYear: birthYear + Math.max(55, drawdownAge - 5),
      endAge: Math.max(55, drawdownAge - 5),
      endYear: birthYear + Math.max(55, drawdownAge - 5),
      isWithdrawal: true,
      contributionType: 0,
      cycleDescription: 'One-off',
      associatedSavingPotId: potIds[0] || potIds[1] || undefined,
    },
  ];
}
