import type {
  CycleInfo,
  ISODateString,
  UsageHistoryMap,
  UsageMeasurement
} from '@/types/token-tracker';
import { addDays, eachDayInclusive, isBetweenInclusive, isWeekend } from '@/utils/date';
import { clamp } from '@/utils/format';

function toClampedPercent(value: number, quotaPercent: number): number {
  return clamp(value, 0, quotaPercent);
}

function sortMeasurementsByDate(a: UsageMeasurement, b: UsageMeasurement): number {
  return a.date.localeCompare(b.date);
}

function normalizeMeasurement(
  date: ISODateString,
  consumedPercent: number,
  cycle: CycleInfo
): UsageMeasurement | null {
  if (!Number.isFinite(consumedPercent)) {
    return null;
  }

  if (!isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate)) {
    return null;
  }

  return {
    date,
    consumedPercent: toClampedPercent(consumedPercent, cycle.quotaPercent)
  };
}

function toSortedMeasurements(history: UsageHistoryMap, cycle: CycleInfo): UsageMeasurement[] {
  return Object.entries(history)
    .map(([date, consumedPercent]) =>
      normalizeMeasurement(date as ISODateString, Number(consumedPercent), cycle)
    )
    .filter((entry): entry is UsageMeasurement => entry !== null)
    .sort(sortMeasurementsByDate);
}

function ensureCycleStartAnchor(
  entries: UsageMeasurement[],
  cycle: CycleInfo
): UsageMeasurement[] {
  const baselineDate = addDays(cycle.cycleStart, -1);

  if (entries.length === 0 || entries[0].date !== baselineDate) {
    return [{ date: baselineDate, consumedPercent: 0 }, ...entries];
  }

  return entries;
}

function buildWeekendAwareInterpolation(
  previous: UsageMeasurement,
  next: UsageMeasurement,
  cycle: CycleInfo
): Record<ISODateString, number> {
  const datesBetween = eachDayInclusive(addDays(previous.date, 1), addDays(next.date, -1));
  const datesForDistribution = eachDayInclusive(addDays(previous.date, 1), next.date);

  if (datesBetween.length === 0) {
    return {};
  }

  const businessDays = datesForDistribution.filter((date) => !isWeekend(date));
  const interpolatedByDate: Record<ISODateString, number> = {};
  let latestValue = previous.consumedPercent;

  if (businessDays.length === 0) {
    for (const date of datesBetween) {
      interpolatedByDate[date] = toClampedPercent(latestValue, cycle.quotaPercent);
    }

    return interpolatedByDate;
  }

  const step = (next.consumedPercent - previous.consumedPercent) / businessDays.length;
  let businessOffset = 0;

  for (const date of datesBetween) {
    if (!isWeekend(date)) {
      businessOffset += 1;
      latestValue = previous.consumedPercent + step * businessOffset;
    }

    interpolatedByDate[date] = toClampedPercent(latestValue, cycle.quotaPercent);
  }

  return interpolatedByDate;
}

export function sanitizeUsageHistory(history: UsageHistoryMap, cycle: CycleInfo): UsageHistoryMap {
  const sanitized: UsageHistoryMap = {};

  for (const entry of toSortedMeasurements(history, cycle)) {
    sanitized[entry.date] = entry.consumedPercent;
  }

  return sanitized;
}

export function estimateConsumedPercentForDate(
  targetDate: ISODateString,
  history: UsageHistoryMap,
  cycle: CycleInfo
): number {
  const directValue = history[targetDate];

  if (Number.isFinite(directValue)) {
    return toClampedPercent(Number(directValue), cycle.quotaPercent);
  }

  const sorted = ensureCycleStartAnchor(toSortedMeasurements(history, cycle), cycle);

  if (sorted.length === 0) {
    return 0;
  }

  const previous = [...sorted].reverse().find((entry) => entry.date < targetDate) ?? null;
  const next = sorted.find((entry) => entry.date > targetDate) ?? null;

  if (!previous && !next) {
    return 0;
  }

  if (previous && !next) {
    return previous.consumedPercent;
  }

  if (!previous && next) {
    return 0;
  }

  if (!previous || !next) {
    return 0;
  }

  const interpolatedByDate = buildWeekendAwareInterpolation(previous, next, cycle);
  return interpolatedByDate[targetDate] ?? previous.consumedPercent;
}

export function buildInterpolatedCumulativeHistory(
  measurementDate: ISODateString,
  measurementConsumedPercent: number,
  history: UsageHistoryMap,
  cycle: CycleInfo
): Record<ISODateString, number> {
  const workingHistory: UsageHistoryMap = {
    ...sanitizeUsageHistory(history, cycle),
    [measurementDate]: toClampedPercent(measurementConsumedPercent, cycle.quotaPercent)
  };

  const cappedEntries = toSortedMeasurements(workingHistory, cycle).filter(
    (entry) => entry.date <= measurementDate
  );

  const entries = ensureCycleStartAnchor(cappedEntries, cycle);

  const cumulativeByDate: Record<ISODateString, number> = {};

  for (const [index, entry] of entries.entries()) {
    cumulativeByDate[entry.date] = entry.consumedPercent;

    const nextEntry = entries[index + 1];

    if (!nextEntry) {
      continue;
    }

    const interpolatedByDate = buildWeekendAwareInterpolation(entry, nextEntry, cycle);

    for (const [date, consumedPercent] of Object.entries(interpolatedByDate)) {
      cumulativeByDate[date as ISODateString] = consumedPercent;
    }
  }

  const lastEntry = entries[entries.length - 1];

  if (lastEntry && lastEntry.date < measurementDate) {
    for (const date of eachDayInclusive(addDays(lastEntry.date, 1), measurementDate)) {
      cumulativeByDate[date] = lastEntry.consumedPercent;
    }
  }

  return cumulativeByDate;
}

export function buildDailyUsageFromCumulativeHistory(
  measurementDate: ISODateString,
  cumulativeByDate: Record<ISODateString, number>,
  cycle: CycleInfo
): Record<ISODateString, number> {
  const pastEndDate = addDays(measurementDate, -1);

  if (pastEndDate < cycle.cycleStart) {
    return {};
  }

  const dailyUsageByDate: Record<ISODateString, number> = {};

  for (const date of eachDayInclusive(cycle.cycleStart, pastEndDate)) {
    const previousDate = addDays(date, -1);
    const previousCumulative = cumulativeByDate[previousDate] ?? 0;
    const currentCumulative = cumulativeByDate[date] ?? previousCumulative;

    dailyUsageByDate[date] = Math.max(0, currentCumulative - previousCumulative);
  }

  return dailyUsageByDate;
}

export function findNeighborMeasurements(
  targetDate: ISODateString,
  history: UsageHistoryMap,
  cycle: CycleInfo
): {
  previous: UsageMeasurement | null;
  next: UsageMeasurement | null;
} {
  const sorted = toSortedMeasurements(history, cycle)
    .filter((entry) => entry.date !== targetDate)
    .sort(sortMeasurementsByDate);

  const previous = [...sorted].reverse().find((entry) => entry.date < targetDate) ?? null;
  const next = sorted.find((entry) => entry.date > targetDate) ?? null;

  return { previous, next };
}

export function commitGapEstimates(
  newDate: ISODateString,
  newValue: number,
  usageHistory: UsageHistoryMap,
  estimatedHistory: UsageHistoryMap,
  cycle: CycleInfo
): UsageHistoryMap {
  const interpolated = buildInterpolatedCumulativeHistory(newDate, newValue, usageHistory, cycle);
  const newEstimates: UsageHistoryMap = {};

  for (const [dateStr, value] of Object.entries(interpolated)) {
    const date = dateStr as ISODateString;

    if (!isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate)) {
      continue;
    }

    if (date >= newDate) {
      continue;
    }

    if (Number.isFinite(usageHistory[date])) {
      continue;
    }

    if (Number.isFinite(estimatedHistory[date])) {
      continue;
    }

    newEstimates[date] = value;
  }

  return newEstimates;
}
