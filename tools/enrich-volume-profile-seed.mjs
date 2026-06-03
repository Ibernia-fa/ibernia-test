#!/usr/bin/env node
/**
 * Enrich a Phase A manifest profile with deterministic seed spec (persona, money in/out,
 * savings, flows, wealth) matching lib/k6-volume-realistic-data.js used during Phase A writes.
 *
 * Usage:
 *   node tools/enrich-volume-profile-seed.mjs [profilePath]
 *     [--run-metadata reports/phase-a/S1-write/run-metadata.json]
 *     [--sync-manifest]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VOLUME_DEFAULT_CASH_POT_LABEL,
  VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
  VOLUME_MONEY_IN_OUT_INCOME_COUNT,
  VOLUME_SAVING_POTS_COUNT,
  VOLUME_TIMELINE_CHIP_COUNT,
  birthDateIsoFromYear,
  buildRealisticCashPotAmount,
  buildRealisticContributionLineItemParams,
  buildRealisticDefaultMoneyInOutAmounts,
  buildRealisticSavingPotPayload,
  buildRealisticWealthAsset,
  buildRealisticWealthLiability,
  buildRealisticWithdrawalLineItemParams,
  buildRealisticClientKeywords,
  resolveRealisticPlanDuration,
  selectPersonaForClient,
  volumeSeedMarker,
} from '../lib/k6-volume-realistic-data.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = {
    profilePath: 'data/scenarios/profile_20u_1c_1p.json',
    runMetadataPath: '',
    syncManifest: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--run-metadata' && argv[i + 1]) {
      args.runMetadataPath = argv[++i];
    } else if (a === '--sync-manifest') {
      args.syncManifest = true;
    } else if (!a.startsWith('-')) {
      args.profilePath = a;
    }
  }
  return args;
}

function readJson(relOrAbs) {
  const p = resolve(ROOT, relOrAbs);
  return JSON.parse(readFileSync(p, 'utf8'));
}

function writeJson(relOrAbs, data) {
  const p = resolve(ROOT, relOrAbs);
  writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return p;
}

function simplifyFlowRows(rows) {
  return (rows || []).map((row) => ({
    description: row.description,
    amount: row.amount,
    startAge: row.startAge,
    startYear: row.startYear,
    endAge: row.endAge,
    endYear: row.endYear,
    contributionType: row.contributionType,
  }));
}

function buildPlanSeedSnapshot(clientTag, clientIndex, planIndex, plansPerClient) {
  const persona = selectPersonaForClient(clientTag, clientIndex, 0);
  const birthYear = persona.birthYear;
  const birthDateIso = birthDateIsoFromYear(birthYear);
  const planDuration = resolveRealisticPlanDuration(birthYear);
  const seedMarker = volumeSeedMarker(clientTag, planIndex);
  const moneyInOut = buildRealisticDefaultMoneyInOutAmounts({ persona, planIndex });
  const cashBalance = buildRealisticCashPotAmount({ persona, planIndex, clientTag });

  const savingPots = [];
  for (let i = 0; i < VOLUME_SAVING_POTS_COUNT; i++) {
    const payload = buildRealisticSavingPotPayload({
      persona,
      planIndex,
      clientTag,
      birthYear,
      planDuration,
      presetIndex: i,
    });
    savingPots.push({
      name: payload.name,
      type: payload.type,
      startingPotValue: payload.startingPotValue?.amount ?? null,
      currencySymbol: payload.startingPotValue?.currencySymbol ?? '€',
    });
  }

  const placeholderPotIds = ['pot-primary', 'pot-secondary'];
  const contributions = buildRealisticContributionLineItemParams({
    persona,
    birthYear,
    planIndex,
    clientTag,
    savingPotIds: placeholderPotIds,
  });
  const withdrawals = buildRealisticWithdrawalLineItemParams({
    persona,
    birthYear,
    planIndex,
    clientTag,
    savingPotIds: placeholderPotIds,
  });

  const asset = buildRealisticWealthAsset({ persona, planIndex, clientTag });
  const liability = buildRealisticWealthLiability({ persona, planIndex, clientTag });

  return {
    planIndex,
    seedMarker,
    planDurationYears: planDuration,
    birthDateIso,
    persona: {
      firstName: persona.firstName,
      lastName: persona.lastName,
      birthYear: persona.birthYear,
      occupation: persona.occupation,
      planLabel: persona.planLabel,
      monthlySalary: persona.monthlySalary,
      monthlyHousehold: persona.monthlyHousehold,
      notes: persona.notes,
    },
    seed: {
      modulesOrder: ['timeline', 'moneyInOut', 'savings', 'finances', 'funds', 'wealth'],
      reportsModule: 'skipped',
      timelineGoalChipCount: VOLUME_TIMELINE_CHIP_COUNT,
      moneyInOut: {
        incomeRowCount: VOLUME_MONEY_IN_OUT_INCOME_COUNT,
        expenseRowCount: VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
        incomes: moneyInOut.incomes,
        expenses: moneyInOut.expenses,
      },
      savings: {
        defaultCashPotLabel: VOLUME_DEFAULT_CASH_POT_LABEL,
        cashBalanceAmount: cashBalance,
        newPotCount: VOLUME_SAVING_POTS_COUNT,
        pots: savingPots,
      },
      flows: {
        contributions: simplifyFlowRows(contributions),
        withdrawals: simplifyFlowRows(withdrawals),
      },
      wealth: {
        asset: {
          name: asset.name,
          category: asset.category,
          value: asset.value,
        },
        liability: {
          name: liability.name,
          type: liability.type,
          outstanding: liability.outstanding,
        },
      },
    },
  };
}

function enrichProfile(manifest, runMeta) {
  const scenario = manifest.validation?.scenario || {};
  const plansPerClient = Number(scenario.plansPerClient) || 1;
  const clientsPerAdvisor = Number(scenario.clientsPerAdvisor) || 1;

  const out = JSON.parse(JSON.stringify(manifest));
  out.reportType = out.reportType || 'phase-a-manifest';
  out.seedSpecVersion = 1;
  out.seedSpecEnrichedAt = new Date().toISOString();

  if (runMeta) {
    out.runBinding = {
      runTag: runMeta.runTag,
      volumeScenario: runMeta.volumeScenario,
      userMode: runMeta.userMode,
      advisors: runMeta.advisors,
      clientsPerAdvisor: runMeta.clientsPerAdvisor,
      plansPerClient: runMeta.plansPerClient,
      runElapsedSec: runMeta.runElapsedSec,
      manifestCollected: runMeta.manifestCollected,
      sloCollected: runMeta.sloCollected,
    };
  }

  out.advisors = (out.advisors || []).map((advisor) => {
    const clients = (advisor.clients || []).map((client, clientIndex) => {
      const clientTag = client.uniqueTag || `advisor-${advisor.shardId}-c${clientIndex}`;
      const persona = selectPersonaForClient(clientTag, clientIndex, 0);
      const enrichedClient = {
        ...client,
        clientTag,
        displayName: `${persona.firstName} ${persona.lastName}`,
        clientKeywords: buildRealisticClientKeywords(persona),
        birthDateIso: birthDateIsoFromYear(persona.birthYear),
        persona: {
          firstName: persona.firstName,
          lastName: persona.lastName,
          birthYear: persona.birthYear,
          occupation: persona.occupation,
        },
        cashflows: (client.cashflows || []).map((cf, planIndex) => ({
          ...cf,
          ...buildPlanSeedSnapshot(clientTag, clientIndex, planIndex, plansPerClient),
        })),
      };
      return enrichedClient;
    });
    return { ...advisor, clients };
  });

  out.seedExpectations = {
    clientsPerAdvisor,
    plansPerClient,
    timelineGoalChipCount: VOLUME_TIMELINE_CHIP_COUNT,
    moneyInOutIncomeRows: VOLUME_MONEY_IN_OUT_INCOME_COUNT,
    moneyInOutExpenseRows: VOLUME_MONEY_IN_OUT_EXPENSE_COUNT,
    savingPotsPerPlan: VOLUME_SAVING_POTS_COUNT,
    reportsSeeded: false,
  };

  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const profileRel = args.profilePath;
  if (!existsSync(resolve(ROOT, profileRel))) {
    console.error(`Profile not found: ${profileRel}`);
    process.exit(1);
  }

  const manifest = readJson(profileRel);
  let runMeta = null;
  if (args.runMetadataPath && existsSync(resolve(ROOT, args.runMetadataPath))) {
    runMeta = readJson(args.runMetadataPath);
  } else if (manifest.runTag) {
    const guess = `reports/phase-a/${manifest.runTag}/run-metadata.json`;
    if (existsSync(resolve(ROOT, guess))) {
      runMeta = readJson(guess);
    }
  }

  const enriched = enrichProfile(manifest, runMeta);
  const outPath = writeJson(profileRel, enriched);
  console.log(`Enriched profile -> ${outPath}`);

  if (args.syncManifest && enriched.runTag) {
    const manifestPath = `reports/phase-a/${enriched.runTag}/manifest.json`;
    if (existsSync(resolve(ROOT, dirname(manifestPath)))) {
      const manifestOut = writeJson(manifestPath, enriched);
      console.log(`Synced manifest -> ${manifestOut}`);
    }
  }
}

main();
