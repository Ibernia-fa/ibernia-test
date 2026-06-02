/**
 * Shared concurrency defaults for k6 scripts.
 * Override per run: `-e VUS=100` or `-e K6_DEFAULT_VUS=100`.
 */

const DEFAULT_VUS = 100;

export function parseVus(fallback = DEFAULT_VUS) {
  const raw = String(__ENV.VUS || __ENV.K6_DEFAULT_VUS || fallback).trim();
  const n = parseInt(raw, 10);
  return Math.max(1, Number.isFinite(n) ? n : fallback);
}

/**
 * One VU per pool row when `userCount` is set; otherwise `parseVus()`.
 * Throws if requested VUs exceed leased users (sticky 1:1 mapping).
 */
export function scenarioVusForPool(userCount, scriptTag = 'k6') {
  const requested = parseVus();
  if (userCount == null || userCount <= 0) return requested;
  if (requested > userCount) {
    throw new Error(
      `[${scriptTag}] VUS=${requested} exceeds pool/slice size=${userCount}. ` +
        `Lease more users: pool-cli lease --count ${requested} ...`,
    );
  }
  return Math.min(requested, userCount);
}
