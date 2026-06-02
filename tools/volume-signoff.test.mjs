import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSignoffRow,
  buildSignoffRowTemplates,
  applySamplesToRows,
  summarizeShardRows,
  buildSignoffFleetSection,
  loadSignoffConfigFromObject,
  PHASE_A_SIGNOFF_SPECS,
} from '../lib/volume-signoff-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = loadSignoffConfigFromObject(
  JSON.parse(readFileSync(join(__dirname, '..', 'config', 'volume-api-slo.json'), 'utf8')),
);

test('buildSignoffRow computes over and margin', () => {
  const row = buildSignoffRow({
    metric: 'POST /api/v1/Clients',
    kind: 'http',
    budgetMs: 3000,
    maxMs: 8000,
    actualMs: 3500,
    actualLabel: 'max',
  });
  assert.equal(row.over, true);
  assert.equal(row.marginMs, -500);
});

test('Phase A templates use write POST cashflows budget 4000', () => {
  const templates = buildSignoffRowTemplates(PHASE_A_SIGNOFF_SPECS, 'write', config);
  const cashflows = templates.find((r) => r.metric === 'POST /api/v1/cashflows');
  assert.ok(cashflows);
  assert.equal(cashflows.budgetMs, 4000);
});

test('applySamples and fleet section under/over counts', () => {
  const templates = buildSignoffRowTemplates(PHASE_A_SIGNOFF_SPECS, 'write', config);
  const rows = applySamplesToRows(templates, {
    steps: { journey_create_client_duration: 4500 },
    http: { 'POST /api/v1/Clients': 2500 },
  });
  const shard = {
    shardId: 'advisor-00',
    advisorEmail: 'u@test.com',
    rows,
  };
  const summary = summarizeShardRows(rows);
  assert.equal(summary.overBudget >= 1, true);
  const fleet = buildSignoffFleetSection([shard], 1);
  assert.equal(fleet.actualShards, 1);
  assert.ok(fleet.byMetric['journey_create_client_duration']);
});
