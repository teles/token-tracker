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

function calculateExpectedConsumedUntilPreviousDay(cycle: CycleInfo, referenceDate: ISODateString): number {
  const previousDay = addDays(referenceDate, -1);

  if (isBefore(previousDay, cycle.cycleStart)) {
    return 0;
  }

  const allCycleDays = eachDayInclusive(cycle.cycleStart, cycle.resetDate);
  const expectedUsageDays = allCycleDays.filter((date) => !isWeekend(date));

  if (expectedUsageDays.length === 0) {
    return 0;
  }

  const elapsedExpectedUsageDays = expectedUsageDays.filter((date) =>
    !isBefore(previousDay, date)
  ).length;

  const ratio = elapsedExpectedUsageDays / expectedUsageDays.length;
  return roundToSingleDecimal(ratio * cycle.quotaPercent);
}

export const initialUsageHistory: UsageHistoryMap = {
  [today]: calculateExpectedConsumedUntilPreviousDay(initialCycle, today)
};

export const initialSnapshot: UsageSnapshot = {
  measurementDate: today,
  consumedPercent: Number(initialUsageHistory[today] ?? 0)
};

function buildDefaultPlanning(snapshot: UsageSnapshot, cycle: CycleInfo): PlanningMap {
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

export const initialPlanning: PlanningMap = buildDefaultPlanning(initialSnapshot, initialCycle);
