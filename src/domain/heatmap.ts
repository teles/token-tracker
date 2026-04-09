import type { CycleInfo, ISODateString, UsageHistoryMap, UsageSnapshot } from '@/types/token-tracker';
import {
  buildDailyUsageFromCumulativeHistory,
  buildInterpolatedCumulativeHistory
} from '@/domain/usage-history';

function toIntensityLevel(value: number, maxValue: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  const ratio = value / maxValue;
  return Math.min(4, Math.max(1, Math.ceil(ratio * 4))) as 0 | 1 | 2 | 3 | 4;
}

export function generatePastHeatmapIntensities(
  snapshot: UsageSnapshot,
  cycle: CycleInfo,
  usageHistory: UsageHistoryMap
): Record<ISODateString, 0 | 1 | 2 | 3 | 4> {
  const cumulativeByDate = buildInterpolatedCumulativeHistory(
    snapshot.measurementDate,
    snapshot.consumedPercent,
    usageHistory,
    cycle
  );

  const dailyUsageByDate = buildDailyUsageFromCumulativeHistory(
    snapshot.measurementDate,
    cumulativeByDate,
    cycle
  );

  const dailyValues = Object.values(dailyUsageByDate);
  const maxDailyUsage = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;

  const intensityByDate: Record<ISODateString, 0 | 1 | 2 | 3 | 4> = {};

  for (const [date, value] of Object.entries(dailyUsageByDate)) {
    intensityByDate[date as ISODateString] = toIntensityLevel(value, maxDailyUsage);
  }

  return intensityByDate;
}
