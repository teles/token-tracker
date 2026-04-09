import type { CycleInfo, PlanningMap, UsageHistoryMap, UsageSnapshot } from '@/types/token-tracker';
import {
  addDays,
  eachDayInclusive,
  endOfMonth,
  isWeekend,
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

export const initialUsageHistory: UsageHistoryMap = {
  [today]: 38
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
