#!/usr/bin/env node
/**
 * Resolve volume scenario counts and metadata for Phase A/B runners.
 *
 * Usage:
 *   node tools/resolve-volume-scenario.mjs [scenarioName] [--clients N] [--plans N] [--advisors N]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseVolumeScenariosConfig,
  resolveVolumeScenario,
} from '../lib/volume-slo-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {
    scenarioName: '',
    scenariosFile: join(__dirname, '..', 'config', 'volume-scenarios.json'),
    clientsPerAdvisor: null,
    plansPerClient: null,
    advisors: null,
    iterations: 1,
  };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' && argv[i + 1]) {
      args.scenariosFile = argv[++i];
    } else if (a === '--clients' && argv[i + 1]) {
      args.clientsPerAdvisor = parseInt(argv[++i], 10);
    } else if (a === '--plans' && argv[i + 1]) {
      args.plansPerClient = parseInt(argv[++i], 10);
    } else if (a === '--advisors' && argv[i + 1]) {
      args.advisors = parseInt(argv[++i], 10);
    } else if (a === '--iterations' && argv[i + 1]) {
      args.iterations = parseInt(argv[++i], 10);
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  if (positional[0]) args.scenarioName = positional[0];
  if (!args.scenarioName) {
    args.scenarioName =
      process.env.VOLUME_SCENARIO || process.env.SCENARIO || process.env.VOLUME_SLO_SCENARIO || '';
  }
  if (args.clientsPerAdvisor == null && process.env.PHASE_A_CLIENTS_PER_ADVISOR) {
    const n = parseInt(process.env.PHASE_A_CLIENTS_PER_ADVISOR, 10);
    if (Number.isFinite(n) && n > 0) args.clientsPerAdvisor = n;
  }
  if (args.plansPerClient == null && process.env.PHASE_A_PLANS_PER_CLIENT) {
    const n = parseInt(process.env.PHASE_A_PLANS_PER_CLIENT, 10);
    if (Number.isFinite(n) && n > 0) args.plansPerClient = n;
  }
  if (args.advisors == null && process.env.PHASE_A_ADVISOR_COUNT) {
    const n = parseInt(process.env.PHASE_A_ADVISOR_COUNT, 10);
    if (Number.isFinite(n) && n > 0) args.advisors = n;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const raw = JSON.parse(readFileSync(args.scenariosFile, 'utf8'));
  const scenariosConfig = parseVolumeScenariosConfig(raw);
  const resolved = resolveVolumeScenario(scenariosConfig, args.scenarioName || undefined);

  let clientsPerAdvisor =
    args.clientsPerAdvisor != null && args.clientsPerAdvisor > 0
      ? args.clientsPerAdvisor
      : resolved.scenario.clientsPerAdvisor != null
        ? Number(resolved.scenario.clientsPerAdvisor)
        : 1;
  let plansPerClient =
    args.plansPerClient != null && args.plansPerClient > 0
      ? args.plansPerClient
      : resolved.scenario.plansPerClient != null
        ? Number(resolved.scenario.plansPerClient)
        : 1;
  let advisors =
    args.advisors != null && args.advisors > 0
      ? args.advisors
      : resolved.scenario.advisors != null && resolved.scenario.advisors > 0
        ? Number(resolved.scenario.advisors)
        : 5;

  clientsPerAdvisor = Math.max(1, Math.floor(clientsPerAdvisor));
  plansPerClient = Math.max(1, Math.floor(plansPerClient));
  advisors = Math.max(1, Math.floor(advisors));
  const iterations = Math.max(1, Math.floor(args.iterations || 1));

  const out = {
    scenarioName: resolved.name,
    profile: resolved.scenario.profile || 'write',
    readOnly: !!resolved.scenario.readOnly,
    advisors,
    clientsPerAdvisor,
    plansPerClient,
    iterations,
    manifestProfileFile: resolved.scenario.manifestProfileFile || null,
    phaseBScenario: resolved.scenario.phaseBScenario || 'phase-b-read-default',
    sloOverridesFile: resolved.scenario.sloOverridesFile || null,
    source: {
      advisors:
        args.advisors != null ? 'cli' : resolved.scenario.advisors != null ? 'scenario' : 'default',
      clientsPerAdvisor:
        args.clientsPerAdvisor != null ? 'cli' : resolved.scenario.clientsPerAdvisor != null ? 'scenario' : 'default',
      plansPerClient:
        args.plansPerClient != null ? 'cli' : resolved.scenario.plansPerClient != null ? 'scenario' : 'default',
    },
  };
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
}

main();
