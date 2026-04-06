/**
 * Punctuation rules for short UI copy (errors, toasts, validation, inline status).
 * Trailing full stops are removed so messages read as UI labels, not formal paragraphs.
 *
 * @see normalizeTranslationKey in the same module — used when loading i18n JSON.
 */

/** Do not strip ellipsis or obvious multi-paragraph content. */
export function stripTrailingPeriodForShortUiMessage(
  text: string | null | undefined,
): string {
  if (text == null) {
    return '';
  }
  const t = text.trim();
  if (t.length === 0 || t.endsWith('...')) {
    return t;
  }
  if (t.length > 220) {
    return t;
  }
  if (t.includes('\n\n')) {
    return t;
  }
  if (!t.endsWith('.')) {
    return t;
  }
  return t.slice(0, -1).trimEnd();
}

/**
 * Keys whose translated *values* are normalized when loading language files.
 * Covers errors, toasts, confirmations, onboarding, notifications, and key LABEL.* UI lines.
 */
export function shouldNormalizeTranslationKey(fullKey: string): boolean {
  if (
    fullKey.includes('DISCLAIMER') ||
    fullKey.includes('TERMS_CONDITIONS') ||
    fullKey.includes('PRIVACY') ||
    fullKey.includes('TOOLTIP') ||
    fullKey.endsWith('.DESCRIPTION')
  ) {
    return false;
  }

  const prefixes = [
    'ERROR.',
    'TOAST.',
    'VALIDATION.',
    'CONFIRM.',
    'FLOWS.',
    'NOTIFICATION.',
    'INCOME_EXPENSE.',
    'INCOME_EXPENSE_LABEL.',
    'PLACEHOLDER.',
    'SCENARIO_LAB.',
    'LABEL.ERROR',
    'LABEL.RETRY',
    'LABEL.DAILY_LIMIT',
    'LABEL.INVALID_DATE',
    'LABEL.GENERATING',
    'LABEL.LOADING_INSIGHTS',
    'LABEL.ANALYSING',
    'LABEL.WHY',
    'LABEL.IMPACT',
    'LABEL.NONE',
  ];

  if (prefixes.some((p) => fullKey.startsWith(p))) {
    return true;
  }
  if (fullKey.startsWith('LABEL.') && fullKey.length < 48) {
    return true;
  }

  /** Short branding / image validation strings (key is the English phrase). */
  const shortPhraseKeys = [
    'Image format not allowed',
    'Image too large',
    'Corrupt or invalid image',
    'Image resized to meet minimum size.',
  ];
  if (shortPhraseKeys.some((k) => fullKey.startsWith(k))) {
    return true;
  }

  return false;
}

export function normalizeTranslationValue(
  fullKey: string,
  value: unknown,
): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (!shouldNormalizeTranslationKey(fullKey)) {
    return value;
  }
  return stripTrailingPeriodForShortUiMessage(value);
}

function walkTranslations(
  obj: Record<string, unknown>,
  prefix: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out[k] = normalizeTranslationValue(fullKey, v);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = walkTranslations(v as Record<string, unknown>, fullKey);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Normalize loaded i18n JSON (nested objects supported). */
export function normalizeTranslationTree(
  data: Record<string, unknown>,
): Record<string, unknown> {
  return walkTranslations(data, '');
}
