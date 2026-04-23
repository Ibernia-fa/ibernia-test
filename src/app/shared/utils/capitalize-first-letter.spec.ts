import { capitalizeFirstLetter } from './capitalize-first-letter';

describe('capitalizeFirstLetter', () => {
  it('capitalizes a lowercase first letter', () => {
    expect(capitalizeFirstLetter('matteo')).toBe('Matteo');
  });

  it('capitalizes a lowercase first letter in a multi-word string', () => {
    expect(capitalizeFirstLetter('investment account')).toBe('Investment account');
  });

  it('leaves an already-uppercase first letter unchanged', () => {
    expect(capitalizeFirstLetter('Matteo')).toBe('Matteo');
  });

  it('leaves an all-uppercase string unchanged', () => {
    expect(capitalizeFirstLetter('CUSTOM goal')).toBe('CUSTOM goal');
  });

  it('leaves a string starting with a number unchanged', () => {
    expect(capitalizeFirstLetter('123bond pot')).toBe('123bond pot');
  });

  it('capitalizes after leading whitespace', () => {
    expect(capitalizeFirstLetter('  matteo')).toBe('  Matteo');
  });

  it('handles accented characters', () => {
    expect(capitalizeFirstLetter('àlvaro')).toBe('Àlvaro');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });

  it('returns a whitespace-only string unchanged', () => {
    expect(capitalizeFirstLetter('   ')).toBe('   ');
  });

  it('returns null unchanged', () => {
    expect(capitalizeFirstLetter(null)).toBeNull();
  });

  it('returns undefined unchanged', () => {
    expect(capitalizeFirstLetter(undefined)).toBeUndefined();
  });

  it('handles a single lowercase letter', () => {
    expect(capitalizeFirstLetter('a')).toBe('A');
  });

  it('handles a single uppercase letter', () => {
    expect(capitalizeFirstLetter('A')).toBe('A');
  });

  it('handles ETF portfolio (already uppercase)', () => {
    expect(capitalizeFirstLetter('ETF portfolio')).toBe('ETF portfolio');
  });

  it('handles luisa', () => {
    expect(capitalizeFirstLetter('luisa')).toBe('Luisa');
  });

  it('does not apply title case', () => {
    expect(capitalizeFirstLetter('matteo rossi')).toBe('Matteo rossi');
  });

  it('handles symbols before first letter', () => {
    expect(capitalizeFirstLetter('#tag')).toBe('#tag');
  });

  it('handles special Unicode letters', () => {
    expect(capitalizeFirstLetter('über')).toBe('Über');
    expect(capitalizeFirstLetter('ñoño')).toBe('Ñoño');
  });
});
