import {
  calculateBudgetPerPlannedDay,
  calculateBudgetPerRemainingDay,
  calculateCurrentPace,
  calculateRemainingQuota
} from '@/domain/quota';

describe('quota calculations', () => {
  it('calculates remaining quota from consumed value', () => {
    expect(calculateRemainingQuota(37)).toBe(63);
  });

  it('calculates safe budget by remaining days', () => {
    expect(calculateBudgetPerRemainingDay(42, 14)).toBe(3);
  });

  it('calculates safe budget by planned usage days', () => {
    expect(calculateBudgetPerPlannedDay(42, 10)).toBe(4.2);
  });

  it('calculates current pace from elapsed days', () => {
    expect(calculateCurrentPace(27, 9)).toBe(3);
  });

  it('returns zero budgets when denominator is zero', () => {
    expect(calculateBudgetPerRemainingDay(50, 0)).toBe(0);
    expect(calculateBudgetPerPlannedDay(50, 0)).toBe(0);
    expect(calculateCurrentPace(50, 0)).toBe(0);
  });
});
