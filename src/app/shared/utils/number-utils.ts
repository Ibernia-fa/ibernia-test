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
  maximumFractionDigits: 2,
  useGrouping: 'always',
} as unknown as Intl.NumberFormatOptions;

export function formatAppDisplayNumber(lang: string | undefined, value: number): string {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat(localeFromAppLanguage(lang), APP_DISPLAY_NUMBER_FORMAT).format(value);
}

/**
 * Parses typed/display amounts using the same rules as {@link ThousandSeparatorInputDirective}:
 * strip grouping for the active locale, normalize decimal to `.`, then parseFloat.
 * Without a correct `lang`, en-style input (`3,3333` while typing) was misparsed as `3.333`.
 */
export function parseFormattedNumber(raw: string | number, lang?: string | null): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;

  const value = String(raw).trim();
  if (value === '') return 0;

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

export default { parseFormattedNumber, formatAppDisplayNumber, localeFromAppLanguage };
