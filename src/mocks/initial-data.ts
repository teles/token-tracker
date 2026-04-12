import type { CycleInfo, ISODateString, PlanningMap, UsageHistoryMap, UsageSnapshot } from '@/types/token-tracker';
import {
  addDays,
  eachDayInclusive,
  endOfMonth,
  isWeekend,
  isBefore,
  startOfMonth,
  todayIsoDate
} from '@/utils/date';

const today = todayIsoDate();
const cycleStart = startOfMonth(today);
const resetDate = endOfMonth(today);

export const initialCycle: CycleInfo = {
  cycleStart,
  resetDate,
  quotaPercent: 100
};

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateExpectedConsumedUntilCurrentDay(
  cycle: CycleInfo,
  referenceDate: ISODateString
): number {
  if (isBefore(referenceDate, cycle.cycleStart)) {
    return 0;
  }

  const allCycleDays = eachDayInclusive(cycle.cycleStart, cycle.resetDate);
  const expectedUsageDays = allCycleDays.filter((date) => !isWeekend(date));

  if (expectedUsageDays.length === 0) {
    return 0;
  }

  const elapsedExpectedUsageDays = expectedUsageDays.filter((date) =>
    !isBefore(referenceDate, date)
  ).length;

  const ratio = elapsedExpectedUsageDays / expectedUsageDays.length;
  return roundToSingleDecimal(ratio * cycle.quotaPercent);
}

export const initialUsageHistory: UsageHistoryMap = {
  [today]: calculateExpectedConsumedUntilCurrentDay(initialCycle, today)
};

export const initialSnapshot: UsageSnapshot = {
  measurementDate: today,
  consumedPercent: Number(initialUsageHistory[today] ?? 0)
};

export function buildDefaultPlanning(snapshot: UsageSnapshot, cycle: CycleInfo): PlanningMap {
  const planning: PlanningMap = {};
  const futureDates = eachDayInclusive(addDays(snapshot.measurementDate, 1), cycle.resetDate);

  for (const date of futureDates) {
    if (isWeekend(date)) {
      continue;
    }

    planning[date] = 'on';
  }

  return planning;
}

export function buildDefaultCycleState(cycle: CycleInfo, referenceDate: ISODateString): {
  snapshot: UsageSnapshot;
  usageHistory: UsageHistoryMap;
  planning: PlanningMap;
} {
  const usageHistory: UsageHistoryMap = {
    [referenceDate]: calculateExpectedConsumedUntilCurrentDay(cycle, referenceDate)
  };
  const snapshot: UsageSnapshot = {
    measurementDate: referenceDate,
    consumedPercent: Number(usageHistory[referenceDate] ?? 0)
  };

  return {
    snapshot,
    usageHistory,
    planning: buildDefaultPlanning(snapshot, cycle)
  };
}

export const initialPlanning: PlanningMap = buildDefaultPlanning(initialSnapshot, initialCycle);
