import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isK6ManagedClientRow,
  clientNotesFromListRow,
  clientLastNameFromListRow,
  resolvePreRunCleanupEnabledFromEnv,
  resolvePreRunCleanupDeleteAllFromEnv,
} from '../lib/k6-load-cleanup-core.js';

test('isK6ManagedClientRow detects k6 lifecycle notes', () => {
  assert.equal(
    isK6ManagedClientRow({
      notes: 'k6 lifecycle fp1_g0_123 no-partner=1',
      clientDetails: { lastName: 'Smith' },
    }),
    true,
  );
});

test('isK6ManagedClientRow detects realistic fp tag in last name', () => {
  assert.equal(
    isK6ManagedClientRow({
      clientDetails: { lastName: 'Ferrero-fp1_g0_1780403528200' },
    }),
    true,
  );
});

test('isK6ManagedClientRow detects Cli prefix fp tag', () => {
  assert.equal(
    isK6ManagedClientRow({
      clientDetails: { lastName: 'Clifp1_g0_1780394734011' },
    }),
    true,
  );
});

test('isK6ManagedClientRow rejects unrelated client', () => {
  assert.equal(
    isK6ManagedClientRow({
      notes: 'Manual CRM import',
      clientDetails: { lastName: 'Rossi' },
    }),
    false,
  );
});

test('resolvePreRunCleanupEnabledFromEnv defaults on for write profile', () => {
  assert.equal(resolvePreRunCleanupEnabledFromEnv({ VOLUME_SLO_PROFILE: 'write' }), true);
  assert.equal(
    resolvePreRunCleanupEnabledFromEnv({
      VOLUME_SLO_PROFILE: 'write',
      FULL_PLATFORM_PRE_RUN_CLEANUP: '0',
    }),
    false,
  );
});

test('resolvePreRunCleanupDeleteAllFromEnv', () => {
  assert.equal(resolvePreRunCleanupDeleteAllFromEnv({}), false);
  assert.equal(
    resolvePreRunCleanupDeleteAllFromEnv({ FULL_PLATFORM_PRE_RUN_CLEANUP_ALL: '1' }),
    true,
  );
});

test('clientNotesFromListRow supports PascalCase', () => {
  assert.equal(clientNotesFromListRow({ Notes: 'k6 lifecycle x' }), 'k6 lifecycle x');
});

test('clientLastNameFromListRow supports PascalCase', () => {
  assert.equal(clientLastNameFromListRow({ ClientDetails: { LastName: 'Cli-x' } }), 'Cli-x');
});
