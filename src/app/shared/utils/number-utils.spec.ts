import {
  formatAppDisplayNumber,
  parseFormattedNumber,
  localeFromAppLanguage,
  APP_INPUT_NUMBER_FORMAT,
} from './number-utils';

// ─── helpers ────────────────────────────────────────────────────────────────
/** Simulates what ThousandSeparatorInputDirective.formatNumber does. */
function directiveFormatNumber(raw: string, lang: string): string {
  if (!raw) return '';
  const locale = localeFromAppLanguage(lang);
  const decimal = lang === 'it' ? ',' : '.';
  const [ints, decs] = raw.split('.');
  const intNum = Number(ints);
  const intFmt = isNaN(intNum)
    ? ints
    : intNum.toLocaleString(locale, {
        ...APP_INPUT_NUMBER_FORMAT,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
  return decs !== undefined ? `${intFmt}${decimal}${decs}` : intFmt;
}

/** Simulates what the directive does on each keystroke: strip separators → reformat. */
function simulateDirectiveInput(typedValue: string, lang: string): { raw: string; formatted: string; numeric: number | null } {
  const thousand = lang === 'it' ? '.' : ',';
  const decimal = lang === 'it' ? ',' : '.';

  const raw = typedValue
    .split(thousand).join('')
    .replace(decimal, '.')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1');

  const num = raw === '' || raw === '.' ? null : Number(raw);
  const formatted = directiveFormatNumber(raw, lang);
  return { raw, formatted, numeric: isNaN(Number(num)) ? null : num };
}

// ─── test values ────────────────────────────────────────────────────────────
const DIGIT_CASES = [
  { digits: 4,  value: 1234 },
  { digits: 5,  value: 12345 },
  { digits: 6,  value: 123456 },
  { digits: 7,  value: 1234567 },
  { digits: 8,  value: 12345678 },
  { digits: 9,  value: 123456789 },
  { digits: 10, value: 1234567890 },
];

const EN_EXPECTED: Record<number, string> = {
  1234:       '1,234',
  12345:      '12,345',
  123456:     '123,456',
  1234567:    '1,234,567',
  12345678:   '12,345,678',
  123456789:  '123,456,789',
  1234567890: '1,234,567,890',
};

const IT_EXPECTED: Record<number, string> = {
  1234:       '1.234',
  12345:      '12.345',
  123456:     '123.456',
  1234567:    '1.234.567',
  12345678:   '12.345.678',
  123456789:  '123.456.789',
  1234567890: '1.234.567.890',
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. formatAppDisplayNumber
// ═══════════════════════════════════════════════════════════════════════════
describe('formatAppDisplayNumber', () => {
  describe('English locale', () => {
    test.each(DIGIT_CASES)(
      '$digits-digit integer ($value) → grouped with commas',
      ({ value }) => {
        expect(formatAppDisplayNumber('en', value)).toBe(EN_EXPECTED[value]);
      },
    );
  });

  describe('Italian locale', () => {
    test.each(DIGIT_CASES)(
      '$digits-digit integer ($value) → grouped with dots',
      ({ value }) => {
        expect(formatAppDisplayNumber('it', value)).toBe(IT_EXPECTED[value]);
      },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. parseFormattedNumber — round-trip from formatted string back to number
// ═══════════════════════════════════════════════════════════════════════════
describe('parseFormattedNumber', () => {
  describe('English locale', () => {
    test.each(DIGIT_CASES)(
      '$digits-digit: "$value" formatted as EN string → parses back to $value',
      ({ value }) => {
        const formatted = EN_EXPECTED[value];
        expect(parseFormattedNumber(formatted, 'en')).toBe(value);
      },
    );
  });

  describe('Italian locale', () => {
    test.each(DIGIT_CASES)(
      '$digits-digit: "$value" formatted as IT string → parses back to $value',
      ({ value }) => {
        const formatted = IT_EXPECTED[value];
        expect(parseFormattedNumber(formatted, 'it')).toBe(value);
      },
    );
  });

  describe('numeric passthrough', () => {
    test.each(DIGIT_CASES)(
      '$digits-digit: numeric $value → returns $value unchanged',
      ({ value }) => {
        expect(parseFormattedNumber(value)).toBe(value);
      },
    );
  });

  describe('edge cases', () => {
    it('returns 0 for null',      () => expect(parseFormattedNumber(null as any)).toBe(0));
    it('returns 0 for undefined', () => expect(parseFormattedNumber(undefined as any)).toBe(0));
    it('returns 0 for ""',        () => expect(parseFormattedNumber('')).toBe(0));
    it('returns 0 for "."',       () => expect(parseFormattedNumber('.', 'en')).toBe(0));
    it('returns 0 for NaN',       () => expect(parseFormattedNumber(NaN)).toBe(0));
    it('returns 0 for Infinity',  () => expect(parseFormattedNumber(Infinity)).toBe(0));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Full round-trip: format → parse → same number
// ═══════════════════════════════════════════════════════════════════════════
describe('format → parse round-trip', () => {
  describe.each(['en', 'it'] as const)('%s locale', (lang) => {
    test.each(DIGIT_CASES)(
      '$digits-digit ($value): formatAppDisplayNumber → parseFormattedNumber === original',
      ({ value }) => {
        const formatted = formatAppDisplayNumber(lang, value);
        const parsed = parseFormattedNumber(formatted, lang);
        expect(parsed).toBe(value);
      },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Directive input simulation — typing digit-by-digit
//    Ensures that after each keystroke (4→10 digits) the directive's
//    strip → reformat → parse cycle produces the correct numeric value.
// ═══════════════════════════════════════════════════════════════════════════
describe('ThousandSeparatorInputDirective simulation', () => {
  describe.each(['en', 'it'] as const)('%s locale', (lang) => {
    const expected = lang === 'en' ? EN_EXPECTED : IT_EXPECTED;

    test.each(DIGIT_CASES)(
      '$digits-digit ($value): directive formats correctly and round-trips',
      ({ value }) => {
        const result = simulateDirectiveInput(String(value), lang);
        expect(result.numeric).toBe(value);
        expect(result.formatted).toBe(expected[value]);
      },
    );
  });

  describe('typing 5th digit on a 4-digit formatted value', () => {
    it('EN: "1,234" + "5" at end → parses as 12345', () => {
      // User has "1,234" and types "5" at the end → browser shows "1,2345"
      const result = simulateDirectiveInput('1,2345', 'en');
      expect(result.numeric).toBe(12345);
      expect(result.formatted).toBe('12,345');
    });

    it('IT: "1.234" + "5" at end → parses as 12345', () => {
      const result = simulateDirectiveInput('1.2345', 'it');
      expect(result.numeric).toBe(12345);
      expect(result.formatted).toBe('12.345');
    });
  });

  describe('typing 6th digit on a 5-digit formatted value', () => {
    it('EN: "12,345" + "6" at end → parses as 123456', () => {
      const result = simulateDirectiveInput('12,3456', 'en');
      expect(result.numeric).toBe(123456);
      expect(result.formatted).toBe('123,456');
    });

    it('IT: "12.345" + "6" at end → parses as 123456', () => {
      const result = simulateDirectiveInput('12.3456', 'it');
      expect(result.numeric).toBe(123456);
      expect(result.formatted).toBe('123.456');
    });
  });

  describe('typing 7th digit on a 6-digit formatted value', () => {
    it('EN: "123,456" + "7" at end → parses as 1234567', () => {
      const result = simulateDirectiveInput('123,4567', 'en');
      expect(result.numeric).toBe(1234567);
      expect(result.formatted).toBe('1,234,567');
    });

    it('IT: "123.456" + "7" at end → parses as 1234567', () => {
      const result = simulateDirectiveInput('123.4567', 'it');
      expect(result.numeric).toBe(1234567);
      expect(result.formatted).toBe('1.234.567');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. parseFormattedNumber on the *formatted output* of the directive
//    This is exactly what (input)="onAmountInput($event.target.value)" does:
//    the directive reformats, then the component handler parses the result.
// ═══════════════════════════════════════════════════════════════════════════
describe('parseFormattedNumber on directive-formatted output', () => {
  describe.each(['en', 'it'] as const)('%s locale', (lang) => {
    test.each(DIGIT_CASES)(
      '$digits-digit ($value): directive output parses correctly via parseFormattedNumber',
      ({ value }) => {
        const { formatted } = simulateDirectiveInput(String(value), lang);
        const parsed = parseFormattedNumber(formatted, lang);
        expect(parsed).toBe(value);
      },
    );
  });

  describe('after typing an extra digit (intermediate states)', () => {
    const intermediates = [
      { prev: '1,234',       typed: '1,2345',       lang: 'en' as const, expected: 12345 },
      { prev: '12,345',      typed: '12,3456',      lang: 'en' as const, expected: 123456 },
      { prev: '123,456',     typed: '123,4567',     lang: 'en' as const, expected: 1234567 },
      { prev: '1,234,567',   typed: '1,234,5678',   lang: 'en' as const, expected: 12345678 },
      { prev: '12,345,678',  typed: '12,345,6789',  lang: 'en' as const, expected: 123456789 },
      { prev: '1.234',       typed: '1.2345',       lang: 'it' as const, expected: 12345 },
      { prev: '12.345',      typed: '12.3456',      lang: 'it' as const, expected: 123456 },
      { prev: '123.456',     typed: '123.4567',     lang: 'it' as const, expected: 1234567 },
      { prev: '1.234.567',   typed: '1.234.5678',   lang: 'it' as const, expected: 12345678 },
      { prev: '12.345.678',  typed: '12.345.6789',  lang: 'it' as const, expected: 123456789 },
    ];

    test.each(intermediates)(
      '$lang: "$typed" (typing on "$prev") → directive parses $expected, reformats, then parseFormattedNumber agrees',
      ({ typed, lang, expected }) => {
        const { numeric, formatted } = simulateDirectiveInput(typed, lang);
        expect(numeric).toBe(expected);
        expect(parseFormattedNumber(formatted, lang)).toBe(expected);
      },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. DefaultValueAccessor conflict — the actual runtime bug
//    Angular's DefaultValueAccessor also handles the input event and sets
//    the FormControl value to the RAW string (e.g. "1,2345"). If formatView
//    receives this string, Number("1,2345") = NaN and the input breaks.
//    parseFormattedNumber must handle these raw strings correctly.
// ═══════════════════════════════════════════════════════════════════════════
describe('DefaultValueAccessor string conflict', () => {
  describe('raw formatted strings must survive Number() coercion or be parsed', () => {
    const dvaStrings = [
      { raw: '1,234',         lang: 'en' as const, expected: 1234,       desc: 'EN 4-digit with comma' },
      { raw: '12,345',        lang: 'en' as const, expected: 12345,      desc: 'EN 5-digit with comma' },
      { raw: '123,456',       lang: 'en' as const, expected: 123456,     desc: 'EN 6-digit with comma' },
      { raw: '1,234,567',     lang: 'en' as const, expected: 1234567,    desc: 'EN 7-digit with commas' },
      { raw: '12,345,678',    lang: 'en' as const, expected: 12345678,   desc: 'EN 8-digit with commas' },
      { raw: '123,456,789',   lang: 'en' as const, expected: 123456789,  desc: 'EN 9-digit with commas' },
      { raw: '1,234,567,890', lang: 'en' as const, expected: 1234567890, desc: 'EN 10-digit with commas' },
      { raw: '1.234',         lang: 'it' as const, expected: 1234,       desc: 'IT 4-digit with dot' },
      { raw: '12.345',        lang: 'it' as const, expected: 12345,      desc: 'IT 5-digit with dot' },
      { raw: '123.456',       lang: 'it' as const, expected: 123456,     desc: 'IT 6-digit with dot' },
      { raw: '1.234.567',     lang: 'it' as const, expected: 1234567,    desc: 'IT 7-digit with dots' },
      { raw: '12.345.678',    lang: 'it' as const, expected: 12345678,   desc: 'IT 8-digit with dots' },
      { raw: '123.456.789',   lang: 'it' as const, expected: 123456789,  desc: 'IT 9-digit with dots' },
      { raw: '1.234.567.890', lang: 'it' as const, expected: 1234567890, desc: 'IT 10-digit with dots' },
    ];

    describe('Number() fails on these strings (proves the bug exists)', () => {
      test.each(dvaStrings.filter(c => c.raw.includes(',') || (c.raw.match(/\./g) ?? []).length > 1))(
        '$desc: Number("$raw") is NaN',
        ({ raw }) => {
          expect(Number(raw)).toBeNaN();
        },
      );
    });

    describe('parseFormattedNumber handles them correctly (the fix)', () => {
      test.each(dvaStrings)(
        '$desc: parseFormattedNumber("$raw", "$lang") → $expected',
        ({ raw, lang, expected }) => {
          expect(parseFormattedNumber(raw, lang)).toBe(expected);
        },
      );
    });
  });

  describe('intermediate typing states — DVA receives the pre-formatted string', () => {
    const typingStates = [
      { raw: '1,2345',      lang: 'en' as const, expected: 12345,     desc: 'EN: typed 5th digit on "1,234"' },
      { raw: '12,3456',     lang: 'en' as const, expected: 123456,    desc: 'EN: typed 6th digit on "12,345"' },
      { raw: '123,4567',    lang: 'en' as const, expected: 1234567,   desc: 'EN: typed 7th digit on "123,456"' },
      { raw: '1,234,5678',  lang: 'en' as const, expected: 12345678,  desc: 'EN: typed 8th digit on "1,234,567"' },
      { raw: '1.2345',      lang: 'it' as const, expected: 12345,     desc: 'IT: typed 5th digit on "1.234"' },
      { raw: '12.3456',     lang: 'it' as const, expected: 123456,    desc: 'IT: typed 6th digit on "12.345"' },
      { raw: '123.4567',    lang: 'it' as const, expected: 1234567,   desc: 'IT: typed 7th digit on "123.456"' },
      { raw: '1.234.5678',  lang: 'it' as const, expected: 12345678,  desc: 'IT: typed 8th digit on "1.234.567"' },
    ];

    test.each(typingStates)(
      '$desc → parseFormattedNumber("$raw", "$lang") = $expected (not NaN)',
      ({ raw, lang, expected }) => {
        const result = parseFormattedNumber(raw, lang);
        expect(result).toBe(expected);
        expect(result).not.toBeNaN();
      },
    );
  });
});
