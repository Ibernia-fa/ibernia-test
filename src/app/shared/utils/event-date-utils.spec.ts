import { isEventValue, extractEventId, resolveYear } from './event-date-utils';

describe('event-date-utils', () => {
  const eventsList = [
    { id: 'evt-1', name: 'Retirement', start: { age: 64, year: 2050 } },
    { id: 'evt-2', name: 'Birth', start: { age: 0, year: 2025 } },
  ];

  describe('isEventValue', () => {
    it('returns true for event-prefixed strings', () => {
      expect(isEventValue('event:evt-1')).toBe(true);
      expect(isEventValue('event:abc-123')).toBe(true);
    });

    it('returns false for plain numbers', () => {
      expect(isEventValue(2030)).toBe(false);
    });

    it('returns false for non-prefixed strings', () => {
      expect(isEventValue('2030')).toBe(false);
      expect(isEventValue('evt-1')).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isEventValue(null)).toBe(false);
      expect(isEventValue(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isEventValue('')).toBe(false);
    });
  });

  describe('extractEventId', () => {
    it('extracts the event ID from a prefixed string', () => {
      expect(extractEventId('event:evt-1')).toBe('evt-1');
      expect(extractEventId('event:abc-123')).toBe('abc-123');
    });

    it('returns null for plain numbers', () => {
      expect(extractEventId(2030)).toBeNull();
    });

    it('returns null for non-prefixed strings', () => {
      expect(extractEventId('2030')).toBeNull();
    });

    it('returns null for null/undefined', () => {
      expect(extractEventId(null)).toBeNull();
      expect(extractEventId(undefined)).toBeNull();
    });
  });

  describe('resolveYear', () => {
    it('resolves year from an event reference', () => {
      expect(resolveYear('event:evt-1', eventsList)).toBe(2050);
      expect(resolveYear('event:evt-2', eventsList)).toBe(2025);
    });

    it('returns 0 for a nonexistent event ID', () => {
      expect(resolveYear('event:nonexistent', eventsList)).toBe(0);
    });

    it('passes through plain numbers', () => {
      expect(resolveYear(2030, eventsList)).toBe(2030);
      expect(resolveYear(0, eventsList)).toBe(0);
    });

    it('returns 0 for null/undefined', () => {
      expect(resolveYear(null, eventsList)).toBe(0);
      expect(resolveYear(undefined, eventsList)).toBe(0);
    });

    it('returns 0 for non-numeric non-event strings', () => {
      expect(resolveYear('not-a-number', eventsList)).toBe(0);
    });

    it('works with an empty events list', () => {
      expect(resolveYear('event:evt-1', [])).toBe(0);
      expect(resolveYear(2030, [])).toBe(2030);
    });
  });
});
