import { generatePastHeatmapIntensities } from '@/domain/heatmap';
import type {
  CalendarDayModel,
  CycleInfo,
  ISODateString,
  PlanningMap,
  UsageHistoryMap,
  UsageSnapshot
} from '@/types/token-tracker';
import {
  eachDayInclusive,
  endOfMonth,
  endOfWeekSunday,
  getDayOfMonth,
  getWeekdayIndexMondayFirst,
  isBetweenInclusive,
  isBefore,
  isSameDate,
  startOfMonth,
  startOfWeekMonday,
  todayIsoDate
} from '@/utils/date';

interface BuildCalendarModelInput {
  snapshot: UsageSnapshot;
  cycle: CycleInfo;
  planning: PlanningMap;
  usageHistory: UsageHistoryMap;
  today?: ISODateString;
}

function isCurrentMonth(
  date: ISODateString,
  monthStart: ISODateString,
  monthEnd: ISODateString
): boolean {
  return isBetweenInclusive(date, monthStart, monthEnd);
}

export function buildCalendarModel(input: BuildCalendarModelInput): CalendarDayModel[] {
  const { snapshot, cycle, planning, usageHistory } = input;
  const today = input.today ?? todayIsoDate();

  const monthStart = startOfMonth(snapshot.measurementDate);
  const monthEnd = endOfMonth(snapshot.measurementDate);

  const gridStart = startOfWeekMonday(monthStart);
  const gridEnd = endOfWeekSunday(monthEnd);

  const pastIntensities = generatePastHeatmapIntensities(snapshot, cycle, usageHistory);

  return eachDayInclusive(gridStart, gridEnd).map((date) => {
    const inCurrentMonth = isCurrentMonth(date, monthStart, monthEnd);
    const inCycle = isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate);

    const isPast = inCycle && isBefore(date, snapshot.measurementDate);
    const isFuture = inCycle && isBefore(snapshot.measurementDate, date);

    return {
      date,
      dayNumber: getDayOfMonth(date),
      weekdayIndex: getWeekdayIndexMondayFirst(date),
      isCurrentMonth: inCurrentMonth,
      isInCycle: inCycle,
      isPast,
      isFuture,
      isToday: isSameDate(date, today),
      isMeasurementDay: isSameDate(date, snapshot.measurementDate),
      pastIntensity: isPast ? pastIntensities[date] ?? 0 : 0,
      planningState: isFuture ? planning[date] ?? 'off' : 'off'
    };
  });
}
