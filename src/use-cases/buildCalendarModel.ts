import { generatePastHeatmapIntensities } from '@/domain/heatmap';
import type {
  CalendarDayModel,
  CycleInfo,
  DayNotesMap,
  ISODateString,
  PlanningMap,
  UsageHistoryMap,
  UsageSnapshot
} from '@/types/token-tracker';
import {
  diffDays,
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
  measurementDate: ISODateString;
  cycle: CycleInfo;
  planning: PlanningMap;
  usageHistory: UsageHistoryMap;
  dayNotes?: DayNotesMap;
  today?: ISODateString;
}

function isCurrentMonth(
  date: ISODateString,
  monthStart: ISODateString,
  monthEnd: ISODateString
): boolean {
  return isBetweenInclusive(date, monthStart, monthEnd);
}

function isWeeklyCycle(cycle: CycleInfo): boolean {
  return diffDays(cycle.cycleStart, cycle.resetDate) <= 6;
}

export function buildCalendarModel(input: BuildCalendarModelInput): CalendarDayModel[] {
  const { snapshot, measurementDate, cycle, planning, usageHistory } = input;
  const dayNotes = input.dayNotes ?? {};
  const today = input.today ?? todayIsoDate();
  const weeklyCycle = isWeeklyCycle(cycle);

  const monthStart = weeklyCycle ? cycle.cycleStart : startOfMonth(snapshot.measurementDate);
  const monthEnd = weeklyCycle ? cycle.resetDate : endOfMonth(snapshot.measurementDate);

  const gridStart = weeklyCycle ? cycle.cycleStart : startOfWeekMonday(monthStart);
  const gridEnd = weeklyCycle ? cycle.resetDate : endOfWeekSunday(monthEnd);

  const pastIntensities = generatePastHeatmapIntensities(snapshot, cycle, usageHistory);

  return eachDayInclusive(gridStart, gridEnd).map((date) => {
    const inCurrentMonth = weeklyCycle ? true : isCurrentMonth(date, monthStart, monthEnd);
    const inCycle = isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate);

    const isPast = inCycle && isBefore(date, snapshot.measurementDate);
    const isFuture = inCycle && isBefore(snapshot.measurementDate, date);
    const hasManualMeasurement = Number.isFinite(usageHistory[date]);
    const hasEstimatedUsage = isPast && !hasManualMeasurement;

    return {
      date,
      dayNumber: getDayOfMonth(date),
      weekdayIndex: getWeekdayIndexMondayFirst(date),
      isCurrentMonth: inCurrentMonth,
      isInCycle: inCycle,
      isPast,
      isFuture,
      isToday: isSameDate(date, today),
      isMeasurementDay: isSameDate(date, measurementDate),
      hasNote: Boolean(dayNotes[date]),
      hasEstimatedUsage,
      pastIntensity: isPast ? pastIntensities[date] ?? 0 : 0,
      planningState: isFuture ? planning[date] ?? 'off' : 'off'
    };
  });
}
