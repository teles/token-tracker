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

    expect(estimateConsumedPercentForDate('2026-04-08', history, cycle)).toBe(35);

    const cumulative = buildInterpolatedCumulativeHistory('2026-04-10', 40, history, cycle);

    expect(cumulative['2026-04-06']).toBe(25);
    expect(cumulative['2026-04-07']).toBe(30);
    expect(cumulative['2026-04-08']).toBe(35);
    expect(cumulative['2026-04-09']).toBe(40);
    expect(cumulative['2026-04-10']).toBe(40);

    const daily = buildDailyUsageFromCumulativeHistory('2026-04-10', cumulative, cycle);

    expect(daily['2026-04-06']).toBe(5);
    expect(daily['2026-04-07']).toBe(5);
    expect(daily['2026-04-08']).toBe(5);
    expect(daily['2026-04-09']).toBe(5);
  });

  it('respects manually edited intermediate day values', () => {
    const history: UsageHistoryMap = {
      '2026-04-05': 20,
      '2026-04-07': 32,
      '2026-04-10': 40
    };

    expect(estimateConsumedPercentForDate('2026-04-08', history, cycle)).toBe(36);

    const cumulative = buildInterpolatedCumulativeHistory('2026-04-10', 40, history, cycle);

    expect(cumulative['2026-04-07']).toBe(32);
    expect(cumulative['2026-04-08']).toBe(36);
    expect(cumulative['2026-04-09']).toBe(40);
  });
});
