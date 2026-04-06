/**
 * Unique names for duplicated (copied) financial plans.
 * Matches i18n LABEL.COPY_OF in en ("Copy of") and it ("Copia di"); add new languages here when translated.
 */

/** Prefixes as stored in plan names: LABEL.COPY_OF value + single space. */
export const PLAN_COPY_OF_NAME_PREFIXES: readonly string[] = [
  'Copy of ',
  'Copia di ',
];

const sortedPrefixes = [...PLAN_COPY_OF_NAME_PREFIXES].sort(
  (a, b) => b.length - a.length,
);

/** Strips a single trailing " (n)" suffix used for numbered copies. */
export function stripTrailingCopyNumberSuffix(name: string): string {
  const t = name.trim();
  const m = /^(.*?)\s+\((\d+)\)$/.exec(t);
  if (!m) return t;
  return m[1].trimEnd();
}

/**
 * Returns the stem plan title used for new copy names: strips any known
 * "Copy of" / "Copia di" prefixes (repeatedly) and a trailing " (n)".
 * So copying "Copy of Piano Uno" or "Copy of Piano Uno (2)" both stem to "Piano Uno".
 */
export function extractPlanStemForCopy(sourcePlanName: string): string {
  let s = sourcePlanName.trim();
  if (!s) return s;
  s = stripTrailingCopyNumberSuffix(s);
  let prev = '';
  while (s !== prev) {
    prev = s;
    for (const prefix of sortedPrefixes) {
      if (s.startsWith(prefix)) {
        s = s.slice(prefix.length).trim();
        break;
      }
    }
  }
  s = stripTrailingCopyNumberSuffix(s);
  return s || sourcePlanName.trim();
}

/**
 * Builds the next unique copy name: "Copy of {stem}", then "Copy of {stem} (2)", etc.
 * `copyOfLabel` is translate.instant('LABEL.COPY_OF') for the active locale.
 * `existingPlanNames` must include every plan name for the client (including the source plan).
 */
export function nextUniqueCopyPlanName(
  sourcePlanName: string,
  existingPlanNames: readonly string[],
  copyOfLabel: string,
): string {
  const stem = extractPlanStemForCopy(sourcePlanName);
  const p = copyOfLabel.trim();
  const base = `${p} ${stem}`.trim();
  const existing = new Set(
    existingPlanNames.map((n) => (n ?? '').trim()).filter(Boolean),
  );
  if (!existing.has(base)) {
    return base;
  }
  let n = 2;
  while (existing.has(`${base} (${n})`)) {
    n += 1;
  }
  return `${base} (${n})`;
}
