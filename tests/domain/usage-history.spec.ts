import {
  buildDailyUsageFromCumulativeHistory,
  buildInterpolatedCumulativeHistory,
  estimateConsumedPercentForDate
} from '@/domain/usage-history';
import type { CycleInfo, UsageHistoryMap } from '@/types/token-tracker';

const cycle: CycleInfo = {
  cycleStart: '2026-04-01',
  resetDate: '2026-04-30',
  quotaPercent: 100
};

describe('usage history interpolation', () => {
  it('distributes missing days equally between two manual measurements', () => {
    const history: UsageHistoryMap = {
      '2026-04-05': 20,
      '2026-04-10': 40
    };

    expect(estimateConsumedPercentForDate('2026-04-08', history, cycle)).toBe(32);

    const cumulative = buildInterpolatedCumulativeHistory('2026-04-10', 40, history, cycle);

    expect(cumulative['2026-04-06']).toBe(24);
    expect(cumulative['2026-04-07']).toBe(28);
    expect(cumulative['2026-04-08']).toBe(32);
    expect(cumulative['2026-04-09']).toBe(36);
    expect(cumulative['2026-04-10']).toBe(40);

    const daily = buildDailyUsageFromCumulativeHistory('2026-04-10', cumulative, cycle);

    expect(daily['2026-04-06']).toBe(4);
    expect(daily['2026-04-07']).toBe(4);
    expect(daily['2026-04-08']).toBe(4);
    expect(daily['2026-04-09']).toBe(4);
  });

  it('respects manually edited intermediate day values', () => {
    const history: UsageHistoryMap = {
      '2026-04-05': 20,
      '2026-04-07': 32,
      '2026-04-10': 40
    };

    expect(estimateConsumedPercentForDate('2026-04-08', history, cycle)).toBeCloseTo(34.6666667, 6);

    const cumulative = buildInterpolatedCumulativeHistory('2026-04-10', 40, history, cycle);

    expect(cumulative['2026-04-07']).toBe(32);
    expect(cumulative['2026-04-08']).toBeCloseTo(34.6666667, 6);
    expect(cumulative['2026-04-09']).toBeCloseTo(37.3333333, 6);
  });

  it('keeps weekend estimates flat and excludes weekends from interpolation math', () => {
    const history: UsageHistoryMap = {
      '2026-04-02': 20,
      '2026-04-07': 40
    };

    expect(estimateConsumedPercentForDate('2026-04-04', history, cycle)).toBeCloseTo(26.6666667, 6);
    expect(estimateConsumedPercentForDate('2026-04-05', history, cycle)).toBeCloseTo(26.6666667, 6);
    expect(estimateConsumedPercentForDate('2026-04-06', history, cycle)).toBeCloseTo(33.3333333, 6);

    const cumulative = buildInterpolatedCumulativeHistory('2026-04-07', 40, history, cycle);

    expect(cumulative['2026-04-03']).toBeCloseTo(26.6666667, 6);
    expect(cumulative['2026-04-04']).toBeCloseTo(26.6666667, 6);
    expect(cumulative['2026-04-05']).toBeCloseTo(26.6666667, 6);
    expect(cumulative['2026-04-06']).toBeCloseTo(33.3333333, 6);
    expect(cumulative['2026-04-07']).toBe(40);

    const daily = buildDailyUsageFromCumulativeHistory('2026-04-07', cumulative, cycle);

    expect(daily['2026-04-03']).toBeCloseTo(6.6666667, 6);
    expect(daily['2026-04-04']).toBe(0);
    expect(daily['2026-04-05']).toBe(0);
    expect(daily['2026-04-06']).toBeCloseTo(6.6666667, 6);
  });

  it('does not keep day 1 at zero when the first usage input happens later in the cycle', () => {
    const history: UsageHistoryMap = {
      '2026-04-07': 35
    };

    expect(estimateConsumedPercentForDate('2026-04-01', history, cycle)).toBeCloseTo(7, 6);
    expect(estimateConsumedPercentForDate('2026-04-01', history, cycle)).toBeGreaterThan(0);
  });
});
