import {
  getAgeInCalendarYear,
  getCompletedYearsAgeAtDate,
  getPlanEndCalendarYear,
  getProjectionColumnAgeLabel,
  getProjectionYears,
} from './client-age-at-reference';

describe('getCompletedYearsAgeAtDate', () => {
  const birth = '1990-07-15';

  it('day before birthday in same year', () => {
    expect(getCompletedYearsAgeAtDate(birth, '2025-07-14')).toBe(34);
  });
  it('on birthday', () => {
    expect(getCompletedYearsAgeAtDate(birth, '2025-07-15')).toBe(35);
  });
  it('day after birthday', () => {
    expect(getCompletedYearsAgeAtDate(birth, '2025-07-16')).toBe(35);
  });
  it('Jan 1 before birthday in year', () => {
    expect(getCompletedYearsAgeAtDate(birth, '2025-01-01')).toBe(34);
  });
  it('EOY after birthday in year', () => {
    expect(getCompletedYearsAgeAtDate(birth, '2025-12-31')).toBe(35);
  });
  it('Feb 29 leap birth on Feb 28 non-leap ref', () => {
    expect(getCompletedYearsAgeAtDate('2000-02-29', '2025-02-28')).toBe(24);
  });
  it('Feb 29 leap birth on Feb 29 leap ref', () => {
    expect(getCompletedYearsAgeAtDate('2000-02-29', '2028-02-29')).toBe(28);
  });
});

describe('getPlanEndCalendarYear', () => {
  it('typical plan', () => {
    expect(getPlanEndCalendarYear('1990-07-15', 90)).toBe(2080);
  });
  it('reject zero duration', () => {
    expect(getPlanEndCalendarYear('1990-01-01', 0)).toBeNull();
  });
  it('reject null duration', () => {
    expect(getPlanEndCalendarYear('1990-01-01', null)).toBeNull();
  });
});

describe('getAgeInCalendarYear', () => {
  it('matches Jan 1 completed age', () => {
    expect(getAgeInCalendarYear('1990-07-15', 2025)).toBe(34);
  });
});

describe('getProjectionYears', () => {
  it('inclusive range', () => {
    const ys = getProjectionYears('2025-01-01', '1990-07-15', 90);
    expect(ys[0]).toBe(2025);
    expect(ys[ys.length - 1]).toBe(2080);
    expect(ys.length).toBe(2080 - 2025 + 1);
  });
});

describe('getProjectionColumnAgeLabel plan-anchored ramp', () => {
  const birth = '1990-07-15';
  const forecast = '2025-04-01';
  const pd = 90;
  const endY = 2080;

  it('plan end year equals plan duration', () => {
    expect(getProjectionColumnAgeLabel(birth, endY, forecast, pd)).toBe(90);
  });
  it('each prior calendar year is exactly one less (no skipped ages)', () => {
    expect(getProjectionColumnAgeLabel(birth, 2079, forecast, pd)).toBe(89);
    expect(getProjectionColumnAgeLabel(birth, 2078, forecast, pd)).toBe(88);
  });
  it('first forecast year age matches plan span (e.g. 35 when 55 years to age 90)', () => {
    expect(getProjectionColumnAgeLabel(birth, 2025, forecast, pd)).toBe(35);
  });
  it('same ramp for DOB 1 October 1990 (birth year drives plan end year)', () => {
    expect(
      getProjectionColumnAgeLabel('1990-10-01', 2025, '2025-04-01', 90),
    ).toBe(35);
    expect(getProjectionColumnAgeLabel('1990-10-01', 2080, '2025-04-01', 90)).toBe(90);
  });
  it('contiguous run 35 through 90 for 2025–2080', () => {
    let last = getProjectionColumnAgeLabel(birth, 2025, forecast, pd);
    expect(last).toBe(35);
    for (let y = 2026; y <= 2080; y++) {
      const next = getProjectionColumnAgeLabel(birth, y, forecast, pd);
      expect(next).toBe(last + 1);
      last = next;
    }
    expect(last).toBe(90);
  });
});
