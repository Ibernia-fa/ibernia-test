/**
 * Node tests for journey lag budget resolution (mirrors volume-slo-core paths).
 * Run: node --test tools/k6-journey-metrics.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  applyScenarioToSloConfig,
  parseVolumeSloConfig,
  parseVolumeScenariosConfig,
  resolveStepBudget,
  resolveVolumeScenario,
} from '../lib/volume-slo-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoConfig = parseVolumeSloConfig(
  JSON.parse(readFileSync(join(__dirname, '..', 'config', 'volume-api-slo.json'), 'utf8')),
);
const repoScenarios = parseVolumeScenariosConfig(
  JSON.parse(readFileSync(join(__dirname, '..', 'config', 'volume-scenarios.json'), 'utf8')),
);

function effectiveBudgetForPhaseB(stepName) {
  const { scenario } = resolveVolumeScenario(repoScenarios, 'phase-b-read-default');
  const merged = applyScenarioToSloConfig(repoConfig, scenario);
  return resolveStepBudget(merged, 'read', stepName).budgetMs;
}

test('full_journey_duration uses 15000ms for phase-b-read-default scenario', () => {
  assert.equal(effectiveBudgetForPhaseB('full_journey_duration'), 15000);
});

test('full_journey_duration is not read defaultBudgetMs 2500', () => {
  const budget = effectiveBudgetForPhaseB('full_journey_duration');
  assert.notEqual(budget, 2500);
  assert.ok(budget >= 15000);
});

test('dashboard step budget remains 2500ms for phase-b-read-default', () => {
  assert.equal(effectiveBudgetForPhaseB('journey_dashboard_load_duration'), 2500);
});
