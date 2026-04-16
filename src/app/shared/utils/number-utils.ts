/** BCP 47 locale for number formatting from app language (Ibernia: en | it). */
export function localeFromAppLanguage(lang: string | undefined): string {
  return lang === 'it' ? 'it-IT' : 'en-US';
}

/**
 * Display options for amounts across the app (ThousandSeparatorPipe, calculator summaries, inputs).
 * `useGrouping: 'always'` ensures e.g. 1135 → "1.135" in Italian (ICU defaults omit grouping for some 4-digit values).
 */
/** `useGrouping: 'always'` is valid in modern runtimes but not yet in ES2022 typings. */
export const APP_DISPLAY_NUMBER_FORMAT = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: 'always',
} as unknown as Intl.NumberFormatOptions;

/** Input fields keep up to 2 decimals so users can type precise amounts. */
export const APP_INPUT_NUMBER_FORMAT = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  useGrouping: 'always',
} as unknown as Intl.NumberFormatOptions;

export function formatAppDisplayNumber(lang: string | undefined, value: number): string {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(localeFromAppLanguage(lang), APP_DISPLAY_NUMBER_FORMAT).format(value);
}

/**
 * Parses typed/display amounts:
 * - When `lang` is provided, uses exact locale separators (preferred path).
 * - When `lang` is omitted (legacy callers), falls back to heuristic detection.
 */
export function parseFormattedNumber(raw: string | number, lang?: string | null): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;

  const value = String(raw).trim();
  if (value === '') return 0;

  if (lang) {
    const useIt = lang === 'it';
    const thousand = useIt ? '.' : ',';
    const decimal = useIt ? ',' : '.';

    const normalized = value
      .split(thousand).join('')
      .replace(decimal, '.')
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    if (normalized === '' || normalized === '.') return 0;
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Heuristic fallback for callers that don't pass a locale.
  let clean = value.replace(/[^0-9.,]/g, '');
  if (clean === '') return 0;

  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  let decimalSep: '.' | ',' | null = null;
  let thousandSep: '.' | ',' | null = null;

  if (lastDot !== -1 && lastComma !== -1) {
    decimalSep = lastDot > lastComma ? '.' : ',';
    thousandSep = decimalSep === '.' ? ',' : '.';
  } else if (lastDot !== -1) {
    const dotCount = (clean.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      thousandSep = '.';
    } else {
      const digitsAfter = clean.length - lastDot - 1;
      if (digitsAfter === 3 && clean.length > 4) {
        thousandSep = '.';
      } else {
        decimalSep = '.';
      }
    }
  } else if (lastComma !== -1) {
    const commaCount = (clean.match(/,/g) ?? []).length;
    if (commaCount > 1) {
      thousandSep = ',';
    } else {
      const digitsAfter = clean.length - lastComma - 1;
      if (digitsAfter === 3 && clean.length > 4) {
        thousandSep = ',';
      } else {
        decimalSep = ',';
      }
    }
  }

  let normalized = clean;
  if (thousandSep) {
    normalized = normalized.split(thousandSep).join('');
  }
  if (decimalSep && decimalSep !== '.') {
    normalized = normalized.split(decimalSep).join('.');
  }

  if (normalized === '' || normalized === '.') return 0;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default { parseFormattedNumber, formatAppDisplayNumber, localeFromAppLanguage };
