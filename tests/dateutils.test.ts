import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTodayStr, getTodayMonth, fix_date, getPrevMonth, getPrevDay, getNextMonth, getNextDay } from '../utils/dateutils';

describe('getTodayStr flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  
  it('getTodayStr(1)', () => {
    const date = new Date(2024, 1, 1, 10);
    vi.setSystemTime(date);
    
    expect(getTodayStr()).toBe('2024-02-01');
  });
  it('getTodayStr(2)', () => {
    const date = new Date(2024, 11, 31, 23, 59, 59);
    vi.setSystemTime(date);
    
    expect(getTodayStr()).toBe('2024-12-31');
  });
});

describe('getTodayMonth flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  
  it('getTodayMonth(1)', () => {
    const date = new Date(2024, 1, 1, 10);
    vi.setSystemTime(date);
    
    expect(getTodayMonth()).toBe('2024-02');
  });
  it('getTodayMonth(2)', () => {
    const date = new Date(2024, 11, 31, 23, 59, 59);
    vi.setSystemTime(date);
    
    expect(getTodayMonth()).toBe('2024-12');
  });
});

describe('fix_date flow', () => {
  it('fix_date(1)', () => {
    expect(fix_date(2024, 1, 32, true)).toBe('2024-02-01');
    expect(fix_date(2024, 1, 2, true)).toBe('2024-01-02');
    expect(fix_date(2023, 3, 2, true)).toBe('2023-03-02');
    expect(fix_date(2023, 4, 31, true)).toBe('2023-05-01');
    expect(fix_date(2023, 5, 32, true)).toBe('2023-06-01');
    expect(fix_date(2023, 12, 32, true)).toBe('2024-01-01');
    expect(fix_date(2023, 12, 31, false)).toBe('2023-12-31');
    expect(fix_date(2024, 3, 0, false)).toBe('2024-02-29');
    expect(fix_date(2023, 3, 0, false)).toBe('2023-02-28');
  });
});

describe('getPrevMonth flow', () => {
  it('getPrevMonth(1)', () => {
    expect(getPrevMonth('2024-01-01')).toBe('2023-12-01');
    expect(getPrevMonth('2024-02-01')).toBe('2024-01-01');
    expect(getPrevMonth('2024-12-01')).toBe('2024-11-01');
    expect(getPrevMonth('2025-01-01')).toBe('2024-12-01');
    expect(getPrevMonth('2024-01-31')).toBe('2023-12-31');
    expect(getPrevMonth('2024-02-29')).toBe('2024-01-29');
    expect(getPrevMonth('2024-12-31')).toBe('2024-11-30');
    expect(getPrevMonth('2025-01-31')).toBe('2024-12-31');
    expect(getPrevMonth('2025-10-31')).toBe('2025-09-30');
  });
});

describe('getPrevDay flow', () => {
  it('getPrevDay(1)', () => {
    expect(getPrevDay('2024-01-01')).toBe('2023-12-31');
    expect(getPrevDay('2024-02-01')).toBe('2024-01-31');
    expect(getPrevDay('2024-12-01')).toBe('2024-11-30');
    expect(getPrevDay('2025-01-01')).toBe('2024-12-31');
    expect(getPrevDay('2024-01-31')).toBe('2024-01-30');
    expect(getPrevDay('2024-02-29')).toBe('2024-02-28');
    expect(getPrevDay('2024-12-31')).toBe('2024-12-30');
    expect(getPrevDay('2025-01-31')).toBe('2025-01-30');
    expect(getPrevDay('2025-10-31')).toBe('2025-10-30');
  });
});

describe('getNextMonth flow', () => {
  it('getNextMonth(1)', () => {
    expect(getNextMonth('2024-01-01')).toBe('2024-02-01');
    expect(getNextMonth('2024-02-01')).toBe('2024-03-01');
    expect(getNextMonth('2024-12-01')).toBe('2025-01-01');
    expect(getNextMonth('2025-01-01')).toBe('2025-02-01');
    expect(getNextMonth('2024-01-31')).toBe('2024-02-29');
    expect(getNextMonth('2024-02-29')).toBe('2024-03-29');
    expect(getNextMonth('2024-12-31')).toBe('2025-01-31');
    expect(getNextMonth('2025-01-31')).toBe('2025-02-28');
    expect(getNextMonth('2025-10-31')).toBe('2025-11-30');
  });
});

describe('getNextDay flow', () => {
  it('getNextDay(1)', () => {
    expect(getNextDay('2024-01-01')).toBe('2024-01-02');
    expect(getNextDay('2024-02-01')).toBe('2024-02-02');
    expect(getNextDay('2024-12-01')).toBe('2024-12-02');
    expect(getNextDay('2025-01-01')).toBe('2025-01-02');
    expect(getNextDay('2024-01-31')).toBe('2024-02-01');
    expect(getNextDay('2024-02-29')).toBe('2024-03-01');
    expect(getNextDay('2024-12-31')).toBe('2025-01-01');
    expect(getNextDay('2025-01-31')).toBe('2025-02-01');
    expect(getNextDay('2025-10-31')).toBe('2025-11-01');
  });
});
