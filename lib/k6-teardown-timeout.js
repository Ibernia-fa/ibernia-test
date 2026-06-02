/**
 * k6 default teardownTimeout is 60s — too short when teardown re-logins every pool user sequentially.
 * Override: `-e TEARDOWN_TIMEOUT=20m` or scale via pool size (`TEARDOWN_SEC_PER_USER`, default 12).
 */

const DEFAULT_SEC_PER_USER = 12;
const MIN_SECONDS = 300;

/**
 * @param {number} [userCount] pool / lifecycle row count (for auto scale)
 * @returns {{ teardownTimeout: string }}
 */
export function teardownTimeoutOption(userCount = 0) {
  const explicit = (__ENV.TEARDOWN_TIMEOUT || '').trim();
  if (explicit) {
    return { teardownTimeout: explicit };
  }
  const perUser = Math.max(
    5,
    parseInt((__ENV.TEARDOWN_SEC_PER_USER || String(DEFAULT_SEC_PER_USER)).trim(), 10) ||
      DEFAULT_SEC_PER_USER,
  );
  const n = Math.max(1, userCount || 0);
  const sec = Math.max(MIN_SECONDS, n * perUser);
  return { teardownTimeout: `${sec}s` };
}
