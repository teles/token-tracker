import type { ISODateString } from '@/types/token-tracker';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toUtcDate(input: ISODateString | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }

  const [year, month, day] = input.split('-').map((value) => Number(value));
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): ISODateString {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}` as ISODateString;
}

export function parseIsoDate(isoDate: ISODateString): Date {
  return toUtcDate(isoDate);
}

export function todayIsoDate(): ISODateString {
  return formatIsoDate(new Date());
}

export function addDays(isoDate: ISODateString, days: number): ISODateString {
  const date = toUtcDate(isoDate);
  return formatIsoDate(new Date(date.getTime() + days * DAY_IN_MS));
}

export function diffDays(startDate: ISODateString, endDate: ISODateString): number {
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);
  return Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS);
}

export function isBefore(a: ISODateString, b: ISODateString): boolean {
  return diffDays(a, b) > 0;
}

export function isSameDate(a: ISODateString, b: ISODateString): boolean {
  return a === b;
}

export function isBetweenInclusive(date: ISODateString, startDate: ISODateString, endDate: ISODateString): boolean {
  return diffDays(startDate, date) >= 0 && diffDays(date, endDate) >= 0;
}

export function eachDayInclusive(startDate: ISODateString, endDate: ISODateString): ISODateString[] {
  const span = diffDays(startDate, endDate);

  if (span < 0) {
    return [];
  }

  return Array.from({ length: span + 1 }, (_, index) => addDays(startDate, index));
}

export function startOfMonth(isoDate: ISODateString): ISODateString {
  const parsed = parseIsoDate(isoDate);
  return formatIsoDate(new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)));
}

export function endOfMonth(isoDate: ISODateString): ISODateString {
  const parsed = parseIsoDate(isoDate);
  return formatIsoDate(new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0)));
}

export function startOfWeekMonday(isoDate: ISODateString): ISODateString {
  const parsed = parseIsoDate(isoDate);
  const weekday = parsed.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(isoDate, mondayOffset);
}

export function endOfWeekSunday(isoDate: ISODateString): ISODateString {
  const parsed = parseIsoDate(isoDate);
  const weekday = parsed.getUTCDay();
  const sundayOffset = weekday === 0 ? 0 : 7 - weekday;
  return addDays(isoDate, sundayOffset);
}

export function getWeekdayIndexMondayFirst(isoDate: ISODateString): number {
  const weekday = parseIsoDate(isoDate).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function isWeekend(isoDate: ISODateString): boolean {
  const weekday = parseIsoDate(isoDate).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function getDayOfMonth(isoDate: ISODateString): number {
  return parseIsoDate(isoDate).getUTCDate();
}

export function toMonthLabel(isoDate: ISODateString): string {
  const parsed = parseIsoDate(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(parsed);
}

export function toShortDateLabel(isoDate: ISODateString): string {
  const parsed = parseIsoDate(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(parsed);
}
