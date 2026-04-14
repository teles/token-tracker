import { calculateCurrentPace, normalizeConsumedPercent } from '@/domain/quota';
import {
  buildInterpolatedCumulativeHistory,
  estimateConsumedPercentForDate
} from '@/domain/usage-history';
import type {
  CycleInfo,
  ISODateString,
  PlanningMap,
  UsageChartModel,
  UsageChartPointModel,
  UsageHistoryMap
} from '@/types/token-tracker';
import { diffDays, eachDayInclusive, getDayOfMonth, isBefore, isSameDate } from '@/utils/date';

interface BuildUsageChartModelInput {
  cycle: CycleInfo;
  referenceDate: ISODateString;
  measurementDate: ISODateString;
  usageHistory: UsageHistoryMap;
  estimatedHistory?: UsageHistoryMap;
  planning: PlanningMap;
}

function roundToTenths(value: number): number {
  return Math.round(value * 10) / 10;
}

function isHistoricalDate(date: ISODateString, referenceDate: ISODateString): boolean {
  return !isBefore(referenceDate, date);
}

export function buildUsageChartModel(input: BuildUsageChartModelInput): UsageChartModel {
  const { cycle, referenceDate, measurementDate, usageHistory, planning } = input;
  const estimatedHistory = input.estimatedHistory ?? {};
  const effectiveHistory = { ...estimatedHistory, ...usageHistory };
  const consumedAtReference = normalizeConsumedPercent(
    estimateConsumedPercentForDate(referenceDate, effectiveHistory, cycle),
    cycle.quotaPercent
  );
  const elapsedDays = Math.max(1, diffDays(cycle.cycleStart, referenceDate) + 1);
  const currentPace = calculateCurrentPace(consumedAtReference, elapsedDays);

  const cumulativeHistorical = buildInterpolatedCumulativeHistory(
    referenceDate,
    consumedAtReference,
    effectiveHistory,
    cycle
  );

  const points: UsageChartPointModel[] = [];
  let projectedCumulative = consumedAtReference;

  for (const date of eachDayInclusive(cycle.cycleStart, cycle.resetDate)) {
    const historical = isHistoricalDate(date, referenceDate);
    const hasManualMeasurement = Number.isFinite(usageHistory[date]);

    let cumulativePercent = 0;

    if (historical) {
      cumulativePercent =
        cumulativeHistorical[date] ??
        points[points.length - 1]?.cumulativePercent ??
        0;
    } else {
      projectedCumulative = Math.min(cycle.quotaPercent, projectedCumulative + currentPace);
      cumulativePercent = projectedCumulative;
    }

    points.push({
      date,
      dayNumber: getDayOfMonth(date),
      cumulativePercent: roundToTenths(cumulativePercent),
      phase: historical ? 'historical' : 'projected',
      isToday: isSameDate(date, referenceDate),
      isMeasurementDay: isSameDate(date, measurementDate),
      hasManualMeasurement,
      planningState: historical ? 'off' : planning[date] ?? 'off'
    });
  }

  return { points };
}
